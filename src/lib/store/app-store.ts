/**
 * Global Application Store
 * Implements Quinn's recommendation for Zustand-based state management
 * Provides centralized state for authentication, subscription, and UI state
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';

// Types
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  tier: 'free' | 'trial' | 'professional' | 'enterprise';
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  stripe_subscription_id?: string;
}

export interface UsageStats {
  user_id: string;
  current_usage: number;
  usage_limit: number;
  reset_date: string;
  overage_count: number;
}

export interface GenerationProgress {
  id: string;
  stage: string;
  label: string;
  currentStep: number;
  totalSteps: number;
  percentage: number;
  estimatedTimeRemaining: number;
  startTime: number;
  error?: string;
}

export interface AppNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Store Interface
interface AppState {
  // Authentication State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Subscription State
  subscription: UserSubscription | null;
  usageStats: UsageStats | null;
  canGenerateContent: boolean;
  
  // UI State
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  notifications: AppNotification[];
  
  // Content Generation State
  activeGenerations: Map<string, GenerationProgress>;
  
  // Actions
  setUser: (user: User | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setLoading: (loading: boolean) => void;
  setSubscription: (subscription: UserSubscription | null) => void;
  setUsageStats: (stats: UsageStats | null) => void;
  updateUsageStats: (updates: Partial<UsageStats>) => void;
  
  // UI Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  
  // Notification Actions
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
  
  // Content Generation Actions
  addGeneration: (id: string, progress: GenerationProgress) => void;
  updateGeneration: (id: string, updates: Partial<GenerationProgress>) => void;
  removeGeneration: (id: string) => void;
  clearCompletedGenerations: () => void;
  
  // Utility Actions
  reset: () => void;
}

// Initial State
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  subscription: null,
  usageStats: null,
  canGenerateContent: true,
  sidebarOpen: true,
  theme: 'system' as const,
  notifications: [],
  activeGenerations: new Map(),
};

// Create Store with Persistence
export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        // Authentication Actions
        setUser: (user) => {
          set({ user, isAuthenticated: !!user }, false, 'setUser');
        },
        
        setAuthenticated: (authenticated) => {
          set({ isAuthenticated: authenticated }, false, 'setAuthenticated');
        },
        
        setLoading: (loading) => {
          set({ isLoading: loading }, false, 'setLoading');
        },
        
        // Subscription Actions
        setSubscription: (subscription) => {
          set({ subscription }, false, 'setSubscription');
        },
        
        setUsageStats: (usageStats) => {
          set({ usageStats }, false, 'setUsageStats');
        },
        
        updateUsageStats: (updates) => {
          const currentStats = get().usageStats;
          if (currentStats) {
            set(
              { usageStats: { ...currentStats, ...updates } },
              false,
              'updateUsageStats'
            );
          }
        },
        
        // UI Actions
        toggleSidebar: () => {
          set((state) => ({ sidebarOpen: !state.sidebarOpen }), false, 'toggleSidebar');
        },
        
        setSidebarOpen: (open) => {
          set({ sidebarOpen: open }, false, 'setSidebarOpen');
        },
        
        setTheme: (theme) => {
          set({ theme }, false, 'setTheme');
          
          // Apply theme to document
          if (typeof window !== 'undefined') {
            const root = window.document.documentElement;
            root.classList.remove('light', 'dark');
            
            if (theme === 'system') {
              const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
                ? 'dark'
                : 'light';
              root.classList.add(systemTheme);
            } else {
              root.classList.add(theme);
            }
          }
        },
        
        // Notification Actions
        addNotification: (notification) => {
          const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const newNotification: AppNotification = {
            ...notification,
            id,
            timestamp: Date.now(),
            read: false,
          };
          
          set(
            (state) => ({
              notifications: [newNotification, ...state.notifications],
            }),
            false,
            'addNotification'
          );
          
          // Auto-remove info notifications after 5 seconds
          if (notification.type === 'info') {
            setTimeout(() => {
              get().removeNotification(id);
            }, 5000);
          }
        },
        
        removeNotification: (id) => {
          set(
            (state) => ({
              notifications: state.notifications.filter((n) => n.id !== id),
            }),
            false,
            'removeNotification'
          );
        },
        
        markNotificationRead: (id) => {
          set(
            (state) => ({
              notifications: state.notifications.map((n) =>
                n.id === id ? { ...n, read: true } : n
              ),
            }),
            false,
            'markNotificationRead'
          );
        },
        
        clearAllNotifications: () => {
          set({ notifications: [] }, false, 'clearAllNotifications');
        },
        
        // Content Generation Actions
        addGeneration: (id, progress) => {
          set(
            (state) => {
              const newGenerations = new Map(state.activeGenerations);
              newGenerations.set(id, progress);
              return { activeGenerations: newGenerations };
            },
            false,
            'addGeneration'
          );
        },
        
        updateGeneration: (id, updates) => {
          set(
            (state) => {
              const newGenerations = new Map(state.activeGenerations);
              const existing = newGenerations.get(id);
              if (existing) {
                newGenerations.set(id, { ...existing, ...updates });
              }
              return { activeGenerations: newGenerations };
            },
            false,
            'updateGeneration'
          );
        },
        
        removeGeneration: (id) => {
          set(
            (state) => {
              const newGenerations = new Map(state.activeGenerations);
              newGenerations.delete(id);
              return { activeGenerations: newGenerations };
            },
            false,
            'removeGeneration'
          );
        },
        
        clearCompletedGenerations: () => {
          set(
            (state) => {
              const newGenerations = new Map();
              state.activeGenerations.forEach((progress, id) => {
                if (progress.percentage < 100 && !progress.error) {
                  newGenerations.set(id, progress);
                }
              });
              return { activeGenerations: newGenerations };
            },
            false,
            'clearCompletedGenerations'
          );
        },
        
        // Utility Actions
        reset: () => {
          set(initialState, false, 'reset');
        },
      }),
      {
        name: 'app-store',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          // Only persist certain parts of the state
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          subscription: state.subscription,
          usageStats: state.usageStats,
          sidebarOpen: state.sidebarOpen,
          theme: state.theme,
          // Don't persist notifications and active generations
        }),
        version: 1,
        migrate: (persistedState: any, version: number) => {
          // Handle state migrations if needed
          if (version === 0) {
            // Migration from version 0 to 1
            return {
              ...persistedState,
              theme: persistedState.theme || 'system',
            };
          }
          return persistedState;
        },
      }
    ),
    {
      name: 'app-store',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

// Selectors for optimized re-renders
export const useUser = () => useAppStore((state) => state.user);
export const useIsAuthenticated = () => useAppStore((state) => state.isAuthenticated);
export const useSubscription = () => useAppStore((state) => state.subscription);
export const useUsageStats = () => useAppStore((state) => state.usageStats);
export const useTheme = () => useAppStore((state) => state.theme);
export const useNotifications = () => useAppStore((state) => state.notifications);
export const useActiveGenerations = () => useAppStore((state) => state.activeGenerations);

// Computed selectors
export const useUnreadNotificationCount = () =>
  useAppStore((state) => state.notifications.filter((n) => !n.read).length);

export const useIsUsageLimitReached = () =>
  useAppStore((state) => {
    const stats = state.usageStats;
    return stats ? stats.current_usage >= stats.usage_limit : false;
  });

export const useCanGenerateContent = () =>
  useAppStore((state) => {
    const subscription = state.subscription;
    const stats = state.usageStats;
    
    if (!subscription || !stats) return false;
    
    // Check if subscription is active
    if (subscription.status !== 'active' && subscription.status !== 'trialing') {
      return false;
    }
    
    // Check usage limits
    return stats.current_usage < stats.usage_limit;
  });
