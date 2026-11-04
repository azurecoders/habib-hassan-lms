import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IStudentProfile extends Document {
  schoolId: Types.ObjectId;
  userId: Types.ObjectId;
  admissionNumber: string;
  rollNumber: string;
  classId: Types.ObjectId;
  sectionName: string;
  guardianId?: Types.ObjectId | null;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  dob?: Date;
  gender: "MALE" | "FEMALE" | "OTHER";
  bloodGroup?: string;
  address?: string;
  status: "ACTIVE" | "INACTIVE" | "GRADUATED" | "TRANSFERRED";
  createdAt: Date;
  updatedAt: Date;
}

const StudentProfileSchema = new Schema<IStudentProfile>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    admissionNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    rollNumber: {
      type: String,
      required: true,
      trim: true,
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
    guardianId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    guardianName: {
      type: String,
      default: "",
    },
    guardianPhone: {
      type: String,
      default: "",
    },
    guardianEmail: {
      type: String,
      default: "",
      lowercase: true,
    },
    dob: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ["MALE", "FEMALE", "OTHER"],
      default: "MALE",
    },
    bloodGroup: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "GRADUATED", "TRANSFERRED"],
      default: "ACTIVE",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

StudentProfileSchema.index({ schoolId: 1, admissionNumber: 1 }, { unique: true });
StudentProfileSchema.index({ schoolId: 1, classId: 1, sectionName: 1 });

export const StudentProfile: Model<IStudentProfile> =
  mongoose.models.StudentProfile ||
  mongoose.model<IStudentProfile>("StudentProfile", StudentProfileSchema);

export default StudentProfile;
