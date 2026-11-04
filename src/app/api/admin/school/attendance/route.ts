import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Attendance from "@/models/Attendance";
import StudentProfile from "@/models/StudentProfile";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.schoolId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await connectToDatabase();

    // Handling for Student and Parent personal attendance records
    if (session.role === "STUDENT" || session.role === "PARENT") {
      let student = null;
      if (session.role === "STUDENT") {
        student = await StudentProfile.findOne({ schoolId: session.schoolId, userId: session.id })
          .populate("userId", "name")
          .populate("classId", "name")
          .lean();
      } else {
        student = await StudentProfile.findOne({ schoolId: session.schoolId, guardianId: session.id })
          .populate("userId", "name")
          .populate("classId", "name")
          .lean();
      }

      if (!student) {
        return NextResponse.json({
          success: true,
          isPersonalView: true,
          student: null,
          totalDays: 0,
          presentDays: 0,
          absentDays: 0,
          lateDays: 0,
          rate: 0,
          records: [],
        });
      }

      // Query all attendance sheets in this school and student's class
      const sheets = await Attendance.find({
        schoolId: session.schoolId,
        classId: student.classId,
        sectionName: student.sectionName,
      })
        .sort({ date: -1 })
        .limit(60)
        .lean();

      let presentDays = 0;
      let absentDays = 0;
      let lateDays = 0;
      const history = [];

      for (const sheet of sheets) {
        const myRecord = sheet.records.find(
          (r) => r.studentId.toString() === student._id.toString()
        );
        if (myRecord) {
          if (myRecord.status === "PRESENT") presentDays++;
          else if (myRecord.status === "ABSENT") absentDays++;
          else if (myRecord.status === "LATE") lateDays++;

          history.push({
            date: sheet.date,
            status: myRecord.status,
            remarks: myRecord.remarks || "",
          });
        }
      }

      const totalDays = presentDays + absentDays + lateDays;
      const rate = totalDays > 0 ? Number(((presentDays / totalDays) * 100).toFixed(1)) : 0;

      const userObj = student.userId as unknown as { name?: string };
      const classObj = student.classId as unknown as { name?: string };

      return NextResponse.json({
        success: true,
        isPersonalView: true,
        student: {
          name: userObj?.name || "Student",
          className: classObj?.name || "Class",
          sectionName: student.sectionName,
          rollNumber: student.rollNumber,
        },
        totalDays,
        presentDays,
        absentDays,
        lateDays,
        rate,
        records: history,
      });
    }

    // Institution Admin & Teacher Class Roster View
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");
    const sectionName = searchParams.get("sectionName") || "A";
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

    if (!classId) {
      return NextResponse.json({ error: "classId is required" }, { status: 400 });
    }

    // 1. Fetch all active students in this class & section
    const students = await StudentProfile.find({
      schoolId: session.schoolId,
      classId,
      sectionName,
      status: "ACTIVE",
    })
      .populate("userId", "name email")
      .sort({ rollNumber: 1 })
      .lean();

    // 2. Fetch existing attendance sheet if already marked
    const attendanceDoc = await Attendance.findOne({
      schoolId: session.schoolId,
      classId,
      sectionName,
      date,
    }).lean();

    const recordMap = new Map(
      attendanceDoc?.records.map((r) => [r.studentId.toString(), r]) || []
    );

    // Merge student roster with attendance status
    const studentRecords = students.map((s) => {
      const existing = recordMap.get(s._id.toString());
      const populatedUser = s.userId as unknown as { name?: string };
      return {
        studentId: s._id,
        name: populatedUser?.name || "Student",
        rollNumber: s.rollNumber,
        admissionNumber: s.admissionNumber,
        status: existing ? existing.status : "PRESENT",
        remarks: existing?.remarks || "",
      };
    });

    return NextResponse.json({
      success: true,
      isPersonalView: false,
      date,
      classId,
      sectionName,
      isMarked: !!attendanceDoc,
      students: studentRecords,
    });
  } catch (error: unknown) {
    console.error("Fetch attendance error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch attendance";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (
      !session ||
      !session.schoolId ||
      (session.role !== "INSTITUTION_ADMIN" && session.role !== "TEACHER")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { classId, sectionName, date, records } = body;

    if (!classId || !sectionName || !date || !Array.isArray(records)) {
      return NextResponse.json(
        { error: "classId, sectionName, date, and student records are required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const updated = await Attendance.findOneAndUpdate(
      {
        schoolId: session.schoolId,
        classId,
        sectionName,
        date,
      },
      {
        schoolId: session.schoolId,
        classId,
        sectionName,
        date,
        takenBy: session.id,
        records: records.map((r: { studentId: string; status: string; remarks?: string }) => ({
          studentId: r.studentId,
          status: r.status,
          remarks: r.remarks || "",
        })),
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      message: "Attendance sheet submitted successfully",
      attendance: updated,
    });
  } catch (error: unknown) {
    console.error("Save attendance error:", error);
    const message = error instanceof Error ? error.message : "Failed to record attendance";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
