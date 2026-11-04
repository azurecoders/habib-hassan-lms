import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IStaffAttendanceRecord {
  staffId: Types.ObjectId;
  status: "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY" | "ON_LEAVE";
  remarks?: string;
}

export interface IStaffAttendance extends Document {
  schoolId: Types.ObjectId;
  date: string; // YYYY-MM-DD
  markedBy?: Types.ObjectId;
  records: IStaffAttendanceRecord[];
  createdAt: Date;
  updatedAt: Date;
}

const StaffAttendanceRecordSchema = new Schema<IStaffAttendanceRecord>(
  {
    staffId: {
      type: Schema.Types.ObjectId,
      ref: "StaffProfile",
      required: true,
    },
    status: {
      type: String,
      enum: ["PRESENT", "ABSENT", "LATE", "HALF_DAY", "ON_LEAVE"],
      default: "PRESENT",
    },
    remarks: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const StaffAttendanceSchema = new Schema<IStaffAttendance>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
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
      type: [StaffAttendanceRecordSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

StaffAttendanceSchema.index({ schoolId: 1, date: 1 }, { unique: true });

export const StaffAttendance: Model<IStaffAttendance> =
  mongoose.models.StaffAttendance ||
  mongoose.model<IStaffAttendance>("StaffAttendance", StaffAttendanceSchema);

export default StaffAttendance;
