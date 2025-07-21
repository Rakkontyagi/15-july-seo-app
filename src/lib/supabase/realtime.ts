/**
 * Real-time subscription management for Supabase
 * Handles live updates for content generation progress and user actions
 */

import { createClient } from './client';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { 
  User, 
  Project, 
  GeneratedContent, 
  UsageAnalytics,
  RealtimeEvent,
  RealtimeSubscription 
} from '@/types/database';

// Initialize Supabase client
const supabase = createClient();

// Active subscriptions registry
const activeSubscriptions = new Map<string, RealtimeChannel>();

// Subscription cleanup registry
const subscriptionCleanups = new Map<string, (() => void)[]>();

/**
 * Real-time subscription manager
 */
export class RealtimeSubscriptionManager {
  private static instance: RealtimeSubscriptionManager;
  private subscriptions: Map<string, RealtimeChannel> = new Map();
  private cleanupHandlers: Map<string, (() => void)[]> = new Map();

  static getInstance(): RealtimeSubscriptionManager {
    if (!RealtimeSubscriptionManager.instance) {
      RealtimeSubscriptionManager.instance = new RealtimeSubscriptionManager();
    }
    return RealtimeSubscriptionManager.instance;
  }

  /**
   * Subscribe to table changes
   */
  subscribe<T>(
    table: string,
    event: 'INSERT' | 'UPDATE' | 'DELETE' | '*',
    callback: (payload: RealtimePostgresChangesPayload<T>) => void,
    filter?: string
  ): RealtimeSubscription {
    const subscriptionId = `${table}_${event}_${filter || 'all'}_${Date.now()}`;
    
    let channel = this.subscriptions.get(table);
    
    if (!channel) {
      channel = supabase
        .channel(`${table}_changes`)
        .on(
          'postgres_changes',
          {
            event: event,
            schema: 'public',
            table: table,
            filter: filter,
          },
          callback
        );
      
      this.subscriptions.set(table, channel);
    }

    // Subscribe to channel
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`✅ Successfully subscribed to ${table} changes`);
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`❌ Error subscribing to ${table} changes`);
      }
    });

    // Add cleanup handler
    const cleanup = () => {
      if (channel) {
        channel.unsubscribe();
        this.subscriptions.delete(table);
      }
    };

    const cleanups = this.cleanupHandlers.get(subscriptionId) || [];
    cleanups.push(cleanup);
    this.cleanupHandlers.set(subscriptionId, cleanups);

    return {
      id: subscriptionId,
      table,
      event,
      callback,
    };
  }

  /**
   * Unsubscribe from a specific subscription
   */
  unsubscribe(subscriptionId: string): void {
    const cleanups = this.cleanupHandlers.get(subscriptionId);
    if (cleanups) {
      cleanups.forEach(cleanup => cleanup());
      this.cleanupHandlers.delete(subscriptionId);
    }
  }

  /**
   * Unsubscribe from all subscriptions
   */
  unsubscribeAll(): void {
    this.subscriptions.forEach((channel, table) => {
      channel.unsubscribe();
      console.log(`🔌 Unsubscribed from ${table} changes`);
    });
    
    this.subscriptions.clear();
    this.cleanupHandlers.clear();
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): 'CONNECTING' | 'OPEN' | 'CLOSING' | 'CLOSED' {
    return supabase.realtime.connection?.readyState === 0 ? 'CONNECTING' :
           supabase.realtime.connection?.readyState === 1 ? 'OPEN' :
           supabase.realtime.connection?.readyState === 2 ? 'CLOSING' :
           'CLOSED';
  }

  /**
   * Check if any subscriptions are active
   */
  hasActiveSubscriptions(): boolean {
    return this.subscriptions.size > 0;
  }

  /**
   * Get active subscription count
   */
  getActiveSubscriptionCount(): number {
    return this.subscriptions.size;
  }
}

// Export singleton instance
export const realtimeManager = RealtimeSubscriptionManager.getInstance();

/**
 * Content generation progress subscription
 */
export const contentGenerationSubscription = {
  /**
   * Subscribe to content generation progress updates
   */
  subscribeToContentProgress(
    userId: string,
    onProgress: (content: GeneratedContent) => void,
    onError?: (error: Error) => void
  ): RealtimeSubscription {
    return realtimeManager.subscribe(
      'generated_content',
      'UPDATE',
      (payload) => {
        try {
          const content = payload.new as GeneratedContent;
          if (content.user_id === userId) {
            onProgress(content);
          }
        } catch (error) {
          console.error('Error processing content progress:', error);
          if (onError) {
            onError(error instanceof Error ? error : new Error('Unknown error'));
          }
        }
      },
      `user_id=eq.${userId}`
    );
  },

  /**
   * Subscribe to new content creation
   */
  subscribeToNewContent(
    userId: string,
    onNewContent: (content: GeneratedContent) => void,
    onError?: (error: Error) => void
  ): RealtimeSubscription {
    return realtimeManager.subscribe(
      'generated_content',
      'INSERT',
      (payload) => {
        try {
          const content = payload.new as GeneratedContent;
          if (content.user_id === userId) {
            onNewContent(content);
          }
        } catch (error) {
          console.error('Error processing new content:', error);
          if (onError) {
            onError(error instanceof Error ? error : new Error('Unknown error'));
          }
        }
      },
      `user_id=eq.${userId}`
    );
  },
};

/**
 * Project updates subscription
 */
export const projectSubscription = {
  /**
   * Subscribe to project updates
   */
  subscribeToProjectUpdates(
    userId: string,
    onProjectUpdate: (project: Project) => void,
    onError?: (error: Error) => void
  ): RealtimeSubscription {
    return realtimeManager.subscribe(
      'projects',
      'UPDATE',
      (payload) => {
        try {
          const project = payload.new as Project;
          if (project.user_id === userId) {
            onProjectUpdate(project);
          }
        } catch (error) {
          console.error('Error processing project update:', error);
          if (onError) {
            onError(error instanceof Error ? error : new Error('Unknown error'));
          }
        }
      },
      `user_id=eq.${userId}`
    );
  },

  /**
   * Subscribe to new project creation
   */
  subscribeToNewProjects(
    userId: string,
    onNewProject: (project: Project) => void,
    onError?: (error: Error) => void
  ): RealtimeSubscription {
    return realtimeManager.subscribe(
      'projects',
      'INSERT',
      (payload) => {
        try {
          const project = payload.new as Project;
          if (project.user_id === userId) {
            onNewProject(project);
          }
        } catch (error) {
          console.error('Error processing new project:', error);
          if (onError) {
            onError(error instanceof Error ? error : new Error('Unknown error'));
          }
        }
      },
      `user_id=eq.${userId}`
    );
  },
};

/**
 * User actions subscription
 */
export const userActionsSubscription = {
  /**
   * Subscribe to user analytics/actions
   */
  subscribeToUserActions(
    userId: string,
    onUserAction: (action: UsageAnalytics) => void,
    onError?: (error: Error) => void
  ): RealtimeSubscription {
    return realtimeManager.subscribe(
      'usage_analytics',
      'INSERT',
      (payload) => {
        try {
          const action = payload.new as UsageAnalytics;
          if (action.user_id === userId) {
            onUserAction(action);
          }
        } catch (error) {
          console.error('Error processing user action:', error);
          if (onError) {
            onError(error instanceof Error ? error : new Error('Unknown error'));
          }
        }
      },
      `user_id=eq.${userId}`
    );
  },
};

/**
 * Connection state management
 */
export const connectionStateManager = {
  /**
   * Monitor connection state
   */
  onConnectionStateChange(callback: (state: string) => void): () => void {
    const handleStateChange = (state: string) => {
      console.log(`🔗 Realtime connection state changed: ${state}`);
      callback(state);
    };

    // Listen to connection state changes
    supabase.realtime.onOpen = () => handleStateChange('OPEN');
    supabase.realtime.onClose = () => handleStateChange('CLOSED');
    supabase.realtime.onError = (error) => {
      console.error('Realtime connection error:', error);
      handleStateChange('ERROR');
    };

    // Return cleanup function
    return () => {
      supabase.realtime.onOpen = undefined;
      supabase.realtime.onClose = undefined;
      supabase.realtime.onError = undefined;
    };
  },

  /**
   * Check if connection is healthy
   */
  isConnected(): boolean {
    return realtimeManager.getConnectionStatus() === 'OPEN';
  },

  /**
   * Reconnect if needed
   */
  async reconnect(): Promise<void> {
    if (!this.isConnected()) {
      console.log('🔄 Attempting to reconnect to Supabase Realtime...');
      try {
        await supabase.realtime.connect();
        console.log('✅ Successfully reconnected to Supabase Realtime');
      } catch (error) {
        console.error('❌ Failed to reconnect to Supabase Realtime:', error);
        throw error;
      }
    }
  },
};

/**
 * Real-time notification system
 */
export const notificationSystem = {
  /**
   * Create a notification subscription for user
   */
  subscribeToNotifications(
    userId: string,
    onNotification: (notification: {
      type: string;
      title: string;
      message: string;
      data?: any;
      timestamp: string;
    }) => void
  ): RealtimeSubscription {
    // Subscribe to various events that should trigger notifications
    return realtimeManager.subscribe(
      'generated_content',
      'UPDATE',
      (payload) => {
        const content = payload.new as GeneratedContent;
        if (content.user_id === userId && content.status === 'published') {
          onNotification({
            type: 'content_completed',
            title: 'Content Generated',
            message: `Your content "${content.title}" has been generated successfully!`,
            data: { contentId: content.id },
            timestamp: new Date().toISOString(),
          });
        }
      },
      `user_id=eq.${userId}`
    );
  },
};

/**
 * Cleanup utilities
 */
export const cleanupUtilities = {
  /**
   * Clean up all subscriptions on component unmount
   */
  cleanupAll(): void {
    realtimeManager.unsubscribeAll();
    console.log('🧹 All realtime subscriptions cleaned up');
  },

  /**
   * Clean up specific subscription
   */
  cleanup(subscriptionId: string): void {
    realtimeManager.unsubscribe(subscriptionId);
    console.log(`🧹 Cleaned up subscription: ${subscriptionId}`);
  },

  /**
   * Get memory usage stats
   */
  getMemoryStats(): {
    activeSubscriptions: number;
    hasActiveConnections: boolean;
    connectionState: string;
  } {
    return {
      activeSubscriptions: realtimeManager.getActiveSubscriptionCount(),
      hasActiveConnections: realtimeManager.hasActiveSubscriptions(),
      connectionState: realtimeManager.getConnectionStatus(),
    };
  },
};

// Export all subscription utilities
export {
  realtimeManager,
  contentGenerationSubscription,
  projectSubscription,
  userActionsSubscription,
  connectionStateManager,
  notificationSystem,
  cleanupUtilities,
};