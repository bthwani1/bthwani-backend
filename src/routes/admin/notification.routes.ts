
import { Router } from "express";
import { body } from "express-validator";
import { createNotification } from "../../controllers/admin/notification.controller";
import { verifyFirebase } from "../../middleware/verifyFirebase";
import { verifyAdmin } from "../../middleware/verifyAdmin";

const router = Router();

router.post(
  "/",
  verifyFirebase,
  verifyAdmin,
  [body("title").isString().notEmpty(), body("body").isString().notEmpty()],
  createNotification
);

export default router;
