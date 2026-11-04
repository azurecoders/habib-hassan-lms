import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import School from "@/models/School";
import User from "@/models/User";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await connectToDatabase();

    const [
      totalSchools,
      activeSchools,
      suspendedSchools,
      totalUsers,
      schoolsByPlan,
      recentSchools,
    ] = await Promise.all([
      School.countDocuments(),
      School.countDocuments({ status: "ACTIVE" }),
      School.countDocuments({ status: "SUSPENDED" }),
      User.countDocuments(),
      School.aggregate([
        { $group: { _id: "$plan", count: { $sum: 1 } } },
      ]),
      School.find().sort({ createdAt: -1 }).limit(5).lean(),
    ]);

    const planCounts: Record<string, number> = { FREE: 0, BASIC: 0, PRO: 0 };
    schoolsByPlan.forEach((p) => {
      if (p._id) planCounts[p._id] = p.count;
    });

    // Approximate MRR: FREE = 0, BASIC = 49, PRO = 199
    const estimatedMRR =
      (planCounts.BASIC || 0) * 49 + (planCounts.PRO || 0) * 199;

    return NextResponse.json({
      success: true,
      stats: {
        totalSchools,
        activeSchools,
        suspendedSchools,
        totalUsers,
        estimatedMRR,
        planCounts,
        recentSchools,
      },
    });
  } catch (error: unknown) {
    console.error("Fetch SaaS stats error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch stats";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
