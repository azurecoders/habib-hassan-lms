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
  CheckCircle2,
  BookOpen,
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
      desc: "Run independent schools, coaching branches, and academies with strict multi-tenant isolation.",
      icon: ShieldCheck,
      color: "text-blue-500 bg-blue-50 dark:bg-blue-950/50",
    },
    {
      title: "Free-Tier Engine",
      desc: "Engineered specifically for Vercel Free Serverless and MongoDB Atlas with connection pool caching.",
      icon: Zap,
      color: "text-amber-500 bg-amber-50 dark:bg-amber-950/50",
    },
    {
      title: "Student Admissions & Directory",
      desc: "Complete admissions pipeline with roll numbers, sections, guardian linkages, and ImageKit avatars.",
      icon: GraduationCap,
      color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/50",
    },
    {
      title: "Faculty & Class Allocations",
      desc: "Staff directory with 1-click class, section, and subject assignment matrix for teachers.",
      icon: BookOpen,
      color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/50",
    },
    {
      title: "Attendance Management",
      desc: "Lightning-fast daily student & staff roll calls with presence rates, bulk toggles, and logs.",
      icon: CalendarCheck,
      color: "text-teal-500 bg-teal-50 dark:bg-teal-950/50",
    },
    {
      title: "Fee Structures & Invoices",
      desc: "Custom fee heads, automated monthly billing vouchers, discounts, and payment tracking.",
      icon: CreditCard,
      color: "text-violet-500 bg-violet-50 dark:bg-violet-950/50",
    },
    {
      title: "Exams & Printable Report Cards",
      desc: "Terms management, teacher gradebooks with auto letter grades, and printable transcripts.",
      icon: FileSpreadsheet,
      color: "text-rose-500 bg-rose-50 dark:bg-rose-950/50",
    },
    {
      title: "5 Scoped Role Portals",
      desc: "Dedicated workspaces for SaaS Super Admins, School Principals, Teachers, Parents, and Students.",
      icon: Users,
      color: "text-sky-500 bg-sky-50 dark:bg-sky-950/50",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white">
      {/* Top Navigation */}
      <header className="h-16 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight">Apex Academy</span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold ml-1.5 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800">
                LMS Cloud
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>Access Portals</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-900/80 text-blue-700 dark:text-blue-300 text-xs font-semibold uppercase tracking-wider mb-6">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span>Multi-Tenant School Operating System</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight max-w-4xl leading-[1.15]">
          A Next-Gen, Blazing Fast{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
            School & Academy LMS
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
          Manage multiple schools, branches, and coaching academies effortlessly. High-performance, lightweight, and engineered specifically for modern cloud serverless environments.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Link
            href="/login"
            className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>Sign In to Your Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#features"
            className="px-6 py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-xs transition-all"
          >
            Explore All 8 Modules
          </a>
        </div>

        {/* Feature Grid */}
        <section id="features" className="mt-24 w-full text-left">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Enterprise Grade Management Modules
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Complete end-to-end operational software designed for educators, students, and parents
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-blue-300 dark:hover:border-blue-700 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className={`p-3 rounded-xl w-fit mb-4 ${f.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-sm mb-1.5 text-slate-900 dark:text-white">{f.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {f.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-400">
        Multi-Tenant School Management System &copy; 2026. High Performance & Scalable.
      </footer>
    </div>
  );
}
