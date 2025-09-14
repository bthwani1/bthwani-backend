import { Schema, model } from "mongoose";

export default model(
  "AppTutorial",
  new Schema(
    {
      title: String,
      youtubeId: String,
      duration: String,
    },
    { timestamps: true }
  )
);

