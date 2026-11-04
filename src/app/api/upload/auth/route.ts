import { NextResponse } from "next/server";
import { getImageKitAuth } from "@/lib/imagekit";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const auth = getImageKitAuth();
    return NextResponse.json(auth);
  } catch (error: unknown) {
    console.error("ImageKit auth error:", error);
    return NextResponse.json({ error: "Failed to generate auth" }, { status: 500 });
  }
}
