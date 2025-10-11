// Backend/src/services/__tests__/realtime.test.ts
import { pollingService } from '../pollingService';
import { io } from '../../index';

// Mock the io object
jest.mock('../../index', () => ({
  io: {
    to: jest.fn(() => ({
      emit: jest.fn()
    })),
    emit: jest.fn()
  }
}));

describe('Realtime Services', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PollingService', () => {
    it('should start polling with default interval', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      pollingService.startPolling();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Starting fallback polling')
      );

      consoleSpy.mockRestore();
    });

    it('should stop polling', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      pollingService.stopPolling();

      expect(consoleSpy).toHaveBeenCalledWith('⏹️ Stopped fallback polling');

      consoleSpy.mockRestore();
    });

    it('should broadcast polling status', () => {
      pollingService.broadcastPollingStatus(true);

      expect(io.emit).toHaveBeenCalledWith('polling:status', {
        active: true,
        at: expect.any(String)
      });
    });
  });
});

describe('Socket.IO Events', () => {
  it('should export broadcast functions', () => {
    const { broadcastOrder, emitToAdmin, emitToOrder } = require('../../sockets/orderEvents');

    expect(typeof broadcastOrder).toBe('function');
    expect(typeof emitToAdmin).toBe('function');
    expect(typeof emitToOrder).toBe('function');
  });
});
