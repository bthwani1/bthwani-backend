// models/CategoryMac.ts
import { Schema, model, Types, Document } from 'mongoose';

export interface ICategoryMac extends Document {
  name: string;
  slug: string;
  image?: string;
  parent?: Types.ObjectId | null;
  usageType: 'grocery' | 'restaurant' | 'retail';
}

const CategoryMacSchema = new Schema<ICategoryMac>({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  image: { type: String },
  parent: { type: Schema.Types.ObjectId, ref: 'CategoryMac', default: null },
  usageType: { type: String, enum: ['grocery', 'restaurant', 'retail'], required: true },
});

export default model<ICategoryMac>('CategoryMac', CategoryMacSchema);
