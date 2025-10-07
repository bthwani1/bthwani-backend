// src/routes/driver/driverAppRoutes.ts

import express from "express";
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
import { authenticate } from "../../middleware/auth.middleware";
import {
  getAssignedOrders,
  listMyVacations,
  requestVacation,
} from "../../controllers/driver_app/vacation.controller";

const router = express.Router();

router.post("/login", loginDriver);
router.post("/vacations", authenticate, requestVacation);
router.get("/vacations", authenticate, listMyVacations);
router.get("/orders", authenticate, getAssignedOrders);

router.patch("/change-password",authenticate, changePassword);

router.patch("/location",authenticate, updateLocation);

router.patch("/availability",authenticate, updateAvailability);


router.get("/me", authenticate, getMyProfile);

router.patch("/me", authenticate, updateMyProfile);


router.post("/locations", authenticate, addOtherLocation);


router.delete("/locations/:index", authenticate, deleteOtherLocation);


router.get("/orders", authenticate, getMyOrders);


router.post("/complete/:orderId", authenticate, completeOrder);


router.post("/review", authenticate, addReviewForUser);

export default router;
