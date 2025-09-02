import { Request, Response, NextFunction } from "express";
import Vendor from "../models/vendor_app/Vendor";

export const authVendor = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user._id;
  const vendor = await Vendor.findOne({ userId });
  if (!vendor) {
    res.status(403).json({ error: "Unauthorized" });
    return;
  }
  req.vendor = vendor;
  next();
};
