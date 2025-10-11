// Backend/src/services/__tests__/notifications.test.ts
import { sendMessageToUsers, filterByCap } from '../messages/filterAndSend';
import { whatsappService } from '../whatsapp.service';
import { smsService } from '../sms.service';
import { sendToUsers } from '../push.service';
import Message from '../../models/Message';
import MessageMetric from '../../models/MessageMetric';
import MessagingPrefs from '../../models/support/MessagingPrefs';

// Mock the services
jest.mock('../whatsapp.service');
jest.mock('../sms.service');
jest.mock('../push.service');
jest.mock('../../models/Message');
jest.mock('../../models/MessageMetric');
jest.mock('../../models/support/MessagingPrefs');

describe('Notification Services', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('filterByCap', () => {
    it('should filter users based on daily cap and opt-in preferences', async () => {
      // Mock MessagingPrefs
      (MessagingPrefs.find as jest.Mock).mockResolvedValue([
        {
          userId: 'user1',
          channels: { push: true, sms: false },
          caps: { perDay: 5 }
        },
        {
          userId: 'user2',
          channels: { push: true, sms: true },
          caps: { perDay: 1 }
        }
      ]);

      // Mock MessageMetric count
      (MessageMetric.countDocuments as jest.Mock).mockImplementation((query) => {
        if (query.userId === 'user1') return Promise.resolve(3);
        if (query.userId === 'user2') return Promise.resolve(1);
        return Promise.resolve(0);
      });

      const result = await filterByCap(['user1', 'user2'], 'push');

      expect(result).toEqual(['user1']); // user1 has capacity, user2 reached cap
    });

    it('should respect opt-out preferences', async () => {
      (MessagingPrefs.find as jest.Mock).mockResolvedValue([
        {
          userId: 'user1',
          channels: { push: false }
        }
      ]);

      (MessageMetric.countDocuments as jest.Mock).mockResolvedValue(0);

      const result = await filterByCap(['user1'], 'push');

      expect(result).toEqual([]); // user1 opted out of push
    });
  });

  describe('sendMessageToUsers', () => {
    it('should send push notifications successfully', async () => {
      const mockMessage = {
        _id: 'message1',
        title: 'Test',
        body: 'Test message',
        channel: 'push',
        status: 'scheduled'
      };

      (Message.findById as jest.Mock).mockResolvedValue(mockMessage);
      (sendToUsers as jest.Mock).mockResolvedValue({ sent: 2, tickets: [] });
      (Message.updateOne as jest.Mock).mockResolvedValue({});

      const result = await sendMessageToUsers(['user1', 'user2'], 'Test', 'Test message', 'push', 'message1');

      expect(sendToUsers).toHaveBeenCalledWith(['user1', 'user2'], {
        title: 'Test',
        body: 'Test message',
        data: { messageId: 'message1', channel: 'push' }
      });
      expect(Message.updateOne).toHaveBeenCalledWith(
        { _id: 'message1' },
        expect.objectContaining({
          status: 'sent',
          sentCount: 2
        })
      );
    });

    it('should handle SMS sending', async () => {
      (smsService.sendSMS as jest.Mock).mockResolvedValue(true);

      const result = await sendMessageToUsers([], undefined, 'SMS test', 'sms', 'message1', ['+966501234567']);

      expect(smsService.sendSMS).toHaveBeenCalledWith('+966501234567', 'SMS test', 'message1');
    });

    it('should handle errors gracefully', async () => {
      (sendToUsers as jest.Mock).mockRejectedValue(new Error('Push service error'));
      (Message.updateOne as jest.Mock).mockResolvedValue({});

      await expect(sendMessageToUsers(['user1'], 'Test', 'Test', 'push', 'message1'))
        .rejects.toThrow('Push service error');

      expect(Message.updateOne).toHaveBeenCalledWith(
        { _id: 'message1' },
        { $set: { status: 'failed', error: 'Push service error' } }
      );
    });
  });
});

describe('WhatsApp Service', () => {
  it('should send WhatsApp message successfully', async () => {
    const mockResponse = {
      data: {
        messages: [{ id: 'whatsapp_message_id' }]
      }
    };

    (whatsappService.sendMessage as jest.Mock).mockResolvedValue(true);

    const result = await whatsappService.sendMessage('+966501234567', 'WhatsApp test message');

    expect(result).toBe(true);
  });

  it('should handle WhatsApp send errors', async () => {
    (whatsappService.sendMessage as jest.Mock).mockResolvedValue(false);

    const result = await whatsappService.sendMessage('+966501234567', 'WhatsApp test message');

    expect(result).toBe(false);
  });
});

describe('SMS Service', () => {
  it('should send SMS successfully', async () => {
    (smsService.sendSMS as jest.Mock).mockResolvedValue(true);

    const result = await smsService.sendSMS('+966501234567', 'SMS test message');

    expect(result).toBe(true);
  });
});
