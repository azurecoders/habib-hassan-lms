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
import { hashPassword } from "@/lib/auth";
import { UserRole } from "@/types/auth";

export async function GET() {
  try {
    await connectToDatabase();

    // 1. Ensure Demo School exists
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

    const schoolId = school._id as Types.ObjectId;
    const defaultPassword = "password123";
    const hashedPassword = await hashPassword(defaultPassword);

    // 2. Ensure Academic Year exists
    let academicYear = await AcademicYear.findOne({ schoolId, name: "2026-2027" });
    if (!academicYear) {
      academicYear = await AcademicYear.create({
        schoolId,
        name: "2026-2027",
        startDate: new Date("2026-08-01"),
        endDate: new Date("2027-06-30"),
        isCurrent: true,
      });
    }

    // 3. Ensure School Class exists
    let grade10 = await SchoolClass.findOne({ schoolId, name: "Grade 10" });
    if (!grade10) {
      grade10 = await SchoolClass.create({
        schoolId,
        name: "Grade 10",
        order: 10,
        sections: [
          { name: "A", capacity: 35 },
          { name: "B", capacity: 35 },
        ],
      });
    }

    // 4. Ensure Subjects exist
    const sampleSubjects = [
      { name: "Mathematics", code: "MTH-101", totalMarks: 100, passMarks: 40 },
      { name: "Advanced Physics", code: "PHY-102", totalMarks: 100, passMarks: 40 },
      { name: "English Literature", code: "ENG-103", totalMarks: 100, passMarks: 40 },
      { name: "Computer Science", code: "CSC-104", totalMarks: 100, passMarks: 40 },
    ];

    const subjectsMap = new Map<string, Types.ObjectId>();
    for (const sub of sampleSubjects) {
      let subjectDoc = await Subject.findOne({ schoolId, code: sub.code });
      if (!subjectDoc) {
        subjectDoc = await Subject.create({
          schoolId,
          classId: grade10._id,
          name: sub.name,
          code: sub.code,
          totalMarks: sub.totalMarks,
          passMarks: sub.passMarks,
        });
      }
      subjectsMap.set(sub.code, subjectDoc._id as Types.ObjectId);
    }

    // 5. Create 5 Role Users
    const testUsers: {
      email: string;
      name: string;
      role: UserRole;
      schoolId: Types.ObjectId | null;
    }[] = [
      {
        email: "superadmin@lms.com",
        name: "Alex Vance (Super Admin)",
        role: "SUPER_ADMIN",
        schoolId: null,
      },
      {
        email: "principal@apex.edu",
        name: "Dr. Sarah Jenkins (Principal)",
        role: "INSTITUTION_ADMIN",
        schoolId,
      },
      {
        email: "teacher@apex.edu",
        name: "Prof. Marcus Brody (Senior Teacher)",
        role: "TEACHER",
        schoolId,
      },
      {
        email: "parent@apex.edu",
        name: "Eleanor Miller (Parent)",
        role: "PARENT",
        schoolId,
      },
      {
        email: "student@apex.edu",
        name: "Leo Miller (Student)",
        role: "STUDENT",
        schoolId,
      },
    ];

    const userDocs: Record<string, Types.ObjectId> = {};

    for (const u of testUsers) {
      let existing = await User.findOne({ email: u.email });
      if (!existing) {
        existing = await User.create({
          ...u,
          password: hashedPassword,
          isActive: true,
        });
      } else {
        existing.password = hashedPassword;
        existing.isActive = true;
        existing.schoolId = u.schoolId;
        await existing.save();
      }
      userDocs[u.role] = existing._id as Types.ObjectId;
    }

    // 6. Ensure Student Profile for Leo Miller
    let studentProfile = await StudentProfile.findOne({ schoolId, admissionNumber: "ADM-2026-001" });
    if (!studentProfile) {
      studentProfile = await StudentProfile.create({
        schoolId,
        userId: userDocs["STUDENT"],
        guardianId: userDocs["PARENT"],
        classId: grade10._id,
        sectionName: "A",
        admissionNumber: "ADM-2026-001",
        rollNumber: "1042",
        dob: new Date("2010-04-15"),
        gender: "MALE",
        guardianName: "Eleanor Miller",
        guardianPhone: "+1-555-0128",
        guardianEmail: "parent@apex.edu",
        status: "ACTIVE",
      });
    }

    // 7. Ensure Staff Profile for Marcus Brody
    let staffProfile = await StaffProfile.findOne({ schoolId, employeeId: "EMP-2026-01" });
    if (!staffProfile) {
      staffProfile = await StaffProfile.create({
        schoolId,
        userId: userDocs["TEACHER"],
        employeeId: "EMP-2026-01",
        designation: "Senior Science Teacher",
        department: "Science & Mathematics",
        joiningDate: new Date("2024-08-15"),
        qualification: "M.Sc. Theoretical Physics",
        salary: 65000,
        status: "ACTIVE",
      });
    }

    // 8. Ensure Sample Notices
    const existingNotice = await Notice.findOne({ schoolId, title: "Annual Science Fair & STEM Exhibition" });
    if (!existingNotice) {
      await Notice.create([
        {
          schoolId,
          title: "Annual Science Fair & STEM Exhibition",
          content: "The Apex STEM Fair 2026 will be held on December 5th. All students of Grade 9 and 10 are invited to submit their robotics and science project abstracts by next Friday.",
          priority: "HIGH",
          targetAudience: "ALL",
          authorName: "Dr. Sarah Jenkins",
          authorRole: "INSTITUTION_ADMIN",
        },
        {
          schoolId,
          title: "Parent-Teacher Academic Conference (Term 1)",
          content: "Parent-Teacher consultations will take place this Saturday from 9:00 AM to 1:00 PM. Please schedule your 15-minute slot through the parent portal.",
          priority: "NORMAL",
          targetAudience: "PARENT",
          authorName: "Dr. Sarah Jenkins",
          authorRole: "INSTITUTION_ADMIN",
        },
        {
          schoolId,
          title: "Physics Lab Experiment Guidelines & Schedule",
          content: "Grade 10 Section A students are advised to wear safety goggles and bring lab manuals for the Optics experiment tomorrow in Science Lab 1.",
          priority: "NORMAL",
          targetAudience: "STUDENT",
          authorName: "Prof. Marcus Brody",
          authorRole: "TEACHER",
        },
      ]);
    }

    // 9. Ensure Sample Exam & Results
    let exam = await Exam.findOne({ schoolId, title: "Mid-Term Examinations 2026" });
    if (!exam) {
      exam = await Exam.create({
        schoolId,
        title: "Mid-Term Examinations 2026",
        term: "Mid-Term",
        academicYearId: academicYear._id,
        startDate: new Date("2026-10-15"),
        endDate: new Date("2026-10-25"),
        status: "PUBLISHED",
      });

      // Populate Exam Results
      for (const [code, subjectId] of subjectsMap.entries()) {
        let obtainedMarks = 88;
        let grade = "A";
        if (code === "PHY-102") { obtainedMarks = 94; grade = "A+"; }
        if (code === "ENG-103") { obtainedMarks = 82; grade = "A"; }
        if (code === "CSC-104") { obtainedMarks = 96; grade = "A+"; }

        await ExamResult.create({
          schoolId,
          examId: exam._id,
          classId: grade10._id,
          sectionName: "A",
          subjectId,
          marks: [
            {
              studentId: studentProfile._id,
              obtainedMarks,
              totalMarks: 100,
              grade,
              remarks: "Excellent grasp of concepts",
            },
          ],
        });
      }
    }

    // 10. Ensure Sample Fee Structure & Invoice
    let feeStruct = await FeeStructure.findOne({ schoolId, title: "Grade 10 Standard Tuition" });
    if (!feeStruct) {
      feeStruct = await FeeStructure.create({
        schoolId,
        classId: grade10._id,
        title: "Grade 10 Standard Tuition",
        heads: [
          { name: "Monthly Tuition Fee", amount: 2000 },
          { name: "Science Lab Fee", amount: 300 },
          { name: "Library & Sports", amount: 200 },
        ],
        totalAmount: 2500,
        frequency: "MONTHLY",
        dueDay: 15,
      });

      await FeeInvoice.create({
        schoolId,
        studentId: studentProfile._id,
        classId: grade10._id,
        invoiceNumber: "INV-2026-8812-1",
        month: "November 2026",
        issueDate: new Date("2026-11-01"),
        dueDate: new Date("2026-11-15"),
        heads: feeStruct.heads,
        totalAmount: 2500,
        discountAmount: 0,
        paidAmount: 2500,
        status: "PAID",
        paymentHistory: [
          {
            amount: 2500,
            date: new Date("2026-11-01"),
            method: "BANK_TRANSFER",
            transactionRef: "TXN-881249",
            notes: "Paid in full via online bank transfer",
          },
        ],
      });
    }

    return NextResponse.json({
      success: true,
      message: "Complete school ecosystem seeded successfully!",
      school: {
        id: school._id,
        name: school.name,
        slug: school.slug,
      },
      studentProfileId: studentProfile._id,
      staffProfileId: staffProfile._id,
      defaultPassword,
      credentials: testUsers.map((u) => ({
        role: u.role,
        email: u.email,
      })),
    });
  } catch (error: unknown) {
    console.error("Seed error:", error);
    const message = error instanceof Error ? error.message : "Failed to seed demo data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
