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

export interface MessageDelete {
  delete_for_everyone: boolean;
}

export const chatService = {
  createConversation: (data: ConversationCreate) => 
    api.post('/api/chat/conversations', data),
  
  listConversations: () => 
    api.get('/api/chat/conversations'),
  
  sendMessage: (data: MessageCreate) => 
    api.post('/api/chat/messages', data),
  
  sendMessageWithAttachments: (formData: FormData) => 
    api.post('/api/chat/messages/with-attachments', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  listMessages: (conversationId: string) => 
    api.get(`/api/chat/conversations/${conversationId}/messages`),
  
  deleteMessage: (messageId: string, data: MessageDelete) => 
    api.delete(`/api/chat/messages/${messageId}`, { data }),
  
  deleteConversation: (conversationId: string) =>
    api.delete(`/api/chat/conversations/${conversationId}`),

  toggleReaction: (messageId: string, emoji: string) =>
    api.post(`/api/chat/messages/${messageId}/reactions`, { emoji }),
};
