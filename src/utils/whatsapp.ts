import axios from "axios";

// يمكنك استبدال هذه الإعدادات بمزود فعلي مثل Chat API أو Twilio WhatsApp
export const sendWhatsAppMessage = async (phone: string, message: string) => {
  try {
    const formattedPhone = phone.startsWith("+") ? phone : `+967${phone}`;
    
    await axios.post("https://your-whatsapp-api/send", {
      to: formattedPhone,
      message
    }, {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_API_KEY}`
      }
    });

    console.log("WhatsApp message sent");
  } catch (err) {
    console.error("Failed to send WhatsApp message", err);
  }
};
