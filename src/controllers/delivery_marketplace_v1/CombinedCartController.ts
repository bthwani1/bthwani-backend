// controllers/cart/CombinedCartController.ts
import { Request, Response } from "express";
import DeliveryCart from "../../models/delivery_marketplace_v1/DeliveryCart";
import SheinCart, {
  SheinItem,
} from "../../models/delivery_marketplace_v1/SheinCart";
import { User } from "../../models/user";

export const getCombinedCart = async (req: Request, res: Response) => {
  const uid = req.user?.id;
  if (!uid) return res.status(401).json({ message: "Unauthorized" });
  const user = await User.findOne({ firebaseUID: uid });

  const [market, shein] = await Promise.all([
    DeliveryCart.findOne({ user: user!._id }),
    SheinCart.findOne({ user: user!._id }),
  ]);

  const marketTotal = (market?.items || []).reduce(
    (s, it: any) => s + (it.price || 0) * (it.quantity || 1),
    0
  );
  const sheinTotal = ((shein?.items as SheinItem[]) || []).reduce(
    (s, it) => s + (it.price ?? 0) * (it.quantity ?? 1),
    0
  );

  res.json({
    buckets: {
      marketplace: {
        items: market?.items || [],
        total: marketTotal,
        cartId: market?.cartId || null,
      },
      shein: { items: shein?.items || [], total: sheinTotal },
    },
    grandTotalUI: marketTotal + sheinTotal, // للعرض فقط
    canCheckoutTogether: false, // كل واحد Checkout مستقل
  });
};
