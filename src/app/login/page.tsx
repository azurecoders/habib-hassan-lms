"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Database,
  KeyRound,
  ShieldCheck,
  Building2,
  Users,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    const loginEmail = customEmail || email;
    const loginPass = customPass || password;

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPass }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      router.push(data.redirectUrl || "/");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      setLoading(false);
    }
  };

  const adminCredentials = [
    {
      title: "SaaS Super Admin",
      email: "superadmin@lms.com",
      role: "Platform Super Admin",
      desc: "Manage all tenant schools, billing plans, and SaaS platform health.",
      icon: ShieldCheck,
      color: "border-purple-200 hover:border-purple-400 dark:border-purple-900/60 bg-purple-50/50 dark:bg-purple-950/20",
      textColor: "text-purple-600 dark:text-purple-400",
    },
    {
      title: "School Principal / Admin",
      email: "principal@apex.edu",
      role: "Apex International Academy",
      desc: "Manage academics, admit students, assign teachers, and view finances.",
      icon: Building2,
      color: "border-blue-200 hover:border-blue-400 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20",
      textColor: "text-blue-600 dark:text-blue-400",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-blue-500 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-500/20">
          <GraduationCap className="w-7 h-7" />
        </div>
        <h2 className="mt-4 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Sign In to Your Portal
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Access your institution workspace, grading desk, or learner portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 shadow-xl shadow-slate-200/50 dark:shadow-none sm:rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={(e) => handleLogin(e)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@institution.edu"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick One-Click Admin Credentials */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
              1-Click Administrator Access:
            </span>
            <div className="space-y-2">
              {adminCredentials.map((c) => {
                const Icon = c.icon;
                return (
                  <button
                    key={c.email}
                    type="button"
                    onClick={() => {
                      setEmail(c.email);
                      setPassword("password123");
                      handleLogin(undefined, c.email, "password123");
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition flex items-start justify-between cursor-pointer ${c.color}`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800 shadow-2xs mt-0.5">
                        <Icon className={`w-4 h-4 ${c.textColor}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                            {c.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                          {c.email} • password123
                        </p>
                      </div>
                    </div>

                    <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 shrink-0 self-center">
                      Auto-fill →
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Dynamic Roles Info Callout */}
            <div className="mt-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed flex items-start gap-2.5">
              <Users className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-700 dark:text-slate-300">
                  Dynamic Role Provisioning:
                </strong>{" "}
                Teachers, Students, and Parents are dynamically created by the School Administrator. Once admitted or recruited, their accounts are immediately active.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
