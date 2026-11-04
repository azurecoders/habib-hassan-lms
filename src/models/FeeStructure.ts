import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IFeeHead {
  name: string;
  amount: number;
}

export interface IFeeStructure extends Document {
  schoolId: Types.ObjectId;
  classId: Types.ObjectId;
  title: string;
  heads: IFeeHead[];
  totalAmount: number;
  frequency: "MONTHLY" | "QUARTERLY" | "ANNUALLY" | "ONE_TIME";
  dueDay: number; // Day of the month e.g. 10
  createdAt: Date;
  updatedAt: Date;
}

const FeeHeadSchema = new Schema<IFeeHead>(
  {
    name: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const FeeStructureSchema = new Schema<IFeeStructure>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: "SchoolClass",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    heads: {
      type: [FeeHeadSchema],
      default: [{ name: "Tuition Fee", amount: 3000 }],
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    frequency: {
      type: String,
      enum: ["MONTHLY", "QUARTERLY", "ANNUALLY", "ONE_TIME"],
      default: "MONTHLY",
    },
    dueDay: {
      type: Number,
      default: 10,
    },
  },
  {
    timestamps: true,
  }
);

FeeStructureSchema.index({ schoolId: 1, classId: 1 });

export const FeeStructure: Model<IFeeStructure> =
  mongoose.models.FeeStructure ||
  mongoose.model<IFeeStructure>("FeeStructure", FeeStructureSchema);

export default FeeStructure;
