// src/routes/marketing/auth.routes.ts
import { Router } from "express";
import {
  deleteMyAccountSoft,
  marketerLogin,
  me,
  requestAccountDeletion,
} from "../../controllers/marketer_v1/auth.controller";
import { verifyMarketerJWT } from "../../middleware/verifyMarketerJWT";

const router = Router();

/**
 * POST /auth/marketer-login
 * body: { email?: string, phone?: string, password: string }
 * resp: { token, user }
 */
router.post("/marketer-login", marketerLogin);
router.get("/me", verifyMarketerJWT, me);


/**
 * يطلب حذف الحساب (تذكرة/علامة داخلية)
 * POST /auth/delete-account/request
 */
router.post("/delete-account/request", verifyMarketerJWT, requestAccountDeletion);

/**
 * حذف فوري ذاتي (Soft-delete + إخفاء PII)
 * DELETE /auth/delete-account
 */
router.delete("/delete-account", verifyMarketerJWT, deleteMyAccountSoft);


export default router;
