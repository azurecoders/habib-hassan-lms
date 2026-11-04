import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import StaffProfile from "@/models/StaffProfile";
import StaffAttendance from "@/models/StaffAttendance";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.schoolId || session.role !== "INSTITUTION_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

    await connectToDatabase();

    const staffMembers = await StaffProfile.find({
      schoolId: session.schoolId,
      status: "ACTIVE",
    })
      .populate("userId", "name email phone")
      .sort({ employeeId: 1 })
      .lean();

    const attendanceDoc = await StaffAttendance.findOne({
      schoolId: session.schoolId,
      date,
    }).lean();

    const recordMap = new Map(
      attendanceDoc?.records.map((r) => [r.staffId.toString(), r]) || []
    );

    const records = staffMembers.map((s) => {
      const existing = recordMap.get(s._id.toString());
      const populatedUser = s.userId as unknown as { name?: string; email?: string };
      return {
        staffId: s._id,
        name: populatedUser?.name || "Faculty Member",
        email: populatedUser?.email || "",
        employeeId: s.employeeId,
        designation: s.designation,
        department: s.department,
        status: existing ? existing.status : "PRESENT",
        remarks: existing?.remarks || "",
      };
    });

    return NextResponse.json({
      success: true,
      date,
      isMarked: !!attendanceDoc,
      records,
    });
  } catch (error: unknown) {
    console.error("Fetch staff attendance error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch staff attendance";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.schoolId || session.role !== "INSTITUTION_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { date, records } = body;

    if (!date || !records) {
      return NextResponse.json({ error: "Date and records are required" }, { status: 400 });
    }

    await connectToDatabase();

    const formattedRecords = records.map((r: { staffId: string; status: string; remarks?: string }) => ({
      staffId: r.staffId,
      status: r.status || "PRESENT",
      remarks: r.remarks || "",
    }));

    const attendance = await StaffAttendance.findOneAndUpdate(
      {
        schoolId: session.schoolId,
        date,
      },
      {
        schoolId: session.schoolId,
        date,
        markedBy: session.id,
        records: formattedRecords,
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      message: "Staff attendance recorded successfully",
      attendance,
    });
  } catch (error: unknown) {
    console.error("Save staff attendance error:", error);
    const message = error instanceof Error ? error.message : "Failed to save staff attendance";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
