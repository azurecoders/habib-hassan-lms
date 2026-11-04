import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IPaymentRecord {
  amount: number;
  date: Date;
  method: "CASH" | "BANK_TRANSFER" | "ONLINE" | "CHEQUE";
  transactionRef?: string;
  notes?: string;
}

export interface IFeeInvoice extends Document {
  schoolId: Types.ObjectId;
  studentId: Types.ObjectId;
  classId: Types.ObjectId;
  invoiceNumber: string;
  month: string; // e.g. "November 2026"
  issueDate: Date;
  dueDate: Date;
  heads: { name: string; amount: number }[];
  totalAmount: number;
  discountAmount: number;
  paidAmount: number;
  status: "PAID" | "PARTIAL" | "UNPAID" | "OVERDUE";
  paymentHistory: IPaymentRecord[];
  createdAt: Date;
  updatedAt: Date;
}

const PaymentRecordSchema = new Schema<IPaymentRecord>(
  {
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    method: {
      type: String,
      enum: ["CASH", "BANK_TRANSFER", "ONLINE", "CHEQUE"],
      default: "CASH",
    },
    transactionRef: { type: String, default: "" },
    notes: { type: String, default: "" },
  },
  { _id: false }
);

const FeeInvoiceSchema = new Schema<IFeeInvoice>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "StudentProfile",
      required: true,
      index: true,
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: "SchoolClass",
      required: true,
      index: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    month: {
      type: String,
      required: true,
      trim: true,
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    heads: [
      {
        name: { type: String, required: true },
        amount: { type: Number, required: true },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["PAID", "PARTIAL", "UNPAID", "OVERDUE"],
      default: "UNPAID",
      index: true,
    },
    paymentHistory: {
      type: [PaymentRecordSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

FeeInvoiceSchema.index({ schoolId: 1, invoiceNumber: 1 }, { unique: true });
FeeInvoiceSchema.index({ schoolId: 1, studentId: 1 });
FeeInvoiceSchema.index({ schoolId: 1, status: 1 });

export const FeeInvoice: Model<IFeeInvoice> =
  mongoose.models.FeeInvoice ||
  mongoose.model<IFeeInvoice>("FeeInvoice", FeeInvoiceSchema);

export default FeeInvoice;
