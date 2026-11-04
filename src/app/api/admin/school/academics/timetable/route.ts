import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Timetable from "@/models/Timetable";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.schoolId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");
    const sectionName = searchParams.get("sectionName") || "A";

    if (!classId) {
      return NextResponse.json({ error: "classId is required" }, { status: 400 });
    }

    await connectToDatabase();

    const timetable = await Timetable.find({
      schoolId: session.schoolId,
      classId,
      sectionName,
    }).lean();

    return NextResponse.json({ success: true, timetable });
  } catch (error: unknown) {
    console.error("Fetch timetable error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch timetable";
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
    const { classId, sectionName, dayOfWeek, slots } = body;

    if (!classId || !sectionName || !dayOfWeek) {
      return NextResponse.json(
        { error: "classId, sectionName, and dayOfWeek are required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const updated = await Timetable.findOneAndUpdate(
      {
        schoolId: session.schoolId,
        classId,
        sectionName,
        dayOfWeek,
      },
      {
        schoolId: session.schoolId,
        classId,
        sectionName,
        dayOfWeek,
        slots: slots || [],
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, timetable: updated });
  } catch (error: unknown) {
    console.error("Save timetable error:", error);
    const message = error instanceof Error ? error.message : "Failed to save timetable";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
