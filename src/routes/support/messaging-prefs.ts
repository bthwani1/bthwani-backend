// routes/messaging-prefs.ts
import { Router } from "express";
import MessagingPrefs from "../../models/support/MessagingPrefs";
const r = Router();

// GET /messaging-prefs/me
r.get("/me", async (req: any, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  const prefs =
    (await MessagingPrefs.findOne({ userId })) ||
    (await MessagingPrefs.create({ userId }));
  res.json(prefs);
});


r.patch("/me", async (req: any, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  const prefs = await MessagingPrefs.findOneAndUpdate(
    { userId },
    { $set: req.body },
    { new: true, upsert: true }
  );
  res.json(prefs);
});

export default r;
