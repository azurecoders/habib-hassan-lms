import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import SchoolClass from "@/models/SchoolClass";
import Subject from "@/models/Subject";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.schoolId || session.role !== "INSTITUTION_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await connectToDatabase();

    const classes = await SchoolClass.find({ schoolId: session.schoolId })
      .sort({ order: 1, name: 1 })
      .lean();

    // Attach subject count per class
    const classIds = classes.map((c) => c._id);
    const subjectCounts = await Subject.aggregate([
      { $match: { classId: { $in: classIds } } },
      { $group: { _id: "$classId", count: { $sum: 1 } } },
    ]);

    const subCountMap = new Map(subjectCounts.map((s) => [s._id.toString(), s.count]));

    const enrichedClasses = classes.map((c) => ({
      ...c,
      subjectCount: subCountMap.get(c._id.toString()) || 0,
    }));

    return NextResponse.json({ success: true, classes: enrichedClasses });
  } catch (error: unknown) {
    console.error("Fetch classes error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch classes";
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
    const { name, sections, order } = body;

    if (!name) {
      return NextResponse.json({ error: "Class name is required" }, { status: 400 });
    }

    await connectToDatabase();

    const existing = await SchoolClass.findOne({
      schoolId: session.schoolId,
      name: name.trim(),
    });

    if (existing) {
      return NextResponse.json(
        { error: `Class '${name}' already exists in your institution` },
        { status: 400 }
      );
    }

    // Default sections if none provided
    const formattedSections =
      sections && sections.length > 0
        ? sections
        : [{ name: "A", room: "101", capacity: 40 }];

    const newClass = await SchoolClass.create({
      schoolId: session.schoolId,
      name: name.trim(),
      order: Number(order) || 1,
      sections: formattedSections,
    });

    return NextResponse.json({ success: true, class: newClass });
  } catch (error: unknown) {
    console.error("Create class error:", error);
    const message = error instanceof Error ? error.message : "Failed to create class";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
