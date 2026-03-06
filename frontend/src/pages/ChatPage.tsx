import { useState, useEffect, useRef } from 'react';
import { chatService } from '../services/chatService';
import { userService } from '../services/userService';

interface Message {
  id: string;
  sender_id: string;
  encrypted_content: string;
  created_at: string;
  message_type?: string;
}

interface Conversation {
  id: string;
  name?: string;
  type: string;
  created_at: string;
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const token = localStorage.getItem('access_token') || '';

  useEffect(() => {
    loadCurrentUser();
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConv) loadMessages(selectedConv);
  }, [selectedConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadCurrentUser = async () => {
    try {
      const res = await userService.getMe();
      setCurrentUserId(res.data.id);
    } catch (err) {
      console.error(err);
    }
  };

  const loadConversations = async () => {
    try {
      const res = await chatService.listConversations();
      setConversations(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadMessages = async (convId: string) => {
    try {
      const res = await chatService.listMessages(convId);
      setMessages(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConv) return;
    try {
      await chatService.sendMessage({
        conversation_id: selectedConv,
        encrypted_content: newMessage,
      });
      setNewMessage('');
      loadMessages(selectedConv);
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (dateString: string) => {
    // Create date in IST (UTC+5:30)
    const date = new Date(dateString);
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    const istDate = new Date(date.getTime() + istOffset);
    
    // Format: "07:48 PM"
    const time = istDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    
    // Format: "Mar 7, 2026"
    const dateStr = istDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    return { time, date: dateStr };
  };

  return (
    <div className="flex h-[calc(100vh-120px)] bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-[#4a154b] flex flex-col">
        <div className="p-4 border-b border-[#3d0e40]">
          <h2 className="text-white font-bold text-lg mb-3">Messages</h2>
          <button className="w-full px-3 py-2 bg-white text-[#4a154b] rounded text-sm font-medium hover:bg-gray-100">
            + New Message
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {conversations.map(conv => (
            <div key={conv.id} onClick={() => setSelectedConv(conv.id)} className={`px-4 py-2 cursor-pointer hover:bg-[#611f69] ${selectedConv === conv.id ? 'bg-[#611f69]' : ''}`}>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-[#e01e5a] rounded flex items-center justify-center text-white font-semibold text-sm">
                  {conv.name?.[0] || '#'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">{conv.name || 'Conversation'}</p>
                  <p className="text-white/60 text-xs truncate">{conv.type}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConv ? (
          <>
            <div className="bg-white border-b border-gray-200 px-6 py-3">
              <h3 className="text-lg font-bold text-gray-900">
                {conversations.find(c => c.id === selectedConv)?.name || 'Chat'}
              </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white">
              {messages.map(msg => {
                const isCurrentUser = msg.sender_id === currentUserId;
                return (
                  <div key={msg.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex items-start space-x-2 max-w-[70%] ${isCurrentUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      {!isCurrentUser && (
                        <div className="w-8 h-8 bg-[#e01e5a] rounded flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                          U
                        </div>
                      )}
                      <div>
                        {!isCurrentUser && (
                          <p className="text-xs font-semibold text-gray-900 mb-1">User</p>
                        )}
                        <div className={`rounded-lg px-4 py-2 ${isCurrentUser ? 'bg-[#4a154b] text-white' : 'bg-gray-100 text-gray-900'}`}>
                          <p className="text-sm">{msg.encrypted_content}</p>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{formatTime(msg.created_at).time}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Date separator */}
            {messages.length > 0 && (
              <div className="flex justify-center my-4">
                <span className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full">
                  {formatTime(messages[0].created_at).date}
                </span>
              </div>
            )}

            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex items-center space-x-2">
                <input 
                  value={newMessage} 
                  onChange={(e) => setNewMessage(e.target.value)} 
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()} 
                  type="text" 
                  placeholder="Type a message..." 
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4a154b] focus:border-transparent outline-none" 
                />
                <button 
                  onClick={sendMessage} 
                  className="px-4 py-2 bg-[#2eb67d] text-white rounded-lg hover:bg-[#2a9d68] font-medium"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-white">
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-900 mb-1">Select a conversation</p>
              <p className="text-sm text-gray-500">Choose a conversation from the sidebar to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
