import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IStudentMark {
  studentId: Types.ObjectId;
  obtainedMarks: number;
  totalMarks: number;
  grade: string;
  remarks?: string;
}

export interface IExamResult extends Document {
  schoolId: Types.ObjectId;
  examId: Types.ObjectId;
  classId: Types.ObjectId;
  sectionName: string;
  subjectId: Types.ObjectId;
  enteredBy?: Types.ObjectId;
  marks: IStudentMark[];
  createdAt: Date;
  updatedAt: Date;
}

const StudentMarkSchema = new Schema<IStudentMark>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "StudentProfile",
      required: true,
    },
    obtainedMarks: {
      type: Number,
      required: true,
      default: 0,
    },
    totalMarks: {
      type: Number,
      required: true,
      default: 100,
    },
    grade: {
      type: String,
      default: "F",
    },
    remarks: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const ExamResultSchema = new Schema<IExamResult>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    examId: {
      type: Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
      index: true,
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: "SchoolClass",
      required: true,
      index: true,
    },
    sectionName: {
      type: String,
      required: true,
      trim: true,
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
      index: true,
    },
    enteredBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    marks: {
      type: [StudentMarkSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

ExamResultSchema.index(
  { schoolId: 1, examId: 1, classId: 1, sectionName: 1, subjectId: 1 },
  { unique: true }
);

export const ExamResult: Model<IExamResult> =
  mongoose.models.ExamResult ||
  mongoose.model<IExamResult>("ExamResult", ExamResultSchema);

export default ExamResult;
