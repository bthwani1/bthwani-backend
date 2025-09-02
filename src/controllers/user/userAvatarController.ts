import { Request, Response } from "express";
import { User } from "../../models/user";

export const uploadAvatar = async (req: Request, res: Response) => {
  try {
    if (!req.user?.uid) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
console.log("✅ userAvatarRoutes loaded");

    const user = await User.findOne({ firebaseUID: req.user.uid });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const { image } = req.body;

    if (!image) {
      res.status(400).json({ message: "Image URL is required" });
      return;
    }

    user.profileImage = image;
    await user.save();

    res.status(200).json({ profileImage: user.profileImage });
  } catch (error) {
    console.error("Upload avatar error:", error);
    res.status(500).json({ message: "Failed to update avatar", error });
  }
};
