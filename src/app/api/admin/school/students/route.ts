import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import StudentProfile from "@/models/StudentProfile";
import { getSession, hashPassword } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.schoolId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");
    const sectionName = searchParams.get("sectionName");

    await connectToDatabase();

    const query: Record<string, unknown> = { schoolId: session.schoolId };
    if (classId) query.classId = classId;
    if (sectionName) query.sectionName = sectionName;

    const students = await StudentProfile.find(query)
      .populate("userId", "name email phone avatar isActive")
      .populate("classId", "name")
      .populate("guardianId", "name email phone")
      .sort({ rollNumber: 1 })
      .lean();

    return NextResponse.json({ success: true, students });
  } catch (error: unknown) {
    console.error("Fetch students error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch students";
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
      admissionNumber,
      rollNumber,
      classId,
      sectionName,
      dob,
      gender,
      bloodGroup,
      address,
      guardianName,
      guardianEmail,
      guardianPhone,
    } = body;

    if (!name || !email || !admissionNumber || !rollNumber || !classId || !sectionName) {
      return NextResponse.json(
        { error: "Student Name, Email, Admission #, Roll #, Class, and Section are required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check student email uniqueness
    const existingStudentUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingStudentUser) {
      return NextResponse.json(
        { error: `A user with email '${email}' already exists in the system` },
        { status: 400 }
      );
    }

    // Check admission number uniqueness
    const existingAdmission = await StudentProfile.findOne({
      schoolId: session.schoolId,
      admissionNumber: admissionNumber.toUpperCase().trim(),
    });
    if (existingAdmission) {
      return NextResponse.json(
        { error: `Admission number '${admissionNumber}' is already allocated` },
        { status: 400 }
      );
    }

    // 1. Process Guardian / Parent Account
    let guardianUser = null;
    if (guardianEmail) {
      const cleanGuardianEmail = guardianEmail.toLowerCase().trim();
      guardianUser = await User.findOne({ email: cleanGuardianEmail });

      if (!guardianUser) {
        const guardianPassHash = await hashPassword("password123");
        guardianUser = await User.create({
          schoolId: session.schoolId,
          name: guardianName || "Parent / Guardian",
          email: cleanGuardianEmail,
          password: guardianPassHash,
          role: "PARENT",
          phone: guardianPhone || "",
          isActive: true,
        });
      }
    }

    // 2. Create Student User Account
    const studentPassHash = await hashPassword(password || "password123");
    const studentUser = await User.create({
      schoolId: session.schoolId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: studentPassHash,
      role: "STUDENT",
      isActive: true,
    });

    // 3. Create Student Profile
    const profile = await StudentProfile.create({
      schoolId: session.schoolId,
      userId: studentUser._id,
      admissionNumber: admissionNumber.toUpperCase().trim(),
      rollNumber: rollNumber.trim(),
      classId,
      sectionName: sectionName.trim(),
      guardianId: guardianUser ? guardianUser._id : null,
      guardianName: guardianName || "",
      guardianEmail: guardianEmail || "",
      guardianPhone: guardianPhone || "",
      dob: dob ? new Date(dob) : undefined,
      gender: gender || "MALE",
      bloodGroup: bloodGroup || "",
      address: address || "",
      status: "ACTIVE",
    });

    return NextResponse.json({
      success: true,
      message: "Student admitted and accounts provisioned successfully",
      student: profile,
    });
  } catch (error: unknown) {
    console.error("Admit student error:", error);
    const message = error instanceof Error ? error.message : "Failed to admit student";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
