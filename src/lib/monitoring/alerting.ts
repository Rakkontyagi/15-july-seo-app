/**
 * Automated Alerting System for SEO Automation App
 * Provides real-time monitoring and alerting for critical system events
 */

import { sentryManager } from './sentry';
import { logger } from '@/lib/logging/logger';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertCategory = 'performance' | 'error' | 'security' | 'availability' | 'business';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'suppressed';

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  category: AlertCategory;
  severity: AlertSeverity;
  condition: AlertCondition;
  threshold: number;
  timeWindow: number; // in minutes
  enabled: boolean;
  notificationChannels: string[];
  suppressionRules?: SuppressionRule[];
}

export interface AlertCondition {
  metric: string;
  operator: '>' | '<' | '=' | '>=' | '<=' | '!=';
  value: number;
  aggregation?: 'avg' | 'sum' | 'min' | 'max' | 'count';
  groupBy?: string[];
}

export interface SuppressionRule {
  startTime: string; // HH:MM format
  endTime: string;
  days: string[]; // ['monday', 'tuesday', etc.]
  reason: string;
}

export interface Alert {
  id: string;
  ruleId: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  category: AlertCategory;
  status: AlertStatus;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolvedBy?: string;
  metadata: Record<string, any>;
  occurrenceCount: number;
  lastOccurrence: Date;
}

export interface NotificationChannel {
  id: string;
  name: string;
  type: 'email' | 'slack' | 'webhook' | 'pagerduty' | 'sms';
  configuration: Record<string, any>;
  enabled: boolean;
  severityFilters: AlertSeverity[];
  categoryFilters: AlertCategory[];
}

class AlertingSystem {
  private static instance: AlertingSystem;
  private rules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, Alert> = new Map();
  private notificationChannels: Map<string, NotificationChannel> = new Map();
  private metricValues: Map<string, number[]> = new Map();
  private evaluationInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): AlertingSystem {
    if (!AlertingSystem.instance) {
      AlertingSystem.instance = new AlertingSystem();
    }
    return AlertingSystem.instance;
  }

  /**
   * Initialize the alerting system with default rules
   */
  initialize(): void {
    if (this.isInitialized) return;

    this.setupDefaultRules();
    this.setupDefaultChannels();
    this.startEvaluation();
    
    this.isInitialized = true;
    logger.info('Alerting system initialized successfully');
  }

  /**
   * Setup default alerting rules
   */
  private setupDefaultRules(): void {
    const defaultRules: AlertRule[] = [
      {
        id: 'high-error-rate',
        name: 'High Error Rate',
        description: 'Error rate exceeds 5% over 5 minutes',
        category: 'error',
        severity: 'critical',
        condition: {
          metric: 'error_rate',
          operator: '>',
          value: 5,
          aggregation: 'avg'
        },
        threshold: 5,
        timeWindow: 5,
        enabled: true,
        notificationChannels: ['email', 'slack']
      },
      {
        id: 'slow-response-time',
        name: 'Slow Response Time',
        description: 'API response time exceeds 2 seconds',
        category: 'performance',
        severity: 'high',
        condition: {
          metric: 'api_response_time',
          operator: '>',
          value: 2000,
          aggregation: 'avg'
        },
        threshold: 2000,
        timeWindow: 10,
        enabled: true,
        notificationChannels: ['email']
      },
      {
        id: 'high-cpu-usage',
        name: 'High CPU Usage',
        description: 'CPU usage exceeds 80%',
        category: 'performance',
        severity: 'high',
        condition: {
          metric: 'cpu_usage',
          operator: '>',
          value: 80,
          aggregation: 'avg'
        },
        threshold: 80,
        timeWindow: 5,
        enabled: true,
        notificationChannels: ['email', 'slack']
      },
      {
        id: 'database-connection-failure',
        name: 'Database Connection Failure',
        description: 'Database connection failures detected',
        category: 'availability',
        severity: 'critical',
        condition: {
          metric: 'db_connection_errors',
          operator: '>',
          value: 0,
          aggregation: 'count'
        },
        threshold: 0,
        timeWindow: 2,
        enabled: true,
        notificationChannels: ['email', 'slack', 'pagerduty']
      },
      {
        id: 'low-content-generation-success',
        name: 'Low Content Generation Success Rate',
        description: 'Content generation success rate below 95%',
        category: 'business',
        severity: 'medium',
        condition: {
          metric: 'content_generation_success_rate',
          operator: '<',
          value: 95,
          aggregation: 'avg'
        },
        threshold: 95,
        timeWindow: 15,
        enabled: true,
        notificationChannels: ['email']
      }
    ];

    defaultRules.forEach(rule => this.rules.set(rule.id, rule));
  }

  /**
   * Setup default notification channels
   */
  private setupDefaultChannels(): void {
    const defaultChannels: NotificationChannel[] = [
      {
        id: 'email',
        name: 'Email Alerts',
        type: 'email',
        configuration: {
          recipients: ['admin@seoautomation.app', 'dev@seoautomation.app'],
          smtpServer: process.env.SMTP_SERVER,
          smtpPort: process.env.SMTP_PORT,
          username: process.env.SMTP_USERNAME,
          password: process.env.SMTP_PASSWORD
        },
        enabled: true,
        severityFilters: ['medium', 'high', 'critical'],
        categoryFilters: ['performance', 'error', 'availability', 'business']
      },
      {
        id: 'slack',
        name: 'Slack Notifications',
        type: 'slack',
        configuration: {
          webhookUrl: process.env.SLACK_WEBHOOK_URL,
          channel: '#alerts',
          username: 'SEO Automation Alerts'
        },
        enabled: !!process.env.SLACK_WEBHOOK_URL,
        severityFilters: ['high', 'critical'],
        categoryFilters: ['performance', 'error', 'availability']
      },
      {
        id: 'pagerduty',
        name: 'PagerDuty',
        type: 'pagerduty',
        configuration: {
          integrationKey: process.env.PAGERDUTY_INTEGRATION_KEY,
          serviceId: process.env.PAGERDUTY_SERVICE_ID
        },
        enabled: !!process.env.PAGERDUTY_INTEGRATION_KEY,
        severityFilters: ['critical'],
        categoryFilters: ['availability', 'error']
      }
    ];

    defaultChannels.forEach(channel => this.notificationChannels.set(channel.id, channel));
  }

  /**
   * Start periodic evaluation of alert rules
   */
  private startEvaluation(): void {
    if (this.evaluationInterval) {
      clearInterval(this.evaluationInterval);
    }

    this.evaluationInterval = setInterval(() => {
      this.evaluateRules();
    }, 60000); // Evaluate every minute
  }

  /**
   * Record a metric value for alerting evaluation
   */
  recordMetric(name: string, value: number): void {
    if (!this.metricValues.has(name)) {
      this.metricValues.set(name, []);
    }

    const values = this.metricValues.get(name)!;
    values.push(value);

    // Keep only last 100 values
    if (values.length > 100) {
      values.shift();
    }

    // Immediate evaluation for critical metrics
    if (this.isCriticalMetric(name)) {
      this.evaluateRulesForMetric(name);
    }
  }

  /**
   * Check if a metric is critical and needs immediate evaluation
   */
  private isCriticalMetric(name: string): boolean {
    const criticalMetrics = ['error_rate', 'db_connection_errors', 'api_response_time'];
    return criticalMetrics.includes(name);
  }

  /**
   * Evaluate all alert rules
   */
  private evaluateRules(): void {
    this.rules.forEach(rule => {
      if (rule.enabled && !this.isSuppressed(rule)) {
        this.evaluateRule(rule);
      }
    });
  }

  /**
   * Evaluate rules for a specific metric
   */
  private evaluateRulesForMetric(metricName: string): void {
    this.rules.forEach(rule => {
      if (rule.enabled && rule.condition.metric === metricName && !this.isSuppressed(rule)) {
        this.evaluateRule(rule);
      }
    });
  }

  /**
   * Evaluate a single alert rule
   */
  private evaluateRule(rule: AlertRule): void {
    const metricValues = this.metricValues.get(rule.condition.metric);
    if (!metricValues || metricValues.length === 0) return;

    // Calculate time window
    const now = Date.now();
    const windowStart = now - (rule.timeWindow * 60 * 1000);
    
    // For simplicity, we'll use all available values
    // In a real implementation, you'd filter by timestamp
    const relevantValues = metricValues.slice(-Math.min(metricValues.length, rule.timeWindow));
    
    if (relevantValues.length === 0) return;

    // Calculate aggregated value
    let aggregatedValue: number;
    switch (rule.condition.aggregation) {
      case 'avg':
        aggregatedValue = relevantValues.reduce((sum, val) => sum + val, 0) / relevantValues.length;
        break;
      case 'sum':
        aggregatedValue = relevantValues.reduce((sum, val) => sum + val, 0);
        break;
      case 'min':
        aggregatedValue = Math.min(...relevantValues);
        break;
      case 'max':
        aggregatedValue = Math.max(...relevantValues);
        break;
      case 'count':
        aggregatedValue = relevantValues.length;
        break;
      default:
        aggregatedValue = relevantValues[relevantValues.length - 1]; // Latest value
    }

    // Evaluate condition
    const conditionMet = this.evaluateCondition(rule.condition, aggregatedValue);
    
    const existingAlert = this.activeAlerts.get(rule.id);
    
    if (conditionMet) {
      if (existingAlert) {
        // Update existing alert
        existingAlert.occurrenceCount++;
        existingAlert.lastOccurrence = new Date();
        existingAlert.updatedAt = new Date();
      } else {
        // Create new alert
        const alert: Alert = {
          id: `alert_${rule.id}_${Date.now()}`,
          ruleId: rule.id,
          title: rule.name,
          description: rule.description,
          severity: rule.severity,
          category: rule.category,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata: {
            metric: rule.condition.metric,
            value: aggregatedValue,
            threshold: rule.threshold,
            condition: rule.condition
          },
          occurrenceCount: 1,
          lastOccurrence: new Date()
        };

        this.activeAlerts.set(rule.id, alert);
        this.sendNotifications(alert, rule);
        
        // Log to Sentry
        sentryManager.captureMessage(
          `Alert triggered: ${rule.name}`,
          'error',
          {
            alert: alert,
            rule: rule,
            metricValue: aggregatedValue
          }
        );
      }
    } else if (existingAlert && existingAlert.status === 'active') {
      // Auto-resolve alert if condition is no longer met
      this.resolveAlert(existingAlert.id, 'system');
    }
  }

  /**
   * Evaluate alert condition
   */
  private evaluateCondition(condition: AlertCondition, value: number): boolean {
    switch (condition.operator) {
      case '>': return value > condition.value;
      case '<': return value < condition.value;
      case '=': return value === condition.value;
      case '>=': return value >= condition.value;
      case '<=': return value <= condition.value;
      case '!=': return value !== condition.value;
      default: return false;
    }
  }

  /**
   * Check if a rule is currently suppressed
   */
  private isSuppressed(rule: AlertRule): boolean {
    if (!rule.suppressionRules || rule.suppressionRules.length === 0) {
      return false;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

    return rule.suppressionRules.some(suppression => {
      const startTime = this.parseTime(suppression.startTime);
      const endTime = this.parseTime(suppression.endTime);
      const isDayMatch = suppression.days.includes(currentDay);
      const isTimeMatch = currentTime >= startTime && currentTime <= endTime;
      
      return isDayMatch && isTimeMatch;
    });
  }

  /**
   * Parse time string to minutes
   */
  private parseTime(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Send notifications for an alert
   */
  private async sendNotifications(alert: Alert, rule: AlertRule): Promise<void> {
    const channels = rule.notificationChannels
      .map(id => this.notificationChannels.get(id))
      .filter(channel => 
        channel?.enabled && 
        channel.severityFilters.includes(alert.severity) &&
        channel.categoryFilters.includes(alert.category)
      );

    for (const channel of channels) {
      if (channel) {
        try {
          await this.sendNotification(channel, alert);
        } catch (error) {
          logger.error(`Failed to send notification to ${channel.name}`, { error, alert });
        }
      }
    }
  }

  /**
   * Send notification to a specific channel
   */
  private async sendNotification(channel: NotificationChannel, alert: Alert): Promise<void> {
    const payload = this.formatNotificationPayload(alert, channel);
    
    switch (channel.type) {
      case 'email':
        await this.sendEmailNotification(channel, payload);
        break;
      case 'slack':
        await this.sendSlackNotification(channel, payload);
        break;
      case 'webhook':
        await this.sendWebhookNotification(channel, payload);
        break;
      case 'pagerduty':
        await this.sendPagerDutyNotification(channel, payload);
        break;
      default:
        logger.warn(`Unknown notification channel type: ${channel.type}`);
    }
  }

  /**
   * Format notification payload for a channel
   */
  private formatNotificationPayload(alert: Alert, channel: NotificationChannel): any {
    const basePayload = {
      alert_id: alert.id,
      title: alert.title,
      description: alert.description,
      severity: alert.severity,
      category: alert.category,
      created_at: alert.createdAt,
      metadata: alert.metadata
    };

    switch (channel.type) {
      case 'slack':
        return {
          text: `🚨 *${alert.title}*`,
          attachments: [
            {
              color: this.getSeverityColor(alert.severity),
              fields: [
                { title: 'Description', value: alert.description, short: false },
                { title: 'Severity', value: alert.severity.toUpperCase(), short: true },
                { title: 'Category', value: alert.category, short: true },
                { title: 'Created', value: alert.createdAt.toISOString(), short: true }
              ]
            }
          ]
        };
      default:
        return basePayload;
    }
  }

  /**
   * Get color for severity level
   */
  private getSeverityColor(severity: AlertSeverity): string {
    switch (severity) {
      case 'critical': return '#ff0000';
      case 'high': return '#ff8800';
      case 'medium': return '#ffaa00';
      case 'low': return '#00aa00';
      default: return '#888888';
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(channel: NotificationChannel, payload: any): Promise<void> {
    // In a real implementation, you'd use an email service like SendGrid, AWS SES, etc.
    logger.info('Email notification sent', { channel: channel.name, payload });
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(channel: NotificationChannel, payload: any): Promise<void> {
    if (!channel.configuration.webhookUrl) {
      throw new Error('Slack webhook URL not configured');
    }

    const response = await fetch(channel.configuration.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Slack notification failed: ${response.statusText}`);
    }
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(channel: NotificationChannel, payload: any): Promise<void> {
    if (!channel.configuration.url) {
      throw new Error('Webhook URL not configured');
    }

    const response = await fetch(channel.configuration.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Webhook notification failed: ${response.statusText}`);
    }
  }

  /**
   * Send PagerDuty notification
   */
  private async sendPagerDutyNotification(channel: NotificationChannel, payload: any): Promise<void> {
    // In a real implementation, you'd use PagerDuty Events API
    logger.info('PagerDuty notification sent', { channel: channel.name, payload });
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string, userId: string): void {
    const alert = this.activeAlerts.get(alertId);
    if (alert && alert.status === 'active') {
      alert.status = 'acknowledged';
      alert.acknowledgedAt = new Date();
      alert.acknowledgedBy = userId;
      alert.updatedAt = new Date();
      
      logger.info(`Alert acknowledged: ${alertId} by ${userId}`);
    }
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string, userId: string): void {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.status = 'resolved';
      alert.resolvedAt = new Date();
      alert.resolvedBy = userId;
      alert.updatedAt = new Date();
      
      // Remove from active alerts
      this.activeAlerts.delete(alertId);
      
      logger.info(`Alert resolved: ${alertId} by ${userId}`);
    }
  }

  /**
   * Get all active alerts
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values());
  }

  /**
   * Get alert by ID
   */
  getAlert(alertId: string): Alert | undefined {
    return this.activeAlerts.get(alertId);
  }

  /**
   * Add or update an alert rule
   */
  setRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule);
  }

  /**
   * Remove an alert rule
   */
  removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
  }

  /**
   * Get all alert rules
   */
  getRules(): AlertRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Add or update a notification channel
   */
  setNotificationChannel(channel: NotificationChannel): void {
    this.notificationChannels.set(channel.id, channel);
  }

  /**
   * Remove a notification channel
   */
  removeNotificationChannel(channelId: string): void {
    this.notificationChannels.delete(channelId);
  }

  /**
   * Get all notification channels
   */
  getNotificationChannels(): NotificationChannel[] {
    return Array.from(this.notificationChannels.values());
  }

  /**
   * Get alerting system statistics
   */
  getStats(): {
    totalRules: number;
    enabledRules: number;
    activeAlerts: number;
    totalChannels: number;
    enabledChannels: number;
  } {
    return {
      totalRules: this.rules.size,
      enabledRules: Array.from(this.rules.values()).filter(r => r.enabled).length,
      activeAlerts: this.activeAlerts.size,
      totalChannels: this.notificationChannels.size,
      enabledChannels: Array.from(this.notificationChannels.values()).filter(c => c.enabled).length
    };
  }

  /**
   * Shutdown the alerting system
   */
  shutdown(): void {
    if (this.evaluationInterval) {
      clearInterval(this.evaluationInterval);
      this.evaluationInterval = null;
    }
    
    this.isInitialized = false;
    logger.info('Alerting system shutdown');
  }
}

// Export singleton instance
export const alertingSystem = AlertingSystem.getInstance();

// Convenience functions
export const recordMetric = (name: string, value: number) => 
  alertingSystem.recordMetric(name, value);

export const acknowledgeAlert = (alertId: string, userId: string) => 
  alertingSystem.acknowledgeAlert(alertId, userId);

export const resolveAlert = (alertId: string, userId: string) => 
  alertingSystem.resolveAlert(alertId, userId);

export const getActiveAlerts = () => 
  alertingSystem.getActiveAlerts();

export const initializeAlerting = () => 
  alertingSystem.initialize();