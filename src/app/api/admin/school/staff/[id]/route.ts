import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import StaffProfile from "@/models/StaffProfile";
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

    const staff = await StaffProfile.findOne({
      _id: id,
      schoolId: session.schoolId,
    });

    if (!staff) {
      return NextResponse.json({ error: "Staff record not found" }, { status: 404 });
    }

    if (staff.userId) {
      await User.findByIdAndDelete(staff.userId);
    }
    await StaffProfile.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: "Staff record deleted successfully" });
  } catch (error: unknown) {
    console.error("Delete staff error:", error);
    const message = error instanceof Error ? error.message : "Failed to delete staff";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
