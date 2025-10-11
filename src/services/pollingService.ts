import { io } from "../index";
import DeliveryOrder from "../models/delivery_marketplace_v1/Order";

// Fallback polling service for clients when WebSocket is disconnected
export class PollingService {
  private static instance: PollingService;
  private pollInterval: NodeJS.Timeout | null = null;
  private isPolling = false;

  static getInstance(): PollingService {
    if (!PollingService.instance) {
      PollingService.instance = new PollingService();
    }
    return PollingService.instance;
  }

  startPolling(intervalMs: number = 30000): void {
    if (this.isPolling) return;

    this.isPolling = true;
    console.log(`🚀 Starting fallback polling every ${intervalMs}ms`);

    this.pollInterval = setInterval(async () => {
      try {
        await this.checkForUpdates();
      } catch (error) {
        console.error("Polling error:", error);
      }
    }, intervalMs);
  }

  stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isPolling = false;
    console.log("⏹️ Stopped fallback polling");
  }

  private async checkForUpdates(): Promise<void> {
    // This is a basic implementation
    // In a real app, you'd want to:
    // 1. Track last update timestamps per client
    // 2. Only send updates for orders that have changed since last poll
    // 3. Use a more efficient query mechanism

    const recentOrders = await DeliveryOrder.find({
      updatedAt: { $gte: new Date(Date.now() - 60000) } // Last minute
    })
      .select('_id status subOrders updatedAt')
      .limit(50);

    // Send updates to relevant rooms
    for (const order of recentOrders) {
      io.to(`order_${order._id}`).emit('order.status', {
        orderId: order._id.toString(),
        status: order.status,
        subOrders: order.subOrders,
        at: order.updatedAt.toISOString()
      });
    }
  }

  // Method to notify clients about polling status
  broadcastPollingStatus(isActive: boolean): void {
    io.emit('polling:status', {
      active: isActive,
      at: new Date().toISOString()
    });
  }
}

// Global polling service instance
export const pollingService = PollingService.getInstance();
