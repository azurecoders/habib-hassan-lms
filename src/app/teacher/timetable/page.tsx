"use client";

import React, { useState, useEffect } from "react";
import { Clock, MapPin, Calendar, Loader2, BookOpen, AlertCircle } from "lucide-react";

interface PeriodSlot {
  periodNumber: number;
  startTime: string;
  endTime: string;
  subjectName: string;
  teacherName?: string;
  room?: string;
}

interface TimetableDoc {
  _id: string;
  dayOfWeek: string;
  slots: PeriodSlot[];
}

interface AllocationItem {
  _id: string;
  classId: { _id: string; name: string };
  sectionName: string;
  subjectId: { _id: string; name: string; code: string };
}

export default function TeacherTimetablePage() {
  const [allocations, setAllocations] = useState<AllocationItem[]>([]);
  const [selectedAllocationId, setSelectedAllocationId] = useState("");
  const [selectedDay, setSelectedDay] = useState<string>("MONDAY");
  const [timetableMap, setTimetableMap] = useState<Record<string, PeriodSlot[]>>({});
  const [loading, setLoading] = useState(true);
  const [loadingTimetable, setLoadingTimetable] = useState(false);

  const days = [
    { label: "Monday", val: "MONDAY" },
    { label: "Tuesday", val: "TUESDAY" },
    { label: "Wednesday", val: "WEDNESDAY" },
    { label: "Thursday", val: "THURSDAY" },
    { label: "Friday", val: "FRIDAY" },
    { label: "Saturday", val: "SATURDAY" },
  ];

  // 1. Fetch teacher allocations
  useEffect(() => {
    let ignore = false;
    async function loadAllocations() {
      try {
        const res = await fetch("/api/teacher/classes");
        const data = await res.json();
        if (!ignore && data.success && Array.isArray(data.allocations)) {
          const valid = data.allocations.filter(
            (a: AllocationItem) => a.classId && a.sectionName
          );
          setAllocations(valid);
          if (valid.length > 0) {
            setSelectedAllocationId(valid[0]._id);
          }
        }
      } catch (err) {
        console.error("Load teacher allocations error:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    loadAllocations();
    return () => {
      ignore = true;
    };
  }, []);

  const activeAllocation = allocations.find((a) => a._id === selectedAllocationId);

  // 2. Fetch timetable for the selected class & section
  useEffect(() => {
    if (!activeAllocation) return;

    let ignore = false;
    async function fetchTimetable() {
      setLoadingTimetable(true);
      try {
        const classId = activeAllocation?.classId._id;
        const sectionName = activeAllocation?.sectionName;

        const res = await fetch(
          `/api/admin/school/academics/timetable?classId=${classId}&sectionName=${sectionName}`
        );
        const data = await res.json();
        if (!ignore && data.success && Array.isArray(data.timetable)) {
          const map: Record<string, PeriodSlot[]> = {};
          data.timetable.forEach((doc: TimetableDoc) => {
            const key = (doc.dayOfWeek || "").toUpperCase();
            map[key] = (doc.slots || []).sort((a, b) => a.periodNumber - b.periodNumber);
          });
          setTimetableMap(map);
        } else if (!ignore) {
          setTimetableMap({});
        }
      } catch (err) {
        console.error("Fetch timetable error:", err);
      } finally {
        if (!ignore) setLoadingTimetable(false);
      }
    }

    fetchTimetable();
    return () => {
      ignore = true;
    };
  }, [selectedAllocationId]);

  const currentSlots = timetableMap[selectedDay] || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Faculty Teaching Timetable</h1>
          <p className="text-sm text-slate-500">
            Real-time schedule of your assigned classes, period times, and lecture rooms.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
          <p className="text-xs font-medium text-slate-500">Loading your teaching routine...</p>
        </div>
      ) : allocations.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No Teaching Routine Assigned
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            You do not have any classes or subjects assigned yet. Once the school administrator allocates your teaching subjects, your daily routine will populate here.
          </p>
        </div>
      ) : (
        <>
          {/* Class & Day Selectors */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-500 uppercase tracking-wider text-[11px]">
                Class Section:
              </span>
              <select
                value={selectedAllocationId}
                onChange={(e) => setSelectedAllocationId(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
              >
                {allocations.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.classId.name} - Section {a.sectionName} ({a.subjectId.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Day Selector Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {days.map((d) => (
                <button
                  key={d.val}
                  onClick={() => setSelectedDay(d.val)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    selectedDay === d.val
                      ? "bg-blue-600 text-white shadow-2xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Routine List */}
          <div className="space-y-3">
            {loadingTimetable ? (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500">Loading period schedule...</p>
              </div>
            ) : currentSlots.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">
                  No Periods Scheduled
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  No academic routine is configured for {days.find((d) => d.val === selectedDay)?.label} in {activeAllocation?.classId.name} - Section {activeAllocation?.sectionName}.
                </p>
              </div>
            ) : (
              currentSlots.map((slot, idx) => (
                <div
                  key={idx}
                  className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs hover:border-blue-300 dark:hover:border-blue-700 transition"
                >
                  <div className="flex items-start sm:items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0 border border-blue-100 dark:border-blue-900/50">
                      P{slot.periodNumber}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                          {slot.subjectName}
                        </h3>
                        {slot.teacherName && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {slot.teacherName}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {activeAllocation?.classId.name} - Sec {activeAllocation?.sectionName}
                        </span>
                        {slot.room && (
                          <span className="flex items-center gap-1 text-slate-400">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" /> Room {slot.room}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/60 self-start sm:self-auto">
                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                    <span>
                      {slot.startTime} - {slot.endTime}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
