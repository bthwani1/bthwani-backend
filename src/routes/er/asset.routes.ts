// server/src/routes/er/asset.routes.ts
import { Router } from "express";
import {
  getAllAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
  getAssetStats,
} from "../../controllers/er/asset.controller";

const router = Router();

router.get("/", getAllAssets);

// ضع المسارات الثابتة قبل /:id
router.get("/stats", getAssetStats);

// قيّد الـ id ليكون ObjectId صحيح
router.get("/:id([0-9a-fA-F]{24})", getAssetById);
router.patch("/:id([0-9a-fA-F]{24})", updateAsset);
router.delete("/:id([0-9a-fA-F]{24})", deleteAsset);

export default router;
