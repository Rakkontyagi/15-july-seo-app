/**
 * Alert Rules and Notification System for SEO Automation App
 * Provides comprehensive alerting for errors, performance issues, and system health
 */

import { logger } from '@/lib/logging/logger';
import { sentryManager } from './sentry';
import { serviceHealthMonitor } from './service-monitor';
import { ApplicationError, ErrorType, ErrorSeverity } from '@/lib/errors/types';

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  type: 'error_rate' | 'response_time' | 'service_health' | 'custom';
  condition: {
    metric: string;
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
    threshold: number;
    timeWindow: number; // in minutes
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  channels: AlertChannel[];
  cooldown: number; // in minutes
  lastTriggered?: string;
}

export interface AlertChannel {
  type: 'email' | 'slack' | 'webhook' | 'sms';
  target: string;
  enabled: boolean;
  config?: Record<string, any>;
}

export interface AlertEvent {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: AlertRule['severity'];
  message: string;
  timestamp: string;
  value: number;
  threshold: number;
  context?: Record<string, any>;
  resolved?: boolean;
  resolvedAt?: string;
}

export class AlertManager {
  private static instance: AlertManager;
  private rules = new Map<string, AlertRule>();
  private events: AlertEvent[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private readonly MAX_EVENTS = 1000;

  private constructor() {
    this.initializeDefaultRules();
  }

  public static getInstance(): AlertManager {
    if (!AlertManager.instance) {
      AlertManager.instance = new AlertManager();
    }
    return AlertManager.instance;
  }

  /**
   * Initialize default alert rules
   */
  private initializeDefaultRules(): void {
    const defaultRules: AlertRule[] = [
      {
        id: 'high-error-rate',
        name: 'High Error Rate',
        description: 'Alert when error rate exceeds 5% in 5 minutes',
        type: 'error_rate',
        condition: {
          metric: 'error_rate',
          operator: 'gt',
          threshold: 5,
          timeWindow: 5
        },
        severity: 'high',
        enabled: true,
        channels: [
          {
            type: 'email',
            target: process.env.ALERT_EMAIL || 'alerts@seoautomation.app',
            enabled: true
          }
        ],
        cooldown: 15
      },
      {
        id: 'slow-response-time',
        name: 'Slow Response Time',
        description: 'Alert when average response time exceeds 2 seconds',
        type: 'response_time',
        condition: {
          metric: 'avg_response_time',
          operator: 'gt',
          threshold: 2000,
          timeWindow: 10
        },
        severity: 'medium',
        enabled: true,
        channels: [
          {
            type: 'slack',
            target: process.env.SLACK_WEBHOOK_URL || '',
            enabled: !!process.env.SLACK_WEBHOOK_URL
          }
        ],
        cooldown: 30
      },
      {
        id: 'service-unhealthy',
        name: 'Service Unhealthy',
        description: 'Alert when external service becomes unhealthy',
        type: 'service_health',
        condition: {
          metric: 'service_status',
          operator: 'eq',
          threshold: 0, // 0 = unhealthy
          timeWindow: 5
        },
        severity: 'critical',
        enabled: true,
        channels: [
          {
            type: 'email',
            target: process.env.ALERT_EMAIL || 'alerts@seoautomation.app',
            enabled: true
          },
          {
            type: 'slack',
            target: process.env.SLACK_WEBHOOK_URL || '',
            enabled: !!process.env.SLACK_WEBHOOK_URL
          }
        ],
        cooldown: 10
      },
      {
        id: 'memory-usage-high',
        name: 'High Memory Usage',
        description: 'Alert when memory usage exceeds 85%',
        type: 'custom',
        condition: {
          metric: 'memory_usage_percent',
          operator: 'gt',
          threshold: 85,
          timeWindow: 5
        },
        severity: 'high',
        enabled: true,
        channels: [
          {
            type: 'email',
            target: process.env.ALERT_EMAIL || 'alerts@seoautomation.app',
            enabled: true
          }
        ],
        cooldown: 20
      }
    ];

    defaultRules.forEach(rule => {
      this.rules.set(rule.id, rule);
    });

    logger.info('Default alert rules initialized', { 
      ruleCount: defaultRules.length 
    });
  }

  /**
   * Add or update alert rule
   */
  public setRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule);
    logger.info('Alert rule updated', { 
      ruleId: rule.id, 
      ruleName: rule.name,
      enabled: rule.enabled 
    });
  }

  /**
   * Remove alert rule
   */
  public removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
    logger.info('Alert rule removed', { ruleId });
  }

  /**
   * Get alert rule
   */
  public getRule(ruleId: string): AlertRule | undefined {
    return this.rules.get(ruleId);
  }

  /**
   * Get all alert rules
   */
  public getAllRules(): AlertRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Start monitoring and checking alert rules
   */
  public startMonitoring(intervalMs: number = 60000): void {
    if (this.monitoringInterval) {
      this.stopMonitoring();
    }

    logger.info('Starting alert monitoring', { intervalMs });

    this.monitoringInterval = setInterval(async () => {
      await this.checkAllRules();
    }, intervalMs);
  }

  /**
   * Stop monitoring
   */
  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      logger.info('Alert monitoring stopped');
    }
  }

  /**
   * Check all enabled alert rules
   */
  private async checkAllRules(): Promise<void> {
    const enabledRules = Array.from(this.rules.values()).filter(rule => rule.enabled);

    for (const rule of enabledRules) {
      try {
        await this.checkRule(rule);
      } catch (error) {
        logger.error('Error checking alert rule', { 
          ruleId: rule.id, 
          error: (error as Error).message 
        });
      }
    }
  }

  /**
   * Check individual alert rule
   */
  private async checkRule(rule: AlertRule): Promise<void> {
    // Check cooldown
    if (rule.lastTriggered) {
      const lastTriggered = new Date(rule.lastTriggered).getTime();
      const cooldownExpiry = lastTriggered + (rule.cooldown * 60 * 1000);
      if (Date.now() < cooldownExpiry) {
        return; // Still in cooldown
      }
    }

    let currentValue: number;
    let context: Record<string, any> = {};

    try {
      switch (rule.type) {
        case 'error_rate':
          currentValue = await this.getErrorRate(rule.condition.timeWindow);
          context = { metric: 'error_rate', timeWindow: rule.condition.timeWindow };
          break;

        case 'response_time':
          currentValue = await this.getAverageResponseTime(rule.condition.timeWindow);
          context = { metric: 'avg_response_time', timeWindow: rule.condition.timeWindow };
          break;

        case 'service_health':
          currentValue = await this.getServiceHealthScore();
          context = { metric: 'service_health' };
          break;

        case 'custom':
          currentValue = await this.getCustomMetric(rule.condition.metric, rule.condition.timeWindow);
          context = { metric: rule.condition.metric, timeWindow: rule.condition.timeWindow };
          break;

        default:
          logger.warn('Unknown alert rule type', { ruleId: rule.id, type: rule.type });
          return;
      }

      // Check condition
      if (this.evaluateCondition(currentValue, rule.condition)) {
        await this.triggerAlert(rule, currentValue, context);
      }

    } catch (error) {
      logger.error('Failed to evaluate alert rule', { 
        ruleId: rule.id, 
        error: (error as Error).message 
      });
    }
  }

  /**
   * Evaluate alert condition
   */
  private evaluateCondition(value: number, condition: AlertRule['condition']): boolean {
    switch (condition.operator) {
      case 'gt': return value > condition.threshold;
      case 'gte': return value >= condition.threshold;
      case 'lt': return value < condition.threshold;
      case 'lte': return value <= condition.threshold;
      case 'eq': return value === condition.threshold;
      default: return false;
    }
  }

  /**
   * Trigger alert
   */
  private async triggerAlert(rule: AlertRule, value: number, context: Record<string, any>): Promise<void> {
    const alertEvent: AlertEvent = {
      id: this.generateAlertId(),
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      message: this.generateAlertMessage(rule, value),
      timestamp: new Date().toISOString(),
      value,
      threshold: rule.condition.threshold,
      context
    };

    // Store event
    this.events.push(alertEvent);
    if (this.events.length > this.MAX_EVENTS) {
      this.events.shift();
    }

    // Update last triggered time
    rule.lastTriggered = alertEvent.timestamp;
    this.rules.set(rule.id, rule);

    logger.error('Alert triggered', {
      alertId: alertEvent.id,
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      value,
      threshold: rule.condition.threshold
    });

    // Send notifications
    await this.sendNotifications(rule, alertEvent);

    // Capture to Sentry
    sentryManager.captureMessage(
      `Alert: ${rule.name}`,
      rule.severity === 'critical' ? 'fatal' : 'error',
      {
        alert: alertEvent,
        rule: {
          id: rule.id,
          name: rule.name,
          type: rule.type
        }
      }
    );
  }

  /**
   * Send notifications for alert
   */
  private async sendNotifications(rule: AlertRule, alertEvent: AlertEvent): Promise<void> {
    const enabledChannels = rule.channels.filter(channel => channel.enabled);

    for (const channel of enabledChannels) {
      try {
        await this.sendNotification(channel, alertEvent);
      } catch (error) {
        logger.error('Failed to send alert notification', {
          alertId: alertEvent.id,
          channelType: channel.type,
          error: (error as Error).message
        });
      }
    }
  }

  /**
   * Send individual notification
   */
  private async sendNotification(channel: AlertChannel, alertEvent: AlertEvent): Promise<void> {
    switch (channel.type) {
      case 'email':
        await this.sendEmailNotification(channel, alertEvent);
        break;

      case 'slack':
        await this.sendSlackNotification(channel, alertEvent);
        break;

      case 'webhook':
        await this.sendWebhookNotification(channel, alertEvent);
        break;

      case 'sms':
        await this.sendSMSNotification(channel, alertEvent);
        break;

      default:
        logger.warn('Unknown notification channel type', { 
          type: channel.type,
          alertId: alertEvent.id 
        });
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(channel: AlertChannel, alertEvent: AlertEvent): Promise<void> {
    // This would integrate with your email service (SendGrid, SES, etc.)
    logger.info('Email notification sent', {
      alertId: alertEvent.id,
      target: channel.target,
      severity: alertEvent.severity
    });
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(channel: AlertChannel, alertEvent: AlertEvent): Promise<void> {
    if (!channel.target) return;

    const color = this.getSeverityColor(alertEvent.severity);
    const payload = {
      attachments: [
        {
          color,
          title: `🚨 ${alertEvent.ruleName}`,
          text: alertEvent.message,
          fields: [
            {
              title: 'Severity',
              value: alertEvent.severity.toUpperCase(),
              short: true
            },
            {
              title: 'Value',
              value: alertEvent.value.toString(),
              short: true
            },
            {
              title: 'Threshold',
              value: alertEvent.threshold.toString(),
              short: true
            },
            {
              title: 'Time',
              value: new Date(alertEvent.timestamp).toLocaleString(),
              short: true
            }
          ]
        }
      ]
    };

    await fetch(channel.target, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    logger.info('Slack notification sent', {
      alertId: alertEvent.id,
      severity: alertEvent.severity
    });
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(channel: AlertChannel, alertEvent: AlertEvent): Promise<void> {
    await fetch(channel.target, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alertEvent)
    });

    logger.info('Webhook notification sent', {
      alertId: alertEvent.id,
      target: channel.target
    });
  }

  /**
   * Send SMS notification
   */
  private async sendSMSNotification(channel: AlertChannel, alertEvent: AlertEvent): Promise<void> {
    // This would integrate with your SMS service (Twilio, etc.)
    logger.info('SMS notification sent', {
      alertId: alertEvent.id,
      target: channel.target,
      severity: alertEvent.severity
    });
  }

  /**
   * Get severity color for Slack
   */
  private getSeverityColor(severity: AlertRule['severity']): string {
    switch (severity) {
      case 'low': return '#36a64f';
      case 'medium': return '#ff9500';
      case 'high': return '#ff0000';
      case 'critical': return '#8b0000';
      default: return '#808080';
    }
  }

  /**
   * Generate alert message
   */
  private generateAlertMessage(rule: AlertRule, value: number): string {
    return `${rule.description}. Current value: ${value}, Threshold: ${rule.condition.threshold}`;
  }

  /**
   * Generate alert ID
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get error rate metric
   */
  private async getErrorRate(timeWindowMinutes: number): Promise<number> {
    // This would calculate error rate from logs or metrics
    // For now, return a mock value
    return Math.random() * 10; // 0-10%
  }

  /**
   * Get average response time metric
   */
  private async getAverageResponseTime(timeWindowMinutes: number): Promise<number> {
    // This would calculate average response time from logs or metrics
    // For now, return a mock value
    return Math.random() * 3000; // 0-3000ms
  }

  /**
   * Get service health score
   */
  private async getServiceHealthScore(): Promise<number> {
    const systemHealth = serviceHealthMonitor.getSystemHealth();
    
    // Convert status to numeric score
    switch (systemHealth.status) {
      case 'healthy': return 1;
      case 'degraded': return 0.5;
      case 'unhealthy': return 0;
      default: return 0;
    }
  }

  /**
   * Get custom metric
   */
  private async getCustomMetric(metric: string, timeWindowMinutes: number): Promise<number> {
    // This would fetch custom metrics from your monitoring system
    // For now, return mock values based on metric name
    switch (metric) {
      case 'memory_usage_percent':
        return Math.random() * 100;
      case 'cpu_usage_percent':
        return Math.random() * 100;
      case 'disk_usage_percent':
        return Math.random() * 100;
      default:
        return 0;
    }
  }

  /**
   * Get recent alert events
   */
  public getRecentEvents(count: number = 50): AlertEvent[] {
    return this.events.slice(-count);
  }

  /**
   * Get events by severity
   */
  public getEventsBySeverity(severity: AlertRule['severity']): AlertEvent[] {
    return this.events.filter(event => event.severity === severity);
  }

  /**
   * Resolve alert event
   */
  public resolveEvent(eventId: string): void {
    const event = this.events.find(e => e.id === eventId);
    if (event) {
      event.resolved = true;
      event.resolvedAt = new Date().toISOString();
      logger.info('Alert event resolved', { eventId });
    }
  }

  /**
   * Get alert statistics
   */
  public getStatistics(): {
    totalRules: number;
    enabledRules: number;
    totalEvents: number;
    eventsBySeverity: Record<AlertRule['severity'], number>;
    recentEvents: number;
  } {
    const enabledRules = Array.from(this.rules.values()).filter(r => r.enabled).length;
    const eventsBySeverity: Record<AlertRule['severity'], number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };

    this.events.forEach(event => {
      eventsBySeverity[event.severity]++;
    });

    const recentEvents = this.events.filter(event => {
      const eventTime = new Date(event.timestamp).getTime();
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      return eventTime > oneDayAgo;
    }).length;

    return {
      totalRules: this.rules.size,
      enabledRules,
      totalEvents: this.events.length,
      eventsBySeverity,
      recentEvents
    };
  }
}

// Export singleton instance
export const alertManager = AlertManager.getInstance();

// Convenience functions
export const addAlertRule = (rule: AlertRule) => alertManager.setRule(rule);
export const removeAlertRule = (ruleId: string) => alertManager.removeRule(ruleId);
export const getAlertRule = (ruleId: string) => alertManager.getRule(ruleId);
export const getAllAlertRules = () => alertManager.getAllRules();
export const startAlertMonitoring = (intervalMs?: number) => alertManager.startMonitoring(intervalMs);
export const stopAlertMonitoring = () => alertManager.stopMonitoring();
export const getRecentAlerts = (count?: number) => alertManager.getRecentEvents(count);
export const getAlertStatistics = () => alertManager.getStatistics();
