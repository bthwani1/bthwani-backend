// src/routes/deliveryMarketplaceV1/deliveryCategoryRoutes.ts

import express from "express";
import * as controller from "../../controllers/delivery_marketplace_v1/DeliveryCategoryController";
import { verifyAdmin } from "../../middleware/verifyAdmin";
import { verifyFirebase } from "../../middleware/verifyFirebase";

const router = express.Router();

router.post("/", verifyFirebase, verifyAdmin, controller.create);

router.get("/children/:parentId", controller.getChildren);

router.get("/main", controller.getMainCategories);
router.post(
  "/bulk-reorder",
  verifyFirebase,
  verifyAdmin,
  controller.bulkReorder
);
router.post("/:id/move-up", verifyFirebase, verifyAdmin, controller.moveUp);
router.post("/:id/move-down", verifyFirebase, verifyAdmin, controller.moveDown);
router.put("/:id", verifyFirebase, verifyAdmin, controller.update);

router.get("/", controller.getAll);

router.get("/:id", verifyFirebase, verifyAdmin, controller.getById);

router.delete("/:id", verifyFirebase, verifyAdmin, controller.remove);

export default router;
