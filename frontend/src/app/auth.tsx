import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import type { User } from "./api/types";

interface AuthState {
  user: User | null | undefined;
  reload: () => Promise<void>;
  setUser: (user: User | null) => void;
  logout: (everywhere?: boolean) => Promise<void>;
}

export function useAuth(): AuthState {
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const reload = useAuthStore((state) => state.loadUser);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);
  return { user: isLoading ? undefined : user, reload, setUser, logout };
}

export function useUser(): User {
  const user = useAuthStore((state) => state.user);
  if (!user) throw new Error("useUser called without a session");
  return user;
}

export function useSignOut() {
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  return async (everywhere = false) => {
    await logout(everywhere);
    navigate("/", { replace: true });
  };
}
