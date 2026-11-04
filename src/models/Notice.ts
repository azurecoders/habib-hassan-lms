import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface INotice extends Document {
  schoolId: Types.ObjectId;
  title: string;
  content: string;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  targetAudience: "ALL" | "TEACHER" | "PARENT" | "STUDENT";
  authorName: string;
  authorRole: string;
  attachmentUrl?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NoticeSchema = new Schema<INotice>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    priority: {
      type: String,
      enum: ["LOW", "NORMAL", "HIGH", "URGENT"],
      default: "NORMAL",
    },
    targetAudience: {
      type: String,
      enum: ["ALL", "TEACHER", "PARENT", "STUDENT"],
      default: "ALL",
    },
    authorName: {
      type: String,
      required: true,
      default: "School Administration",
    },
    authorRole: {
      type: String,
      default: "INSTITUTION_ADMIN",
    },
    attachmentUrl: {
      type: String,
    },
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient chronological fetching per tenant and audience
NoticeSchema.index({ schoolId: 1, targetAudience: 1, createdAt: -1 });

const Notice: Model<INotice> =
  mongoose.models.Notice || mongoose.model<INotice>("Notice", NoticeSchema);

export default Notice;
