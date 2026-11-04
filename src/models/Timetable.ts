import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IPeriodSlot {
  periodNumber: number;
  startTime: string; // e.g. "08:30"
  endTime: string; // e.g. "09:15"
  subjectName: string;
  teacherName?: string;
  room?: string;
}

export interface ITimetable extends Document {
  schoolId: Types.ObjectId;
  classId: Types.ObjectId;
  sectionName: string;
  dayOfWeek: "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY";
  slots: IPeriodSlot[];
  createdAt: Date;
  updatedAt: Date;
}

const PeriodSlotSchema = new Schema<IPeriodSlot>(
  {
    periodNumber: { type: Number, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    subjectName: { type: String, required: true },
    teacherName: { type: String, default: "" },
    room: { type: String, default: "" },
  },
  { _id: false }
);

const TimetableSchema = new Schema<ITimetable>(
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
    dayOfWeek: {
      type: String,
      enum: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"],
      required: true,
    },
    slots: {
      type: [PeriodSlotSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

TimetableSchema.index(
  { schoolId: 1, classId: 1, sectionName: 1, dayOfWeek: 1 },
  { unique: true }
);

export const Timetable: Model<ITimetable> =
  mongoose.models.Timetable ||
  mongoose.model<ITimetable>("Timetable", TimetableSchema);

export default Timetable;
