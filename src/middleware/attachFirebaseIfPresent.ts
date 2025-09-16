import { admin } from "../config/firebaseAdmin";

export async function attachFirebaseIfPresent(req: any, _res: any, next: any) {
  const auth = req.headers.authorization;
  console.log("[attach] hasAuth?", !!auth);

  if (auth?.startsWith("Bearer ")) {
    const token = auth.split(" ")[1];
    try {
      const decoded = await admin.auth().verifyIdToken(token);
      (req as any).firebaseUser = decoded;
      (req as any).user = { id: decoded.uid };
      console.log("[attach] decoded uid:", decoded.uid);
    } catch (e: any) {
      console.log("[attach] verifyIdToken error:", e?.message);
      // كمّل كضيف
    }
  }
  next();
}
