import { Router } from "express";
import { verifyMarketerJWT } from "../../middleware/verifyMarketerJWT"; // <-- use marketer JWT
import crypto from "crypto";

const router = Router();
// POST /api/v1/files/sign - Generate signed upload URL for secure file upload
router.post("/sign", verifyMarketerJWT, (req, res) => {
  try {
    const fileName = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.jpg`;
    const storageZone = "bthwani-storage";
    const cdnBase = "https://cdn.bthwani.com";

    // Generate signed URL for secure upload (without exposing access key)
    const uploadUrl = `https://storage.bunnycdn.com/${storageZone}/stores/${fileName}`;
    const publicUrl = `${cdnBase}/stores/${fileName}`;

    res.json({
      fileName,
      uploadUrl,
      publicUrl,
      // Note: Removed accessKey - uploads should be handled server-side for security
    });
  } catch (error) {
    console.error("File sign error:", error);
    res.status(500).json({ message: "Failed to generate upload URL" });
  }
});

export default router;
