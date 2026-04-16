const API_BASE = 'http://localhost:8000/api/v1';

export const api = {
  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    return response.json();
  },

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async get(endpoint) {
    return this.request(endpoint);
  },

  // Chat specific
  async createSession(order_id = null) {
    return this.post('/chats/sessions', { order_id });
  },

  async sendMessage(session_id, text) {
    return this.post('/chats/messages', { chat_session_id: session_id, text });
  },

  async getConversations() {
    return this.get('/chats/conversations');
  },

  async getMessages(session_id) {
    return this.get(`/chats/sessions/${session_id}/messages`);
  },
};
