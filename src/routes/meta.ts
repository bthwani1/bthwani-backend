// src/routes/meta.ts
import { Router } from "express";
import UtilityPricing from "../models/delivery_marketplace_v1/UtilityPricing";

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

export default r;
