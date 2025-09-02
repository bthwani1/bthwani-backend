// models/Attribute.ts
import { Schema, model, Types, Document } from "mongoose";

export type AttributeType = "number" | "select" | "text";

export interface IAttribute extends Document {
  name: string;
  slug: string;
  categories: Types.ObjectId[];
  unit?: string;
  type: AttributeType;
  options?: string[];
  usageType: "grocery" | "restaurant" | "retail";
}

const AttributeSchema = new Schema<IAttribute>({
  name: { type: String, required: true },
  slug: { type: String, required: true },
  categories: [
    { type: Schema.Types.ObjectId, ref: "CategoryMac", required: true },
  ],
  unit: { type: String },
  type: { type: String, enum: ["number", "select", "text"], required: true },
  options: [{ type: String }],
  usageType: {
    type: String,
    enum: ["grocery", "restaurant", "retail"],
    required: true,
  },
});

export default model<IAttribute>("Attribute", AttributeSchema);
