import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { translateAuthError } from '@/lib/errorMessages';

interface AuthState {
  user: any | null;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  error: null,
  signIn: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      set({ user: data.user, error: null });
      router.replace('/(app)');
    } catch (error: any) {
      set({ error: translateAuthError(error.message) });
    }
  },
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null });
    router.replace('/(auth)/login');
  },
}));