import mongoose, { Document, Schema } from "mongoose";

export interface IOnboardingSlide extends Document {
  key: string;
  title?: { ar?: string; en?: string };
  subtitle?: { ar?: string; en?: string };
  media?: { type: "lottie" | "image"; url: string };
  cta?: { label?: { ar?: string; en?: string }; action?: string };
  order?: number;
  active?: boolean;
}

const schema = new Schema<IOnboardingSlide>({
  key: { type: String, required: true, unique: true },
  title: { ar: String, en: String },
  subtitle: { ar: String, en: String },
  media: { type: { type: String }, url: String },
  cta: { label: { ar: String, en: String }, action: String },
  order: { type: Number, default: 0 },
  active: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model<IOnboardingSlide>("OnboardingSlide", schema);
