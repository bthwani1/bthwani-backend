// services/sms.service.ts
import twilio from 'twilio';
import Message from '../models/Message';
import MessageMetric from '../models/MessageMetric';

interface SMSConfig {
  accountSid?: string;
  authToken?: string;
  fromNumber?: string;
}

class SMSService {
  private client: twilio.Twilio | null = null;
  private config: SMSConfig;

  constructor() {
    this.config = {
      accountSid: process.env.TWILIO_SID,
      authToken: process.env.TWILIO_TOKEN,
      fromNumber: process.env.TWILIO_FROM
    };

    if (this.config.accountSid && this.config.authToken) {
      this.client = twilio(this.config.accountSid, this.config.authToken);
    }
  }

  async sendSMS(to: string, message: string, messageId?: string): Promise<boolean> {
    try {
      if (!this.client || !this.config.fromNumber) {
        console.warn('Twilio credentials not configured');
        return false;
      }

      // تنظيف رقم الهاتف
      const cleanPhone = to.replace(/[^\d]/g, '');

      // إضافة رمز البلد إذا لم يكن موجودًا (افتراض السعودية)
      const phoneWithCountry = cleanPhone.startsWith('966')
        ? cleanPhone
        : `966${cleanPhone}`;

      const result = await this.client.messages.create({
        body: message,
        from: this.config.fromNumber,
        to: `+${phoneWithCountry}`
      });

      // تسجيل المقياس إذا نجح الإرسال
      if (messageId && result.sid) {
        await MessageMetric.create({
          messageId,
          userId: to,
          channel: 'sms',
          status: 'sent',
          timestamp: new Date(),
          metadata: {
            twilioMessageId: result.sid,
            provider: 'twilio'
          }
        });
      }

      return true;
    } catch (error: any) {
      console.error('SMS send error:', error);

      // تسجيل فشل الإرسال
      if (messageId) {
        await MessageMetric.create({
          messageId,
          userId: to,
          channel: 'sms',
          status: 'failed',
          timestamp: new Date(),
          metadata: {
            error: error.message,
            provider: 'twilio'
          }
        });
      }

      return false;
    }
  }

  async markAsDelivered(messageId: string, twilioMessageId: string): Promise<void> {
    await MessageMetric.updateOne(
      {
        'metadata.twilioMessageId': twilioMessageId,
        status: 'sent'
      },
      {
        $set: {
          status: 'delivered',
          timestamp: new Date()
        }
      }
    );
  }
}

export const smsService = new SMSService();
