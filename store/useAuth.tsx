import { create } from "zustand";
import { persist } from "zustand/middleware";

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  otherName?: string;
  username?: string;
  phoneNumber?: string;
  image?: string | null;
  dob?: string | null;
  createdAt?: string | null;
  roles: { id: string; name: string; label: string }[];
  role?: string | null;
  adminPosition?: string | null;
  adminModules?: string[];
  accountStatus: "ACTIVE" | "PENDING" | "SUSPENDED" | "REJECTED" | "BANNED";
} | null;

type AuthState = {
  user: User;
  setUser: (user: User) => void;
  clearUser: () => void;
  _hasHydrated: boolean; // ✅ added
  setHasHydrated: (hasHydrated: boolean) => void; // ✅ added
};

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      currentRole: null,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
      _hasHydrated: false,
      setHasHydrated: (hasHydrated) => set({ _hasHydrated: hasHydrated }),
    }),
    {
      name: "auth-user",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
