import { createContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { getCurrentUser, loginUser, logoutUser, registerUser } from "../services/auth";
import type { LoginPayload, RegisterPayload, UserProfile } from "../types/auth";

interface AuthContextValue {
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  register: (payload: RegisterPayload) => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

const ACCESS_KEY = "cipherconnect_access_token";
const REFRESH_KEY = "cipherconnect_refresh_token";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [accessToken, setAccessToken] = useState<string | null>(localStorage.getItem(ACCESS_KEY));
  const [refreshToken, setRefreshToken] = useState<string | null>(localStorage.getItem(REFRESH_KEY));
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const persistTokens = (access: string, refresh: string) => {
    setAccessToken(access);
    setRefreshToken(refresh);
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  };

  const clearAuth = () => {
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  };

  const loadMe = async (token: string | null) => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const me = await getCurrentUser(token);
      setUser(me);
    } catch {
      clearAuth();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMe(accessToken);
  }, []);

  const register = async (payload: RegisterPayload) => {
    await registerUser(payload);
  };

  const login = async (payload: LoginPayload) => {
    const tokens = await loginUser(payload);
    persistTokens(tokens.access_token, tokens.refresh_token);
    const me = await getCurrentUser(tokens.access_token);
    setUser(me);
  };

  const logout = async () => {
    try {
      if (refreshToken) {
        await logoutUser(refreshToken);
      }
    } finally {
      clearAuth();
    }
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      refreshToken,
      loading,
      register,
      login,
      logout,
    }),
    [user, accessToken, refreshToken, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
