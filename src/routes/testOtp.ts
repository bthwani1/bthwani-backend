// routes/testOtp.ts
import express from 'express';
import { sendEmailOTP } from '../services/mailer';
import { smsService } from '../services/sms.service';
import { whatsappService } from '../services/whatsapp.service';

const router = express.Router();

// اختبار إرسال OTP عبر البريد الإلكتروني
router.post('/email', async (req, res) => {
  try {
    const { email, userId } = req.body;

    if (!email) {
       res.status(400).json({ message: 'Email is required' });
       return;
    }

    // إنشاء كود OTP عشوائي
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    await sendEmailOTP(email, otpCode);

    res.json({
      success: true,
      message: 'OTP sent successfully',
      otp: otpCode, // للاختبار فقط، احذف في الإنتاج
      channel: 'email'
    });
  } catch (error) {
    console.error('Email OTP test error:', error);
    res.status(500).json({ message: 'Failed to send email OTP' });
  }
});

// اختبار إرسال OTP عبر SMS
router.post('/sms', async (req, res) => {
  try {
    const { phone, userId } = req.body;

    if (!phone) {
       res.status(400).json({ message: 'Phone number is required' });
       return;
    }

    // إنشاء كود OTP عشوائي
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const message = `رمز التحقق الخاص بك: ${otpCode}`;

    const success = await smsService.sendSMS(phone, message);

    res.json({
      success,
      message: success ? 'OTP sent successfully' : 'Failed to send SMS',
      otp: otpCode, // للاختبار فقط، احذف في الإنتاج
      channel: 'sms'
    });
  } catch (error) {
    console.error('SMS OTP test error:', error);
    res.status(500).json({ message: 'Failed to send SMS OTP' });
  }
});

// اختبار إرسال OTP عبر WhatsApp
router.post('/whatsapp', async (req, res) => {
  try {
    const { phone, userId } = req.body;

    if (!phone) {
         res.status(400).json({ message: 'Phone number is required' });
       return;
    }

    // إنشاء كود OTP عشوائي
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const message = `رمز التحقق الخاص بك: ${otpCode}`;

    const success = await whatsappService.sendMessage(phone, message);

    res.json({
      success,
      message: success ? 'OTP sent successfully' : 'Failed to send WhatsApp message',
      otp: otpCode, // للاختبار فقط، احذف في الإنتاج
      channel: 'whatsapp'
    });
  } catch (error) {
    console.error('WhatsApp OTP test error:', error);
    res.status(500).json({ message: 'Failed to send WhatsApp OTP' });
  }
});

export default router;
