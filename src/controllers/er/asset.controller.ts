// server/src/controllers/er/asset.controller.ts
import { Request, Response } from "express";
import mongoose from "mongoose";
import { Asset } from "../../models/er/asset.model";

export const getAllAssets = async (_req: Request, res: Response) => {
  const list = await Asset.find();
  res.json(list);
};

export const getAssetById = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    +res.status(400).json({ message: "Invalid asset id" });
    return;
  }
  const ast = await Asset.findById(id).populate("assignedTo", "fullName");
  if (!ast) {
    res.status(404).json({ message: "Asset not found" });
    return;
  }
  res.json(ast);
};

export const createAsset = async (req: Request, res: Response) => {
  const ast = new Asset(req.body);
  await ast.save();
  res.status(201).json(ast);
};

export const updateAsset = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ message: "Invalid asset id" });
    return;
  }
  const updated = await Asset.findByIdAndUpdate(id, req.body, { new: true });
  if (!updated) {
    res.status(404).json({ message: "Asset not found" });
    return;
  }
  res.json(updated);
};

export const deleteAsset = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ message: "Invalid asset id" });
    return;
  }
  await Asset.findByIdAndDelete(id);
  res.status(204).send();
};

// --- إحصاءات الأصول لواجهة الكروت ---
export const getAssetStats = async (_req: Request, res: Response) => {
  // يفترض أن المخطط فيه: cost (Number), status (String), category (String), assignedTo (ObjectId|null)
  const [result] = await Asset.aggregate([
    {
      $facet: {
        summary: [
          {
            $group: {
              _id: null,
              totalCount: { $sum: 1 },
              totalCost: { $sum: { $ifNull: ["$cost", 0] } },
              assignedCount: {
                $sum: {
                  $cond: [{ $ne: ["$assignedTo", null] }, 1, 0],
                },
              },
            },
          },
        ],
        byStatus: [
          {
            $group: {
              _id: { $ifNull: ["$status", "unknown"] },
              count: { $sum: 1 },
            },
          },
          { $project: { _id: 0, status: "$_id", count: 1 } },
        ],
        byCategory: [
          {
            $group: {
              _id: { $ifNull: ["$category", "uncategorized"] },
              count: { $sum: 1 },
            },
          },
          { $project: { _id: 0, category: "$_id", count: 1 } },
        ],
      },
    },
    {
      $project: {
        totalCount: {
          $ifNull: [{ $arrayElemAt: ["$summary.totalCount", 0] }, 0],
        },
        totalCost: {
          $ifNull: [{ $arrayElemAt: ["$summary.totalCost", 0] }, 0],
        },
        assignedCount: {
          $ifNull: [{ $arrayElemAt: ["$summary.assignedCount", 0] }, 0],
        },
        unassignedCount: {
          $subtract: [
            { $ifNull: [{ $arrayElemAt: ["$summary.totalCount", 0] }, 0] },
            { $ifNull: [{ $arrayElemAt: ["$summary.assignedCount", 0] }, 0] },
          ],
        },
        byStatus: 1,
        byCategory: 1,
      },
    },
  ]);

  res.json(
    result || {
      totalCount: 0,
      totalCost: 0,
      assignedCount: 0,
      unassignedCount: 0,
      byStatus: [],
      byCategory: [],
    }
  );
};
