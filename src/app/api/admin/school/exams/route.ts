import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Exam from "@/models/Exam";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.schoolId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await connectToDatabase();

    const exams = await Exam.find({ schoolId: session.schoolId })
      .sort({ startDate: -1 })
      .lean();

    return NextResponse.json({ success: true, exams });
  } catch (error: unknown) {
    console.error("Fetch exams error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch exams";
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
    const { title, term, startDate, endDate, status } = body;

    if (!title || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Title, Start Date, and End Date are required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const exam = await Exam.create({
      schoolId: session.schoolId,
      title: title.trim(),
      term: term || "Term 1",
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: status || "PUBLISHED",
    });

    return NextResponse.json({ success: true, exam });
  } catch (error: unknown) {
    console.error("Create exam error:", error);
    const message = error instanceof Error ? error.message : "Failed to create exam";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
