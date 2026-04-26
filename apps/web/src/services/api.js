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

  async patch(endpoint, data) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  },

  // ── Chat ──────────────────────────────────────────────────────────────────
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

  // ── Users (Admin) ─────────────────────────────────────────────────────────
  async getUsers({ role, branch, status, search, limit = 100, offset = 0 } = {}) {
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    if (branch) params.append('branch', branch);
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    params.append('limit', String(limit));
    params.append('offset', String(offset));
    return this.get(`/users/?${params.toString()}`);
  },

  async createStaff(data) {
    return this.post('/users/', data);
  },

  async updateUser(userId, data) {
    return this.patch(`/users/${userId}`, data);
  },

  // ── Products (Admin) ──────────────────────────────────────────────────────
  async getAdminProducts() {
    return this.get('/products/admin/all');
  },

  async createProduct(formData) {
    const token = localStorage.getItem('access_token');
    const url = `${API_BASE}/products/admin`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    return response.json();
  },

  async updateProduct(productId, formData) {
    const token = localStorage.getItem('access_token');
    const url = `${API_BASE}/products/admin/${productId}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    return response.json();
  },

  async deleteProduct(productId) {
    return this.delete(`/products/admin/${productId}`);
  },

  // ── Orders ────────────────────────────────────────────────────────────────
  async createOrder({ items, delivery_address, delivery_notes, scheduled_at }) {
    return this.post('/orders/', { items, delivery_address, delivery_notes, scheduled_at });
  },

  async getMyOrders(status) {
    const params = new URLSearchParams();
    if (status && status !== 'All') params.append('status', status.toLowerCase());
    return this.get(`/orders/my?${params.toString()}`);
  },

  async getAdminOrders({ status, search, branch, limit = 100, offset = 0 } = {}) {
    const params = new URLSearchParams();
    if (status && status !== 'All') params.append('status', status.toLowerCase().replace(/ /g, '_'));
    if (search) params.append('search', search);
    if (branch && branch !== 'All Branches') params.append('branch', branch.toLowerCase());
    params.append('limit', String(limit));
    params.append('offset', String(offset));
    return this.get(`/orders/?${params.toString()}`);
  },

  // ── Products (Public) ───────────────────────────────────────────────────
  async getProducts() {
    return this.get('/products/');
  },

  async getCustomizationProducts() {
    return this.get('/products/customization/all');
  },

  // ── Customization ───────────────────────────────────────────────────────
  async getAiUsage() {
    return this.get('/customization/ai-usage');
  },

  async checkAndGenerate(data) {
    return this.post('/customization/check-and-generate', data);
  },

  // ── Site Customization ──────────────────────────────────────────────────
  async getHeroSlides() {
    return this.get('/site-customization/hero');
  },

  async updateHeroSlides(data) {
    return this.request('/site-customization/hero', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

