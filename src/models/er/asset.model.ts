// server/src/models/asset.model.ts
import { Schema, model, Document, Types } from 'mongoose';

export interface IAsset extends Document {
  name: string;
  category: string;         // أجهزة، أثاث، معدات، إلخ
  serialNumber?: string;
  purchaseDate: Date;
  status: 'available' | 'in-use' | 'maintenance' | 'lost';
  assignedTo?: Types.ObjectId; // موظف
  location?: string;        // جهة أو مدينة
}

const AssetSchema = new Schema<IAsset>({
  name:         { type: String, required: true },
  category:     { type: String, required: true },
  serialNumber: { type: String, unique: true, sparse: true },
  purchaseDate: { type: Date, required: true },
  status:       { type: String, enum: ['available','in-use','maintenance','lost'], default: 'available' },
  assignedTo:   { type: Schema.Types.ObjectId, ref: 'Employee' },
  location:     { type: String },
}, { timestamps: true });

export const Asset = model<IAsset>('Asset', AssetSchema);