/**
 * Comprehensive Logging System for SEO Automation App
 * Provides structured logging with different levels and contexts
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  userId?: string;
  requestId?: string;
  sessionId?: string;
  endpoint?: string;
  userAgent?: string;
  ip?: string;
  context?: Record<string, any>;
  stack?: string;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  enableRemote: boolean;
  maxLogSize: number;
  retentionDays: number;
}

class Logger {
  private config: LoggerConfig;
  private logBuffer: LogEntry[] = [];
  private readonly MAX_BUFFER_SIZE = 100;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: LogLevel.INFO,
      enableConsole: true,
      enableFile: false,
      enableRemote: false,
      maxLogSize: 10 * 1024 * 1024, // 10MB
      retentionDays: 30,
      ...config
    };

    // Set log level based on environment
    if (typeof window === 'undefined') {
      // Server-side
      this.config.level = process.env.NODE_ENV === 'production' ? LogLevel.WARN : LogLevel.DEBUG;
    } else {
      // Client-side
      this.config.level = process.env.NODE_ENV === 'production' ? LogLevel.ERROR : LogLevel.DEBUG;
    }
  }

  /**
   * Log debug message
   */
  public debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Log info message
   */
  public info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log warning message
   */
  public warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log error message
   */
  public error(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context);
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const logEntry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      ...this.getRequestContext()
    };

    // Add to buffer
    this.addToBuffer(logEntry);

    // Output to console if enabled
    if (this.config.enableConsole) {
      this.logToConsole(logEntry);
    }

    // Send to remote logging service if enabled
    if (this.config.enableRemote) {
      this.logToRemote(logEntry);
    }
  }

  /**
   * Check if message should be logged based on level
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const currentLevelIndex = levels.indexOf(this.config.level);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  /**
   * Get request context from various sources
   */
  private getRequestContext(): Partial<LogEntry> {
    const context: Partial<LogEntry> = {};

    // Client-side context
    if (typeof window !== 'undefined') {
      context.userAgent = navigator.userAgent;
      context.endpoint = window.location.pathname;
      
      // Try to get user ID from session storage or other sources
      try {
        const userId = sessionStorage.getItem('userId') || localStorage.getItem('userId');
        if (userId) context.userId = userId;
        
        const sessionId = sessionStorage.getItem('sessionId');
        if (sessionId) context.sessionId = sessionId;
      } catch (e) {
        // Ignore storage access errors
      }
    }

    // Server-side context (would be set by middleware)
    if (typeof window === 'undefined') {
      // These would typically be set by request middleware
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
   * Add log entry to buffer
   */
  private addToBuffer(logEntry: LogEntry): void {
    this.logBuffer.push(logEntry);
    
    if (this.logBuffer.length > this.MAX_BUFFER_SIZE) {
      this.logBuffer.shift(); // Remove oldest entry
    }
  }

  /**
   * Output to console with appropriate styling (Production-Safe)
   */
  private logToConsole(logEntry: LogEntry): void {
    const { level, message, timestamp, context } = logEntry;
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    const formattedMessage = `${prefix} ${message}`;
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    const fullMessage = `${formattedMessage}${contextStr}`;
    
    // In production, only log errors and warnings to stderr, everything else to stdout
    if (typeof window === 'undefined') {
      // Server-side: Use process.stdout/stderr instead of console
      const output = level === LogLevel.ERROR || level === LogLevel.WARN ? process.stderr : process.stdout;
      output.write(fullMessage + '\n');
      
      if (level === LogLevel.ERROR && context?.stack) {
        process.stderr.write(`Stack trace: ${context.stack}\n`);
      }
    } else {
      // Client-side: Only in development mode
      if (process.env.NODE_ENV === 'development') {
        switch (level) {
          case LogLevel.DEBUG:
            console.debug(prefix, message, context || '');
            break;
          case LogLevel.INFO:
            console.info(prefix, message, context || '');
            break;
          case LogLevel.WARN:
            console.warn(prefix, message, context || '');
            break;
          case LogLevel.ERROR:
            console.error(prefix, message, context || '');
            if (context?.stack) {
              console.error('Stack trace:', context.stack);
            }
            break;
        }
      }
    }
  }

  /**
   * Send logs to remote logging service
   */
  private async logToRemote(logEntry: LogEntry): Promise<void> {
    try {
      // Only send important logs to remote service to avoid spam
      if (logEntry.level === LogLevel.ERROR || logEntry.level === LogLevel.WARN) {
        // This would send to your logging service (e.g., LogRocket, DataDog, etc.)
        // For now, we'll just prepare the data
        const payload = {
          ...logEntry,
          environment: process.env.NODE_ENV,
          service: 'seo-automation-app'
        };

        // In a real implementation, you'd send this to your logging service
        // await fetch('/api/logs', { method: 'POST', body: JSON.stringify(payload) });
      }
    } catch (error) {
      // Silently fail for logging errors to avoid infinite loops
      // Use process.stderr instead of console to avoid recursion
      if (typeof window === 'undefined') {
        process.stderr.write(`[${new Date().toISOString()}] [ERROR] Failed to send log to remote service: ${error}\n`);
      }
    }
  }

  /**
   * Get recent logs from buffer
   */
  public getRecentLogs(count: number = 50): LogEntry[] {
    return this.logBuffer.slice(-count);
  }

  /**
   * Clear log buffer
   */
  public clearBuffer(): void {
    this.logBuffer = [];
  }

  /**
   * Create child logger with additional context
   */
  public child(context: Record<string, any>): Logger {
    const childLogger = new Logger(this.config);
    
    // Override log method to include additional context
    const originalLog = childLogger.log.bind(childLogger);
    childLogger.log = (level: LogLevel, message: string, additionalContext?: Record<string, any>) => {
      const mergedContext = { ...context, ...additionalContext };
      originalLog(level, message, mergedContext);
    };

    return childLogger;
  }

  /**
   * Log user action for audit trail
   */
  public logUserAction(action: string, details?: Record<string, any>): void {
    this.info(`User Action: ${action}`, {
      action,
      details,
      type: 'user_action'
    });
  }

  /**
   * Log API call for monitoring
   */
  public logApiCall(
    method: string, 
    endpoint: string, 
    statusCode: number, 
    duration: number,
    details?: Record<string, any>
  ): void {
    const level = statusCode >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    this.log(level, `API Call: ${method} ${endpoint}`, {
      method,
      endpoint,
      statusCode,
      duration,
      details,
      type: 'api_call'
    });
  }

  /**
   * Log system event
   */
  public logSystemEvent(event: string, details?: Record<string, any>): void {
    this.info(`System Event: ${event}`, {
      event,
      details,
      type: 'system_event'
    });
  }

  /**
   * Log performance metric
   */
  public logPerformance(metric: string, value: number, unit: string = 'ms'): void {
    this.debug(`Performance: ${metric}`, {
      metric,
      value,
      unit,
      type: 'performance'
    });
  }

  /**
   * Log security event
   */
  public logSecurityEvent(event: string, severity: 'low' | 'medium' | 'high' | 'critical', details?: Record<string, any>): void {
    const level = severity === 'critical' || severity === 'high' ? LogLevel.ERROR : LogLevel.WARN;
    this.log(level, `Security Event: ${event}`, {
      event,
      severity,
      details,
      type: 'security_event'
    });
  }
}

// Create and export singleton logger instance
export const logger = new Logger();

// Export logger class for creating child loggers
export { Logger };

// Convenience functions for common logging patterns
export const createRequestLogger = (requestId: string, userId?: string) => {
  return logger.child({ requestId, userId, type: 'request' });
};

export const createServiceLogger = (serviceName: string) => {
  return logger.child({ service: serviceName, type: 'service' });
};

export const createComponentLogger = (componentName: string) => {
  return logger.child({ component: componentName, type: 'component' });
};
