// models/Favorite.ts
import { Schema, model, Types } from "mongoose";

export type FavoriteType = "product" | "restaurant";

const FavoriteSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    item: { type: Schema.Types.ObjectId, required: true, index: true },
    itemType: {
      type: String,
      enum: ["product", "restaurant"],
      required: true,
      index: true,
    },

    // سنابشوت للعرض السريع
    itemSnapshot: {
      title: String,
      image: String,
      price: Number,
      rating: Number,
      // 👇 جديد: ليس إلزاميًا — مفيد لمنتجات المفضلة لفتح صفحة المتجر
      storeId: { type: Schema.Types.ObjectId, ref: "DeliveryStore" },
      storeType: { type: String, enum: ["grocery", "restaurant"] },
    },
  },
  { timestamps: true }
);

export default model("Favorite", FavoriteSchema);
// فهرس مركّب يضمن سرعة جلب "مفضلات المستخدم" لنوع معيّن (مطاعم)
FavoriteSchema.index(
  { user: 1, itemType: 1, createdAt: -1 },
  { name: "by_user_type_recent" }
);

// فهرس للوصول السريع على مستوى عنصر معيّن ونوعه
// (مفيد لعدّ المفضلات أو لمعرفة هل هذا المتجر مفضّل بكثرة)
FavoriteSchema.index({ itemType: 1, item: 1 }, { name: "by_item_type" });

// لديك أصلاً unique، أضف له اسمًا لسهولة التشخيص:
FavoriteSchema.index(
  { user: 1, item: 1, itemType: 1 },
  { unique: true, name: "uniq_user_item_type" }
);

// (اختياري) عرض قائمة كل مفضلات المستخدم بسرعة
FavoriteSchema.index({ user: 1, createdAt: -1 }, { name: "by_user_recent" });

// (اختياري) لو تحتاج تفتح متجر المنتج بسرعة من snapshot
FavoriteSchema.index(
  { "itemSnapshot.storeId": 1 },
  { name: "by_snapshot_storeId", sparse: true }
);
