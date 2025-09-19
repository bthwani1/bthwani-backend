import mongoose, { Document, Schema } from "mongoose";

export interface IFeatureFlag extends Document {
  key: string; // e.g. "new_checkout"
  enabled: boolean;
  rollout?: { percentage?: number; city?: string[]; channel?: ("app"|"web")[] };
  description?: string;
}

const schema = new Schema<IFeatureFlag>({
  key: { type: String, required: true, unique: true },
  enabled: { type: Boolean, default: false },
  rollout: { percentage: Number, city: [String], channel: [String] },
  description: String
}, { timestamps: true });

export default mongoose.model<IFeatureFlag>("FeatureFlag", schema);
