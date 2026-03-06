import api from './api';

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  bio?: string;
  public_key: string;
  encrypted_private_key: string;
}

export interface LoginData {
  email: string;
  password: string;
  device_id?: string;
  device_name?: string;
}

export const authService = {
  register: (data: RegisterData) => api.post('/api/auth/register', data),
  login: (data: LoginData) => api.post('/api/auth/login', data),
  refresh: (refresh_token: string) => api.post('/api/auth/refresh', { refresh_token }),
  logout: (refresh_token: string) => api.post('/api/auth/logout', { refresh_token }),
};
