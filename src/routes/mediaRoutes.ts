// src/routes/mediaRoutes.ts
import { Router } from "express";
import { verifyFirebase } from "../middleware/verifyFirebase";
import crypto from "crypto";

const router = Router();

router.post("/sign-upload", verifyFirebase, (req, res) => {
  const fileName = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.jpg`;

  // Bunny Storage Zone name
  const storageZone = process.env.BUNNY_STORAGE_NAME;
  const cdnBase = process.env.BUNNY_CDN_URL; // مثل https://cdn.bthwani.com

  res.json({
    fileName,
    uploadUrl: `https://storage.bunnycdn.com/${storageZone}/stores/${fileName}`,
    publicUrl: `${cdnBase}/stores/${fileName}`,
  });
});

export default router;
