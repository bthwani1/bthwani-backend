import { Request, Response } from "express";
import DeliveryOrder from "./Order";
import { User } from "../user";

// GET /api/v1/admin/users
export const listUsersStats = async (req: Request, res: Response) => {
  // 1) حساب عدد الطلبات لكل userId عبر تجميع
  const stats = await DeliveryOrder.aggregate([
    { $group: { _id: "$user", count: { $sum: 1 } } },
  ]);

  // 2) جلب كل المستخدمين مع count
  const users = await User.find().lean();
  const statsMap = new Map(stats.map((s) => [s._id.toString(), s.count]));

  const result = users.map((u) => ({
    _id: u._id,
    name: u.fullName,
    email: u.email,
    ordersCount: statsMap.get(u._id.toString()) || 0,
    classification: u.classification,
    negativeRatingCount: u.negativeRatingCount,
  }));

  res.json(result);
};
export const updateUserAdmin = async (req: Request, res: Response) => {
  const { classification, negativeRatingCount } = req.body;
  const update: any = {};
  if (classification) update.classification = classification;
  if (typeof negativeRatingCount === "number")
    update.negativeRatingCount = negativeRatingCount;

  const user = await User.findByIdAndUpdate(req.params.id, update, {
    new: true,
  });
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({
    _id: user._id,
    classification: user.classification,
    negativeRatingCount: user.negativeRatingCount,
  });
};
