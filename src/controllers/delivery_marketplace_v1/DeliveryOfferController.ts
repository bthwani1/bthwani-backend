import { Request, Response } from "express";
import DeliveryOffer from "../../models/delivery_marketplace_v1/DeliveryOffer";

export const create = async (req: Request, res: Response) => {
  try {
    const offer = new DeliveryOffer(req.body);
    await offer.save();
    res.status(201).json(offer);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getAll = async (_: Request, res: Response) => {
  try {
    const offers = await DeliveryOffer.find().sort({ createdAt: -1 });
    res.json(offers);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const offer = await DeliveryOffer.findById(req.params.id);
    if (!offer) {
      res.status(404).json({ message: "Offer not found" });
      return;
    }
    res.json(offer);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const offer = await DeliveryOffer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(offer);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    await DeliveryOffer.findByIdAndDelete(req.params.id);
    res.json({ message: "Offer deleted" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
