// services/whatsapp.service.ts
import axios from 'axios';
import Message from '../models/Message';
import MessageMetric from '../models/MessageMetric';

interface WhatsAppConfig {
  apiKey?: string;
  phoneNumberId?: string;
  accessToken?: string;
  baseUrl?: string;
}

class WhatsAppService {
  private config: WhatsAppConfig;

  constructor() {
    this.config = {
      apiKey: process.env.WHATSAPP_API_KEY,
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
      baseUrl: 'https://graph.facebook.com/v18.0'
    };
  }

  async sendMessage(to: string, message: string, messageId?: string): Promise<boolean> {
    try {
      if (!this.config.phoneNumberId || !this.config.accessToken) {
        console.warn('WhatsApp credentials not configured');
        return false;
      }

      // تنظيف رقم الهاتف (إزالة + وأي رموز غير رقمية)
      const cleanPhone = to.replace(/[^\d]/g, '');

      // إضافة رمز البلد إذا لم يكن موجودًا (افتراض السعودية)
      const phoneWithCountry = cleanPhone.startsWith('966')
        ? cleanPhone
        : `966${cleanPhone}`;

      const payload = {
        messaging_product: 'whatsapp',
        to: phoneWithCountry,
        type: 'text',
        text: {
          body: message
        }
      };

      const response = await axios.post(
        `${this.config.baseUrl}/${this.config.phoneNumberId}/messages`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // تسجيل المقياس إذا نجح الإرسال
      if (messageId && response.data?.messages?.[0]?.id) {
        await MessageMetric.create({
          messageId,
          userId: to, // استخدام رقم الهاتف كـ userId مؤقتًا
          channel: 'sms', // نستخدم نفس القناة للـ WhatsApp
          status: 'sent',
          timestamp: new Date(),
          metadata: {
            whatsappMessageId: response.data.messages[0].id,
            provider: 'whatsapp'
          }
        });
      }

      return true;
    } catch (error: any) {
      console.error('WhatsApp send error:', error.response?.data || error.message);

      // تسجيل فشل الإرسال
      if (messageId) {
        await MessageMetric.create({
          messageId,
          userId: to,
          channel: 'sms',
          status: 'failed',
          timestamp: new Date(),
          metadata: {
            error: error.response?.data || error.message,
            provider: 'whatsapp'
          }
        });
      }

      return false;
    }
  }

  async markAsDelivered(messageId: string, whatsappMessageId: string): Promise<void> {
    await MessageMetric.updateOne(
      {
        'metadata.whatsappMessageId': whatsappMessageId,
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

  async markAsRead(messageId: string, whatsappMessageId: string): Promise<void> {
    await MessageMetric.updateOne(
      {
        'metadata.whatsappMessageId': whatsappMessageId,
        status: { $in: ['sent', 'delivered'] }
      },
      {
        $set: {
          status: 'opened',
          timestamp: new Date()
        }
      }
    );
  }
}

export const whatsappService = new WhatsAppService();
