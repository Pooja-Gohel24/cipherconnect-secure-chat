import api from './api';

export interface UserUpdate {
  profile_picture_url?: string | null;
  bio?: string;
  status?: string;
  public_key?: string;
  encrypted_private_key?: string;
}

export interface ContactCreate {
  contact_user_id: string;
}

export const userService = {
  getMe: () => api.get('/api/users/me'),
  listUsers: () => api.get('/api/users'),
  searchUsers: (query: string) => api.get(`/api/users/search?q=${encodeURIComponent(query)}`),
  updateMe: (data: UserUpdate) => api.patch('/api/users/me', data),
  getUser: (userId: string) => api.get(`/api/users/${userId}`),
  listContacts: () => api.get('/api/users/contacts'),
  listContactRequests: () => api.get('/api/users/contacts/requests'),
  createContact: (data: ContactCreate) => api.post('/api/users/contacts', data),
  acceptContactRequest: (contactId: string) => api.patch(`/api/users/contacts/${contactId}/accept`),
  rejectContactRequest: (contactId: string) => api.delete(`/api/users/contacts/${contactId}/reject`),
  removeContact: (contactId: string) => api.delete(`/api/users/contacts/${contactId}`),
  uploadProfilePicture: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/upload/profile-picture', formData);
  },
  getMyReports: () => api.get('/api/users/me/reports'),
  submitReport: (data: { conversation_id: string; reported_user: string; reason: string }) =>
    api.post('/api/users/me/reports', data),
};
