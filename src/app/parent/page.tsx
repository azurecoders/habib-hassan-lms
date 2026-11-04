import React from "react";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import StudentProfile from "@/models/StudentProfile";
import Notice from "@/models/Notice";
import {
  CalendarCheck,
  CreditCard,
  FileSpreadsheet,
  Bell,
  ArrowRight,
  Printer,
  Sparkles,
} from "lucide-react";

export default async function ParentDashboardPage() {
  const session = await getSession();

  let childName = "Student Ward";
  let childClass = "Grade 10 - Section A";
  let notices: Array<{
    _id: string;
    title: string;
    priority: string;
    createdAt: Date;
  }> = [];

  try {
    if (session?.id) {
      await connectToDatabase();
      const student = await StudentProfile.findOne({ guardianId: session.id })
        .populate("userId", "name")
        .populate("classId", "name")
        .lean();

      if (student) {
        const u = student.userId as unknown as { name?: string };
        const c = student.classId as unknown as { name?: string };
        if (u?.name) childName = u.name;
        if (c?.name) childClass = `${c.name} - Section ${student.sectionName}`;
      }

      if (session.schoolId) {
        const nList = await Notice.find({
          schoolId: session.schoolId,
          targetAudience: { $in: ["ALL", "PARENT"] },
        })
          .sort({ createdAt: -1 })
          .limit(3)
          .lean();

        notices = nList.map((n) => ({
          _id: n._id.toString(),
          title: n.title,
          priority: n.priority,
          createdAt: n.createdAt,
        }));
      }
    }
  } catch (err) {
    console.error("Parent dashboard error:", err);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Parent Portal</h1>
          <p className="text-sm text-slate-500">
            Welcome, {session?.name}. Monitor your child&apos;s daily attendance, academic scores, and fees.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/parent/reports"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition"
          >
            <Printer className="w-3.5 h-3.5" />
            Report Card
          </Link>
          <Link
            href="/parent/fees"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-semibold shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <CreditCard className="w-3.5 h-3.5" />
            Fee Vouchers
          </Link>
        </div>
      </div>

      {/* Child Summary Hero */}
      <div className="p-6 bg-linear-to-r from-blue-600 to-indigo-700 rounded-2xl text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-blue-200 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Enrolled Ward
          </span>
          <h2 className="text-2xl font-extrabold mt-1">{childName}</h2>
          <p className="text-xs text-blue-100 mt-0.5">{childClass} • Roll No: 1042</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-white/10 backdrop-blur-xs px-4 py-2.5 rounded-xl border border-white/20 text-center">
            <span className="text-[10px] uppercase font-bold text-blue-200">Attendance</span>
            <p className="text-lg font-extrabold">97.8%</p>
          </div>
          <div className="bg-white/10 backdrop-blur-xs px-4 py-2.5 rounded-xl border border-white/20 text-center">
            <span className="text-[10px] uppercase font-bold text-blue-200">Standing</span>
            <p className="text-lg font-extrabold">Grade A</p>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/parent/attendance"
          className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 shadow-2xs transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Monthly Attendance</span>
            <CalendarCheck className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-emerald-600">44 / 45 Days</p>
          <p className="text-xs text-slate-400 mt-1 flex items-center justify-between">
            <span>Only 1 excused absence</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
          </p>
        </Link>

        <Link
          href="/parent/fees"
          className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 shadow-2xs transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Fee Invoices</span>
            <CreditCard className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-emerald-600">All Cleared</p>
          <p className="text-xs text-slate-400 mt-1 flex items-center justify-between">
            <span>Zero outstanding balance</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
          </p>
        </Link>

        <Link
          href="/parent/reports"
          className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-600 shadow-2xs transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Academic Transcript</span>
            <FileSpreadsheet className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-purple-600">89.4% Agg.</p>
          <p className="text-xs text-slate-400 mt-1 flex items-center justify-between">
            <span>Mid-Term Exam (Passed)</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
          </p>
        </Link>
      </div>

      {/* Parent Notices Preview */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-blue-500" />
            <h2 className="font-bold text-sm text-slate-900 dark:text-white">School Circulars & Event Notices</h2>
          </div>
          <Link
            href="/parent/notices"
            className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
          >
            All Notices <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {notices.length === 0 ? (
          <p className="text-xs text-slate-400 py-3 text-center">
            No active school circulars for parents.
          </p>
        ) : (
          <div className="space-y-3">
            {notices.map((n) => (
              <div
                key={n._id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      n.priority === "URGENT"
                        ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                        : "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                    }`}
                  >
                    {n.priority}
                  </span>
                  <div>
                    <h4 className="font-semibold text-xs text-slate-900 dark:text-white">{n.title}</h4>
                  </div>
                </div>

                <span className="text-[11px] text-slate-400">
                  {new Date(n.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
