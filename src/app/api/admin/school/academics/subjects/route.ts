import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Subject from "@/models/Subject";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.schoolId || session.role !== "INSTITUTION_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");

    await connectToDatabase();

    const query: Record<string, unknown> = { schoolId: session.schoolId };
    if (classId) {
      query.classId = classId;
    }

    const subjects = await Subject.find(query)
      .populate("classId", "name")
      .sort({ code: 1 })
      .lean();

    return NextResponse.json({ success: true, subjects });
  } catch (error: unknown) {
    console.error("Fetch subjects error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch subjects";
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
    const { classId, name, code, type, passMarks, totalMarks } = body;

    if (!classId || !name || !code) {
      return NextResponse.json(
        { error: "Class, Subject Name, and Subject Code are required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const existing = await Subject.findOne({
      schoolId: session.schoolId,
      classId,
      code: code.trim().toUpperCase(),
    });

    if (existing) {
      return NextResponse.json(
        { error: `Subject code '${code}' already exists for this class` },
        { status: 400 }
      );
    }

    const subject = await Subject.create({
      schoolId: session.schoolId,
      classId,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      type: type || "CORE",
      passMarks: Number(passMarks) || 40,
      totalMarks: Number(totalMarks) || 100,
    });

    return NextResponse.json({ success: true, subject });
  } catch (error: unknown) {
    console.error("Create subject error:", error);
    const message = error instanceof Error ? error.message : "Failed to create subject";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
