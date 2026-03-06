import api from './api';

export interface ReportCreate {
  conversation_id?: string;
  reported_user?: string;
  reason: string;
}

export interface RoleUpdate {
  role: 'user' | 'admin' | 'superadmin';
}

export const adminService = {
  createReport: (data: ReportCreate, token: string) => 
    api.post('/api/admin/reports', data, { headers: { Authorization: `Bearer ${token}` } }),
  
  listReports: (token: string) => 
    api.get('/api/admin/reports', { headers: { Authorization: `Bearer ${token}` } }),
  
  listAuditLogs: (token: string) => 
    api.get('/api/admin/audit-logs', { headers: { Authorization: `Bearer ${token}` } }),
  
  updateUserRole: (userId: string, data: RoleUpdate, token: string) => 
    api.patch(`/api/admin/users/${userId}/role`, data, { headers: { Authorization: `Bearer ${token}` } }),
};
