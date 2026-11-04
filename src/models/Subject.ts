import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ISubject extends Document {
  schoolId: Types.ObjectId;
  classId: Types.ObjectId;
  name: string; // e.g. "Mathematics"
  code: string; // e.g. "MATH-10"
  type: "CORE" | "ELECTIVE" | "PRACTICAL";
  passMarks: number;
  totalMarks: number;
  createdAt: Date;
  updatedAt: Date;
}

const SubjectSchema = new Schema<ISubject>(
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
    name: {
      type: String,
      required: [true, "Subject name is required"],
      trim: true,
    },
    code: {
      type: String,
      required: [true, "Subject code is required"],
      trim: true,
      uppercase: true,
    },
    type: {
      type: String,
      enum: ["CORE", "ELECTIVE", "PRACTICAL"],
      default: "CORE",
    },
    passMarks: {
      type: Number,
      default: 40,
    },
    totalMarks: {
      type: Number,
      default: 100,
    },
  },
  {
    timestamps: true,
  }
);

SubjectSchema.index({ schoolId: 1, classId: 1, code: 1 }, { unique: true });

export const Subject: Model<ISubject> =
  mongoose.models.Subject || mongoose.model<ISubject>("Subject", SubjectSchema);

export default Subject;
