const trimTrailingSlash = (value) => value.replace(/\/+$/, "");

export const API_BASE = trimTrailingSlash(
  import.meta.env.VITE_API_BASE_URL || "https://api.estings.shop/api/v1"
);

export const WS_BASE = trimTrailingSlash(
  import.meta.env.VITE_WS_BASE_URL || "wss://api.estings.shop/api/v1"
);

export function chatWsUrl(userId, token) {
  return `${WS_BASE}/chats/ws/${userId}?token=${encodeURIComponent(token || "")}`;
}