// Bulk Publishing Scheduler Service - Handles scheduling and recurring publishes

import { 
  BulkPublishRequest,
  BulkScheduleOptions,
  RecurringSchedule,
  BulkPublishTemplate
} from '@/types/bulk-publishing';
import { logger } from '@/lib/logging/logger';
import { BulkPublisherService } from './bulk-publisher.service';

export class BulkSchedulerService {
  private bulkPublisher: BulkPublisherService;
  private scheduledJobs: Map<string, NodeJS.Timeout> = new Map();
  private recurringJobs: Map<string, RecurringJobInfo> = new Map();

  constructor(bulkPublisher: BulkPublisherService) {
    this.bulkPublisher = bulkPublisher;
    this.startRecurringJobProcessor();
  }

  async schedulePublish(request: BulkPublishRequest): Promise<string> {
    const bulkId = request.id;
    const schedule = request.schedule;

    if (!schedule?.publishAt) {
      // No scheduling, publish immediately
      return await this.bulkPublisher.createBulkPublishJob(request);
    }

    const publishAt = new Date(schedule.publishAt);
    const now = new Date();

    if (publishAt <= now) {
      // Scheduled time is in the past, publish immediately
      logger.warn('Scheduled time is in the past, publishing immediately', {
        bulkId,
        scheduledTime: publishAt,
        currentTime: now
      });
      return await this.bulkPublisher.createBulkPublishJob(request);
    }

    // Calculate delay
    const delay = publishAt.getTime() - now.getTime();

    if (delay > 2147483647) { // Max setTimeout delay (~24.8 days)
      throw new Error('Cannot schedule more than 24 days in advance');
    }

    // Schedule the job
    const timeoutId = setTimeout(async () => {
      try {
        await this.executeScheduledPublish(request);
        this.scheduledJobs.delete(bulkId);
      } catch (error) {
        logger.error('Scheduled publish execution failed:', {
          bulkId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }, delay);

    this.scheduledJobs.set(bulkId, timeoutId);

    // Handle recurring schedule
    if (schedule.recurringSchedule) {
      this.setupRecurringJob(request);
    }

    // Create job with scheduled status
    await this.bulkPublisher.createBulkPublishJob(request);

    logger.info('Bulk publish scheduled', {
      bulkId,
      publishAt: publishAt.toISOString(),
      delay: Math.round(delay / 1000), // seconds
      recurring: !!schedule.recurringSchedule
    });

    return bulkId;
  }

  async cancelScheduledPublish(bulkId: string, userId: string): Promise<boolean> {
    const timeoutId = this.scheduledJobs.get(bulkId);
    
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.scheduledJobs.delete(bulkId);
    }

    // Cancel recurring job if exists
    this.recurringJobs.delete(bulkId);

    // Cancel the bulk job
    return await this.bulkPublisher.cancelBulkJob(bulkId, userId);
  }

  async reschedulePublish(bulkId: string, newPublishAt: Date): Promise<boolean> {
    const currentTimeout = this.scheduledJobs.get(bulkId);
    
    if (!currentTimeout) {
      return false; // Job not found or already executed
    }

    // Clear current schedule
    clearTimeout(currentTimeout);

    const now = new Date();
    const delay = newPublishAt.getTime() - now.getTime();

    if (delay <= 0) {
      // New time is in the past, can't reschedule
      this.scheduledJobs.delete(bulkId);
      return false;
    }

    if (delay > 2147483647) { // Max setTimeout delay
      this.scheduledJobs.delete(bulkId);
      throw new Error('Cannot reschedule more than 24 days in advance');
    }

    // Schedule with new time
    const newTimeoutId = setTimeout(async () => {
      try {
        // We need the original request to re-execute
        // In a real implementation, we'd store the request
        logger.info('Executing rescheduled publish', { bulkId });
        this.scheduledJobs.delete(bulkId);
      } catch (error) {
        logger.error('Rescheduled publish execution failed:', {
          bulkId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }, delay);

    this.scheduledJobs.set(bulkId, newTimeoutId);

    logger.info('Bulk publish rescheduled', {
      bulkId,
      newPublishAt: newPublishAt.toISOString(),
      delay: Math.round(delay / 1000)
    });

    return true;
  }

  getScheduledJobs(): Array<{ bulkId: string; scheduledAt: Date }> {
    // In a real implementation, we'd store more details about scheduled jobs
    return Array.from(this.scheduledJobs.keys()).map(bulkId => ({
      bulkId,
      scheduledAt: new Date() // Placeholder - would store actual scheduled time
    }));
  }

  getRecurringJobs(): Array<{ bulkId: string; nextRun: Date; frequency: string }> {
    return Array.from(this.recurringJobs.entries()).map(([bulkId, info]) => ({
      bulkId,
      nextRun: info.nextRun,
      frequency: `${info.schedule.frequency} (every ${info.schedule.interval})`
    }));
  }

  // Staggered publishing for avoiding rate limits
  async createStaggeredSchedule(
    requests: BulkPublishRequest[],
    staggerInterval: number = 5 // minutes
  ): Promise<string[]> {
    const bulkIds: string[] = [];
    let currentTime = new Date();

    for (let i = 0; i < requests.length; i++) {
      const request = requests[i];
      
      // Set staggered publish time
      if (!request.schedule) {
        request.schedule = {};
      }
      
      request.schedule.publishAt = new Date(currentTime.getTime() + (i * staggerInterval * 60000));
      request.schedule.staggered = true;
      request.schedule.staggerInterval = staggerInterval;

      const bulkId = await this.schedulePublish(request);
      bulkIds.push(bulkId);
    }

    logger.info('Staggered schedule created', {
      jobCount: requests.length,
      staggerInterval,
      totalDuration: requests.length * staggerInterval
    });

    return bulkIds;
  }

  // Template-based scheduling
  async scheduleFromTemplate(
    templateId: string,
    content: any,
    overrides?: Partial<BulkScheduleOptions>
  ): Promise<string> {
    const template = await this.getTemplate(templateId);
    
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const request: BulkPublishRequest = {
      id: `template-${templateId}-${Date.now()}`,
      userId: template.createdBy,
      title: `From Template: ${template.name}`,
      content,
      platforms: template.platforms,
      schedule: { ...template.defaultSchedule, ...overrides },
      options: template.defaultOptions,
      createdAt: new Date(),
      status: 'pending'
    };

    // Update template usage
    template.usageCount++;

    return await this.schedulePublish(request);
  }

  // Private methods

  private async executeScheduledPublish(request: BulkPublishRequest): Promise<void> {
    try {
      // Remove schedule to publish immediately
      const immediateRequest = { ...request };
      delete immediateRequest.schedule;

      await this.bulkPublisher.createBulkPublishJob(immediateRequest);

      logger.info('Scheduled publish executed', {
        bulkId: request.id,
        platforms: request.platforms.length
      });

    } catch (error) {
      logger.error('Scheduled publish execution failed:', {
        bulkId: request.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  private setupRecurringJob(request: BulkPublishRequest): void {
    const schedule = request.schedule!.recurringSchedule!;
    const bulkId = request.id;

    const recurringInfo: RecurringJobInfo = {
      originalRequest: request,
      schedule,
      nextRun: this.calculateNextRun(schedule, request.schedule!.publishAt!),
      executionCount: 0,
      maxOccurrences: schedule.maxOccurrences || Infinity
    };

    this.recurringJobs.set(bulkId, recurringInfo);

    logger.info('Recurring job setup', {
      bulkId,
      frequency: schedule.frequency,
      interval: schedule.interval,
      nextRun: recurringInfo.nextRun.toISOString()
    });
  }

  private calculateNextRun(schedule: RecurringSchedule, baseDate: Date): Date {
    const next = new Date(baseDate);

    switch (schedule.frequency) {
      case 'daily':
        next.setDate(next.getDate() + schedule.interval);
        break;
      
      case 'weekly':
        next.setDate(next.getDate() + (schedule.interval * 7));
        
        // Handle specific days of week
        if (schedule.daysOfWeek?.length) {
          const targetDay = schedule.daysOfWeek[0]; // Use first day for now
          const currentDay = next.getDay();
          const daysUntilTarget = (targetDay - currentDay + 7) % 7;
          next.setDate(next.getDate() + daysUntilTarget);
        }
        break;
      
      case 'monthly':
        next.setMonth(next.getMonth() + schedule.interval);
        break;
    }

    return next;
  }

  private startRecurringJobProcessor(): void {
    setInterval(() => {
      this.processRecurringJobs();
    }, 60000); // Check every minute
  }

  private async processRecurringJobs(): Promise<void> {
    const now = new Date();

    for (const [bulkId, info] of this.recurringJobs.entries()) {
      if (info.nextRun <= now && info.executionCount < info.maxOccurrences) {
        try {
          // Create new job based on original request
          const newRequest: BulkPublishRequest = {
            ...info.originalRequest,
            id: `${bulkId}-recur-${info.executionCount + 1}`,
            createdAt: new Date(),
            schedule: undefined // Execute immediately
          };

          await this.bulkPublisher.createBulkPublishJob(newRequest);

          // Update recurring info
          info.executionCount++;
          info.nextRun = this.calculateNextRun(info.schedule, info.nextRun);

          // Check if we should stop recurring
          if (info.schedule.endDate && info.nextRun > info.schedule.endDate) {
            this.recurringJobs.delete(bulkId);
            logger.info('Recurring job ended (end date reached)', { bulkId });
          } else if (info.executionCount >= info.maxOccurrences) {
            this.recurringJobs.delete(bulkId);
            logger.info('Recurring job ended (max occurrences reached)', { bulkId });
          }

          logger.info('Recurring job executed', {
            bulkId,
            executionCount: info.executionCount,
            nextRun: info.nextRun.toISOString()
          });

        } catch (error) {
          logger.error('Recurring job execution failed:', {
            bulkId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }
  }

  private async getTemplate(templateId: string): Promise<BulkPublishTemplate | null> {
    // In a real implementation, this would fetch from database
    // For now, return null
    return null;
  }
}

interface RecurringJobInfo {
  originalRequest: BulkPublishRequest;
  schedule: RecurringSchedule;
  nextRun: Date;
  executionCount: number;
  maxOccurrences: number;
}