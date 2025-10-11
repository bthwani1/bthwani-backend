// src/routes/driver_app/driver.routes.ts

import express from "express";
import { authenticate } from "../../middleware/auth.middleware";
import {
  loginDriver,
  changePassword,
  updateLocation,
  updateAvailability,
  getMyProfile,
  updateMyProfile,
  addOtherLocation,
  deleteOtherLocation,
  getMyOrders,
  completeOrder,
  addReviewForUser,
} from "../../controllers/driver_app/driver.controller";
import {
  getAssignedOrders,
  listMyVacations,
  requestVacation,
  getDriverReports,
} from "../../controllers/driver_app/vacation.controller";
import { getDriverWalletSummary } from "../../controllers/driver_app/driver.wallet.controller";

const router = express.Router();

// === Authentication & Profile ===
router.post("/login", loginDriver);
router.patch("/change-password", authenticate, changePassword);

// === Profile Management ===
router.get("/me", authenticate, getMyProfile);
router.patch("/me", authenticate, updateMyProfile);

// === Location Management ===
router.patch("/location", authenticate, updateLocation);
router.post("/locations", authenticate, addOtherLocation);
router.delete("/locations/:index", authenticate, deleteOtherLocation);

// === Availability ===
router.patch("/availability", authenticate, updateAvailability);

// === Orders ===
router.get("/orders", authenticate, getAssignedOrders);
router.get("/my-orders", authenticate, getMyOrders);
router.post("/complete/:orderId", authenticate, completeOrder);

// === Reviews ===
router.post("/review", authenticate, addReviewForUser);

// === Vacations ===
router.post("/vacations", authenticate, requestVacation);
router.get("/vacations", authenticate, listMyVacations);

// === Wallet ===
router.get("/wallet/summary", authenticate, getDriverWalletSummary);

// === Reports ===
router.get("/reports", authenticate, getDriverReports);

export default router;
