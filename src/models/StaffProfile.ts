import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IAssignedClass {
  _id?: Types.ObjectId;
  classId: Types.ObjectId;
  sectionName: string;
  subjectId: Types.ObjectId;
}

export interface IStaffProfile extends Document {
  schoolId: Types.ObjectId;
  userId: Types.ObjectId;
  employeeId: string;
  designation: string;
  department: string;
  qualification: string;
  joiningDate: Date;
  salary?: number;
  avatarUrl?: string;
  assignedClasses: IAssignedClass[];
  status: "ACTIVE" | "ON_LEAVE" | "RESIGNED";
  createdAt: Date;
  updatedAt: Date;
}

const AssignedClassSchema = new Schema<IAssignedClass>(
  {
    classId: {
      type: Schema.Types.ObjectId,
      ref: "SchoolClass",
      required: true,
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
    },
  },
  { _id: true }
);

const StaffProfileSchema = new Schema<IStaffProfile>(
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
    employeeId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    designation: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      default: "General",
      trim: true,
    },
    qualification: {
      type: String,
      default: "",
    },
    joiningDate: {
      type: Date,
      default: Date.now,
    },
    salary: {
      type: Number,
      default: 0,
    },
    avatarUrl: {
      type: String,
      default: "",
    },
    assignedClasses: {
      type: [AssignedClassSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ["ACTIVE", "ON_LEAVE", "RESIGNED"],
      default: "ACTIVE",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

StaffProfileSchema.index({ schoolId: 1, employeeId: 1 }, { unique: true });

export const StaffProfile: Model<IStaffProfile> =
  mongoose.models.StaffProfile ||
  mongoose.model<IStaffProfile>("StaffProfile", StaffProfileSchema);

export default StaffProfile;
