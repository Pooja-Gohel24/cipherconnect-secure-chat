import { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';

interface Stats {
  total_users: number;
  verified_users: number;
  online_users: number;
  total_messages: number;
  total_conversations: number;
  pending_reports: number;
  new_users_week: number;
  messages_today: number;
}

interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: string;
  status: string;
  is_verified: boolean;
  is_online: boolean;
  created_at: string;
  last_seen: string | null;
}

interface Report {
  id: string;
  reported_by: string;
  reported_by_username: string;
  reported_by_email: string;
  reported_user: string;
  reported_user_username: string;
  reported_user_email: string;
  conversation_id: string;
  reason: string;
  status: string;
  created_at: string;
}

interface AuditLog {
  id: string;
  user_id: string;
  username: string;
  action: string;
  ip_address: string | null;
  created_at: string;
}

interface AdminConversation {
  id: string;
  type: string;
  name: string | null;
  created_at: string;
  message_count: number;
  member_count: number;
}

type Tab = 'dashboard' | 'users' | 'conversations' | 'reports' | 'logs';

const ROLE_COLORS: Record<string, string> = {
  superadmin: 'bg-red-100 text-red-800',
  admin: 'bg-purple-100 text-purple-800',
  user: 'bg-gray-100 text-gray-700',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  offline: 'bg-gray-100 text-gray-600',
  suspended: 'bg-yellow-100 text-yellow-800',
  banned: 'bg-red-100 text-red-800',
};

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [conversations, setConversations] = useState<AdminConversation[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [convSearch, setConvSearch] = useState('');
  const [reviewingReport, setReviewingReport] = useState<Report | null>(null);

  useEffect(() => { loadDashboardStats(); }, []);

  useEffect(() => {
    if (activeTab === 'users') loadUsers();
    else if (activeTab === 'conversations') loadConversations();
    else if (activeTab === 'reports') loadReports();
    else if (activeTab === 'logs') loadLogs();
  }, [activeTab]);

  const loadDashboardStats = async () => {
    try { const res = await adminService.getDashboardStats(); setStats(res.data); }
    catch (err) { console.error(err); }
  };

  const withLoading = async (fn: () => Promise<void>) => {
    setLoading(true);
    try { await fn(); } finally { setLoading(false); }
  };

  const loadUsers = () => withLoading(async () => {
    const res = await adminService.getAllUsers(); setUsers(res.data);
  });

  const loadConversations = () => withLoading(async () => {
    const res = await adminService.getConversations(); setConversations(res.data);
  });

  const loadReports = () => withLoading(async () => {
    const res = await adminService.getReports(); setReports(res.data);
  });

  const loadLogs = () => withLoading(async () => {
    const res = await adminService.getAuditLogs(); setLogs(res.data);
  });

  const handleUpdateRole = async (userId: string, role: string) => {
    try { await adminService.updateUserRole(userId, role); loadUsers(); }
    catch (err: any) { alert(err.response?.data?.detail || 'Failed to update role'); }
  };

  const handleUpdateStatus = async (userId: string, status: string) => {
    try { await adminService.updateUserStatus(userId, status); loadUsers(); }
    catch (err: any) { alert(err.response?.data?.detail || 'Failed to update status'); }
  };

  const handleVerifyUser = async (userId: string) => {
    try { await adminService.verifyUser(userId); loadUsers(); }
    catch (err: any) { alert(err.response?.data?.detail || 'Failed to verify user'); }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`Delete user "${username}"? This cannot be undone.`)) return;
    try { await adminService.deleteUser(userId); loadUsers(); }
    catch (err: any) { alert(err.response?.data?.detail || 'Failed to delete user'); }
  };

  const handleDeleteConversation = async (convId: string) => {
    if (!confirm('Delete this conversation and all its messages?')) return;
    try { await adminService.deleteConversation(convId); loadConversations(); loadDashboardStats(); }
    catch (err: any) { alert(err.response?.data?.detail || 'Failed to delete conversation'); }
  };

  const handleResolveReport = async (reportId: string, status: 'resolved' | 'dismissed') => {
    try { await adminService.resolveReport(reportId, status); loadReports(); loadDashboardStats(); }
    catch (err: any) { alert(err.response?.data?.detail || 'Failed to update report'); }
  };

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredConvs = conversations.filter(c =>
    (c.name || '').toLowerCase().includes(convSearch.toLowerCase()) ||
    c.type.toLowerCase().includes(convSearch.toLowerCase())
  );

  const tabs: Tab[] = ['dashboard', 'users', 'conversations', 'reports', 'logs'];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-gray-500 mt-1 text-sm">Manage users, conversations, reports and system activity</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-6">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                activeTab === tab
                  ? 'border-[#4a154b] text-[#4a154b]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
              {tab === 'reports' && stats && stats.pending_reports > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {stats.pending_reports}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* ── DASHBOARD ── */}
      {activeTab === 'dashboard' && stats && (
        <div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Users', value: stats.total_users, sub: `+${stats.new_users_week} this week`, color: 'bg-blue-100 text-blue-600' },
              { label: 'Verified Users', value: stats.verified_users, sub: `${Math.round((stats.verified_users / (stats.total_users || 1)) * 100)}% rate`, color: 'bg-green-100 text-green-600' },
              { label: 'Online Now', value: stats.online_users, sub: 'Active users', color: 'bg-purple-100 text-purple-600' },
              { label: 'Messages Today', value: stats.messages_today, sub: `Total: ${stats.total_messages}`, color: 'bg-yellow-100 text-yellow-600' },
            ].map(card => (
              <div key={card.label} className="bg-white rounded-lg border border-gray-200 p-5">
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
                <p className="text-xs text-gray-400 mt-2">{card.sub}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">System Overview</h3>
              <div className="space-y-3">
                {[
                  ['Total Conversations', stats.total_conversations, 'text-gray-900'],
                  ['Pending Reports', stats.pending_reports, 'text-red-600 font-semibold'],
                  ['Unverified Users', stats.total_users - stats.verified_users, 'text-yellow-600'],
                ].map(([label, val, cls]) => (
                  <div key={label as string} className="flex justify-between items-center py-1 border-b border-gray-50">
                    <span className="text-sm text-gray-600">{label}</span>
                    <span className={`text-sm ${cls}`}>{val}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                {[
                  { label: 'Manage Users', tab: 'users' as Tab, color: 'bg-[#4a154b] hover:bg-[#611f69]' },
                  { label: `View Reports (${stats.pending_reports} pending)`, tab: 'reports' as Tab, color: 'bg-red-600 hover:bg-red-700' },
                  { label: 'Conversations', tab: 'conversations' as Tab, color: 'bg-blue-600 hover:bg-blue-700' },
                  { label: 'Audit Logs', tab: 'logs' as Tab, color: 'bg-gray-600 hover:bg-gray-700' },
                ].map(btn => (
                  <button
                    key={btn.tab}
                    onClick={() => setActiveTab(btn.tab)}
                    className={`w-full px-4 py-2 ${btn.color} text-white rounded-lg text-sm font-medium transition-colors`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── USERS ── */}
      {activeTab === 'users' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <input
              type="text"
              placeholder="Search by username or email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-80 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#4a154b] outline-none"
            />
            <span className="text-sm text-gray-500">{filteredUsers.length} users</span>
          </div>

          {loading ? <Spinner /> : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['User', 'Role', 'Status', 'Verified', 'Joined', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-[#4a154b] rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                            {user.username[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{user.username}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                          {user.is_online && <span className="w-2 h-2 bg-green-500 rounded-full" title="Online" />}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={user.role}
                          onChange={e => handleUpdateRole(user.id, e.target.value)}
                          className={`text-xs border border-gray-200 rounded px-2 py-1 font-medium ${ROLE_COLORS[user.role] || ''}`}
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                          <option value="superadmin">Superadmin</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={user.status}
                          onChange={e => handleUpdateStatus(user.id, e.target.value)}
                          className={`text-xs border border-gray-200 rounded px-2 py-1 font-medium ${STATUS_COLORS[user.status] || ''}`}
                        >
                          <option value="active">Active</option>
                          <option value="offline">Offline</option>
                          <option value="suspended">Suspended</option>
                          <option value="banned">Banned</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        {user.is_verified ? (
                          <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full font-medium">Verified</span>
                        ) : (
                          <button
                            onClick={() => handleVerifyUser(user.id)}
                            className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium hover:bg-yellow-200"
                          >
                            Verify
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDeleteUser(user.id, user.username)}
                          className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── CONVERSATIONS ── */}
      {activeTab === 'conversations' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <input
              type="text"
              placeholder="Search conversations..."
              value={convSearch}
              onChange={e => setConvSearch(e.target.value)}
              className="w-80 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#4a154b] outline-none"
            />
            <span className="text-sm text-gray-500">{filteredConvs.length} conversations</span>
          </div>

          {loading ? <Spinner /> : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Name / ID', 'Type', 'Members', 'Messages', 'Created', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredConvs.map(conv => (
                    <tr key={conv.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{conv.name || '(Direct)'}</p>
                        <p className="text-xs text-gray-400 font-mono">{conv.id.substring(0, 12)}...</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${conv.type === 'group' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                          {conv.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{conv.member_count}</td>
                      <td className="px-4 py-3 text-gray-700">{conv.message_count}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {new Date(conv.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDeleteConversation(conv.id)}
                          className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── REPORTS ── */}
      {activeTab === 'reports' && (
        <div>
          {/* Review Modal */}
          {reviewingReport && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg w-full max-w-lg mx-4 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Review Report</h2>
                  <button onClick={() => setReviewingReport(null)} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs text-blue-500 font-medium uppercase mb-1">Reported By</p>
                      <p className="font-semibold text-gray-900">{reviewingReport.reported_by_username}</p>
                      <p className="text-xs text-gray-500">{reviewingReport.reported_by_email}</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-3">
                      <p className="text-xs text-red-500 font-medium uppercase mb-1">Reported User</p>
                      <p className="font-semibold text-gray-900">{reviewingReport.reported_user_username}</p>
                      <p className="text-xs text-gray-500">{reviewingReport.reported_user_email}</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 font-medium uppercase mb-2">Reason / Description</p>
                    <p className="text-sm text-gray-800 leading-relaxed">{reviewingReport.reason}</p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Report ID: <span className="font-mono">{reviewingReport.id.substring(0, 12)}...</span></span>
                    <span>{new Date(reviewingReport.created_at + 'Z').toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</span>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs text-gray-500 mb-3 font-medium">Take Action:</p>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setReviewingReport(null)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => { await handleResolveReport(reviewingReport.id, 'dismissed'); setReviewingReport(null); }}
                      className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={async () => { await handleResolveReport(reviewingReport.id, 'resolved'); setReviewingReport(null); }}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {loading ? <Spinner /> : reports.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-400">No reports found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map(report => (
                <div key={report.id} className="bg-white rounded-lg border border-gray-200 p-5 hover:border-gray-300 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{report.reported_by_username}</span>
                        <span className="text-gray-400 text-xs">reported</span>
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">{report.reported_user_username}</span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{report.reason}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(report.created_at + 'Z').toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium capitalize ${
                        report.status === 'pending' || report.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                        report.status === 'resolved' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {report.status}
                      </span>
                      {(report.status === 'open' || report.status === 'pending') ? (
                        <button
                          onClick={() => setReviewingReport(report)}
                          className="px-3 py-1 bg-[#4a154b] text-white text-xs rounded hover:bg-[#611f69] font-medium"
                        >
                          Review
                        </button>
                      ) : (
                        <button
                          onClick={() => setReviewingReport(report)}
                          className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded hover:bg-gray-200 font-medium"
                        >
                          View
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── AUDIT LOGS ── */}
      {activeTab === 'logs' && (
        <div>
          {loading ? <Spinner /> : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Timestamp', 'User', 'Action', 'IP'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map(log => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(log.created_at + 'Z').toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-gray-900">
                        {log.username}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-900">
                        <ActionBadge action={log.action} />
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{log.ip_address || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-2 border-[#4a154b] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

const ACTION_COLORS: Record<string, string> = {
  user_deleted: 'bg-red-100 text-red-700',
  status_changed: 'bg-yellow-100 text-yellow-700',
  role_changed: 'bg-purple-100 text-purple-700',
  user_verified: 'bg-green-100 text-green-700',
  report_resolved: 'bg-green-100 text-green-700',
  report_dismissed: 'bg-gray-100 text-gray-600',
  conversation_deleted: 'bg-red-100 text-red-700',
  report_created: 'bg-blue-100 text-blue-700',
};

function ActionBadge({ action }: { action: string }) {
  const key = Object.keys(ACTION_COLORS).find(k => action.startsWith(k));
  const cls = key ? ACTION_COLORS[key] : 'bg-gray-100 text-gray-600';
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{action}</span>
  );
}
