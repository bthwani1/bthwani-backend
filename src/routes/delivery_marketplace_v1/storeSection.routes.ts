// routes/storeSection.routes.ts
import express from "express";
import { getStoreSections } from "../../controllers/delivery_marketplace_v1/storeSection.controller";
const router = express.Router();

router.get("/", getStoreSections);

export default router;
