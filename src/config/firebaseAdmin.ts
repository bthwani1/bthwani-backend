// src/config/firebaseAdmin.ts
import * as admin from "firebase-admin";
import "dotenv/config";

console.log(
  "[firebaseAdmin] env FIREBASE_PROJECT_ID:",
  process.env.FIREBASE_PROJECT_ID ?? "<MISSING>"
);
console.log(
  "[firebaseAdmin] FIREBASE_CLIENT_EMAIL present?:",
  !!process.env.FIREBASE_CLIENT_EMAIL
);
console.log(
  "[firebaseAdmin] FIREBASE_PRIVATE_KEY present?:",
  !!process.env.FIREBASE_PRIVATE_KEY
);
if (process.env.FIREBASE_PRIVATE_KEY) {
  console.log(
    "[firebaseAdmin] privateKey startsWith BEGIN?:",
    process.env.FIREBASE_PRIVATE_KEY.indexOf("BEGIN") >= 0
  );
  console.log(
    "[firebaseAdmin] privateKey length:",
    process.env.FIREBASE_PRIVATE_KEY.length
  );
}

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
    console.log(
      "[firebaseAdmin] admin initialized. app.options keys:",
      Object.keys(admin.app().options || {})
    );
  } catch (err: any) {
    console.error(
      "[firebaseAdmin] initializeApp error:",
      err && err.message ? err.message : err
    );
  }
}

export { admin };
export const adminAuth = admin.auth();
