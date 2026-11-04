import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import StaffProfile from "@/models/StaffProfile";
import { getSession, hashPassword } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.schoolId || session.role !== "INSTITUTION_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await connectToDatabase();

    const staff = await StaffProfile.find({ schoolId: session.schoolId })
      .populate("userId", "name email phone avatar isActive")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, staff });
  } catch (error: unknown) {
    console.error("Fetch staff error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch staff";
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
    const {
      name,
      email,
      password,
      employeeId,
      designation,
      department,
      qualification,
      salary,
      phone,
    } = body;

    if (!name || !email || !employeeId || !designation) {
      return NextResponse.json(
        { error: "Name, Email, Employee ID, and Designation are required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return NextResponse.json(
        { error: `User with email '${email}' already exists` },
        { status: 400 }
      );
    }

    const existingEmployee = await StaffProfile.findOne({
      schoolId: session.schoolId,
      employeeId: employeeId.toUpperCase().trim(),
    });
    if (existingEmployee) {
      return NextResponse.json(
        { error: `Employee ID '${employeeId}' is already in use` },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password || "password123");
    const user = await User.create({
      schoolId: session.schoolId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: "TEACHER",
      phone: phone || "",
      isActive: true,
    });

    const staff = await StaffProfile.create({
      schoolId: session.schoolId,
      userId: user._id,
      employeeId: employeeId.toUpperCase().trim(),
      designation: designation.trim(),
      department: department || "General",
      qualification: qualification || "",
      salary: Number(salary) || 0,
      status: "ACTIVE",
    });

    return NextResponse.json({
      success: true,
      message: "Faculty member onboarded successfully",
      staff,
    });
  } catch (error: unknown) {
    console.error("Create staff error:", error);
    const message = error instanceof Error ? error.message : "Failed to onboard staff";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
