// src/routes/userAvatarRoutes.ts

import express from "express";
import { verifyFirebase } from "../middleware/verifyFirebase";
import { uploadAvatar } from "../controllers/user/userAvatarController";

const router = express.Router();


router.patch("/", verifyFirebase, uploadAvatar);

export default router;
