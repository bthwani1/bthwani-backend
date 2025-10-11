import { Schema, model, Document } from "mongoose";

export interface IReferralEvent extends Document {
  marketerId: string;
  type: 'click' | 'signup';
  ref: string; // mk_<shortId>
  meta?: {
    userAgent?: string;
    ip?: string;
    referrer?: string;
    [key: string]: any;
  };
  createdAt: Date;
}

const Sch = new Schema<IReferralEvent>({
  marketerId: { type: String, required: true, index: true },
  type: { type: String, enum: ['click', 'signup'], required: true },
  ref: { type: String, required: true, index: true },
  meta: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });

// Compound index for efficient queries
Sch.index({ marketerId: 1, type: 1, createdAt: -1 });
Sch.index({ ref: 1, type: 1 });

export default model<IReferralEvent>("ReferralEvents", Sch);
