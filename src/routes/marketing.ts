// routes/marketing.ts
import express from "express";
import MarketingEvent from "../models/MarketingEvent";
import { User } from "../models/user";
import AdSpend from "../models/AdSpend";
import { optionalFirebase } from "../middleware/optionalFirebase";

const r = express.Router();

r.post("/events", optionalFirebase, async (req, res) => {
  const { type, ts, ...props } = req.body || {};
  if (!type) {
    res.status(400).json({ message: "type مطلوب" });
    return;
  }

  const uid =
    (req as any).user?.id ||
    (req as any).user?.uid ||
    (req as any).firebaseUser?.uid ||
    null;

  const now = Date.now();
  const numTs = Number(ts);
  const eventTs =
    Number.isFinite(numTs) && numTs > 0
      ? numTs < 3e10
        ? numTs * 1000
        : numTs
      : now;

  await MarketingEvent.create({ userId: uid, type, ts: eventTs, props });
  res.json({ ok: true });
});

// KPIs أساسية
r.get("/marketing/kpis", async (req, res) => {
  const from = req.query.from
    ? new Date(String(req.query.from))
    : new Date(Date.now() - 30 * 864e5);
  const to = req.query.to ? new Date(String(req.query.to)) : new Date();

  const newUsers = await User.countDocuments({
    createdAt: { $gte: from, $lte: to },
  });
  const firstOrders = await MarketingEvent.countDocuments({
    type: "first_order",
    ts: { $gte: from, $lte: to },
  });

  const spendAgg = await AdSpend.aggregate([
    { $match: { date: { $gte: from, $lte: to } } },
    { $group: { _id: null, cost: { $sum: "$cost" } } },
  ]);
  const spend = spendAgg?.[0]?.cost || 0;

  res.json({ newUsers, conversions: firstOrders, spend });
});

export default r;
