import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json'
  }
});

// Create a separate instance for auth endpoints (no token)
const authApi = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for auth
api.interceptors.request.use(
  config => {
    // Get authentication token
    const token = localStorage.getItem('token');
    
    // If token exists, add to headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  // Use authApi instance for login to avoid sending any existing token
  login: (credentials) => authApi.post('/auth/admin/login', credentials),
  logout: () => api.get('/auth/admin/logout'),
  refreshToken: () => api.post('/auth/admin/refresh-token'),
  getCurrentUser: () => api.get('/auth/admin/me'),
  updateDetails: (userData) => api.put('/auth/admin/updatedetails', userData),
  updatePassword: (passwordData) => api.put('/auth/admin/updatepassword', passwordData)
};

// Organization API functions
export const organizationAPI = {
  getAll: (includeInactive = false) => api.get(`/organizations${includeInactive ? '?includeInactive=true' : ''}`),
  getById: (id) => api.get(`/organizations/${id}`),
  create: (orgData) => api.post('/organizations', orgData),
  update: (id, orgData) => api.put(`/organizations/${id}`, orgData),
  delete: (id) => api.delete(`/organizations/${id}`),
  getApiKey: (id) => api.get(`/organizations/${id}/apikey`),
  getUsers: (id) => api.get(`/organizations/${id}/users`)
};

// Invitation API functions
export const invitationAPI = {
  getAll: () => api.get('/invitations'),
  create: (invitationData) => api.post('/invitations', invitationData),
  createOrganizationInvite: (orgInviteData) => api.post('/invitations/organization', orgInviteData),
  resend: (id) => api.post(`/invitations/${id}/resend`),
  cancel: (id) => api.delete(`/invitations/${id}`)
};

// Whisper API functions
export const whisperAPI = {
  getAll: () => api.get('/admin/whispers/recent'),
  getById: (id) => api.get(`/admin/whispers/${id}`),
  getByOrganization: (orgId) => api.get(`/organizations/${orgId}/whispers`),
  delete: (id) => api.delete(`/admin/whispers/${id}`)
};

// Function to set the auth token
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
};

export default api; 