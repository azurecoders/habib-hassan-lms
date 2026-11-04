import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import SchoolClass from "@/models/SchoolClass";
import Subject from "@/models/Subject";
import { getSession } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.schoolId || session.role !== "INSTITUTION_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, sections, order } = body;

    await connectToDatabase();

    const schoolClass = await SchoolClass.findOne({
      _id: id,
      schoolId: session.schoolId,
    });

    if (!schoolClass) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    if (name) schoolClass.name = name.trim();
    if (order !== undefined) schoolClass.order = Number(order);
    if (sections) schoolClass.sections = sections;

    await schoolClass.save();

    return NextResponse.json({ success: true, class: schoolClass });
  } catch (error: unknown) {
    console.error("Update class error:", error);
    const message = error instanceof Error ? error.message : "Failed to update class";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

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

    const schoolClass = await SchoolClass.findOne({
      _id: id,
      schoolId: session.schoolId,
    });

    if (!schoolClass) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Cascade delete subjects belonging to this class
    await Subject.deleteMany({ classId: id, schoolId: session.schoolId });
    await SchoolClass.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Class and its subjects deleted successfully",
    });
  } catch (error: unknown) {
    console.error("Delete class error:", error);
    const message = error instanceof Error ? error.message : "Failed to delete class";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
