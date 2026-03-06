import { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { userService } from '../services/userService';

interface Report {
  id: string;
  reported_by: string;
  reported_user?: string;
  reason: string;
  status: string;
  created_at: string;
}

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  ip_address?: string;
  created_at: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'reports' | 'logs'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem('cipherconnect_access_token') || '';

  useEffect(() => {
    if (activeTab === 'users') loadUsers();
    if (activeTab === 'reports') loadReports();
    if (activeTab === 'logs') loadLogs();
  }, [activeTab]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await userService.listUsers(token);
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await adminService.listReports(token);
      setReports(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await adminService.listAuditLogs(token);
      setLogs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (userId: string, role: 'user' | 'admin' | 'superadmin') => {
    try {
      await adminService.updateUserRole(userId, { role }, token);
      loadUsers();
      alert('Role updated successfully!');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8">
            <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-blue-100">Manage users, reports, and system logs</p>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex space-x-8 px-8">
              <button onClick={() => setActiveTab('users')} className={`py-4 px-2 border-b-2 font-semibold transition-colors ${activeTab === 'users' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                Users
              </button>
              <button onClick={() => setActiveTab('reports')} className={`py-4 px-2 border-b-2 font-semibold transition-colors ${activeTab === 'reports' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                Reports
              </button>
              <button onClick={() => setActiveTab('logs')} className={`py-4 px-2 border-b-2 font-semibold transition-colors ${activeTab === 'logs' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                Audit Logs
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>
                {activeTab === 'users' && (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.map(user => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                                  {user.username[0].toUpperCase()}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{user.username}</div>
                                  <div className="text-sm text-gray-500">{user.id}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                user.role === 'superadmin' ? 'bg-red-100 text-red-800' :
                                user.role === 'admin' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <select onChange={(e) => updateRole(user.id, e.target.value as any)} value={user.role} className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                                <option value="superadmin">Superadmin</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeTab === 'reports' && (
                  <div className="space-y-4">
                    {reports.map(report => (
                      <div key={report.id} className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border border-gray-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                report.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {report.status}
                              </span>
                              <span className="text-sm text-gray-500">{new Date(report.created_at).toLocaleString()}</span>
                            </div>
                            <p className="text-gray-900 font-medium mb-2">Reason: {report.reason}</p>
                            <div className="text-sm text-gray-600">
                              <p>Reported by: {report.reported_by}</p>
                              {report.reported_user && <p>Reported user: {report.reported_user}</p>}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {reports.length === 0 && (
                      <div className="text-center py-12 text-gray-500">No reports found</div>
                    )}
                  </div>
                )}

                {activeTab === 'logs' && (
                  <div className="space-y-2">
                    {logs.map(log => (
                      <div key={log.id} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between hover:bg-gray-100">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{log.action}</p>
                          <p className="text-xs text-gray-500">User: {log.user_id} {log.ip_address && `• IP: ${log.ip_address}`}</p>
                        </div>
                        <span className="text-xs text-gray-400">{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                    ))}
                    {logs.length === 0 && (
                      <div className="text-center py-12 text-gray-500">No audit logs found</div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
