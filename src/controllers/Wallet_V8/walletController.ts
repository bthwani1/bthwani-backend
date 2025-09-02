import { Request, Response } from "express";
import { User } from "../../models/user";

export const getWallet = async (req: Request, res: Response) => {
  try {
    if (!req.user?.uid) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const user = await User.findOne({ firebaseUID: req.user.uid });
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.status(200).json(user.wallet);
  } catch (err) {
    res.status(500).json({ message: "Error fetching wallet", error: err });
  }
};

export const getTransactions = async (req: Request, res: Response) => {
  try {
    if (!req.user?.uid) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    const user = await User.findOne({ firebaseUID: req.user.uid });
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.status(200).json(user.transactions);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching transactions", error: err });
  }
};
export const transferFunds = async (req: Request, res: Response) => {
  const { targetUID, amount, description } = req.body;

  if (!req.user?.uid) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const sender = await User.findOne({ firebaseUID: req.user.uid });
  const receiver = await User.findOne({ firebaseUID: targetUID });

  if (!sender || !receiver) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  if (!sender.wallet || !receiver.wallet) {
     res
      .status(500)
      .json({ message: "Wallet data is missing for one of the users." });
      return;
  }

  if (sender.wallet.balance < amount)
    {
res.status(400).json({ message: "Insufficient funds" });
      return;
    } 

  sender.wallet.balance -= amount;
  receiver.wallet.balance += amount;

  const now = new Date();
sender.transactions.push({
  amount,
  type: "debit",
  description,
  date: now,
  method: "wallet",       // أو القيمة الصحيحة حسب السياق
  status: "completed",    // أو "pending", "failed", إلخ حسب الحالة
})
 ;

receiver.transactions.push({
  amount,
  type: "credit",
  description,
  date: now,
  method: "wallet",
  status: "completed",
});

  await sender.save();
  await receiver.save();

  res.json({ message: "Transfer successful" });
};

export const getTransferHistory = async (req: Request, res: Response) => {
  if (!req.user?.uid) {
     res.status(401).json({ message: "Unauthorized" });
     return;
  }

  const user = await User.findOne({ firebaseUID: req.user.uid });
  if (!user) {
     res.status(404).json({ message: "User not found" });
     return;
  }

  res.json(user.transactions || []);
};
