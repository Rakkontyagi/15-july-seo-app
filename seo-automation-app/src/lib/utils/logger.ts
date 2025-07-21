/**
 * Simple logger utility for the application - DEPRECATED
 * Use /lib/logging/logger.ts instead for production-grade logging
 */

// Re-export the proper logger from the main logging module
export { logger, LogLevel, createServiceLogger, createComponentLogger } from '../logging/logger';

// Keep the old interface for backward compatibility
export interface LogContext {
  [key: string]: any;
}

export interface Logger {
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
  debug(message: string, context?: LogContext): void;
}
