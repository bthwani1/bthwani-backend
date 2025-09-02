// models/VacationRequest.ts
import { Schema, Types, model } from "mongoose";
export interface IVacationRequest extends Document {
  driverId:  Types.ObjectId;
  fromDate:  Date;
  toDate:    Date;
  reason:    string;
  status:    "pending" | "approved" | "rejected";
}
const vacSchema = new Schema<IVacationRequest>({
  driverId:  { type: Schema.Types.ObjectId, ref: "Driver", required: true },
  fromDate:  { type: Date, required: true },
  toDate:    { type: Date, required: true },
  reason:    { type: String },
  status:    { type: String, enum: ["pending","approved","rejected"], default: "pending" },
}, { timestamps: true });
export default model<IVacationRequest>("VacationRequest", vacSchema);
