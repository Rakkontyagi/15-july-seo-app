/**
 * Analytics Tracking System
 * Comprehensive user analytics and event tracking for production
 */

import { monitoringManager } from './production-monitoring-manager';
import { logger } from '@/lib/logging/logger';

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  timestamp: number;
  page?: string;
  userAgent?: string;
  ip?: string;
}

interface UserSession {
  sessionId: string;
  userId?: string;
  startTime: number;
  lastActivity: number;
  pageViews: number;
  events: AnalyticsEvent[];
  device?: string;
  browser?: string;
  country?: string;
  referrer?: string;
}

interface ConversionFunnel {
  name: string;
  steps: string[];
  conversions: Record<string, number>;
  dropoffs: Record<string, number>;
}

interface AnalyticsMetrics {
  timestamp: number;
  activeUsers: number;
  pageViews: number;
  sessions: number;
  bounceRate: number;
  avgSessionDuration: number;
  conversionRate: number;
  topPages: Array<{ page: string; views: number }>;
  topEvents: Array<{ event: string; count: number }>;
  userFlow: ConversionFunnel[];
}

export class AnalyticsTracker {
  private static instance: AnalyticsTracker;
  private sessions: Map<string, UserSession> = new Map();
  private events: AnalyticsEvent[] = [];
  private conversionFunnels: Map<string, ConversionFunnel> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private analyticsInterval: NodeJS.Timeout | null = null;
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private readonly EVENTS_BUFFER_SIZE = 1000;

  static getInstance(): AnalyticsTracker {
    if (!AnalyticsTracker.instance) {
      AnalyticsTracker.instance = new AnalyticsTracker();
    }
    return AnalyticsTracker.instance;
  }

  constructor() {
    this.initializeConversionFunnels();
    this.startPeriodicTasks();
  }

  private initializeConversionFunnels(): void {
    // SEO Content Generation Funnel
    this.conversionFunnels.set('content-generation', {
      name: 'Content Generation',
      steps: [
        'keyword_search',
        'serp_analysis',
        'content_generation_start',
        'content_generated',
        'content_published'
      ],
      conversions: {},
      dropoffs: {},
    });

    // User Onboarding Funnel
    this.conversionFunnels.set('user-onboarding', {
      name: 'User Onboarding',
      steps: [
        'landing_page_view',
        'signup_start',
        'email_verified',
        'profile_completed',
        'first_project_created'
      ],
      conversions: {},
      dropoffs: {},
    });

    // Project Workflow Funnel
    this.conversionFunnels.set('project-workflow', {
      name: 'Project Workflow',
      steps: [
        'project_created',
        'keywords_added',
        'competitors_analyzed',
        'content_generated',
        'cms_connected'
      ],
      conversions: {},
      dropoffs: {},
    });
  }

  /**
   * Track page view
   */
  trackPageView(
    page: string,
    userId?: string,
    sessionId?: string,
    metadata?: Record<string, any>
  ): void {
    const event: AnalyticsEvent = {
      name: 'page_view',
      properties: {
        page,
        ...metadata,
      },
      userId,
      sessionId: sessionId || this.generateSessionId(),
      timestamp: Date.now(),
      page,
    };

    this.recordEvent(event);
    this.updateSession(event);

    // Track with monitoring manager
    monitoringManager.trackEvent('page_view', { page }, userId);

    logger.info('Page View', {
      page,
      userId,
      sessionId: event.sessionId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track custom event
   */
  trackEvent(
    eventName: string,
    properties?: Record<string, any>,
    userId?: string,
    sessionId?: string
  ): void {
    const event: AnalyticsEvent = {
      name: eventName,
      properties,
      userId,
      sessionId: sessionId || this.generateSessionId(),
      timestamp: Date.now(),
    };

    this.recordEvent(event);
    this.updateSession(event);
    this.updateConversionFunnels(event);

    // Track with monitoring manager
    monitoringManager.trackEvent(eventName, properties, userId);

    logger.info('Analytics Event', {
      event: eventName,
      properties,
      userId,
      sessionId: event.sessionId,
    });
  }

  /**
   * Track user action
   */
  trackUserAction(
    action: string,
    target: string,
    userId?: string,
    sessionId?: string,
    metadata?: Record<string, any>
  ): void {
    this.trackEvent('user_action', {
      action,
      target,
      ...metadata,
    }, userId, sessionId);
  }

  /**
   * Track performance metric
   */
  trackPerformance(
    metric: string,
    value: number,
    tags?: Record<string, string>
  ): void {
    const event: AnalyticsEvent = {
      name: 'performance_metric',
      properties: {
        metric,
        value,
        tags,
      },
      timestamp: Date.now(),
    };

    this.recordEvent(event);
    
    // Track with monitoring manager
    monitoringManager.trackPerformance(metric, value, tags);

    logger.info('Performance Metric', {
      metric,
      value,
      tags,
    });
  }

  /**
   * Track conversion
   */
  trackConversion(
    funnelName: string,
    step: string,
    userId?: string,
    sessionId?: string,
    value?: number
  ): void {
    this.trackEvent('conversion', {
      funnel: funnelName,
      step,
      value,
    }, userId, sessionId);
  }

  /**
   * Track error
   */
  trackError(
    error: Error,
    context?: Record<string, any>,
    userId?: string,
    sessionId?: string
  ): void {
    const event: AnalyticsEvent = {
      name: 'error',
      properties: {
        message: error.message,
        stack: error.stack,
        name: error.name,
        context,
      },
      userId,
      sessionId,
      timestamp: Date.now(),
    };

    this.recordEvent(event);

    logger.error('Analytics Error', {
      error: error.message,
      stack: error.stack,
      context,
      userId,
      sessionId,
    });
  }

  /**
   * Start user session
   */
  startSession(
    sessionId?: string,
    userId?: string,
    metadata?: Record<string, any>
  ): string {
    const id = sessionId || this.generateSessionId();
    
    const session: UserSession = {
      sessionId: id,
      userId,
      startTime: Date.now(),
      lastActivity: Date.now(),
      pageViews: 0,
      events: [],
      device: metadata?.device,
      browser: metadata?.browser,
      country: metadata?.country,
      referrer: metadata?.referrer,
    };

    this.sessions.set(id, session);

    this.trackEvent('session_start', {
      sessionId: id,
      ...metadata,
    }, userId, id);

    return id;
  }

  /**
   * End user session
   */
  endSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return;
    }

    const duration = Date.now() - session.startTime;
    
    this.trackEvent('session_end', {
      sessionId,
      duration,
      pageViews: session.pageViews,
      eventCount: session.events.length,
    }, session.userId, sessionId);

    this.sessions.delete(sessionId);
  }

  /**
   * Get session data
   */
  getSession(sessionId: string): UserSession | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Get analytics metrics
   */
  getAnalyticsMetrics(hours: number = 24): AnalyticsMetrics {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    const recentEvents = this.events.filter(event => event.timestamp > cutoff);
    const recentSessions = Array.from(this.sessions.values())
      .filter(session => session.startTime > cutoff);

    // Calculate metrics
    const activeUsers = new Set(recentEvents.map(e => e.userId).filter(Boolean)).size;
    const pageViews = recentEvents.filter(e => e.name === 'page_view').length;
    const sessions = recentSessions.length;
    
    // Bounce rate (sessions with only 1 page view)
    const singlePageSessions = recentSessions.filter(s => s.pageViews <= 1).length;
    const bounceRate = sessions > 0 ? (singlePageSessions / sessions) * 100 : 0;

    // Average session duration
    const totalDuration = recentSessions.reduce((sum, s) => 
      sum + (s.lastActivity - s.startTime), 0
    );
    const avgSessionDuration = sessions > 0 ? totalDuration / sessions : 0;

    // Conversion rate
    const conversions = recentEvents.filter(e => e.name === 'conversion').length;
    const conversionRate = sessions > 0 ? (conversions / sessions) * 100 : 0;

    // Top pages
    const pageViewEvents = recentEvents.filter(e => e.name === 'page_view');
    const pageCountMap = new Map<string, number>();
    pageViewEvents.forEach(event => {
      const page = event.properties?.page || event.page || 'unknown';
      pageCountMap.set(page, (pageCountMap.get(page) || 0) + 1);
    });
    
    const topPages = Array.from(pageCountMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([page, views]) => ({ page, views }));

    // Top events
    const eventCountMap = new Map<string, number>();
    recentEvents.forEach(event => {
      eventCountMap.set(event.name, (eventCountMap.get(event.name) || 0) + 1);
    });

    const topEvents = Array.from(eventCountMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([event, count]) => ({ event, count }));

    // User flow (conversion funnels)
    const userFlow = Array.from(this.conversionFunnels.values());

    return {
      timestamp: Date.now(),
      activeUsers,
      pageViews,
      sessions,
      bounceRate,
      avgSessionDuration,
      conversionRate,
      topPages,
      topEvents,
      userFlow,
    };
  }

  /**
   * Get conversion funnel data
   */
  getConversionFunnel(funnelName: string): ConversionFunnel | null {
    return this.conversionFunnels.get(funnelName) || null;
  }

  /**
   * Export analytics data
   */
  exportAnalyticsData(startDate: Date, endDate: Date): {
    events: AnalyticsEvent[];
    sessions: UserSession[];
    metrics: AnalyticsMetrics;
  } {
    const filteredEvents = this.events.filter(event => 
      event.timestamp >= startDate.getTime() && 
      event.timestamp <= endDate.getTime()
    );

    const filteredSessions = Array.from(this.sessions.values())
      .filter(session => 
        session.startTime >= startDate.getTime() && 
        session.startTime <= endDate.getTime()
      );

    const hoursSpan = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    const metrics = this.getAnalyticsMetrics(hoursSpan);

    return {
      events: filteredEvents,
      sessions: filteredSessions,
      metrics,
    };
  }

  /**
   * Record event internally
   */
  private recordEvent(event: AnalyticsEvent): void {
    this.events.push(event);

    // Maintain buffer size
    if (this.events.length > this.EVENTS_BUFFER_SIZE) {
      this.events = this.events.slice(-this.EVENTS_BUFFER_SIZE);
    }
  }

  /**
   * Update user session
   */
  private updateSession(event: AnalyticsEvent): void {
    if (!event.sessionId) {
      return;
    }

    let session = this.sessions.get(event.sessionId);
    if (!session) {
      session = {
        sessionId: event.sessionId,
        userId: event.userId,
        startTime: event.timestamp,
        lastActivity: event.timestamp,
        pageViews: 0,
        events: [],
      };
      this.sessions.set(event.sessionId, session);
    }

    session.lastActivity = event.timestamp;
    session.events.push(event);

    if (event.name === 'page_view') {
      session.pageViews++;
    }

    if (event.userId && !session.userId) {
      session.userId = event.userId;
    }
  }

  /**
   * Update conversion funnels
   */
  private updateConversionFunnels(event: AnalyticsEvent): void {
    for (const [funnelName, funnel] of this.conversionFunnels) {
      const stepIndex = funnel.steps.indexOf(event.name);
      if (stepIndex >= 0) {
        const step = funnel.steps[stepIndex];
        funnel.conversions[step] = (funnel.conversions[step] || 0) + 1;

        // Track dropoffs (users who didn't proceed to next step)
        if (stepIndex > 0) {
          const prevStep = funnel.steps[stepIndex - 1];
          const prevConversions = funnel.conversions[prevStep] || 0;
          const currentConversions = funnel.conversions[step] || 0;
          funnel.dropoffs[step] = Math.max(0, prevConversions - currentConversions);
        }
      }
    }
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Start periodic tasks
   */
  private startPeriodicTasks(): void {
    // Cleanup expired sessions
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions();
    }, 5 * 60 * 1000); // Every 5 minutes

    // Generate analytics summary
    this.analyticsInterval = setInterval(() => {
      const metrics = this.getAnalyticsMetrics(1); // Last hour
      logger.info('Analytics Summary', {
        activeUsers: metrics.activeUsers,
        pageViews: metrics.pageViews,
        sessions: metrics.sessions,
        bounceRate: `${metrics.bounceRate.toFixed(1)}%`,
        conversionRate: `${metrics.conversionRate.toFixed(1)}%`,
      });
    }, 60 * 60 * 1000); // Every hour
  }

  /**
   * Clean up expired sessions
   */
  private cleanupExpiredSessions(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [sessionId, session] of this.sessions) {
      if (now - session.lastActivity > this.SESSION_TIMEOUT) {
        this.endSession(sessionId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info(`Cleaned up ${cleaned} expired sessions`);
    }
  }

  /**
   * Stop tracking
   */
  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    if (this.analyticsInterval) {
      clearInterval(this.analyticsInterval);
      this.analyticsInterval = null;
    }

    // End all active sessions
    for (const sessionId of this.sessions.keys()) {
      this.endSession(sessionId);
    }

    console.log('📊 Analytics tracking stopped');
  }
}

// Export singleton instance
export const analyticsTracker = AnalyticsTracker.getInstance();

// Export types
export type { 
  AnalyticsEvent, 
  UserSession, 
  ConversionFunnel, 
  AnalyticsMetrics 
};