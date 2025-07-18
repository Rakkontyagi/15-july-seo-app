
import { EventEmitter } from 'events';

export interface ContentGeneratedEvent {
  contentId: string;
  contentType: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface TriggerSystemConfig {
  maxRetries: number;
  retryDelayMs: number;
}

export class TriggerSystem {
  private events: EventEmitter;
  private config: TriggerSystemConfig;

  constructor(config: TriggerSystemConfig = { maxRetries: 3, retryDelayMs: 1000 }) {
    this.events = new EventEmitter();
    this.config = config;
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.events.on('contentGenerated', this.handleContentGenerated.bind(this));
  }

  private async handleContentGenerated(event: ContentGeneratedEvent): Promise<void> {
    try {
      console.log(`Content generated: ${event.contentId}. Initiating analysis...`);
      // Emit analysis start event for workflow orchestrator
      this.events.emit('startAnalysis', event.contentId);
    } catch (error) {
      console.error(`Failed to handle content generation event for ${event.contentId}:`, error);
      this.events.emit('triggerError', { contentId: event.contentId, error });
    }
  }

  public triggerContentAnalysis(event: ContentGeneratedEvent): void {
    this.events.emit('contentGenerated', event);
  }

  public on(event: string, listener: (...args: any[]) => void): void {
    this.events.on(event, listener);
  }

  public off(event: string, listener: (...args: any[]) => void): void {
    this.events.off(event, listener);
  }
}

// Singleton instance for global use
export const triggerSystem = new TriggerSystem();
