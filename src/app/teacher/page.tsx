import React from "react";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import Notice from "@/models/Notice";
import {
  BookOpen,
  CalendarCheck,
  FileSpreadsheet,
  Bell,
  ArrowRight,
  Clock,
} from "lucide-react";

export default async function TeacherDashboardPage() {
  const session = await getSession();

  let notices: Array<{
    _id: string;
    title: string;
    priority: string;
    createdAt: Date;
  }> = [];

  try {
    if (session?.schoolId) {
      await connectToDatabase();
      const nList = await Notice.find({
        schoolId: session.schoolId,
        targetAudience: { $in: ["ALL", "TEACHER"] },
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
  } catch (err) {
    console.error("Teacher notices fetch error:", err);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Faculty Dashboard</h1>
          <p className="text-sm text-slate-500">
            Welcome back, {session?.name}. Manage your lectures, student attendance, and grade submissions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/teacher/attendance"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition"
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            Mark Attendance
          </Link>
          <Link
            href="/teacher/grades"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-semibold shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Enter Grades
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Assigned Classes</span>
            <BookOpen className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold mt-2">4 Batches</p>
          <p className="text-xs text-slate-400 mt-1">Grade 9-A, 10-A, 10-B</p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Daily Lectures</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-blue-600">3 Periods</p>
          <p className="text-xs text-slate-400 mt-1">Next: Period 2 (09:20 AM)</p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Exams Gradebook</span>
            <FileSpreadsheet className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-bold mt-2">Active</p>
          <p className="text-xs text-slate-400 mt-1">Mid-Term marks entry open</p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Circulars & Memos</span>
            <Bell className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold mt-2">{notices.length} Active</p>
          <p className="text-xs text-slate-400 mt-1">Faculty circulars</p>
        </div>
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3">
          Teaching Tools & Workflows
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/teacher/attendance"
            className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 shadow-2xs transition group"
          >
            <div className="flex items-center justify-between">
              <CalendarCheck className="w-5 h-5 text-blue-500" />
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
            </div>
            <h3 className="font-bold text-sm mt-3 text-slate-900 dark:text-white">Student Attendance</h3>
            <p className="text-xs text-slate-500 mt-1">Mark daily roll call with bulk Present / Absent toggles.</p>
          </Link>

          <Link
            href="/teacher/grades"
            className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 shadow-2xs transition group"
          >
            <div className="flex items-center justify-between">
              <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
            </div>
            <h3 className="font-bold text-sm mt-3 text-slate-900 dark:text-white">Exam Gradebook</h3>
            <p className="text-xs text-slate-500 mt-1">Enter marks and auto-calculate letter grades & remarks.</p>
          </Link>

          <Link
            href="/teacher/timetable"
            className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-600 shadow-2xs transition group"
          >
            <div className="flex items-center justify-between">
              <BookOpen className="w-5 h-5 text-purple-500" />
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
            </div>
            <h3 className="font-bold text-sm mt-3 text-slate-900 dark:text-white">My Weekly Routine</h3>
            <p className="text-xs text-slate-500 mt-1">View class allocations, room numbers, and period slots.</p>
          </Link>
        </div>
      </div>

      {/* Staff Notices Preview */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-blue-500" />
            <h2 className="font-bold text-sm text-slate-900 dark:text-white">Staff Room Circulars</h2>
          </div>
          <Link
            href="/teacher/notices"
            className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
          >
            All Notices <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {notices.length === 0 ? (
          <p className="text-xs text-slate-400 py-3 text-center">
            No active faculty circulars.
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
