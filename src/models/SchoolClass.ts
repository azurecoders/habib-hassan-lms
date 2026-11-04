import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ISection {
  name: string; // e.g. "A", "B"
  room?: string; // e.g. "Room 101"
  capacity?: number;
}

export interface ISchoolClass extends Document {
  schoolId: Types.ObjectId;
  academicYearId?: Types.ObjectId;
  name: string; // e.g. "Grade 10"
  order: number; // For sorting (1, 2, 3...)
  sections: ISection[];
  createdAt: Date;
  updatedAt: Date;
}

const SectionSchema = new Schema<ISection>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    room: {
      type: String,
      default: "",
    },
    capacity: {
      type: Number,
      default: 40,
    },
  },
  { _id: false }
);

const SchoolClassSchema = new Schema<ISchoolClass>(
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
      index: true,
    },
    name: {
      type: String,
      required: [true, "Class name is required"],
      trim: true,
    },
    order: {
      type: Number,
      default: 1,
    },
    sections: {
      type: [SectionSchema],
      default: [{ name: "A", room: "Room 101", capacity: 40 }],
    },
  },
  {
    timestamps: true,
  }
);

SchoolClassSchema.index({ schoolId: 1, name: 1 }, { unique: true });

export const SchoolClass: Model<ISchoolClass> =
  mongoose.models.SchoolClass ||
  mongoose.model<ISchoolClass>("SchoolClass", SchoolClassSchema);

export default SchoolClass;
