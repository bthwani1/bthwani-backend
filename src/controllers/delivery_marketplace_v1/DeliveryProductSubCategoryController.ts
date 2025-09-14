import { Request, Response } from "express";
import DeliveryProductSubCategory from "../../models/delivery_marketplace_v1/DeliveryProductSubCategory";

// Create
export const create = async (req: Request, res: Response) => {
  try {
    const data = new DeliveryProductSubCategory(req.body);
    await data.save();
    res.status(201).json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
export const getByStore = async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const subs = await DeliveryProductSubCategory.find({ storeId: storeId });
    res.json(subs);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
// Read all
export const getAll = async (req: Request, res: Response) => {
  try {
    const data = await DeliveryProductSubCategory.find();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Read by ID
export const getById = async (req: Request, res: Response) => {
  try {
    const data = await DeliveryProductSubCategory.findById(req.params.id);
    if (!data) {
      res.status(404).json({ message: "Not found" });
      return;
    }
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Update
export const update = async (req: Request, res: Response) => {
  try {
    const data = await DeliveryProductSubCategory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Delete
export const remove = async (req: Request, res: Response) => {
  try {
    await DeliveryProductSubCategory.findByIdAndDelete(req.params.id);
    res.json({ message: "DeliveryProductSubCategory deleted" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
