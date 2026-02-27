export type UserRole = "user" | "admin" | "superadmin";

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  expires_at: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  bio?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  device_id?: string;
  device_name?: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  public_key: string | null;
  encrypted_private_key: string | null;
  profile_picture_url: string | null;
  bio: string | null;
  role: UserRole;
  status: string;
  is_online: boolean;
  last_seen: string | null;
  created_at: string;
}
