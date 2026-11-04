"use client";

import React, { useState, useEffect } from "react";
import {
  CalendarCheck,
  Save,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
} from "lucide-react";

interface StudentRecord {
  studentId: string;
  name: string;
  rollNumber: string;
  admissionNumber: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  remarks: string;
}

interface AllocationItem {
  _id: string;
  classId: { _id: string; name: string };
  sectionName: string;
  subjectId: { _id: string; name: string; code: string };
}

export default function TeacherAttendancePage() {
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [allocations, setAllocations] = useState<AllocationItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSection, setSelectedSection] = useState("A");
  const [studentRecords, setStudentRecords] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isMarked, setIsMarked] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // 1. Fetch Teacher's assigned classes from dedicated API
  useEffect(() => {
    let ignore = false;
    async function loadAllocations() {
      try {
        const res = await fetch("/api/teacher/classes");
        const data = await res.json();
        if (!ignore && data.success) {
          const allocs: AllocationItem[] = data.allocations || [];
          setAllocations(allocs);
          if (allocs.length > 0) {
            setSelectedClassId(allocs[0].classId._id);
            setSelectedSection(allocs[0].sectionName);
          }
        }
      } catch (err) {
        console.error("Load teacher allocations error:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    loadAllocations();
    return () => {
      ignore = true;
    };
  }, []);

  // 2. Fetch Attendance roster when selected class or date changes
  useEffect(() => {
    if (!selectedClassId) return;
    let ignore = false;
    async function loadAttendance() {
      try {
        const res = await fetch(
          `/api/admin/school/attendance?classId=${selectedClassId}&sectionName=${selectedSection}&date=${date}`
        );
        const data = await res.json();
        if (!ignore && data.success) {
          setStudentRecords(data.students || []);
          setIsMarked(data.isMarked);
        }
      } catch (err) {
        console.error("Fetch attendance error:", err);
      }
    }
    loadAttendance();
    return () => {
      ignore = true;
    };
  }, [selectedClassId, selectedSection, date]);

  const handleStatusChange = (
    studentId: string,
    status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED"
  ) => {
    setStudentRecords((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, status } : r))
    );
  };

  const handleMarkAll = (status: "PRESENT" | "ABSENT") => {
    setStudentRecords((prev) => prev.map((r) => ({ ...r, status })));
  };

  const handleSubmit = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/school/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: selectedClassId,
          sectionName: selectedSection,
          date,
          records: studentRecords,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit attendance");

      setMessage({ text: "Attendance sheet recorded successfully!", type: "success" });
      setIsMarked(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving attendance";
      setMessage({ text: msg, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  // Distinct classes and sections from allocations
  const uniqueClassSections = Array.from(
    new Map(
      allocations.map((a) => [
        `${a.classId._id}-${a.sectionName}`,
        { classId: a.classId._id, className: a.classId.name, sectionName: a.sectionName },
      ])
    ).values()
  );

  const presentCount = studentRecords.filter((r) => r.status === "PRESENT").length;
  const absentCount = studentRecords.filter((r) => r.status === "ABSENT").length;
  const lateCount = studentRecords.filter((r) => r.status === "LATE").length;
  const attendanceRate =
    studentRecords.length > 0
      ? ((presentCount / studentRecords.length) * 100).toFixed(0)
      : "0";

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Daily Class Roll Call
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Mark Student Attendance
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Take roll call for your assigned classes. Students and guardians receive immediate presence updates.
          </p>
        </div>

        {studentRecords.length > 0 && (
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition disabled:opacity-50 cursor-pointer self-start sm:self-auto"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isMarked ? "Update Attendance Sheet" : "Submit Attendance Roster"}</span>
          </button>
        )}
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between border ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
              : "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {message.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-xs hover:opacity-75">✕</button>
        </div>
      )}

      {/* Class Selector Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Select Allocated Class
            </label>
            {uniqueClassSections.length === 0 ? (
              <span className="text-xs text-amber-600 font-semibold">No classes assigned to you</span>
            ) : (
              <select
                value={`${selectedClassId}___${selectedSection}`}
                onChange={(e) => {
                  const [cId, sec] = e.target.value.split("___");
                  setSelectedClassId(cId);
                  setSelectedSection(sec);
                }}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
              >
                {uniqueClassSections.map((cs) => (
                  <option key={`${cs.classId}___${cs.sectionName}`} value={`${cs.classId}___${cs.sectionName}`}>
                    {cs.className} - Section {cs.sectionName}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Attendance Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {studentRecords.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleMarkAll("PRESENT")}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 transition cursor-pointer"
            >
              Mark All Present
            </button>
            <button
              onClick={() => handleMarkAll("ABSENT")}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 transition cursor-pointer"
            >
              Mark All Absent
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="p-16 text-center flex flex-col items-center justify-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <Loader2 className="w-7 h-7 animate-spin text-emerald-600 mb-2" />
          <p className="text-xs font-medium">Loading your assigned classes...</p>
        </div>
      ) : uniqueClassSections.length === 0 ? (
        <div className="p-16 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">No Teaching Allocations Found</h3>
          <p className="text-xs max-w-md mx-auto mt-1 text-slate-500">
            You are not currently allocated to any class. Please ask your Institution Admin to assign your classes and subjects in the Faculty Management portal.
          </p>
        </div>
      ) : studentRecords.length === 0 ? (
        <div className="p-16 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <CalendarCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">No Students In This Class</h3>
          <p className="text-xs text-slate-400 mt-1">There are no active enrolled students registered in this section yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400">Total Enrolled</span>
              <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">{studentRecords.length}</p>
            </div>
            <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase text-emerald-600">Present</span>
              <p className="text-xl font-extrabold text-emerald-600 mt-0.5">{presentCount}</p>
            </div>
            <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase text-rose-600">Absent</span>
              <p className="text-xl font-extrabold text-rose-600 mt-0.5">{absentCount}</p>
            </div>
            <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase text-blue-600">Attendance Rate</span>
              <p className="text-xl font-extrabold text-blue-600 mt-0.5">{attendanceRate}%</p>
            </div>
          </div>

          {/* Roster Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Roll No</th>
                  <th className="py-3.5 px-4">Student Name</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4">Teacher Note / Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {studentRecords.map((r) => (
                  <tr key={r.studentId} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                      {r.rollNumber}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {r.name}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(r.studentId, "PRESENT")}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                            r.status === "PRESENT"
                              ? "bg-emerald-600 text-white shadow-2xs"
                              : "bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 dark:bg-slate-800 dark:text-slate-300"
                          }`}
                        >
                          Present
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(r.studentId, "ABSENT")}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                            r.status === "ABSENT"
                              ? "bg-rose-600 text-white shadow-2xs"
                              : "bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700 dark:bg-slate-800 dark:text-slate-300"
                          }`}
                        >
                          Absent
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(r.studentId, "LATE")}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                            r.status === "LATE"
                              ? "bg-amber-600 text-white shadow-2xs"
                              : "bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700 dark:bg-slate-800 dark:text-slate-300"
                          }`}
                        >
                          Late
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        placeholder="Optional remarks..."
                        value={r.remarks}
                        onChange={(e) => {
                          const val = e.target.value;
                          setStudentRecords((prev) =>
                            prev.map((item) =>
                              item.studentId === r.studentId ? { ...item, remarks: val } : item
                            )
                          );
                        }}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs focus:ring-1 focus:ring-emerald-500"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
