// src/routes/utility.ts
import { Router } from "express";
import { getUtilityOptions } from "../../controllers/delivery_marketplace_v1/utility.controller";
import {
  createUtilityOrder,
  setUtilitySubOrigin,
} from "../../controllers/delivery_marketplace_v1/orders.utility.controller";
import { verifyFirebase } from "../../middleware/verifyFirebase";

const r = Router();

r.get("/options", getUtilityOptions); // GET /utility/options?city=صنعاء
r.post("/order", verifyFirebase, createUtilityOrder); // POST /utility/order
r.patch(
  "/order/:orderId/sub/:subId/origin",
  verifyFirebase,
  setUtilitySubOrigin
);

export default r;
