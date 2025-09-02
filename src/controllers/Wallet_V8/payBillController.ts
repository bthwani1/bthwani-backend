// controllers/payBillController.ts
import { Request, Response } from "express";
import { sendTopup } from "../../services/wetaService"; // نفس الدالة
import { TopupLog } from "../../models/Wallet_V8/TopupLog";

export const payBillHandler = async (req: Request, res: Response) => {
  const { product, recipient } = req.body;

  if (!product || !recipient) {
    res.status(400).json({ message: "Missing product or account" });
    return;
  }

  const externalId = `bill_${Date.now()}`;
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
        message: "Bill payment failed",
        error: err?.response?.data || err.message,
      });
  }
};
