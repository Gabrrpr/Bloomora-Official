import { API_BASE } from "../config/api";

function formatApiErrorPayload(payload, fallback) {
  const detail = payload?.detail ?? payload?.message ?? payload?.error;

  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const message = detail
      .map((item) => {
        if (typeof item === "string") return item;
        const location = Array.isArray(item?.loc) ? item.loc.join(".") : "";
        const text = item?.msg || item?.message;
        return [location, text].filter(Boolean).join(": ");
      })
      .filter(Boolean)
      .join(" ");
    return message || fallback;
  }
  if (detail && typeof detail === "object") {
    return detail.msg || detail.message || JSON.stringify(detail);
  }
  if (payload && typeof payload === "object") return JSON.stringify(payload);
  return fallback;
}

export const api = {
  // ── Core Request Engine ───────────────────────────────────────────────────
  async request(endpoint, options = {}) {
    if (!navigator.onLine) {
      throw new Error("No internet connection. Please check your network and try again.");
    }

    const token = localStorage.getItem('access_token');
    const url = `${API_BASE}${endpoint}`;

    const headers = {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    if (options.body instanceof FormData) {
      delete headers['Content-Type'];
      delete headers['content-type']; 
    } else if (options.body && !headers['Content-Type'] && !headers['content-type']) {
      headers['Content-Type'] = 'application/json';
    }

    const config = { ...options, headers };

    let response;
    try {
      response = await fetch(url, config);
    } catch (error) {
      throw new Error("Unable to connect to the server.");
    }

    // 🚀 NEW: Token Auto-Refresh Interceptor
    if (response.status === 401) {
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (refreshToken) {
        try {
          // 1. Pause the error and ask backend for a new access token
          const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken })
          });

          if (refreshRes.ok) {
            const data = await refreshRes.json();
            
            // 2. Save the shiny new tokens
            localStorage.setItem('access_token', data.access_token);
            if (data.refresh_token) {
              localStorage.setItem('refresh_token', data.refresh_token);
            }
            
            // 3. Update the authorization header and RETRY the original request!
            config.headers['Authorization'] = `Bearer ${data.access_token}`;
            response = await fetch(url, config);
            
          } else {
            // Refresh token is also dead (expired or banned)
            throw new Error("Session expired"); 
          }
        } catch (refreshErr) {
          // Nuke the session and redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          window.dispatchEvent(new CustomEvent("bloomora:logout"));
          window.location.href = '/login?error=session_expired';
          throw new Error("Your session has expired. Please log in again.");
        }
      }
    }

    // Standard error handling if the request still failed (or wasn't a 401)
    if (!response.ok) {
      let errorMsg = `API Error: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMsg = formatApiErrorPayload(errorData, errorMsg);
      } catch (e) {}
      throw new Error(errorMsg);
    }

    return response.json();
  },

  // ── Helper Methods ────────────────────────────────────────────────────────
  async post(endpoint, data, customOptions = {}) {
    const isFormData = data instanceof FormData;
    return api.request(endpoint, {
      method: 'POST',
      body: isFormData ? data : JSON.stringify(data),
      ...customOptions
    });
  },

  async get(endpoint) {
    return api.request(endpoint);
  },

  async put(endpoint, data, customOptions = {}) {
    const isFormData = data instanceof FormData;
    return api.request(endpoint, {
      method: 'PUT',
      body: isFormData ? data : JSON.stringify(data),
      ...customOptions
    });
  },

  async patch(endpoint, data, customOptions = {}) {
    const isFormData = data instanceof FormData;
    return api.request(endpoint, {
      method: 'PATCH',
      body: isFormData ? data : JSON.stringify(data),
      ...customOptions
    });
  },

  async delete(endpoint) {
    return api.request(endpoint, { method: 'DELETE' });
  },

  // ── Auth ──────────────────────────────────────────────────────────────────
  async exchangeOAuthCode(code) {
    return api.get(`/auth/oauth/exchange?code=${code}`);
  },

  async activateStaff(token, password) {
    return api.post('/users/staff/activate', { token, password });
  },

  // ── Chat ──────────────────────────────────────────────────────────────────
  async createSession() {
    return api.post('/chats/sessions');
  },

  async deleteChatMessage(messageId) {
    return await api.request(`/chats/messages/${messageId}`, { 
      method: 'DELETE' 
    });
  },
  
  async sendMessage(user_id, text, image_url = null, context_id = null) {
    return api.post('/chats/messages', { user_id, text, image_url, context_id });
  },

  async uploadChatImage(file) {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/chats/upload', formData); 
  },

  async getChatHistory(user_id) {
    return api.get(`/chats/history/${user_id}`);
  },

  async getConversations() {
    return api.get('/chats/conversations');
  },

  async markRead(user_id) {
    return api.request(`/chats/history/${user_id}/read`, { method: 'PATCH' });
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
    return api.get(`/users/?${params.toString()}`);
  },

  async createStaff(data) {
    return api.post('/users/', data);
  },

  async updateUser(userId, data) {
    return api.patch(`/users/${userId}`, data);
  },

  async updateProfile(data) {
    return api.patch('/users/me', data);
  },

  async uploadProfilePicture(formData) {
    return api.post('/users/profile/upload-picture', formData);
  },

  async removeProfilePicture() {
    return api.delete('/users/profile/picture');
  },

  // ── Products (Admin) ──────────────────────────────────────────────────────
  async getAdminProducts() {
    return api.get('/products/admin/all');
  },

  async createProduct(formData) {
    return api.post('/products/admin', formData);
  },

  async updateProduct(productId, formData) {
    return api.put(`/products/admin/${productId}`, formData); 
  },

  async deleteProduct(productId) {
    return api.delete(`/products/admin/${productId}`);
  },

  // ── Orders ────────────────────────────────────────────────────────────────
  async createOrder(data) {
    return api.post('/orders/', data);
  },

  async confirmPayment(orderId) {
    return api.post(`/orders/${orderId}/pay`, {});
  },

  async updateAdminOrderStatus(orderId, status) {
  return api.patch(`/orders/admin/${orderId}/force-status`, { status });
  },

  async getMyOrders(status) {
    const params = new URLSearchParams();
    if (status && status !== 'All' && status !== 'today') params.append('status', status.toLowerCase().replace(/ /g, '_'));
    return api.get(`/orders/my?${params.toString()}`);
  },

  async getAdminOrders({ status, search, branch, limit = 100, offset = 0 } = {}) {
    const params = new URLSearchParams();
    if (status && status !== 'All') params.append('status', status.toLowerCase().replace(/ /g, '_'));
    if (search) params.append('search', search);
    if (branch && branch !== 'All Branches') params.append('branch', branch.toLowerCase());
    params.append('limit', String(limit));
    params.append('offset', String(offset));
    return api.get(`/orders/?${params.toString()}`);
  },

  // ── Products (Public) ───────────────────────────────────────────────────
  async getProducts() {
    return api.get('/products/');
  },

  async getCustomizationProducts() {
    return api.get('/products/customization/all');
  },

  getSimilarProducts: async (productId) => {
    return await api.get(`/products/${productId}/similar`);
  },


  // ── Campaigns ───────────────────────────────────────────────────────────
  async getActiveCampaigns() {
    return api.get('/campaigns/active');
  },

  async getCampaigns({ only_active = false } = {}) {
    const params = new URLSearchParams();
    params.append('only_active', String(!!only_active));
    return api.get(`/campaigns/?${params.toString()}`);
  },

  async createCampaign(data) {
    return api.post('/campaigns/', data);
  },

  async updateCampaign(campaignId, data) {
    return api.put(`/campaigns/${campaignId}`, data);
  },

  async deleteCampaign(campaignId) {
    return api.delete(`/campaigns/${campaignId}`);
  },

  async setCampaignProducts(campaignId, product_ids, discount = {}) {
    return api.post(`/campaigns/${campaignId}/products`, { product_ids, ...discount });
  },

  async getCategoryHierarchy() {
    return api.get('/products/categories/hierarchy');
  },
  
  // ── Vases ────────────────────────────────────────────────────────────────
  async getVases(category = null, minPrice = null, maxPrice = null) {
    const params = new URLSearchParams();
    if (category && category !== 'All') params.append('category', category);
    if (minPrice !== null) params.append('min_price', String(minPrice));
    if (maxPrice !== null) params.append('max_price', String(maxPrice));
    const query = params.toString() ? `?${params.toString()}` : '';
    return api.get(`/vases/${query}`);
  },

  async getVaseCategories() {
    return api.get('/vases/categories/all');
  },

  // ── Customization ───────────────────────────────────────────────────────
  async getAiUsage() {
    return api.get('/customization/ai-usage');
  },

  async checkAndGenerate(data) {
    return api.post('/customization/check-and-generate', data);
  },

  generateCardMessage: async (cardState) => {
    // This points to the new Python route we just made!
    const response = await api.post("/customization/generate-card", cardState);
    return response.data;
  },

  // ── Addresses ───────────────────────────────────────────────────────────
  async getAddresses() {
    return api.get('/addresses/');
  },

  async createAddress(data) {
    return api.post('/addresses/', data);
  },

  async updateAddress(addressId, data) {
    return api.patch(`/addresses/${addressId}`, data);
  },

  async deleteAddress(addressId) {
    return api.delete(`/addresses/${addressId}`);
  },

  async setDefaultAddress(addressId) {
    return api.patch(`/addresses/${addressId}/set-default`, {});
  },

  async geocodeAddress(query) {
    return api.get(`/addresses/geocode?q=${encodeURIComponent(query)}`);
  },

  // ── Storage / Uploads ───────────────────────────────────────────────────
  async uploadImage(bucket, file) {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/upload/${bucket}`, formData);
  },

  // ── Site Customization ──────────────────────────────────────────────────
  async getHeroSlides() {
    return api.get('/site-customization/hero');
  },

  async updateHeroSlides(data) {
    return api.request('/site-customization/hero', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async getNavPromos() {
    return api.get('/site-customization/promos');
  },

  async updateNavPromos(data) {
    return api.request('/site-customization/promos', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async isCustomizationEnabled() {
    return api.get('/site-customization/customization/toggle');
  },

  async setCustomizationEnabled(enabled) {
    return api.request('/site-customization/customization/toggle', {
      method: 'PUT',
      body: JSON.stringify({ enabled }),
    });
  },

  async getCheckoutSettings() {
    return api.get('/commerce/checkout-settings');
  },

  async getLalamoveEnabled() {
    return api.get('/products/admin/settings/lalamove');
  },

  async updateDeliverySettings(data) {
    return api.put('/commerce/delivery-settings', data);
  },

  async getPromos() {
    return api.get('/commerce/promos');
  },

  async createPromo(data) {
    return api.post('/commerce/promos', data);
  },

  async updatePromo(id, data) {
    return api.put(`/commerce/promos/${id}`, data);
  },

  async deletePromo(id) {
    return api.delete(`/commerce/promos/${id}`);
  },

  async getAdvertisements() {
    return api.get('/commerce/advertisements');
  },

  async getActiveAdvertisement() {
    return api.get('/commerce/advertisements/active');
  },

  async createAdvertisement(data) {
    return api.post('/commerce/advertisements', data);
  },

  async updateAdvertisement(id, data) {
    return api.put(`/commerce/advertisements/${id}`, data);
  },

  async deleteAdvertisement(id) {
    return api.delete(`/commerce/advertisements/${id}`);
  },

  async getMobileFeedCampaigns() {
    return api.get('/mobile-feed/admin/campaigns');
  },

  async createMobileFeedCampaign(data) {
    return api.post('/mobile-feed/admin/campaigns', data);
  },

  async createMobileFeedPost(data) {
    return api.post('/mobile-feed/admin/posts', data);
  },

  async updateMobileFeedPost(id, data) {
    return api.put(`/mobile-feed/admin/posts/${id}`, data);
  },

  async updateMobileFeedCampaign(id, data) {
    return api.put(`/mobile-feed/admin/campaigns/${id}`, data);
  },

  async deleteMobileFeedCampaign(id) {
    return api.delete(`/mobile-feed/admin/campaigns/${id}`);
  },

  async setMobileFeedPlacement(campaignId, data) {
    return api.put(`/mobile-feed/admin/campaigns/${campaignId}/placement`, data);
  },

  async getMobileFeedProductControls(branch = 'all') {
    return api.get(`/mobile-feed/admin/product-controls?branch=${encodeURIComponent(branch)}`);
  },

  async setMobileFeedProductControl(productId, data) {
    return api.put(`/mobile-feed/admin/products/${productId}/control`, data);
  },

  async previewMobileFeed(tab, branch) {
    return api.get(`/mobile-feed/admin/preview?tab=${encodeURIComponent(tab)}&branch=${encodeURIComponent(branch)}`);
  },

  async getMobileFeedAnalytics(tab, branch) {
    return api.get(`/mobile-feed/admin/analytics?tab=${encodeURIComponent(tab)}&branch=${encodeURIComponent(branch)}`);
  },
  async deleteAccount(password, confirmName) {
    return api.request('/users/me', {
      method: 'DELETE',
      body: JSON.stringify({ password, confirm_name: confirmName }),
    });
  },

  async getWishlist() {
    return api.get('/users/me/wishlist'); 
  },

  async toggleWishlist(productId) {
    return api.post(`/users/me/wishlist/${productId}`, {});
  },

  async getNotifications() {
    return api.get('/notifications/');
  },

  async getUnreadNotificationCount() {
    return api.get('/notifications/unread-count');
  },

  async markNotificationRead(notificationId) {
    return api.patch(`/notifications/${encodeURIComponent(notificationId)}/read`, {});
  },

  async seedNotifications() {
    return api.request('/notifications/seed', { method: 'POST' });
  },

  async markAllNotificationsRead() {
    return api.request('/notifications/read-all', { method: 'PATCH' });
  },

  // ── Vehicles (Admin Delivery) ─────────────────────────────────────────────
  async getVehicles(branch = null, isActive = null) {
    const params = new URLSearchParams();
    if (branch && branch !== 'All') params.append('branch', branch.toLowerCase());
    if (isActive !== null) params.append('is_active', String(isActive));
    const q = params.toString();
    return api.get(`/deliveries/vehicles${q ? `?${q}` : ''}`);
  },

  async createVehicle(data) {
    return api.post(`/deliveries/vehicles`, data);
  },

  async updateVehicle(vehicleId, data) {
    return api.put(`/deliveries/vehicles/${vehicleId}`, data);
  },

  async deleteVehicle(vehicleId) {
    return api.delete(`/deliveries/vehicles/${vehicleId}`);
  },

  async assignVehicleRider(vehicleId, riderId) {
    return api.patch(`/deliveries/vehicles/${vehicleId}/assign-rider`, riderId ? { rider_id: riderId } : {});
  },
};


