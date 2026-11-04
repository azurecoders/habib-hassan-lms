"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Search,
  Printer,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Layers,
} from "lucide-react";

interface InvoiceItem {
  _id: string;
  invoiceNumber: string;
  month: string;
  issueDate: string;
  dueDate: string;
  heads: { name: string; amount: number }[];
  totalAmount: number;
  discountAmount: number;
  paidAmount: number;
  status: "PAID" | "PARTIAL" | "UNPAID" | "OVERDUE";
  classId?: { _id: string; name: string };
  studentId?: {
    admissionNumber: string;
    rollNumber: string;
    sectionName: string;
    userId?: {
      name: string;
      email: string;
      phone?: string;
    };
  };
}

interface FeeStructureItem {
  _id: string;
  title: string;
  totalAmount: number;
  dueDay: number;
  heads: { name: string; amount: number }[];
  classId?: { _id: string; name: string };
}

interface ClassItem {
  _id: string;
  name: string;
}

export default function FeeManagementPage() {
  const [activeTab, setActiveTab] = useState<"invoices" | "structures">("invoices");
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [structures, setStructures] = useState<FeeStructureItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [classFilter, setClassFilter] = useState("ALL");

  // Modals
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(null);

  // Forms
  const [generateClassId, setGenerateClassId] = useState("");
  const [generateMonth, setGenerateMonth] = useState("November 2026");
  const [generateDueDate, setGenerateDueDate] = useState("2026-11-15");
  const [generating, setGenerating] = useState(false);

  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "BANK_TRANSFER" | "ONLINE">("CASH");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const [feedback, setFeedback] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const refreshInvoices = async () => {
    try {
      const res = await fetch("/api/admin/school/fees/invoices");
      const data = await res.json();
      if (data.success) {
        setInvoices(data.invoices);
      }
    } catch (err) {
      console.error("Failed to load invoices:", err);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const [invRes, structRes, classRes] = await Promise.all([
          fetch("/api/admin/school/fees/invoices"),
          fetch("/api/admin/school/fees/structures"),
          fetch("/api/admin/school/academics/classes"),
        ]);
        const invData = await invRes.json();
        const structData = await structRes.json();
        const classData = await classRes.json();

        if (!ignore) {
          if (invData.success) setInvoices(invData.invoices);
          if (structData.success) setStructures(structData.structures);
          if (classData.success && classData.classes.length > 0) {
            setClasses(classData.classes);
            setGenerateClassId(classData.classes[0]._id);
          }
        }
      } catch (err) {
        console.error("Init fees error:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, []);

  const handleGenerateInvoices = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/school/fees/invoices/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: generateClassId,
          month: generateMonth,
          dueDate: generateDueDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate vouchers");

      setFeedback({ text: data.message, type: "success" });
      setIsGenerateModalOpen(false);
      refreshInvoices();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error generating vouchers";
      setFeedback({ text: msg, type: "error" });
    } finally {
      setGenerating(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setSubmittingPayment(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/school/fees/invoices/${selectedInvoice._id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: paymentAmount,
          method: paymentMethod,
          notes: paymentNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Payment recording failed");

      setFeedback({ text: data.message, type: "success" });
      setIsPayModalOpen(false);
      refreshInvoices();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error recording payment";
      setFeedback({ text: msg, type: "error" });
    } finally {
      setSubmittingPayment(false);
    }
  };

  // KPIs
  const totalBilled = invoices.reduce((acc, i) => acc + (i.totalAmount || 0), 0);
  const totalCollected = invoices.reduce((acc, i) => acc + (i.paidAmount || 0), 0);
  const totalPending = totalBilled - totalCollected;
  const collectionRate = totalBilled > 0 ? ((totalCollected / totalBilled) * 100).toFixed(1) : "0.0";

  const filteredInvoices = invoices.filter((inv) => {
    const studentName = inv.studentId?.userId?.name || "";
    const invNum = inv.invoiceNumber || "";
    const roll = inv.studentId?.rollNumber || "";

    const matchesSearch =
      studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invNum.toLowerCase().includes(searchTerm.toLowerCase()) ||
      roll.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || inv.status === statusFilter;
    const matchesClass = classFilter === "ALL" || inv.classId?._id === classFilter;

    return matchesSearch && matchesStatus && matchesClass;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fee & Financial Management</h1>
          <p className="text-sm text-slate-500">
            Automate monthly fee vouchers, record student payments, and audit fee structures.
          </p>
        </div>

        <button
          onClick={() => {
            setFeedback(null);
            setIsGenerateModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-xs transition-all cursor-pointer"
        >
          <Receipt className="w-4 h-4" />
          <span>Batch Generate Invoices</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-lg text-xs font-medium flex items-center justify-between border ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
              : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-[11px] hover:underline">
            ✕
          </button>
        </div>
      )}

      {/* Financial KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs uppercase font-semibold text-slate-400">Total Billed</span>
          <p className="text-2xl font-bold mt-1">${totalBilled.toLocaleString()}</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs uppercase font-semibold text-emerald-500">Total Collected</span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            ${totalCollected.toLocaleString()}
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs uppercase font-semibold text-rose-500">Total Outstanding</span>
          <p className="text-2xl font-bold text-rose-600 mt-1">
            ${totalPending.toLocaleString()}
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs uppercase font-semibold text-blue-500">Collection Rate</span>
          <p className="text-2xl font-bold text-blue-600 mt-1">{collectionRate}%</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("invoices")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "invoices"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Fee Invoices & Vouchers ({invoices.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("structures")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "structures"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Class Fee Structures ({structures.length})</span>
        </button>
      </div>

      {/* TAB 1: INVOICES TABLE */}
      {activeTab === "invoices" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs text-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by student, invoice #, roll #..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
              >
                <option value="ALL">All Classes</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
              >
                <option value="ALL">All Status</option>
                <option value="PAID">Paid</option>
                <option value="PARTIAL">Partial</option>
                <option value="UNPAID">Unpaid</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
            {loading ? (
              <div className="p-12 text-center flex flex-col items-center justify-center text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600 mb-2" />
                <p className="text-xs">Loading fee vouchers...</p>
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                No fee vouchers found. Click &quot;Batch Generate Invoices&quot; to issue monthly class vouchers.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-400 font-semibold uppercase">
                      <th className="py-3 px-4">Invoice #</th>
                      <th className="py-3 px-4">Student & Class</th>
                      <th className="py-3 px-4">Month</th>
                      <th className="py-3 px-4">Total Amount</th>
                      <th className="py-3 px-4">Paid / Due</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredInvoices.map((inv) => {
                      const studentName = inv.studentId?.userId?.name || "Student";
                      const className = inv.classId?.name || "Class";
                      const due = inv.totalAmount - inv.discountAmount - inv.paidAmount;

                      return (
                        <tr key={inv._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30">
                          <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                            {inv.invoiceNumber}
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {studentName}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {className} - Sec {inv.studentId?.sectionName || "A"} (Roll {inv.studentId?.rollNumber})
                            </div>
                          </td>

                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                            {inv.month}
                          </td>

                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                            ${inv.totalAmount}
                          </td>

                          <td className="py-3 px-4">
                            <div className="text-emerald-600 font-semibold">${inv.paidAmount}</div>
                            {due > 0 && <div className="text-[10px] text-rose-500">Due: ${due}</div>}
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                inv.status === "PAID"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
                                  : inv.status === "PARTIAL"
                                  ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300"
                                  : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300"
                              }`}
                            >
                              {inv.status}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {inv.status !== "PAID" && (
                                <button
                                  onClick={() => {
                                    setSelectedInvoice(inv);
                                    setPaymentAmount(due);
                                    setIsPayModalOpen(true);
                                  }}
                                  className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-300 font-semibold transition-colors"
                                >
                                  Pay
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  setSelectedInvoice(inv);
                                  setIsVoucherModalOpen(true);
                                }}
                                title="Print Voucher Receipt"
                                className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: FEE STRUCTURES */}
      {activeTab === "structures" && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs">
          <h2 className="font-bold text-sm mb-4">Class Fee Heads & Structures</h2>
          {structures.length === 0 ? (
            <p className="text-xs text-slate-400">
              No custom fee structures defined. Standard default of $2,500/month applies.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {structures.map((s) => (
                <div
                  key={s._id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40"
                >
                  <span className="text-xs font-bold text-blue-600">{s.classId?.name || "Class"}</span>
                  <h3 className="font-bold text-sm mt-1">{s.title}</h3>
                  <div className="my-3 space-y-1 text-xs">
                    {s.heads.map((h, hidx) => (
                      <div key={hidx} className="flex justify-between text-slate-500">
                        <span>{h.name}</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          ${h.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-bold text-xs">
                    <span>Total Fee</span>
                    <span className="text-emerald-600">${s.totalAmount}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Batch Generate Invoices Modal */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-base mb-1">Batch Generate Monthly Invoices</h3>
            <p className="text-xs text-slate-500 mb-4">
              Generates individual vouchers for all enrolled students in the selected class.
            </p>

            <form onSubmit={handleGenerateInvoices} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium mb-1">Target Class *</label>
                <select
                  value={generateClassId}
                  onChange={(e) => setGenerateClassId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                >
                  {classes.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1">Billing Month *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. November 2026"
                  value={generateMonth}
                  onChange={(e) => setGenerateMonth(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Due Date *</label>
                <input
                  type="date"
                  required
                  value={generateDueDate}
                  onChange={(e) => setGenerateDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsGenerateModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {generating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Receipt className="w-3.5 h-3.5" />
                  )}
                  <span>Generate Vouchers</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {isPayModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-base mb-1">Record Fee Payment</h3>
            <p className="text-xs text-slate-500 mb-3">
              Invoice #{selectedInvoice.invoiceNumber} for {selectedInvoice.studentId?.userId?.name}
            </p>

            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium mb-1">Payment Amount ($) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-sm text-emerald-600"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) =>
                    setPaymentMethod(e.target.value as "CASH" | "BANK_TRANSFER" | "ONLINE")
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="CASH">Cash Deposit</option>
                  <option value="BANK_TRANSFER">Bank Transfer / Wire</option>
                  <option value="ONLINE">Online Portal</option>
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1">Receipt Notes / Reference</label>
                <input
                  type="text"
                  placeholder="e.g. Paid at campus fee counter"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {submittingPayment ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CreditCard className="w-3.5 h-3.5" />
                  )}
                  <span>Confirm Payment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Voucher Slip Modal */}
      {isVoucherModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-xs">
            {/* Header */}
            <div className="text-center pb-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-bold uppercase tracking-wider text-blue-600">
                Fee Payment Voucher
              </h2>
              <p className="text-slate-400 font-mono mt-0.5">
                Voucher #: {selectedInvoice.invoiceNumber}
              </p>
            </div>

            {/* Student & Billing Info */}
            <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-slate-400 uppercase text-[10px] font-semibold">Student</span>
                <p className="font-bold text-sm text-slate-900 dark:text-white">
                  {selectedInvoice.studentId?.userId?.name || "Student"}
                </p>
                <p className="text-slate-500">
                  Roll #: {selectedInvoice.studentId?.rollNumber} • Adm #:{" "}
                  {selectedInvoice.studentId?.admissionNumber}
                </p>
                <p className="text-slate-500">Class: {selectedInvoice.classId?.name}</p>
              </div>

              <div className="text-right">
                <span className="text-slate-400 uppercase text-[10px] font-semibold">
                  Billing Period
                </span>
                <p className="font-bold text-sm">{selectedInvoice.month}</p>
                <p className="text-slate-500">
                  Due Date: {new Date(selectedInvoice.dueDate).toLocaleDateString()}
                </p>
                <span
                  className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedInvoice.status === "PAID"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-rose-50 text-rose-700 border border-rose-200"
                  }`}
                >
                  {selectedInvoice.status}
                </span>
              </div>
            </div>

            {/* Heads breakdown */}
            <div className="py-4 space-y-2">
              <div className="font-semibold text-slate-400 uppercase text-[10px]">Fee Breakdown</div>
              {selectedInvoice.heads.map((h, idx) => (
                <div key={idx} className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">{h.name}</span>
                  <span className="font-medium">${h.amount}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between font-bold text-sm">
                <span>Total Payable</span>
                <span>${selectedInvoice.totalAmount}</span>
              </div>
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Total Paid</span>
                <span>${selectedInvoice.paidAmount}</span>
              </div>
              <div className="flex justify-between text-rose-600 font-semibold">
                <span>Remaining Balance</span>
                <span>${selectedInvoice.totalAmount - selectedInvoice.paidAmount}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setIsVoucherModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 font-medium"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
