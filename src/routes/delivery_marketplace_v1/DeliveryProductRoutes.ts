// src/routes/deliveryMarketplaceV1/deliveryProductRoutes.ts

import express from "express";
import * as controller from "../../controllers/delivery_marketplace_v1/DeliveryProductController";
import { verifyAdmin } from "../../middleware/verifyAdmin";
import { verifyFirebase } from "../../middleware/verifyFirebase";
import DeliveryProduct from "../../models/delivery_marketplace_v1/DeliveryProduct";

const router = express.Router();

router.post("/", verifyFirebase, verifyAdmin, controller.create);

router.get("/", controller.getAll);

router.get("/:id", controller.getById);

router.put("/:id", verifyFirebase, verifyAdmin, controller.update);
router.delete("/:id", verifyFirebase, verifyAdmin, controller.remove);

router.get("/daily-offers", async (req, res) => {
  try {
    const offers = await DeliveryProduct.find({ isDailyOffer: true }).limit(10);
    res.json(offers);
  } catch (err) {
    res.status(500).json({ message: "خطأ في جلب العروض اليومية" });
  }
});

router.get("/nearby/new", async (req, res) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    res.status(400).json({ message: "إحداثيات الموقع مطلوبة" });
    return;
  }

  const parsedLat = parseFloat(lat as string);
  const parsedLng = parseFloat(lng as string);

  if (isNaN(parsedLat) || isNaN(parsedLng)) {
    res.status(400).json({ message: "إحداثيات غير صالحة" });
    return;
  }

  try {
    const recentProducts = await DeliveryProduct.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parsedLng, parsedLat],
          },
          $maxDistance: 5000,
        },
      },
    })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(recentProducts);
  } catch (err) {
    res.status(500).json({ message: "خطأ في جلب المنتجات الجديدة" });
  }
});

export default router;
