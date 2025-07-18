
import { EventEmitter } from 'events';

export interface HookEvent {
  eventId: string;
  eventName: string;
  timestamp: Date;
  source: string;
  payload: any;
  metadata?: Record<string, any>;
}

export interface HookSubscription {
  id: string;
  eventName: string;
  callback: (event: HookEvent) => Promise<void> | void;
  filter?: (event: HookEvent) => boolean;
  active: boolean;
  createdAt: Date;
}

export interface WebhookConfig {
  url: string;
  method: 'POST' | 'PUT' | 'PATCH';
  headers?: Record<string, string>;
  retryAttempts: number;
  timeout: number;
}

export class IntegrationHooks {
  private events: EventEmitter;
  private subscriptions: Map<string, HookSubscription>;
  private webhooks: Map<string, WebhookConfig>;
  private eventHistory: HookEvent[];
  private maxHistorySize: number;

  constructor(maxHistorySize = 1000) {
    this.events = new EventEmitter();
    this.subscriptions = new Map();
    this.webhooks = new Map();
    this.eventHistory = [];
    this.maxHistorySize = maxHistorySize;
    this.setupInternalHandlers();
  }

  private setupInternalHandlers(): void {
    // Log all events for debugging
    this.events.on('*', (eventName: string, payload: any) => {
      console.log(`Integration Hook Event: ${eventName}`, { payload });
    });

    // Handle webhook notifications
    this.events.on('webhook', this.handleWebhookEvent.bind(this));
  }

  /**
   * Subscribe to specific events with optional filtering
   */
  public subscribe(
    eventName: string, 
    callback: (event: HookEvent) => Promise<void> | void,
    filter?: (event: HookEvent) => boolean
  ): string {
    const subscriptionId = this.generateId();
    const subscription: HookSubscription = {
      id: subscriptionId,
      eventName,
      callback,
      filter,
      active: true,
      createdAt: new Date()
    };

    this.subscriptions.set(subscriptionId, subscription);
    
    // Set up event listener
    this.events.on(eventName, async (payload: any) => {
      if (!subscription.active) return;

      const event: HookEvent = {
        eventId: this.generateId(),
        eventName,
        timestamp: new Date(),
        source: 'content-analysis',
        payload,
        metadata: { subscriptionId }
      };

      // Apply filter if provided
      if (subscription.filter && !subscription.filter(event)) {
        return;
      }

      try {
        await subscription.callback(event);
      } catch (error) {
        console.error(`Error in subscription ${subscriptionId} for event ${eventName}:`, error);
        this.emitEvent('subscriptionError', { subscriptionId, eventName, error: error.message });
      }
    });

    console.log(`Subscription ${subscriptionId} created for event: ${eventName}`);
    return subscriptionId;
  }

  /**
   * Unsubscribe from events
   */
  public unsubscribe(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      return false;
    }

    subscription.active = false;
    this.subscriptions.delete(subscriptionId);
    console.log(`Subscription ${subscriptionId} removed`);
    return true;
  }

  /**
   * Register a webhook endpoint for event notifications
   */
  public registerWebhook(eventName: string, config: WebhookConfig): string {
    const webhookId = this.generateId();
    this.webhooks.set(webhookId, config);

    // Subscribe to the event and trigger webhook
    this.subscribe(eventName, async (event: HookEvent) => {
      await this.triggerWebhook(webhookId, event);
    });

    console.log(`Webhook ${webhookId} registered for event: ${eventName}`);
    return webhookId;
  }

  /**
   * Remove a webhook registration
   */
  public removeWebhook(webhookId: string): boolean {
    const removed = this.webhooks.delete(webhookId);
    if (removed) {
      console.log(`Webhook ${webhookId} removed`);
    }
    return removed;
  }

  private async triggerWebhook(webhookId: string, event: HookEvent): Promise<void> {
    const config = this.webhooks.get(webhookId);
    if (!config) return;

    let attempt = 0;
    while (attempt <= config.retryAttempts) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeout);

        const response = await fetch(config.url, {
          method: config.method,
          headers: {
            'Content-Type': 'application/json',
            ...config.headers
          },
          body: JSON.stringify(event),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          console.log(`Webhook ${webhookId} triggered successfully for event ${event.eventName}`);
          return;
        } else {
          throw new Error(`Webhook returned status ${response.status}`);
        }
      } catch (error) {
        attempt++;
        console.error(`Webhook ${webhookId} attempt ${attempt} failed:`, error.message);
        
        if (attempt <= config.retryAttempts) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 30000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    console.error(`Webhook ${webhookId} failed after ${config.retryAttempts + 1} attempts`);
    this.emitEvent('webhookFailed', { webhookId, eventName: event.eventName, attempts: attempt });
  }

  /**
   * Emit a custom event that external systems can subscribe to
   */
  public emitEvent(eventName: string, payload: any, metadata?: Record<string, any>): void {
    const event: HookEvent = {
      eventId: this.generateId(),
      eventName,
      timestamp: new Date(),
      source: 'content-analysis',
      payload,
      metadata
    };

    // Add to history
    this.addToHistory(event);

    // Emit the event
    this.events.emit(eventName, payload);
    this.events.emit('*', eventName, payload);

    console.log(`Event emitted: ${eventName}`);
  }

  private addToHistory(event: HookEvent): void {
    this.eventHistory.push(event);
    
    // Maintain history size limit
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }

  private handleWebhookEvent(payload: any): void {
    console.log('Webhook event received:', payload);
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get all active subscriptions
   */
  public getSubscriptions(): HookSubscription[] {
    return Array.from(this.subscriptions.values()).filter(sub => sub.active);
  }

  /**
   * Get event history with optional filtering
   */
  public getEventHistory(eventName?: string, limit?: number): HookEvent[] {
    let history = this.eventHistory;
    
    if (eventName) {
      history = history.filter(event => event.eventName === eventName);
    }
    
    if (limit) {
      history = history.slice(-limit);
    }
    
    return history;
  }

  /**
   * Get webhook configurations
   */
  public getWebhooks(): Array<{ id: string; config: WebhookConfig }> {
    return Array.from(this.webhooks.entries()).map(([id, config]) => ({ id, config }));
  }

  /**
   * Clear event history
   */
  public clearHistory(): void {
    this.eventHistory = [];
    console.log('Event history cleared');
  }

  /**
   * Get system health status
   */
  public getHealthStatus(): {
    activeSubscriptions: number;
    registeredWebhooks: number;
    eventHistorySize: number;
    recentEvents: number;
  } {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    
    return {
      activeSubscriptions: this.getSubscriptions().length,
      registeredWebhooks: this.webhooks.size,
      eventHistorySize: this.eventHistory.length,
      recentEvents: this.eventHistory.filter(event => event.timestamp > fiveMinutesAgo).length
    };
  }
}

// Singleton instance for global use
export const integrationHooks = new IntegrationHooks();
