import { Router } from "express";
import AppSubscription from "../models/AppSubscription";
import AppTutorial from "../models/AppTutorial";
const r = Router();
r.get("/subscriptions", async (_req, res) => {
  res.json(await AppSubscription.find().sort({ createdAt: -1 }));
});

r.get("/tutorials", async (_req, res) => {
  res.json(await AppTutorial.find().sort({ createdAt: -1 }));
});
export default r;
