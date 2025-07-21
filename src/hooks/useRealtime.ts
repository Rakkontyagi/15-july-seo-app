/**
 * React hooks for real-time subscriptions
 * Provides easy-to-use hooks for managing Supabase real-time subscriptions
 */

import { useEffect, useRef, useState } from 'react';
import { 
  contentGenerationSubscription,
  projectSubscription,
  userActionsSubscription,
  connectionStateManager,
  notificationSystem,
  cleanupUtilities,
  realtimeManager,
} from '@/lib/supabase/realtime';
import type { 
  GeneratedContent, 
  Project, 
  UsageAnalytics,
  RealtimeSubscription 
} from '@/types/database';

/**
 * Hook for content generation progress
 */
export function useContentProgress(userId: string) {
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const subscriptionRef = useRef<RealtimeSubscription | null>(null);

  useEffect(() => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    // Subscribe to content progress
    const progressSubscription = contentGenerationSubscription.subscribeToContentProgress(
      userId,
      (updatedContent) => {
        setContent(updatedContent);
        setIsLoading(false);
      },
      (error) => {
        setError(error);
        setIsLoading(false);
      }
    );

    // Subscribe to new content
    const newContentSubscription = contentGenerationSubscription.subscribeToNewContent(
      userId,
      (newContent) => {
        setContent(newContent);
        setIsLoading(false);
      },
      (error) => {
        setError(error);
        setIsLoading(false);
      }
    );

    subscriptionRef.current = progressSubscription;

    return () => {
      if (progressSubscription) {
        cleanupUtilities.cleanup(progressSubscription.id);
      }
      if (newContentSubscription) {
        cleanupUtilities.cleanup(newContentSubscription.id);
      }
    };
  }, [userId]);

  return { content, isLoading, error };
}

/**
 * Hook for project updates
 */
export function useProjectUpdates(userId: string) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Project | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const subscriptionRef = useRef<RealtimeSubscription | null>(null);

  useEffect(() => {
    if (!userId) return;

    setError(null);

    // Subscribe to project updates
    const updateSubscription = projectSubscription.subscribeToProjectUpdates(
      userId,
      (updatedProject) => {
        setProjects(prev => 
          prev.map(p => p.id === updatedProject.id ? updatedProject : p)
        );
        setLastUpdate(updatedProject);
      },
      (error) => {
        setError(error);
      }
    );

    // Subscribe to new projects
    const newProjectSubscription = projectSubscription.subscribeToNewProjects(
      userId,
      (newProject) => {
        setProjects(prev => [...prev, newProject]);
        setLastUpdate(newProject);
      },
      (error) => {
        setError(error);
      }
    );

    subscriptionRef.current = updateSubscription;

    return () => {
      if (updateSubscription) {
        cleanupUtilities.cleanup(updateSubscription.id);
      }
      if (newProjectSubscription) {
        cleanupUtilities.cleanup(newProjectSubscription.id);
      }
    };
  }, [userId]);

  return { projects, lastUpdate, error };
}

/**
 * Hook for user actions/analytics
 */
export function useUserActions(userId: string) {
  const [actions, setActions] = useState<UsageAnalytics[]>([]);
  const [lastAction, setLastAction] = useState<UsageAnalytics | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const subscriptionRef = useRef<RealtimeSubscription | null>(null);

  useEffect(() => {
    if (!userId) return;

    setError(null);

    const subscription = userActionsSubscription.subscribeToUserActions(
      userId,
      (action) => {
        setActions(prev => [action, ...prev].slice(0, 100)); // Keep last 100 actions
        setLastAction(action);
      },
      (error) => {
        setError(error);
      }
    );

    subscriptionRef.current = subscription;

    return () => {
      if (subscription) {
        cleanupUtilities.cleanup(subscription.id);
      }
    };
  }, [userId]);

  return { actions, lastAction, error };
}

/**
 * Hook for connection state management
 */
export function useConnectionState() {
  const [connectionState, setConnectionState] = useState<string>('CONNECTING');
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const cleanup = connectionStateManager.onConnectionStateChange((state) => {
      setConnectionState(state);
      setIsConnected(state === 'OPEN');
      
      if (state === 'OPEN') {
        setReconnectAttempts(0);
      }
    });

    cleanupRef.current = cleanup;

    return cleanup;
  }, []);

  const reconnect = async () => {
    try {
      setReconnectAttempts(prev => prev + 1);
      await connectionStateManager.reconnect();
    } catch (error) {
      console.error('Failed to reconnect:', error);
      throw error;
    }
  };

  return { 
    connectionState, 
    isConnected, 
    reconnect, 
    reconnectAttempts 
  };
}

/**
 * Hook for notifications
 */
export function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    data?: any;
    timestamp: string;
    read?: boolean;
  }>>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const subscriptionRef = useRef<RealtimeSubscription | null>(null);

  useEffect(() => {
    if (!userId) return;

    const subscription = notificationSystem.subscribeToNotifications(
      userId,
      (notification) => {
        const notificationWithId = {
          ...notification,
          id: `${notification.type}_${Date.now()}`,
          read: false,
        };
        
        setNotifications(prev => [notificationWithId, ...prev]);
        setUnreadCount(prev => prev + 1);
      }
    );

    subscriptionRef.current = subscription;

    return () => {
      if (subscription) {
        cleanupUtilities.cleanup(subscription.id);
      }
    };
  }, [userId]);

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
    setUnreadCount(0);
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  };
}

/**
 * Hook for subscription management and cleanup
 */
export function useSubscriptionManager() {
  const [subscriptionStats, setSubscriptionStats] = useState({
    activeSubscriptions: 0,
    hasActiveConnections: false,
    connectionState: 'CLOSED',
  });

  useEffect(() => {
    const updateStats = () => {
      const stats = cleanupUtilities.getMemoryStats();
      setSubscriptionStats(stats);
    };

    // Update stats every 5 seconds
    const interval = setInterval(updateStats, 5000);
    updateStats(); // Initial update

    return () => clearInterval(interval);
  }, []);

  const cleanupAll = () => {
    cleanupUtilities.cleanupAll();
    setSubscriptionStats({
      activeSubscriptions: 0,
      hasActiveConnections: false,
      connectionState: 'CLOSED',
    });
  };

  return {
    subscriptionStats,
    cleanupAll,
    isHealthy: subscriptionStats.connectionState === 'OPEN',
  };
}

/**
 * Master hook that combines all real-time features
 */
export function useRealtimeSubscriptions(userId: string) {
  const contentProgress = useContentProgress(userId);
  const projectUpdates = useProjectUpdates(userId);
  const userActions = useUserActions(userId);
  const connectionState = useConnectionState();
  const notifications = useNotifications(userId);
  const subscriptionManager = useSubscriptionManager();

  // Global error state
  const [globalError, setGlobalError] = useState<Error | null>(null);

  useEffect(() => {
    const errors = [
      contentProgress.error,
      projectUpdates.error,
      userActions.error,
    ].filter(Boolean);

    if (errors.length > 0) {
      setGlobalError(errors[0]);
    } else {
      setGlobalError(null);
    }
  }, [contentProgress.error, projectUpdates.error, userActions.error]);

  return {
    contentProgress,
    projectUpdates,
    userActions,
    connectionState,
    notifications,
    subscriptionManager,
    globalError,
  };
}

/**
 * Hook for component cleanup
 */
export function useRealtimeCleanup() {
  useEffect(() => {
    return () => {
      cleanupUtilities.cleanupAll();
    };
  }, []);
}