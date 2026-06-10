import { ApiError, apiFetch, assertNetworkConnection, getApiBaseUrl, initializeApiBaseUrl } from '@/services/api-client';
import type { AuthSession } from '@/services/auth-session';
import { Platform } from 'react-native';

export type BackendChatMessage = {
  created_at: string;
  id: string;
  image_url?: string | null;
  is_read: number;
  message: string;
  sender: 'customer' | 'staff' | 'support' | string;
  user_id: string;
};

type ChatSessionResponse = {
  id: string;
};

export type ChatImageUpload = {
  name: string;
  type?: string;
  uri: string;
};

export async function createChatSession({ session }: { session: AuthSession }) {
  return apiFetch<ChatSessionResponse>('/chats/sessions', {
    method: 'POST',
    token: session.accessToken,
  });
}

export async function getChatHistory({
  session,
  userId,
}: {
  session: AuthSession;
  userId: string;
}) {
  return apiFetch<BackendChatMessage[]>(`/chats/history/${encodeURIComponent(userId)}`, {
    method: 'GET',
    token: session.accessToken,
  });
}

export async function sendChatMessage({
  imageUrl,
  session,
  text,
  userId,
}: {
  imageUrl?: string | null;
  session: AuthSession;
  text: string;
  userId: string;
}) {
  return apiFetch<BackendChatMessage>('/chats/messages', {
    body: JSON.stringify({
      image_url: imageUrl ?? null,
      text,
      user_id: userId,
    }),
    method: 'POST',
    token: session.accessToken,
  });
}

export async function deleteChatMessage({
  messageId,
  session,
}: {
  messageId: string;
  session: AuthSession;
}) {
  return apiFetch<{ deleted_id: string; status: string }>(`/chats/messages/${encodeURIComponent(messageId)}`, {
    method: 'DELETE',
    token: session.accessToken,
  });
}

export async function uploadChatImage({
  image,
  session,
}: {
  image: ChatImageUpload;
  session: AuthSession;
}) {
  await initializeApiBaseUrl();
  await assertNetworkConnection();

  const formData = new FormData();

  if (Platform.OS === 'web') {
    const imageResponse = await fetch(image.uri);
    const imageBlob = await imageResponse.blob();
    formData.append('file', imageBlob, image.name);
  } else {
    formData.append('file', {
      name: image.name,
      type: image.type ?? 'image/jpeg',
      uri: image.uri,
    } as unknown as Blob);
  }

  let response: Response;

  try {
    response = await fetch(`${getApiBaseUrl().replace(/\/$/, '')}/chats/upload`, {
      body: formData,
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      method: 'POST',
    });
  } catch (error) {
    await assertNetworkConnection();
    throw new ApiError(0, 'Unable to upload image (E-NETWORK-002). Please try again.');
  }

  if (!response.ok) {
    let message = `Image upload failed with status ${response.status}`;

    try {
      const body = await response.json();
      if (typeof body?.detail === 'string') {
        message = body.detail;
      }
    } catch {
      // Keep the status-based fallback.
    }

    throw new Error(message);
  }

  return response.json() as Promise<{ image_url: string }>;
}

export function getChatWebSocketUrl({ session, userId }: { session: AuthSession; userId: string }) {
  const baseUrl = getApiBaseUrl().replace(/\/$/, '');
  const wsBaseUrl = baseUrl.replace(/^https:/i, 'wss:').replace(/^http:/i, 'ws:');

  return `${wsBaseUrl}/chats/ws/${encodeURIComponent(userId)}?token=${encodeURIComponent(session.accessToken)}`;
}
