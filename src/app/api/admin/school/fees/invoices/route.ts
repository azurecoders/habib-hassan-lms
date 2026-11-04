import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import FeeInvoice from "@/models/FeeInvoice";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.schoolId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");
    const status = searchParams.get("status");
    const month = searchParams.get("month");

    await connectToDatabase();

    const query: Record<string, unknown> = { schoolId: session.schoolId };
    if (classId && classId !== "ALL") query.classId = classId;
    if (status && status !== "ALL") query.status = status;
    if (month) query.month = month;

    const invoices = await FeeInvoice.find(query)
      .populate({
        path: "studentId",
        select: "admissionNumber rollNumber sectionName userId",
        populate: { path: "userId", select: "name email phone" },
      })
      .populate("classId", "name")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, invoices });
  } catch (error: unknown) {
    console.error("Fetch fee invoices error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch invoices";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
