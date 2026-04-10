import api from './api';

export interface GroupCreate {
  type: 'group';
  participant_ids: string[];
  name: string;
  description?: string;
  profile_picture?: string;
}

export interface GroupMember {
  id: string;
  username: string;
  email: string;
  profile_picture_url?: string;
  role: 'admin' | 'member';
  joined_at: string;
  is_muted: boolean;
}

export const groupService = {
  createGroup: (data: GroupCreate) => 
    api.post('/api/chat/conversations', data),
  
  addMember: (conversationId: string, userId: string) => 
    api.post(`/api/groups/${conversationId}/members/${userId}`),
  
  removeMember: (conversationId: string, userId: string) => 
    api.delete(`/api/groups/${conversationId}/members/${userId}`),
  
  updateMemberRole: (conversationId: string, userId: string, role: 'admin' | 'member') => 
    api.put(`/api/groups/${conversationId}/members/${userId}/role`, { role }),
  
  listMembers: (conversationId: string) => 
    api.get(`/api/groups/${conversationId}/members`),
  
  updateProfilePicture: (conversationId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.put(`/api/groups/${conversationId}/profile-picture`, formData);
  },
  
  getGroupInfo: (conversationId: string) => 
    api.get(`/api/groups/${conversationId}/info`),
  
  deleteGroup: (conversationId: string) => 
    api.delete(`/api/groups/${conversationId}`),
};
