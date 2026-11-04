"use client";

import React, { useState, useEffect } from "react";
import {
  GraduationCap,
  Plus,
  Search,
  Filter,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
} from "lucide-react";

interface StudentItem {
  _id: string;
  admissionNumber: string;
  rollNumber: string;
  sectionName: string;
  gender: string;
  status: string;
  guardianName?: string;
  guardianEmail?: string;
  guardianPhone?: string;
  userId?: {
    name: string;
    email: string;
    phone?: string;
  };
  classId?: {
    _id: string;
    name: string;
  };
}

interface ClassItem {
  _id: string;
  name: string;
  sections: { name: string }[];
}

export default function StudentManagementPage() {
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClassFilter, setSelectedClassFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "password123",
    admissionNumber: "",
    rollNumber: "",
    classId: "",
    sectionName: "A",
    dob: "",
    gender: "MALE",
    bloodGroup: "O+",
    address: "",
    guardianName: "",
    guardianEmail: "",
    guardianPhone: "",
  });

  const refreshStudents = async () => {
    try {
      const res = await fetch("/api/admin/school/students");
      const data = await res.json();
      if (data.success) {
        setStudents(data.students);
      }
    } catch (err) {
      console.error("Failed to load students:", err);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const [studentRes, classRes] = await Promise.all([
          fetch("/api/admin/school/students"),
          fetch("/api/admin/school/academics/classes"),
        ]);
        const sData = await studentRes.json();
        const cData = await classRes.json();

        if (!ignore) {
          if (sData.success) setStudents(sData.students);
          if (cData.success && cData.classes.length > 0) {
            setClasses(cData.classes);
            setFormData((prev) => ({
              ...prev,
              classId: cData.classes[0]._id,
              sectionName: cData.classes[0].sections[0]?.name || "A",
            }));
          }
        }
      } catch (err) {
        console.error("Init students error:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  const handleAdmitStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/school/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to admit student");

      setFeedback({ text: `Student "${formData.name}" enrolled successfully!`, type: "success" });
      setIsModalOpen(false);

      // Reset
      setFormData((prev) => ({
        ...prev,
        name: "",
        email: "",
        admissionNumber: "",
        rollNumber: "",
        guardianName: "",
        guardianEmail: "",
        guardianPhone: "",
      }));

      refreshStudents();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error admitting student";
      setFeedback({ text: msg, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStudent = async (id: string, name: string) => {
    if (!confirm(`Delete student record for "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/school/students/${id}`, { method: "DELETE" });
      if (res.ok) {
        setFeedback({ text: `Student record deleted.`, type: "success" });
        refreshStudents();
      }
    } catch (err) {
      console.error("Delete student error:", err);
    }
  };

  const filteredStudents = students.filter((s) => {
    const studentName = s.userId?.name || "";
    const studentEmail = s.userId?.email || "";
    const matchesSearch =
      studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      studentEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesClass =
      selectedClassFilter === "ALL" || s.classId?._id === selectedClassFilter;

    return matchesSearch && matchesClass;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Student Admissions & Directory</h1>
          <p className="text-sm text-slate-500">
            Admit new students, manage academic enrollments, and link parent/guardian accounts.
          </p>
        </div>

        <button
          onClick={() => {
            setFeedback(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Student Admission</span>
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

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, roll #, admission #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="text-xs py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
          >
            <option value="ALL">All Classes</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Student Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600 mb-2" />
            <p className="text-xs">Loading student records...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <GraduationCap className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
            <p className="font-semibold text-sm">No students found</p>
            <p className="text-xs text-slate-400 mt-1">
              Click &quot;New Student Admission&quot; to admit your first student.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-400 font-semibold uppercase">
                  <th className="py-3 px-4">Student Name & Email</th>
                  <th className="py-3 px-4">Admission #</th>
                  <th className="py-3 px-4">Class & Section</th>
                  <th className="py-3 px-4">Roll #</th>
                  <th className="py-3 px-4">Parent / Guardian</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStudents.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {s.userId?.name || "Student"}
                      </div>
                      <div className="text-[11px] text-slate-400">{s.userId?.email}</div>
                    </td>

                    <td className="py-3 px-4 font-mono font-medium text-slate-700 dark:text-slate-300">
                      {s.admissionNumber}
                    </td>

                    <td className="py-3 px-4 font-medium">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                        {s.classId?.name || "Class"} - {s.sectionName}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono">{s.rollNumber}</td>

                    <td className="py-3 px-4">
                      <div className="text-slate-800 dark:text-slate-200">
                        {s.guardianName || "N/A"}
                      </div>
                      {s.guardianPhone && (
                        <div className="text-[10px] text-slate-400">{s.guardianPhone}</div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Active</span>
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteStudent(s._id, s.userId?.name || "Student")}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Admission Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-base">New Student Admission</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdmitStudent} className="mt-4 space-y-4 text-xs">
              <div className="font-semibold text-slate-400 uppercase tracking-wider">
                1. Student Profile
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Student Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Leo Miller"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1">Student Login Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="student@school.edu"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Admission Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="ADM-2026-001"
                    value={formData.admissionNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, admissionNumber: e.target.value.toUpperCase() })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1">Roll Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="101"
                    value={formData.rollNumber}
                    onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Assigned Class *</label>
                  <select
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                  >
                    {classes.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium mb-1">Section *</label>
                  <select
                    value={formData.sectionName}
                    onChange={(e) => setFormData({ ...formData, sectionName: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                  >
                    {classes
                      .find((c) => c._id === formData.classId)
                      ?.sections.map((sec, idx) => (
                        <option key={idx} value={sec.name}>
                          Section {sec.name}
                        </option>
                      )) || <option value="A">Section A</option>}
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  2. Parent / Guardian Linkage
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-medium mb-1">Guardian Name</label>
                    <input
                      type="text"
                      placeholder="Eleanor Miller"
                      value={formData.guardianName}
                      onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-medium mb-1">Guardian Login Email</label>
                    <input
                      type="email"
                      placeholder="parent@school.edu"
                      value={formData.guardianEmail}
                      onChange={(e) =>
                        setFormData({ ...formData, guardianEmail: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-medium mb-1">Guardian Phone</label>
                    <input
                      type="text"
                      placeholder="+1-555-0199"
                      value={formData.guardianPhone}
                      onChange={(e) =>
                        setFormData({ ...formData, guardianPhone: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
                >
                  {submitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>Enroll Student</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
