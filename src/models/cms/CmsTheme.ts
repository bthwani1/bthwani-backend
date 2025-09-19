import mongoose, { Document, Schema } from "mongoose";

export interface ICmsTheme extends Document {
  brand?: { logoUrl?: string };
  colors?: { primary?: string; text?: string; background?: string };
  cornerRadius?: number;
  spacing?: { base?: number };
  fonts?: { base?: string; display?: string };
}

const schema = new Schema<ICmsTheme>({
  brand: { logoUrl: String },
  colors: { primary: String, text: String, background: String },
  cornerRadius: { type: Number, default: 16 },
  spacing: { base: { type: Number, default: 8 } },
  fonts: { base: String, display: String },
}, { timestamps: true });

export default mongoose.model<ICmsTheme>("CmsTheme", schema);
