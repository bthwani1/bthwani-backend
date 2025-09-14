// routes/push.routes.ts
import express from "express";
import PushToken from "./models/PushToken";
import { verifyFirebase } from "./middleware/verifyFirebase";
import Vendor from "./models/vendor_app/Vendor";

const r = express.Router();

const assertExpo = (t?: string) =>
  typeof t === "string" && /^Expo(nent)?PushToken\[[^]+\]$/.test(t.trim());
// مفضّل توحّد استخراج الـ uid
function getUid(req: any): string | null {
  return req.firebaseUser?.uid || req.user?.id || null;
}

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

/** مستخدم عادي */
r.post(
  "/users/push-token",
  (req, _res, next) => {
    console.log("[/users/push-token] before verify");
    next();
  },
  verifyFirebase, // 👈 ضروري
  async (req, res) => {
    const userId = getUid(req);
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { token, platform, device } = req.body || {};
    if (!assertExpo(token)) {
      res.status(400).json({ message: "Invalid Expo token" });
      return;
    }
    console.log(
      "[push-token] token prefix/len:",
      String(token).slice(0, 20),
      String(token).length
    );
    console.log("[push-token] device:", device);
    console.log("[push-token] platform:", platform);
    console.log("[push-token] token:", token);
    await upsertToken(userId, token, platform, "user", device);
    res.json({ ok: true });
  }
);

/** سائق */
r.post(
  "/drivers/push-token",
  verifyFirebase, // أو verifyDriverAuth إن عندك ميدل وير خاص للسائقين
  async (req: any, res) => {
    const driverId = getUid(req); // عدّلها لو عندك req.driver.id
    if (!driverId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { token, platform, device } = req.body || {};
    if (!assertExpo(token)) {
      res.status(400).json({ message: "Invalid Expo token" });
      return;
    }

    await upsertToken(driverId, token, platform, "driver", device);
    res.json({ ok: true });
  }
);

/** تاجر */
r.post(
  "/vendors/push-token",
  verifyFirebase, // أو verifyVendorAuth لو عندك
  async (req: any, res) => {
    const vendorId = getUid(req); // عدّلها لو عندك req.vendor.id
    if (!vendorId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { token, platform, device } = req.body || {};
    if (!assertExpo(token)) {
      res.status(400).json({ message: "Invalid Expo token" });
      return;
    }

    await upsertToken(vendorId, token, platform, "vendor", device);
    await Vendor.findByIdAndUpdate(vendorId, {
      $set: { expoPushToken: token },
    });
    res.json({ ok: true });
  }
);

export default r;
