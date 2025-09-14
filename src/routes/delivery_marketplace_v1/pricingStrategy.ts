import { Router } from "express";
import {
  listStrategies,
  createStrategy,
  updateStrategy,
  deleteStrategy,
} from "../../controllers/delivery_marketplace_v1/pricingStrategy";
import { verifyAdmin } from "../../middleware/verifyAdmin";
import { verifyFirebase } from "../../middleware/verifyFirebase";

const router = Router();
router.get("/", verifyFirebase, verifyAdmin, listStrategies);
router.post("/", verifyFirebase, verifyAdmin, createStrategy);
router.put("/", verifyFirebase, verifyAdmin, updateStrategy);
router.delete("/:id", verifyFirebase, verifyAdmin, deleteStrategy);

export default router;
