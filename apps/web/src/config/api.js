const trimTrailingSlash = (value) => value.replace(/\/+$/, "");

export const API_BASE = trimTrailingSlash(
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/v1" 
);

export const WS_BASE = trimTrailingSlash(
  import.meta.env.VITE_WS_BASE_URL || "ws://127.0.0.1:8000/api/v1" // 🚀 CHANGED TO LOCAL
);

export function chatWsUrl(userId, token) {
  return `${WS_BASE}/chats/ws/${userId}?token=${encodeURIComponent(token || "")}`;
}