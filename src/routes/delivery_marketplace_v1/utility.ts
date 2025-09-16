import { Router } from "express";
import { getUtilityOptions } from "../../controllers/delivery_marketplace_v1/utility.controller";
import {
  createUtilityOrder,
  setUtilitySubOrigin,
} from "../../controllers/delivery_marketplace_v1/orders.utility.controller";
import { verifyFirebase } from "../../middleware/verifyFirebase";
import { verifyAdmin } from "../../middleware/verifyAdmin";

// ✅ كنترولرات الأدمن الجديدة
import {
  upsertGasOptions,
  upsertWaterOptions,
} from "../../controllers/admin/utility.admin.controller";
import * as dailyCtl from "../../controllers/admin/utility.daily.controller";

const r = Router();

// عام
r.get("/options", getUtilityOptions);
r.post("/order", verifyFirebase, createUtilityOrder);
r.patch(
  "/order/:orderId/sub/:subId/origin",
  verifyFirebase,
  setUtilitySubOrigin
);

// ✅ إعدادات الغاز/الماء (أدمن)
r.patch("/options/gas", verifyFirebase, verifyAdmin, upsertGasOptions);
r.patch("/options/water", verifyFirebase, verifyAdmin, upsertWaterOptions);

// ✅ الأسعار اليومية (أدمن)
r.get("/daily", verifyFirebase, verifyAdmin, dailyCtl.listDaily);
r.post("/daily", verifyFirebase, verifyAdmin, dailyCtl.upsertDaily);
r.delete("/daily/:id", verifyFirebase, verifyAdmin, dailyCtl.deleteDailyById);
r.delete("/daily", verifyFirebase, verifyAdmin, dailyCtl.deleteDailyByKey);

export default r;
