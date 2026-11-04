import React from "react";
import { getSession } from "@/lib/auth";
import { CheckCircle2, Receipt, Download, User } from "lucide-react";

export default async function ParentFeesPage() {
  const session = await getSession();

  const mockChildInvoices = [
    {
      invoiceNumber: "INV-2026-8812-1",
      studentName: "Leo Miller",
      grade: "Grade 10-A",
      month: "November 2026",
      totalAmount: 2500,
      paidAmount: 2500,
      dueDate: "2026-11-15",
      status: "PAID",
      heads: [
        { name: "Monthly Tuition Fee", amount: 2000 },
        { name: "Science Lab Fee", amount: 300 },
        { name: "Library & Sports", amount: 200 },
      ],
    },
    {
      invoiceNumber: "INV-2026-7641-1",
      studentName: "Leo Miller",
      grade: "Grade 10-A",
      month: "October 2026",
      totalAmount: 2500,
      paidAmount: 2500,
      dueDate: "2026-10-15",
      status: "PAID",
      heads: [
        { name: "Monthly Tuition Fee", amount: 2000 },
        { name: "Science Lab Fee", amount: 300 },
        { name: "Library & Sports", amount: 200 },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Student Fee Vouchers & Receipts</h1>
          <p className="text-sm text-slate-500">
            Monitor and download fee slips for enrolled dependents of {session?.name}.
          </p>
        </div>

        <div className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold">
          <User className="w-4 h-4 text-amber-500" />
          <span>Child: Leo Miller (Grade 10-A)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs uppercase font-semibold text-slate-400">Total Dues</span>
          <div className="flex items-center gap-2 mt-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <p className="text-xl font-bold text-emerald-600">$0.00 Due</p>
          </div>
          <p className="text-xs text-slate-400 mt-1">Account in good standing</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs uppercase font-semibold text-slate-400">Next Due Date</span>
          <p className="text-xl font-bold mt-2">Dec 15, 2026</p>
          <p className="text-xs text-slate-400 mt-1">December Fee Cycle</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs uppercase font-semibold text-slate-400">Total Paid (YTD)</span>
          <p className="text-xl font-bold text-blue-600 mt-2">$5,000</p>
          <p className="text-xs text-slate-400 mt-1">All receipts cleared</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs">
        <h2 className="font-bold text-sm mb-4">Fee Vouchers & Payment History</h2>
        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {mockChildInvoices.map((inv) => (
            <div key={inv.invoiceNumber} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-slate-900 dark:text-white">{inv.month}</span>
                  <span className="font-mono text-slate-400 text-[11px]">({inv.invoiceNumber})</span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-slate-500 text-[11px]">
                  <span>Total: ${inv.totalAmount}</span>
                  <span>• Paid: ${inv.paidAmount}</span>
                  <span>• Due Date: {inv.dueDate}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300">
                  {inv.status}
                </span>
                <button
                  type="button"
                  className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Voucher</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
