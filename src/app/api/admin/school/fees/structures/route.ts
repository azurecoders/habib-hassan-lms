import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import FeeStructure from "@/models/FeeStructure";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.schoolId || session.role !== "INSTITUTION_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await connectToDatabase();

    const structures = await FeeStructure.find({ schoolId: session.schoolId })
      .populate("classId", "name")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, structures });
  } catch (error: unknown) {
    console.error("Fetch fee structures error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch fee structures";
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
    const { classId, title, heads, dueDay, frequency } = body;

    if (!classId || !title || !heads || heads.length === 0) {
      return NextResponse.json(
        { error: "Class, Title, and at least one Fee Head are required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const totalAmount = heads.reduce(
      (acc: number, h: { amount: number }) => acc + Number(h.amount || 0),
      0
    );

    const structure = await FeeStructure.findOneAndUpdate(
      { schoolId: session.schoolId, classId },
      {
        schoolId: session.schoolId,
        classId,
        title: title.trim(),
        heads,
        totalAmount,
        frequency: frequency || "MONTHLY",
        dueDay: Number(dueDay) || 10,
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      message: "Fee structure configured successfully",
      structure,
    });
  } catch (error: unknown) {
    console.error("Create fee structure error:", error);
    const message = error instanceof Error ? error.message : "Failed to save fee structure";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
