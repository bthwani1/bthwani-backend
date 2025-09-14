import mongoose from "mongoose";
import { User } from "../models/user";
import { WalletTransaction } from "../models/Wallet_V8/wallet.model";

const isInt = (x: any) => Number.isInteger(x) && x > 0;
const avail = (w: any) => (w?.balance || 0) - (w?.onHold || 0);

export async function holdForOrder(
  userId: string,
  orderId: string,
  amount: number,
  session: mongoose.ClientSession
) {
  if (!isInt(amount)) throw new Error("amount must be positive integer");

  const user = await User.findById(userId).session(session);
  if (!user) throw new Error("User not found");
  if (avail(user.wallet) < amount)
    throw new Error("Insufficient available balance");

  // idempotent: لا تُنشئ حجزًا مكررًا لنفس الطلب
  const dup = await WalletTransaction.findOne({
    userId,
    "meta.orderId": orderId,
    method: "escrow",
    status: "pending",
  }).session(session);
  if (dup) return dup;

  user.wallet.onHold = (user.wallet.onHold || 0) + amount;
  user.wallet.lastUpdated = new Date();
  await user.save({ session });

  const [tx] = await WalletTransaction.create(
    [
      {
        userId,
        userModel: "User",
        amount,
        type: "debit",
        method: "escrow",
        status: "pending",
        description: `Hold for order ${orderId}`,
        meta: { orderId },
      },
    ],
    { session }
  );

  return tx;
}

export async function captureOrder(
  userId: string,
  orderId: string,
  session: mongoose.ClientSession
) {
  const hold = await WalletTransaction.findOne({
    userId,
    "meta.orderId": orderId,
    method: "escrow",
    status: "pending",
  }).session(session);
  if (!hold) return; // لا شيء لنلتقطه

  const user = await User.findById(userId).session(session);
  if (!user) throw new Error("User not found");
  if ((user.wallet.onHold || 0) < hold.amount) throw new Error("Hold mismatch");
  if (user.wallet.balance < hold.amount)
    throw new Error("Balance < hold (inconsistent)");

  user.wallet.onHold -= hold.amount;
  user.wallet.balance -= hold.amount;
  user.wallet.totalSpent += hold.amount;
  user.wallet.lastUpdated = new Date();
  user.transactions.push({
    amount: hold.amount,
    type: "debit",
    method: "payment",
    status: "completed",
    description: `Capture for order ${orderId}`,
    date: new Date(),
  });
  await user.save({ session });

  hold.status = "completed";
  await hold.save({ session });

  await WalletTransaction.create(
    [
      {
        userId,
        userModel: "User",
        amount: hold.amount,
        type: "debit",
        method: "payment",
        status: "completed",
        description: `Order capture ${orderId}`,
        meta: { orderId },
      },
    ],
    { session }
  );
}

export async function releaseOrder(
  userId: string,
  orderId: string,
  session: mongoose.ClientSession
) {
  const hold = await WalletTransaction.findOne({
    userId,
    "meta.orderId": orderId,
    method: "escrow",
    status: "pending",
  }).session(session);
  if (!hold) return; // لا شيء لنحرره

  const user = await User.findById(userId).session(session);
  if (!user) throw new Error("User not found");
  if ((user.wallet.onHold || 0) < hold.amount) throw new Error("Hold mismatch");

  user.wallet.onHold -= hold.amount;
  user.wallet.lastUpdated = new Date();
  await user.save({ session });

  hold.status = "reversed";
  await hold.save({ session });

  await WalletTransaction.create(
    [
      {
        userId,
        userModel: "User",
        amount: hold.amount,
        type: "credit",
        method: "escrow",
        status: "completed",
        description: `Release hold for order ${orderId}`,
        meta: { orderId },
      },
    ],
    { session }
  );
}
