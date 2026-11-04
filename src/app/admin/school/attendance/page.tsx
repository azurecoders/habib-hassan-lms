"use client";

import React, { useState, useEffect } from "react";
import {
  Save,
  Loader2,
  CheckCircle2,
  Users,
  GraduationCap,
} from "lucide-react";

interface StudentRecord {
  studentId: string;
  name: string;
  rollNumber: string;
  admissionNumber: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  remarks: string;
}

interface StaffRecord {
  staffId: string;
  name: string;
  email: string;
  employeeId: string;
  designation: string;
  department: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY" | "ON_LEAVE";
  remarks: string;
}

interface ClassItem {
  _id: string;
  name: string;
  sections: { name: string }[];
}

export default function SchoolAttendancePage() {
  const [activeTab, setActiveTab] = useState<"students" | "staff">("students");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);

  // Student Attendance State
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSection, setSelectedSection] = useState("A");
  const [studentRecords, setStudentRecords] = useState<StudentRecord[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [savingStudents, setSavingStudents] = useState(false);
  const [isStudentMarked, setIsStudentMarked] = useState(false);

  // Staff Attendance State
  const [staffRecords, setStaffRecords] = useState<StaffRecord[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [savingStaff, setSavingStaff] = useState(false);
  const [isStaffMarked, setIsStaffMarked] = useState(false);

  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Load Classes
  useEffect(() => {
    let ignore = false;
    async function loadClasses() {
      try {
        const res = await fetch("/api/admin/school/academics/classes");
        const data = await res.json();
        if (!ignore && data.success && data.classes.length > 0) {
          setClasses(data.classes);
          setSelectedClassId(data.classes[0]._id);
          setSelectedSection(data.classes[0].sections[0]?.name || "A");
        }
      } catch (err) {
        console.error("Failed to load classes:", err);
      }
    }
    loadClasses();
    return () => {
      ignore = true;
    };
  }, []);

  // Load Student Attendance
  useEffect(() => {
    if (activeTab !== "students" || !selectedClassId) return;
    let ignore = false;
    async function loadStudentAttendance() {
      try {
        const res = await fetch(
          `/api/admin/school/attendance?classId=${selectedClassId}&sectionName=${selectedSection}&date=${date}`
        );
        const data = await res.json();
        if (!ignore && data.success) {
          setStudentRecords(data.records);
          setIsStudentMarked(data.isMarked);
        }
      } catch (err) {
        console.error("Fetch student attendance failed:", err);
      } finally {
        if (!ignore) setLoadingStudents(false);
      }
    }
    loadStudentAttendance();
    return () => {
      ignore = true;
    };
  }, [activeTab, selectedClassId, selectedSection, date]);

  // Load Staff Attendance
  useEffect(() => {
    if (activeTab !== "staff") return;
    let ignore = false;
    async function loadStaffAttendance() {
      try {
        const res = await fetch(`/api/admin/school/attendance/staff?date=${date}`);
        const data = await res.json();
        if (!ignore && data.success) {
          setStaffRecords(data.records);
          setIsStaffMarked(data.isMarked);
        }
      } catch (err) {
        console.error("Fetch staff attendance failed:", err);
      } finally {
        if (!ignore) setLoadingStaff(false);
      }
    }
    loadStaffAttendance();
    return () => {
      ignore = true;
    };
  }, [activeTab, date]);

  // Student Actions
  const markAllStudents = (status: "PRESENT" | "ABSENT") => {
    setStudentRecords((prev) => prev.map((s) => ({ ...s, status })));
  };

  const handleSaveStudentAttendance = async () => {
    setSavingStudents(true);
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

      setMessage({ text: "Student attendance successfully recorded!", type: "success" });
      setIsStudentMarked(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving attendance";
      setMessage({ text: msg, type: "error" });
    } finally {
      setSavingStudents(false);
    }
  };

  // Staff Actions
  const markAllStaff = (status: "PRESENT" | "ABSENT") => {
    setStaffRecords((prev) => prev.map((s) => ({ ...s, status })));
  };

  const handleSaveStaffAttendance = async () => {
    setSavingStaff(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/school/attendance/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          records: staffRecords,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save staff attendance");

      setMessage({ text: "Staff attendance successfully recorded!", type: "success" });
      setIsStaffMarked(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving staff attendance";
      setMessage({ text: msg, type: "error" });
    } finally {
      setSavingStaff(false);
    }
  };

  // Student Stats Calculation
  const totalStudents = studentRecords.length;
  const presentCount = studentRecords.filter((s) => s.status === "PRESENT").length;
  const absentCount = studentRecords.filter((s) => s.status === "ABSENT").length;
  const lateCount = studentRecords.filter((s) => s.status === "LATE").length;
  const studentRate = totalStudents > 0 ? ((presentCount / totalStudents) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Attendance Management</h1>
          <p className="text-sm text-slate-500">
            Log and review daily attendance rosters for students and faculty members.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
          />
        </div>
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
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-[11px] hover:underline">
            ✕
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("students")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "students"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Student Attendance</span>
        </button>

        <button
          onClick={() => setActiveTab("staff")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "staff"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Faculty & Staff Attendance</span>
        </button>
      </div>

      {/* TAB 1: STUDENT ATTENDANCE */}
      {activeTab === "students" && (
        <div className="space-y-4">
          {/* Controls Bar */}
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

              {isStudentMarked ? (
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 font-semibold text-[10px]">
                  ● Marked for Today
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 font-semibold text-[10px]">
                  ○ Unsaved Draft
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => markAllStudents("PRESENT")}
                className="px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 font-medium"
              >
                Mark All Present
              </button>
              <button
                type="button"
                onClick={() => markAllStudents("ABSENT")}
                className="px-3 py-1.5 rounded-lg border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50 font-medium"
              >
                Mark All Absent
              </button>
              <button
                type="button"
                onClick={handleSaveStudentAttendance}
                disabled={savingStudents || totalStudents === 0}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-1.5 shadow-xs disabled:opacity-60 cursor-pointer"
              >
                {savingStudents ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>Save Attendance</span>
              </button>
            </div>
          </div>

          {/* Quick KPI Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-slate-400">Total Enrolled</span>
              <p className="text-xl font-bold mt-1">{totalStudents}</p>
            </div>
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-emerald-500">Present</span>
              <p className="text-xl font-bold text-emerald-600 mt-1">{presentCount}</p>
            </div>
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-rose-500">Absent</span>
              <p className="text-xl font-bold text-rose-600 mt-1">{absentCount}</p>
            </div>
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-amber-500">Late</span>
              <p className="text-xl font-bold text-amber-600 mt-1">{lateCount}</p>
            </div>
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-blue-500">Attendance Rate</span>
              <p className="text-xl font-bold text-blue-600 mt-1">{studentRate}%</p>
            </div>
          </div>

          {/* Student Roster Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
            {loadingStudents ? (
              <div className="p-12 text-center flex flex-col items-center justify-center text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600 mb-2" />
                <p className="text-xs">Loading attendance roster...</p>
              </div>
            ) : totalStudents === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                No students enrolled in this class and section. Go to Student Management to admit students.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-400 font-semibold uppercase">
                      <th className="py-2.5 px-4">Roll #</th>
                      <th className="py-2.5 px-4">Student Name</th>
                      <th className="py-2.5 px-4">Admission #</th>
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

                        <td className="py-2.5 px-4 font-mono text-slate-400">
                          {s.admissionNumber}
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
                              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                                s.status === "PRESENT"
                                  ? "bg-emerald-600 text-white shadow-xs"
                                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200"
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
                              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                                s.status === "ABSENT"
                                  ? "bg-rose-600 text-white shadow-xs"
                                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200"
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
                              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                                s.status === "LATE"
                                  ? "bg-amber-600 text-white shadow-xs"
                                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200"
                              }`}
                            >
                              Late
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...studentRecords];
                                updated[idx].status = "EXCUSED";
                                setStudentRecords(updated);
                              }}
                              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                                s.status === "EXCUSED"
                                  ? "bg-blue-600 text-white shadow-xs"
                                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200"
                              }`}
                            >
                              Excused
                            </button>
                          </div>
                        </td>

                        <td className="py-2.5 px-4">
                          <input
                            type="text"
                            placeholder="Optional notes..."
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
      )}

      {/* TAB 2: STAFF ATTENDANCE */}
      {activeTab === "staff" && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Staff Date: {date}
              </span>
              {isStaffMarked ? (
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 font-semibold text-[10px]">
                  ● Marked for Today
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 font-semibold text-[10px]">
                  ○ Unsaved Draft
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => markAllStaff("PRESENT")}
                className="px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 font-medium"
              >
                Mark All Present
              </button>
              <button
                type="button"
                onClick={handleSaveStaffAttendance}
                disabled={savingStaff || staffRecords.length === 0}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-1.5 shadow-xs disabled:opacity-60 cursor-pointer"
              >
                {savingStaff ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>Save Staff Attendance</span>
              </button>
            </div>
          </div>

          {/* Staff Roster Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
            {loadingStaff ? (
              <div className="p-12 text-center flex flex-col items-center justify-center text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600 mb-2" />
                <p className="text-xs">Loading faculty roster...</p>
              </div>
            ) : staffRecords.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                No faculty members registered. Onboard staff members in Staff Management first.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-400 font-semibold uppercase">
                      <th className="py-2.5 px-4">Emp ID</th>
                      <th className="py-2.5 px-4">Faculty Member</th>
                      <th className="py-2.5 px-4">Designation</th>
                      <th className="py-2.5 px-4 text-center">Status</th>
                      <th className="py-2.5 px-4">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {staffRecords.map((st, idx) => (
                      <tr key={st.staffId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30">
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                          {st.employeeId}
                        </td>

                        <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">
                          {st.name}
                        </td>

                        <td className="py-2.5 px-4 text-slate-500">
                          {st.designation} ({st.department})
                        </td>

                        <td className="py-2.5 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...staffRecords];
                                updated[idx].status = "PRESENT";
                                setStaffRecords(updated);
                              }}
                              className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                                st.status === "PRESENT"
                                  ? "bg-emerald-600 text-white"
                                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                              }`}
                            >
                              Present
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...staffRecords];
                                updated[idx].status = "ABSENT";
                                setStaffRecords(updated);
                              }}
                              className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                                st.status === "ABSENT"
                                  ? "bg-rose-600 text-white"
                                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                              }`}
                            >
                              Absent
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...staffRecords];
                                updated[idx].status = "ON_LEAVE";
                                setStaffRecords(updated);
                              }}
                              className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                                st.status === "ON_LEAVE"
                                  ? "bg-amber-600 text-white"
                                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                              }`}
                            >
                              Leave
                            </button>
                          </div>
                        </td>

                        <td className="py-2.5 px-4">
                          <input
                            type="text"
                            placeholder="Optional notes..."
                            value={st.remarks}
                            onChange={(e) => {
                              const updated = [...staffRecords];
                              updated[idx].remarks = e.target.value;
                              setStaffRecords(updated);
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
    </div>
  );
}
