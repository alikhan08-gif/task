import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, ApiError, ProfileResponse } from './client';
import { tokenStore } from './tokenStore';

type AuthState = {
  accessToken: string | null;
  profile: ProfileResponse | null;
  isLoading: boolean;
  isBootstrapping: boolean;
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
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    const result = await api.profile();
    setProfile(result);
  }, []);

  useEffect(() => {
    return tokenStore.subscribe((tokens) => {
      setAccessToken(tokens?.accessToken ?? null);
      if (!tokens) {
        setProfile(null);
      }
    });
  }, []);

  // Ilova ochilganda saqlangan sessiyani tiklashga urinadi. Agar access token
  // eskirgan bo'lsa ham, api.profile() ichidagi authedRequest uni avtomatik
  // yangilaydi — shuning uchun bu yerda alohida refresh chaqirish shart emas.
  // tokenStore.load() o'zi ham tinglovchilarni xabardor qiladi (yuqoridagi
  // subscribe orqali accessToken darhol yangilanadi).
  useEffect(() => {
    (async () => {
      const stored = await tokenStore.load();
      if (stored) {
        try {
          await loadProfile();
        } catch {
          await tokenStore.set(null);
        }
      }
      setIsBootstrapping(false);
    })();
  }, [loadProfile]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.login(email, password);
      await tokenStore.set({ accessToken: result.accessToken, refreshToken: result.refreshToken });
      await loadProfile();
      return true;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Server bilan bog'lanib bo'lmadi");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [loadProfile]);

  const register = useCallback(
    async (email: string, password: string, timezone: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await api.register(email, password, timezone);
        await tokenStore.set({ accessToken: result.accessToken, refreshToken: result.refreshToken });
        await loadProfile();
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
    tokenStore.set(null);
    setError(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!tokenStore.current) return;
    try {
      await loadProfile();
    } catch {
      // jim tarzda e'tiborsiz qoldiriladi — profil ekrani eski ma'lumotni ko'rsatishda davom etadi
    }
  }, [loadProfile]);

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        profile,
        isLoading,
        isBootstrapping,
        error,
        login,
        register,
        logout,
        refreshProfile,
      }}
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
