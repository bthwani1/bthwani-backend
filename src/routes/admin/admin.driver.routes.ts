// src/routes/admin/driverAdminRoutes.ts

import express from "express";
import {
  createDriver,
  listDrivers,
  resetPassword,
  searchDrivers,
  setJokerStatus,
  toggleBan,
  updateWallet,
  verifyDriver,
} from "../../controllers/admin/admin.driver.controller";
import {
  confirmTransferToUser,
  initiateTransferToUser,
  updateJokerWindow,
} from "../../controllers/driver_app/driver.controller";
import { verifyFirebase } from "../../middleware/verifyFirebase";
import {
  approveVacation,
  getActiveDriversCount,
} from "../../controllers/driver_app/vacation.controller";
import { verifyAdmin } from "../../middleware/verifyAdmin";

const router = express.Router();

router.post(
  "/create",
  verifyFirebase,
  verifyAdmin,
  createDriver
);

router.put(
  "/joker",
  verifyFirebase,
  verifyAdmin,
  setJokerStatus
);

router.patch(
  "vacations/:id/approve",
  verifyFirebase,
  verifyAdmin,
  approveVacation
);

router.get(
  "/active/count",
  verifyFirebase,
  verifyAdmin,
  getActiveDriversCount
);

router.get(
  "/search",
  verifyFirebase,
  verifyAdmin,
  searchDrivers
);

router.get(
  "/",
  verifyFirebase,
  verifyAdmin,
  listDrivers
);
router.patch(
  "/:id/block",
  verifyFirebase,
  verifyAdmin,
  toggleBan
);

router.patch(
  "/:id/verify",
  verifyFirebase,
  verifyAdmin,
  verifyDriver
);

router.patch(
  "/:id/wallet",
  verifyFirebase,
  verifyAdmin,
  updateWallet
);

router.patch(
  "/:id/reset-password",
  verifyFirebase,
  verifyAdmin,
  resetPassword
);

router.post(
  "/wallet/initiate-transfer",
  verifyFirebase,
  verifyAdmin,
  initiateTransferToUser
);

router.post(
  "/wallet/confirm-transfer",
  verifyFirebase,
  verifyAdmin,
  confirmTransferToUser
);

router.patch(
  "/drivers/:id/joker-window",
  verifyFirebase,
  verifyAdmin,
  updateJokerWindow
);

export default router;
