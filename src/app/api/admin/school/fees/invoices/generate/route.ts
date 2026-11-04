import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import FeeInvoice from "@/models/FeeInvoice";
import FeeStructure from "@/models/FeeStructure";
import StudentProfile from "@/models/StudentProfile";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.schoolId || session.role !== "INSTITUTION_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { classId, month, dueDate } = body;

    if (!classId || !month) {
      return NextResponse.json(
        { error: "Class and Month are required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // 1. Get Fee Structure for class or fallback
    const structure = await FeeStructure.findOne({
      schoolId: session.schoolId,
      classId,
    });

    const heads = structure
      ? structure.heads
      : [{ name: "Tuition Fee", amount: 2500 }];

    const totalAmount = structure
      ? structure.totalAmount
      : 2500;

    // 2. Find all active students in this class
    const students = await StudentProfile.find({
      schoolId: session.schoolId,
      classId,
      status: "ACTIVE",
    }).lean();

    if (students.length === 0) {
      return NextResponse.json(
        { error: "No active students found in this class to generate invoices for" },
        { status: 400 }
      );
    }

    const calculatedDueDate = dueDate
      ? new Date(dueDate)
      : new Date(Date.now() + 10 * 24 * 60 * 60 * 1000); // 10 days from now

    let createdCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < students.length; i++) {
      const student = students[i];

      // Check if invoice already exists for this student & month
      const existing = await FeeInvoice.findOne({
        schoolId: session.schoolId,
        studentId: student._id,
        month,
      });

      if (existing) {
        skippedCount++;
        continue;
      }

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const invoiceNumber = `INV-${new Date().getFullYear()}-${randomSuffix}-${i + 1}`;

      await FeeInvoice.create({
        schoolId: session.schoolId,
        studentId: student._id,
        classId,
        invoiceNumber,
        month,
        issueDate: new Date(),
        dueDate: calculatedDueDate,
        heads,
        totalAmount,
        discountAmount: 0,
        paidAmount: 0,
        status: "UNPAID",
        paymentHistory: [],
      });

      createdCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${createdCount} invoice(s). Skipped ${skippedCount} duplicate(s).`,
      createdCount,
      skippedCount,
    });
  } catch (error: unknown) {
    console.error("Generate invoices error:", error);
    const message = error instanceof Error ? error.message : "Failed to generate invoices";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
