"use client";

import React, { useEffect, useState } from "react";
import { Bell, Calendar, AlertCircle } from "lucide-react";

interface NoticeItem {
  _id: string;
  title: string;
  content: string;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  targetAudience: "ALL" | "TEACHER" | "PARENT" | "STUDENT";
  authorName: string;
  createdAt: string;
}

export default function ParentNoticesPage() {
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetch("/api/admin/school/notices");
        const data = await res.json();
        if (!ignore && data.success) {
          setNotices(data.notices || []);
        }
      } catch (err) {
        console.error("Failed to load parent circulars:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Parent Circulars & Notifications</h1>
        <p className="text-sm text-slate-500">
          Official institution circulars, parent-teacher meeting notices, holiday announcements, and emergency updates.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          Loading school circulars...
        </div>
      ) : notices.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700 dark:text-slate-300">No New Notifications</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            You are completely caught up! No recent school circulars or alerts.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {notices.map((n) => (
            <div
              key={n._id}
              className={`p-5 rounded-xl shadow-2xs space-y-3 border transition ${
                n.priority === "URGENT"
                  ? "bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              }`}
            >
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      n.priority === "URGENT"
                        ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800"
                        : n.priority === "HIGH"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                        : "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                    }`}
                  >
                    {n.priority}
                  </span>

                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(n.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>

                {n.priority === "URGENT" && (
                  <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Urgent Attention
                  </span>
                )}
              </div>

              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">{n.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line mt-1.5 leading-relaxed">
                  {n.content}
                </p>
              </div>

              <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-50 dark:border-slate-800/40">
                <span>Issued by: <strong className="text-slate-700 dark:text-slate-300">{n.authorName}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
