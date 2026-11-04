import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import School from "@/models/School";
import User from "@/models/User";
import { getSession, hashPassword } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await connectToDatabase();

    const schools = await School.find().sort({ createdAt: -1 }).lean();

    // Attach user counts per school efficiently
    const schoolIds = schools.map((s) => s._id);
    const userCounts = await User.aggregate([
      { $match: { schoolId: { $in: schoolIds } } },
      { $group: { _id: "$schoolId", count: { $sum: 1 } } },
    ]);

    const countMap = new Map(userCounts.map((u) => [u._id.toString(), u.count]));

    const enrichedSchools = schools.map((s) => ({
      ...s,
      userCount: countMap.get(s._id.toString()) || 0,
    }));

    return NextResponse.json({ success: true, schools: enrichedSchools });
  } catch (error: unknown) {
    console.error("Fetch schools error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch schools";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      slug,
      contactEmail,
      phone,
      address,
      currency,
      plan,
      adminName,
      adminEmail,
      adminPassword,
    } = body;

    if (!name || !contactEmail || !adminName || !adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: "Missing required fields (Name, Contact Email, Admin Name, Admin Email, Admin Password)" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Format slug
    const cleanSlug = (slug || name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    // Check slug uniqueness
    const existingSchool = await School.findOne({ slug: cleanSlug });
    if (existingSchool) {
      return NextResponse.json(
        { error: `A school with slug '${cleanSlug}' already exists` },
        { status: 400 }
      );
    }

    // Check admin email uniqueness
    const existingUser = await User.findOne({ email: adminEmail.toLowerCase().trim() });
    if (existingUser) {
      return NextResponse.json(
        { error: `A user with email '${adminEmail}' already exists` },
        { status: 400 }
      );
    }

    // 1. Create School
    const school = await School.create({
      name: name.trim(),
      slug: cleanSlug,
      contactEmail: contactEmail.toLowerCase().trim(),
      phone: phone || "",
      address: address || "",
      currency: (currency || "USD").toUpperCase(),
      plan: plan || "FREE",
      status: "ACTIVE",
    });

    // 2. Create Institution Admin User
    const hashedPassword = await hashPassword(adminPassword);
    const adminUser = await User.create({
      schoolId: school._id,
      name: adminName.trim(),
      email: adminEmail.toLowerCase().trim(),
      password: hashedPassword,
      role: "INSTITUTION_ADMIN",
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      message: "School and Institution Admin created successfully",
      school,
      admin: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
      },
    });
  } catch (error: unknown) {
    console.error("Create school error:", error);
    const message = error instanceof Error ? error.message : "Failed to create school";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
