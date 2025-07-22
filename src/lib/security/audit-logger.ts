/**
 * Audit Logging System
 * Comprehensive audit trail for security and compliance
 */

import { createHash } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { logger } from '@/lib/logging/logger';

export interface AuditEvent {
  id: string;
  timestamp: Date;
  eventType: AuditEventType;
  severity: AuditSeverity;
  actor: AuditActor;
  resource: AuditResource;
  action: string;
  result: 'success' | 'failure' | 'error';
  metadata?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  sessionId?: string;
  correlationId?: string;
  tags?: string[];
}

export type AuditEventType = 
  | 'authentication'
  | 'authorization'
  | 'data_access'
  | 'data_modification'
  | 'configuration_change'
  | 'api_call'
  | 'security_event'
  | 'system_event'
  | 'user_action'
  | 'admin_action';

export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface AuditActor {
  type: 'user' | 'system' | 'api' | 'anonymous';
  id?: string;
  email?: string;
  name?: string;
  role?: string;
}

export interface AuditResource {
  type: string;
  id?: string;
  name?: string;
  path?: string;
}

interface AuditLoggerConfig {
  enabled: boolean;
  logToConsole: boolean;
  logToDatabase: boolean;
  logToFile: boolean;
  retentionDays: number;
  sensitiveFields: string[];
  excludeUserAgents: RegExp[];
  highValueEvents: AuditEventType[];
}

export class AuditLogger {
  private static instance: AuditLogger;
  private config: AuditLoggerConfig;
  private buffer: AuditEvent[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private readonly BUFFER_SIZE = 100;
  private readonly FLUSH_INTERVAL = 5000; // 5 seconds

  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  constructor() {
    this.config = this.getDefaultConfig();
    this.startFlushInterval();
  }

  private getDefaultConfig(): AuditLoggerConfig {
    return {
      enabled: process.env.NODE_ENV === 'production',
      logToConsole: process.env.NODE_ENV !== 'production',
      logToDatabase: true,
      logToFile: false, // Can be enabled for file-based logging
      retentionDays: 90,
      sensitiveFields: ['password', 'token', 'apiKey', 'secret', 'creditCard', 'ssn'],
      excludeUserAgents: [
        /bot/i,
        /crawler/i,
        /spider/i,
        /monitoring/i,
        /health-check/i,
      ],
      highValueEvents: ['authentication', 'authorization', 'data_modification', 'security_event'],
    };
  }

  /**
   * Log an audit event
   */
  async log(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    // Skip excluded user agents
    if (this.shouldExcludeUserAgent(event.userAgent)) {
      return;
    }

    const auditEvent: AuditEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      ...event,
    };

    // Sanitize sensitive data
    auditEvent.metadata = this.sanitizeMetadata(auditEvent.metadata);

    // Add to buffer
    this.buffer.push(auditEvent);

    // Log high-value events immediately
    if (this.isHighValueEvent(auditEvent)) {
      await this.flush();
    } else if (this.buffer.length >= this.BUFFER_SIZE) {
      await this.flush();
    }

    // Console logging for debugging
    if (this.config.logToConsole) {
      this.logToConsole(auditEvent);
    }
  }

  /**
   * Authentication events
   */
  async logAuthentication(
    actor: AuditActor,
    action: 'login' | 'logout' | 'register' | 'password_reset' | 'mfa_enable' | 'mfa_verify',
    result: 'success' | 'failure',
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      eventType: 'authentication',
      severity: result === 'failure' ? 'warning' : 'info',
      actor,
      resource: { type: 'auth', name: action },
      action,
      result,
      metadata,
      ipAddress: metadata?.ipAddress || 'unknown',
      userAgent: metadata?.userAgent || 'unknown',
    });
  }

  /**
   * Authorization events
   */
  async logAuthorization(
    actor: AuditActor,
    resource: AuditResource,
    action: string,
    result: 'success' | 'failure',
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      eventType: 'authorization',
      severity: result === 'failure' ? 'warning' : 'info',
      actor,
      resource,
      action: `authorize_${action}`,
      result,
      metadata,
      ipAddress: metadata?.ipAddress || 'unknown',
      userAgent: metadata?.userAgent || 'unknown',
    });
  }

  /**
   * Data access events
   */
  async logDataAccess(
    actor: AuditActor,
    resource: AuditResource,
    action: 'read' | 'list' | 'search' | 'export',
    result: 'success' | 'failure',
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      eventType: 'data_access',
      severity: 'info',
      actor,
      resource,
      action,
      result,
      metadata,
      ipAddress: metadata?.ipAddress || 'unknown',
      userAgent: metadata?.userAgent || 'unknown',
    });
  }

  /**
   * Data modification events
   */
  async logDataModification(
    actor: AuditActor,
    resource: AuditResource,
    action: 'create' | 'update' | 'delete' | 'import',
    result: 'success' | 'failure',
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      eventType: 'data_modification',
      severity: action === 'delete' ? 'warning' : 'info',
      actor,
      resource,
      action,
      result,
      metadata: {
        ...metadata,
        changes: metadata?.changes ? this.sanitizeChanges(metadata.changes) : undefined,
      },
      ipAddress: metadata?.ipAddress || 'unknown',
      userAgent: metadata?.userAgent || 'unknown',
    });
  }

  /**
   * API call events
   */
  async logApiCall(
    actor: AuditActor,
    endpoint: string,
    method: string,
    statusCode: number,
    duration: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    const result = statusCode >= 200 && statusCode < 400 ? 'success' : 'failure';
    const severity = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warning' : 'info';

    await this.log({
      eventType: 'api_call',
      severity,
      actor,
      resource: { type: 'api', path: endpoint },
      action: `${method} ${endpoint}`,
      result,
      metadata: {
        ...metadata,
        method,
        statusCode,
        duration,
      },
      ipAddress: metadata?.ipAddress || 'unknown',
      userAgent: metadata?.userAgent || 'unknown',
    });
  }

  /**
   * Security events
   */
  async logSecurityEvent(
    eventName: string,
    severity: AuditSeverity,
    actor: AuditActor,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      eventType: 'security_event',
      severity,
      actor,
      resource: { type: 'security', name: eventName },
      action: eventName,
      result: 'success',
      metadata,
      ipAddress: metadata?.ipAddress || 'unknown',
      userAgent: metadata?.userAgent || 'unknown',
    });
  }

  /**
   * Configuration change events
   */
  async logConfigurationChange(
    actor: AuditActor,
    configType: string,
    action: 'create' | 'update' | 'delete',
    changes: Record<string, any>,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      eventType: 'configuration_change',
      severity: 'warning',
      actor,
      resource: { type: 'configuration', name: configType },
      action: `${action}_configuration`,
      result: 'success',
      metadata: {
        ...metadata,
        changes: this.sanitizeChanges(changes),
      },
      ipAddress: metadata?.ipAddress || 'unknown',
      userAgent: metadata?.userAgent || 'unknown',
    });
  }

  /**
   * Query audit logs
   */
  async query(filters: {
    eventTypes?: AuditEventType[];
    severities?: AuditSeverity[];
    actorId?: string;
    resourceType?: string;
    resourceId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ events: AuditEvent[]; total: number }> {
    try {
      let query = supabaseAdmin
        .from('audit_logs')
        .select('*', { count: 'exact' });

      if (filters.eventTypes?.length) {
        query = query.in('event_type', filters.eventTypes);
      }

      if (filters.severities?.length) {
        query = query.in('severity', filters.severities);
      }

      if (filters.actorId) {
        query = query.eq('actor->id', filters.actorId);
      }

      if (filters.resourceType) {
        query = query.eq('resource->type', filters.resourceType);
      }

      if (filters.resourceId) {
        query = query.eq('resource->id', filters.resourceId);
      }

      if (filters.startDate) {
        query = query.gte('timestamp', filters.startDate.toISOString());
      }

      if (filters.endDate) {
        query = query.lte('timestamp', filters.endDate.toISOString());
      }

      query = query
        .order('timestamp', { ascending: false })
        .limit(filters.limit || 100)
        .range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 100) - 1);

      const { data, count, error } = await query;

      if (error) {
        throw error;
      }

      return {
        events: data || [],
        total: count || 0,
      };
    } catch (error) {
      logger.error('Failed to query audit logs', error);
      return { events: [], total: 0 };
    }
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(
    startDate: Date,
    endDate: Date,
    eventTypes?: AuditEventType[]
  ): Promise<{
    summary: Record<string, any>;
    events: AuditEvent[];
  }> {
    const { events } = await this.query({
      startDate,
      endDate,
      eventTypes,
      limit: 10000,
    });

    const summary = {
      totalEvents: events.length,
      byEventType: this.groupBy(events, 'eventType'),
      bySeverity: this.groupBy(events, 'severity'),
      byResult: this.groupBy(events, 'result'),
      topActors: this.getTopActors(events, 10),
      topResources: this.getTopResources(events, 10),
      failureRate: this.calculateFailureRate(events),
      criticalEvents: events.filter(e => e.severity === 'critical').length,
    };

    return { summary, events };
  }

  /**
   * Flush buffer to storage
   */
  private async flush(): Promise<void> {
    if (this.buffer.length === 0) {
      return;
    }

    const events = [...this.buffer];
    this.buffer = [];

    if (this.config.logToDatabase) {
      try {
        const { error } = await supabaseAdmin
          .from('audit_logs')
          .insert(events.map(event => ({
            ...event,
            actor: JSON.stringify(event.actor),
            resource: JSON.stringify(event.resource),
            metadata: JSON.stringify(event.metadata),
            tags: event.tags,
          })));

        if (error) {
          throw error;
        }
      } catch (error) {
        logger.error('Failed to flush audit logs to database', error);
        // Re-add events to buffer for retry
        this.buffer.unshift(...events);
      }
    }

    // File logging can be implemented here if needed
    if (this.config.logToFile) {
      // await this.logToFile(events);
    }
  }

  /**
   * Start flush interval
   */
  private startFlushInterval(): void {
    this.flushInterval = setInterval(async () => {
      await this.flush();
    }, this.FLUSH_INTERVAL);
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 9);
    return `${timestamp}-${random}`;
  }

  /**
   * Sanitize metadata to remove sensitive fields
   */
  private sanitizeMetadata(metadata?: Record<string, any>): Record<string, any> | undefined {
    if (!metadata) {
      return undefined;
    }

    const sanitized = { ...metadata };

    const sanitizeObject = (obj: any): any => {
      if (typeof obj !== 'object' || obj === null) {
        return obj;
      }

      if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
      }

      const result: Record<string, any> = {};
      for (const [key, value] of Object.entries(obj)) {
        if (this.isSensitiveField(key)) {
          result[key] = '[REDACTED]';
        } else if (typeof value === 'object') {
          result[key] = sanitizeObject(value);
        } else {
          result[key] = value;
        }
      }
      return result;
    };

    return sanitizeObject(sanitized);
  }

  /**
   * Sanitize change data
   */
  private sanitizeChanges(changes: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(changes)) {
      if (this.isSensitiveField(key)) {
        sanitized[key] = {
          before: '[REDACTED]',
          after: '[REDACTED]',
        };
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Check if field is sensitive
   */
  private isSensitiveField(fieldName: string): boolean {
    const lowerField = fieldName.toLowerCase();
    return this.config.sensitiveFields.some(sensitive =>
      lowerField.includes(sensitive.toLowerCase())
    );
  }

  /**
   * Check if user agent should be excluded
   */
  private shouldExcludeUserAgent(userAgent: string): boolean {
    return this.config.excludeUserAgents.some(pattern =>
      pattern.test(userAgent)
    );
  }

  /**
   * Check if event is high value
   */
  private isHighValueEvent(event: AuditEvent): boolean {
    return (
      this.config.highValueEvents.includes(event.eventType) ||
      event.severity === 'critical' ||
      event.severity === 'error'
    );
  }

  /**
   * Log to console
   */
  private logToConsole(event: AuditEvent): void {
    const logData = {
      id: event.id,
      timestamp: event.timestamp,
      type: event.eventType,
      severity: event.severity,
      actor: `${event.actor.type}:${event.actor.id || 'anonymous'}`,
      action: event.action,
      result: event.result,
      resource: `${event.resource.type}:${event.resource.id || event.resource.name || 'n/a'}`,
    };

    const logMethod = event.severity === 'error' || event.severity === 'critical' ? 'error' : 'info';
    logger[logMethod]('AUDIT', logData);
  }

  /**
   * Group events by field
   */
  private groupBy(events: AuditEvent[], field: keyof AuditEvent): Record<string, number> {
    return events.reduce((acc, event) => {
      const key = String(event[field]);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Get top actors
   */
  private getTopActors(events: AuditEvent[], limit: number): Array<{ actor: string; count: number }> {
    const actorCounts = new Map<string, number>();

    events.forEach(event => {
      const actorKey = `${event.actor.type}:${event.actor.id || 'anonymous'}`;
      actorCounts.set(actorKey, (actorCounts.get(actorKey) || 0) + 1);
    });

    return Array.from(actorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([actor, count]) => ({ actor, count }));
  }

  /**
   * Get top resources
   */
  private getTopResources(events: AuditEvent[], limit: number): Array<{ resource: string; count: number }> {
    const resourceCounts = new Map<string, number>();

    events.forEach(event => {
      const resourceKey = `${event.resource.type}:${event.resource.id || event.resource.name || 'n/a'}`;
      resourceCounts.set(resourceKey, (resourceCounts.get(resourceKey) || 0) + 1);
    });

    return Array.from(resourceCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([resource, count]) => ({ resource, count }));
  }

  /**
   * Calculate failure rate
   */
  private calculateFailureRate(events: AuditEvent[]): number {
    if (events.length === 0) {
      return 0;
    }

    const failures = events.filter(e => e.result === 'failure').length;
    return (failures / events.length) * 100;
  }

  /**
   * Stop the audit logger
   */
  stop(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this.flush(); // Final flush
  }
}

// Export singleton instance
export const auditLogger = AuditLogger.getInstance();

// Export types
export type { AuditLoggerConfig };