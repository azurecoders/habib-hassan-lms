import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import {
  GraduationCap,
  Users,
  CalendarCheck,
  CreditCard,
  FileSpreadsheet,
  Bell,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { UserRole } from "@/types/auth";

export default async function HomePage() {
  const session = await getSession();

  if (session) {
    const roleHomeMap: Record<UserRole, string> = {
      SUPER_ADMIN: "/admin/saas",
      INSTITUTION_ADMIN: "/admin/school",
      TEACHER: "/teacher",
      PARENT: "/parent",
      STUDENT: "/student",
    };
    redirect(roleHomeMap[session.role] || "/login");
  }

  const features = [
    {
      title: "Multi-Tenant Architecture",
      desc: "Run unlimited schools and coaching institutes with strict data isolation and custom branding.",
      icon: ShieldCheck,
      color: "text-blue-500",
    },
    {
      title: "Free-Tier Optimized",
      desc: "Engineered specifically for Vercel Free & MongoDB Atlas M0 with singleton connection caching.",
      icon: Zap,
      color: "text-amber-500",
    },
    {
      title: "Student & Staff Management",
      desc: "Complete admissions pipeline, roll numbers, guardian linkages, and staff allocations.",
      icon: GraduationCap,
      color: "text-indigo-500",
    },
    {
      title: "Attendance & Scheduling",
      desc: "Lightning-fast daily student & faculty attendance tracking with instant absentee alerts.",
      icon: CalendarCheck,
      color: "text-emerald-500",
    },
    {
      title: "Fee & Financial Vouchers",
      desc: "Custom fee heads, automated monthly voucher generation, discounts, and payment receipts.",
      icon: CreditCard,
      color: "text-violet-500",
    },
    {
      title: "Exams & Report Cards",
      desc: "Exam scheduling, teacher marks entry, GPA calculations, and printable progress cards.",
      icon: FileSpreadsheet,
      color: "text-rose-500",
    },
    {
      title: "Communication & Notices",
      desc: "Role-targeted notice boards for school announcements, alerts, and parent updates.",
      icon: Bell,
      color: "text-teal-500",
    },
    {
      title: "5 Distinct Role Portals",
      desc: "Dedicated user experiences for SaaS Super Admins, School Principals, Teachers, Parents, and Students.",
      icon: Users,
      color: "text-sky-500",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight">EdTech SaaS</span>
          </div>

          <Link
            href="/login"
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <span>Sign In / Demo Login</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold uppercase tracking-wider mb-6">
          Multi-Tenant Educational OS
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl leading-tight">
          Modern, Blazing Fast{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            School Management SaaS
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl">
          Manage multiple schools, branches, and coaching institutes effortlessly. High-performance, lightweight, and engineered to run smoothly on Vercel & MongoDB Atlas free tiers.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Link
            href="/login"
            className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>Launch Interactive Portal</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#features"
            className="px-6 py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium text-sm transition-all"
          >
            Explore Modules
          </a>
        </div>

        {/* Feature Grid */}
        <section id="features" className="mt-24 w-full text-left">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              All 8 Core Management Modules Included
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Everything required to run institutions at speed without technical debt
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                >
                  <div className={`p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 w-fit mb-3 ${f.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-base mb-1.5">{f.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500">
        Multi-Tenant School Management System &copy; {new Date().getFullYear()}. Fast, Lean & Efficient.
      </footer>
    </div>
  );
}
