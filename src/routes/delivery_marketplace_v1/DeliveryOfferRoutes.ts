// src/routes/deliveryMarketplaceV1/deliveryOfferRoutes.ts

import express from "express";
import * as controller from "../../controllers/delivery_marketplace_v1/DeliveryOfferController";
import { verifyAdmin } from "../../middleware/verifyAdmin";

const router = express.Router();

router.post("/", verifyAdmin, controller.create);

router.get("/", controller.getAll);

router.get("/:id", verifyAdmin, controller.getById);

router.put("/:id", verifyAdmin, controller.update);

router.delete("/:id", verifyAdmin, controller.remove);

export default router;
