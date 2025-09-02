import mongoose from "mongoose";
import { User } from "./models/user"; // عدّل المسار إذا لزم

const MONGO_URI = "mongodb+srv://m775071580:KPU8TxhRilLbgtyB@cluster0.hgb9fu2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

async function fixUsersWallet() {
  await mongoose.connect(MONGO_URI);
  const users = await User.find({
    $or: [
      { wallet: { $exists: false } },
      { "wallet.balance": { $exists: false } }
    ]
  });

  console.log(`Users found: ${users.length}`);
  for (const user of users) {
    // إذا لم توجد محفظة أبداً
    if (!user.wallet) user.wallet = {} as any;
    if (typeof user.wallet.balance !== "number") user.wallet.balance = 0;
    if (typeof user.wallet.currency !== "string") user.wallet.currency = "YER";
    if (typeof user.wallet.totalSpent !== "number") user.wallet.totalSpent = 0;
    if (typeof user.wallet.totalEarned !== "number") user.wallet.totalEarned = 0;
    if (typeof user.wallet.loyaltyPoints !== "number") user.wallet.loyaltyPoints = 0;
    if (typeof user.wallet.savings !== "number") user.wallet.savings = 0;
    if (!user.wallet.lastUpdated) user.wallet.lastUpdated = new Date();

    await user.save();
    console.log(`✅ Wallet fixed for user: ${user._id}`);
  }

  await mongoose.disconnect();
  console.log("All done!");
}

fixUsersWallet().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
