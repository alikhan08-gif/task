import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { api, ApiError, CreateTaskInput, Task } from './client';
import { useAuth } from './AuthContext';

// Telegram botdagi "Bajarildi" tugmasi vazifani serverda o'zgartiradi, lekin
// ilovaga hech qanday push yubormaydi — shuning uchun ilova holatini serverga
// muntazam moslashtirib turamiz (fon rejimidan qaytganda ham darhol).
const POLL_INTERVAL_MS = 15000;

type TasksState = {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createTask: (input: CreateTaskInput) => Promise<boolean>;
  updateTask: (id: string, input: Partial<CreateTaskInput>) => Promise<boolean>;
  completeTask: (id: string) => Promise<boolean>;
  deleteTask: (id: string) => Promise<boolean>;
};

const TasksContext = createContext<TasksState | null>(null);

export function TasksProvider({ children }: { children: React.ReactNode }) {
  const { accessToken, refreshProfile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.listTasks();
      setTasks(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Vazifalarni yuklab bo'lmadi");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  // Fon rejimida (poll/AppState) ishlatiladi: ro'yxatni yangilaydi, lekin
  // yuklanish indikatorini ko'rsatmaydi — ekranda "yaltillash" bo'lmasligi uchun.
  const silentRefresh = useCallback(async () => {
    if (!accessToken) return;
    try {
      const result = await api.listTasks();
      setTasks(result);
      refreshProfile();
    } catch {
      // Fon yangilanishida xatoni ko'rsatmaymiz — keyingi urinishda tuzaladi.
    }
  }, [accessToken, refreshProfile]);

  useEffect(() => {
    if (accessToken) {
      refresh();
    } else {
      setTasks([]);
    }
  }, [accessToken, refresh]);

  const silentRefreshRef = useRef(silentRefresh);
  silentRefreshRef.current = silentRefresh;

  useEffect(() => {
    if (!accessToken) return;

    const interval = setInterval(() => {
      silentRefreshRef.current();
    }, POLL_INTERVAL_MS);

    const subscription = AppState.addEventListener(
      'change',
      (state: AppStateStatus) => {
        if (state === 'active') {
          silentRefreshRef.current();
        }
      },
    );

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [accessToken]);

  const createTask = useCallback(
    async (input: CreateTaskInput) => {
      if (!accessToken) return false;
      setError(null);
      try {
        const created = await api.createTask(input);
        setTasks((prev) => [...prev, created]);
        return true;
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Vazifa yaratib bo'lmadi");
        return false;
      }
    },
    [accessToken],
  );

  const updateTask = useCallback(
    async (id: string, input: Partial<CreateTaskInput>) => {
      if (!accessToken) return false;
      setError(null);
      try {
        const updated = await api.updateTask(id, input);
        setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
        return true;
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Vazifani saqlab bo'lmadi");
        return false;
      }
    },
    [accessToken],
  );

  const completeTask = useCallback(
    async (id: string) => {
      if (!accessToken) return false;
      setError(null);
      try {
        const updated = await api.completeTask(id);
        setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
        refreshProfile();
        return true;
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Vazifani bajarib bo'lmadi");
        return false;
      }
    },
    [accessToken, refreshProfile],
  );

  const deleteTask = useCallback(
    async (id: string) => {
      if (!accessToken) return false;
      setError(null);
      try {
        await api.deleteTask(id);
        setTasks((prev) => prev.filter((t) => t.id !== id));
        return true;
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Vazifani o'chirib bo'lmadi");
        return false;
      }
    },
    [accessToken],
  );

  return (
    <TasksContext.Provider
      value={{ tasks, isLoading, error, refresh, createTask, updateTask, completeTask, deleteTask }}
    >
      {children}
    </TasksContext.Provider>
  );
}

export function useTasks() {
  const ctx = useContext(TasksContext);
  if (!ctx) {
    throw new Error('useTasks TasksProvider ichida ishlatilishi kerak');
  }
  return ctx;
}
