// routes/push.routes.ts
import express from "express";
import PushToken from "./models/PushToken";
import Vendor from "./models/vendor_app/Vendor";

const r = express.Router();
const assertExpo = (t: string) => t && t.startsWith("ExpoPushToken[");

// عام: يكتب في PushToken مع حقل app
async function upsertToken(
  userId: string,
  token: string,
  platform?: string,
  app?: "user" | "driver" | "vendor",
  device?: string
) {
  await PushToken.updateOne(
    { token },
    {
      $set: {
        userId,
        token,
        platform,
        app,
        device,
        lastSeenAt: new Date(),
        disabled: false,
        updatedAt: new Date(),
      },
      $setOnInsert: { failureCount: 0 },
    },
    { upsert: true }
  );
}

/** مستخدم عادي — لديك من قبل */
r.post("/users/push-token", async (req, res) => {
  const userId = (req as any).firebaseUser?.uid || (req as any).user?.id;
if (!userId){
  res.status(401).json({ message: "Unauthorized" });
  return;
} 
  const { token, platform, device } = req.body || {};
  if (!assertExpo(token)){
    res.status(400).json({ message: "Invalid Expo token" });
    return;
  }
  await upsertToken(userId, token, platform, "user", device);
  res.json({ ok: true });
});

/** سائق */
r.post("/drivers/push-token", async (req, res) => {
  const driverId = (req as any).driver?.id || (req as any).user?.id; // حسب توثيقك
if (!driverId){
  res.status(401).json({ message: "Unauthorized" });
  return;
} 
  const { token, platform, device } = req.body || {};
  if (!assertExpo(token)){
    res.status(400).json({ message: "Invalid Expo token" });
    return;
  }

  // خيّار1: خزّن في PushToken (مستحسن)
  await upsertToken(driverId, token, platform, "driver", device);

  // خيّار2 (اختياري): أضف expoPushToken في Driver لو أردت كنسخة إضافية
  // await Driver.findByIdAndUpdate(driverId, { $set: { expoPushToken: token } });

  res.json({ ok: true });
});

/** تاجر */
r.post("/vendors/push-token", async (req, res) => {
  const vendorId = (req as any).vendor?.id || (req as any).user?.id;
if (!vendorId){
  res.status(401).json({ message: "Unauthorized" });
  return;
} 
  const { token, platform, device } = req.body || {};
  if (!assertExpo(token)){
    res.status(400).json({ message: "Invalid Expo token" });
    return;
  }

  // خزّنه في PushToken ليستفيد نظام الحملات
  await upsertToken(vendorId, token, platform, "vendor", device);

  // وللتوافق مع سكيمتك الحالية (vendor.expoPushToken):
  await Vendor.findByIdAndUpdate(vendorId, { $set: { expoPushToken: token } });

  res.json({ ok: true });
});

export default r;
