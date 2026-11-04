"use client";

import React, { useState } from "react";
import { Clock, MapPin, Calendar } from "lucide-react";

interface PeriodSlot {
  period: number;
  time: string;
  subject: string;
  className: string;
  room: string;
  type: "Lec" | "Lab" | "Activity";
}

export default function TeacherTimetablePage() {
  const [selectedDay, setSelectedDay] = useState<string>("Monday");

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const schedule: Record<string, PeriodSlot[]> = {
    Monday: [
      { period: 1, time: "08:30 AM - 09:15 AM", subject: "Advanced Physics", className: "Grade 10 - Sec A", room: "Room 302", type: "Lec" },
      { period: 2, time: "09:20 AM - 10:05 AM", subject: "General Science", className: "Grade 9 - Sec B", room: "Lab 2", type: "Lab" },
      { period: 3, time: "10:10 AM - 10:55 AM", subject: "Free / Office Hours", className: "Staff Room", room: "Desk 14", type: "Activity" },
      { period: 4, time: "11:30 AM - 12:15 PM", subject: "Applied Physics", className: "Grade 11 - Sec A", room: "Room 401", type: "Lec" },
    ],
    Tuesday: [
      { period: 1, time: "08:30 AM - 09:15 AM", subject: "Physics Lab Experiment", className: "Grade 10 - Sec A", room: "Science Lab 1", type: "Lab" },
      { period: 2, time: "09:20 AM - 10:05 AM", subject: "Physics Lab Experiment", className: "Grade 10 - Sec A", room: "Science Lab 1", type: "Lab" },
      { period: 4, time: "11:30 AM - 12:15 PM", subject: "General Science", className: "Grade 9 - Sec A", room: "Room 204", type: "Lec" },
    ],
    Wednesday: [
      { period: 1, time: "08:30 AM - 09:15 AM", subject: "Advanced Physics", className: "Grade 10 - Sec B", room: "Room 303", type: "Lec" },
      { period: 3, time: "10:10 AM - 10:55 AM", subject: "Mentorship & Guidance", className: "Grade 10 - Sec A", room: "Room 302", type: "Activity" },
      { period: 5, time: "12:20 PM - 01:05 PM", subject: "Applied Physics", className: "Grade 11 - Sec A", room: "Room 401", type: "Lec" },
    ],
    Thursday: [
      { period: 2, time: "09:20 AM - 10:05 AM", subject: "Advanced Physics", className: "Grade 10 - Sec A", room: "Room 302", type: "Lec" },
      { period: 3, time: "10:10 AM - 10:55 AM", subject: "General Science", className: "Grade 9 - Sec B", room: "Room 205", type: "Lec" },
      { period: 4, time: "11:30 AM - 12:15 PM", subject: "Faculty Academic Meeting", className: "Conference Hall", room: "Boardroom", type: "Activity" },
    ],
    Friday: [
      { period: 1, time: "08:30 AM - 09:15 AM", subject: "Weekly Quiz & Review", className: "Grade 10 - Sec A", room: "Room 302", type: "Lec" },
      { period: 2, time: "09:20 AM - 10:05 AM", subject: "Weekly Quiz & Review", className: "Grade 9 - Sec B", room: "Room 205", type: "Lec" },
    ],
    Saturday: [
      { period: 1, time: "09:00 AM - 11:00 AM", subject: "Weekend Science Club & Robotics", className: "Open Batch", room: "STEM Lab", type: "Activity" },
    ],
  };

  const currentSlots = schedule[selectedDay] || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Faculty Teaching Timetable</h1>
        <p className="text-sm text-slate-500">
          Your weekly assigned lecture periods, labs, and classroom allocations.
        </p>
      </div>

      {/* Day Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {days.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              selectedDay === day
                ? "bg-blue-600 text-white shadow-2xs"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Routine Grid */}
      <div className="space-y-3">
        {currentSlots.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No scheduled periods on {selectedDay}. Enjoy your break!</p>
          </div>
        ) : (
          currentSlots.map((slot, idx) => (
            <div
              key={idx}
              className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs hover:border-blue-300 dark:hover:border-blue-700 transition"
            >
              <div className="flex items-start sm:items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                  P{slot.period}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      {slot.subject}
                    </h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        slot.type === "Lab"
                          ? "bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300"
                          : slot.type === "Lec"
                          ? "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300"
                          : "bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      {slot.type}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{slot.className}</span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <MapPin className="w-3.5 h-3.5" /> {slot.room}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/60 self-start sm:self-auto">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                <span>{slot.time}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
