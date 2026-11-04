import React from "react";
import { Check, Zap, Shield, Sparkles } from "lucide-react";

export default function SaasSubscriptionsPage() {
  const tiers = [
    {
      name: "FREE TIER",
      price: "$0",
      period: "forever",
      desc: "Ideal for small coaching institutes, pilot programs, or single-teacher academies.",
      icon: Zap,
      badge: "Popular for Starters",
      features: [
        "Up to 100 Enrolled Students",
        "Up to 5 Teachers & Staff",
        "Daily Student Attendance",
        "Exam Marks & Basic Reports",
        "Notice Board Announcements",
        "Community Support",
      ],
      highlight: false,
    },
    {
      name: "BASIC TIER",
      price: "$49",
      period: "per month",
      desc: "Designed for growing primary & secondary schools with automated fee collection.",
      icon: Shield,
      badge: "Growing Schools",
      features: [
        "Up to 500 Enrolled Students",
        "Up to 25 Faculty & Staff",
        "Full Fee Invoicing & Receipts",
        "Attendance Analytics & SMS Alerts",
        "Exam Scheduling & Report Cards",
        "Email & Chat Support (24h)",
      ],
      highlight: true,
    },
    {
      name: "PRO ENTERPRISE",
      price: "$199",
      period: "per month",
      desc: "For large colleges, multi-branch coaching networks, and full academy chains.",
      icon: Sparkles,
      badge: "Maximum Power",
      features: [
        "Unlimited Students & Campuses",
        "Unlimited Teachers & Staff",
        "Custom Domain & Branding",
        "Advanced Financial Analytics",
        "Priority Support & Dedicated Onboarding",
        "Automatic Data Backups",
      ],
      highlight: false,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Subscription Plans & Tiers</h1>
        <p className="text-sm text-slate-500">
          Manage pricing packages, quota limits, and billing structures for institutional tenants.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {tiers.map((t, idx) => {
          const Icon = t.icon;
          return (
            <div
              key={idx}
              className={`rounded-2xl p-6 bg-white dark:bg-slate-900 border transition-all flex flex-col justify-between ${
                t.highlight
                  ? "border-blue-500 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500"
                  : "border-slate-200 dark:border-slate-800 shadow-2xs"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {t.badge}
                  </span>
                </div>

                <h3 className="font-bold text-lg">{t.name}</h3>
                <p className="text-xs text-slate-500 mt-1 mb-4">{t.desc}</p>

                <div className="flex items-baseline gap-1 my-4">
                  <span className="text-3xl font-extrabold">{t.price}</span>
                  <span className="text-xs text-slate-400">/{t.period}</span>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                  {t.features.map((feat, fidx) => (
                    <div key={fidx} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="button"
                  className={`w-full py-2.5 rounded-xl font-medium text-xs transition-all ${
                    t.highlight
                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
                      : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white"
                  }`}
                >
                  Configure Tier Limits
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
