// routes/admin/drivers.finance.ts
import { Router } from "express";

import DriverAdjustment from "../../models/Driver_app/DriverAdjustment";
import DriverPayoutCycle from "../../models/Driver_app/DriverPayoutCycle";

const r = Router();

r.post("/:id/adjustments", async (req, res) => {
  const a = await DriverAdjustment.create({
    driver: req.params.id,
    type: req.body.type,
    amount: req.body.amount,
    reason: req.body.reason,
    createdBy: (req.user as any)?.id || (req.user as any)?.email || "system",
  });
  res.json(a);
});
r.get("/:id/adjustments", async (req, res) => {
  const items = await DriverAdjustment.find({ driver: req.params.id })
    .sort({ createdAt: -1 })
    .limit(2000);
  res.json({ items });
});
r.post(
  "/run",

  async (req, res) => {
    // يولّد دورات تسوية (حساب earnings من أوامر/عمولات حسب نظامك)
    // هنا نصنع placeholder فقط – الحساب الفعلي اربطه بالطلبات
    const { period, from, to } = req.query as any;
    // example: iterate drivers list…
    // تأكد من unique({driver,start,end})
    res.json({ ok: true, message: "Payout cycles enqueued/created" });
  }
);

r.get("/", async (req, res) => {
  const { from, to, status, driver } = req.query as any;
  const q: any = {};
  if (driver) q.driver = driver;
  if (status) q.status = status;
  if (from && to) (q.start = from), (q.end = to);
  const items = await DriverPayoutCycle.find(q).limit(2000);
  res.json({ items });
});

r.patch("/:payoutId/approve", async (req, res) => {
  const p = await DriverPayoutCycle.findByIdAndUpdate(
    req.params.payoutId,
    { $set: { status: "approved" } },
    { new: true }
  );
  res.json(p);
});
r.patch("/:payoutId/pay", async (req, res) => {
  const p = await DriverPayoutCycle.findByIdAndUpdate(
    req.params.payoutId,
    {
      $set: { status: "paid", reference: req.body.reference },
    },
    { new: true }
  );
  res.json(p);
});

export default r;
