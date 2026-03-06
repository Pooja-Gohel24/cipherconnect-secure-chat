import { useState, useEffect } from 'react';
import { userService } from '../services/userService';
import { chatService } from '../services/chatService';

interface ContactUser {
  id: string;
  username: string;
  email: string;
  status?: string;
  profile_picture_url?: string;
}

interface Contact {
  id: string;
  user_id: string;
  contact_user_id: string;
  status: string;
  created_at: string;
  contact_user: ContactUser;
}

interface UserSearchResult {
  id: string;
  username: string;
  email: string;
  status?: string;
  profile_picture_url?: string;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const res = await userService.listContacts();
      setContacts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchTerm(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    
    setIsSearching(true);
    try {
      const res = await userService.searchUsers(query);
      setSearchResults(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const addContact = async (userId: string) => {
    try {
      await userService.createContact({ contact_user_id: userId });
      alert('Contact added successfully!');
      setSearchTerm('');
      setSearchResults([]);
      setIsSearching(false);
      loadContacts();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to add contact');
    }
  };

  const startChat = async (userId: string) => {
    try {
      await chatService.createConversation({
        type: 'direct',
        participant_ids: [userId],
      });
      alert('Chat created! Go to Messages to continue.');
    } catch (err) {
      console.error(err);
    }
  };

  const filteredContacts = contacts.filter(c => 
    c.contact_user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.contact_user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
            <button onClick={loadContacts} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </button>
          </div>

          {/* Search for new contacts */}
          <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Add New Contacts</h2>
            <div className="relative">
              <input 
                value={searchTerm} 
                onChange={(e) => handleSearch(e.target.value)} 
                type="text" 
                placeholder="Search by username or email to add contacts..." 
                className="w-full px-6 py-4 pl-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              />
              <svg className="w-6 h-6 text-gray-400 absolute left-4 top-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            {/* Search Results */}
            {isSearching && searchResults.length > 0 && (
              <div className="mt-4 space-y-2">
                {searchResults.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                        {user.profile_picture_url ? (
                          <img src={user.profile_picture_url} alt={user.username} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          user.username[0].toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.username}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => addContact(user.id)} 
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {isSearching && searchResults.length === 0 && searchTerm.length >= 2 && (
              <p className="mt-4 text-gray-500 text-center">No users found matching "{searchTerm}"</p>
            )}
          </div>

          {/* My Contacts List */}
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900">My Contacts ({contacts.length})</h2>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredContacts.map(contact => (
                <div key={contact.id} className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4">
                      {contact.contact_user?.profile_picture_url ? (
                        <img src={contact.contact_user.profile_picture_url} alt={contact.contact_user.username} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        contact.contact_user?.username?.[0]?.toUpperCase() || '?'
                      )}
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{contact.contact_user?.username || 'Unknown'}</h3>
                    <p className="text-sm text-gray-500 mb-3">{contact.contact_user?.email || ''}</p>
                    
                    {contact.contact_user?.status && (
                      <div className="flex items-center space-x-2 mb-4">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-gray-600">{contact.contact_user.status}</span>
                      </div>
                    )}

                    <div className="flex space-x-2 w-full">
                      <button onClick={() => startChat(contact.contact_user_id)} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
                        Chat
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && filteredContacts.length === 0 && (
            <div className="text-center py-12">
              <svg className="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-xl text-gray-500">No contacts yet</p>
              <p className="text-sm text-gray-400 mt-2">Search for users above to add them as contacts</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
