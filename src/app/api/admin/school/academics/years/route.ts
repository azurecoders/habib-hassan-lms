import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import AcademicYear from "@/models/AcademicYear";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.schoolId || session.role !== "INSTITUTION_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await connectToDatabase();

    const years = await AcademicYear.find({ schoolId: session.schoolId })
      .sort({ startDate: -1 })
      .lean();

    return NextResponse.json({ success: true, years });
  } catch (error: unknown) {
    console.error("Fetch academic years error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch years";
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
    const { name, startDate, endDate, isCurrent } = body;

    if (!name || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Name, Start Date, and End Date are required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    if (isCurrent) {
      // Unset previous active year
      await AcademicYear.updateMany(
        { schoolId: session.schoolId },
        { $set: { isCurrent: false } }
      );
    }

    const year = await AcademicYear.create({
      schoolId: session.schoolId,
      name: name.trim(),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isCurrent: !!isCurrent,
    });

    return NextResponse.json({ success: true, year });
  } catch (error: unknown) {
    console.error("Create academic year error:", error);
    const message = error instanceof Error ? error.message : "Failed to create year";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
