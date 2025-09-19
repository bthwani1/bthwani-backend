import { Request, Response } from "express";
import OnboardingSlide from "../../models/cms/OnboardingSlide";

export async function list(req: Request, res: Response) {
  const items = await OnboardingSlide.find({})
    .sort({ order: 1, createdAt: -1 })
    .lean();
  res.json(items);
}

export async function create(req: Request, res: Response) {
  const body = req.body || {};
  const exists = await OnboardingSlide.findOne({ key: body.key });
    if (exists) {
    res.status(409).json({ message: "Key already exists" });
    return;
  }
  const doc = await OnboardingSlide.create(body);
  res.status(201).json(doc);
}

export async function update(req: Request, res: Response) {
  const { id } = req.params;
  const body = req.body || {};
  const doc = await OnboardingSlide.findByIdAndUpdate(id, body, { new: true });
  if (!doc) {
    res.status(404).json({ message: "Not found" });
    return;
  }
  res.json(doc);
}

export async function remove(req: Request, res: Response) {
  const { id } = req.params;
  const doc = await OnboardingSlide.findByIdAndDelete(id);
  if (!doc) {
    res.status(404).json({ message: "Not found" });
    return;
  }
  res.json({ ok: true });
}
