import { Request, Response } from "express";
import mongoose from "mongoose";
import { User } from "../../models/user";
import { WalletTransaction } from "../../models/Wallet_V8/wallet.model";

// GET /admin/wallet/users
export async function listWalletUsers(_req: Request, res: Response) {
  const users = await User.find({})
    .select(
      "_id fullName email phone wallet.balance wallet.onHold wallet.loyaltyPoints"
    )
    .limit(500)
    .lean();
  const map = users.map((u) => {
    const balance = u.wallet?.balance ?? 0;
    const onHold = u.wallet?.onHold ?? 0;
    return {
      _id: u._id.toString(),
      fullName: u.fullName || "",
      email: u.email || "",
      phone: u.phone || "",
      wallet: {
        balance,
        onHold,
        available: Math.max(0, balance - onHold),
        loyaltyPoints: u.wallet?.loyaltyPoints ?? 0,
        transactions: [], // الواجهة لا تحتاجها هنا
      },
    };
  });
  res.json(map);
}

// GET /admin/wallet/stats
export async function walletStats(_req: Request, res: Response) {
  const users = await User.aggregate([
    { $project: { balance: "$wallet.balance", onHold: "$wallet.onHold" } },
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        totalBalance: { $sum: { $ifNull: ["$balance", 0] } },
        totalOnHold: { $sum: { $ifNull: ["$onHold", 0] } },
        averageBalance: { $avg: { $ifNull: ["$balance", 0] } },
      },
    },
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const txToday = await WalletTransaction.countDocuments({
    createdAt: { $gte: today },
  });

  const s = users[0] || {
    totalUsers: 0,
    totalBalance: 0,
    totalOnHold: 0,
    averageBalance: 0,
  };
  res.json({
    totalUsers: s.totalUsers,
    totalBalance: s.totalBalance,
    totalOnHold: s.totalOnHold,
    totalTransactions: await WalletTransaction.estimatedDocumentCount(),
    transactionsToday: txToday,
    averageBalance: s.averageBalance,
  });
}

// GET /admin/wallet/:userId
export async function getWalletByUserId(req: Request, res: Response) {
  const { userId } = req.params;
  if (!mongoose.isValidObjectId(userId)) {
    res.status(400).json({ message: "invalid userId" });
    return;
  }
  const user = await User.findById(userId).select("wallet").lean();
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  const balance = user.wallet?.balance ?? 0;
  const onHold = user.wallet?.onHold ?? 0;
  res.json({
    balance,
    onHold,
    available: Math.max(0, balance - onHold),
    loyaltyPoints: user.wallet?.loyaltyPoints ?? 0,
    transactions: user.wallet?.transactions ?? [],
  });
}

// PATCH /admin/wallet/:userId/balance
export async function patchWalletBalance(req: Request, res: Response) {
  const { userId } = req.params;
  const { amount, type, description } = req.body as {
    amount: number;
    type: "credit" | "debit";
    description?: string;
  };
  if (
    !mongoose.isValidObjectId(userId) ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    !["credit", "debit"].includes(type)
  ) {
    res.status(400).json({ message: "userId + amount>0 + type required" });
    return;
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const user: any = await User.findById(userId).session(session);
    if (!user) throw new Error("User not found");

    const available = (user.wallet?.balance || 0) - (user.wallet?.onHold || 0);
    if (type === "debit" && available < amount) {
      res.status(400).json({ message: "الرصيد المتاح أقل من المطلوب" });
      await session.abortTransaction();
      return;
    }

    user.wallet = user.wallet || {};
    user.wallet.balance =
      (user.wallet.balance || 0) + (type === "credit" ? amount : -amount);
    user.wallet.transactions = user.wallet.transactions || [];
    user.wallet.transactions.push({
      type: type,
      method: "admin",
      amount,
      description:
        description || (type === "credit" ? "إيداع إداري" : "خصم إداري"),
      date: new Date(),
      balanceAfter: user.wallet.balance,
    });

    await user.save({ session, validateModifiedOnly: true });

    // سجل مركزي موحد
    await WalletTransaction.create(
      [
        {
          userId: user._id,
          userModel: "User",
          amount,
          type,
          method: "admin",
          status: "completed",
          description:
            description || (type === "credit" ? "Admin credit" : "Admin debit"),
        },
      ],
      { session }
    );

    await session.commitTransaction();
    const bal = user.wallet.balance,
      onHold = user.wallet.onHold || 0;
    res.json({
      balance: bal,
      onHold,
      available: Math.max(0, bal - onHold),
      loyaltyPoints: user.wallet.loyaltyPoints || 0,
      transactions: user.wallet.transactions.slice(-50),
    });
  } catch (e: any) {
    await session.abortTransaction();
    res.status(500).json({ message: e.message });
  } finally {
    session.endSession();
  }
}

// GET /admin/wallet/transactions
import { parseListQuery } from "../../utils/query";

export async function listTransactions(req: Request, res: Response) {
  const { page, perPage } = parseListQuery(req.query);
  const {
    userId,
    type,
    status,
    method,
    from,
    to,
  } = req.query as any;
  const q: any = {};
  if (userId && mongoose.isValidObjectId(userId))
    q.userId = new mongoose.Types.ObjectId(userId);
  if (type) q.type = type;
  if (status) q.status = status;
  if (method) q.method = method;
  if (from || to) {
    q.createdAt = {};
    if (from) q.createdAt.$gte = new Date(from);
    if (to) q.createdAt.$lte = new Date(to);
  }
  const skip = (Number(page) - 1) * Number(perPage);
  const [items, total] = await Promise.all([
    WalletTransaction.find(q)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(perPage))
      .lean(),
    WalletTransaction.countDocuments(q),
  ]);
  res.json({
    transactions: items,
    total,
    page: Number(page),
    pageSize: Number(perPage),
  });
}
