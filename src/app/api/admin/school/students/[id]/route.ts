import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import StudentProfile from "@/models/StudentProfile";
import { getSession } from "@/lib/auth";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.schoolId || session.role !== "INSTITUTION_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    await connectToDatabase();

    const studentProfile = await StudentProfile.findOne({
      _id: id,
      schoolId: session.schoolId,
    });

    if (!studentProfile) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Delete student user account and profile
    if (studentProfile.userId) {
      await User.findByIdAndDelete(studentProfile.userId);
    }
    await StudentProfile.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: "Student record deleted successfully" });
  } catch (error: unknown) {
    console.error("Delete student error:", error);
    const message = error instanceof Error ? error.message : "Failed to delete student";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
