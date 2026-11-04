"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Layers,
  GraduationCap,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface Section {
  name: string;
  room?: string;
  capacity?: number;
}

interface SchoolClassItem {
  _id: string;
  name: string;
  order: number;
  sections: Section[];
  subjectCount?: number;
}

interface SubjectItem {
  _id: string;
  name: string;
  code: string;
  type: string;
  passMarks: number;
  totalMarks: number;
  classId?: { _id: string; name: string } | string;
}

interface AcademicYearItem {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export default function AcademicManagementPage() {
  const [activeTab, setActiveTab] = useState<"classes" | "subjects" | "years" | "timetable">("classes");

  // State
  const [classes, setClasses] = useState<SchoolClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [years, setYears] = useState<AcademicYearItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Forms
  const [newClassName, setNewClassName] = useState("");
  const [newClassSections, setNewClassSections] = useState("A, B");

  const [newSubClassId, setNewSubClassId] = useState("");
  const [newSubName, setNewSubName] = useState("");
  const [newSubCode, setNewSubCode] = useState("");
  const [newSubType, setNewSubType] = useState("CORE");
  const [newSubPassMarks, setNewSubPassMarks] = useState(40);
  const [newSubTotalMarks, setNewSubTotalMarks] = useState(100);

  const [newYearName, setNewYearName] = useState("2026-2027");
  const [newYearStart, setNewYearStart] = useState("2026-08-01");
  const [newYearEnd, setNewYearEnd] = useState("2027-06-30");
  const [newYearIsCurrent, setNewYearIsCurrent] = useState(true);

  // Timetable State
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSection, setSelectedSection] = useState("A");
  const [selectedDay, setSelectedDay] = useState("MONDAY");
  const [timetableSlots, setTimetableSlots] = useState<{
    periodNumber: number;
    startTime: string;
    endTime: string;
    subjectName: string;
    teacherName: string;
    room: string;
  }[]>([]);

  const loadData = async () => {
    try {
      const [classRes, subRes, yearRes] = await Promise.all([
        fetch("/api/admin/school/academics/classes"),
        fetch("/api/admin/school/academics/subjects"),
        fetch("/api/admin/school/academics/years"),
      ]);

      const classData = await classRes.json();
      const subData = await subRes.json();
      const yearData = await yearRes.json();

      if (classData.success) {
        setClasses(classData.classes);
        if (classData.classes.length > 0 && !selectedClassId) {
          setSelectedClassId(classData.classes[0]._id);
          setNewSubClassId(classData.classes[0]._id);
        }
      }
      if (subData.success) setSubjects(subData.subjects);
      if (yearData.success) setYears(yearData.years);
    } catch (err) {
      console.error("Failed to load academic data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const [classRes, subRes, yearRes] = await Promise.all([
          fetch("/api/admin/school/academics/classes"),
          fetch("/api/admin/school/academics/subjects"),
          fetch("/api/admin/school/academics/years"),
        ]);
        const classData = await classRes.json();
        const subData = await subRes.json();
        const yearData = await yearRes.json();

        if (!ignore) {
          if (classData.success) {
            setClasses(classData.classes);
            if (classData.classes.length > 0) {
              setSelectedClassId(classData.classes[0]._id);
              setNewSubClassId(classData.classes[0]._id);
            }
          }
          if (subData.success) setSubjects(subData.subjects);
          if (yearData.success) setYears(yearData.years);
        }
      } catch (err) {
        console.error("Academic init error:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, []);

  // Fetch timetable when selection changes
  useEffect(() => {
    if (!selectedClassId) return;
    async function fetchTimetable() {
      try {
        const res = await fetch(
          `/api/admin/school/academics/timetable?classId=${selectedClassId}&sectionName=${selectedSection}`
        );
        const data = await res.json();
        if (data.success && data.timetable.length > 0) {
          const dayMatch = data.timetable.find((t: { dayOfWeek: string }) => t.dayOfWeek === selectedDay);
          setTimetableSlots(dayMatch ? dayMatch.slots : []);
        } else {
          setTimetableSlots([]);
        }
      } catch (err) {
        console.error("Timetable fetch error:", err);
      }
    }
    fetchTimetable();
  }, [selectedClassId, selectedSection, selectedDay]);

  // Handlers
  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsedSections = newClassSections
        .split(",")
        .map((s) => ({ name: s.trim(), room: "Room 101", capacity: 40 }))
        .filter((s) => s.name.length > 0);

      const res = await fetch("/api/admin/school/academics/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newClassName, sections: parsedSections }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create class");

      setMessage({ text: `Class "${newClassName}" added successfully!`, type: "success" });
      setNewClassName("");
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error creating class";
      setMessage({ text: msg, type: "error" });
    }
  };

  const handleDeleteClass = async (id: string, name: string) => {
    if (!confirm(`Delete class "${name}" and all its subjects?`)) return;
    try {
      const res = await fetch(`/api/admin/school/academics/classes/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMessage({ text: `Class "${name}" deleted.`, type: "success" });
        loadData();
      }
    } catch (err) {
      console.error("Delete class error:", err);
    }
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/school/academics/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: newSubClassId,
          name: newSubName,
          code: newSubCode,
          type: newSubType,
          passMarks: newSubPassMarks,
          totalMarks: newSubTotalMarks,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add subject");

      setMessage({ text: `Subject "${newSubName}" added!`, type: "success" });
      setNewSubName("");
      setNewSubCode("");
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error adding subject";
      setMessage({ text: msg, type: "error" });
    }
  };

  const handleDeleteSubject = async (id: string, name: string) => {
    if (!confirm(`Delete subject "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/school/academics/subjects/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMessage({ text: `Subject "${name}" deleted.`, type: "success" });
        loadData();
      }
    } catch (err) {
      console.error("Delete subject error:", err);
    }
  };

  const handleAddYear = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/school/academics/years", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newYearName,
          startDate: newYearStart,
          endDate: newYearEnd,
          isCurrent: newYearIsCurrent,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create academic year");

      setMessage({ text: `Academic Year "${newYearName}" added!`, type: "success" });
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error creating year";
      setMessage({ text: msg, type: "error" });
    }
  };

  const handleSaveTimetable = async () => {
    try {
      const res = await fetch("/api/admin/school/academics/timetable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: selectedClassId,
          sectionName: selectedSection,
          dayOfWeek: selectedDay,
          slots: timetableSlots,
        }),
      });

      if (res.ok) {
        setMessage({ text: `Timetable for ${selectedDay} saved successfully!`, type: "success" });
      }
    } catch (err) {
      console.error("Save timetable error:", err);
    }
  };

  const addTimetableSlot = () => {
    const nextPeriod = timetableSlots.length + 1;
    setTimetableSlots([
      ...timetableSlots,
      {
        periodNumber: nextPeriod,
        startTime: nextPeriod === 1 ? "08:30" : "09:20",
        endTime: nextPeriod === 1 ? "09:15" : "10:05",
        subjectName: subjects[0]?.name || "Mathematics",
        teacherName: "Assigned Faculty",
        room: "Room 101",
      },
    ]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Academic Architecture</h1>
        <p className="text-sm text-slate-500">
          Configure classes, sections, subjects curriculum, academic years, and weekly timetable routines.
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

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("classes")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "classes"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Classes & Sections ({classes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("subjects")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "subjects"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Subjects ({subjects.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("timetable")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "timetable"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Class Timetable</span>
        </button>

        <button
          onClick={() => setActiveTab("years")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "years"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Academic Sessions ({years.length})</span>
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center flex flex-col items-center justify-center text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600 mb-2" />
          <p className="text-xs">Loading academic modules...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: CLASSES & SECTIONS */}
          {activeTab === "classes" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Classes List */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs">
                <h2 className="font-bold text-sm mb-4">Configured Classes & Streams</h2>

                {classes.length === 0 ? (
                  <p className="text-xs text-slate-400">No classes configured yet.</p>
                ) : (
                  <div className="space-y-3">
                    {classes.map((c) => (
                      <div
                        key={c._id}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <span className="font-bold text-sm">{c.name}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                            <span>Sections:</span>
                            <div className="flex items-center gap-1">
                              {c.sections.map((sec, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold text-[11px]"
                                >
                                  Section {sec.name}
                                </span>
                              ))}
                            </div>
                            <span className="ml-2 text-slate-400">
                              • {c.subjectCount || 0} Subjects
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteClass(c._id, c.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Class Form */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs h-fit">
                <h3 className="font-bold text-sm mb-3">Add New Class</h3>
                <form onSubmit={handleAddClass} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-medium mb-1">Class Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Grade 10, O-Levels Batch"
                      value={newClassName}
                      onChange={(e) => setNewClassName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-medium mb-1">Sections (comma separated)</label>
                    <input
                      type="text"
                      placeholder="A, B, C"
                      value={newClassSections}
                      onChange={(e) => setNewClassSections(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Example: &quot;A, B&quot; will create Section A and Section B.
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Class</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: SUBJECTS */}
          {activeTab === "subjects" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs">
                <h2 className="font-bold text-sm mb-4">Subjects Curriculum</h2>

                {subjects.length === 0 ? (
                  <p className="text-xs text-slate-400">No subjects added yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase">
                          <th className="py-2.5 px-3">Subject & Code</th>
                          <th className="py-2.5 px-3">Class</th>
                          <th className="py-2.5 px-3">Type</th>
                          <th className="py-2.5 px-3">Marks (Pass / Total)</th>
                          <th className="py-2.5 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {subjects.map((sub) => {
                          const className =
                            typeof sub.classId === "object" && sub.classId !== null
                              ? sub.classId.name
                              : "All Classes";
                          return (
                            <tr key={sub._id}>
                              <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                                {sub.name}{" "}
                                <span className="font-mono text-slate-400 font-normal">
                                  ({sub.code})
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                                {className}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                  {sub.type}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                                {sub.passMarks} / {sub.totalMarks}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <button
                                  onClick={() => handleDeleteSubject(sub._id, sub.name)}
                                  className="text-slate-400 hover:text-rose-600"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Add Subject Form */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs h-fit">
                <h3 className="font-bold text-sm mb-3">Add New Subject</h3>
                <form onSubmit={handleAddSubject} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-medium mb-1">Target Class *</label>
                    <select
                      value={newSubClassId}
                      onChange={(e) => setNewSubClassId(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      {classes.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium mb-1">Subject Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mathematics"
                      value={newSubName}
                      onChange={(e) => setNewSubName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-medium mb-1">Subject Code *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. MTH-10"
                        value={newSubCode}
                        onChange={(e) => setNewSubCode(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono uppercase"
                      />
                    </div>
                    <div>
                      <label className="block font-medium mb-1">Subject Type</label>
                      <select
                        value={newSubType}
                        onChange={(e) => setNewSubType(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      >
                        <option value="CORE">Core</option>
                        <option value="ELECTIVE">Elective</option>
                        <option value="PRACTICAL">Practical</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-medium mb-1">Pass Marks</label>
                      <input
                        type="number"
                        value={newSubPassMarks}
                        onChange={(e) => setNewSubPassMarks(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block font-medium mb-1">Total Marks</label>
                      <input
                        type="number"
                        value={newSubTotalMarks}
                        onChange={(e) => setNewSubTotalMarks(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Save Subject</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 3: CLASS TIMETABLE */}
          {activeTab === "timetable" && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div>
                    <label className="font-medium mr-2">Class:</label>
                    <select
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
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
                    <label className="font-medium mr-2">Section:</label>
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
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-medium mr-2">Day:</label>
                    <select
                      value={selectedDay}
                      onChange={(e) => setSelectedDay(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                    >
                      <option value="MONDAY">Monday</option>
                      <option value="TUESDAY">Tuesday</option>
                      <option value="WEDNESDAY">Wednesday</option>
                      <option value="THURSDAY">Thursday</option>
                      <option value="FRIDAY">Friday</option>
                      <option value="SATURDAY">Saturday</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={addTimetableSlot}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Period Slot</span>
                  </button>
                  <button
                    onClick={handleSaveTimetable}
                    className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <span>Save {selectedDay} Routine</span>
                  </button>
                </div>
              </div>

              {/* Slots Table */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs">
                {timetableSlots.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No periods scheduled for {selectedDay}. Click &quot;Add Period Slot&quot; to begin building the routine.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {timetableSlots.map((slot, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 grid grid-cols-1 sm:grid-cols-6 gap-2 items-center text-xs"
                      >
                        <div className="font-bold text-slate-700 dark:text-slate-300">
                          Period {slot.periodNumber}
                        </div>

                        <div>
                          <input
                            type="text"
                            value={slot.startTime}
                            onChange={(e) => {
                              const updated = [...timetableSlots];
                              updated[idx].startTime = e.target.value;
                              setTimetableSlots(updated);
                            }}
                            className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                            placeholder="Start (08:30)"
                          />
                        </div>

                        <div>
                          <input
                            type="text"
                            value={slot.endTime}
                            onChange={(e) => {
                              const updated = [...timetableSlots];
                              updated[idx].endTime = e.target.value;
                              setTimetableSlots(updated);
                            }}
                            className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                            placeholder="End (09:15)"
                          />
                        </div>

                        <div>
                          <input
                            type="text"
                            value={slot.subjectName}
                            onChange={(e) => {
                              const updated = [...timetableSlots];
                              updated[idx].subjectName = e.target.value;
                              setTimetableSlots(updated);
                            }}
                            className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                            placeholder="Subject"
                          />
                        </div>

                        <div>
                          <input
                            type="text"
                            value={slot.teacherName}
                            onChange={(e) => {
                              const updated = [...timetableSlots];
                              updated[idx].teacherName = e.target.value;
                              setTimetableSlots(updated);
                            }}
                            className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                            placeholder="Teacher Name"
                          />
                        </div>

                        <div className="flex items-center justify-between gap-1">
                          <input
                            type="text"
                            value={slot.room}
                            onChange={(e) => {
                              const updated = [...timetableSlots];
                              updated[idx].room = e.target.value;
                              setTimetableSlots(updated);
                            }}
                            className="w-24 px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                            placeholder="Room"
                          />
                          <button
                            onClick={() => {
                              setTimetableSlots(timetableSlots.filter((_, sidx) => sidx !== idx));
                            }}
                            className="text-slate-400 hover:text-rose-600 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: ACADEMIC SESSIONS */}
          {activeTab === "years" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs">
                <h2 className="font-bold text-sm mb-4">Academic Sessions & Years</h2>

                {years.length === 0 ? (
                  <p className="text-xs text-slate-400">No academic sessions added yet.</p>
                ) : (
                  <div className="space-y-3">
                    {years.map((y) => (
                      <div
                        key={y._id}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm">{y.name}</span>
                            {y.isCurrent && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300">
                                Current Active Session
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-1">
                            {new Date(y.startDate).toLocaleDateString()} to{" "}
                            {new Date(y.endDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Year Form */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs h-fit">
                <h3 className="font-bold text-sm mb-3">Add Academic Session</h3>
                <form onSubmit={handleAddYear} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-medium mb-1">Session Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 2026-2027"
                      value={newYearName}
                      onChange={(e) => setNewYearName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-medium mb-1">Start Date *</label>
                    <input
                      type="date"
                      required
                      value={newYearStart}
                      onChange={(e) => setNewYearStart(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-medium mb-1">End Date *</label>
                    <input
                      type="date"
                      required
                      value={newYearEnd}
                      onChange={(e) => setNewYearEnd(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="isCurrentYear"
                      checked={newYearIsCurrent}
                      onChange={(e) => setNewYearIsCurrent(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <label htmlFor="isCurrentYear" className="font-medium">
                      Set as current active academic session
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Save Session</span>
                  </button>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
