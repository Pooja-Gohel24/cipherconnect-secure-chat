import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { chatService } from '../services/chatService';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({ conversations: 0, messages: 0, contacts: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      return;
    }
    if (user) {
      loadData();
    }
  }, [authLoading, user]);

  const loadData = async () => {
    const token = localStorage.getItem('cipherconnect_access_token');
    if (!token) return;
    
    try {
      const convRes = await chatService.listConversations(token);
      setStats(prev => ({ ...prev, conversations: convRes.data.length }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading || !user) return (
    <div className="flex items-center justify-center h-screen bg-white">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#611f69]"></div>
    </div>
  );

  return (
    <div className="w-full">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome back, {user.username}!</h1>
          <p className="text-gray-600">Here's what's happening with your workspace today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Conversations</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.conversations}</p>
              </div>
              <div className="w-12 h-12 bg-[#4a154b]/10 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-[#4a154b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Messages</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.messages}</p>
              </div>
              <div className="w-12 h-12 bg-[#e01e5a]/10 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-[#e01e5a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Contacts</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.contacts}</p>
              </div>
              <div className="w-12 h-12 bg-[#36c5f0]/10 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-[#36c5f0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Link to="/chat" className="group flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-[#4a154b] hover:bg-[#4a154b]/5 transition-all">
              <div className="w-10 h-10 bg-[#4a154b] rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Start Chat</p>
                <p className="text-xs text-gray-500">Send a message</p>
              </div>
            </Link>

            <Link to="/contacts" className="group flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-[#e01e5a] hover:bg-[#e01e5a]/5 transition-all">
              <div className="w-10 h-10 bg-[#e01e5a] rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Add Contact</p>
                <p className="text-xs text-gray-500">Find new people</p>
              </div>
            </Link>

            <Link to="/groups" className="group flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-[#36c5f0] hover:bg-[#36c5f0]/5 transition-all">
              <div className="w-10 h-10 bg-[#36c5f0] rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Create Group</p>
                <p className="text-xs text-gray-500">Start a group chat</p>
              </div>
            </Link>

            <Link to="/profile" className="group flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-[#2eb67d] hover:bg-[#2eb67d]/5 transition-all">
              <div className="w-10 h-10 bg-[#2eb67d] rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Edit Profile</p>
                <p className="text-xs text-gray-500">Update your info</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
