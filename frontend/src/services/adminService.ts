import api from './api';

export const adminService = {
  getDashboardStats: () => api.get('/api/admin/dashboard-stats'),
  getAllUsers: () => api.get('/api/admin/users'),
  deleteUser: (userId: string) => api.delete(`/api/admin/users/${userId}`),
  updateUserStatus: (userId: string, status: string) =>
    api.patch(`/api/admin/users/${userId}/status?status=${status}`),
  updateUserRole: (userId: string, role: string) =>
    api.patch(`/api/admin/users/${userId}/role`, { role }),
  verifyUser: (userId: string) =>
    api.patch(`/api/admin/users/${userId}/verify`),
  getReports: () => api.get('/api/admin/reports'),
  resolveReport: (reportId: string, status: 'resolved' | 'dismissed') =>
    api.patch(`/api/admin/reports/${reportId}`, { status }),
  getAuditLogs: () => api.get('/api/admin/audit-logs'),
  getConversations: () => api.get('/api/admin/conversations'),
  deleteConversation: (convId: string) => api.delete(`/api/admin/conversations/${convId}`),
};
