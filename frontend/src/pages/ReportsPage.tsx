import { useState, useEffect } from 'react';
import { userService } from '../services/userService';
import { chatService } from '../services/chatService';

interface MyReport {
  id: string;
  reported_user: string;
  conversation_id: string;
  reason: string;
  status: string;
  created_at: string;
}

interface Conversation {
  id: string;
  name?: string;
  type: string;
  participants?: Array<{ id: string; username: string }>;
}

const STATUS_STYLE: Record<string, string> = {
  open: 'bg-yellow-100 text-yellow-800',
  pending: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-800',
  dismissed: 'bg-gray-100 text-gray-600',
};

const STATUS_DESC: Record<string, string> = {
  open: 'Your report is under review by our team.',
  pending: 'Your report is under review by our team.',
  resolved: 'This report has been reviewed and action was taken.',
  dismissed: 'This report was reviewed but no action was required.',
};

export default function ReportsPage() {
  const [reports, setReports] = useState<MyReport[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ conversation_id: '', reported_user: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState('');

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [reportsRes, convsRes, meRes] = await Promise.all([
        userService.getMyReports(),
        chatService.listConversations(),
        userService.getMe(),
      ]);
      setReports(reportsRes.data);
      setConversations(convsRes.data);
      setCurrentUserId(meRes.data.id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConvChange = (convId: string) => {
    const conv = conversations.find(c => c.id === convId);
    const otherParticipant = conv?.participants?.find(p => p.id !== currentUserId);
    setForm(f => ({
      ...f,
      conversation_id: convId,
      reported_user: otherParticipant?.id || '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.conversation_id || !form.reported_user || !form.reason.trim()) {
      alert('Please fill in all fields.');
      return;
    }
    setSubmitting(true);
    try {
      await userService.submitReport(form);
      setShowForm(false);
      setForm({ conversation_id: '', reported_user: '', reason: '' });
      loadAll();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  const getConvName = (convId: string) => {
    const conv = conversations.find(c => c.id === convId);
    if (!conv) return convId.substring(0, 8) + '...';
    if (conv.type === 'group') return conv.name || 'Group';
    const other = conv.participants?.find(p => p.id !== currentUserId);
    return other?.username || 'Direct Chat';
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Report inappropriate users or conversations</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-[#4a154b] text-white rounded-lg hover:bg-[#611f69] text-sm font-medium"
        >
          + New Report
        </button>
      </div>

      {/* New Report Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Submit a Report</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Conversation</label>
                <select
                  value={form.conversation_id}
                  onChange={e => handleConvChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4a154b] outline-none"
                  required
                >
                  <option value="">Select a conversation...</option>
                  {conversations.map(conv => (
                    <option key={conv.id} value={conv.id}>
                      {conv.type === 'group'
                        ? `[Group] ${conv.name || 'Unnamed'}`
                        : `[Direct] ${conv.participants?.find(p => p.id !== currentUserId)?.username || 'Unknown'}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reported User</label>
                {form.conversation_id ? (
                  <select
                    value={form.reported_user}
                    onChange={e => setForm(f => ({ ...f, reported_user: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4a154b] outline-none"
                    required
                  >
                    <option value="">Select user to report...</option>
                    {conversations
                      .find(c => c.id === form.conversation_id)
                      ?.participants?.filter(p => p.id !== currentUserId)
                      .map(p => (
                        <option key={p.id} value={p.id}>{p.username}</option>
                      ))}
                  </select>
                ) : (
                  <p className="text-sm text-gray-400 italic">Select a conversation first</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <textarea
                  value={form.reason}
                  onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  rows={4}
                  placeholder="Describe the issue in detail..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4a154b] outline-none resize-none"
                  required
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reports List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-[#4a154b] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-gray-500 font-medium">No reports submitted yet</p>
          <p className="text-gray-400 text-sm mt-1">Use the button above to report an issue</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map(report => (
            <div key={report.id} className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center space-x-2">
                    <p className="font-medium text-gray-900 text-sm">
                      Conversation: {getConvName(report.conversation_id)}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Reason:</span> {report.reason}
                  </p>
                  <p className="text-xs text-gray-400">
                    Submitted {new Date(report.created_at + 'Z').toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                  </p>
                  <p className="text-xs text-gray-500 mt-2 italic">
                    {STATUS_DESC[report.status] || 'Status unknown'}
                  </p>
                </div>
                <span className={`ml-4 flex-shrink-0 px-3 py-1 text-xs font-semibold rounded-full capitalize ${STATUS_STYLE[report.status] || 'bg-gray-100 text-gray-600'}`}>
                  {report.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Status explanation */}
      <div className="mt-8 bg-blue-50 border border-blue-100 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">Report Status Guide</h3>
        <div className="space-y-1 text-xs text-blue-800">
          <p><span className="font-semibold">Open / Pending</span> — Your report has been received and is being reviewed by our moderation team.</p>
          <p><span className="font-semibold">Resolved</span> — The report was reviewed and appropriate action was taken against the reported user.</p>
          <p><span className="font-semibold">Dismissed</span> — The report was reviewed but did not violate our community guidelines.</p>
        </div>
      </div>
    </div>
  );
}
