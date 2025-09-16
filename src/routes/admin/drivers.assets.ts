// routes/admin/drivers.assets.ts
import { Router } from "express";
import { z } from "zod";

import DriverAsset from "../../models/Driver_app/DriverAsset";
import DriverAssetAssignment from "../../models/Driver_app/DriverAssetAssignment";

const r = Router();

r.post(
  "/",

  async (req, res) => {
    const a = await DriverAsset.create({ ...req.body, status: "available" });
    res.json(a);
  }
);

r.post(
  "/:assetId/assign",

  async (req, res) => {
    const { assetId } = req.params;
    const { driverId, deposit, expectedReturnAt } = req.body;

    // منع ازدواجية: أصل واحد نشط لشخصين
    const existing = await DriverAssetAssignment.findOne({
      asset: assetId,
      status: "active",
    });
    if (existing) {
      res.status(400).json({ message: "Asset already assigned" });
      return;
    }

    const assign = await DriverAssetAssignment.create({
      asset: assetId,
      driver: driverId,
      assignedAt: new Date(),
      expectedReturnAt: expectedReturnAt
        ? new Date(expectedReturnAt)
        : undefined,
      depositAmount: deposit,
      status: "active",
    });
    await DriverAsset.findByIdAndUpdate(assetId, {
      $set: { status: "assigned" },
    });
    res.json(assign);
  }
);

r.post(
  "/:assetId/return",

  async (req, res) => {
    const { assetId } = req.params;
    const a = await DriverAssetAssignment.findOne({
      asset: assetId,
      status: "active",
    });
    if (!a) {
      res.status(400).json({ message: "No active assignment" });
      return;
    }
    a.status = "returned";
    a.returnedAt = new Date();
    a.set("notes", req.body.notes);
    await a.save();
    await DriverAsset.findByIdAndUpdate(assetId, {
      $set: { status: "available" },
    });
    res.json(a);
  }
);

r.get("/", async (req, res) => {
  const { status, type, driver } = req.query as any;
  const q: any = {};
  if (status) q.status = status;
  if (driver) q.driver = driver;
  const items = await DriverAssetAssignment.find(q)
    .populate("asset")
    .limit(2000);
  res.json({ items });
});

export default r;
