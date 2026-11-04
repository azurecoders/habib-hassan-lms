import React from "react";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import StaffProfile from "@/models/StaffProfile";
import Notice from "@/models/Notice";
import Exam from "@/models/Exam";
import {
  BookOpen,
  CalendarCheck,
  FileSpreadsheet,
  Bell,
  ArrowRight,
  Clock,
  Sparkles,
  AlertCircle,
  Users,
} from "lucide-react";

export default async function TeacherDashboardPage() {
  const session = await getSession();

  let staffProfile = null;
  let assignedBatchesCount = 0;
  let batchSummary = "No classes assigned yet";
  let activeExamsCount = 0;
  let notices: Array<{
    _id: string;
    title: string;
    priority: string;
    createdAt: Date;
  }> = [];

  try {
    if (session?.id && session?.schoolId) {
      await connectToDatabase();

      const [staff, examsCount, nList] = await Promise.all([
        StaffProfile.findOne({
          schoolId: session.schoolId,
          userId: session.id,
        })
          .populate("assignedClasses.classId", "name")
          .populate("assignedClasses.subjectId", "name code")
          .lean(),
        Exam.countDocuments({ schoolId: session.schoolId }),
        Notice.find({
          schoolId: session.schoolId,
          targetAudience: { $in: ["ALL", "TEACHER"] },
        })
          .sort({ createdAt: -1 })
          .limit(3)
          .lean(),
      ]);

      if (staff) {
        staffProfile = staff;
        const validAllocs = (staff.assignedClasses || []).filter(
          (a) => a.classId && a.subjectId
        );
        assignedBatchesCount = validAllocs.length;
        if (assignedBatchesCount > 0) {
          batchSummary = validAllocs
            .slice(0, 3)
            .map(
              (a) =>
                `${(a.classId as unknown as { name?: string })?.name || "Class"}-${a.sectionName}`
            )
            .join(", ") + (assignedBatchesCount > 3 ? ` +${assignedBatchesCount - 3} more` : "");
        }
      }

      activeExamsCount = examsCount;

      notices = nList.map((n) => ({
        _id: n._id.toString(),
        title: n.title,
        priority: n.priority,
        createdAt: n.createdAt,
      }));
    }
  } catch (err) {
    console.error("Teacher dashboard error:", err);
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

      {/* Hero Welcome Card */}
      <div className="p-6 bg-gradient-to-r from-blue-700 via-indigo-600 to-indigo-800 rounded-2xl text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-blue-200 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Faculty Profile
          </span>
          <h2 className="text-2xl font-extrabold mt-1">{session?.name}</h2>
          <p className="text-xs text-blue-100 mt-0.5">
            {staffProfile?.designation || "Faculty Member"} • {staffProfile?.department || "Academic"} Department • ID: {staffProfile?.employeeId || "PENDING"}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-white/10 backdrop-blur-xs px-4 py-2.5 rounded-xl border border-white/20 text-center">
            <span className="text-[10px] uppercase font-bold text-blue-200">Teaching Load</span>
            <p className="text-lg font-extrabold">{assignedBatchesCount} Batch{assignedBatchesCount === 1 ? "" : "es"}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-xs px-4 py-2.5 rounded-xl border border-white/20 text-center">
            <span className="text-[10px] uppercase font-bold text-blue-200">Exams Scheduled</span>
            <p className="text-lg font-extrabold">{activeExamsCount} Terms</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Assigned Batches</span>
            <BookOpen className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold mt-2 text-slate-900 dark:text-white">
            {assignedBatchesCount} Batch{assignedBatchesCount === 1 ? "" : "es"}
          </p>
          <p className="text-xs text-slate-400 mt-1 truncate">{batchSummary}</p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Roll Call</span>
            <CalendarCheck className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-extrabold mt-2 text-blue-600">Daily</p>
          <p className="text-xs text-slate-400 mt-1">Roll call for assigned classes</p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Exams Gradebook</span>
            <FileSpreadsheet className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-extrabold mt-2 text-slate-900 dark:text-white">
            {activeExamsCount > 0 ? "Open" : "No Exams"}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {activeExamsCount > 0 ? `${activeExamsCount} term(s) scheduled` : "Awaiting exam term setup"}
          </p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Circulars & Memos</span>
            <Bell className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold mt-2 text-slate-900 dark:text-white">
            {notices.length} Active
          </p>
          <p className="text-xs text-slate-400 mt-1">Faculty notices</p>
        </div>
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Faculty Tools & Portals
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/teacher/attendance"
            className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 shadow-2xs transition group"
          >
            <div className="flex items-center justify-between">
              <CalendarCheck className="w-5 h-5 text-blue-500" />
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
            </div>
            <h3 className="font-bold text-sm mt-3 text-slate-900 dark:text-white">Student Attendance</h3>
            <p className="text-xs text-slate-500 mt-1">
              Mark daily roll call with bulk Present / Absent toggles for your assigned classes.
            </p>
          </Link>

          <Link
            href="/teacher/grades"
            className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 shadow-2xs transition group"
          >
            <div className="flex items-center justify-between">
              <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
            </div>
            <h3 className="font-bold text-sm mt-3 text-slate-900 dark:text-white">Exam Gradebook</h3>
            <p className="text-xs text-slate-500 mt-1">
              Enter exam marks and auto-calculate letter grades & remarks for your allocated subjects.
            </p>
          </Link>

          <Link
            href="/teacher/timetable"
            className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-600 shadow-2xs transition group"
          >
            <div className="flex items-center justify-between">
              <BookOpen className="w-5 h-5 text-purple-500" />
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
            </div>
            <h3 className="font-bold text-sm mt-3 text-slate-900 dark:text-white">My Weekly Routine</h3>
            <p className="text-xs text-slate-500 mt-1">
              View class allocations, room numbers, and period slots for your teaching assignments.
            </p>
          </Link>
        </div>
      </div>

      {/* Staff Notices Preview */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xs">
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
          <p className="text-xs text-slate-400 py-4 text-center">
            No active faculty circulars.
          </p>
        ) : (
          <div className="space-y-3">
            {notices.map((n) => (
              <div
                key={n._id}
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
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
