import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import StaffProfile from "@/models/StaffProfile";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.schoolId || session.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await connectToDatabase();

    const staff = await StaffProfile.findOne({
      schoolId: session.schoolId,
      userId: session.id,
    })
      .populate("assignedClasses.classId", "name sections")
      .populate("assignedClasses.subjectId", "name code totalMarks passMarks")
      .lean();

    if (!staff) {
      return NextResponse.json({
        success: true,
        staff: null,
        allocations: [],
      });
    }

    return NextResponse.json({
      success: true,
      staff: {
        employeeId: staff.employeeId,
        designation: staff.designation,
        department: staff.department,
      },
      allocations: staff.assignedClasses || [],
    });
  } catch (error: unknown) {
    console.error("Fetch teacher allocations error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch allocations";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
