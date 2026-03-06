import api from './api';

export interface GroupCreate {
  type: 'group';
  participant_ids: string[];
  name: string;
  description?: string;
  profile_picture?: string;
}

export const groupService = {
  createGroup: (data: GroupCreate, token: string) => 
    api.post('/api/groups', data, { headers: { Authorization: `Bearer ${token}` } }),
  
  addMember: (conversationId: string, userId: string, token: string) => 
    api.post(`/api/groups/${conversationId}/members/${userId}`, {}, { headers: { Authorization: `Bearer ${token}` } }),
};
