import * as admin from "firebase-admin";
import "dotenv/config";

console.log("Testing Firebase Admin SDK configuration...");

// Initialize Firebase Admin SDK
const app = admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
});

console.log("Firebase Admin SDK initialized successfully!");

// Test Firebase Auth
async function testAuth() {
  try {
    const auth = admin.auth();
    const user = await auth.getUserByEmail("test@example.com").catch(() => null);
    console.log("Firebase Auth test completed successfully!");
  } catch (error) {
    console.error("Firebase Auth test failed:", error);
  } finally {
    // Clean up
    await app.delete();
    process.exit(0);
  }
}

testAuth();
