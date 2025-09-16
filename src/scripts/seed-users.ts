// scripts/seed-users.ts (TypeScript)
import "dotenv/config";
import mongoose from "mongoose";
import { admin } from "../config/firebaseAdmin";
import { User } from "../models/user"; // غيّر المسار إذا لزم

const MONGO_URI =
  "mongodb+srv://bthwani1_db_user:WTmCFUDVVGOTeMHc@cluster0.vip178l.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

type Role = "user" | "admin" | "superadmin";

type SeedArgs = {
  email: string;
  password: string;
  fullName: string;
  role?: Role; // افتراضي "user"
  language?: "ar" | "en";
  city?: string;
  lat?: number;
  lng?: number;
};

async function ensureFirebaseUser(
  email: string,
  password: string,
  displayName: string
) {
  let fbUser;
  try {
    fbUser = await admin.auth().getUserByEmail(email);
    // (اختياري) تحديث الباسورد أثناء المراجعة
    await admin
      .auth()
      .updateUser(fbUser.uid, { password, displayName, emailVerified: true });
  } catch {
    fbUser = await admin.auth().createUser({
      email,
      password,
      displayName,
      emailVerified: true,
      disabled: false,
    });
  }
  // Claims خفيفة—بدون admin
  await admin.auth().setCustomUserClaims(fbUser.uid, { role: "user" });
  return fbUser;
}

async function upsertNormalUser({
  email,
  password,
  fullName,
  role = "user",
  language = "en",
  city = "Sana'a",
  lat = 15.3694,
  lng = 44.191,
}: SeedArgs) {
  const fbUser = await ensureFirebaseUser(email, password, fullName);

  // حضّر عنوانًا افتراضيًا وتعيينه كـ defaultAddressId
  const addrId = new mongoose.Types.ObjectId();
  const addresses = [
    {
      _id: addrId,
      label: "Home",
      street: "Street 60",
      city,
      location: { lat, lng },
    },
  ];

  await User.updateOne(
    { firebaseUID: fbUser.uid },
    {
      $set: {
        fullName,
        email,
        phone: "",
        profileImage: "",
        emailVerified: true,
        classification: "regular",
        role: role, // 👈 يظل "user" للمراجعة
        addresses,
        defaultAddressId: addrId,
        isVerified: true,
        isBanned: false,
        isActive: true,
        authProvider: "firebase",
        firebaseUID: fbUser.uid,
        language,
        theme: "light",
        notifications: { email: true, sms: false, push: true },
        wallet: {
          balance: 0,
          onHold: 0,
          currency: "YER",
          totalSpent: 0,
          totalEarned: 0,
          loyaltyPoints: 0,
          savings: 0,
          lastUpdated: new Date(),
        },
        security: { pinCode: null, twoFactorEnabled: false },
      },
      $setOnInsert: {
        createdAt: new Date(),
        loginHistory: [
          { ip: "127.0.0.1", userAgent: "seed-script", at: new Date() },
        ],
        favorites: [],
        notificationsFeed: [],
        transactions: [],
        activityLog: [],
      },
    },
    { upsert: true }
  );

  console.log(`✅ Ready: ${email} / ${password} (role: ${role})`);
}

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected to MongoDB");

  // 1) حساب مراجعة Google كمستخدم عادي
  await upsertNormalUser({
    email: "testreview@bthwani.com",
    password: "Test@12345",
    fullName: "Google Reviewer",
    role: "user",
    language: "en",
  });

  // 2) مستخدم وهمي للاختبار
  await upsertNormalUser({
    email: "dummy.tester@bthwani.com",
    password: "Qa@12345",
    fullName: "Dummy Tester",
    role: "user",
    language: "ar",
  });

  // (اختياري) إذا أردت الاحتفاظ بإنشاء سوبرأدمِنك الحالي:
  // await upsertNormalUser({ email: 'admin@bthwani.com', password: 'admin1234', fullName: 'مدير النظام', role: 'superadmin' });

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(async (e) => {
  console.error("❌ Error:", e);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
