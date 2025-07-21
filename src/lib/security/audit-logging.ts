/**
 * Audit logging system for sensitive operations
 * Tracks all security-relevant activities for compliance and monitoring
 */

import { createClient } from '@/lib/supabase/admin';
import type { Database } from '@/types/database';

// Initialize Supabase admin client for audit logging
const supabase = createClient();

/**
 * Audit event types
 */
export enum AuditEventType {
  // Authentication events
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILED = 'login_failed',
  LOGOUT = 'logout',
  PASSWORD_RESET = 'password_reset',
  EMAIL_VERIFIED = 'email_verified',
  
  // User management events
  USER_CREATED = 'user_created',
  USER_UPDATED = 'user_updated',
  USER_DELETED = 'user_deleted',
  USER_SUSPENDED = 'user_suspended',
  USER_REACTIVATED = 'user_reactivated',
  
  // Data access events
  DATA_ACCESSED = 'data_accessed',
  DATA_CREATED = 'data_created',
  DATA_UPDATED = 'data_updated',
  DATA_DELETED = 'data_deleted',
  DATA_EXPORTED = 'data_exported',
  
  // Security events
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  PERMISSION_DENIED = 'permission_denied',
  
  // System events
  SYSTEM_ERROR = 'system_error',
  CONFIGURATION_CHANGED = 'configuration_changed',
  BACKUP_CREATED = 'backup_created',
  BACKUP_RESTORED = 'backup_restored',
  
  // Feature usage events
  CONTENT_GENERATED = 'content_generated',
  SERP_ANALYZED = 'serp_analyzed',
  COMPETITOR_ANALYZED = 'competitor_analyzed',
  EXPORT_PERFORMED = 'export_performed',
}

/**
 * Audit event severity levels
 */
export enum AuditSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Audit log entry interface
 */
export interface AuditLogEntry {
  id?: string;
  event_type: AuditEventType;
  severity: AuditSeverity;
  user_id?: string;
  user_email?: string;
  ip_address?: string;
  user_agent?: string;
  resource_type?: string;
  resource_id?: string;
  action: string;
  description: string;
  metadata?: Record<string, any>;
  success: boolean;
  error_message?: string;
  timestamp: string;
  session_id?: string;
  request_id?: string;
}

/**
 * Audit logger class
 */
export class AuditLogger {
  private static instance: AuditLogger;
  private queue: AuditLogEntry[] = [];
  private isProcessing = false;
  private readonly batchSize = 100;
  private readonly flushInterval = 5000; // 5 seconds
  
  private constructor() {
    // Set up periodic flush
    setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }
  
  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }
  
  /**
   * Log an audit event
   */
  async log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    const auditEntry: AuditLogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    };
    
    // Add to queue
    this.queue.push(auditEntry);
    
    // Flush if queue is full
    if (this.queue.length >= this.batchSize) {
      await this.flush();
    }
  }
  
  /**
   * Flush queued audit logs to database
   */
  private async flush(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }
    
    this.isProcessing = true;
    const entries = this.queue.splice(0, this.batchSize);
    
    try {
      // Insert audit logs into database
      // Note: This would need a dedicated audit_logs table
      const { error } = await supabase
        .from('usage_analytics')
        .insert(entries.map(entry => ({
          user_id: entry.user_id || null,
          action_type: 'audit_log' as any,
          metadata: {
            event_type: entry.event_type,
            severity: entry.severity,
            action: entry.action,
            description: entry.description,
            success: entry.success,
            error_message: entry.error_message,
            ip_address: entry.ip_address,
            user_agent: entry.user_agent,
            resource_type: entry.resource_type,
            resource_id: entry.resource_id,
            session_id: entry.session_id,
            request_id: entry.request_id,
            user_email: entry.user_email,
            ...entry.metadata,
          },
          tokens_used: 0,
          success: entry.success,
          error_message: entry.error_message,
        })));
      
      if (error) {
        console.error('Failed to write audit logs:', error);
        // Re-queue failed entries
        this.queue.unshift(...entries);
      } else {
        console.log(`Successfully wrote ${entries.length} audit log entries`);
      }
    } catch (error) {
      console.error('Error flushing audit logs:', error);
      // Re-queue failed entries
      this.queue.unshift(...entries);
    } finally {
      this.isProcessing = false;
    }
  }
  
  /**
   * Force flush all queued entries
   */
  async forceFlush(): Promise<void> {
    while (this.queue.length > 0) {
      await this.flush();
    }
  }
}

// Export singleton instance
export const auditLogger = AuditLogger.getInstance();

/**
 * Audit logging utility functions
 */
export const auditUtils = {
  /**
   * Log authentication event
   */
  logAuth: async (
    eventType: AuditEventType,
    userId?: string,
    userEmail?: string,
    success: boolean = true,
    error?: string,
    metadata?: Record<string, any>
  ): Promise<void> => {
    await auditLogger.log({
      event_type: eventType,
      severity: success ? AuditSeverity.LOW : AuditSeverity.MEDIUM,
      user_id: userId,
      user_email: userEmail,
      action: eventType,
      description: `User ${eventType.replace('_', ' ')}`,
      success,
      error_message: error,
      metadata,
    });
  },
  
  /**
   * Log data access event
   */
  logDataAccess: async (
    eventType: AuditEventType,
    userId: string,
    resourceType: string,
    resourceId: string,
    action: string,
    success: boolean = true,
    error?: string,
    metadata?: Record<string, any>
  ): Promise<void> => {
    await auditLogger.log({
      event_type: eventType,
      severity: AuditSeverity.LOW,
      user_id: userId,
      resource_type: resourceType,
      resource_id: resourceId,
      action,
      description: `User ${action} ${resourceType} ${resourceId}`,
      success,
      error_message: error,
      metadata,
    });
  },
  
  /**
   * Log security event
   */
  logSecurity: async (
    eventType: AuditEventType,
    severity: AuditSeverity,
    description: string,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
    metadata?: Record<string, any>
  ): Promise<void> => {
    await auditLogger.log({
      event_type: eventType,
      severity,
      user_id: userId,
      ip_address: ipAddress,
      user_agent: userAgent,
      action: eventType,
      description,
      success: false,
      metadata,
    });
  },
  
  /**
   * Log system event
   */
  logSystem: async (
    eventType: AuditEventType,
    action: string,
    description: string,
    success: boolean = true,
    error?: string,
    metadata?: Record<string, any>
  ): Promise<void> => {
    await auditLogger.log({
      event_type: eventType,
      severity: success ? AuditSeverity.LOW : AuditSeverity.HIGH,
      action,
      description,
      success,
      error_message: error,
      metadata,
    });
  },
  
  /**
   * Log feature usage event
   */
  logFeatureUsage: async (
    eventType: AuditEventType,
    userId: string,
    action: string,
    resourceId?: string,
    success: boolean = true,
    metadata?: Record<string, any>
  ): Promise<void> => {
    await auditLogger.log({
      event_type: eventType,
      severity: AuditSeverity.LOW,
      user_id: userId,
      resource_id: resourceId,
      action,
      description: `User performed ${action}`,
      success,
      metadata,
    });
  },
};

/**
 * Audit logging decorator
 */
export function withAuditLog(
  eventType: AuditEventType,
  action: string,
  resourceType?: string
) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const userId = this.userId || args[0]?.userId;
      const resourceId = args[0]?.id || args[1]?.id;
      
      let success = true;
      let error: string | undefined;
      let result: any;
      
      try {
        result = await method.apply(this, args);
        return result;
      } catch (err) {
        success = false;
        error = err instanceof Error ? err.message : 'Unknown error';
        throw err;
      } finally {
        // Log the audit event
        await auditLogger.log({
          event_type: eventType,
          severity: success ? AuditSeverity.LOW : AuditSeverity.MEDIUM,
          user_id: userId,
          resource_type: resourceType,
          resource_id: resourceId,
          action,
          description: `User ${action} ${resourceType || 'resource'}`,
          success,
          error_message: error,
          metadata: {
            method: propertyName,
            args: args.length,
            result: success ? 'success' : 'failure',
          },
        });
      }
    };
    
    return descriptor;
  };
}

/**
 * Audit query builder for searching logs
 */
export class AuditQueryBuilder {
  private filters: Record<string, any> = {};
  
  static create(): AuditQueryBuilder {
    return new AuditQueryBuilder();
  }
  
  /**
   * Filter by event type
   */
  eventType(eventType: AuditEventType): AuditQueryBuilder {
    this.filters.event_type = eventType;
    return this;
  }
  
  /**
   * Filter by user ID
   */
  userId(userId: string): AuditQueryBuilder {
    this.filters.user_id = userId;
    return this;
  }
  
  /**
   * Filter by severity
   */
  severity(severity: AuditSeverity): AuditQueryBuilder {
    this.filters.severity = severity;
    return this;
  }
  
  /**
   * Filter by date range
   */
  dateRange(from: Date, to: Date): AuditQueryBuilder {
    this.filters.timestamp_from = from.toISOString();
    this.filters.timestamp_to = to.toISOString();
    return this;
  }
  
  /**
   * Filter by success status
   */
  success(success: boolean): AuditQueryBuilder {
    this.filters.success = success;
    return this;
  }
  
  /**
   * Execute the query
   */
  async execute(): Promise<AuditLogEntry[]> {
    try {
      // This would need to be implemented with proper audit table
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Error executing audit query:', error);
      return [];
    }
  }
}

/**
 * Audit reporting utilities
 */
export const auditReporting = {
  /**
   * Generate security report
   */
  generateSecurityReport: async (
    fromDate: Date,
    toDate: Date
  ): Promise<{
    totalEvents: number;
    failedLogins: number;
    suspiciousActivities: number;
    rateLimitExceeded: number;
    unauthorizedAccess: number;
    topUsers: Array<{ userId: string; eventCount: number }>;
  }> => {
    // Implementation would query audit logs
    return {
      totalEvents: 0,
      failedLogins: 0,
      suspiciousActivities: 0,
      rateLimitExceeded: 0,
      unauthorizedAccess: 0,
      topUsers: [],
    };
  },
  
  /**
   * Generate compliance report
   */
  generateComplianceReport: async (
    fromDate: Date,
    toDate: Date
  ): Promise<{
    dataAccess: number;
    dataModification: number;
    dataExport: number;
    userCreation: number;
    userDeletion: number;
    configurationChanges: number;
  }> => {
    // Implementation would query audit logs
    return {
      dataAccess: 0,
      dataModification: 0,
      dataExport: 0,
      userCreation: 0,
      userDeletion: 0,
      configurationChanges: 0,
    };
  },
};