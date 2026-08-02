import axios from "axios";

const DATAFORSEO_BASE_URL = "https://api.dataforseo.com/v3";

const login = process.env.DATAFORSEO_LOGIN;
const password = process.env.DATAFORSEO_PASSWORD;

if (!login || !password) {
  throw new Error(
    "Missing DataForSEO credentials. Please set DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD in .env"
  );
}

const auth = Buffer.from(`${login}:${password}`).toString("base64");

export const dataForSeoClient = axios.create({
  baseURL: DATAFORSEO_BASE_URL,
  timeout: 60_000,
  headers: {
    Authorization: `Basic ${auth}`,
    "Content-Type": "application/json",
  },
});

export default dataForSeoClient;