import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import School from "@/models/School";
import User from "@/models/User";
import { getSession } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status, plan, currency, name, contactEmail, phone, address } = body;

    await connectToDatabase();

    const school = await School.findById(id);
    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    if (status && ["ACTIVE", "SUSPENDED", "TRIAL"].includes(status)) {
      school.status = status;
    }
    if (plan && ["FREE", "BASIC", "PRO"].includes(plan)) {
      school.plan = plan;
    }
    if (currency) school.currency = currency.toUpperCase();
    if (name) school.name = name.trim();
    if (contactEmail) school.contactEmail = contactEmail.trim().toLowerCase();
    if (phone !== undefined) school.phone = phone;
    if (address !== undefined) school.address = address;

    await school.save();

    return NextResponse.json({ success: true, school });
  } catch (error: unknown) {
    console.error("Update school error:", error);
    const message = error instanceof Error ? error.message : "Failed to update school";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    await connectToDatabase();

    const school = await School.findById(id);
    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    // Delete associated users for this school
    await User.deleteMany({ schoolId: school._id });
    // Delete school
    await School.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "School and affiliated users deleted successfully",
    });
  } catch (error: unknown) {
    console.error("Delete school error:", error);
    const message = error instanceof Error ? error.message : "Failed to delete school";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
