import React, { createContext, useCallback, useContext, useState } from 'react';
import { api, ApiError, ProfileResponse } from './client';

type AuthState = {
  accessToken: string | null;
  profile: ProfileResponse | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, timezone: string) => Promise<boolean>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async (token: string) => {
    const result = await api.profile(token);
    setProfile(result);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await api.login(email, password);
        setAccessToken(result.accessToken);
        await loadProfile(result.accessToken);
        return true;
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Server bilan bog'lanib bo'lmadi");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [loadProfile],
  );

  const register = useCallback(
    async (email: string, password: string, timezone: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await api.register(email, password, timezone);
        setAccessToken(result.accessToken);
        await loadProfile(result.accessToken);
        return true;
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Server bilan bog'lanib bo'lmadi");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [loadProfile],
  );

  const logout = useCallback(() => {
    setAccessToken(null);
    setProfile(null);
    setError(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!accessToken) return;
    try {
      await loadProfile(accessToken);
    } catch {
      // jim tarzda e'tiborsiz qoldiriladi — profil ekrani eski ma'lumotni ko'rsatishda davom etadi
    }
  }, [accessToken, loadProfile]);

  return (
    <AuthContext.Provider
      value={{ accessToken, profile, isLoading, error, login, register, logout, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth AuthProvider ichida ishlatilishi kerak');
  }
  return ctx;
}
