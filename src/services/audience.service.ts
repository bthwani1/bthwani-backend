// services/audience.service.ts
import PushToken from "../models/PushToken";
import { User } from "../models/user";
import Driver from "../models/Driver_app/driver";
import Vendor from "../models/vendor_app/Vendor";
import DeliveryStore from "../models/delivery_marketplace_v1/DeliveryStore";
import DeliveryOrder from "../models/delivery_marketplace_v1/Order";

type Audience = {
  apps?: ("user" | "driver" | "vendor")[];
  platforms?: ("android" | "ios" | "web")[];
  cities?: string[]; // للمستخدم: من addresses، للسائق: residenceLocation.city، للتاجر: city من المتجر
  minOrders?: number; // users فقط
  lastActiveDays?: number; // من PushToken.lastSeenAt
  optedInPromosOnly?: boolean; // users فقط
};

export async function buildAudience(a: Audience): Promise<string[]> {
  const apps = a.apps?.length ? a.apps : ["user"];
  const platformFilter = a.platforms?.length
    ? { platform: { $in: a.platforms } }
    : {};
  const lastSeen = a.lastActiveDays
    ? {
        lastSeenAt: {
          $gte: new Date(Date.now() - a.lastActiveDays * 24 * 60 * 60 * 1000),
        },
      }
    : {};

  const tokens: string[] = [];

  // USERS
  if (apps.includes("user")) {
    let userIds: string[] | null = null;

    if (a.cities?.length) {
      const users = await User.find({ "addresses.city": { $in: a.cities } })
        .select("_id")
        .lean();
      userIds = users.map((u) => u._id.toString());
    }

    if (a.minOrders && a.minOrders > 0) {
      const agg = await DeliveryOrder.aggregate([
        { $group: { _id: "$user", c: { $sum: 1 } } },
        { $match: { c: { $gte: a.minOrders } } },
      ]);
      const idsByOrders = new Set(agg.map((x) => x._id.toString()));
      userIds = (userIds || []).filter((id) => idsByOrders.has(id));
    }

    const q: any = { app: "user", ...platformFilter, ...lastSeen };
    if (userIds) q.userId = { $in: userIds };
    const userTokens = await PushToken.find(q).select("token").lean();
    tokens.push(...userTokens.map((t) => t.token));
  }

  // DRIVERS
  if (apps.includes("driver")) {
    let driverIds: string[] | null = null;

    if (a.cities?.length) {
      const ds = await Driver.find({
        "residenceLocation.city": { $in: a.cities },
      })
        .select("_id")
        .lean();
      driverIds = ds.map((d) => d._id.toString());
    }

    const q: any = { app: "driver", ...platformFilter, ...lastSeen };
    if (driverIds) q.userId = { $in: driverIds };
    const driverTokens = await PushToken.find(q).select("token").lean();
    tokens.push(...driverTokens.map((t) => t.token));
  }

  // VENDORS
  if (apps.includes("vendor")) {
    let vendorIds: string[] | null = null;

    if (a.cities?.length) {
      // اجلب المتاجر في المدن المطلوبة ثم جِب الـ vendors التابعين لها
      const stores = await DeliveryStore.find({
        "address.city": { $in: a.cities },
      })
        .select("_id")
        .lean();
      const sIds = stores.map((s) => s._id);
      const vs = await Vendor.find({ store: { $in: sIds } })
        .select("_id")
        .lean();
      vendorIds = vs.map((v) => v._id.toString());
    }

    const q: any = { app: "vendor", ...platformFilter, ...lastSeen };
    if (vendorIds) q.userId = { $in: vendorIds };
    const vendorTokens = await PushToken.find(q).select("token").lean();
    tokens.push(...vendorTokens.map((t) => t.token));

    // fallback: من حقل expoPushToken مباشرة (لو موجود ومش مكرر)
    if (!vendorIds && !a.platforms?.length) {
      const vs = await Vendor.find({ expoPushToken: { $ne: null } })
        .select("expoPushToken")
        .lean();
      tokens.push(
        ...(vs.map((v) => v.expoPushToken).filter(Boolean) as string[])
      );
    }
  }

  // فريد
  return Array.from(new Set(tokens));
}
