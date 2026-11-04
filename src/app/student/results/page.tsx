"use client";

import React, { useEffect, useState } from "react";
import {
  FileSpreadsheet,
  Award,
  TrendingUp,
  Printer,
  CheckCircle2,
  AlertCircle,
  BookOpen,
} from "lucide-react";

interface SubjectRow {
  subjectName: string;
  subjectCode: string;
  passMarks: number;
  totalMarks: number;
  obtainedMarks: number;
  grade: string;
  remarks: string;
}

interface ReportCardData {
  schoolName: string;
  schoolContact: string;
  studentName: string;
  admissionNumber: string;
  rollNumber: string;
  className: string;
  sectionName: string;
  examTitle: string;
  term: string;
  subjects: SubjectRow[];
  grandTotal: number;
  grandObtained: number;
  percentage: number;
  overallGrade: string;
  status: "PASS" | "FAIL" | "PENDING";
}

interface ExamOption {
  _id: string;
  title: string;
  term: string;
}

export default function StudentResultsPage() {
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<ExamOption[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [report, setReport] = useState<ReportCardData | null>(null);

  const fetchResults = async (examId?: string) => {
    try {
      setLoading(true);
      const url = examId
        ? `/api/admin/school/exams/report-card?examId=${examId}`
        : `/api/admin/school/exams/report-card`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setExams(data.exams || []);
        setReport(data.reportCard || null);
        if (!selectedExamId && data.reportCard && examId) {
          setSelectedExamId(examId);
        } else if (!selectedExamId && data.exams?.length > 0) {
          setSelectedExamId(data.exams[0]._id);
        }
      }
    } catch (err) {
      console.error("Failed to load results", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetch("/api/admin/school/exams/report-card");
        const data = await res.json();
        if (!ignore && data.success) {
          setExams(data.exams || []);
          setReport(data.reportCard || null);
          if (data.exams?.length > 0) {
            setSelectedExamId(data.exams[0]._id);
          }
        }
      } catch (err) {
        console.error("Failed to load results", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  const handleExamChange = (examId: string) => {
    setSelectedExamId(examId);
    fetchResults(examId);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Academic Results & Report Card</h1>
          <p className="text-sm text-slate-500">
            View verified term grades, subject score breakdown, and performance transcripts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {exams.length > 0 && (
            <select
              value={selectedExamId}
              onChange={(e) => handleExamChange(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              {exams.map((ex) => (
                <option key={ex._id} value={ex._id}>
                  {ex.title} ({ex.term})
                </option>
              ))}
            </select>
          )}

          {report && (
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition"
            >
              <Printer className="w-4 h-4" />
              Print Transcript
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-sm text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          Loading academic examination records...
        </div>
      ) : !report ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700 dark:text-slate-300">No Results Published Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Exam evaluations for this term are still being graded by subject teachers. Please check back soon.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Overall Grade
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-extrabold text-blue-600">{report.overallGrade}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                  {report.status}
                </span>
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Cumulative Score
              </span>
              <p className="text-2xl font-bold mt-2">
                {report.grandObtained} <span className="text-sm font-normal text-slate-400">/ {report.grandTotal}</span>
              </p>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Percentage
              </span>
              <div className="flex items-center gap-2 mt-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                <p className="text-2xl font-bold text-emerald-600">{report.percentage}%</p>
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Enrolled Subjects
              </span>
              <div className="flex items-center gap-2 mt-2">
                <BookOpen className="w-5 h-5 text-indigo-500" />
                <p className="text-2xl font-bold text-indigo-600">{report.subjects.length}</p>
              </div>
            </div>
          </div>

          {/* Printable Report Card Sheet */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-6 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
                  Official Grade Transcript
                </span>
                <h2 className="text-2xl font-black mt-1 text-slate-900 dark:text-white">
                  {report.schoolName}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">{report.examTitle} ({report.term})</p>
              </div>

              <div className="text-xs text-right space-y-1">
                <p><span className="text-slate-400">Student:</span> <strong className="text-slate-800 dark:text-slate-200">{report.studentName}</strong></p>
                <p><span className="text-slate-400">Roll No:</span> <strong>{report.rollNumber}</strong> | <span className="text-slate-400">Adm:</span> <strong>{report.admissionNumber}</strong></p>
                <p><span className="text-slate-400">Class:</span> <strong>{report.className} - {report.sectionName}</strong></p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3">Subject</th>
                    <th className="py-3 px-3 text-center">Code</th>
                    <th className="py-3 px-3 text-center">Pass Marks</th>
                    <th className="py-3 px-3 text-center">Max Marks</th>
                    <th className="py-3 px-3 text-center">Obtained Marks</th>
                    <th className="py-3 px-3 text-center">Grade</th>
                    <th className="py-3 px-3 text-center">Verdict</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {report.subjects.map((sub, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-3 font-semibold text-slate-900 dark:text-slate-100">
                        {sub.subjectName}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-400">
                        {sub.subjectCode}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-500">
                        {sub.passMarks}
                      </td>
                      <td className="py-3 px-3 text-center font-semibold">
                        {sub.totalMarks}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-blue-600">
                        {sub.obtainedMarks}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-bold px-2 py-0.5 rounded text-[11px] bg-slate-100 dark:bg-slate-800">
                          {sub.grade}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {sub.obtainedMarks >= sub.passMarks ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Pass
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-600 font-semibold">
                            <AlertCircle className="w-3.5 h-3.5" /> Fail
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-300 dark:border-slate-700 font-bold text-xs bg-slate-50/60 dark:bg-slate-800/60">
                    <td colSpan={3} className="py-3.5 px-3 uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      Final Total & Standing
                    </td>
                    <td className="py-3.5 px-3 text-center">{report.grandTotal}</td>
                    <td className="py-3.5 px-3 text-center text-blue-600 text-sm">
                      {report.grandObtained}
                    </td>
                    <td className="py-3.5 px-3 text-center text-sm font-black">
                      {report.overallGrade}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                        report.status === "PASS"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                      }`}>
                        {report.status}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Verified by Examination Controller & Academic Principal</span>
              </div>
              <div className="font-mono text-[11px]">
                Generated on: {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
