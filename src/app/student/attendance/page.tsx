"use client";

import React, { useEffect, useState } from "react";
import { CalendarCheck, Loader2, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";

interface AttendanceLog {
  date: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  remarks?: string;
}

interface StudentInfo {
  admissionNumber: string;
  rollNumber: string;
  sectionName: string;
  classId?: { name: string };
}

export default function StudentAttendancePage() {
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [totalDays, setTotalDays] = useState(0);
  const [presentDays, setPresentDays] = useState(0);
  const [absentDays, setAbsentDays] = useState(0);
  const [lateDays, setLateDays] = useState(0);
  const [rate, setRate] = useState(0);
  const [records, setRecords] = useState<AttendanceLog[]>([]);

  useEffect(() => {
    let ignore = false;
    async function fetchAttendance() {
      try {
        const res = await fetch("/api/admin/school/attendance");
        const data = await res.json();
        if (!ignore && data.success) {
          setStudent(data.student);
          setTotalDays(data.totalDays || 0);
          setPresentDays(data.presentDays || 0);
          setAbsentDays(data.absentDays || 0);
          setLateDays(data.lateDays || 0);
          setRate(data.rate || 0);
          setRecords(data.records || []);
        }
      } catch (err) {
        console.error("Failed to load student attendance:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    fetchAttendance();
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Attendance Record</h1>
          <p className="text-sm text-slate-500">
            {student?.classId?.name
              ? `${student.classId.name} - Section ${student.sectionName} • Roll: ${student.rollNumber}`
              : "Daily roll-call log and attendance presence rates"}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
          <p className="text-xs font-medium text-slate-500">Loading your attendance logs...</p>
        </div>
      ) : !student ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            Student Profile Not Found
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Your user account is not linked to an active student admission record. Please contact your school administrator.
          </p>
        </div>
      ) : (
        <>
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-xs uppercase font-semibold text-slate-400">Total School Days</span>
              <p className="text-2xl font-extrabold mt-1 text-slate-900 dark:text-white">{totalDays}</p>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-xs uppercase font-semibold text-emerald-500">Days Present</span>
              <p className="text-2xl font-extrabold text-emerald-600 mt-1">{presentDays}</p>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-xs uppercase font-semibold text-rose-500">Days Absent</span>
              <p className="text-2xl font-extrabold text-rose-600 mt-1">{absentDays}</p>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-xs uppercase font-semibold text-blue-500">Overall Rate</span>
              <p className="text-2xl font-extrabold text-blue-600 mt-1">{rate}%</p>
            </div>
          </div>

          {/* Daily Logs */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs">
            <h2 className="font-bold text-sm mb-4 text-slate-900 dark:text-white">Recent Daily Logs</h2>
            {records.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                <CalendarCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                No daily attendance logs recorded yet for this academic session.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {records.map((log, idx) => (
                  <div key={idx} className="py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <CalendarCheck className="w-4 h-4 text-slate-400" />
                      <span className="font-semibold text-slate-900 dark:text-white">{log.date}</span>
                      {log.remarks && (
                        <span className="text-slate-400 text-[11px]">({log.remarks})</span>
                      )}
                    </div>

                    <div>
                      {log.status === "PRESENT" && (
                        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300">
                          Present
                        </span>
                      )}
                      {log.status === "LATE" && (
                        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300">
                          Late
                        </span>
                      )}
                      {log.status === "ABSENT" && (
                        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300">
                          Absent
                        </span>
                      )}
                      {log.status === "EXCUSED" && (
                        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300">
                          Excused
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
