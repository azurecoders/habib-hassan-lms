import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IAcademicYear extends Document {
  schoolId: Types.ObjectId;
  name: string; // e.g., "2025-2026"
  startDate: Date;
  endDate: Date;
  isCurrent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AcademicYearSchema = new Schema<IAcademicYear>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Academic year name is required"],
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
    isCurrent: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

AcademicYearSchema.index({ schoolId: 1, name: 1 }, { unique: true });
AcademicYearSchema.index({ schoolId: 1, isCurrent: 1 });

export const AcademicYear: Model<IAcademicYear> =
  mongoose.models.AcademicYear ||
  mongoose.model<IAcademicYear>("AcademicYear", AcademicYearSchema);

export default AcademicYear;
