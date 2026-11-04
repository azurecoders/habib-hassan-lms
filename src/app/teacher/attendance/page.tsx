"use client";

import React, { useState, useEffect } from "react";
import {
  Save,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface StudentRecord {
  studentId: string;
  name: string;
  rollNumber: string;
  admissionNumber: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  remarks: string;
}

interface ClassItem {
  _id: string;
  name: string;
  sections: { name: string }[];
}

export default function TeacherAttendancePage() {
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSection, setSelectedSection] = useState("A");
  const [studentRecords, setStudentRecords] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isMarked, setIsMarked] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetch("/api/admin/school/academics/classes");
        const data = await res.json();
        if (!ignore && data.success && data.classes.length > 0) {
          setClasses(data.classes);
          setSelectedClassId(data.classes[0]._id);
          setSelectedSection(data.classes[0].sections[0]?.name || "A");
        }
      } catch (err) {
        console.error("Teacher load classes error:", err);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

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
          setStudentRecords(data.records);
          setIsMarked(data.isMarked);
        }
      } catch (err) {
        console.error("Fetch attendance error:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    loadAttendance();
    return () => {
      ignore = true;
    };
  }, [selectedClassId, selectedSection, date]);

  const markAll = (status: "PRESENT" | "ABSENT") => {
    setStudentRecords((prev) => prev.map((s) => ({ ...s, status })));
  };

  const handleSave = async () => {
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
      if (!res.ok) throw new Error(data.error || "Failed to save attendance");

      setMessage({ text: "Attendance submitted successfully!", type: "success" });
      setIsMarked(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving attendance";
      setMessage({ text: msg, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const presentCount = studentRecords.filter((s) => s.status === "PRESENT").length;
  const absentCount = studentRecords.filter((s) => s.status === "ABSENT").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mark Class Attendance</h1>
          <p className="text-sm text-slate-500">
            Submit daily student attendance for your assigned class periods.
          </p>
        </div>

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
        />
      </div>

      {message && (
        <div
          className={`p-3 rounded-lg text-xs font-medium flex items-center justify-between border ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
              : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-[11px] hover:underline">
            ✕
          </button>
        </div>
      )}

      {/* Class Selector Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div>
            <label className="font-medium mr-2">Class:</label>
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                const found = classes.find((c) => c._id === e.target.value);
                if (found && found.sections.length > 0) {
                  setSelectedSection(found.sections[0].name);
                }
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
            >
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-medium mr-2">Section:</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
            >
              {classes
                .find((c) => c._id === selectedClassId)
                ?.sections.map((sec, idx) => (
                  <option key={idx} value={sec.name}>
                    Section {sec.name}
                  </option>
                )) || <option value="A">Section A</option>}
            </select>
          </div>

          {isMarked ? (
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 font-semibold text-[10px]">
              ● Marked ({presentCount} Present / {absentCount} Absent)
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 font-semibold text-[10px]">
              ○ Unsaved Draft ({presentCount} Present / {absentCount} Absent)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => markAll("PRESENT")}
            className="px-3 py-1.5 rounded-lg border border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-medium"
          >
            Mark All Present
          </button>
          <button
            type="button"
            onClick={() => markAll("ABSENT")}
            className="px-3 py-1.5 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 font-medium"
          >
            Mark All Absent
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || studentRecords.length === 0}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-1.5 shadow-xs disabled:opacity-60 cursor-pointer"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Submit Attendance</span>
          </button>
        </div>
      </div>

      {/* Student List */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600 mb-2" />
            <p className="text-xs">Loading class roster...</p>
          </div>
        ) : studentRecords.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No students found in this class section.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-400 font-semibold uppercase">
                  <th className="py-2.5 px-4">Roll #</th>
                  <th className="py-2.5 px-4">Student Name</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                  <th className="py-2.5 px-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {studentRecords.map((s, idx) => (
                  <tr key={s.studentId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30">
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                      {s.rollNumber}
                    </td>

                    <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">
                      {s.name}
                    </td>

                    <td className="py-2.5 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...studentRecords];
                            updated[idx].status = "PRESENT";
                            setStudentRecords(updated);
                          }}
                          className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                            s.status === "PRESENT"
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                          }`}
                        >
                          Present
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...studentRecords];
                            updated[idx].status = "ABSENT";
                            setStudentRecords(updated);
                          }}
                          className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                            s.status === "ABSENT"
                              ? "bg-rose-600 text-white"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                          }`}
                        >
                          Absent
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...studentRecords];
                            updated[idx].status = "LATE";
                            setStudentRecords(updated);
                          }}
                          className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                            s.status === "LATE"
                              ? "bg-amber-600 text-white"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                          }`}
                        >
                          Late
                        </button>
                      </div>
                    </td>

                    <td className="py-2.5 px-4">
                      <input
                        type="text"
                        placeholder="Optional note..."
                        value={s.remarks}
                        onChange={(e) => {
                          const updated = [...studentRecords];
                          updated[idx].remarks = e.target.value;
                          setStudentRecords(updated);
                        }}
                        className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px]"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
