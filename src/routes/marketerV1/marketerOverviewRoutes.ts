// src/routes/marketerV1/marketerOverviewRoutes.ts
import { Router } from "express";
import { verifyMarketerJWT } from "../../middleware/verifyMarketerJWT";
import { getMarketerOverview } from "../../controllers/marketer_v1/marketerOverview.controller";

const r = Router();
r.get("/marketer/overview", verifyMarketerJWT, getMarketerOverview);
export default r;
