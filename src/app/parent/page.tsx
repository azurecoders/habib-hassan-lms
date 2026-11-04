import React from "react";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import StudentProfile from "@/models/StudentProfile";
import Notice from "@/models/Notice";
import Attendance from "@/models/Attendance";
import ExamResult from "@/models/ExamResult";
import FeeInvoice from "@/models/FeeInvoice";
import {
  CalendarCheck,
  CreditCard,
  FileSpreadsheet,
  Bell,
  ArrowRight,
  Printer,
  Sparkles,
  User,
  AlertCircle,
} from "lucide-react";

export default async function ParentDashboardPage() {
  const session = await getSession();

  let childProfile = null;
  let childName = "";
  let childClass = "";
  let rollNumber = "";
  let attendanceRate = 0;
  let totalSchoolDays = 0;
  let daysPresent = 0;
  let averageExamPercentage: number | null = null;
  let overallExamGrade = "N/A";
  let feeStanding = "All Cleared";
  let feeDueAmount = 0;
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
        childProfile = student;
        const u = student.userId as unknown as { name?: string };
        const c = student.classId as unknown as { name?: string };
        childName = u?.name || "Enrolled Ward";
        childClass = `${c?.name || "Grade"} - Section ${student.sectionName}`;
        rollNumber = student.rollNumber;

        // 1. Calculate Real Child Attendance
        const sheets = await Attendance.find({
          schoolId: session.schoolId,
          classId: student.classId,
          sectionName: student.sectionName,
        })
          .sort({ date: -1 })
          .limit(60)
          .lean();

        for (const sheet of sheets) {
          const rec = sheet.records.find(
            (r) => r.studentId.toString() === student._id.toString()
          );
          if (rec) {
            totalSchoolDays++;
            if (rec.status === "PRESENT") daysPresent++;
          }
        }
        if (totalSchoolDays > 0) {
          attendanceRate = Math.round((daysPresent / totalSchoolDays) * 100);
        }

        // 2. Calculate Real Child Exam Results
        const examResults = await ExamResult.find({
          schoolId: session.schoolId,
          classId: student.classId,
          "marks.studentId": student._id,
        }).lean();

        if (examResults.length > 0) {
          let totalMax = 0;
          let totalObtained = 0;

          for (const er of examResults) {
            const mark = er.marks.find(
              (m) => m.studentId.toString() === student._id.toString()
            );
            if (mark) {
              totalObtained += mark.obtainedMarks || 0;
              totalMax += mark.totalMarks || 100;
            }
          }

          if (totalMax > 0) {
            averageExamPercentage = Math.round((totalObtained / totalMax) * 100);
            if (averageExamPercentage >= 90) overallExamGrade = "Grade A+";
            else if (averageExamPercentage >= 80) overallExamGrade = "Grade A";
            else if (averageExamPercentage >= 70) overallExamGrade = "Grade B";
            else if (averageExamPercentage >= 60) overallExamGrade = "Grade C";
            else if (averageExamPercentage >= 50) overallExamGrade = "Grade D";
            else overallExamGrade = "Grade F";
          }
        }

        // 3. Calculate Real Child Fees
        const invoices = await FeeInvoice.find({
          schoolId: session.schoolId,
          studentId: student._id,
        }).lean();

        for (const inv of invoices) {
          if (inv.status !== "PAID") {
            feeDueAmount += (inv.totalAmount || 0) - (inv.paidAmount || 0);
          }
        }
        if (feeDueAmount > 0) {
          feeStanding = `$${feeDueAmount} Due`;
        }
      }

      // 4. Load Parent Notices
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
            Welcome, {session?.name}. Monitor your child&apos;s daily attendance, academic scores, and fee vouchers.
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

      {!childProfile ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
          <User className="w-12 h-12 text-amber-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No Student Linked to Account
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            There is currently no student admission record linked to your guardian email ({session?.email}). Please contact the school administration to ensure your guardian profile is attached to your child&apos;s admission record.
          </p>
        </div>
      ) : (
        <>
          {/* Child Summary Hero */}
          <div className="p-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 rounded-2xl text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-blue-200 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Enrolled Ward
              </span>
              <h2 className="text-2xl font-extrabold mt-1">{childName}</h2>
              <p className="text-xs text-blue-100 mt-0.5">{childClass} • Roll No: {rollNumber}</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="bg-white/10 backdrop-blur-xs px-4 py-2.5 rounded-xl border border-white/20 text-center">
                <span className="text-[10px] uppercase font-bold text-blue-200">Attendance</span>
                <p className="text-lg font-extrabold">{totalSchoolDays > 0 ? `${attendanceRate}%` : "No logs"}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-xs px-4 py-2.5 rounded-xl border border-white/20 text-center">
                <span className="text-[10px] uppercase font-bold text-blue-200">Academic Standing</span>
                <p className="text-lg font-extrabold">{overallExamGrade}</p>
              </div>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/parent/attendance"
              className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 shadow-2xs transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase">Monthly Attendance</span>
                <CalendarCheck className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-2xl font-extrabold mt-2 text-emerald-600">
                {totalSchoolDays > 0 ? `${daysPresent} / ${totalSchoolDays} Days` : "0 Days"}
              </p>
              <p className="text-xs text-slate-400 mt-1 flex items-center justify-between">
                <span>{totalSchoolDays > 0 ? `${attendanceRate}% presence rate` : "No roll calls recorded"}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
              </p>
            </Link>

            <Link
              href="/parent/fees"
              className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 shadow-2xs transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase">Fee Invoices</span>
                <CreditCard className="w-5 h-5 text-emerald-500" />
              </div>
              <p
                className={`text-2xl font-extrabold mt-2 ${
                  feeDueAmount > 0 ? "text-amber-600" : "text-emerald-600"
                }`}
              >
                {feeStanding}
              </p>
              <p className="text-xs text-slate-400 mt-1 flex items-center justify-between">
                <span>{feeDueAmount > 0 ? "Pending payment balance" : "Zero outstanding balance"}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
              </p>
            </Link>

            <Link
              href="/parent/reports"
              className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-600 shadow-2xs transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase">Academic Transcript</span>
                <FileSpreadsheet className="w-5 h-5 text-purple-500" />
              </div>
              <p className="text-2xl font-extrabold mt-2 text-purple-600">
                {averageExamPercentage !== null ? `${averageExamPercentage}% Agg.` : "Pending"}
              </p>
              <p className="text-xs text-slate-400 mt-1 flex items-center justify-between">
                <span>{averageExamPercentage !== null ? "View comprehensive report card" : "Awaiting exam marks"}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
              </p>
            </Link>
          </div>
        </>
      )}

      {/* Parent Notices Preview */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xs">
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
          <p className="text-xs text-slate-400 py-4 text-center">
            No active school circulars for parents.
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
