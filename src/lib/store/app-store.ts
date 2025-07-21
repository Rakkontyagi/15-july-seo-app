/**
 * Global Application Store - Zustand Implementation
 * Following ADR-006: State Management Strategy
 * 
 * This store manages global application state including:
 * - User authentication and session
 * - UI state and preferences
 * - Application-wide settings
 * - Content generation progress
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  subscription: 'free' | 'pro' | 'enterprise';
  credits: number;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  keywords: string[];
  targetAudience: string;
  industry: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GenerationProgress {
  id: string;
  projectId: string;
  status: 'idle' | 'researching' | 'analyzing' | 'generating' | 'optimizing' | 'complete' | 'error';
  progress: number; // 0-100
  currentStep: string;
  estimatedTimeRemaining?: number;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    desktop: boolean;
  };
  contentGeneration: {
    defaultWordCount: number;
    defaultTone: string;
    autoSave: boolean;
  };
}

// Store Interface
interface AppStore {
  // Authentication State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // UI State
  sidebarCollapsed: boolean;
  notifications: Notification[];
  activeModal: string | null;
  
  // Application State
  currentProject: Project | null;
  generationProgress: GenerationProgress | null;
  settings: AppSettings;
  
  // Actions - Authentication
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  
  // Actions - UI
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  setActiveModal: (modal: string | null) => void;
  
  // Actions - Application
  setCurrentProject: (project: Project | null) => void;
  setGenerationProgress: (progress: GenerationProgress | null) => void;
  updateGenerationProgress: (updates: Partial<GenerationProgress>) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  
  // Actions - Utilities
  reset: () => void;
}

// Default Settings
const defaultSettings: AppSettings = {
  theme: 'system',
  language: 'en',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  notifications: {
    email: true,
    push: true,
    desktop: false,
  },
  contentGeneration: {
    defaultWordCount: 2000,
    defaultTone: 'professional',
    autoSave: true,
  },
};

// Store Implementation
export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial State
        user: null,
        isAuthenticated: false,
        isLoading: false,
        sidebarCollapsed: false,
        notifications: [],
        activeModal: null,
        currentProject: null,
        generationProgress: null,
        settings: defaultSettings,
        
        // Authentication Actions
        setUser: (user) => set((state) => {
          state.user = user;
          state.isAuthenticated = !!user;
        }),
        
        setLoading: (loading) => set((state) => {
          state.isLoading = loading;
        }),
        
        logout: () => set((state) => {
          state.user = null;
          state.isAuthenticated = false;
          state.currentProject = null;
          state.generationProgress = null;
          state.notifications = [];
        }),
        
        // UI Actions
        toggleSidebar: () => set((state) => {
          state.sidebarCollapsed = !state.sidebarCollapsed;
        }),
        
        setSidebarCollapsed: (collapsed) => set((state) => {
          state.sidebarCollapsed = collapsed;
        }),
        
        addNotification: (notification) => set((state) => {
          const newNotification: Notification = {
            ...notification,
            id: crypto.randomUUID(),
            timestamp: new Date(),
            read: false,
          };
          state.notifications.unshift(newNotification);
          
          // Keep only last 50 notifications
          if (state.notifications.length > 50) {
            state.notifications = state.notifications.slice(0, 50);
          }
        }),
        
        markNotificationRead: (id) => set((state) => {
          const notification = state.notifications.find(n => n.id === id);
          if (notification) {
            notification.read = true;
          }
        }),
        
        removeNotification: (id) => set((state) => {
          state.notifications = state.notifications.filter(n => n.id !== id);
        }),
        
        clearNotifications: () => set((state) => {
          state.notifications = [];
        }),
        
        setActiveModal: (modal) => set((state) => {
          state.activeModal = modal;
        }),
        
        // Application Actions
        setCurrentProject: (project) => set((state) => {
          state.currentProject = project;
        }),
        
        setGenerationProgress: (progress) => set((state) => {
          state.generationProgress = progress;
        }),
        
        updateGenerationProgress: (updates) => set((state) => {
          if (state.generationProgress) {
            Object.assign(state.generationProgress, updates);
          }
        }),
        
        updateSettings: (newSettings) => set((state) => {
          Object.assign(state.settings, newSettings);
        }),
        
        // Utility Actions
        reset: () => set((state) => {
          state.user = null;
          state.isAuthenticated = false;
          state.isLoading = false;
          state.sidebarCollapsed = false;
          state.notifications = [];
          state.activeModal = null;
          state.currentProject = null;
          state.generationProgress = null;
          state.settings = defaultSettings;
        }),
      })),
      {
        name: 'seo-app-store',
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          sidebarCollapsed: state.sidebarCollapsed,
          settings: state.settings,
        }),
      }
    ),
    {
      name: 'SEO App Store',
    }
  )
);

// Selectors for optimized subscriptions
export const useUser = () => useAppStore((state) => state.user);
export const useIsAuthenticated = () => useAppStore((state) => state.isAuthenticated);
export const useNotifications = () => useAppStore((state) => state.notifications);
export const useUnreadNotifications = () => useAppStore((state) => 
  state.notifications.filter(n => !n.read)
);
export const useCurrentProject = () => useAppStore((state) => state.currentProject);
export const useGenerationProgress = () => useAppStore((state) => state.generationProgress);
export const useSettings = () => useAppStore((state) => state.settings);
export const useTheme = () => useAppStore((state) => state.settings.theme);

// Action selectors
export const useAppActions = () => useAppStore((state) => ({
  setUser: state.setUser,
  logout: state.logout,
  addNotification: state.addNotification,
  setCurrentProject: state.setCurrentProject,
  updateSettings: state.updateSettings,
}));
