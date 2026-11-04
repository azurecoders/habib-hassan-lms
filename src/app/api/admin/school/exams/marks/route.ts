import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import ExamResult from "@/models/ExamResult";
import StudentProfile from "@/models/StudentProfile";
import Subject from "@/models/Subject";
import { getSession } from "@/lib/auth";

function calculateGrade(obtained: number, total: number): string {
  if (total <= 0) return "F";
  const percentage = (obtained / total) * 100;
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B";
  if (percentage >= 60) return "C";
  if (percentage >= 50) return "D";
  return "F";
}

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.schoolId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const examId = searchParams.get("examId");
    const classId = searchParams.get("classId");
    const sectionName = searchParams.get("sectionName") || "A";
    const subjectId = searchParams.get("subjectId");

    if (!examId || !classId || !subjectId) {
      return NextResponse.json(
        { error: "examId, classId, and subjectId are required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const [subject, students, existingResult] = await Promise.all([
      Subject.findById(subjectId).lean(),
      StudentProfile.find({
        schoolId: session.schoolId,
        classId,
        sectionName,
        status: "ACTIVE",
      })
        .populate("userId", "name email")
        .sort({ rollNumber: 1 })
        .lean(),
      ExamResult.findOne({
        schoolId: session.schoolId,
        examId,
        classId,
        sectionName,
        subjectId,
      }).lean(),
    ]);

    const defaultTotal = subject ? subject.totalMarks : 100;
    const marksMap = new Map(
      existingResult?.marks.map((m) => [m.studentId.toString(), m]) || []
    );

    const roster = students.map((s) => {
      const existing = marksMap.get(s._id.toString());
      const populatedUser = s.userId as unknown as { name?: string };
      const obtained = existing ? existing.obtainedMarks : 0;
      const total = existing ? existing.totalMarks : defaultTotal;

      return {
        studentId: s._id,
        name: populatedUser?.name || "Student",
        rollNumber: s.rollNumber,
        admissionNumber: s.admissionNumber,
        obtainedMarks: obtained,
        totalMarks: total,
        grade: existing ? existing.grade : calculateGrade(obtained, total),
        remarks: existing?.remarks || "",
      };
    });

    return NextResponse.json({
      success: true,
      subjectName: subject?.name || "Subject",
      passMarks: subject?.passMarks || 40,
      totalMarks: defaultTotal,
      isEntered: !!existingResult,
      roster,
    });
  } catch (error: unknown) {
    console.error("Fetch marks error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch marks";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.schoolId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (!["INSTITUTION_ADMIN", "TEACHER"].includes(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { examId, classId, sectionName, subjectId, marks } = body;

    if (!examId || !classId || !sectionName || !subjectId || !marks) {
      return NextResponse.json(
        { error: "examId, classId, sectionName, subjectId, and marks are required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const formattedMarks = marks.map(
      (m: { studentId: string; obtainedMarks: number; totalMarks: number; remarks?: string }) => {
        const obtained = Number(m.obtainedMarks || 0);
        const total = Number(m.totalMarks || 100);
        return {
          studentId: m.studentId,
          obtainedMarks: obtained,
          totalMarks: total,
          grade: calculateGrade(obtained, total),
          remarks: m.remarks || "",
        };
      }
    );

    const result = await ExamResult.findOneAndUpdate(
      {
        schoolId: session.schoolId,
        examId,
        classId,
        sectionName,
        subjectId,
      },
      {
        schoolId: session.schoolId,
        examId,
        classId,
        sectionName,
        subjectId,
        enteredBy: session.id,
        marks: formattedMarks,
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      message: "Marksheet submitted successfully",
      result,
    });
  } catch (error: unknown) {
    console.error("Save marks error:", error);
    const message = error instanceof Error ? error.message : "Failed to save marks";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
