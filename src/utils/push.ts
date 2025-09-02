import axios from "axios";

export const sendPushNotification = async (token: string, message: any) => {
  await axios.post("https://exp.host/--/api/v2/push/send", {
    to: token,
    sound: "default",
    title: message.title,
    body: message.body,
    data: message.data || {},
  });
};
