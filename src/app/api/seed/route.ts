import { NextResponse } from "next/server";
import { Types } from "mongoose";
import connectToDatabase from "@/lib/db";
import School from "@/models/School";
import User from "@/models/User";
import AcademicYear from "@/models/AcademicYear";
import SchoolClass from "@/models/SchoolClass";
import Subject from "@/models/Subject";
import StudentProfile from "@/models/StudentProfile";
import StaffProfile from "@/models/StaffProfile";
import Notice from "@/models/Notice";
import Exam from "@/models/Exam";
import ExamResult from "@/models/ExamResult";
import FeeStructure from "@/models/FeeStructure";
import FeeInvoice from "@/models/FeeInvoice";
import Attendance from "@/models/Attendance";
import StaffAttendance from "@/models/StaffAttendance";
import Timetable from "@/models/Timetable";
import { hashPassword } from "@/lib/auth";

export async function GET() {
  try {
    await connectToDatabase();

    // 1. Purge all mock/sample data across operational collections
    await Promise.all([
      StudentProfile.deleteMany({}),
      StaffProfile.deleteMany({}),
      Notice.deleteMany({}),
      Exam.deleteMany({}),
      ExamResult.deleteMany({}),
      FeeStructure.deleteMany({}),
      FeeInvoice.deleteMany({}),
      Attendance.deleteMany({}),
      StaffAttendance.deleteMany({}),
      Timetable.deleteMany({}),
      Subject.deleteMany({}),
      SchoolClass.deleteMany({}),
      AcademicYear.deleteMany({}),
      // Remove any non-admin users
      User.deleteMany({ role: { $in: ["STUDENT", "PARENT", "TEACHER"] } }),
    ]);

    // 2. Ensure Demo School exists
    let school = await School.findOne({ slug: "apex-academy" });
    if (!school) {
      school = await School.create({
        name: "Apex International Academy",
        slug: "apex-academy",
        contactEmail: "admin@apex.edu",
        phone: "+1-800-555-0199",
        address: "742 Evergreen Terrace, Springfield",
        currency: "USD",
        status: "ACTIVE",
        plan: "PRO",
      });
    }

    const defaultPassword = "password123";
    const hashedPassword = await hashPassword(defaultPassword);

    // 3. Ensure SaaS Super Admin exists
    let superAdmin = await User.findOne({ email: "superadmin@lms.com" });
    if (!superAdmin) {
      superAdmin = await User.create({
        email: "superadmin@lms.com",
        name: "Alex Vance (Super Admin)",
        password: hashedPassword,
        role: "SUPER_ADMIN",
        schoolId: null,
        isActive: true,
      });
    } else {
      superAdmin.password = hashedPassword;
      superAdmin.isActive = true;
      await superAdmin.save();
    }

    // 4. Ensure Institution Admin (Principal) exists
    let principal = await User.findOne({ email: "principal@apex.edu" });
    if (!principal) {
      principal = await User.create({
        email: "principal@apex.edu",
        name: "Dr. Sarah Jenkins (Principal)",
        password: hashedPassword,
        role: "INSTITUTION_ADMIN",
        schoolId: school._id as Types.ObjectId,
        isActive: true,
      });
    } else {
      principal.password = hashedPassword;
      principal.schoolId = school._id as Types.ObjectId;
      principal.isActive = true;
      await principal.save();
    }

    return NextResponse.json({
      success: true,
      message: "Database purged of all sample data. Admin credentials active.",
      school: {
        id: school._id,
        name: school.name,
        slug: school.slug,
      },
      credentials: [
        {
          role: "SUPER_ADMIN",
          email: "superadmin@lms.com",
          password: defaultPassword,
          description: "SaaS Super Admin (Platform Owner)",
        },
        {
          role: "INSTITUTION_ADMIN",
          email: "principal@apex.edu",
          password: defaultPassword,
          description: "Institution Admin (Apex International Academy)",
        },
      ],
    });
  } catch (error: unknown) {
    console.error("Purge & Seed error:", error);
    const message = error instanceof Error ? error.message : "Failed to reset seed data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
