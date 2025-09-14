import { Request, Response } from "express";
import DeliveryBanner from "../../models/delivery_marketplace_v1/DeliveryBanner";

// Create
export const create = async (req: Request, res: Response) => {
  try {
    const data = new DeliveryBanner(req.body);
    await data.save();
    res.status(201).json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Get all active banners (filtered for slider)
export const getAll = async (req: Request, res: Response) => {
  try {
    const now = new Date();

    const isAdmin =
      req.user?.role === "admin" || req.user?.role === "superadmin";

    const data = isAdmin
      ? await DeliveryBanner.find().sort({ createdAt: -1 }) // 🟢 كل البانرات
      : await DeliveryBanner.find({
          isActive: true,
          $or: [
            {
              $and: [
                { startDate: { $exists: false } },
                { endDate: { $exists: false } },
              ],
            },
            {
              $and: [{ startDate: { $lte: now } }, { endDate: { $gte: now } }],
            },
            {
              $and: [
                { startDate: { $lte: now } },
                { endDate: { $exists: false } },
              ],
            },
            {
              $and: [
                { startDate: { $exists: false } },
                { endDate: { $gte: now } },
              ],
            },
          ],
        }).sort({ order: 1, createdAt: -1 });

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllAdmin = async (req: Request, res: Response) => {
  try {
    const data = await DeliveryBanner.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Read by ID
export const getById = async (req: Request, res: Response) => {
  try {
    const data = await DeliveryBanner.findById(req.params.id);
    if (!data) {
      res.status(404).json({ message: "Not found" });
      return;
    }
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Update
export const update = async (req: Request, res: Response) => {
  try {
    const data = await DeliveryBanner.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Delete
export const remove = async (req: Request, res: Response) => {
  try {
    await DeliveryBanner.findByIdAndDelete(req.params.id);
    res.json({ message: "DeliveryBanner deleted" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
