import express from "express";
import { verifyFirebase } from "../../middleware/verifyFirebase";
import { verifyAdmin } from "../../middleware/verifyAdmin";
import * as controller from "../../controllers/delivery_marketplace_v1/DeliveryStoreController";

const router = express.Router();

console.log("[ROUTE] DeliveryStores (IN-USE) from", __filename);

// عامة
router.get("/", controller.getAll);
router.get("/search", controller.searchStores);

router.get("/:id", controller.getById);
router.put("/:id",  controller.update);

// أدمن فقط
const adminOnly = [verifyFirebase, verifyAdmin];
router.post("/", ...adminOnly, controller.create);
router.delete("/:id", ...adminOnly, controller.remove);

export default router;
