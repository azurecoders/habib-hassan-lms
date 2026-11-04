import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Subject from "@/models/Subject";
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

    const subject = await Subject.findOneAndDelete({
      _id: id,
      schoolId: session.schoolId,
    });

    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Subject deleted successfully" });
  } catch (error: unknown) {
    console.error("Delete subject error:", error);
    const message = error instanceof Error ? error.message : "Failed to delete subject";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
