import mongoose, { Document, Schema } from "mongoose";

export interface IEmptyState extends Document {
  key: string; // cart, orders_empty, search_empty
  image?: string;
  title?: { ar?: string; en?: string };
  subtitle?: { ar?: string; en?: string };
  cta?: { label?: { ar?: string; en?: string }; deeplink?: string };
  active?: boolean;
}

const schema = new Schema<IEmptyState>({
  key: { type: String, required: true, unique: true },
  image: String,
  title: { ar: String, en: String },
  subtitle: { ar: String, en: String },
  cta: { label: { ar: String, en: String }, deeplink: String },
  active: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model<IEmptyState>("EmptyState", schema);
