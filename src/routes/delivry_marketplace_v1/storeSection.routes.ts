// routes/storeSection.routes.ts
import express from "express";
import { getStoreSections } from "../../controllers/delivry_Marketplace_V1/storeSection.controller";
const router = express.Router();

router.get("/", getStoreSections);

export default router;
