// src/middleware/verifyFirebase.ts  (debug, اطبع كل شيء مهم)
import { adminAuth } from "../config/firebaseAdmin";
console.log("[verifyFirebase] LOADED build:", new Date().toISOString());
import { Request, Response, NextFunction } from "express";
import { ERR } from "../utils/errors";

// src/middleware/verifyFirebase.ts
const CHECK_REVOKED = (process.env.FB_CHECK_REVOKED || "true") === "true";

export const verifyFirebase = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token = (req.headers.authorization || "")
      .replace(/^Bearer\s+/i, "")
      .trim();

    // Remove quotes if present
    token = token.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");

    // More robust token validation
    if (!token || token.length < 10) {
      res.status(401).json({
        error: {
          code: "INVALID_TOKEN_FORMAT",
          message: "Invalid token format - token too short or missing"
        }
      });
      return;
    }

    // Check if token looks like a JWT (has 3 parts) or Firebase ID token (shorter)
    const tokenParts = token.split(".");
    if (tokenParts.length < 2 || tokenParts.length > 3) {
      res.status(401).json({
        error: {
          code: "INVALID_TOKEN_FORMAT",
          message: "Invalid token format - incorrect number of segments"
        }
      });
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
      res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Invalid token" }, detail: e?.message });
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
      // لو المشكلة مفاتيح جوجل/شبكة بتظهر هنا
      res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Invalid token" }, detail: e?.message });
      return;
    }
  } catch (e: any) {
    console.error("[verifyFirebase] unexpected:", e);
    res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Unauthorized" }, detail: e?.message || e });
    return;
  }
};
