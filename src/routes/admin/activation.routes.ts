import { Router } from "express";
import { verifyFirebase } from "../../middleware/verifyFirebase";
import { verifyAdmin } from "../../middleware/verifyAdmin";
import {
  activateStore,
  activateVendor,
} from "../../controllers/admin/activation.controller";

const router = Router();
router.patch(
  "/store/:storeId",
  verifyFirebase,
  verifyAdmin,
  activateStore
);
router.patch(
  "/vendor/:vendorId",
  verifyFirebase,
  verifyAdmin,
  activateVendor
);

export default router;
