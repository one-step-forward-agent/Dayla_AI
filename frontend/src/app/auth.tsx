import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, ApiError, onUnauthorized } from "./api/client";
import type { User } from "./api/types";

interface AuthState {
  /** undefined while the session is being checked, null when logged out. */
  user: User | null | undefined;
  reload: () => Promise<void>;
  setUser: (user: User | null) => void;
  logout: (everywhere?: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  const reload = useCallback(async () => {
    try {
      setUser(await api.me.get());
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) setUser(null);
      else throw error;
    }
  }, []);

  const logout = useCallback(async (everywhere = false) => {
    await (everywhere ? api.auth.logoutAll() : api.auth.logout()).catch(() => undefined);
    setUser(null);
  }, []);

  useEffect(() => {
    onUnauthorized(() => setUser(null));
    reload().catch(() => setUser(null));
  }, [reload]);

  return <AuthContext.Provider value={{ user, reload, setUser, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const state = useContext(AuthContext);
  if (!state) throw new Error("useAuth must be used inside AuthProvider");
  return state;
}

/** The logged-in user; only for pages rendered behind the auth guard. */
export function useUser(): User {
  const { user } = useAuth();
  if (!user) throw new Error("useUser called without a session");
  return user;
}
