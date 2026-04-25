import axios from 'axios';
import { toast } from 'react-toastify';

// BASE URL — development mein proxy use hoga, production mein env variable
const BASE_URL = process.env.REACT_APP_API_URL
  ? `${process.env.REACT_APP_API_URL}/api`
  : '/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  err => Promise.reject(err)
);

api.interceptors.response.use(
  res => res,
  err => {
    const status  = err.response?.status;
    const message = err.response?.data?.message || err.message || 'Kuch galat ho gaya!';

    if (status === 401) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') window.location.href = '/login';
      return Promise.reject(err);
    }
    if (status === 403) return Promise.reject(err);
    if (status === 404) {
      console.warn(`404: ${err.config?.url}`);
      return Promise.reject(err);
    }
    if (!err.response) {
      // Server down — sirf console mein log karo, toast mat dikho baar baar
      console.error('Server connect error:', err.message);
      return Promise.reject(err);
    }
    if (status >= 500) {
      toast.error('Server error. Thodi der baad try karein.');
      return Promise.reject(err);
    }
    toast.error(message);
    return Promise.reject(err);
  }
);

export const authAPI = {
  register:       d => api.post('/auth/register', d),
  login:          d => api.post('/auth/login', d),
  demo:           () => api.post('/auth/demo'),
  verifyOTP:      d => api.post('/auth/verify-otp', d),
  resendOTP:      d => api.post('/auth/resend-otp', d),
  forgotPassword: d => api.post('/auth/forgot-password', d),
  resetPassword:  d => api.post('/auth/reset-password', d),
  me:             () => api.get('/auth/me'),
  updateProfile:  d => api.put('/auth/profile', d),
  changePassword: d => api.put('/auth/change-password', d),
};

export const postAPI = {
  getAll:      p  => api.get('/posts', { params: p }),
  getOne:      id => api.get(`/posts/${id}`),
  create:      d  => api.post('/posts', d),
  update: (id, d) => api.put(`/posts/${id}`, d),
  delete:      id => api.delete(`/posts/${id}`),
  getCalendar: p  => api.get('/posts/calendar', { params: p }),
};

export const aiAPI = {
  caption:  d => api.post('/ai/caption', d),
  hashtags: d => api.post('/ai/hashtags', d),
  ideas:    d => api.post('/ai/ideas', d),
  rewrite:  d => api.post('/ai/rewrite', d),
};

export const analyticsAPI = {
  dashboard: () => api.get('/analytics/dashboard'),
};

export const socialAPI = {
  getAccounts:     () => api.get('/social/accounts'),
  disconnect:      id => api.delete(`/social/accounts/${id}`),
  connectFacebook: () => api.get('/social/facebook/connect'),
  connectTwitter:  () => api.get('/social/twitter/connect'),
  connectLinkedIn: () => api.get('/social/linkedin/connect'),
};

export const adsAPI = {
  getCampaigns:    () => api.get('/ads/campaigns'),
  createCampaign:  d  => api.post('/ads/campaigns', d),
  publishCampaign: id => api.post(`/ads/campaigns/${id}/publish`),
  pauseCampaign:   id => api.post(`/ads/campaigns/${id}/pause`),
};

export const adminAPI = {
  getUsers:     () => api.get('/admin/users'),
  updatePlan:   (id, plan)     => api.put(`/admin/users/${id}/plan`, { plan }),
  updateStatus: (id, isActive) => api.put(`/admin/users/${id}/status`, { isActive }),
  deleteUser:   id             => api.delete(`/admin/users/${id}`),
};

export const paymentAPI = {
  // Used by both admin and superadmin (backend auto-scopes by role)
  listAll:  p => api.get('/payment/admin/payments', { params: p }),
  // Open invoice HTML in a new tab (token-aware)
  openInvoice: id => {
    const url = `${process.env.REACT_APP_API_URL || ''}/api/payment/invoice/${id}`;
    fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(r => r.text())
      .then(html => { const w = window.open('', '_blank'); w.document.write(html); w.document.close(); });
  },
};

export const auditAPI = {
  // SuperAdmin
  list:           p => api.get('/audit',           { params: p }),
  stats:          p => api.get('/audit/stats',     { params: p }),
  getSettings:    () => api.get('/audit/settings'),
  updateSettings: d => api.put('/audit/settings', d),
  clear:          d => api.delete('/audit/clear', { data: d || {} }),
  // Admin (company-scoped)
  companyList:    p => api.get('/audit/company',       { params: p }),
  companyStats:   p => api.get('/audit/company/stats', { params: p }),
};

export const superAdminAPI = {
  updateAdminPermissions: (id, permissions) => api.put(`/superadmin/admins/${id}/permissions`, { permissions }),
};

export default api;