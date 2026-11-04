"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  GraduationCap,
  Plus,
  Search,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Mail,
  Phone,
  Eye,
  Calendar,
  X,
} from "lucide-react";
import ImageUpload from "@/components/ui/ImageUpload";

interface StudentItem {
  _id: string;
  admissionNumber: string;
  rollNumber: string;
  sectionName: string;
  gender: string;
  dob?: string;
  bloodGroup?: string;
  address?: string;
  avatarUrl?: string;
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
  const [viewStudent, setViewStudent] = useState<StudentItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Admission Form State
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
    avatarUrl: "",
    guardianName: "",
    guardianEmail: "",
    guardianPhone: "",
  });

  const refreshStudents = async () => {
    try {
      const [stuRes, classRes] = await Promise.all([
        fetch("/api/admin/school/students"),
        fetch("/api/admin/school/academics/classes"),
      ]);
      const sData = await stuRes.json();
      const cData = await classRes.json();

      if (sData.success) setStudents(sData.students || []);
      if (cData.success) {
        setClasses(cData.classes || []);
        if (cData.classes?.length > 0 && !formData.classId) {
          setFormData((prev) => ({ ...prev, classId: cData.classes[0]._id }));
        }
      }
    } catch (err) {
      console.error("Failed to load students:", err);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const [stuRes, classRes] = await Promise.all([
          fetch("/api/admin/school/students"),
          fetch("/api/admin/school/academics/classes"),
        ]);
        const sData = await stuRes.json();
        const cData = await classRes.json();

        if (!ignore) {
          if (sData.success) setStudents(sData.students || []);
          if (cData.success) {
            setClasses(cData.classes || []);
            if (cData.classes?.length > 0) {
              setFormData((prev) => ({ ...prev, classId: cData.classes[0]._id }));
            }
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

      setFeedback({
        text: `Student "${formData.name}" admitted successfully! Parent credentials linked.`,
        type: "success",
      });
      setIsModalOpen(false);
      setFormData({
        name: "",
        email: "",
        password: "password123",
        admissionNumber: "",
        rollNumber: "",
        classId: classes[0]?._id || "",
        sectionName: "A",
        dob: "",
        gender: "MALE",
        bloodGroup: "O+",
        address: "",
        avatarUrl: "",
        guardianName: "",
        guardianEmail: "",
        guardianPhone: "",
      });
      refreshStudents();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error admitting student";
      setFeedback({ text: msg, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStudent = async (id: string, name: string) => {
    if (!confirm(`Delete student "${name}"? This removes both the student and linked parent login.`)) return;
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
    const name = s.userId?.name || "";
    const email = s.userId?.email || "";
    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.guardianName || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesClass =
      selectedClassFilter === "ALL" || s.classId?._id === selectedClassFilter;

    return matchesSearch && matchesClass;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              Admissions & Records
            </span>
            <span className="text-xs text-slate-400">• Total Learners: {students.length}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Student Enrollment Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Admit new students, manage roll numbers, class allocations, and linked guardian accounts.
          </p>
        </div>

        <button
          onClick={() => {
            setFeedback(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Admit New Student</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between border ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
              : "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-xs hover:opacity-75">✕</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student name, roll #, admission #, guardian..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 text-xs">
          <button
            onClick={() => setSelectedClassFilter("ALL")}
            className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer whitespace-nowrap ${
              selectedClassFilter === "ALL"
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            All Classes ({students.length})
          </button>
          {classes.map((cls) => (
            <button
              key={cls._id}
              onClick={() => setSelectedClassFilter(cls._id)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer whitespace-nowrap ${
                selectedClassFilter === cls._id
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {cls.name}
            </button>
          ))}
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-7 h-7 animate-spin text-blue-600 mb-2" />
            <p className="text-xs font-medium">Loading enrolled learners...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">No Students Registered Yet</h3>
            <p className="text-xs max-w-sm mx-auto mt-1 text-slate-500">
              Click &quot;Admit New Student&quot; to enroll your first student and provision guardian access.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Student Profile</th>
                  <th className="py-3.5 px-4">Adm # / Roll #</th>
                  <th className="py-3.5 px-4">Class & Section</th>
                  <th className="py-3.5 px-4">Guardian Contact</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredStudents.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-9 h-9 rounded-full overflow-hidden bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 font-bold text-xs shrink-0">
                          {s.avatarUrl ? (
                            <Image
                              src={s.avatarUrl}
                              alt={s.userId?.name || "Student"}
                              fill
                              sizes="36px"
                              className="object-cover"
                            />
                          ) : (
                            s.userId?.name ? s.userId.name.charAt(0).toUpperCase() : "S"
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">
                            {s.userId?.name || "Student"}
                          </p>
                          <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {s.userId?.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      <p className="font-bold text-slate-900 dark:text-white">{s.admissionNumber}</p>
                      <p className="text-[10px] text-slate-400">Roll: {s.rollNumber}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {s.classId?.name || "Unassigned"}
                      </span>
                      <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        Sec {s.sectionName}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {s.guardianName || "N/A"}
                      </p>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" /> {s.guardianPhone || "No phone"}
                      </p>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300">
                        {s.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewStudent(s)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition cursor-pointer"
                          title="View Profile Card"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDeleteStudent(s._id, s.userId?.name || "Student")}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                          title="Delete student"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Admit New Student</h3>
                <p className="text-xs text-slate-500">Provisions student and linked parent guardian accounts</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdmitStudent} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              <ImageUpload
                label="Student Photograph (via ImageKit)"
                folder="/student_photos"
                value={formData.avatarUrl}
                onChange={(url) => setFormData({ ...formData, avatarUrl: url })}
              />

              <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 block mb-2">
                  1. Academic & Student Information
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Student Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Liam Johnson"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Student Login Email *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. liam@apex.edu"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Admission Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ADM-2026-002"
                      value={formData.admissionNumber}
                      onChange={(e) => setFormData({ ...formData, admissionNumber: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono uppercase focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Class Roll Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 1045"
                      value={formData.rollNumber}
                      onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Enrolled Class *
                    </label>
                    <select
                      value={formData.classId}
                      onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500"
                    >
                      {classes.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Section *
                    </label>
                    <select
                      value={formData.sectionName}
                      onChange={(e) => setFormData({ ...formData, sectionName: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500"
                    >
                      {(() => {
                        const currentClass = classes.find((c) => c._id === formData.classId);
                        const secList = currentClass?.sections || [{ name: "A" }, { name: "B" }];
                        return secList.map((s) => (
                          <option key={s.name} value={s.name}>
                            Section {s.name}
                          </option>
                        ));
                      })()}
                    </select>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 block mb-2">
                  2. Parent / Guardian Account Link
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Guardian Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Robert Johnson"
                      value={formData.guardianName}
                      onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Guardian Email (Login) *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. robert@gmail.com"
                      value={formData.guardianEmail}
                      onChange={(e) => setFormData({ ...formData, guardianEmail: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Guardian Phone *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="+1-555-0182"
                      value={formData.guardianPhone}
                      onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-2 shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                  <span>Admit Student</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Student Profile Modal */}
      {viewStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Student Profile Card</h3>
              <button
                onClick={() => setViewStudent(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 font-extrabold text-xl shrink-0">
                  {viewStudent.avatarUrl ? (
                    <Image
                      src={viewStudent.avatarUrl}
                      alt={viewStudent.userId?.name || "Student"}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : (
                    viewStudent.userId?.name ? viewStudent.userId.name.charAt(0).toUpperCase() : "S"
                  )}
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {viewStudent.userId?.name}
                  </h4>
                  <p className="text-slate-400">{viewStudent.userId?.email}</p>
                  <p className="text-[11px] font-bold text-blue-600 mt-0.5">
                    {viewStudent.classId?.name} - Section {viewStudent.sectionName}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400">Admission No</span>
                  <p className="font-mono font-bold text-slate-800 dark:text-slate-200">{viewStudent.admissionNumber}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400">Roll Number</span>
                  <p className="font-mono font-bold text-slate-800 dark:text-slate-200">{viewStudent.rollNumber}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400">Gender</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{viewStudent.gender}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400">Blood Group</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{viewStudent.bloodGroup || "O+"}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] uppercase font-semibold text-slate-400">Linked Guardian</span>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">{viewStudent.guardianName || "Not Provided"}</p>
                <p className="text-slate-500 text-[11px] mt-0.5">{viewStudent.guardianEmail} • {viewStudent.guardianPhone}</p>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setViewStudent(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
