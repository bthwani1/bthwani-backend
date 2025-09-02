import { Request, Response } from "express";
import { SUBSCRIPTION_PLANS } from "../../utils/subscriptionPlans";
import { User } from "../../models/user";

export const createSubscription = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { planId } = req.body;

    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
    if (!plan) {
       res.status(400).json({ message: "الباقة غير صالحة" });
       return;
    }

    const user = await User.findOne({ firebaseUID: userId });
    if (!user) {
 res.status(404).json({ message: "المستخدم غير موجود" });
        return;
    }

    // التحقق من الرصيد
    if (user.wallet.balance < plan.price) {
       res.status(402).json({ message: "رصيد المحفظة غير كافٍ" });
       return;
    }

    // خصم الرصيد وتحديث الاشتراك
    user.wallet.balance -= plan.price;
    user.subscription = {
      planId: plan.id,
      startedAt: new Date(),
      nextBilling: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };
    await user.save();

    res.json({ message: "تم الاشتراك بنجاح", planId: plan.id });
  } catch (err) {
    res.status(500).json({ message: "فشل الاشتراك", error: err });
  }
};

export const getMySubscription = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const user = await User.findOne({ firebaseUID: userId });
    if (!user) {
res.status(404).json({ message: "المستخدم غير موجود" });
        return;
    } 

    res.json({ planId: user.subscription?.planId || null });
  } catch (err) {
    res.status(500).json({ message: "خطأ في جلب الاشتراك", error: err });
  }
};
