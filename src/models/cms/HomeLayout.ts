import mongoose, { Document, Schema } from "mongoose";

export interface IHomeLayout extends Document {
  sections: {
    key: string; // offers_only, trending, categories, stores_nearby, banners
    enabled: boolean;
    limit?: number;
    title?: { ar?: string; en?: string };
  }[];
  channel?: "app" | "web";
  city?: string;
  order?: number;
  active?: boolean;
  validFrom?: Date;
  validTo?: Date;
}

const schema = new Schema<IHomeLayout>({
  sections: [{
    key: { type: String, required: true },
    enabled: { type: Boolean, default: true },
    limit: Number,
    title: { ar: String, en: String }
  }],
  channel: { type: String, enum: ["app","web"], default: "app" },
  city: String,
  order: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  validFrom: Date,
  validTo: Date
}, { timestamps: true });

export default mongoose.model<IHomeLayout>("HomeLayout", schema);
