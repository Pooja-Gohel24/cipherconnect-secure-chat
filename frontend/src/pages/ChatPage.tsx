import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { chatService } from '../services/chatService';
import { userService } from '../services/userService';
import { groupService, GroupMember } from '../services/groupService';
import MediaSection from '../components/MediaSection';

const EMOJIS = [
  '😀','😂','😍','🥰','😎','😭','😅','🤔','😊','🙏',
  '👍','👎','❤️','🔥','🎉','✅','😢','😡','🤣','😇',
  '👏','💪','🙌','🤝','💯','🎊','😴','🤯','😱','🥳',
  '😏','🤗','😬','🙄','😤','🤑','😋','🤤','😷','🤒',
  '👀','💀','🫡','🫠','🥹','😮','😲','🤫','🫶','💔',
];

interface Reaction {
  emoji: string;
  count: number;
  users: string[];
}

interface ReplyPreview {
  id: string;
  sender_username: string;
  encrypted_content: string;
}

interface Message {
  id: string;
  sender_id: string;
  encrypted_content: string;
  created_at: string;
  message_type?: string;
  deleted_for_everyone?: boolean;
  reply_to?: string | null;
  reply_preview?: ReplyPreview | null;
  reactions?: Reaction[];
  attachments?: Array<{
    id: string;
    file_url: string;
    file_name: string;
    file_type: string;
    file_size: number;
  }>;
}

interface Conversation {
  id: string;
  name?: string;
  type: string;
  created_at: string;
  created_by?: string;
  profile_picture?: string;
  participants?: Array<{
    id: string;
    username: string;
    email: string;
    profile_picture_url?: string;
  }>;
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');
  const [showDeleteMenu, setShowDeleteMenu] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const [userMap, setUserMap] = useState<{[key: string]: {username: string, profile_picture_url?: string}}>({});
  const [messagePollingInterval, setMessagePollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [showMediaSection, setShowMediaSection] = useState(false);
  const [showClearChatModal, setShowClearChatModal] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<'admin' | 'member' | null>(null);
  const [groupInfo, setGroupInfo] = useState<any>(null);
  const [showProfilePictureUpload, setShowProfilePictureUpload] = useState(false);
  const [showDeleteGroupModal, setShowDeleteGroupModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [reactionPickerMsgId, setReactionPickerMsgId] = useState<string | null>(null);
  const [reactionTooltip, setReactionTooltip] = useState<{msgId: string; emoji: string} | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const reactionPickerRef = useRef<HTMLDivElement>(null);
  const token = localStorage.getItem('access_token') || '';

  useEffect(() => {
    loadCurrentUser();
    loadConversations();
    
    // Cleanup polling on unmount
    return () => {
      if (messagePollingInterval) {
        clearInterval(messagePollingInterval);
      }
    };
  }, []);

  useEffect(() => {
    // Handle URL parameter for conversation selection
    const conversationId = searchParams.get('conversation');
    if (conversationId && conversations.length > 0) {
      const foundConv = conversations.find(c => c.id === conversationId);
      if (foundConv) {
        setSelectedConv(conversationId);
      }
    }
  }, [searchParams, conversations]);

  // Additional effect to handle conversation selection after data loads
  useEffect(() => {
    const conversationId = searchParams.get('conversation');
    if (conversationId && !selectedConv && conversations.length > 0) {
      const foundConv = conversations.find(c => c.id === conversationId);
      if (foundConv) {
        setSelectedConv(conversationId);
      }
    }
  }, [conversations, searchParams, selectedConv]);

  useEffect(() => {
    if (selectedConv) {
      loadMessages(selectedConv);
      
      // Check if it's a group and load members
      const conv = conversations.find(c => c.id === selectedConv);
      if (conv?.type === 'group') {
        loadGroupMembers(selectedConv);
      }
      
      // Start polling for new messages
      const interval = setInterval(() => {
        loadMessages(selectedConv);
      }, 2000); // Poll every 2 seconds
      
      setMessagePollingInterval(interval);
      
      return () => {
        if (interval) clearInterval(interval);
      };
    } else {
      // Clear polling when no conversation is selected
      if (messagePollingInterval) {
        clearInterval(messagePollingInterval);
        setMessagePollingInterval(null);
      }
    }
  }, [selectedConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
      if (reactionPickerRef.current && !reactionPickerRef.current.contains(e.target as Node)) {
        setReactionPickerMsgId(null);
      }
      setShowDeleteMenu(null);
    };
    if (showDeleteMenu || showEmojiPicker || reactionPickerMsgId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showDeleteMenu, showEmojiPicker, reactionPickerMsgId]);

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
      console.log('Loaded conversations:', res.data);
      setConversations(res.data);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  const loadMessages = async (convId: string) => {
    try {
      const res = await chatService.listMessages(convId);
      
      // Only update if messages have actually changed
      if (JSON.stringify(res.data) !== JSON.stringify(messages)) {
        setMessages(res.data);
        
        // Load user info for message senders
        const senderIds = [...new Set(res.data.map((msg: Message) => msg.sender_id))];
        const userPromises = senderIds.map(async (senderId) => {
          if (senderId !== currentUserId && !userMap[senderId]) {
            try {
              const userRes = await userService.getUser(senderId);
              return { [senderId]: { username: userRes.data.username, profile_picture_url: userRes.data.profile_picture_url } };
            } catch (err) {
              return { [senderId]: { username: 'Unknown User' } };
            }
          }
          return null;
        });
        
        const userResults = await Promise.all(userPromises);
        const newUserMap = userResults.reduce((acc, result) => ({ ...acc, ...result }), {});
        if (Object.keys(newUserMap).length > 0) {
          setUserMap(prev => ({ ...prev, ...newUserMap }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const sendMessage = async () => {
    if ((!newMessage.trim() && selectedFiles.length === 0) || !selectedConv) return;
    try {
      if (selectedFiles.length > 0) {
        const formData = new FormData();
        formData.append('conversation_id', selectedConv);
        formData.append('encrypted_content', newMessage || 'Sent attachments');
        formData.append('message_type', 'text');
        if (replyingTo) formData.append('reply_to', replyingTo.id);
        selectedFiles.forEach(file => formData.append('files', file));
        await chatService.sendMessageWithAttachments(formData);
      } else {
        await chatService.sendMessage({
          conversation_id: selectedConv,
          encrypted_content: newMessage,
          reply_to: replyingTo?.id,
        });
      }
      setNewMessage('');
      setSelectedFiles([]);
      setImagePreviews([]);
      setReplyingTo(null);
      loadMessages(selectedConv);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      await chatService.toggleReaction(messageId, emoji);
      setReactionPickerMsgId(null);
      if (selectedConv) loadMessages(selectedConv);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(files);
      const previews = files
        .filter(f => f.type.startsWith('image/'))
        .map(f => URL.createObjectURL(f));
      setImagePreviews(previews);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(files);
      // Only generate previews for images, not videos
      setImagePreviews(files.map(f => f.type.startsWith('image/') ? URL.createObjectURL(f) : ''));
    }
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
      setImagePreviews([]);
      setShowAttachMenu(false);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setAudioBlob(null);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const sendAudioMessage = async () => {
    if (!audioBlob || !selectedConv) return;

    try {
      const audioFile = new File([audioBlob], `audio_${Date.now()}.webm`, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('conversation_id', selectedConv);
      formData.append('encrypted_content', 'Voice message');
      formData.append('message_type', 'audio');
      formData.append('files', audioFile);

      await chatService.sendMessageWithAttachments(formData);
      setAudioBlob(null);
      setRecordingTime(0);
      // Immediately load messages after sending
      loadMessages(selectedConv);
    } catch (err) {
      console.error(err);
    }
  };

  const getCurrentIndiaTime = () => {
    const now = new Date();
    // Get current time in India timezone
    const formatter = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    return formatter.format(now);
  };

  const parseUTC = (dateString: string) =>
    new Date(dateString.endsWith('Z') ? dateString : dateString + 'Z');

  const formatTime = (dateString: string) => {
    const formatter = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    return formatter.format(parseUTC(dateString));
  };

  const formatDate = (dateString: string) => {
    const date = parseUTC(dateString);
    // Format date in India timezone
    const formatter = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    return formatter.format(date);
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getConversationDisplayName = (conv: Conversation) => {
    if (!conv) return 'Chat';
    if (conv.type === 'group') {
      return conv.name || 'Group Chat';
    }
    // For direct conversations, show the other participant's name
    const otherParticipant = conv.participants?.find(p => p.id !== currentUserId);
    return otherParticipant?.username || 'Direct Chat';
  };

  const getConversationAvatar = (conv: Conversation) => {
    if (!conv) return 'C';
    if (conv.type === 'group') {
      return conv.name?.[0] || '#';
    }
    // For direct conversations, show the other participant's avatar
    const otherParticipant = conv.participants?.find(p => p.id !== currentUserId);
    return otherParticipant?.username?.[0]?.toUpperCase() || 'U';
  };

  const getConversationProfilePicture = (conv: Conversation) => {
    if (!conv) return null;
    if (conv.type === 'group') {
      // For groups, use the profile_picture from conversation data
      return conv.profile_picture || null;
    }
    const otherParticipant = conv.participants?.find(p => p.id !== currentUserId);
    return otherParticipant?.profile_picture_url;
  };

  const deleteMessage = async (messageId: string, deleteForEveryone: boolean) => {
    try {
      await chatService.deleteMessage(messageId, { delete_for_everyone: deleteForEveryone });
      setShowDeleteMenu(null);
      if (selectedConv) loadMessages(selectedConv);
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  };

  const clearChat = async () => {
    if (!selectedConv) return;
    
    try {
      // Delete all messages for the current user (client-side delete)
      const messagesToDelete = messages.map(msg => msg.id);
      
      for (const messageId of messagesToDelete) {
        await chatService.deleteMessage(messageId, { delete_for_everyone: false });
      }
      
      setShowClearChatModal(false);
      loadMessages(selectedConv);
    } catch (err) {
      console.error('Error clearing chat:', err);
    }
  };

  const loadGroupMembers = async (conversationId: string) => {
    try {
      const res = await groupService.listMembers(conversationId);
      console.log('Loaded group members:', res.data);
      setGroupMembers(res.data);
      
      // Load group info to get current user role
      const infoRes = await groupService.getGroupInfo(conversationId);
      console.log('Group info:', infoRes.data);
      setGroupInfo(infoRes.data);
      setCurrentUserRole(infoRes.data.current_user_role);
    } catch (err) {
      console.error('Error loading group members:', err);
    }
  };

  const loadContacts = async () => {
    try {
      const res = await userService.listContacts();
      console.log('Loaded contacts:', res.data);
      setContacts(res.data);
    } catch (err) {
      console.error('Error loading contacts:', err);
    }
  };

  const addMemberToGroup = async (userId: string) => {
    if (!selectedConv) return;
    
    try {
      console.log('Adding member:', userId, 'to group:', selectedConv);
      const response = await groupService.addMember(selectedConv, userId);
      console.log('Add member response:', response);
      loadGroupMembers(selectedConv);
      setShowAddMember(false);
    } catch (err) {
      console.error('Error adding member:', err);
      alert('Failed to add member: ' + (err as any)?.response?.data?.detail || 'Unknown error');
    }
  };

  const removeMemberFromGroup = async (userId: string) => {
    if (!selectedConv) return;
    
    try {
      console.log('Removing member:', userId, 'from group:', selectedConv);
      const response = await groupService.removeMember(selectedConv, userId);
      console.log('Remove member response:', response);
      loadGroupMembers(selectedConv);
    } catch (err) {
      console.error('Error removing member:', err);
      alert('Failed to remove member: ' + (err as any)?.response?.data?.detail || 'Unknown error');
    }
  };

  const updateGroupProfilePicture = async (file: File) => {
    if (!selectedConv) return;
    
    try {
      console.log('Uploading group profile picture:', file.name);
      const response = await groupService.updateProfilePicture(selectedConv, file);
      console.log('Profile picture updated:', response.data);
      setShowProfilePictureUpload(false);
      // Reload conversations to get updated profile picture in sidebar
      await loadConversations();
      // Also reload group members to get updated info
      await loadGroupMembers(selectedConv);
    } catch (err) {
      console.error('Error updating profile picture:', err);
      alert('Failed to update profile picture: ' + (err as any)?.response?.data?.detail || 'Unknown error');
    }
  };

  const deleteGroup = async () => {
    if (!selectedConv) return;
    
    try {
      console.log('Deleting group:', selectedConv);
      await groupService.deleteGroup(selectedConv);
      setShowDeleteGroupModal(false);
      setShowGroupInfo(false);
      setSelectedConv(null);
      // Reload conversations to remove deleted group
      await loadConversations();
    } catch (err) {
      console.error('Error deleting group:', err);
      alert('Failed to delete group: ' + (err as any)?.response?.data?.detail || 'Unknown error');
    }
  };

  const deleteConversation = async () => {
    if (!selectedConv) return;
    try {
      await chatService.deleteConversation(selectedConv);
      setSelectedConv(null);
      await loadConversations();
    } catch (err) {
      console.error('Error deleting conversation:', err);
      alert('Failed to delete conversation: ' + (err as any)?.response?.data?.detail || 'Unknown error');
    }
  };

  const updateMemberRole = async (userId: string, role: string) => {
    if (!selectedConv) return;
    try {
      await groupService.updateMemberRole(selectedConv, userId, role);
      loadGroupMembers(selectedConv);
    } catch (err) {
      console.error('Error updating member role:', err);
      alert('Failed to update member role: ' + (err as any)?.response?.data?.detail || 'Unknown error');
    }
  };

  return (
    <div className="flex h-[calc(100vh-120px)] bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-[#4a154b] flex flex-col">
        <div className="p-4 border-b border-[#3d0e40]">
          <h2 className="text-white font-bold text-lg">Messages ({conversations.length})</h2>
          <p className="text-white/60 text-xs">Conversations: {conversations.length}, Contacts: {contacts.length}</p>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {conversations.map(conv => {
            const displayName = getConversationDisplayName(conv);
            const avatar = getConversationAvatar(conv);
            const profilePicture = getConversationProfilePicture(conv);
            
            return (
              <div key={conv.id} onClick={() => setSelectedConv(conv.id)} className={`px-4 py-2 cursor-pointer hover:bg-[#611f69] ${selectedConv === conv.id ? 'bg-[#611f69]' : ''}`}>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-[#e01e5a] rounded flex items-center justify-center text-white font-semibold text-sm overflow-hidden">
                    {profilePicture ? (
                      <img 
                        src={profilePicture.startsWith('/') ? `http://127.0.0.1:8000${profilePicture}` : profilePicture} 
                        alt={displayName} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      avatar
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">{displayName}</p>
                    <p className="text-white/60 text-xs truncate">{conv.type === 'group' ? 'Group' : 'Direct'}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConv ? (
          <>
            <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">
                {selectedConv ? getConversationDisplayName(conversations.find(c => c.id === selectedConv)!) : 'Chat'}
              </h3>
              <div className="flex items-center space-x-2">
                {/* Group Info Button - Only show for groups */}
                {conversations.find(c => c.id === selectedConv)?.type === 'group' && (
                  <button
                    onClick={() => {
                      setShowGroupInfo(true);
                      loadContacts();
                    }}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                    title="Group info"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={() => setShowMediaSection(true)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                  title="View media and files"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setShowClearChatModal(true)}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  title="Clear chat"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-gray-50 relative">
              {messages.map(msg => {
                const isCurrentUser = msg.sender_id === currentUserId;
                const QUICK_REACTIONS = ['👍','❤️','😂','😮','😢','🙏'];
                return (
                  <div key={msg.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} group`}>
                    <div className={`flex items-end space-x-2 max-w-[70%] ${isCurrentUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      {!isCurrentUser && (
                        <div className="w-7 h-7 bg-[#e01e5a] rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0 overflow-hidden mb-1">
                          {userMap[msg.sender_id]?.profile_picture_url ? (
                            <img src={userMap[msg.sender_id].profile_picture_url!.startsWith('/') ? `http://127.0.0.1:8000${userMap[msg.sender_id].profile_picture_url}` : userMap[msg.sender_id].profile_picture_url!} alt="User" className="w-full h-full object-cover" />
                          ) : (
                            userMap[msg.sender_id]?.username?.[0]?.toUpperCase() || 'U'
                          )}
                        </div>
                      )}

                      <div className="relative">
                        {/* Hover action bar */}
                        {!msg.deleted_for_everyone && (
                          <div className={`absolute ${isCurrentUser ? 'right-full mr-1' : 'left-full ml-1'} top-0 hidden group-hover:flex items-center space-x-1 bg-white rounded-lg shadow-md border border-gray-100 px-1 py-0.5 z-10`}>
                            {/* Reply */}
                            <button onClick={() => setReplyingTo(msg)} title="Reply" className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-[#4a154b]">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                            </button>
                            {/* React */}
                            <div className="relative" ref={reactionPickerMsgId === msg.id ? reactionPickerRef : undefined}>
                              <button
                                onClick={(e) => { e.stopPropagation(); setReactionPickerMsgId(reactionPickerMsgId === msg.id ? null : msg.id); }}
                                title="React"
                                className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-yellow-500"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              </button>
                              {reactionPickerMsgId === msg.id && (
                                <div className={`absolute bottom-full ${isCurrentUser ? 'right-0' : 'left-0'} mb-1 bg-white rounded-full shadow-xl border border-gray-200 px-2 py-1 flex space-x-1 z-50`}>
                                  {QUICK_REACTIONS.map(emoji => (
                                    <button key={emoji} onClick={(e) => { e.stopPropagation(); handleReaction(msg.id, emoji); }} className="text-xl hover:scale-125 transition-transform">{emoji}</button>
                                  ))}
                                </div>
                              )}
                            </div>
                            {/* Delete menu */}
                            <div className="relative">
                              <button
                                onClick={(e) => { e.stopPropagation(); setShowDeleteMenu(showDeleteMenu === msg.id ? null : msg.id); }}
                                className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
                              >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
                              </button>
                              {showDeleteMenu === msg.id && (
                                <div className="absolute bottom-full right-0 mb-1 bg-white rounded-lg shadow-xl border border-gray-200 py-1 w-48 z-50">
                                  <button onClick={() => deleteMessage(msg.id, false)} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100">Delete for me</button>
                                  {isCurrentUser && (
                                    <button onClick={() => deleteMessage(msg.id, true)} className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50">Delete for everyone</button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {!isCurrentUser && (
                          <p className="text-xs font-semibold text-gray-600 mb-0.5 ml-1">{userMap[msg.sender_id]?.username || 'User'}</p>
                        )}

                        {/* Reply preview inside bubble */}
                        {msg.reply_preview && (
                          <div className={`mb-1 px-3 py-1.5 rounded-lg border-l-4 text-xs ${isCurrentUser ? 'bg-[#3a0f3b] border-purple-300 text-purple-200' : 'bg-gray-200 border-gray-400 text-gray-600'}`}>
                            <p className="font-semibold">{msg.reply_preview.sender_username}</p>
                            <p className="truncate opacity-80">{msg.reply_preview.encrypted_content}</p>
                          </div>
                        )}

                        <div className={`rounded-2xl px-4 py-2 ${isCurrentUser ? 'bg-[#4a154b] text-white rounded-br-sm' : 'bg-white text-gray-900 rounded-bl-sm shadow-sm'} ${msg.deleted_for_everyone ? 'italic opacity-60' : ''}`}>
                          {msg.encrypted_content && !msg.deleted_for_everyone && <p className="text-sm leading-relaxed">{msg.encrypted_content}</p>}
                          {msg.deleted_for_everyone && <p className="text-sm italic opacity-60">This message was deleted</p>}
                          {msg.attachments && msg.attachments.length > 0 && !msg.deleted_for_everyone && (
                            <div className="mt-2 space-y-2">
                              {msg.attachments.map(att => (
                                <div key={att.id}>
                                  {att.file_type.startsWith('image/') ? (
                                    <img src={`http://127.0.0.1:8000${att.file_url}`} alt={att.file_name} className="max-w-xs rounded-lg cursor-pointer" onClick={() => window.open(`http://127.0.0.1:8000${att.file_url}`, '_blank')} />
                                  ) : att.file_type.startsWith('video/') ? (
                                    <video src={`http://127.0.0.1:8000${att.file_url}`} controls className="max-w-xs rounded-lg" />
                                  ) : att.file_type.startsWith('audio/') ? (
                                    <audio src={`http://127.0.0.1:8000${att.file_url}`} controls className="w-56" />
                                  ) : (
                                    <a href={`http://127.0.0.1:8000${att.file_url}`} target="_blank" rel="noopener noreferrer" className={`flex items-center space-x-2 p-2 rounded-lg ${isCurrentUser ? 'bg-[#611f69]' : 'bg-gray-100'} hover:opacity-80`}>
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                      <span className="text-xs">{att.file_name}</span>
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          <p className={`text-xs mt-1 ${isCurrentUser ? 'text-purple-200' : 'text-gray-400'} text-right`}>{formatTime(msg.created_at)}</p>
                        </div>

                        {/* Reactions */}
                        {msg.reactions && msg.reactions.length > 0 && (
                          <div className={`flex flex-wrap gap-1 mt-1 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                            {msg.reactions.map(r => (
                              <div key={r.emoji} className="relative">
                                <button
                                  onClick={() => handleReaction(msg.id, r.emoji)}
                                  onMouseEnter={() => setReactionTooltip({ msgId: msg.id, emoji: r.emoji })}
                                  onMouseLeave={() => setReactionTooltip(null)}
                                  className={`flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs border transition-colors ${
                                    r.users.includes(userMap[currentUserId]?.username || '') || r.users.includes('you')
                                      ? 'bg-purple-100 border-purple-300 text-purple-700'
                                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                  }`}
                                >
                                  <span>{r.emoji}</span>
                                  <span className="font-medium">{r.count}</span>
                                </button>
                                {reactionTooltip?.msgId === msg.id && reactionTooltip?.emoji === r.emoji && (
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-gray-800 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap z-50 pointer-events-none">
                                    {r.users.join(', ')}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
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
                  {formatDate(messages[0].created_at)}
                </span>
              </div>
            )}

            <div className="bg-white border-t border-gray-200 p-3">
              {/* Reply context bar */}
              {replyingTo && (
                <div className="mb-2 flex items-center justify-between bg-gray-50 border-l-4 border-[#4a154b] rounded-lg px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#4a154b]">{replyingTo.sender_id === currentUserId ? 'You' : (userMap[replyingTo.sender_id]?.username || 'User')}</p>
                    <p className="text-xs text-gray-500 truncate">{replyingTo.encrypted_content}</p>
                  </div>
                  <button onClick={() => setReplyingTo(null)} className="ml-2 text-gray-400 hover:text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              )}
              {/* Audio Recording UI */}
              {isRecording && (
                <div className="mb-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-red-700">Recording... {formatRecordingTime(recordingTime)}</span>
                    </div>
                    <div className="flex space-x-2">
                      <button onClick={cancelRecording} className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600">
                        Cancel
                      </button>
                      <button onClick={stopRecording} className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700">
                        Stop
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Audio Preview */}
              {audioBlob && !isRecording && (
                <div className="mb-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                      <span className="text-sm font-medium text-green-700">Voice message ready ({formatRecordingTime(recordingTime)})</span>
                      <audio src={URL.createObjectURL(audioBlob)} controls className="h-8" />
                    </div>
                    <div className="flex space-x-2">
                      <button onClick={() => setAudioBlob(null)} className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600">
                        Delete
                      </button>
                      <button onClick={sendAudioMessage} className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700">
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* File / Image Preview */}
              {selectedFiles.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {selectedFiles.map((file, idx) => (
                    <div key={idx} className="relative">
                      {imagePreviews[idx] ? (
                        <div className="relative">
                          <img src={imagePreviews[idx]} alt={file.name} className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
                          <button onClick={() => removeFile(idx)} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600">&times;</button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded-full text-sm">
                          <span className="text-gray-700 max-w-[120px] truncate">{file.name}</span>
                          <button onClick={() => removeFile(idx)} className="text-red-500 hover:text-red-700">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center space-x-1">
                {/* Single attach button — opens image+video picker like WhatsApp */}
                <button onClick={() => imageInputRef.current?.click()} title="Photo or Video" className="p-2 text-gray-500 hover:text-[#4a154b] hover:bg-gray-100 rounded-lg transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                </button>

                {/* Document button */}
                <button onClick={() => fileInputRef.current?.click()} title="Document" className="p-2 text-gray-500 hover:text-[#4a154b] hover:bg-gray-100 rounded-lg transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                </button>

                {/* Audio Recording Button */}
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={audioBlob !== null}
                  title={isRecording ? 'Stop recording' : 'Record voice message'}
                  className={`p-2 rounded-lg transition-colors ${isRecording ? 'bg-red-500 text-white hover:bg-red-600' : 'text-gray-500 hover:text-[#4a154b] hover:bg-gray-100'} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                </button>

                {/* Emoji Picker */}
                <div className="relative" ref={emojiPickerRef}>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowEmojiPicker(p => !p); }}
                    title="Emoji"
                    className="p-2 text-gray-500 hover:text-yellow-500 hover:bg-yellow-50 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </button>
                  {showEmojiPicker && (
                    <div className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-xl border border-gray-200 p-3 w-72 z-50">
                      <div className="grid grid-cols-10 gap-1">
                        {EMOJIS.map((emoji, i) => (
                          <button key={i} onClick={(e) => { e.stopPropagation(); setNewMessage(m => m + emoji); }} className="text-xl hover:bg-gray-100 rounded p-0.5 transition-colors leading-none">{emoji}</button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <input type="file" ref={imageInputRef} onChange={handleImageSelect} multiple accept="image/*,video/*" className="hidden" />
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} multiple accept=".pdf,.doc,.docx,.txt,.zip" className="hidden" />
                <input type="file" ref={videoInputRef} onChange={handleVideoSelect} accept="video/*" className="hidden" />

                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4a154b] focus:border-transparent outline-none text-sm"
                />
                <button onClick={sendMessage} className="px-4 py-2 bg-[#2eb67d] text-white rounded-lg hover:bg-[#2a9d68] font-medium text-sm">Send</button>
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
      
      {/* Media Section Modal */}
      {showMediaSection && selectedConv && (
        <MediaSection
          conversationId={selectedConv}
          onClose={() => setShowMediaSection(false)}
        />
      )}
      
      {/* Clear Chat Confirmation Modal */}
      {showClearChatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Clear Chat</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              Are you sure you want to clear this chat? This will delete all messages from your view only. Other participants will still see the messages.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowClearChatModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={clearChat}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Clear Chat
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Group Info Modal */}
      {showGroupInfo && selectedConv && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Group Info</h3>
              <button
                onClick={() => setShowGroupInfo(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Group Details */}
              <div className="mb-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                      {conversations.find(c => c.id === selectedConv)?.profile_picture ? (
                        <img 
                          src={conversations.find(c => c.id === selectedConv)!.profile_picture!.startsWith('/') ? `http://127.0.0.1:8000${conversations.find(c => c.id === selectedConv)!.profile_picture}` : conversations.find(c => c.id === selectedConv)!.profile_picture!} 
                          alt="Group" 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        getConversationDisplayName(conversations.find(c => c.id === selectedConv)!)[0]
                      )}
                    </div>
                    {currentUserRole === 'admin' && (
                      <button
                        onClick={() => setShowProfilePictureUpload(true)}
                        className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700"
                        title="Change profile picture"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      {getConversationDisplayName(conversations.find(c => c.id === selectedConv)!)}
                    </h4>
                    <p className="text-sm text-gray-500">{groupMembers.length} members</p>
                    <p className="text-xs text-gray-400">Current India time: {getCurrentIndiaTime()}</p>
                  </div>
                </div>
              </div>
              
              {/* Members Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h5 className="text-lg font-semibold text-gray-900">Members ({groupMembers.length})</h5>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">Role: {currentUserRole || 'loading...'}</span>
                    {currentUserRole === 'admin' && (
                      <>
                        <button
                          onClick={() => setShowAddMember(true)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center space-x-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          <span>Add Member</span>
                        </button>
                        <button
                          onClick={() => setShowDeleteGroupModal(true)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium flex items-center space-x-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>Delete Group</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="space-y-3">
                  {groupMembers.map(member => (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm overflow-hidden">
                          {member.profile_picture_url ? (
                            <img 
                              src={member.profile_picture_url.startsWith('/') ? `http://127.0.0.1:8000${member.profile_picture_url}` : member.profile_picture_url} 
                              alt={member.username} 
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            member.username[0].toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{member.username}</p>
                          <p className="text-sm text-gray-500">{member.email}</p>
                          <p className="text-xs text-gray-400">Joined {formatDate(member.joined_at)}</p>
                        </div>
                        {member.role === 'admin' && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                            Admin
                          </span>
                        )}
                      </div>
                      
                      {currentUserRole === 'admin' && member.id !== currentUserId && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateMemberRole(member.id, member.role === 'admin' ? 'member' : 'admin')}
                            className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded hover:bg-blue-200"
                          >
                            {member.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                          </button>
                          <button
                            onClick={() => removeMemberFromGroup(member.id)}
                            className="px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded hover:bg-red-200"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add Member</h3>
              <button
                onClick={() => setShowAddMember(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              <div className="space-y-3">
                {contacts
                  .filter(contact => !groupMembers.some(member => member.id === contact.contact_user.id))
                  .map(contact => (
                    <div key={contact.contact_user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm overflow-hidden">
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
                        <div>
                          <p className="font-medium text-gray-900">{contact.contact_user.username}</p>
                          <p className="text-sm text-gray-500">{contact.contact_user.email}</p>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => addMemberToGroup(contact.contact_user.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                      >
                        Add
                      </button>
                    </div>
                  ))
                }
                
                {contacts.filter(contact => !groupMembers.some(member => member.id === contact.contact_user.id)).length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    All your contacts are already in this group.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Profile Picture Upload Modal */}
      {showProfilePictureUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Update Group Picture</h3>
              <button
                onClick={() => setShowProfilePictureUpload(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Choose Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      updateGroupProfilePicture(file);
                    }
                  }}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              <p className="text-xs text-gray-500">
                Recommended: Square image, at least 200x200 pixels
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Group Confirmation Modal */}
      {showDeleteGroupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Group</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this group? This will permanently delete the group and all its messages for all members.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteGroupModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={deleteGroup}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Delete Group
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
