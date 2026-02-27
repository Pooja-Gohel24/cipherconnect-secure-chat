import api from "./api";
import type {
  AuthTokens,
  LoginPayload,
  RegisterPayload,
  UserProfile,
} from "../types/auth";

export async function registerUser(payload: RegisterPayload): Promise<void> {
  await api.post("/api/auth/register", payload);
}

export async function loginUser(payload: LoginPayload): Promise<AuthTokens> {
  const { data } = await api.post<AuthTokens>("/api/auth/login", payload);
  return data;
}

export async function refreshUserToken(refreshToken: string): Promise<AuthTokens> {
  const { data } = await api.post<AuthTokens>("/api/auth/refresh", {
    refresh_token: refreshToken,
  });
  return data;
}

export async function logoutUser(refreshToken: string): Promise<void> {
  await api.post("/api/auth/logout", { refresh_token: refreshToken });
}

export async function getCurrentUser(accessToken: string): Promise<UserProfile> {
  const { data } = await api.get<UserProfile>("/api/users/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data;
}
