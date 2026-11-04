import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Notice from "@/models/Notice";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.schoolId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const audienceFilter = searchParams.get("audience");

    await connectToDatabase();

    // Query builder based on user role
    const query: Record<string, unknown> = {
      schoolId: session.schoolId,
    };

    if (session.role === "INSTITUTION_ADMIN") {
      if (audienceFilter && audienceFilter !== "ALL_AUDIENCES") {
        query.targetAudience = audienceFilter;
      }
    } else if (session.role === "TEACHER") {
      query.targetAudience = { $in: ["ALL", "TEACHER"] };
    } else if (session.role === "PARENT") {
      query.targetAudience = { $in: ["ALL", "PARENT"] };
    } else if (session.role === "STUDENT") {
      query.targetAudience = { $in: ["ALL", "STUDENT"] };
    }

    const notices = await Notice.find(query).sort({ createdAt: -1 }).limit(50).lean();

    return NextResponse.json({ success: true, notices });
  } catch (error: unknown) {
    console.error("Fetch notices error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch notices";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (
      !session ||
      !session.schoolId ||
      (session.role !== "INSTITUTION_ADMIN" && session.role !== "TEACHER")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { title, content, priority, targetAudience, expiresAt } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const notice = await Notice.create({
      schoolId: session.schoolId,
      title: title.trim(),
      content: content.trim(),
      priority: priority || "NORMAL",
      targetAudience: targetAudience || "ALL",
      authorName: session.name || "School Administration",
      authorRole: session.role,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });

    return NextResponse.json({ success: true, notice }, { status: 201 });
  } catch (error: unknown) {
    console.error("Create notice error:", error);
    const message = error instanceof Error ? error.message : "Failed to broadcast notice";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.schoolId || session.role !== "INSTITUTION_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Notice ID is required" }, { status: 400 });
    }

    await connectToDatabase();

    const deleted = await Notice.findOneAndDelete({
      _id: id,
      schoolId: session.schoolId,
    });

    if (!deleted) {
      return NextResponse.json({ error: "Notice not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Notice deleted successfully" });
  } catch (error: unknown) {
    console.error("Delete notice error:", error);
    const message = error instanceof Error ? error.message : "Failed to delete notice";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
