const API_BASE = 'http://localhost:8000/api/v1';

export const api = {
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('access_token');
    const url = `${API_BASE}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
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

  // Chat specific - Updated for admin integration
  async createSession() {
    return this.post('/chats/sessions');
  },

  async sendMessage(user_id, text) {
    return this.post('/chats/messages', { user_id, text });
  },

  async getChatHistory(user_id) {
    return this.get(`/chats/history/${user_id}`);
  },

  async getConversations() {
    return this.get('/chats/conversations');
  },

  async markRead(user_id) {
    return this.request(`/chats/history/${user_id}/read`, { method: 'PATCH' });
  },
};

