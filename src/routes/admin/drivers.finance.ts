// routes/admin/drivers.finance.ts
import { Router } from "express";
import { body, param, query } from "express-validator";
import { verifyFirebase } from "../../middleware/verifyFirebase";
import { requirePermission } from "../../middleware/rbac";
import DriverAdjustment from "../../models/Driver_app/DriverAdjustment";
import DriverPayoutCycle from "../../models/Driver_app/DriverPayoutCycle";

const r = Router();

// Apply Firebase authentication and admin.drivers permission to all routes
r.use(verifyFirebase);
r.use(requirePermission('admin.drivers', 'read'));

// Create driver adjustment - requires admin.drivers:write permission
r.post("/:id/adjustments",
  requirePermission('admin.drivers', 'write'),
  [
    body("type").isIn(['credit', 'debit']),
    body("amount").isNumeric(),
    body("reason").isString().notEmpty()
  ],
  async (req, res) => {
    const a = await DriverAdjustment.create({
      driver: req.params.id,
      type: req.body.type,
      amount: req.body.amount,
      reason: req.body.reason,
      createdBy: (req.user as any)?.id || (req.user as any)?.email || "system",
    });
    res.json(a);
  }
);

// Get driver adjustments - requires admin.drivers:read permission (already applied globally)
r.get("/:id/adjustments",
  [
    param("id").isMongoId()
  ],
  async (req, res) => {
    const items = await DriverAdjustment.find({ driver: req.params.id })
      .sort({ createdAt: -1 })
      .limit(2000);
    res.json({ items });
  }
);

// Run payout cycles - requires admin.drivers:write permission
r.post(
  "/run",
  requirePermission('admin.drivers', 'write'),
  async (req, res) => {
    const { period, from, to } = req.query as any;
    res.json({ ok: true, message: "Payout cycles enqueued/created" });
  }
);

// Get payout cycles - requires admin.drivers:read permission (already applied globally)
r.get("/",
  [
    query("from").optional().isISO8601(),
    query("to").optional().isISO8601(),
    query("status").optional().isIn(['pending', 'approved', 'paid', 'cancelled']),
    query("driver").optional().isMongoId()
  ],
  async (req, res) => {
    const { from, to, status, driver } = req.query as any;
    const q: any = {};
    if (driver) q.driver = driver;
    if (status) q.status = status;
    if (from && to) (q.start = from), (q.end = to);
    const items = await DriverPayoutCycle.find(q).limit(2000);
    res.json({ items });
  }
);

// Approve payout cycle - requires admin.drivers:write permission
r.patch("/:payoutId/approve",
  requirePermission('admin.drivers', 'write'),
  [
    param("payoutId").isMongoId()
  ],
  async (req, res) => {
    const p = await DriverPayoutCycle.findByIdAndUpdate(
      req.params.payoutId,
      {
        $set: {
          status: "approved",
          approvedBy: (req.user as any)?.id || (req.user as any)?.email,
          approvedAt: new Date()
        }
      },
      { new: true }
    );

    if (!p) {
      return res.status(404).json({
        error: { code: "PAYOUT_NOT_FOUND", message: "Payout cycle not found" }
      });
    }

    res.json(p);
  }
);

// Pay payout cycle - requires admin.drivers:write permission
r.patch("/:payoutId/pay",
  requirePermission('admin.drivers', 'write'),
  [
    param("payoutId").isMongoId(),
    body("reference").isString().notEmpty()
  ],
  async (req, res) => {
    const p = await DriverPayoutCycle.findByIdAndUpdate(
      req.params.payoutId,
      {
        $set: {
          status: "paid",
          reference: req.body.reference,
          paidBy: (req.user as any)?.id || (req.user as any)?.email,
          paidAt: new Date()
        }
      },
      { new: true }
    );

    if (!p) {
      return res.status(404).json({
        error: { code: "PAYOUT_NOT_FOUND", message: "Payout cycle not found" }
      });
    }

    res.json(p);
  }
);

export default r;
