// models/vendor_app/SettlementRequest.ts
import { Schema, model, Types, Document } from "mongoose";

export interface ISettlementRequest extends Document {
  vendor: Types.ObjectId;
  store: Types.ObjectId;
  amount: number;
  status: "pending" | "completed" | "rejected";
  requestedAt: Date;
  processedAt?: Date;
  bankAccount?: string;
}

const SettlementRequestSchema = new Schema<ISettlementRequest>({
  vendor: { type: Schema.Types.ObjectId, ref: "Vendor", required: true, index: true },
  store:  { type: Schema.Types.ObjectId, ref: "DeliveryStore", required: true, index: true },
  amount: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ["pending", "completed", "rejected"], default: "pending", index: true },
  requestedAt: { type: Date, default: Date.now },
  processedAt: { type: Date },
  bankAccount: { type: String },
}, { timestamps: true });

export default model<ISettlementRequest>("SettlementRequest", SettlementRequestSchema);



