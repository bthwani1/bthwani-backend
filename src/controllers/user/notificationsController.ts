import { User } from "../../models/user";
import { Request, Response } from "express";

export const getNotifications = async (req: Request, res: Response) => {
  if (!req.user?.uid) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  const user = await User.findOne({ firebaseUID: req.user.uid });
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  res.json(user.notificationsFeed || []);
};

export const markAllNotificationsRead = async (req: Request, res: Response) => {
  if (!req.user?.uid) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  const user = await User.findOne({ firebaseUID: req.user.uid });
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  user.notificationsFeed.forEach((n) => (n.isRead = true));
  await user.save();
  res.json({ message: "All marked as read" });
};
