"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, Receipt, Download, Loader2, AlertCircle, Clock } from "lucide-react";

interface FeeHead {
  name: string;
  amount: number;
}

interface InvoiceItem {
  _id: string;
  invoiceNumber: string;
  month: string;
  totalAmount: number;
  paidAmount: number;
  dueDate: string;
  status: "PAID" | "UNPAID" | "PARTIAL" | "OVERDUE";
  heads: FeeHead[];
}

export default function StudentFeesPage() {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);

  useEffect(() => {
    let ignore = false;
    async function loadInvoices() {
      try {
        const res = await fetch("/api/admin/school/fees/invoices");
        const data = await res.json();
        if (!ignore && data.success && Array.isArray(data.invoices)) {
          setInvoices(data.invoices);
        }
      } catch (err) {
        console.error("Failed to load student fee invoices:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    loadInvoices();
    return () => {
      ignore = true;
    };
  }, []);

  const totalPaid = invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
  const totalDue = invoices
    .filter((inv) => inv.status !== "PAID")
    .reduce((sum, inv) => sum + (inv.totalAmount - (inv.paidAmount || 0)), 0);
  const unpaidCount = invoices.filter((inv) => inv.status !== "PAID").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fee Status & Receipts</h1>
          <p className="text-sm text-slate-500">
            Official monthly fee invoices, payment status, and institutional receipts.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
          <p className="text-xs font-medium text-slate-500">Loading your fee vouchers...</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-xs uppercase font-semibold text-slate-400">Current Standing</span>
              {totalDue === 0 ? (
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <p className="text-xl font-extrabold text-emerald-600">All Dues Cleared</p>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Zero outstanding balance</p>
                </div>
              ) : (
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                    <p className="text-xl font-extrabold text-amber-600">${totalDue.toLocaleString()} Due</p>
                  </div>
                  <p className="text-xs text-amber-600/80 mt-1">{unpaidCount} pending voucher(s)</p>
                </div>
              )}
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-xs uppercase font-semibold text-slate-400">Total Invoices</span>
              <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-2">
                {invoices.length} Vouchers
              </p>
              <p className="text-xs text-slate-400 mt-1">Generated this academic term</p>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-xs uppercase font-semibold text-slate-400">Total Settled (YTD)</span>
              <p className="text-xl font-extrabold text-blue-600 mt-2">${totalPaid.toLocaleString()}</p>
              <p className="text-xs text-slate-400 mt-1">Total payments confirmed</p>
            </div>
          </div>

          {/* Vouchers Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs">
            <h2 className="font-bold text-sm mb-4 text-slate-900 dark:text-white">Fee Vouchers History</h2>

            {invoices.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                No fee vouchers issued for your account yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {invoices.map((inv) => (
                  <div
                    key={inv._id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-blue-600" />
                        <span className="font-bold text-slate-900 dark:text-white">{inv.month}</span>
                        <span className="font-mono text-slate-400 text-[11px]">
                          ({inv.invoiceNumber})
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-slate-500 text-[11px]">
                        <span>Total: <strong>${inv.totalAmount}</strong></span>
                        <span>• Paid: <strong>${inv.paidAmount}</strong></span>
                        {inv.dueDate && (
                          <span>
                            • Due: {new Date(inv.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        )}
                        {inv.heads && inv.heads.length > 0 && (
                          <span className="text-slate-400">
                            ({inv.heads.map((h) => `${h.name}: $${h.amount}`).join(", ")})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          inv.status === "PAID"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
                            : inv.status === "PARTIAL"
                            ? "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300"
                            : "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
