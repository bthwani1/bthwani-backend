// services/wetaService.ts
import axios from 'axios';

const WETA_BASE_URL = 'https://yemenairtime.com/api';
const WETA_USER = process.env.WETA_USER!;
const WETA_PASS = process.env.WETA_PASS!;

let token: string | null = null;

export const getToken = async () => {
  if (token) return token;

  const res = await axios.post(`${WETA_BASE_URL}/token-auth/`, {
    username: WETA_USER,
    password: WETA_PASS,
  });
  token = res.data.token;
  return token;
};

export const sendTopup = async (
  product: string,
  recipient: string,
  externalId: string
) => {
  const jwt = await getToken();
  const res = await axios.post(
    `${WETA_BASE_URL}/orders/`,
    { product, recipient, external_id: externalId },
    { headers: { Authorization: `JWT ${jwt}` } }
  );
  return res.data;
};
