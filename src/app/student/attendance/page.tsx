import React from "react";
import { getSession } from "@/lib/auth";
import { CalendarCheck } from "lucide-react";

export default async function StudentAttendancePage() {
  const session = await getSession();

  const mockAttendance = [
    { date: "2026-11-03", status: "PRESENT", remarks: "On time" },
    { date: "2026-11-02", status: "PRESENT", remarks: "On time" },
    { date: "2026-11-01", status: "PRESENT", remarks: "On time" },
    { date: "2026-10-31", status: "LATE", remarks: "Bus delay" },
    { date: "2026-10-30", status: "PRESENT", remarks: "On time" },
    { date: "2026-10-29", status: "PRESENT", remarks: "On time" },
    { date: "2026-10-28", status: "ABSENT", remarks: "Sick leave (Excused)" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Attendance Record</h1>
        <p className="text-sm text-slate-500">
          Attendance summary for {session?.name} (Grade 10-A).
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs uppercase font-semibold text-slate-400">Total School Days</span>
          <p className="text-2xl font-bold mt-1">45</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs uppercase font-semibold text-emerald-500">Days Present</span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">44</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs uppercase font-semibold text-rose-500">Days Absent</span>
          <p className="text-2xl font-bold text-rose-600 mt-1">1</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs uppercase font-semibold text-blue-500">Overall Rate</span>
          <p className="text-2xl font-bold text-blue-600 mt-1">97.8%</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs">
        <h2 className="font-bold text-sm mb-4">Recent Daily Logs</h2>
        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {mockAttendance.map((log, idx) => (
            <div key={idx} className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-slate-400" />
                <span className="font-semibold text-slate-900 dark:text-white">{log.date}</span>
                <span className="text-slate-400">({log.remarks})</span>
              </div>

              <div>
                {log.status === "PRESENT" && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300">
                    Present
                  </span>
                )}
                {log.status === "LATE" && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300">
                    Late
                  </span>
                )}
                {log.status === "ABSENT" && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300">
                    Absent
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
