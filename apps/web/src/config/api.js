const trimTrailingSlash = (value) => value.replace(/\/+$/, "");

const defaultApiBase = import.meta.env.PROD
  ? "https://api.estings.shop/api/v1"
  : "http://127.0.0.1:8000/api/v1";
const defaultWsBase = import.meta.env.PROD
  ? "wss://api.estings.shop/api/v1"
  : "ws://127.0.0.1:8000/api/v1";

export const API_BASE = trimTrailingSlash(
  import.meta.env.VITE_API_BASE_URL || defaultApiBase
);

export const WS_BASE = trimTrailingSlash(
  import.meta.env.VITE_WS_BASE_URL || defaultWsBase
);

export function chatWsUrl(userId, token) {
  return `${WS_BASE}/chats/ws/${userId}?token=${encodeURIComponent(token || "")}`;
}
