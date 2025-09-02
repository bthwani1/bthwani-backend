// models/Merchant.ts

import { Schema, model, Document } from 'mongoose';

export interface IMerchant extends Document {
  name: string;
  email: string;
  phone?: string;
  // أضف أي حقول إضافية تحتاجها هنا
}

const MerchantSchema = new Schema<IMerchant>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
});

export default model<IMerchant>('Merchant', MerchantSchema);
