import mongoose, { Document, Schema } from "mongoose";

export interface IDriverReview extends Document {
  order: mongoose.Types.ObjectId;
  driver: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  rating: number;
  comment?: string;
}

const DriverReviewSchema = new Schema<IDriverReview>({
  order:  { type: Schema.Types.ObjectId, ref: "DeliveryOrder", required: true },
  driver: { type: Schema.Types.ObjectId, ref: "Driver", required: true },
  user:   { type: Schema.Types.ObjectId, ref: "User",   required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment:{ type: String }
}, { timestamps: true });

export default mongoose.model<IDriverReview>(
  "DriverReview",
  DriverReviewSchema
);
