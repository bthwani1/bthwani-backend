// src/routes/deliveryMarketplaceV1/deliveryBannerRoutes.ts

import express from "express";
import * as controller from "../../controllers/delivery_marketplace_v1/DeliveryBannerController";
import { verifyAdmin } from "../../middleware/verifyAdmin";
import { verifyFirebase } from "../../middleware/verifyFirebase";

const router = express.Router();


router.get("/admin", controller.getAllAdmin);

router.post("/", verifyFirebase, verifyAdmin, controller.create);

router.get("/", controller.getAll);
router.get("/:id", verifyFirebase, verifyAdmin, controller.getById);
router.put("/:id", verifyFirebase, verifyAdmin, controller.update);

router.delete("/:id", verifyFirebase, verifyAdmin, controller.remove);

export default router;
