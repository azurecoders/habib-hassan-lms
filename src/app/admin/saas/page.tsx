import React from "react";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import School from "@/models/School";
import User from "@/models/User";
import {
  Building2,
  Users,
  TrendingUp,
  Server,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default async function SaasDashboardPage() {
  const session = await getSession();

  await connectToDatabase();

  const [
    totalSchools,
    activeSchools,
    suspendedSchools,
    totalUsers,
    recentSchools,
  ] = await Promise.all([
    School.countDocuments(),
    School.countDocuments({ status: "ACTIVE" }),
    School.countDocuments({ status: "SUSPENDED" }),
    User.countDocuments(),
    School.find().sort({ createdAt: -1 }).limit(5).lean(),
  ]);

  // Compute MRR dynamically from active school plans
  const schoolsByPlan = await School.aggregate([
    { $match: { status: "ACTIVE" } },
    { $group: { _id: "$plan", count: { $sum: 1 } } },
  ]);

  const planMap: Record<string, number> = { FREE: 0, BASIC: 0, PRO: 0 };
  schoolsByPlan.forEach((p) => {
    if (p._id) planMap[p._id] = p.count;
  });

  const estimatedMRR = (planMap.BASIC || 0) * 49 + (planMap.PRO || 0) * 199;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">SaaS Super Admin Overview</h1>
          <p className="text-sm text-slate-500">
            Welcome back, {session?.name}. Manage tenant schools, subscriptions, and platform performance.
          </p>
        </div>

        <Link
          href="/admin/saas/schools"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-xs transition-all w-fit"
        >
          <span>Manage All Institutions</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Total Institutions</span>
            <Building2 className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-bold mt-2">{totalSchools}</p>
          <div className="flex items-center gap-2 mt-1 text-xs">
            <span className="text-emerald-600 font-medium">● {activeSchools} Active</span>
            {suspendedSchools > 0 && (
              <span className="text-rose-500 font-medium">● {suspendedSchools} Suspended</span>
            )}
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Platform Users</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold mt-2">{totalUsers}</p>
          <p className="text-xs text-slate-400 mt-1">Across all institutions</p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Estimated MRR</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold mt-2">${estimatedMRR}</p>
          <p className="text-xs text-emerald-600 mt-1">
            {planMap.PRO || 0} Pro, {planMap.BASIC || 0} Basic
          </p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Infra & Health</span>
            <Server className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-emerald-600">Operational</p>
          <p className="text-xs text-slate-400 mt-1">Vercel + Atlas Free M0</p>
        </div>
      </div>

      {/* Recent Onboarded Schools & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-sm">Recently Onboarded Institutions</h2>
            <Link
              href="/admin/saas/schools"
              className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
            >
              View all
            </Link>
          </div>

          {recentSchools.length === 0 ? (
            <p className="text-xs text-slate-400">No schools onboarded yet.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentSchools.map((s) => (
                <div key={s._id.toString()} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                      {s.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{s.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">/{s.slug}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        s.plan === "PRO"
                          ? "bg-purple-50 text-purple-700 dark:bg-purple-950/40"
                          : s.plan === "BASIC"
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40"
                          : "bg-slate-100 text-slate-700 dark:bg-slate-800"
                      }`}
                    >
                      {s.plan}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 ${
                        s.status === "ACTIVE" ? "text-emerald-600" : "text-rose-500"
                      }`}
                    >
                      {s.status === "ACTIVE" ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5" />
                      )}
                      <span className="capitalize">{s.status.toLowerCase()}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tenant Architecture Info */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <h3 className="font-bold text-sm">Tenant Isolation Protocol</h3>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Data across all institutions is strictly isolated by the compound indexed <code className="font-mono text-blue-600">schoolId</code> field. Queries run in lean mode (`.lean()`) for optimal performance on MongoDB Atlas Free tier.
          </p>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Database Cluster:</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">Atlas M0 Shared</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Runtime Engine:</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">Vercel Serverless</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Connection Pool Max:</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">10 / instance</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
