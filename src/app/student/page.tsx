import React from "react";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import StudentProfile from "@/models/StudentProfile";
import Notice from "@/models/Notice";
import {
  CalendarCheck,
  FileSpreadsheet,
  Bell,
  ArrowRight,
  CreditCard,
  Sparkles,
} from "lucide-react";

export default async function StudentDashboardPage() {
  const session = await getSession();

  let className = "Grade 10 - Section A";
  let rollNumber = "1042";
  let admissionNumber = "ADM-2026-001";
  let notices: Array<{
    _id: string;
    title: string;
    priority: string;
    createdAt: Date;
  }> = [];

  try {
    if (session?.id) {
      await connectToDatabase();
      const student = await StudentProfile.findOne({ userId: session.id })
        .populate("classId", "name")
        .lean();

      if (student) {
        const c = student.classId as unknown as { name?: string };
        if (c?.name) className = `${c.name} - Section ${student.sectionName}`;
        if (student.rollNumber) rollNumber = student.rollNumber;
        if (student.admissionNumber) admissionNumber = student.admissionNumber;
      }

      if (session.schoolId) {
        const nList = await Notice.find({
          schoolId: session.schoolId,
          targetAudience: { $in: ["ALL", "STUDENT"] },
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
    console.error("Student dashboard error:", err);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Student Dashboard</h1>
          <p className="text-sm text-slate-500">
            Welcome back, {session?.name}. Check your class schedule, attendance streak, and examination transcripts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/student/results"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            My Report Card
          </Link>
          <Link
            href="/student/fees"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-semibold shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <CreditCard className="w-3.5 h-3.5" />
            Fee Status
          </Link>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="p-6 bg-linear-to-r from-blue-700 via-indigo-600 to-purple-700 rounded-2xl text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-blue-200 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Student Profile
          </span>
          <h2 className="text-2xl font-extrabold mt-1">{session?.name}</h2>
          <p className="text-xs text-blue-100 mt-0.5">
            {className} • Roll: {rollNumber} • Adm: {admissionNumber}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-white/10 backdrop-blur-xs px-4 py-2.5 rounded-xl border border-white/20 text-center">
            <span className="text-[10px] uppercase font-bold text-blue-200">Attendance</span>
            <p className="text-lg font-extrabold">97.8%</p>
          </div>
          <div className="bg-white/10 backdrop-blur-xs px-4 py-2.5 rounded-xl border border-white/20 text-center">
            <span className="text-[10px] uppercase font-bold text-blue-200">Term Grade</span>
            <p className="text-lg font-extrabold">Grade A</p>
          </div>
        </div>
      </div>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/student/results"
          className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 shadow-2xs transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Examination Results</span>
            <FileSpreadsheet className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-blue-600">89.4%</p>
          <p className="text-xs text-slate-400 mt-1 flex items-center justify-between">
            <span>Official report card & grades</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
          </p>
        </Link>

        <Link
          href="/student/attendance"
          className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 shadow-2xs transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">My Daily Attendance</span>
            <CalendarCheck className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-emerald-600">44 / 45</p>
          <p className="text-xs text-slate-400 mt-1 flex items-center justify-between">
            <span>Consecutive 12-day streak</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
          </p>
        </Link>

        <Link
          href="/student/fees"
          className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-600 shadow-2xs transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Tuition Fee Status</span>
            <CreditCard className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-purple-600">Up to Date</p>
          <p className="text-xs text-slate-400 mt-1 flex items-center justify-between">
            <span>View payment receipts</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
          </p>
        </Link>
      </div>

      {/* Campus Announcements Preview */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-blue-500" />
            <h2 className="font-bold text-sm text-slate-900 dark:text-white">Campus Notices & Circulars</h2>
          </div>
          <Link
            href="/student/notices"
            className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
          >
            All Notices <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {notices.length === 0 ? (
          <p className="text-xs text-slate-400 py-3 text-center">
            No active campus notices.
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
