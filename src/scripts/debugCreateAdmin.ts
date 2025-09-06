import mongoose from "mongoose";
import * as admin from "firebase-admin";
import "dotenv/config";
import { User } from "../models/user";

console.log("Debugging createAdmin script...");

// Log environment variables for debugging
console.log("Environment variables:", {
  MONGO_URI: process.env.MONGO_URI ? "***" : "Not found",
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? "***" : "Not found",
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ? "***" : "Not found",
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? "***" : "Not found"
});

const email = "admin@bthwani.com";
const password = "admin1234";
const fullName = "مدير النظام";
const role: "admin" | "superadmin" = "superadmin";

const run = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI || "");
    console.log("✅ Connected to MongoDB");

    // Check if user already exists
    console.log("Checking for existing user...");
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("⚠️ User already exists in the database");
      return;
    }

    console.log("Initializing Firebase Admin...");
    const firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
    console.log("✅ Firebase Admin initialized");

    console.log("Creating Firebase user...");
    const fbUser = await firebaseApp.auth().createUser({ email, password });
    console.log("✅ Firebase user created:", fbUser.uid);

    console.log("Saving user to MongoDB...");
    const newUser = new User({
      fullName,
      email,
      firebaseUID: fbUser.uid,
      role,
    });

    await newUser.save();
    console.log(`✅ MongoDB user saved with role: ${role}`);
    
    console.log("✅ Admin user created successfully!");
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    console.log("Disconnecting from MongoDB...");
    await mongoose.disconnect();
    console.log("✅ Disconnected from MongoDB");
    process.exit();
  }
};

run();
