// src/routes/deliveryMarketplaceV1/deliveryProductSubCategoryRoutes.ts

import express from "express";
import * as controller from "../../controllers/delivery_marketplace_v1/DeliveryProductSubCategoryController";
import { verifyAdmin } from "../../middleware/verifyAdmin";
import { verifyFirebase } from "../../middleware/verifyFirebase";

const router = express.Router();

router.post("/", verifyFirebase, verifyAdmin, controller.create);

router.get("/store/:storeId", controller.getByStore);
router.get("/", controller.getAll);

router.get("/:id", controller.getById);

router.put("/:id", verifyFirebase, verifyAdmin, controller.update);

router.delete("/:id", verifyFirebase, verifyAdmin, controller.remove);

export default router;
