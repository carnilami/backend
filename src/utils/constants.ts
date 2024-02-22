export const FRONTEND_URL =
  process.env.NODE_ENV === "production"
    ? "https://carnilami.com"
    : "http://localhost:5173";

export const API_URL =
  process.env.NODE_ENV === "production"
    ? "https://api.carnilami.com"
    : "http://localhost:3000";
