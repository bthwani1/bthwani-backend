// routes/admin.wallet.coupons.ts
import { Router } from "express";
import {
  createCoupon /* لديك مسبقًا */,
} from "../../controllers/Wallet_V8/coupon.controller";

import { verifyAdmin } from "../../middleware/verifyAdmin";
import {
  listCoupons,
  searchUsers,
} from "../../controllers/admin/wallet.admin.controller";
import { adminCreditWallet } from "../../controllers/admin/wallet.admin.controller";
import { adminDebitWallet } from "../../controllers/admin/wallet.admin.controller";

const r = Router();

// كوبونات
r.post("/admin/coupons", verifyAdmin, createCoupon);
r.get("/admin/coupons", verifyAdmin, listCoupons);

// محفظة
r.get("/admin/users/search", verifyAdmin, searchUsers);
r.post("/admin/wallet/credit", verifyAdmin, adminCreditWallet);
r.post("/admin/wallet/debit", verifyAdmin, adminDebitWallet);

export default r;
