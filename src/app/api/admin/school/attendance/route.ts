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

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");
    const sectionName = searchParams.get("sectionName") || "A";
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

    if (!classId) {
      return NextResponse.json({ error: "classId is required" }, { status: 400 });
    }

    await connectToDatabase();

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
      date,
      isMarked: !!attendanceDoc,
      records: studentRecords,
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
    if (!session || !session.schoolId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Role check: Only institution admin or teacher can submit attendance
    if (!["INSTITUTION_ADMIN", "TEACHER"].includes(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { classId, sectionName, date, records } = body;

    if (!classId || !sectionName || !date || !records) {
      return NextResponse.json(
        { error: "classId, sectionName, date, and records are required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const formattedRecords = records.map((r: { studentId: string; status: string; remarks?: string }) => ({
      studentId: r.studentId,
      status: r.status || "PRESENT",
      remarks: r.remarks || "",
    }));

    const attendance = await Attendance.findOneAndUpdate(
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
        markedBy: session.id,
        records: formattedRecords,
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      message: "Attendance recorded successfully",
      attendance,
    });
  } catch (error: unknown) {
    console.error("Save attendance error:", error);
    const message = error instanceof Error ? error.message : "Failed to save attendance";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
