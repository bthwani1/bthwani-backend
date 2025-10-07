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
import { verifyFirebase } from "../../middleware/verifyFirebase";

const r = Router();

// كوبونات
r.post("/coupons", verifyFirebase, verifyAdmin, createCoupon);
r.get("/coupons", verifyFirebase, verifyAdmin, listCoupons);

// محفظة
r.get("/users/search", verifyFirebase, verifyAdmin, searchUsers);
r.post("/credit", verifyFirebase, verifyAdmin, adminCreditWallet);
r.post("/debit", verifyFirebase, verifyAdmin, adminDebitWallet);

export default r;
