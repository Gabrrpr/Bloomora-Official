const API_BASE = 'http://localhost:8000/api/v1';

export const api = {
  // ── Core Request Engine ───────────────────────────────────────────────────
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('access_token');
    const url = `${API_BASE}${endpoint}`;
    
    // Setup base headers
    const headers = {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    // 🛡️ BULLETPROOF HEADER LOGIC:
    if (options.body instanceof FormData) {
      // If sending a file, we MUST let the browser generate the Content-Type with the boundary.
      // This deletes any manual 'multipart/form-data' headers to prevent the 400 error.
      delete headers['Content-Type'];
      delete headers['content-type']; 
    } else if (options.body && !headers['Content-Type'] && !headers['content-type']) {
      // If it's a normal request, default to JSON
      headers['Content-Type'] = 'application/json';
    }

    const config = {
      ...options,
      headers,
    };

    const response = await fetch(url, config);
    if (!response.ok) {
      let errorMsg = `API Error: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMsg = errorData.detail || JSON.stringify(errorData);
      } catch (e) {
        // Ignore parse errors
      }
      throw new Error(errorMsg);
    }
    return response.json();
  },

  async post(endpoint, data, customOptions = {}) {
    // Smart Body: Don't stringify if it's a file upload (FormData)
    const isFormData = data instanceof FormData;
    return this.request(endpoint, {
      method: 'POST',
      body: isFormData ? data : JSON.stringify(data),
      ...customOptions
    });
  },

  async get(endpoint) {
    return this.request(endpoint);
  },

  async put(endpoint, data, customOptions = {}) {
    // Added PUT method for your updateProduct route
    const isFormData = data instanceof FormData;
    return this.request(endpoint, {
      method: 'PUT',
      body: isFormData ? data : JSON.stringify(data),
      ...customOptions
    });
  },

  async patch(endpoint, data, customOptions = {}) {
    const isFormData = data instanceof FormData;
    return this.request(endpoint, {
      method: 'PATCH',
      body: isFormData ? data : JSON.stringify(data),
      ...customOptions
    });
  },

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  },

  // ── Chat ──────────────────────────────────────────────────────────────────
  async createSession() {
    return this.post('/chats/sessions');
  },

  async sendMessage(user_id, text, image_url = null) {
    return this.post('/chats/messages', { user_id, text, image_url });
  },

  async uploadChatImage(file) {
    const formData = new FormData();
    formData.append('file', file);
    return this.post('/chats/upload', formData); 
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

  async updateProfile(data) {
    return this.patch('/users/me', data);
  },

  // ── Products (Admin) ──────────────────────────────────────────────────────
  async getAdminProducts() {
    return this.get('/products/admin/all');
  },

  async createProduct(formData) {
    return this.post('/products/admin', formData);
  },

  async updateProduct(productId, formData) {
    return this.put(`/products/admin/${productId}`, formData); 
  },

  async deleteProduct(productId) {
    return this.delete(`/products/admin/${productId}`);
  },

  // ── Orders ────────────────────────────────────────────────────────────────
  async createOrder({ items, delivery_address, delivery_notes, scheduled_at, payment_method }) {
    return this.post('/orders/', { items, delivery_address, delivery_notes, scheduled_at, payment_method });
  },

  async confirmPayment(orderId) {
    return this.post(`/orders/${orderId}/pay`, {});
  },

  async getMyOrders(status) {
    const params = new URLSearchParams();
    if (status && status !== 'All' && status !== 'today') params.append('status', status.toLowerCase().replace(/ /g, '_'));
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

  // ── Vases ────────────────────────────────────────────────────────────────
  async getVases(category = null, minPrice = null, maxPrice = null) {
    const params = new URLSearchParams();
    if (category && category !== 'All') params.append('category', category);
    if (minPrice !== null) params.append('min_price', String(minPrice));
    if (maxPrice !== null) params.append('max_price', String(maxPrice));
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.get(`/vases/${query}`);
  },

  async getVaseCategories() {
    return this.get('/vases/categories/all');
  },

  // ── Customization ───────────────────────────────────────────────────────
  async getAiUsage() {
    return this.get('/customization/ai-usage');
  },

  async checkAndGenerate(data) {
    return this.post('/customization/check-and-generate', data);
  },

  // ── Addresses ───────────────────────────────────────────────────────────
  async getAddresses() {
    return this.get('/addresses/');
  },

  async createAddress(data) {
    return this.post('/addresses/', data);
  },

  async updateAddress(addressId, data) {
    return this.patch(`/addresses/${addressId}`, data);
  },

  async deleteAddress(addressId) {
    return this.delete(`/addresses/${addressId}`);
  },

  async setDefaultAddress(addressId) {
    return this.patch(`/addresses/${addressId}/set-default`, {});
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

  // ── Customization Toggle ─────────────────────────────────────────────────
  async isCustomizationEnabled() {
    return this.get('/site-customization/customization/toggle');
  },

  async setCustomizationEnabled(enabled) {
    return this.request('/site-customization/customization/toggle', {
      method: 'PUT',
      body: JSON.stringify({ enabled }),
    });
  },
};