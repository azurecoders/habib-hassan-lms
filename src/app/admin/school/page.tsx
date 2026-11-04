import React from "react";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import StudentProfile from "@/models/StudentProfile";
import StaffProfile from "@/models/StaffProfile";
import FeeInvoice from "@/models/FeeInvoice";
import Notice from "@/models/Notice";
import Attendance from "@/models/Attendance";
import { Types } from "mongoose";
import {
  GraduationCap,
  Users,
  CalendarCheck,
  CreditCard,
  FileSpreadsheet,
  Bell,
  ArrowRight,
  BookOpen,
  PlusCircle,
} from "lucide-react";

export default async function SchoolAdminDashboardPage() {
  const session = await getSession();

  let studentCount = 0;
  let staffCount = 0;
  let totalBilled = 0;
  let totalCollected = 0;
  let todayAttendanceStr = "Pending";
  let recentNotices: Array<{
    _id: string;
    title: string;
    targetAudience: string;
    priority: string;
    createdAt: Date;
  }> = [];

  try {
    if (session?.schoolId) {
      await connectToDatabase();
      const sId = new Types.ObjectId(session.schoolId);
      const today = new Date().toISOString().split("T")[0];

      const [sCount, stCount, invoiceAgg, todayAttendance, noticesList] = await Promise.all([
        StudentProfile.countDocuments({ schoolId: sId }),
        StaffProfile.countDocuments({ schoolId: sId }),
        FeeInvoice.aggregate([
          { $match: { schoolId: sId } },
          {
            $group: {
              _id: null,
              totalBilled: { $sum: "$totalAmount" },
              totalPaid: { $sum: "$paidAmount" },
            },
          },
        ]),
        Attendance.find({ schoolId: sId, date: today }).lean(),
        Notice.find({ schoolId: sId }).sort({ createdAt: -1 }).limit(3).lean(),
      ]);

      studentCount = sCount;
      staffCount = stCount;

      if (invoiceAgg.length > 0) {
        totalBilled = invoiceAgg[0].totalBilled || 0;
        totalCollected = invoiceAgg[0].totalPaid || 0;
      }

      if (todayAttendance.length > 0) {
        let totalRecs = 0;
        let presentRecs = 0;
        for (const sheet of todayAttendance) {
          for (const r of sheet.records) {
            totalRecs++;
            if (r.status === "PRESENT") presentRecs++;
          }
        }
        if (totalRecs > 0) {
          todayAttendanceStr = `${Math.round((presentRecs / totalRecs) * 100)}%`;
        }
      }

      if (noticesList.length > 0) {
        recentNotices = noticesList.map((n) => ({
          _id: n._id.toString(),
          title: n.title,
          targetAudience: n.targetAudience,
          priority: n.priority,
          createdAt: n.createdAt,
        }));
      }
    }
  } catch (err) {
    console.error("Dashboard fetch error:", err);
  }

  const collectionRate = totalBilled > 0 ? ((totalCollected / totalBilled) * 100).toFixed(0) : "0";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {session?.schoolName || "Institution Admin"} Dashboard
          </h1>
          <p className="text-sm text-slate-500">
            Welcome back, {session?.name}. Manage academics, students, staff, attendance, and finances.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/school/students"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Admit Student
          </Link>
          <Link
            href="/admin/school/notices"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-semibold shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <Bell className="w-3.5 h-3.5" />
            Broadcast Notice
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Enrolled Students</span>
            <GraduationCap className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-slate-900 dark:text-white">{studentCount}</p>
          <p className="text-xs text-slate-400 mt-1">Active registered learners</p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Faculty & Staff</span>
            <Users className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-slate-900 dark:text-white">{staffCount}</p>
          <p className="text-xs text-slate-400 mt-1">Teachers & personnel</p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Today&apos;s Attendance</span>
            <CalendarCheck className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-emerald-600">{todayAttendanceStr}</p>
          <p className="text-xs text-slate-400 mt-1">
            {todayAttendanceStr === "Pending" ? "Roll calls not yet completed" : "Today's presence percentage"}
          </p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Fee Collection</span>
            <CreditCard className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-slate-900 dark:text-white">
            ${totalCollected.toLocaleString()}
          </p>
          <p className="text-xs text-emerald-600 mt-1">
            {totalBilled > 0 ? `${collectionRate}% of $${totalBilled.toLocaleString()}` : "$0 total billed"}
          </p>
        </div>
      </div>

      {/* Quick Launchpad & Modules */}
      <div>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Quick Modules & Workflows
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/admin/school/attendance"
            className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 shadow-2xs transition group"
          >
            <div className="flex items-center justify-between">
              <CalendarCheck className="w-5 h-5 text-blue-500" />
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
            </div>
            <h3 className="font-bold text-sm mt-3 text-slate-900 dark:text-white">Daily Attendance</h3>
            <p className="text-xs text-slate-500 mt-1">Mark student and staff daily rosters.</p>
          </Link>

          <Link
            href="/admin/school/fees"
            className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 shadow-2xs transition group"
          >
            <div className="flex items-center justify-between">
              <CreditCard className="w-5 h-5 text-emerald-500" />
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
            </div>
            <h3 className="font-bold text-sm mt-3 text-slate-900 dark:text-white">Fee Vouchers</h3>
            <p className="text-xs text-slate-500 mt-1">Batch generate invoices and record receipts.</p>
          </Link>

          <Link
            href="/admin/school/exams"
            className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-600 shadow-2xs transition group"
          >
            <div className="flex items-center justify-between">
              <FileSpreadsheet className="w-5 h-5 text-purple-500" />
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
            </div>
            <h3 className="font-bold text-sm mt-3 text-slate-900 dark:text-white">Exams & Results</h3>
            <p className="text-xs text-slate-500 mt-1">Schedule terms, mark gradebooks, print cards.</p>
          </Link>

          <Link
            href="/admin/school/academics"
            className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-600 shadow-2xs transition group"
          >
            <div className="flex items-center justify-between">
              <BookOpen className="w-5 h-5 text-amber-500" />
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
            </div>
            <h3 className="font-bold text-sm mt-3 text-slate-900 dark:text-white">Academic Setup</h3>
            <p className="text-xs text-slate-500 mt-1">Manage classes, sections, and subjects.</p>
          </Link>
        </div>
      </div>

      {/* Recent Notices Preview */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-blue-500" />
            <h2 className="font-bold text-sm text-slate-900 dark:text-white">Recent Circulars & Notices</h2>
          </div>
          <Link
            href="/admin/school/notices"
            className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
          >
            Manage All Notices <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {recentNotices.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">
            No notices posted yet. Use &quot;Broadcast Notice&quot; above to publish announcements.
          </p>
        ) : (
          <div className="space-y-3">
            {recentNotices.map((n) => (
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
                    <span className="text-[10px] text-slate-400">Target: {n.targetAudience}</span>
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
