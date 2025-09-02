import axios from 'axios';

export async function sendExpoPushNotification(
  expoPushToken: string,
  title: string,
  body: string,
  data?: any
) {
  await axios.post('https://exp.host/--/api/v2/push/send', {
    to: expoPushToken,
    sound: 'default',
    title,
    body,
    data,
  });
}
