// src/routes/deliveryCart.routes.ts

import express from "express";
import * as controller from "../../controllers/delivery_marketplace_v1/DeliveryCartController";
import { verifyFirebase } from "../../middleware/verifyFirebase";
import { attachFirebaseIfPresent } from "../../middleware/attachFirebaseIfPresent";

const router = express.Router();


router.get("/user/:userId", attachFirebaseIfPresent, controller.getCart);

router.get("/:cartId", attachFirebaseIfPresent, controller.getCart);


router.post("/add", attachFirebaseIfPresent, controller.addOrUpdateCart);

router.delete("/user/:userId", attachFirebaseIfPresent, controller.clearCart);


router.delete("/:cartId", attachFirebaseIfPresent, controller.clearCart);


router.delete(
  "/:cartId/items/:productId",
  attachFirebaseIfPresent,
  controller.removeItem
);


router.delete(
  "/user/:userId/items/:productId",
  attachFirebaseIfPresent,
  controller.removeItem
);

router.put(
  "/items/:productId",
  verifyFirebase,
  controller.updateCartItemQuantity
);

router.get("/fee", attachFirebaseIfPresent, controller.getDeliveryFee);

router.get("/", controller.getAllCarts);

router.get("/abandoned", controller.getAbandonedCarts);

router.post("/merge", verifyFirebase, controller.mergeCart);

export default router;
