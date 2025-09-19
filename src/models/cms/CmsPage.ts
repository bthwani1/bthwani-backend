import mongoose, { Document, Schema } from "mongoose";

export interface ICmsPage extends Document {
  slug: string; // privacy-policy, terms
  title: { ar?: string; en?: string };
  content: { ar?: string; en?: string }; // HTML or Markdown
  isPublic: boolean;
}

const schema = new Schema<ICmsPage>({
  slug: { type: String, required: true, unique: true },
  title: { ar: String, en: String },
  content: { ar: String, en: String },
  isPublic: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model<ICmsPage>("CmsPage", schema);
