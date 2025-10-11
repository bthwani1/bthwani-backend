// src/routes/meta.ts
import { Router } from "express";
import UtilityPricing from "../models/delivery_marketplace_v1/UtilityPricing";
import { ENUMS } from "../constants/enums";

const r = Router();

r.get("/cities", async (_req, res) => {
  try {
    const list = await UtilityPricing.distinct("city");
    const cities = (list || [])
      .filter(Boolean)
      .map((s) => String(s))
      .sort((a, b) => a.localeCompare(b, "ar"));
    res.json(cities);
  } catch (e: any) {
    res.status(500).json({ message: e.message || "تعذر تحميل المدن" });
  }
});

/**
 * @swagger
 * /api/v1/meta/enums:
 *   get:
 *     summary: جلب قائمة جميع الـ enums في التطبيق
 *     description: تعيد قاموسًا بكل الـ enums والقيم المتاحة لكل واحدة مع تفاصيل كل قيمة
 *     tags: [Meta]
 *     responses:
 *       200:
 *         description: قائمة الـ enums بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 USER_ROLES:
 *                   type: array
 *                   items:
 *                     type: string
 *                     enum: [user, admin, superadmin, customer, driver, vendor, store]
 *                   example: ["user", "admin", "superadmin", "customer", "driver", "vendor", "store"]
 *                 ORDER_STATUS:
 *                   type: array
 *                   items:
 *                     type: string
 *                     enum: [pending_confirmation, under_review, preparing, assigned, out_for_delivery, delivered, returned, awaiting_procurement, procured, procurement_failed, cancelled]
 *                   example: ["pending_confirmation", "under_review", "preparing", "assigned", "out_for_delivery", "delivered", "returned", "awaiting_procurement", "procured", "procurement_failed", "cancelled"]
 *                 PAYMENT_METHODS:
 *                   type: array
 *                   items:
 *                     type: string
 *                     enum: [cash, card, wallet, cod, mixed]
 *                   example: ["cash", "card", "wallet", "cod", "mixed"]
 *                 DRIVER_TYPES:
 *                   type: array
 *                   items:
 *                     type: string
 *                     enum: [primary, joker]
 *                   example: ["primary", "joker"]
 *                 VEHICLE_TYPES:
 *                   type: array
 *                   items:
 *                     type: string
 *                     enum: [motor, bike, car]
 *                   example: ["motor", "bike", "car"]
 *                 DRIVER_AVAILABILITY:
 *                   type: array
 *                   items:
 *                     type: string
 *                     enum: [available, busy, offline]
 *                   example: ["available", "busy", "offline"]
 *                 ORDER_VISIBILITY:
 *                   type: array
 *                   items:
 *                     type: string
 *                     enum: [public, private, draft]
 *                   example: ["public", "private", "draft"]
 *                 TRANSACTION_TYPES:
 *                   type: array
 *                   items:
 *                     type: string
 *                     enum: [credit, debit, transfer, refund]
 *                   example: ["credit", "debit", "transfer", "refund"]
 *                 TRANSACTION_STATUS:
 *                   type: array
 *                   items:
 *                     type: string
 *                     enum: [pending, completed, failed, cancelled]
 *                   example: ["pending", "completed", "failed", "cancelled"]
 *                 SETTLEMENT_STATUS:
 *                   type: array
 *                   items:
 *                     type: string
 *                     enum: [pending, approved, rejected, paid]
 *                   example: ["pending", "approved", "rejected", "paid"]
 *                 SUPPORT_TICKET_STATUS:
 *                   type: array
 *                   items:
 *                     type: string
 *                     enum: [new, open, pending, resolved, closed]
 *                   example: ["new", "open", "pending", "resolved", "closed"]
 *                 SUPPORT_TICKET_PRIORITY:
 *                   type: array
 *                   items:
 *                     type: string
 *                     enum: [low, medium, high, urgent]
 *                   example: ["low", "medium", "high", "urgent"]
 *                 PRODUCT_CATEGORIES:
 *                   type: array
 *                   items:
 *                     type: string
 *                     enum: [food, grocery, electronics, fashion, home, other]
 *                   example: ["food", "grocery", "electronics", "fashion", "home", "other"]
 *                 CURRENCIES:
 *                   type: array
 *                   items:
 *                     type: string
 *                     enum: [SAR, USD, EUR]
 *                   example: ["SAR", "USD", "EUR"]
 *                 SUBSCRIPTION_STATUS:
 *                   type: array
 *                   items:
 *                     type: string
 *                     enum: [active, cancelled, expired, paused]
 *                   example: ["active", "cancelled", "expired", "paused"]
 *                 SUBSCRIPTION_TYPES:
 *                   type: array
 *                   items:
 *                     type: string
 *                     enum: [monthly, yearly, weekly]
 *                   example: ["monthly", "yearly", "weekly"]
 *                 NOTIFICATION_TYPES:
 *                   type: array
 *                   items:
 *                     type: string
 *                     enum: [order, promotion, system, wallet, driver]
 *                   example: ["order", "promotion", "system", "wallet", "driver"]
 *                 BOOLEAN_STATUS:
 *                   type: array
 *                   items:
 *                     type: string
 *                     enum: [true, false]
 *                   example: ["true", "false"]
 *                 DAYS_OF_WEEK:
 *                   type: array
 *                   items:
 *                     type: string
 *                     enum: [monday, tuesday, wednesday, thursday, friday, saturday, sunday]
 *                   example: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
 *                 TIME_SLOTS:
 *                   type: array
 *                   items:
 *                     type: string
 *                     enum: [morning, afternoon, evening, night]
 *                   example: ["morning", "afternoon", "evening", "night"]
 *                 RATINGS:
 *                   type: array
 *                   items:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 5
 *                   example: [1, 2, 3, 4, 5]
 */
r.get("/enums", async (_req, res) => {
  try {
    res.json(ENUMS);
  } catch (e: any) {
    res.status(500).json({ message: e.message || "تعذر تحميل الـ enums" });
  }
});

export default r;
