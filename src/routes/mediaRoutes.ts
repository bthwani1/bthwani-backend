// src/routes/mediaRoutes.ts
import dotenv from "dotenv";
dotenv.config();

import { Router } from "express";
import crypto from "crypto";
import { verifyFirebase } from "../middleware/verifyFirebase";
const router = Router();

router.post("/sign-upload", verifyFirebase, (req, res) => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey    = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.error("⚠️ Cloudinary env misconfigured:", { cloudName, apiKey, apiSecret });
     res.status(500).json({ message: "Server misconfigured" });
     return;
  }

  const folder    = "stores";
  const timestamp = Math.floor(Date.now() / 1000);
  // signature: sha1(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
  const toSign    = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash("sha1").update(toSign).digest("hex");

  res.json({ signature, timestamp, apiKey, cloudName, folder });
});

export default router;
