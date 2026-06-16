import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';

export interface UserProfile {
  user_id: string;
  email: string;
  display_name?: string;
  onboarding_complete: boolean;
}

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isInitialized: boolean;
  
  // Actions
  setSession: (session: Session | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setInitialized: (status: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  profile: null,
  isInitialized: false,

  setSession: (session) => set({ session, user: session?.user ?? null }),
  setProfile: (profile) => set({ profile }),
  setInitialized: (status) => set({ isInitialized: status }),
  clearAuth: () => set({ session: null, user: null, profile: null }),
}));
