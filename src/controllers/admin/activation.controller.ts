import { Request, Response } from "express";
import DeliveryStore from "../../models/delivery_marketplace_v1/DeliveryStore";
import Vendor from "../../models/vendor_app/Vendor";

export const activateStore = async (req: Request, res: Response) => {
  const { storeId } = req.params;
  const s = await DeliveryStore.findByIdAndUpdate(
    storeId,
    { isActive: true },
    { new: true }
  );
  if (!s) {
    res.status(404).json({ message: "Store not found" });
    return;
  }
  res.json({
    ok: true,
    store: s,
    createdByMarketer: s.createdByMarketerUid ? {
      uid: s.createdByMarketerUid,
    } : null
  });
};

export const activateVendor = async (req: Request, res: Response) => {
  const { vendorId } = req.params;
  const v = await Vendor.findByIdAndUpdate(
    vendorId,
    { isActive: true },
    { new: true }
  ).select("-password");
  if (!v) {
    res.status(404).json({ message: "Vendor not found" });
    return;
  }
  res.json({ ok: true, vendor: v });
};
