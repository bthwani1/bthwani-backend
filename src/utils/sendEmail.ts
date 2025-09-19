// utils/sendEmail.ts
import nodemailer, { SendMailOptions } from "nodemailer";

const FROM_USER = process.env.SMTP_USER || "operation@bthwani.com"; // يفضل .env
const FROM_PASS = process.env.SMTP_PASS || "********";
const SMTP_HOST = process.env.SMTP_HOST || "smtp.hostinger.com";
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: { user: FROM_USER, pass: FROM_PASS },
  pool: true,
  maxConnections: 3,
  maxMessages: 100,
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 20000,
});

let verified = false;
async function ensureTransporterVerified() {
  if (verified) return;
  try {
    await transporter.verify();
    verified = true;
  } catch (e: any) {
    console.error("SMTP verify failed:", e?.code, e?.message);
    // لا ترمِ الخطأ هنا: اسمح بإعادة المحاولة داخل sendMailSafe
  }
}

async function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function sendMailSafe(opts: SendMailOptions) {
  await ensureTransporterVerified();

  let lastErr: any;
  for (let i = 0; i < 2; i++) {
    try {
      return await transporter.sendMail({
        from: `"بثواني — عدم الرد" <${FROM_USER}>`,
        replyTo: "support@bthwani.com",
        headers: {
          "Auto-Submitted": "auto-generated",
          "X-Auto-Response-Suppress": "All",
          Precedence: "bulk", // ← كانت بدون علامات اقتباس
        },
        ...opts,
      });
    } catch (e: any) {
      lastErr = e;
      // أعِد المحاولة فقط على أخطاء شائعة في الشبكة/التوثيق
      if (!["ETIMEDOUT", "EAUTH", "ESOCKET"].includes(e?.code)) break;
      await delay(800);
      // جرّب verify مرة أخرى قبل المحاولة الثانية
      verified = false;
      await ensureTransporterVerified();
    }
  }
  console.error("SMTP send error:", lastErr?.code, lastErr?.message);
  throw lastErr;
}

export async function sendResetEmail(email: string, code: string) {
  const html = `
    <div style="font-family: Arial, sans-serif; line-height:1.6; direction:rtl; text-align:right">
      <h2>إعادة تعيين كلمة المرور</h2>
      <p>رمزك هو:</p>
      <div style="font-size:22px;font-weight:bold;letter-spacing:3px;color:#D84315">${code}</div>
      <p>ينتهي خلال 5 دقائق.</p>
    </div>
  `;
  await sendMailSafe({
    to: email,
    subject: "رمز إعادة تعيين كلمة المرور",
    html,
    text: `رمزك: ${code}`,
  });
}

export async function sendOtpEmail(email: string, code: string) {
  const html = `
    <div style="font-family: Arial, sans-serif; line-height:1.6; direction:rtl; text-align:right">
      <h2>رمز التحقق من البريد</h2>
      <p>رمزك هو:</p>
      <div style="font-size:22px;font-weight:bold;letter-spacing:3px;color:#D84315">${code}</div>
      <p>ينتهي خلال 5 دقائق.</p>
    </div>
  `;
  await sendMailSafe({
    to: email,
    subject: "رمز التحقق - بثواني",
    html,
    text: `رمزك: ${code}`,
  });
}
