// server/src/controllers/asset.controller.ts
import { Request, Response } from "express";
import { Asset } from "../../models/er/asset.model";

export const getAllAssets = async (req: Request, res: Response) => {
  const list = await Asset.find();
  res.json(list);
};

export const getAssetById = async (req: Request, res: Response) => {
  const ast = await Asset.findById(req.params.id).populate(
    "assignedTo",
    "fullName"
  );
  res.json(ast);
};

export const createAsset = async (req: Request, res: Response) => {
  const ast = new Asset(req.body);
  await ast.save();
  res.status(201).json(ast);
};

export const updateAsset = async (req: Request, res: Response) => {
  const updated = await Asset.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  res.json(updated);
};

export const deleteAsset = async (req: Request, res: Response) => {
  await Asset.findByIdAndDelete(req.params.id);
  res.status(204).send();
};
