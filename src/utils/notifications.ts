import fetch from "node-fetch";

export const sendPushNotification = async (token: string, title: string, body: string) => {
  try {
    const message = {
      to: token,
      sound: "default",
      title,
      body,
      data: {},
    };

    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });
  } catch (error) {
    console.error("❌ فشل في إرسال الإشعار:", error);
  }
};
