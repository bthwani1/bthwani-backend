// middleware/optionalFirebase.ts
import { adminAuth } from "../config/firebaseAdmin";
export async function optionalFirebase(req, _res, next) {
  const raw = (req.headers.authorization || "").toString();
  const t = raw
    .replace(/^Bearer\s+/i, "")
    .replace(/^"(.*)"$/, "$1")
    .trim();
  if (!t) return next();
  try {
    const d = await adminAuth.verifyIdToken(t, false);
    (req as any).firebaseUser = d;
    (req as any).user = { uid: d.uid, id: d.uid, email: d.email };
  } catch {
    /* تجاهل الأخطاء */
  }
  next();
}
