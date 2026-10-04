import { create } from "zustand";
import { api, ApiError, onUnauthorized } from "@/app/api/client";
import type { User } from "@/app/api/types";

interface RegisterInput {
  email: string;
  password: string;
  name?: string | null;
  timezone?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isSubmitting: boolean;
  error: string | null;

  loadUser: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: (everywhere?: boolean) => Promise<void>;
  setUser: (user: User | null) => void;
  clearError: () => void;
}

const message = (error: unknown, fallback: string) => (error instanceof Error && error.message ? error.message : fallback);

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  isSubmitting: false,
  error: null,

  loadUser: async () => {
    try {
      const user = await api.me.get();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) console.warn("Session check failed", error);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isSubmitting: true, error: null });
    try {
      await api.auth.login(email.trim().toLowerCase(), password);
      await get().loadUser();
    } catch (error) {
      set({ error: message(error, "Ошибка входа") });
      throw error;
    } finally {
      set({ isSubmitting: false });
    }
  },

  register: async ({ email, password, name, timezone }) => {
    set({ isSubmitting: true, error: null });
    try {
      await api.auth.register({ email: email.trim().toLowerCase(), password, name: name?.trim() || null, timezone });
      await get().loadUser();
    } catch (error) {
      set({ error: message(error, "Ошибка регистрации") });
      throw error;
    } finally {
      set({ isSubmitting: false });
    }
  },

  logout: async (everywhere = false) => {
    await (everywhere ? api.auth.logoutAll() : api.auth.logout()).catch(() => undefined);
    set({ user: null, isAuthenticated: false, error: null });
  },

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  clearError: () => set({ error: null }),
}));

onUnauthorized(() => useAuthStore.getState().setUser(null));
