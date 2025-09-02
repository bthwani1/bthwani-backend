// server/src/routes/asset.routes.ts
import { Router } from "express";
import {
  getAllAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
} from "../../controllers/er/asset.controller";

const router = Router();
router.get("/", getAllAssets);
router.get("/:id", getAssetById);
router.post("/", createAsset);
router.patch("/:id", updateAsset);
router.delete("/:id", deleteAsset);
export default router;
