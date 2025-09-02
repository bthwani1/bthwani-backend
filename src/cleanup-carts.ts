// src/cleanup-carts.ts
import mongoose from "mongoose";
import DeliveryCart from "./models/delivry_Marketplace_V1/DeliveryCart";

(async () => {
  await mongoose.connect(
    "mongodb+srv://m775071580:KPU8TxhRilLbgtyB@cluster0.hgb9fu2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
  );

  // احذف كل السلات المعطوبة:
  const result = await DeliveryCart.deleteMany({
    $or: [
      { "items.productId": { $exists: false } },
      { "items.productType": { $exists: false } },
    ],
  });
  console.log("Deleted:", result.deletedCount, "carts");
  await mongoose.connection.close();
})();
