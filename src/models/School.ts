import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISchool extends Document {
  name: string;
  slug: string;
  logo?: string;
  contactEmail: string;
  phone?: string;
  address?: string;
  currency: string;
  status: "ACTIVE" | "SUSPENDED" | "TRIAL";
  plan: "FREE" | "BASIC" | "PRO";
  createdAt: Date;
  updatedAt: Date;
}

const SchoolSchema = new Schema<ISchool>(
  {
    name: {
      type: String,
      required: [true, "School name is required"],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, "School slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    logo: {
      type: String,
      default: "",
    },
    contactEmail: {
      type: String,
      required: [true, "Contact email is required"],
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    currency: {
      type: String,
      default: "USD",
      uppercase: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "SUSPENDED", "TRIAL"],
      default: "ACTIVE",
      index: true,
    },
    plan: {
      type: String,
      enum: ["FREE", "BASIC", "PRO"],
      default: "FREE",
    },
  },
  {
    timestamps: true,
  }
);

// Prevent model recompilation error in Next.js hot-reload environment
export const School: Model<ISchool> =
  mongoose.models.School || mongoose.model<ISchool>("School", SchoolSchema);

export default School;
