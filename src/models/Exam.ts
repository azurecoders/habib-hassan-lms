import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IExam extends Document {
  schoolId: Types.ObjectId;
  academicYearId?: Types.ObjectId;
  title: string; // e.g. "Mid-Term Examination 2026"
  term: string; // e.g. "Term 1"
  startDate: Date;
  endDate: Date;
  status: "DRAFT" | "PUBLISHED" | "CONCLUDED";
  createdAt: Date;
  updatedAt: Date;
}

const ExamSchema = new Schema<IExam>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    academicYearId: {
      type: Schema.Types.ObjectId,
      ref: "AcademicYear",
      default: null,
    },
    title: {
      type: String,
      required: [true, "Exam title is required"],
      trim: true,
    },
    term: {
      type: String,
      default: "Term 1",
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["DRAFT", "PUBLISHED", "CONCLUDED"],
      default: "DRAFT",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

ExamSchema.index({ schoolId: 1, title: 1 });

export const Exam: Model<IExam> =
  mongoose.models.Exam || mongoose.model<IExam>("Exam", ExamSchema);

export default Exam;
