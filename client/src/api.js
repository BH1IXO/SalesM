import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('salesm_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('salesm_token');
      localStorage.removeItem('salesm_user');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth
export const login = async (username, password) => {
  const { data } = await api.post('/auth/login', { username, password });
  localStorage.setItem('salesm_token', data.token);
  localStorage.setItem('salesm_user', JSON.stringify(data.user));
  return data;
};

export const getMe = async () => {
  const { data } = await api.get('/auth/me');
  return data;
};

// Customers
export const getCustomers = async (params = {}) => {
  const { data } = await api.get('/customers', { params });
  return data;
};

export const getCustomer = async (id) => {
  const { data } = await api.get(`/customers/${id}`);
  return data;
};

export const createCustomer = async (customerData) => {
  const { data } = await api.post('/customers', customerData);
  return data;
};

export const updateCustomer = async (id, customerData) => {
  const { data } = await api.put(`/customers/${id}`, customerData);
  return data;
};

export const deleteCustomer = async (id) => {
  const { data } = await api.delete(`/customers/${id}`);
  return data;
};

export const moveCustomer = async (id, status) => {
  const { data } = await api.patch(`/customers/${id}/status`, { status });
  return data;
};

// Activities
export const getActivities = async (customerId) => {
  const { data } = await api.get(`/customers/${customerId}/activities`);
  return data;
};

export const createActivity = async (customerId, activityData) => {
  const { data } = await api.post(`/customers/${customerId}/activities`, activityData);
  return data;
};

// Expenses
export const getExpenses = async (customerId) => {
  const { data } = await api.get(`/customers/${customerId}/expenses`);
  return data;
};

export const createExpense = async (customerId, expenseData) => {
  const { data } = await api.post(`/customers/${customerId}/expenses`, expenseData);
  return data;
};

// Competitors
export const getCompetitors = async () => {
  const { data } = await api.get('/competitors');
  return data;
};

export const createCompetitor = async (competitorData) => {
  const { data } = await api.post('/competitors', competitorData);
  return data;
};

export const getCustomerCompetitors = async (customerId) => {
  const { data } = await api.get(`/competitors/customer/${customerId}`);
  return data;
};

export const createCustomerCompetitor = async (customerId, competitorData) => {
  const { data } = await api.post(`/competitors/customer/${customerId}`, competitorData);
  return data;
};

// Collaborators
export const getCollaborators = async (customerId) => {
  const { data } = await api.get(`/customers/${customerId}/collaborators`);
  return data;
};

export const addCollaborator = async (customerId, userId) => {
  const { data } = await api.post(`/customers/${customerId}/collaborators`, { user_id: userId });
  return data;
};

export const removeCollaborator = async (customerId, userId) => {
  const { data } = await api.delete(`/customers/${customerId}/collaborators/${userId}`);
  return data;
};

// Team
export const getTeam = async () => {
  const { data } = await api.get('/team');
  return data;
};

// Reports
export const getReportOverview = async () => {
  const { data } = await api.get('/reports/overview');
  return data;
};

export const getReportPipeline = async () => {
  const { data } = await api.get('/reports/pipeline');
  return data;
};

export const getReportPerformance = async () => {
  const { data } = await api.get('/reports/performance');
  return data;
};

export const getReportExpenseBreakdown = async () => {
  const { data } = await api.get('/reports/expense-breakdown');
  return data;
};

// Data Import/Export
export const exportData = async () => {
  const { data } = await api.get('/data/export');
  return data;
};

export const importData = async (importPayload) => {
  const { data } = await api.post('/data/import', importPayload);
  return data;
};

// Documents
export const getDocuments = async (customerId) => {
  const { data } = await api.get(`/customers/${customerId}/documents`);
  return data;
};

export const uploadDocument = async (customerId, formData, onProgress) => {
  const { data } = await api.post(`/customers/${customerId}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress,
  });
  return data;
};

export const deleteDocument = async (customerId, docId) => {
  const { data } = await api.delete(`/customers/${customerId}/documents/${docId}`);
  return data;
};

export const downloadDocument = async (customerId, docId, inline = false) => {
  const response = await api.get(
    `/customers/${customerId}/documents/${docId}/download${inline ? '?inline=1' : ''}`,
    { responseType: 'blob' }
  );
  return response;
};

// Document Categories
export const getDocumentCategories = async () => {
  const { data } = await api.get('/document-categories');
  return data;
};

export const createDocumentCategory = async (name) => {
  const { data } = await api.post('/document-categories', { name });
  return data;
};

// Auth - Change Password
export const changePassword = async (oldPassword, newPassword) => {
  const { data } = await api.post('/auth/change-password', { oldPassword, newPassword });
  return data;
};

// Admin - User Management
export const getUsers = async () => {
  const { data } = await api.get('/admin/users');
  return data;
};

export const createUser = async (userData) => {
  const { data } = await api.post('/admin/users', userData);
  return data;
};

export const updateUser = async (id, userData) => {
  const { data } = await api.put(`/admin/users/${id}`, userData);
  return data;
};

export const resetUserPassword = async (id, password) => {
  const { data } = await api.post(`/admin/users/${id}/reset-password`, { password });
  return data;
};

// Account Applications
export const submitApplication = async (username, name) => {
  const { data } = await api.post('/applications', { username, name });
  return data;
};

export const getApplications = async () => {
  const { data } = await api.get('/applications');
  return data;
};

export const approveApplication = async (id) => {
  const { data } = await api.post(`/applications/${id}/approve`);
  return data;
};

export const rejectApplication = async (id) => {
  const { data } = await api.post(`/applications/${id}/reject`);
  return data;
};
