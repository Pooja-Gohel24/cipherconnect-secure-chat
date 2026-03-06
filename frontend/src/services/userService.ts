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
  createContact: (data: ContactCreate) => api.post('/api/users/contacts', data),
};
