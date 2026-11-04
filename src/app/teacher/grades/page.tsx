"use client";

import React, { useState, useEffect } from "react";
import {
  Save,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Award,
  Layers,
  HelpCircle,
} from "lucide-react";

interface ExamItem {
  _id: string;
  title: string;
  term: string;
}

interface AllocationItem {
  _id: string;
  classId: { _id: string; name: string };
  sectionName: string;
  subjectId: { _id: string; name: string; code: string; totalMarks?: number; passMarks?: number };
}

interface MarkRow {
  studentId: string;
  name: string;
  rollNumber: string;
  obtainedMarks: number;
  totalMarks: number;
  grade: string;
  remarks: string;
}

export default function TeacherGradebookPage() {
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [allocations, setAllocations] = useState<AllocationItem[]>([]);
  const [selectedAllocationId, setSelectedAllocationId] = useState("");
  const [selectedExamId, setSelectedExamId] = useState("");
  const [marksRoster, setMarksRoster] = useState<MarkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingRoster, setFetchingRoster] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // 1. Load exams and teacher's assigned classes & subjects
  useEffect(() => {
    let ignore = false;
    async function loadMeta() {
      try {
        const [examRes, allocRes] = await Promise.all([
          fetch("/api/admin/school/exams"),
          fetch("/api/teacher/classes"),
        ]);
        const eData = await examRes.json();
        const aData = await allocRes.json();

        if (!ignore) {
          if (eData.success && Array.isArray(eData.exams)) {
            setExams(eData.exams);
            if (eData.exams.length > 0) {
              setSelectedExamId(eData.exams[0]._id);
            }
          }
          if (aData.success && Array.isArray(aData.allocations)) {
            const validAllocs = aData.allocations.filter(
              (a: AllocationItem) => a.classId && a.subjectId
            );
            setAllocations(validAllocs);
            if (validAllocs.length > 0) {
              setSelectedAllocationId(validAllocs[0]._id);
            }
          }
        }
      } catch (err) {
        console.error("Teacher gradebook meta load error:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    loadMeta();
    return () => {
      ignore = true;
    };
  }, []);

  const activeAllocation = allocations.find((a) => a._id === selectedAllocationId);

  // 2. Fetch marks roster when exam or active allocation changes
  useEffect(() => {
    if (!selectedExamId || !activeAllocation) return;

    let ignore = false;
    async function fetchMarks() {
      setFetchingRoster(true);
      try {
        const classId = activeAllocation?.classId._id;
        const sectionName = activeAllocation?.sectionName;
        const subjectId = activeAllocation?.subjectId._id;

        const res = await fetch(
          `/api/admin/school/exams/marks?examId=${selectedExamId}&classId=${classId}&sectionName=${sectionName}&subjectId=${subjectId}`
        );
        const data = await res.json();
        if (!ignore && data.success) {
          setMarksRoster(data.roster || []);
        }
      } catch (err) {
        console.error("Fetch marks error:", err);
      } finally {
        if (!ignore) setFetchingRoster(false);
      }
    }

    fetchMarks();
    return () => {
      ignore = true;
    };
  }, [selectedExamId, selectedAllocationId]);

  const computeGrade = (obtained: number, total: number) => {
    if (total <= 0) return "F";
    const p = (obtained / total) * 100;
    if (p >= 90) return "A+";
    if (p >= 80) return "A";
    if (p >= 70) return "B";
    if (p >= 60) return "C";
    if (p >= 50) return "D";
    return "F";
  };

  const handleSaveMarks = async () => {
    if (!activeAllocation || !selectedExamId) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/school/exams/marks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId: selectedExamId,
          classId: activeAllocation.classId._id,
          sectionName: activeAllocation.sectionName,
          subjectId: activeAllocation.subjectId._id,
          marks: marksRoster,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit marks");

      setMessage({ text: "Grades and marksheet updated successfully!", type: "success" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving marks";
      setMessage({ text: msg, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Faculty Gradebook</h1>
          <p className="text-sm text-slate-500">
            Submit examination scores, letter grades, and performance notes for your allocated subjects.
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-xl text-xs font-medium flex items-center justify-between border ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
              : "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-[11px] hover:underline cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {loading ? (
        <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
          <p className="text-xs font-medium text-slate-500">Loading teaching assignments and exams...</p>
        </div>
      ) : allocations.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No Teaching Allocations Found
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            You do not have any classes or subjects assigned to your faculty profile yet. Please contact your school administrator to assign your classes in the Staff Directory.
          </p>
        </div>
      ) : exams.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
          <Award className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No Scheduled Examinations
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            The academic administration has not scheduled any active examination terms yet. Marks entry opens once an exam is created in the Examinations module.
          </p>
        </div>
      ) : (
        <>
          {/* Controls Bar */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-500 uppercase tracking-wider text-[11px]">Exam:</span>
                <select
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                >
                  {exams.map((ex) => (
                    <option key={ex._id} value={ex._id}>
                      {ex.title} ({ex.term})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-500 uppercase tracking-wider text-[11px]">Assignment:</span>
                <select
                  value={selectedAllocationId}
                  onChange={(e) => setSelectedAllocationId(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold max-w-xs truncate"
                >
                  {allocations.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.classId.name} - Sec {a.sectionName} • {a.subjectId.name} ({a.subjectId.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleSaveMarks}
              disabled={saving || marksRoster.length === 0}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer transition"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save & Publish Grades</span>
            </button>
          </div>

          {/* Student Marksheet Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
            {fetchingRoster ? (
              <div className="p-16 text-center flex flex-col items-center justify-center text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600 mb-2" />
                <p className="text-xs">Fetching class student roster...</p>
              </div>
            ) : marksRoster.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs space-y-1">
                <p className="font-medium text-slate-700 dark:text-slate-300">
                  No enrolled students found in {activeAllocation?.classId.name} - Section {activeAllocation?.sectionName}.
                </p>
                <p className="text-slate-400">
                  Once students are admitted to this class, they will appear here automatically for marks entry.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Roll #</th>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4 w-36">Obtained Marks</th>
                      <th className="py-3 px-4">Max Marks</th>
                      <th className="py-3 px-4 text-center">Grade</th>
                      <th className="py-3 px-4">Performance Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {marksRoster.map((m, idx) => (
                      <tr key={m.studentId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                        <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                          {m.rollNumber}
                        </td>

                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                          {m.name}
                        </td>

                        <td className="py-3 px-4">
                          <input
                            type="number"
                            min="0"
                            max={m.totalMarks}
                            value={m.obtainedMarks}
                            onChange={(e) => {
                              const updated = [...marksRoster];
                              const val = Math.max(0, Math.min(Number(e.target.value) || 0, m.totalMarks));
                              updated[idx].obtainedMarks = val;
                              updated[idx].grade = computeGrade(val, updated[idx].totalMarks);
                              setMarksRoster(updated);
                            }}
                            className="w-24 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-center focus:ring-2 focus:ring-blue-500 outline-hidden"
                          />
                        </td>

                        <td className="py-3 px-4 font-semibold text-slate-500">
                          {m.totalMarks}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-md font-extrabold text-[11px] border ${
                              m.grade === "A+" || m.grade === "A"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
                                : m.grade === "B" || m.grade === "C"
                                ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300"
                                : m.grade === "D"
                                ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300"
                                : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300"
                            }`}
                          >
                            {m.grade}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <input
                            type="text"
                            placeholder="e.g. Excellent grasp of concepts"
                            value={m.remarks}
                            onChange={(e) => {
                              const updated = [...marksRoster];
                              updated[idx].remarks = e.target.value;
                              setMarksRoster(updated);
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-500 outline-hidden"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
