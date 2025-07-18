/**
 * Log Aggregation and Search System for SEO Automation App
 * Provides centralized log collection, search, and analysis capabilities
 */

import { LogEntry, LogLevel, logger } from './logger';

export interface LogSearchQuery {
  level?: LogLevel;
  message?: string;
  userId?: string;
  requestId?: string;
  sessionId?: string;
  endpoint?: string;
  startTime?: string;
  endTime?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'level';
  sortOrder?: 'asc' | 'desc';
}

export interface LogSearchResult {
  logs: LogEntry[];
  total: number;
  hasMore: boolean;
  aggregations?: {
    byLevel: Record<LogLevel, number>;
    byEndpoint: Record<string, number>;
    byUser: Record<string, number>;
    timeDistribution: Array<{ time: string; count: number }>;
  };
}

export interface LogAlert {
  id: string;
  name: string;
  condition: LogSearchQuery;
  threshold: number;
  timeWindow: number; // in minutes
  enabled: boolean;
  lastTriggered?: string;
  actions: Array<{
    type: 'email' | 'webhook' | 'slack';
    target: string;
  }>;
}

export class LogAggregator {
  private static instance: LogAggregator;
  private logStore: LogEntry[] = [];
  private alerts: Map<string, LogAlert> = new Map();
  private readonly MAX_LOGS = 10000; // Keep last 10k logs in memory
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private cleanupTimer: NodeJS.Timeout;

  private constructor() {
    // Start cleanup timer
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.CLEANUP_INTERVAL);

    // Subscribe to logger events
    this.subscribeToLogger();
  }

  public static getInstance(): LogAggregator {
    if (!LogAggregator.instance) {
      LogAggregator.instance = new LogAggregator();
    }
    return LogAggregator.instance;
  }

  /**
   * Subscribe to logger to collect logs
   */
  private subscribeToLogger(): void {
    // Override logger's log method to capture logs
    const originalLog = (logger as any).log.bind(logger);
    (logger as any).log = (level: LogLevel, message: string, context?: Record<string, any>) => {
      // Call original log method
      originalLog(level, message, context);

      // Store log entry
      const logEntry: LogEntry = {
        level,
        message,
        timestamp: new Date().toISOString(),
        context,
        ...this.getRequestContext()
      };

      this.addLog(logEntry);
    };
  }

  /**
   * Get request context (similar to logger implementation)
   */
  private getRequestContext(): Partial<LogEntry> {
    const context: Partial<LogEntry> = {};

    // Client-side context
    if (typeof window !== 'undefined') {
      context.userAgent = navigator.userAgent;
      context.endpoint = window.location.pathname;
      
      try {
        const userId = sessionStorage.getItem('userId') || localStorage.getItem('userId');
        if (userId) context.userId = userId;
        
        const sessionId = sessionStorage.getItem('sessionId');
        if (sessionId) context.sessionId = sessionId;
      } catch (e) {
        // Ignore storage access errors
      }
    }

    // Server-side context
    if (typeof window === 'undefined') {
      const requestId = (global as any).__REQUEST_ID__;
      const userId = (global as any).__USER_ID__;
      const ip = (global as any).__CLIENT_IP__;
      
      if (requestId) context.requestId = requestId;
      if (userId) context.userId = userId;
      if (ip) context.ip = ip;
    }

    return context;
  }

  /**
   * Add log entry to store
   */
  private addLog(logEntry: LogEntry): void {
    this.logStore.push(logEntry);

    // Trim if exceeding max size
    if (this.logStore.length > this.MAX_LOGS) {
      this.logStore = this.logStore.slice(-this.MAX_LOGS);
    }

    // Check alerts
    this.checkAlerts(logEntry);
  }

  /**
   * Search logs based on query
   */
  public searchLogs(query: LogSearchQuery = {}): LogSearchResult {
    let filteredLogs = [...this.logStore];

    // Apply filters
    if (query.level) {
      filteredLogs = filteredLogs.filter(log => log.level === query.level);
    }

    if (query.message) {
      const searchTerm = query.message.toLowerCase();
      filteredLogs = filteredLogs.filter(log => 
        log.message.toLowerCase().includes(searchTerm)
      );
    }

    if (query.userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === query.userId);
    }

    if (query.requestId) {
      filteredLogs = filteredLogs.filter(log => log.requestId === query.requestId);
    }

    if (query.sessionId) {
      filteredLogs = filteredLogs.filter(log => log.sessionId === query.sessionId);
    }

    if (query.endpoint) {
      filteredLogs = filteredLogs.filter(log => log.endpoint === query.endpoint);
    }

    if (query.startTime) {
      const startTime = new Date(query.startTime).getTime();
      filteredLogs = filteredLogs.filter(log => 
        new Date(log.timestamp).getTime() >= startTime
      );
    }

    if (query.endTime) {
      const endTime = new Date(query.endTime).getTime();
      filteredLogs = filteredLogs.filter(log => 
        new Date(log.timestamp).getTime() <= endTime
      );
    }

    // Sort logs
    const sortBy = query.sortBy || 'timestamp';
    const sortOrder = query.sortOrder || 'desc';
    
    filteredLogs.sort((a, b) => {
      let aValue: any, bValue: any;
      
      if (sortBy === 'timestamp') {
        aValue = new Date(a.timestamp).getTime();
        bValue = new Date(b.timestamp).getTime();
      } else if (sortBy === 'level') {
        const levelOrder = { debug: 0, info: 1, warn: 2, error: 3 };
        aValue = levelOrder[a.level];
        bValue = levelOrder[b.level];
      }

      if (sortOrder === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });

    // Apply pagination
    const total = filteredLogs.length;
    const offset = query.offset || 0;
    const limit = query.limit || 100;
    const paginatedLogs = filteredLogs.slice(offset, offset + limit);
    const hasMore = offset + limit < total;

    // Generate aggregations
    const aggregations = this.generateAggregations(filteredLogs);

    return {
      logs: paginatedLogs,
      total,
      hasMore,
      aggregations
    };
  }

  /**
   * Generate aggregations for search results
   */
  private generateAggregations(logs: LogEntry[]) {
    const byLevel: Record<LogLevel, number> = {
      debug: 0,
      info: 0,
      warn: 0,
      error: 0
    };

    const byEndpoint: Record<string, number> = {};
    const byUser: Record<string, number> = {};
    const timeDistribution: Array<{ time: string; count: number }> = [];

    // Count by level
    logs.forEach(log => {
      byLevel[log.level]++;

      // Count by endpoint
      if (log.endpoint) {
        byEndpoint[log.endpoint] = (byEndpoint[log.endpoint] || 0) + 1;
      }

      // Count by user
      if (log.userId) {
        byUser[log.userId] = (byUser[log.userId] || 0) + 1;
      }
    });

    // Generate time distribution (hourly buckets)
    const timeMap = new Map<string, number>();
    logs.forEach(log => {
      const hour = new Date(log.timestamp).toISOString().slice(0, 13) + ':00:00.000Z';
      timeMap.set(hour, (timeMap.get(hour) || 0) + 1);
    });

    timeMap.forEach((count, time) => {
      timeDistribution.push({ time, count });
    });

    timeDistribution.sort((a, b) => a.time.localeCompare(b.time));

    return {
      byLevel,
      byEndpoint,
      byUser,
      timeDistribution
    };
  }

  /**
   * Get recent logs
   */
  public getRecentLogs(count: number = 100): LogEntry[] {
    return this.logStore.slice(-count);
  }

  /**
   * Get logs by level
   */
  public getLogsByLevel(level: LogLevel, count: number = 100): LogEntry[] {
    return this.logStore
      .filter(log => log.level === level)
      .slice(-count);
  }

  /**
   * Get error logs
   */
  public getErrorLogs(count: number = 100): LogEntry[] {
    return this.getLogsByLevel(LogLevel.ERROR, count);
  }

  /**
   * Get logs for user
   */
  public getUserLogs(userId: string, count: number = 100): LogEntry[] {
    return this.logStore
      .filter(log => log.userId === userId)
      .slice(-count);
  }

  /**
   * Get logs for request
   */
  public getRequestLogs(requestId: string): LogEntry[] {
    return this.logStore.filter(log => log.requestId === requestId);
  }

  /**
   * Add alert
   */
  public addAlert(alert: LogAlert): void {
    this.alerts.set(alert.id, alert);
    logger.info('Log alert added', { alertId: alert.id, alertName: alert.name });
  }

  /**
   * Remove alert
   */
  public removeAlert(alertId: string): void {
    this.alerts.delete(alertId);
    logger.info('Log alert removed', { alertId });
  }

  /**
   * Check alerts against new log entry
   */
  private checkAlerts(logEntry: LogEntry): void {
    this.alerts.forEach(alert => {
      if (!alert.enabled) return;

      // Check if log matches alert condition
      if (this.matchesAlertCondition(logEntry, alert.condition)) {
        this.evaluateAlert(alert);
      }
    });
  }

  /**
   * Check if log entry matches alert condition
   */
  private matchesAlertCondition(logEntry: LogEntry, condition: LogSearchQuery): boolean {
    if (condition.level && logEntry.level !== condition.level) return false;
    if (condition.userId && logEntry.userId !== condition.userId) return false;
    if (condition.endpoint && logEntry.endpoint !== condition.endpoint) return false;
    
    if (condition.message) {
      const searchTerm = condition.message.toLowerCase();
      if (!logEntry.message.toLowerCase().includes(searchTerm)) return false;
    }

    return true;
  }

  /**
   * Evaluate alert threshold
   */
  private evaluateAlert(alert: LogAlert): void {
    const now = new Date();
    const windowStart = new Date(now.getTime() - alert.timeWindow * 60 * 1000);

    // Count matching logs in time window
    const matchingLogs = this.logStore.filter(log => {
      const logTime = new Date(log.timestamp);
      return logTime >= windowStart && 
             logTime <= now && 
             this.matchesAlertCondition(log, alert.condition);
    });

    if (matchingLogs.length >= alert.threshold) {
      this.triggerAlert(alert, matchingLogs.length);
    }
  }

  /**
   * Trigger alert
   */
  private triggerAlert(alert: LogAlert, count: number): void {
    const now = new Date().toISOString();
    
    // Update last triggered time
    alert.lastTriggered = now;
    this.alerts.set(alert.id, alert);

    logger.error('Log alert triggered', {
      alertId: alert.id,
      alertName: alert.name,
      count,
      threshold: alert.threshold,
      timeWindow: alert.timeWindow
    });

    // Execute alert actions
    alert.actions.forEach(action => {
      this.executeAlertAction(alert, action, count);
    });
  }

  /**
   * Execute alert action
   */
  private executeAlertAction(alert: LogAlert, action: LogAlert['actions'][0], count: number): void {
    try {
      switch (action.type) {
        case 'email':
          // Send email notification
          logger.info('Email alert action triggered', { 
            alertId: alert.id, 
            target: action.target 
          });
          break;
        
        case 'webhook':
          // Send webhook notification
          fetch(action.target, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              alert: alert.name,
              count,
              threshold: alert.threshold,
              timestamp: new Date().toISOString()
            })
          }).catch(error => {
            logger.error('Webhook alert action failed', { error, alertId: alert.id });
          });
          break;
        
        case 'slack':
          // Send Slack notification
          logger.info('Slack alert action triggered', { 
            alertId: alert.id, 
            target: action.target 
          });
          break;
      }
    } catch (error) {
      logger.error('Alert action execution failed', { 
        error, 
        alertId: alert.id, 
        actionType: action.type 
      });
    }
  }

  /**
   * Get all alerts
   */
  public getAlerts(): LogAlert[] {
    return Array.from(this.alerts.values());
  }

  /**
   * Get alert by ID
   */
  public getAlert(alertId: string): LogAlert | undefined {
    return this.alerts.get(alertId);
  }

  /**
   * Cleanup old logs
   */
  private cleanup(): void {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    const initialCount = this.logStore.length;
    
    this.logStore = this.logStore.filter(log => 
      new Date(log.timestamp) > cutoff
    );

    const cleaned = initialCount - this.logStore.length;
    if (cleaned > 0) {
      logger.debug('Log cleanup completed', { cleaned, remaining: this.logStore.length });
    }
  }

  /**
   * Export logs
   */
  public exportLogs(query: LogSearchQuery = {}): string {
    const result = this.searchLogs(query);
    return JSON.stringify(result.logs, null, 2);
  }

  /**
   * Get log statistics
   */
  public getStatistics(): {
    totalLogs: number;
    logsByLevel: Record<LogLevel, number>;
    oldestLog?: string;
    newestLog?: string;
    alertCount: number;
    activeAlertCount: number;
  } {
    const logsByLevel: Record<LogLevel, number> = {
      debug: 0,
      info: 0,
      warn: 0,
      error: 0
    };

    this.logStore.forEach(log => {
      logsByLevel[log.level]++;
    });

    const timestamps = this.logStore.map(log => log.timestamp).sort();

    return {
      totalLogs: this.logStore.length,
      logsByLevel,
      oldestLog: timestamps[0],
      newestLog: timestamps[timestamps.length - 1],
      alertCount: this.alerts.size,
      activeAlertCount: Array.from(this.alerts.values()).filter(a => a.enabled).length
    };
  }

  /**
   * Destroy aggregator
   */
  public destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.logStore = [];
    this.alerts.clear();
  }
}

// Export singleton instance
export const logAggregator = LogAggregator.getInstance();

// Convenience functions
export const searchLogs = (query: LogSearchQuery) => logAggregator.searchLogs(query);
export const getRecentLogs = (count?: number) => logAggregator.getRecentLogs(count);
export const getErrorLogs = (count?: number) => logAggregator.getErrorLogs(count);
export const getUserLogs = (userId: string, count?: number) => logAggregator.getUserLogs(userId, count);
export const getRequestLogs = (requestId: string) => logAggregator.getRequestLogs(requestId);
export const addLogAlert = (alert: LogAlert) => logAggregator.addAlert(alert);
export const removeLogAlert = (alertId: string) => logAggregator.removeAlert(alertId);
export const getLogStatistics = () => logAggregator.getStatistics();
