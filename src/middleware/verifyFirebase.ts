// src/middleware/verifyFirebase.ts  (debug, اطبع كل شيء مهم)
import { adminAuth } from "../config/firebaseAdmin";
console.log("[verifyFirebase] LOADED build:", new Date().toISOString());
import { Request, Response, NextFunction } from "express";

// src/middleware/verifyFirebase.ts
const CHECK_REVOKED = (process.env.FB_CHECK_REVOKED || "true") === "true";

export const verifyFirebase = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token = (req.headers.authorization || "")
      .replace(/^Bearer\s+/i, "")
      .trim();
    token = token.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");

    if (!token || token.split(".").length !== 3) {
      res.status(401).json({ message: "Invalid token format" });
      return;
    }

    const nowSec = Math.floor(Date.now() / 1000);
    try {
      const d0 = await adminAuth.verifyIdToken(token, false);
      console.log("[verifyFirebase] OK(no-check) uid:", d0.uid);
      console.log("[verifyFirebase] iss:", d0.iss, "aud:", d0.aud);
      console.log(
        "[verifyFirebase] iat:",
        d0.iat,
        "exp:",
        d0.exp,
        "now:",
        nowSec,
        "skew(now-iat):",
        nowSec - d0.iat,
        "ttl(exp-now):",
        d0.exp - nowSec
      );
      console.log(
        "[verifyFirebase] projectId(expected):",
        process.env.FIREBASE_PROJECT_ID
      );
    } catch (e: any) {
      console.warn("[verifyFirebase] FAIL(no-check):", e?.code, e?.message);
      res.status(401).json({
        message: "Invalid token (decode failed)",
        code: e?.code,
        detail: e?.message,
      });
      return;
    }

    try {
      const d = await adminAuth.verifyIdToken(token, CHECK_REVOKED);
      (req as any).firebaseUser = d;
      (req as any).user = { uid: d.uid, id: d.uid, email: d.email };
      next();
      return;
    } catch (e: any) {
      console.warn(
        "[verifyFirebase] FAIL(checkRevoked=",
        CHECK_REVOKED,
        "):",
        e?.code,
        e?.message
      );
      const payload: any = {
        message: "Invalid token",
        code: e?.code,
        detail: e?.message,
      };
      // لو المشكلة مفاتيح جوجل/شبكة بتظهر هنا
      res.status(401).json(payload);
      return;
    }
  } catch (e: any) {
    console.error("[verifyFirebase] unexpected:", e);
    res.status(401).json({ message: "Unauthorized", detail: e?.message || e });
    return;
  }
};
