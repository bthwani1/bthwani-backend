import mongoose, { Document, Schema } from "mongoose";

export interface ICmsString extends Document {
  key: string; // e.g. "home.header.title"
  ar?: string;
  en?: string;
  group?: string; // optional grouping
}

const schema = new Schema<ICmsString>({
  key: { type: String, required: true, unique: true },
  ar: String,
  en: String,
  group: String
}, { timestamps: true });

export default mongoose.model<ICmsString>("CmsString", schema);
