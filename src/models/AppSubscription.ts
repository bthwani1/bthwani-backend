import { Schema, model } from "mongoose";

export default model(
  "AppSubscription",
  new Schema(
    {
      id: { type: String, required: true, unique: true },
      title: String,
      price: String,
      features: [String],
      comingSoon: Boolean,
    },
    { timestamps: true }
  )
);

