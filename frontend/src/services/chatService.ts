import api from './api';

export interface ConversationCreate {
  type: 'direct' | 'group';
  participant_ids: string[];
  name?: string;
  description?: string;
  profile_picture?: string;
}

export interface MessageCreate {
  conversation_id: string;
  encrypted_content: string;
  message_type?: string;
  reply_to?: string;
}

export const chatService = {
  createConversation: (data: ConversationCreate) => 
    api.post('/api/chat/conversations', data),
  
  listConversations: () => 
    api.get('/api/chat/conversations'),
  
  sendMessage: (data: MessageCreate) => 
    api.post('/api/chat/messages', data),
  
  listMessages: (conversationId: string) => 
    api.get(`/api/chat/conversations/${conversationId}/messages`),
};
