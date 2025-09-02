import axios from "axios";

const KURAIMI_BASE_URL = "https://kuraimibank.com/api";
const API_KEY = process.env.KURAIMI_API_KEY || "";

export async function verifyCustomerWithKuraimi({ SCustID }: { SCustID: string }) {
  try {
    const response = await axios.post(`${KURAIMI_BASE_URL}/verify`, {
      SCustID
    }, {
      headers: { "Authorization": `Bearer ${API_KEY}` }
    });

    return response.data;
  } catch (err) {
    console.error("Verification failed", err);
    return { success: false, error: err.message };
  }
}

export async function sendPaymentToKuraimi({
  amount,
  SCustID,
  PINPASS
}: {
  amount: number;
  SCustID: string;
  PINPASS: string;
}) {
  try {
    const response = await axios.post(`${KURAIMI_BASE_URL}/payment`, {
      SCustID,
      amount,
      PINPASS
    }, {
      headers: { "Authorization": `Bearer ${API_KEY}` }
    });

    return { success: true, refNo: response.data.refNo, meta: response.data };
  } catch (err) {
    console.error("Payment failed", err);
    return { success: false, error: err.message };
  }
}

export async function reverseKuraimiTransaction(refNo: string) {
  try {
    const response = await axios.post(`${KURAIMI_BASE_URL}/reverse`, {
      refNo
    }, {
      headers: { "Authorization": `Bearer ${API_KEY}` }
    });

    return response.data;
  } catch (err) {
    console.error("Reversal failed", err);
    return { success: false, error: err.message };
  }
}
