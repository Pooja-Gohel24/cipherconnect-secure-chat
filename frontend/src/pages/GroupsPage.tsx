import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { groupService } from '../services/groupService';
import { chatService } from '../services/chatService';
import { userService } from '../services/userService';

interface Contact {
  id: string;
  contact_user: {
    id: string;
    username: string;
    email: string;
    profile_picture_url?: string;
  };
  status: string;
}

interface Group {
  id: string;
  name: string;
  description?: string;
  type: string;
  created_at: string;
}

interface User {
  id: string;
  username: string;
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadGroups();
    loadContacts();
  }, []);

  const loadGroups = async () => {
    try {
      const res = await chatService.listConversations();
      setGroups(res.data.filter((c: Group) => c.type === 'group'));
    } catch (err) {
      console.error(err);
    }
  };

  const loadContacts = async () => {
    try {
      const res = await userService.listContacts();
      // All contacts returned are already accepted due to backend filtering
      setContacts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    // Format date in India timezone
    const formatter = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    return formatter.format(date);
  };

  const createGroup = async () => {
    if (!name.trim()) return;
    try {
      const res = await groupService.createGroup({
        type: 'group',
        name,
        description,
        participant_ids: selectedUsers,
      });
      
      // Navigate to the created group chat
      navigate(`/chat?conversation=${res.data.id}`);
      
      setShowCreate(false);
      setName('');
      setDescription('');
      setSelectedUsers([]);
      setSearchTerm('');
      loadGroups();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const openGroup = (groupId: string) => {
    navigate(`/chat?conversation=${groupId}`);
  };

  const filteredContacts = contacts.filter(contact =>
    contact.contact_user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.contact_user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Groups</h1>
            <button onClick={() => setShowCreate(true)} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-semibold flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Create Group</span>
            </button>
          </div>

          {showCreate && (
            <div className="mb-8 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Create New Group</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Group Name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} type="text" placeholder="Enter group name..." className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Enter group description..." className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Add Members from Contacts</label>
                  <div className="mb-3">
                    <input
                      type="text"
                      placeholder="Search contacts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border border-gray-300 rounded-lg">
                    {filteredContacts.map(contact => (
                      <label key={contact.contact_user.id} className="flex items-center space-x-3 p-2 hover:bg-white rounded cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={selectedUsers.includes(contact.contact_user.id)} 
                          onChange={() => toggleUser(contact.contact_user.id)} 
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" 
                        />
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xs overflow-hidden">
                          {contact.contact_user.profile_picture_url ? (
                            <img 
                              src={contact.contact_user.profile_picture_url.startsWith('/') ? `http://127.0.0.1:8000${contact.contact_user.profile_picture_url}` : contact.contact_user.profile_picture_url} 
                              alt={contact.contact_user.username} 
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            contact.contact_user.username[0].toUpperCase()
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-700 truncate">{contact.contact_user.username}</p>
                          <p className="text-xs text-gray-500 truncate">{contact.contact_user.email}</p>
                        </div>
                      </label>
                    ))}
                    {filteredContacts.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4 col-span-full">
                        {searchTerm ? 'No contacts found matching your search.' : 'No contacts available. Add contacts first to create groups.'}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button onClick={createGroup} className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">
                    Create Group
                  </button>
                  <button onClick={() => setShowCreate(false)} className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map(group => (
              <div key={group.id} className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-xl transition-all">
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                    {group.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">{group.name}</h3>
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">{group.description || 'No description'}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">{formatDate(group.created_at)}</span>
                      <button 
                        onClick={() => openGroup(group.id)}
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                      >
                        Open
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {groups.length === 0 && !showCreate && (
            <div className="text-center py-12">
              <svg className="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-xl text-gray-500 mb-4">No groups yet</p>
              <button onClick={() => setShowCreate(true)} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">
                Create Your First Group
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
