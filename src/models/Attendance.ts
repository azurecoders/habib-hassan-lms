import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IAttendanceRecord {
  studentId: Types.ObjectId;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  remarks?: string;
}

export interface IAttendance extends Document {
  schoolId: Types.ObjectId;
  classId: Types.ObjectId;
  sectionName: string;
  date: string; // Format YYYY-MM-DD for fast string-based index matches
  markedBy?: Types.ObjectId;
  records: IAttendanceRecord[];
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceRecordSchema = new Schema<IAttendanceRecord>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "StudentProfile",
      required: true,
    },
    status: {
      type: String,
      enum: ["PRESENT", "ABSENT", "LATE", "EXCUSED"],
      default: "PRESENT",
    },
    remarks: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const AttendanceSchema = new Schema<IAttendance>(
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
    sectionName: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: String,
      required: true,
      index: true,
    },
    markedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    records: {
      type: [AttendanceRecordSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

AttendanceSchema.index(
  { schoolId: 1, classId: 1, sectionName: 1, date: 1 },
  { unique: true }
);

export const Attendance: Model<IAttendance> =
  mongoose.models.Attendance ||
  mongoose.model<IAttendance>("Attendance", AttendanceSchema);

export default Attendance;
