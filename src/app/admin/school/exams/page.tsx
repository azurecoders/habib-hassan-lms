"use client";

import React, { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  Plus,
  Save,
  Printer,
  Calendar,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Award,
} from "lucide-react";

interface ExamItem {
  _id: string;
  title: string;
  term: string;
  startDate: string;
  endDate: string;
  status: string;
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
  passMarks: number;
  totalMarks: number;
  classId?: { _id: string } | string;
}

interface StudentItem {
  _id: string;
  admissionNumber: string;
  rollNumber: string;
  sectionName: string;
  userId?: { name: string };
  classId?: { _id: string; name: string };
}

interface MarkRow {
  studentId: string;
  name: string;
  rollNumber: string;
  admissionNumber: string;
  obtainedMarks: number;
  totalMarks: number;
  grade: string;
  remarks: string;
}

interface ReportCardData {
  schoolName: string;
  studentName: string;
  admissionNumber: string;
  rollNumber: string;
  className: string;
  sectionName: string;
  examTitle: string;
  term: string;
  subjects: {
    subjectName: string;
    subjectCode: string;
    passMarks: number;
    totalMarks: number;
    obtainedMarks: number;
    grade: string;
    remarks: string;
  }[];
  grandTotal: number;
  grandObtained: number;
  percentage: number;
  overallGrade: string;
  status: string;
}

export default function ExamsManagementPage() {
  const [activeTab, setActiveTab] = useState<"exams" | "marks" | "reports">("exams");
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);

  // Marks Entry State
  const [selectedExamId, setSelectedExamId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSection, setSelectedSection] = useState("A");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [marksRoster, setMarksRoster] = useState<MarkRow[]>([]);
  const [loadingMarks, setLoadingMarks] = useState(false);
  const [savingMarks, setSavingMarks] = useState(false);

  // Report Card State
  const [reportStudentId, setReportStudentId] = useState("");
  const [reportExamId, setReportExamId] = useState("");
  const [reportCard, setReportCard] = useState<ReportCardData | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  // New Exam Form
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [newExamTitle, setNewExamTitle] = useState("Mid-Term Examination 2026");
  const [newExamTerm, setNewExamTerm] = useState("Term 1");
  const [newExamStart, setNewExamStart] = useState("2026-11-20");
  const [newExamEnd, setNewExamEnd] = useState("2026-11-28");
  const [creatingExam, setCreatingExam] = useState(false);

  const [feedback, setFeedback] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const refreshExams = async () => {
    try {
      const res = await fetch("/api/admin/school/exams");
      const data = await res.json();
      if (data.success) setExams(data.exams);
    } catch (err) {
      console.error("Failed to load exams:", err);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const [examRes, classRes, subRes, stuRes] = await Promise.all([
          fetch("/api/admin/school/exams"),
          fetch("/api/admin/school/academics/classes"),
          fetch("/api/admin/school/academics/subjects"),
          fetch("/api/admin/school/students"),
        ]);

        const eData = await examRes.json();
        const cData = await classRes.json();
        const sData = await subRes.json();
        const stData = await stuRes.json();

        if (!ignore) {
          if (eData.success && eData.exams.length > 0) {
            setExams(eData.exams);
            setSelectedExamId(eData.exams[0]._id);
            setReportExamId(eData.exams[0]._id);
          }
          if (cData.success && cData.classes.length > 0) {
            setClasses(cData.classes);
            setSelectedClassId(cData.classes[0]._id);
            setSelectedSection(cData.classes[0].sections[0]?.name || "A");
          }
          if (sData.success) {
            setSubjects(sData.subjects);
            if (sData.subjects.length > 0) setSelectedSubjectId(sData.subjects[0]._id);
          }
          if (stData.success && stData.students.length > 0) {
            setStudents(stData.students);
            setReportStudentId(stData.students[0]._id);
          }
        }
      } catch (err) {
        console.error("Init exams error:", err);
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, []);

  // Fetch Marks when class/subject/exam changes
  useEffect(() => {
    if (activeTab !== "marks" || !selectedExamId || !selectedClassId || !selectedSubjectId) return;
    let ignore = false;
    async function loadMarks() {
      try {
        const res = await fetch(
          `/api/admin/school/exams/marks?examId=${selectedExamId}&classId=${selectedClassId}&sectionName=${selectedSection}&subjectId=${selectedSubjectId}`
        );
        const data = await res.json();
        if (!ignore && data.success) {
          setMarksRoster(data.roster);
        }
      } catch (err) {
        console.error("Failed to load marks roster:", err);
      } finally {
        if (!ignore) setLoadingMarks(false);
      }
    }
    loadMarks();
    return () => {
      ignore = true;
    };
  }, [activeTab, selectedExamId, selectedClassId, selectedSection, selectedSubjectId]);

  // Fetch Report Card
  const fetchReportCard = async () => {
    if (!reportStudentId || !reportExamId) return;
    setLoadingReport(true);
    try {
      const res = await fetch(
        `/api/admin/school/exams/report-card?studentId=${reportStudentId}&examId=${reportExamId}`
      );
      const data = await res.json();
      if (data.success) {
        setReportCard(data.reportCard);
      }
    } catch (err) {
      console.error("Failed to load report card:", err);
    } finally {
      setLoadingReport(false);
    }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingExam(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/school/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newExamTitle,
          term: newExamTerm,
          startDate: newExamStart,
          endDate: newExamEnd,
          status: "PUBLISHED",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create exam");

      setFeedback({ text: `Exam "${newExamTitle}" published!`, type: "success" });
      setIsExamModalOpen(false);
      refreshExams();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error creating exam";
      setFeedback({ text: msg, type: "error" });
    } finally {
      setCreatingExam(false);
    }
  };

  const handleSaveMarks = async () => {
    setSavingMarks(true);
    setFeedback(null);
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
      if (!res.ok) throw new Error(data.error || "Failed to save marks");

      setFeedback({ text: "Marksheet saved and grades calculated!", type: "success" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving marks";
      setFeedback({ text: msg, type: "error" });
    } finally {
      setSavingMarks(false);
    }
  };

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

  const availableSubjectsForClass = subjects.filter((s) => {
    if (!s.classId) return true;
    const cid = typeof s.classId === "object" ? s.classId._id : s.classId;
    return cid === selectedClassId;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Examinations & Result Cards</h1>
          <p className="text-sm text-slate-500">
            Define exam schedules, input subject grades, and print comprehensive student transcripts.
          </p>
        </div>

        <button
          onClick={() => {
            setFeedback(null);
            setIsExamModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Examination Term</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-lg text-xs font-medium flex items-center justify-between border ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
              : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-[11px] hover:underline">
            ✕
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("exams")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "exams"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Examinations ({exams.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("marks")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "marks"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Subject Marks Entry</span>
        </button>

        <button
          onClick={() => setActiveTab("reports")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "reports"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Student Report Cards</span>
        </button>
      </div>

      {/* TAB 1: EXAMS OVERVIEW */}
      {activeTab === "exams" && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs">
          <h2 className="font-bold text-sm mb-4">Scheduled Examination Terms</h2>
          {exams.length === 0 ? (
            <p className="text-xs text-slate-400">
              No examination terms scheduled. Click &quot;New Examination Term&quot; to begin.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {exams.map((ex) => (
                <div
                  key={ex._id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                      {ex.term}
                    </span>
                    <span className="text-xs font-semibold text-emerald-600">● {ex.status}</span>
                  </div>
                  <h3 className="font-bold text-sm mt-2">{ex.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(ex.startDate).toLocaleDateString()} to{" "}
                    {new Date(ex.endDate).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MARKS ENTRY GRID */}
      {activeTab === "marks" && (
        <div className="space-y-4">
          {/* Controls Selector */}
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
                  {availableSubjectsForClass.map((sub) => (
                    <option key={sub._id} value={sub._id}>
                      {sub.name} ({sub.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleSaveMarks}
              disabled={savingMarks || marksRoster.length === 0}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-1.5 shadow-xs disabled:opacity-60 cursor-pointer"
            >
              {savingMarks ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>Save Marksheet</span>
            </button>
          </div>

          {/* Marksheet Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
            {loadingMarks ? (
              <div className="p-12 text-center flex flex-col items-center justify-center text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600 mb-2" />
                <p className="text-xs">Loading marksheet...</p>
              </div>
            ) : marksRoster.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                No students found in this class section or subject not selected.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-400 font-semibold uppercase">
                      <th className="py-2.5 px-4">Roll #</th>
                      <th className="py-2.5 px-4">Student Name</th>
                      <th className="py-2.5 px-4">Obtained Marks</th>
                      <th className="py-2.5 px-4">Total Marks</th>
                      <th className="py-2.5 px-4 text-center">Grade</th>
                      <th className="py-2.5 px-4">Teacher Remarks</th>
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
                            className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                          />
                        </td>

                        <td className="py-2.5 px-4 font-semibold text-slate-500">{m.totalMarks}</td>

                        <td className="py-2.5 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                              m.grade === "A+" || m.grade === "A"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : m.grade === "F"
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : "bg-blue-50 text-blue-700 border border-blue-200"
                            }`}
                          >
                            {m.grade}
                          </span>
                        </td>

                        <td className="py-2.5 px-4">
                          <input
                            type="text"
                            placeholder="Optional remark..."
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
      )}

      {/* TAB 3: REPORT CARDS & TRANSCRIPTS */}
      {activeTab === "reports" && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div>
                <label className="font-medium mr-1.5">Exam Term:</label>
                <select
                  value={reportExamId}
                  onChange={(e) => setReportExamId(e.target.value)}
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
                <label className="font-medium mr-1.5">Student:</label>
                <select
                  value={reportStudentId}
                  onChange={(e) => setReportStudentId(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                >
                  {students.map((st) => (
                    <option key={st._id} value={st._id}>
                      {st.userId?.name || "Student"} (Roll {st.rollNumber} - {st.classId?.name || "Class"})
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={fetchReportCard}
                disabled={loadingReport}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-1 shadow-xs cursor-pointer"
              >
                {loadingReport ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Award className="w-3.5 h-3.5" />
                )}
                <span>Generate Report Card</span>
              </button>
            </div>

            {reportCard && (
              <button
                onClick={() => window.print()}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium flex items-center gap-1 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Card</span>
              </button>
            )}
          </div>

          {/* Printable Report Card Sheet */}
          {reportCard && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-md max-w-3xl mx-auto space-y-6 text-xs print:p-0 print:border-none">
              {/* Report Header */}
              <div className="text-center pb-4 border-b-2 border-slate-800 dark:border-slate-200">
                <h1 className="text-xl font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  {reportCard.schoolName}
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Academic Progress Report • {reportCard.examTitle} ({reportCard.term})
                </p>
              </div>

              {/* Student Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400">Student Name</span>
                  <p className="font-bold text-sm text-slate-900 dark:text-white">
                    {reportCard.studentName}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400">Class & Section</span>
                  <p className="font-bold text-sm text-slate-900 dark:text-white">
                    {reportCard.className} - {reportCard.sectionName}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400">Roll Number</span>
                  <p className="font-bold text-sm font-mono text-slate-900 dark:text-white">
                    {reportCard.rollNumber}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400">Admission #</span>
                  <p className="font-bold text-sm font-mono text-slate-900 dark:text-white">
                    {reportCard.admissionNumber}
                  </p>
                </div>
              </div>

              {/* Subject Breakdown Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-300 dark:border-slate-700 text-slate-500 uppercase font-bold text-[10px]">
                      <th className="py-2.5 px-3">Subject</th>
                      <th className="py-2.5 px-3 text-center">Pass Marks</th>
                      <th className="py-2.5 px-3 text-center">Total Marks</th>
                      <th className="py-2.5 px-3 text-center">Marks Obtained</th>
                      <th className="py-2.5 px-3 text-center">Grade</th>
                      <th className="py-2.5 px-3">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {reportCard.subjects.map((sub, sidx) => (
                      <tr key={sidx}>
                        <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                          {sub.subjectName}{" "}
                          <span className="text-[10px] font-mono text-slate-400">
                            ({sub.subjectCode})
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-500">{sub.passMarks}</td>
                        <td className="py-2.5 px-3 text-center text-slate-500">{sub.totalMarks}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-900 dark:text-white">
                          {sub.obtainedMarks}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold">{sub.grade}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              sub.obtainedMarks >= sub.passMarks
                                ? "text-emerald-600"
                                : "text-rose-600"
                            }`}
                          >
                            {sub.obtainedMarks >= sub.passMarks ? "Passed" : "Failed"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary Results Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500">
                    Grand Total
                  </span>
                  <p className="text-base font-bold">
                    {reportCard.grandObtained} / {reportCard.grandTotal}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500">
                    Percentage
                  </span>
                  <p className="text-base font-bold text-blue-600">{reportCard.percentage}%</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500">
                    Overall Grade
                  </span>
                  <p className="text-base font-bold text-emerald-600">{reportCard.overallGrade}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500">
                    Final Status
                  </span>
                  <p
                    className={`text-base font-bold ${
                      reportCard.status === "PASS" ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {reportCard.status}
                  </p>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-8 grid grid-cols-2 gap-8 text-center text-slate-400 text-xs">
                <div>
                  <div className="w-36 mx-auto border-b border-slate-300 dark:border-slate-700 pb-1 mb-1" />
                  <span>Class Teacher Signature</span>
                </div>
                <div>
                  <div className="w-36 mx-auto border-b border-slate-300 dark:border-slate-700 pb-1 mb-1" />
                  <span>Principal / Head of School</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* New Exam Modal */}
      {isExamModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-xs">
            <h3 className="font-bold text-base mb-3">Schedule Examination Term</h3>
            <form onSubmit={handleCreateExam} className="space-y-3">
              <div>
                <label className="block font-medium mb-1">Exam Title *</label>
                <input
                  type="text"
                  required
                  value={newExamTitle}
                  onChange={(e) => setNewExamTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Term / Session</label>
                <input
                  type="text"
                  required
                  value={newExamTerm}
                  onChange={(e) => setNewExamTerm(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={newExamStart}
                    onChange={(e) => setNewExamStart(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={newExamEnd}
                    onChange={(e) => setNewExamEnd(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsExamModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingExam}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {creatingExam ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Publish Exam Term</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
