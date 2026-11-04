"use client";

import React, { useState, useEffect } from "react";
import {
  Save,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface ExamItem {
  _id: string;
  title: string;
}

interface ClassItem {
  _id: string;
  name: string;
  sections: { name: string }[];
}

interface SubjectItem {
  _id: string;
  name: string;
  code: string;
  totalMarks: number;
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
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSection, setSelectedSection] = useState("A");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [marksRoster, setMarksRoster] = useState<MarkRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    let ignore = false;
    async function loadMeta() {
      try {
        const [examRes, classRes, subRes] = await Promise.all([
          fetch("/api/admin/school/exams"),
          fetch("/api/admin/school/academics/classes"),
          fetch("/api/admin/school/academics/subjects"),
        ]);
        const eData = await examRes.json();
        const cData = await classRes.json();
        const sData = await subRes.json();

        if (!ignore) {
          if (eData.success && eData.exams.length > 0) {
            setExams(eData.exams);
            setSelectedExamId(eData.exams[0]._id);
          }
          if (cData.success && cData.classes.length > 0) {
            setClasses(cData.classes);
            setSelectedClassId(cData.classes[0]._id);
            setSelectedSection(cData.classes[0].sections[0]?.name || "A");
          }
          if (sData.success && sData.subjects.length > 0) {
            setSubjects(sData.subjects);
            setSelectedSubjectId(sData.subjects[0]._id);
          }
        }
      } catch (err) {
        console.error("Teacher gradebook meta load error:", err);
      }
    }
    loadMeta();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedExamId || !selectedClassId || !selectedSubjectId) return;
    let ignore = false;
    async function fetchMarks() {
      try {
        const res = await fetch(
          `/api/admin/school/exams/marks?examId=${selectedExamId}&classId=${selectedClassId}&sectionName=${selectedSection}&subjectId=${selectedSubjectId}`
        );
        const data = await res.json();
        if (!ignore && data.success) {
          setMarksRoster(data.roster);
        }
      } catch (err) {
        console.error("Fetch marks error:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    fetchMarks();
    return () => {
      ignore = true;
    };
  }, [selectedExamId, selectedClassId, selectedSection, selectedSubjectId]);

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
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/school/exams/marks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId: selectedExamId,
          classId: selectedClassId,
          sectionName: selectedSection,
          subjectId: selectedSubjectId,
          marks: marksRoster,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit marks");

      setMessage({ text: "Exam marks submitted successfully!", type: "success" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving marks";
      setMessage({ text: msg, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Faculty Gradebook</h1>
        <p className="text-sm text-slate-500">
          Enter examination marks and remarks for your assigned subjects.
        </p>
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

      {/* Selectors */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="font-medium mr-1.5">Exam:</label>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
            >
              {exams.map((ex) => (
                <option key={ex._id} value={ex._id}>
                  {ex.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-medium mr-1.5">Class:</label>
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                const found = classes.find((c) => c._id === e.target.value);
                if (found && found.sections.length > 0) {
                  setSelectedSection(found.sections[0].name);
                }
              }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
            >
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-medium mr-1.5">Section:</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
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

          <div>
            <label className="font-medium mr-1.5">Subject:</label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
            >
              {subjects.map((sub) => (
                <option key={sub._id} value={sub._id}>
                  {sub.name} ({sub.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleSaveMarks}
          disabled={saving || marksRoster.length === 0}
          className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-1.5 shadow-xs disabled:opacity-60 cursor-pointer"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          <span>Save Grades</span>
        </button>
      </div>

      {/* Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600 mb-2" />
            <p className="text-xs">Loading gradebook...</p>
          </div>
        ) : marksRoster.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No students found in this class section or select a subject above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-400 font-semibold uppercase">
                  <th className="py-2.5 px-4">Roll #</th>
                  <th className="py-2.5 px-4">Student Name</th>
                  <th className="py-2.5 px-4">Marks Obtained</th>
                  <th className="py-2.5 px-4">Max Marks</th>
                  <th className="py-2.5 px-4 text-center">Grade</th>
                  <th className="py-2.5 px-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {marksRoster.map((m, idx) => (
                  <tr key={m.studentId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30">
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                      {m.rollNumber}
                    </td>

                    <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">
                      {m.name}
                    </td>

                    <td className="py-2.5 px-4 w-32">
                      <input
                        type="number"
                        min="0"
                        max={m.totalMarks}
                        value={m.obtainedMarks}
                        onChange={(e) => {
                          const updated = [...marksRoster];
                          const val = Number(e.target.value);
                          updated[idx].obtainedMarks = val;
                          updated[idx].grade = computeGrade(val, updated[idx].totalMarks);
                          setMarksRoster(updated);
                        }}
                        className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                      />
                    </td>

                    <td className="py-2.5 px-4 font-semibold text-slate-500">{m.totalMarks}</td>

                    <td className="py-2.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded font-bold text-[11px] bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300">
                        {m.grade}
                      </span>
                    </td>

                    <td className="py-2.5 px-4">
                      <input
                        type="text"
                        placeholder="Good effort / Needs work..."
                        value={m.remarks}
                        onChange={(e) => {
                          const updated = [...marksRoster];
                          updated[idx].remarks = e.target.value;
                          setMarksRoster(updated);
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
