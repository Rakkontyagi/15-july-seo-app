import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { type User } from '@supabase/supabase-js';
import { 
  signIn, 
  signUp, 
  signOut, 
  getUser, 
  onAuthStateChange,
  type SignInData,
  type SignUpData 
} from '@/lib/supabase/auth';

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
}

interface AuthActions {
  signIn: (data: SignInData) => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  initialize: () => Promise<void>;
}

export type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  devtools(
    (set, get) => ({
      // State
      user: null,
      loading: false,
      initialized: false,
      error: null,

      // Actions
      signIn: async (data: SignInData) => {
        try {
          set({ loading: true, error: null });
          const { user } = await signIn(data);
          set({ user, loading: false });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Sign in failed';
          set({ error: message, loading: false });
          throw error;
        }
      },

      signUp: async (data: SignUpData) => {
        try {
          set({ loading: true, error: null });
          const { user } = await signUp(data);
          set({ user, loading: false });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Sign up failed';
          set({ error: message, loading: false });
          throw error;
        }
      },

      signOut: async () => {
        try {
          set({ loading: true, error: null });
          await signOut();
          set({ user: null, loading: false });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Sign out failed';
          set({ error: message, loading: false });
          throw error;
        }
      },

      setUser: (user: User | null) => {
        set({ user });
      },

      setLoading: (loading: boolean) => {
        set({ loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      },

      initialize: async () => {
        try {
          set({ loading: true });
          
          // Get current user
          const user = await getUser();
          
          // Set up auth state listener
          onAuthStateChange((user) => {
            set({ user });
          });
          
          set({ user, loading: false, initialized: true });
        } catch (error) {
          console.error('Auth initialization failed:', error);
          set({ loading: false, initialized: true });
        }
      },
    }),
    {
      name: 'auth-store',
    }
  )
);