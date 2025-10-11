import { Request, Response, NextFunction } from "express";
import { AdminLog } from "../models/admin/adminLog.model";

export function audit(actionName?: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    const actor = (req as any).admin || (req as any).vendor || (req as any).user;

    // نسمع على نهاية الاستجابة لمعرفة النتيجة
    res.on("finish", async () => {
      try {
        // نسجّل فقط على عمليات تغيير البيانات
        const mutating = ["POST","PUT","PATCH","DELETE"].includes(req.method);
        if (!mutating) return;

        // تحديد نوع المنفذ
        let actorType: "admin" | "vendor" | "user" | "system" = "system";
        if (actor) {
          if ((req as any).admin) actorType = "admin";
          else if ((req as any).vendor) actorType = "vendor";
          else if ((req as any).user) actorType = "user";
        }

        await AdminLog.create({
          actorId: actor?._id,
          actorType,
          action: actionName || `${req.method} ${req.baseUrl}${req.path}`,
          method: req.method,
          route: `${req.baseUrl}${req.path}`,
          status: res.statusCode < 400 ? "success" : "error",
          ip: req.ip,
          userAgent: req.get("user-agent"),
          details: JSON.stringify({
            body: req.body ? Object.keys(req.body) : [],
            query: req.query,
            statusCode: res.statusCode,
          }),
          durationMs: Date.now() - start,
        });
      } catch (e) {
        // لا نكسر الطلب في حال فشل التسجيل
        console.error("Audit log error:", e);
      }
    });

    next();
  };
}
