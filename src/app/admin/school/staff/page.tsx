"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Users,
  Plus,
  Search,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Briefcase,
  BookOpen,
  GraduationCap,
  Layers,
  X,
  Phone,
  Mail,
  UserCheck,
} from "lucide-react";
import ImageUpload from "@/components/ui/ImageUpload";

interface AssignedClass {
  _id?: string;
  classId: { _id: string; name: string } | string;
  sectionName: string;
  subjectId: { _id: string; name: string; code: string } | string;
}

interface StaffItem {
  _id: string;
  employeeId: string;
  designation: string;
  department: string;
  qualification: string;
  salary?: number;
  avatarUrl?: string;
  status: string;
  createdAt: string;
  assignedClasses: AssignedClass[];
  userId?: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
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
  classId?: { _id: string; name: string } | string;
}

export default function StaffManagementPage() {
  const [staff, setStaff] = useState<StaffItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState("ALL");

  // Modals
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);
  const [assignModalStaff, setAssignModalStaff] = useState<StaffItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Onboarding Form
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "password123",
    employeeId: "",
    designation: "Subject Teacher",
    department: "Science & Mathematics",
    qualification: "B.Ed, M.Sc.",
    salary: 3500,
    phone: "",
    avatarUrl: "",
  });

  // Assign Class Form
  const [assignClassId, setAssignClassId] = useState("");
  const [assignSection, setAssignSection] = useState("A");
  const [assignSubjectId, setAssignSubjectId] = useState("");

  const refreshStaff = async () => {
    try {
      const [staffRes, classRes, subRes] = await Promise.all([
        fetch("/api/admin/school/staff"),
        fetch("/api/admin/school/academics/classes"),
        fetch("/api/admin/school/academics/subjects"),
      ]);
      const sData = await staffRes.json();
      const cData = await classRes.json();
      const subData = await subRes.json();

      if (sData.success) setStaff(sData.staff || []);
      if (cData.success) {
        setClasses(cData.classes || []);
        if (cData.classes?.length > 0 && !assignClassId) {
          setAssignClassId(cData.classes[0]._id);
        }
      }
      if (subData.success) {
        setSubjects(subData.subjects || []);
        if (subData.subjects?.length > 0 && !assignSubjectId) {
          setAssignSubjectId(subData.subjects[0]._id);
        }
      }
    } catch (err) {
      console.error("Failed to load staff data:", err);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const [staffRes, classRes, subRes] = await Promise.all([
          fetch("/api/admin/school/staff"),
          fetch("/api/admin/school/academics/classes"),
          fetch("/api/admin/school/academics/subjects"),
        ]);
        const sData = await staffRes.json();
        const cData = await classRes.json();
        const subData = await subRes.json();

        if (!ignore) {
          if (sData.success) setStaff(sData.staff || []);
          if (cData.success) {
            setClasses(cData.classes || []);
            if (cData.classes?.length > 0) setAssignClassId(cData.classes[0]._id);
          }
          if (subData.success) {
            setSubjects(subData.subjects || []);
            if (subData.subjects?.length > 0) setAssignSubjectId(subData.subjects[0]._id);
          }
        }
      } catch (err) {
        console.error("Init staff error:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  const handleOnboardStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/school/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to onboard staff");

      setFeedback({ text: `Faculty member "${formData.name}" onboarded successfully!`, type: "success" });
      setIsOnboardModalOpen(false);
      setFormData({
        name: "",
        email: "",
        password: "password123",
        employeeId: "",
        designation: "Subject Teacher",
        department: "Science & Mathematics",
        qualification: "B.Ed, M.Sc.",
        salary: 3500,
        phone: "",
        avatarUrl: "",
      });
      refreshStaff();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error onboarding staff";
      setFeedback({ text: msg, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModalStaff) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/school/staff/${assignModalStaff._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ASSIGN_CLASS",
          classId: assignClassId,
          sectionName: assignSection,
          subjectId: assignSubjectId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to assign class");

      setFeedback({ text: "Teaching allocation saved!", type: "success" });
      // Update local modal staff
      setAssignModalStaff(data.staff);
      refreshStaff();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error assigning class";
      setFeedback({ text: msg, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnassignClass = async (assignmentId: string) => {
    if (!assignModalStaff) return;
    try {
      const res = await fetch(`/api/admin/school/staff/${assignModalStaff._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UNASSIGN_CLASS",
          assignmentId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove assignment");
      setAssignModalStaff(data.staff);
      refreshStaff();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error removing assignment";
      setFeedback({ text: msg, type: "error" });
    }
  };

  const handleDeleteStaff = async (id: string, name: string) => {
    if (!confirm(`Delete staff member "${name}"? This removes their user account permanently.`)) return;
    try {
      const res = await fetch(`/api/admin/school/staff/${id}`, { method: "DELETE" });
      if (res.ok) {
        setFeedback({ text: `Staff record deleted.`, type: "success" });
        refreshStaff();
      }
    } catch (err) {
      console.error("Delete staff error:", err);
    }
  };

  const departments = Array.from(new Set(staff.map((s) => s.department).filter(Boolean)));

  const filteredStaff = staff.filter((s) => {
    const name = s.userId?.name || "";
    const email = s.userId?.email || "";
    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.designation.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = selectedDeptFilter === "ALL" || s.department === selectedDeptFilter;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              Human Resources
            </span>
            <span className="text-xs text-slate-400">• Total Faculty: {staff.length}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Faculty & Staff Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Onboard teachers, allocate classes and curriculum subjects, and manage employee credentials.
          </p>
        </div>

        <button
          onClick={() => {
            setFeedback(null);
            setIsOnboardModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Onboard Faculty Member</span>
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
            placeholder="Search by name, employee ID, designation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 text-xs">
          <button
            onClick={() => setSelectedDeptFilter("ALL")}
            className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer whitespace-nowrap ${
              selectedDeptFilter === "ALL"
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            All Departments ({staff.length})
          </button>
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => setSelectedDeptFilter(dept)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer whitespace-nowrap ${
                selectedDeptFilter === dept
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {/* Staff Roster Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-7 h-7 animate-spin text-indigo-600 mb-2" />
            <p className="text-xs font-medium">Loading faculty members...</p>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">No Faculty Registered Yet</h3>
            <p className="text-xs max-w-sm mx-auto mt-1 text-slate-500">
              Click &quot;Onboard Faculty Member&quot; to register your first teacher and assign their classes & subjects.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Teacher Profile</th>
                  <th className="py-3.5 px-4">Employee ID</th>
                  <th className="py-3.5 px-4">Designation & Dept</th>
                  <th className="py-3.5 px-4">Assigned Classes & Subjects</th>
                  <th className="py-3.5 px-4">Qualification</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredStaff.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-9 h-9 rounded-full overflow-hidden bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0">
                          {s.avatarUrl ? (
                            <Image
                              src={s.avatarUrl}
                              alt={s.userId?.name || "Teacher"}
                              fill
                              sizes="36px"
                              className="object-cover"
                            />
                          ) : (
                            s.userId?.name ? s.userId.name.charAt(0).toUpperCase() : "T"
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">
                            {s.userId?.name || "Faculty Member"}
                          </p>
                          <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {s.userId?.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                      {s.employeeId}
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {s.designation}
                      </p>
                      <p className="text-[11px] text-slate-400">{s.department}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      {s.assignedClasses && s.assignedClasses.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {s.assignedClasses.map((ac, idx) => {
                            const cName = typeof ac.classId === "object" ? ac.classId?.name : "Class";
                            const subName = typeof ac.subjectId === "object" ? ac.subjectId?.name : "Subject";
                            return (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800"
                              >
                                {cName}-{ac.sectionName}: {subName}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                          No classes assigned
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500">{s.qualification || "N/A"}</td>

                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300">
                        {s.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setAssignModalStaff(s);
                            setFeedback(null);
                          }}
                          className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition cursor-pointer flex items-center gap-1"
                        >
                          <BookOpen className="w-3 h-3" />
                          <span>Assign Classes</span>
                        </button>

                        <button
                          onClick={() => handleDeleteStaff(s._id, s.userId?.name || "Staff")}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                          title="Delete staff"
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

      {/* Onboard Staff Modal */}
      {isOnboardModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Onboard Faculty Member</h3>
                <p className="text-xs text-slate-500">Create login credentials and staff HR profile</p>
              </div>
              <button
                onClick={() => setIsOnboardModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleOnboardStaff} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              <ImageUpload
                label="Profile Photo (via ImageKit)"
                folder="/staff_avatars"
                value={formData.avatarUrl}
                onChange={(url) => setFormData({ ...formData, avatarUrl: url })}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Arthur Pendelton"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Work Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. arthur@apex.edu"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Employee ID *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. EMP-101"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono uppercase focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Default Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Designation *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Science Teacher"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Department *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Science & Mathematics"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Qualifications
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. M.Sc. Physics, B.Ed."
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Monthly Salary ($)
                  </label>
                  <input
                    type="number"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Contact Phone
                </label>
                <input
                  type="text"
                  placeholder="+1-555-0199"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsOnboardModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-2 shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                  <span>Onboard Faculty Member</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Classes Modal */}
      {assignModalStaff && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                  Teaching Schedule Allocations
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  Assign Classes to {assignModalStaff.userId?.name || assignModalStaff.employeeId}
                </h3>
              </div>
              <button
                onClick={() => setAssignModalStaff(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6 text-xs max-h-[80vh] overflow-y-auto">
              {/* Form to add allocation */}
              <form onSubmit={handleAssignClass} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-indigo-600" /> Allocate New Class & Subject
                </h4>

                {classes.length === 0 || subjects.length === 0 ? (
                  <p className="text-amber-600 dark:text-amber-400 text-xs">
                    Please create Classes and Subjects in the Academic Setup portal first before assigning them to faculty.
                  </p>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Class *
                        </label>
                        <select
                          value={assignClassId}
                          onChange={(e) => setAssignClassId(e.target.value)}
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500"
                        >
                          {classes.map((c) => (
                            <option key={c._id} value={c._id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Section *
                        </label>
                        <select
                          value={assignSection}
                          onChange={(e) => setAssignSection(e.target.value)}
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500"
                        >
                          {(() => {
                            const currentClass = classes.find((c) => c._id === assignClassId);
                            const secList = currentClass?.sections || [{ name: "A" }, { name: "B" }];
                            return secList.map((s) => (
                              <option key={s.name} value={s.name}>
                                Section {s.name}
                              </option>
                            ));
                          })()}
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Subject *
                        </label>
                        <select
                          value={assignSubjectId}
                          onChange={(e) => setAssignSubjectId(e.target.value)}
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500"
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
                      type="submit"
                      disabled={submitting}
                      className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center justify-center gap-1.5 shadow-xs transition disabled:opacity-50 cursor-pointer"
                    >
                      {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                      <span>Assign Subject & Class</span>
                    </button>
                  </>
                )}
              </form>

              {/* Current Active Allocations */}
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2">
                  Active Teaching Assignments ({assignModalStaff.assignedClasses?.length || 0})
                </h4>

                {!assignModalStaff.assignedClasses || assignModalStaff.assignedClasses.length === 0 ? (
                  <p className="text-slate-400 text-xs py-3 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    No classes assigned yet to this teacher.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {assignModalStaff.assignedClasses.map((ac) => {
                      const cName = typeof ac.classId === "object" ? ac.classId?.name : "Class";
                      const subName = typeof ac.subjectId === "object" ? ac.subjectId?.name : "Subject";
                      const subCode = typeof ac.subjectId === "object" ? ac.subjectId?.code : "";

                      return (
                        <div
                          key={ac._id}
                          className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center font-bold text-xs">
                              {ac.sectionName}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">
                                {cName} • Section {ac.sectionName}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                Subject: <span className="font-semibold text-slate-700 dark:text-slate-300">{subName}</span> {subCode && `(${subCode})`}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => ac._id && handleUnassignClass(ac._id)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                            title="Unassign class"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setAssignModalStaff(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
