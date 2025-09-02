// controllers/topupController.ts
import { Request, Response } from "express";
import { sendTopup } from "../../services/wetaService";
import { TopupLog } from "../../models/Wallet_V8/TopupLog";

export const topupHandler = async (req: Request, res: Response) => {
  const { product, recipient } = req.body;

  if (!product || !recipient) {
    res.status(400).json({ message: "Missing product or recipient" });

    return;
  }

  const externalId = `topup_${Date.now()}`;
  try {
    const result = await sendTopup(product, recipient, externalId);
    await TopupLog.create({
      product,
      recipient,
      externalId,
      status: result.status,
      response: result,
      userId: req.user?.id,
    });
    res.status(200).json(result);
  } catch (err: any) {
    res
      .status(500)
      .json({
        message: "Topup failed",
        error: err?.response?.data || err.message,
      });
  }
};

// controllers/topupController.ts

export const getLogsHandler = async (req: Request, res: Response) => {
  const { type, userId } = req.query;
  const filter: any = {};

  if (type) filter.type = type;
  if (userId) filter.userId = userId;

  try {
    const logs = await TopupLog.find(filter).sort({ createdAt: -1 }).limit(100);
    res.status(200).json(logs);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch logs" });
  }
};
