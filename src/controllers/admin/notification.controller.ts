// controllers/admin/notification.controller.ts
import { Request, Response } from "express";
import { User } from "../../models/user";
import { sendPushNotification } from "../../utils/push";
import { io } from "../../index";

export const createNotification = async (req: Request, res: Response) => {
  try {
    const { userId, title, body, data } = req.body;
    if (!title || !body) {
      res.status(400).json({ message: "title and body are required" });
      return;
    }

    const notif = {
      title,
      body,
      data,
      isRead: false,
      createdAt: new Date(),
    } as any;

    if (userId) {
      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      user.notificationsFeed.push(notif);
      await user.save();
      if (user.pushToken) {
        await sendPushNotification(user.pushToken, { title, body, data });
      }
      io.to(`user_${user._id.toString()}`).emit("notification", notif);
      res.json({ message: "Notification sent" });
    } else {
      await User.updateMany({}, { $push: { notificationsFeed: notif } });
      const users = await User.find({ pushToken: { $exists: true, $ne: null } }).select("pushToken");
      for (const u of users) {
        if (u.pushToken) {
          await sendPushNotification(u.pushToken, { title, body, data });
        }
        io.to(`user_${u._id.toString()}`).emit("notification", notif);
      }
      res.json({ message: "Broadcast sent" });
    }
  } catch (err) {
    console.error("createNotification error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
