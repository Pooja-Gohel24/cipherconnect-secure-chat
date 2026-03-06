import { useState } from 'react';

export default function ApiDocsPage() {
  const [activeSection, setActiveSection] = useState('auth');

  const endpoints = {
    auth: [
      {
        method: 'POST',
        path: '/auth/register',
        description: 'Register a new user',
        body: {
          username: 'string',
          email: 'string',
          password: 'string',
          bio: 'string (optional)',
          public_key: 'string',
          encrypted_private_key: 'string',
        },
        response: { message: 'User registered successfully' },
      },
      {
        method: 'POST',
        path: '/auth/login',
        description: 'Login user and get tokens',
        body: {
          email: 'string',
          password: 'string',
          device_id: 'string (optional)',
          device_name: 'string (optional)',
        },
        response: {
          access_token: 'string',
          refresh_token: 'string',
          expires_at: 'datetime',
        },
      },
      {
        method: 'POST',
        path: '/auth/refresh',
        description: 'Refresh access token',
        body: { refresh_token: 'string' },
        response: {
          access_token: 'string',
          refresh_token: 'string',
          expires_at: 'datetime',
        },
      },
      {
        method: 'POST',
        path: '/auth/logout',
        description: 'Logout user',
        body: { refresh_token: 'string' },
        response: { message: 'Logged out' },
      },
    ],
    users: [
      {
        method: 'GET',
        path: '/users/me',
        description: 'Get current user profile',
        auth: true,
        response: {
          id: 'string',
          username: 'string',
          email: 'string',
          bio: 'string',
          role: 'string',
          created_at: 'datetime',
        },
      },
      {
        method: 'GET',
        path: '/users',
        description: 'List all users (Admin only)',
        auth: true,
        response: '[Array of users]',
      },
      {
        method: 'PATCH',
        path: '/users/me',
        description: 'Update current user profile',
        auth: true,
        body: {
          profile_picture_url: 'string (optional)',
          bio: 'string (optional)',
          status: 'string (optional)',
        },
        response: { ...{}, message: 'Updated user object' },
      },
      {
        method: 'GET',
        path: '/users/{user_id}',
        description: 'Get user by ID',
        auth: true,
        response: { ...{}, message: 'User object' },
      },
      {
        method: 'POST',
        path: '/users/contacts',
        description: 'Add a contact',
        auth: true,
        body: { contact_user_id: 'string' },
        response: { ...{}, message: 'Contact object' },
      },
    ],
    chat: [
      {
        method: 'POST',
        path: '/chat/conversations',
        description: 'Create a new conversation',
        auth: true,
        body: {
          type: 'direct | group',
          participant_ids: '[string]',
          name: 'string (optional)',
          description: 'string (optional)',
        },
        response: { ...{}, message: 'Conversation object' },
      },
      {
        method: 'GET',
        path: '/chat/conversations',
        description: 'List all conversations',
        auth: true,
        response: '[Array of conversations]',
      },
      {
        method: 'POST',
        path: '/chat/messages',
        description: 'Send a message',
        auth: true,
        body: {
          conversation_id: 'string',
          encrypted_content: 'string',
          message_type: 'string (optional)',
          reply_to: 'string (optional)',
        },
        response: { ...{}, message: 'Message object' },
      },
      {
        method: 'GET',
        path: '/chat/conversations/{conversation_id}/messages',
        description: 'Get messages in a conversation',
        auth: true,
        response: '[Array of messages]',
      },
    ],
    groups: [
      {
        method: 'POST',
        path: '/groups',
        description: 'Create a new group',
        auth: true,
        body: {
          type: 'group',
          participant_ids: '[string]',
          name: 'string',
          description: 'string (optional)',
        },
        response: { ...{}, message: 'Group object' },
      },
      {
        method: 'POST',
        path: '/groups/{conversation_id}/members/{user_id}',
        description: 'Add member to group (Admin only)',
        auth: true,
        response: { message: 'Member added' },
      },
    ],
    admin: [
      {
        method: 'POST',
        path: '/admin/reports',
        description: 'Create a report (Admin only)',
        auth: true,
        body: {
          conversation_id: 'string (optional)',
          reported_user: 'string (optional)',
          reason: 'string',
        },
        response: { ...{}, message: 'Report object' },
      },
      {
        method: 'GET',
        path: '/admin/reports',
        description: 'List all reports (Admin only)',
        auth: true,
        response: '[Array of reports]',
      },
      {
        method: 'GET',
        path: '/admin/audit-logs',
        description: 'List audit logs (Admin only)',
        auth: true,
        response: '[Array of audit logs]',
      },
      {
        method: 'PATCH',
        path: '/admin/users/{user_id}/role',
        description: 'Update user role (Superadmin only)',
        auth: true,
        body: { role: 'user | admin | superadmin' },
        response: { message: 'Role updated' },
      },
    ],
  };

  const sections = [
    { id: 'auth', name: 'Authentication', icon: '🔐' },
    { id: 'users', name: 'Users', icon: '👤' },
    { id: 'chat', name: 'Chat', icon: '💬' },
    { id: 'groups', name: 'Groups', icon: '👥' },
    { id: 'admin', name: 'Admin', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-5xl font-bold mb-4">API Documentation</h1>
          <p className="text-xl text-blue-100">Complete reference for CipherConnect API endpoints</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="sticky top-8 bg-white rounded-xl shadow-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Sections</h3>
              <nav className="space-y-2">
                {sections.map(section => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                      activeSection === section.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="mr-2">{section.icon}</span>
                    {section.name}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="space-y-6">
              {endpoints[activeSection as keyof typeof endpoints].map((endpoint, idx) => (
                <div key={idx} className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-lg font-bold text-sm ${
                          endpoint.method === 'GET' ? 'bg-green-100 text-green-800' :
                          endpoint.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                          endpoint.method === 'PATCH' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {endpoint.method}
                        </span>
                        <code className="text-lg font-mono text-gray-900">{endpoint.path}</code>
                      </div>
                      {endpoint.auth && (
                        <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-lg text-xs font-semibold">
                          🔒 Auth Required
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600">{endpoint.description}</p>
                  </div>

                  <div className="p-6 space-y-4">
                    {endpoint.body && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Request Body</h4>
                        <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
                          <code>{JSON.stringify(endpoint.body, null, 2)}</code>
                        </pre>
                      </div>
                    )}

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Response</h4>
                      <pre className="bg-gray-900 text-blue-400 p-4 rounded-lg overflow-x-auto">
                        <code>{JSON.stringify(endpoint.response, null, 2)}</code>
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
