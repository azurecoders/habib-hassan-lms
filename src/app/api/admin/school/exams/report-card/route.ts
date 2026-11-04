import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Exam from "@/models/Exam";
import ExamResult from "@/models/ExamResult";
import StudentProfile from "@/models/StudentProfile";
import School from "@/models/School";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.schoolId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    let studentId = searchParams.get("studentId");
    let examId = searchParams.get("examId");

    await connectToDatabase();

    if (!studentId) {
      if (session.role === "STUDENT") {
        const sp = await StudentProfile.findOne({ userId: session.id }).lean();
        if (sp) studentId = sp._id.toString();
      } else if (session.role === "PARENT") {
        const sp = await StudentProfile.findOne({ guardianId: session.id }).lean();
        if (sp) studentId = sp._id.toString();
      }
    }

    const allExams = await Exam.find({ schoolId: session.schoolId }).sort({ startDate: -1 }).lean();

    if (!examId && allExams.length > 0) {
      examId = allExams[0]._id.toString();
    }

    if (!studentId || !examId) {
      return NextResponse.json({
        success: true,
        reportCard: null,
        exams: allExams.map((e) => ({ _id: e._id.toString(), title: e.title, term: e.term })),
        message: "No exam or student profile found yet",
      });
    }

    const [student, exam, school] = await Promise.all([
      StudentProfile.findById(studentId)
        .populate("userId", "name email phone")
        .populate("classId", "name")
        .lean(),
      Exam.findById(examId).lean(),
      School.findById(session.schoolId).lean(),
    ]);

    if (!student || !exam) {
      return NextResponse.json({ error: "Student or Exam not found" }, { status: 404 });
    }

    // Find all results for this exam & student's class
    const results = await ExamResult.find({
      schoolId: session.schoolId,
      examId,
      classId: student.classId,
      sectionName: student.sectionName,
    })
      .populate("subjectId", "name code passMarks totalMarks")
      .lean();

    const subjectRows = [];
    let grandTotal = 0;
    let grandObtained = 0;
    let hasFailedAny = false;

    for (const r of results) {
      const subject = r.subjectId as unknown as {
        name: string;
        code: string;
        passMarks: number;
        totalMarks: number;
      };
      if (!subject) continue;

      const studentMark = r.marks.find((m) => m.studentId.toString() === studentId);
      const obtained = studentMark ? studentMark.obtainedMarks : 0;
      const total = studentMark ? studentMark.totalMarks : subject.totalMarks || 100;
      const passMarks = subject.passMarks || 40;

      if (obtained < passMarks) hasFailedAny = true;

      grandTotal += total;
      grandObtained += obtained;

      subjectRows.push({
        subjectName: subject.name,
        subjectCode: subject.code,
        passMarks,
        totalMarks: total,
        obtainedMarks: obtained,
        grade: studentMark ? studentMark.grade : "F",
        remarks: studentMark?.remarks || (obtained >= passMarks ? "Pass" : "Fail"),
      });
    }

    const percentage = grandTotal > 0 ? (grandObtained / grandTotal) * 100 : 0;

    let overallGrade = "F";
    if (percentage >= 90) overallGrade = "A+";
    else if (percentage >= 80) overallGrade = "A";
    else if (percentage >= 70) overallGrade = "B";
    else if (percentage >= 60) overallGrade = "C";
    else if (percentage >= 50) overallGrade = "D";

    const studentUser = student.userId as unknown as { name?: string; email?: string };
    const classObj = student.classId as unknown as { name?: string };

    return NextResponse.json({
      success: true,
      exams: allExams.map((e) => ({ _id: e._id.toString(), title: e.title, term: e.term })),
      reportCard: {
        schoolName: school?.name || "Academic Institution",
        schoolContact: school?.contactEmail || "",
        studentName: studentUser?.name || "Student",
        admissionNumber: student.admissionNumber,
        rollNumber: student.rollNumber,
        className: classObj?.name || "Class",
        sectionName: student.sectionName,
        examTitle: exam.title,
        term: exam.term,
        subjects: subjectRows,
        grandTotal,
        grandObtained,
        percentage: Number(percentage.toFixed(2)),
        overallGrade,
        status: hasFailedAny ? "FAIL" : grandTotal > 0 ? "PASS" : "PENDING",
      },
    });
  } catch (error: unknown) {
    console.error("Generate report card error:", error);
    const message = error instanceof Error ? error.message : "Failed to compile report card";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
