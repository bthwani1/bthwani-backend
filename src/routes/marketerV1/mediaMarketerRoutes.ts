import { Router } from "express";
import { verifyMarketerJWT } from "../../middleware/verifyMarketerJWT"; // <-- use marketer JWT
import crypto from "crypto";

const router = Router();
router.post("/sign", verifyMarketerJWT, (req, res) => {
  const fileName = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.jpg`;
  const storageZone = "bthwani-storage";
  const cdnBase = "https://cdn.bthwani.com";
  res.json({
    fileName,
    uploadUrl: `https://storage.bunnycdn.com/${storageZone}/stores/${fileName}`,
    publicUrl: `${cdnBase}/stores/${fileName}`,
    accessKey: "2ea49c52-481c-48f9-a7ce4d882e42-0cf4-4dca", // <<< خطر: سيكشف المفتاح للعميل
  });
});

export default router;
