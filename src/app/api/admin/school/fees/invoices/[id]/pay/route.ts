import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import FeeInvoice from "@/models/FeeInvoice";
import { getSession } from "@/lib/auth";

export async function POST(
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
    const { amount, method, transactionRef, notes } = body;

    const payAmount = Number(amount);
    if (!payAmount || payAmount <= 0) {
      return NextResponse.json({ error: "Valid payment amount is required" }, { status: 400 });
    }

    await connectToDatabase();

    const invoice = await FeeInvoice.findOne({
      _id: id,
      schoolId: session.schoolId,
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const newPaidAmount = (invoice.paidAmount || 0) + payAmount;
    const netPayable = invoice.totalAmount - (invoice.discountAmount || 0);

    const newStatus =
      newPaidAmount >= netPayable ? "PAID" : newPaidAmount > 0 ? "PARTIAL" : "UNPAID";

    invoice.paidAmount = newPaidAmount;
    invoice.status = newStatus;
    invoice.paymentHistory.push({
      amount: payAmount,
      date: new Date(),
      method: method || "CASH",
      transactionRef: transactionRef || "",
      notes: notes || "",
    });

    await invoice.save();

    return NextResponse.json({
      success: true,
      message: `Payment of ${payAmount} recorded successfully!`,
      invoice,
    });
  } catch (error: unknown) {
    console.error("Record payment error:", error);
    const message = error instanceof Error ? error.message : "Failed to record payment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
