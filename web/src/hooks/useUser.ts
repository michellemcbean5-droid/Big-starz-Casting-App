import { useAuth } from "@/context/AuthContext";

export function useUser() {
  const { user, refreshUser, loading } = useAuth();
  return { user, refreshUser, loading };
}
