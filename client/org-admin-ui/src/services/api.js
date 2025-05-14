import axios from 'axios';

// Update to use port 3000 where the API is actually hosted
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

console.log('API URL configured as:', API_URL);

// Create an Axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to attach the auth token
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method.toUpperCase(), config.url);
    
    // Special debug logging for invitation routes
    if (config.url.includes('/invitations/')) {
      console.log('INVITATION REQUEST:', {
        method: config.method.toUpperCase(),
        url: config.url,
        baseURL: config.baseURL,
        fullUrl: `${config.baseURL}${config.url}`,
        headers: config.headers
      });
    }
    
    // Log organization ID being used
    if (config.url.includes('/organizations/')) {
      const orgIdMatch = config.url.match(/\/organizations\/([^\/]+)/);
      if (orgIdMatch && orgIdMatch[1]) {
        console.log('Using organization ID:', orgIdMatch[1]);
      }
    }
    
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log('Token attached to request');
    } else {
      console.warn('No authentication token found');
    }
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    console.log('API Response Success:', response.status, response.config.url);
    
    // Special debug logging for invitation routes
    if (response.config.url.includes('/invitations/')) {
      console.log('INVITATION RESPONSE SUCCESS:', {
        status: response.status,
        url: response.config.url,
        data: response.data
      });
    }
    
    return response;
  },
  (error) => {
    console.error('API Response Error:', 
      error.response?.status || 'No status',
      error.config?.url || 'No URL',
      error.response?.data || error.message
    );
    
    // Special debug logging for invitation routes
    if (error.config?.url.includes('/invitations/')) {
      console.error('INVITATION RESPONSE ERROR:', {
        status: error.response?.status || 'No status',
        url: error.config?.url,
        fullUrl: `${error.config?.baseURL}${error.config?.url}`,
        error: error.response?.data || error.message,
        stack: error.stack
      });
    }
    
    // Handle 401 Unauthorized errors (token expired, etc.)
    if (error.response && error.response.status === 401) {
      // Clear stored tokens
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API functions - added /api prefix
export const authAPI = {
  login: (credentials) => api.post('/api/auth/login', credentials),
  register: (userData) => api.post('/api/auth/register', userData),
  refreshToken: () => api.post('/api/auth/refresh-token'),
  forgotPassword: (email) => api.post('/api/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/api/auth/reset-password', { token, password }),
  verifyEmail: (token) => api.get(`/api/auth/verify-email/${token}`),
  getCurrentUser: () => api.get('/api/auth/me')
};

// Organization API functions - added /api prefix
export const organizationAPI = {
  getCurrent: () => api.get('/api/organizations/current'),
  update: (data) => api.put('/api/organizations/current', data),
  getMembers: (organizationId = 'current') => {
    console.log(`Making API request to get members for organization: ${organizationId}`);
    return api.get(`/api/organizations/${organizationId}/members`);
  },
  inviteMember: (email, role) => api.post('/api/organizations/current/members/invite', { email, role }),
  removeMember: (userId) => api.delete(`/api/organizations/current/members/${userId}`),
  updateMemberRole: (userId, role) => api.put(`/api/organizations/current/members/${userId}/role`, { role }),
  // New endpoints for organization settings
  getSettings: () => api.get('/api/organizations/current/settings'),
  updateSettings: (settings) => api.put('/api/organizations/current/settings', settings),
  getSubscription: () => api.get('/api/organizations/current/subscription'),
  updateSubscription: (plan) => api.put('/api/organizations/current/subscription', { plan }),
  cancelSubscription: () => api.delete('/api/organizations/current/subscription')
};

// Integration API functions - added /api prefix
export const integrationAPI = {
  // Get all integrations
  getAll: (organizationId) => api.get(`/api/organizations/${organizationId}/integrations`),
  
  // Get single integration
  getById: (organizationId, integrationId) => api.get(`/api/organizations/${organizationId}/integrations/${integrationId}`),
  
  // Create new integration
  create: (organizationId, integrationData) => api.post(`/api/organizations/${organizationId}/integrations`, integrationData),
  
  // Update integration
  update: (organizationId, integrationId, integrationData) => api.put(`/api/organizations/${organizationId}/integrations/${integrationId}`, integrationData),
  
  // Delete integration
  delete: (organizationId, integrationId) => api.delete(`/api/organizations/${organizationId}/integrations/${integrationId}`),
  
  // Sync integration data
  sync: (organizationId, integrationId, options = {}) => api.post(`/api/organizations/${organizationId}/integrations/${integrationId}/sync`, options),
  
  // Get OAuth URLs
  getOAuthUrl: (organizationId, type, integrationId) => {
    switch (type) {
      case 'slack':
        return `${API_URL}/api/organizations/${organizationId}/integrations/slack/oauth?state=${integrationId}`;
      case 'github':
        return `https://github.com/login/oauth/authorize?client_id=${process.env.REACT_APP_GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(`${API_URL}/api/organizations/${organizationId}/integrations/github/callback`)}&scope=repo,read:user,read:org&state=${integrationId}`;
      case 'gmail':
        return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.REACT_APP_GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(`${API_URL}/api/organizations/${organizationId}/integrations/gmail/callback`)}&response_type=code&scope=https://www.googleapis.com/auth/gmail.readonly&access_type=offline&prompt=consent&state=${integrationId}`;
      default:
        throw new Error(`Unsupported integration type: ${type}`);
    }
  }
};

// Slack API functions for direct Slack integration
export const slackAPI = {
  // Get users directly from Slack via our backend
  getUsers: () => api.get('/api/slack/users'),
  
  // Force refresh users directly from Slack (bypass cache)
  getUsersForceRefresh: () => api.get('/api/slack/users?force_refresh=true'),
  
  // Test Slack integration credentials
  testConnection: (token) => api.post('/api/slack/test-connection', { token }),
  
  // Get channels from Slack workspace
  getChannels: () => api.get('/api/slack/channels'),
  
  // Get conversations from Slack
  getConversations: () => api.get('/api/slack/conversations')
};

// Dashboard API functions
export const dashboardAPI = {
  // Get summary metrics for dashboard
  getMetrics: () => api.get('/api/dashboard/metrics'),
  
  // Get integration status summary
  getIntegrationStatus: () => api.get('/api/dashboard/integrations/status'),
  
  // Get recent activity for the organization
  getRecentActivity: (limit = 10) => api.get(`/api/dashboard/activity?limit=${limit}`),
  
  // Get whisper stats
  getWhisperStats: () => api.get('/api/dashboard/whispers/stats'),
  
  // Get team member stats
  getTeamStats: () => api.get('/api/dashboard/team/stats')
};

// User management API functions
export const userAPI = {
  // Get current user profile
  getProfile: () => api.get('/api/users/me'),
  
  // Update current user profile
  updateProfile: (data) => api.put('/api/users/me', data),
  
  // Change password
  changePassword: (currentPassword, newPassword) => 
    api.put('/api/users/me/password', { currentPassword, newPassword }),
  
  // Get user preferences
  getPreferences: () => api.get('/api/users/me/preferences'),
  
  // Update user preferences
  updatePreferences: (preferences) => api.put('/api/users/me/preferences', preferences)
};

// Whisper API functions (now using our new dedicated whispers endpoint)
export const whisperAPI = {
  // Get all whispers
  getAll: (params) => api.get(`/api/organizations/${getCurrentOrganizationId()}/whispers`, { params }),
  
  // Get single whisper
  getById: (whisperId) => api.get(`/api/organizations/${getCurrentOrganizationId()}/whispers/${whisperId}`),
  
  // Get trace data for a whisper
  getTrace: (whisperId) => api.get(`/api/organizations/${getCurrentOrganizationId()}/whispers/${whisperId}/trace`),
  
  // Update whisper feedback
  updateFeedback: (whisperId, feedbackData) => api.put(`/api/organizations/${getCurrentOrganizationId()}/whispers/${whisperId}/feedback`, feedbackData),
  
  // Delete whisper
  delete: (whisperId) => api.delete(`/api/organizations/${getCurrentOrganizationId()}/whispers/${whisperId}`)
};

// Team Manager API functions
export const managerAPI = {
  // Assign manager role to a user
  assignManagerRole: (userId, allowedIntegrations) => 
    api.post(`/api/managers/assign`, { userId, allowedIntegrations }),
  
  // Get all manager permissions for the organization
  getManagerPermissions: () => 
    api.get(`/api/managers/permissions`),
  
  // Get current user's manager permissions
  getMyPermissions: () => 
    api.get(`/api/managers/my-permissions`),
  
  // Revoke manager role from a user
  revokeManagerRole: (managerId) => 
    api.delete(`/api/managers/${managerId}`),
  
  // Get available integrations for the organization
  getAvailableIntegrations: () => 
    api.get(`/api/managers/available-integrations`),
  
  // Get all managers for current organization
  getAllManagers: () =>
    api.get(`/api/managers`),
  
  // Get connected integrations for the current manager
  getMyConnections: () => 
    api.get(`/api/managers/my-connections`)
};

// Insight Scope API functions
export const scopeAPI = {
  // Define scope for a specific integration
  defineScope: (integration, scopeItems) => 
    api.post(`/api/managers/scope/define`, { integration, scopeItems }),
  
  // Get scope for a specific integration
  getScope: (integration) => 
    api.get(`/api/managers/scope/${integration}`),
  
  // Get all scopes for the current manager
  getAllScopes: () => 
    api.get(`/api/managers/scope`),
  
  // Get available items for scope definition (users, channels, etc.)
  getIntegrationItems: (integration) => 
    api.get(`/api/managers/scope/integration/${integration}/items`),
  
  // Delete a scope
  deleteScope: (integration) => 
    api.delete(`/api/managers/scope/${integration}`)
};

// Scoped Insights API functions
export const scopedInsightsAPI = {
  // Get metadata insights filtered by manager's scope
  getScopedMetadataInsights: (integration, params) => 
    api.get(`/api/managers/insights/metadata/${integration}`, { params }),
  
  // Get aggregated metrics for scoped metadata
  getScopedMetadataMetrics: (integration, params) => 
    api.get(`/api/managers/insights/metadata/${integration}/metrics`, { params })
};

// Function to set the auth token
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
};

// Function to get the current organization ID
export const getCurrentOrganizationId = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.organizationId || 'dev-org-123';
};

// Add invitation API functions
export const invitationAPI = {
  // Validate invitation token
  validateInvitation: (token) => api.get(`/api/invitations/accept/${token}`),
  
  // Register from invitation
  registerFromInvitation: (token, userData) => api.post(`/api/invitations/register/${token}`, userData),
  
  // Get all invitations (admin only)
  getAll: () => api.get('/api/invitations'),
  
  // Create new invitation
  create: (invitationData) => api.post('/api/invitations', invitationData),
  
  // Resend invitation
  resend: (id) => api.post(`/api/invitations/${id}/resend`),
  
  // Cancel invitation
  cancel: (id) => api.delete(`/api/invitations/${id}`)
};

export default api;