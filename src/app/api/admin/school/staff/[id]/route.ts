import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import StaffProfile from "@/models/StaffProfile";
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
    await connectToDatabase();

    const staff = await StaffProfile.findOne({
      _id: id,
      schoolId: session.schoolId,
    });

    if (!staff) {
      return NextResponse.json({ error: "Staff record not found" }, { status: 404 });
    }

    // Action 1: Assign a new class and subject
    if (body.action === "ASSIGN_CLASS") {
      const { classId, sectionName, subjectId } = body;
      if (!classId || !sectionName || !subjectId) {
        return NextResponse.json(
          { error: "Class, Section, and Subject are required for allocation" },
          { status: 400 }
        );
      }

      // Check if already assigned
      const alreadyAssigned = staff.assignedClasses.some(
        (a) =>
          a.classId.toString() === classId &&
          a.sectionName === sectionName &&
          a.subjectId.toString() === subjectId
      );

      if (alreadyAssigned) {
        return NextResponse.json(
          { error: "This teacher is already assigned to this class and subject" },
          { status: 400 }
        );
      }

      staff.assignedClasses.push({
        classId,
        sectionName,
        subjectId,
      });

      await staff.save();
    }
    // Action 2: Remove an assignment
    else if (body.action === "UNASSIGN_CLASS") {
      const { assignmentId } = body;
      if (!assignmentId) {
        return NextResponse.json({ error: "assignmentId is required" }, { status: 400 });
      }

      staff.assignedClasses = staff.assignedClasses.filter(
        (a) => a._id?.toString() !== assignmentId
      );
      await staff.save();
    }
    // Action 3: General profile update
    else {
      if (body.designation) staff.designation = body.designation.trim();
      if (body.department) staff.department = body.department.trim();
      if (body.qualification) staff.qualification = body.qualification.trim();
      if (body.salary !== undefined) staff.salary = Number(body.salary);
      if (body.status) staff.status = body.status;
      if (body.avatarUrl !== undefined) staff.avatarUrl = body.avatarUrl;

      if (body.name || body.phone) {
        await User.findByIdAndUpdate(staff.userId, {
          ...(body.name && { name: body.name.trim() }),
          ...(body.phone && { phone: body.phone.trim() }),
        });
      }

      await staff.save();
    }

    const updated = await StaffProfile.findById(id)
      .populate("userId", "name email phone avatar isActive")
      .populate("assignedClasses.classId", "name")
      .populate("assignedClasses.subjectId", "name code")
      .lean();

    return NextResponse.json({ success: true, staff: updated });
  } catch (error: unknown) {
    console.error("Update staff error:", error);
    const message = error instanceof Error ? error.message : "Failed to update staff";
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
