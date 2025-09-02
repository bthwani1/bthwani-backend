// utils/scheduler.ts
import { scheduleJob } from "node-schedule";
import { sendPushNotification } from "./push";

export const scheduleBookingReminder = (booking: any) => {
  const notifyDate = new Date(booking.date);
  notifyDate.setHours(notifyDate.getHours() - 1);

  scheduleJob(notifyDate, () => {
    sendPushNotification(booking.userId, `📅 تذكير: لديك حجز خلال ساعة`);
  });
};
