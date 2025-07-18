// Bulk Publishing Service - Core orchestration service

import { 
  BulkPublishRequest,
  BulkPublishProgress,
  BulkPublishStatus,
  PlatformPublishResult,
  BulkPublishError,
  BulkPublishQueueItem,
  BulkPublishFilters,
  BulkPublishStats,
  BulkPublishAnalytics
} from '@/types/bulk-publishing';
import { CMSPlatform, CMSPublishResult } from '@/types/cms';
import { WordPressService } from '@/lib/cms/wordpress.service';
import { ShopifyService } from '@/lib/cms/shopify.service';
import { HubSpotService } from '@/lib/cms/hubspot.service';
import { BaseCMSService } from '@/lib/cms/base.cms.service';
import { logger } from '@/lib/logging/logger';
import EventEmitter from 'events';

export class BulkPublisherService extends EventEmitter {
  private activeJobs: Map<string, BulkPublishProgress> = new Map();
  private publishQueue: BulkPublishQueueItem[] = [];
  private isProcessing: boolean = false;
  private maxConcurrentJobs: number = 3;
  private retryDelayMs: number = 5000; // 5 seconds default

  constructor() {
    super();
    this.startQueueProcessor();
  }

  async createBulkPublishJob(request: BulkPublishRequest): Promise<string> {
    const bulkId = request.id;
    
    // Validate request
    this.validateBulkRequest(request);

    // Create initial progress tracking
    const progress: BulkPublishProgress = {
      bulkId,
      status: request.schedule?.publishAt && request.schedule.publishAt > new Date() ? 'scheduled' : 'pending',
      totalPlatforms: request.platforms.length,
      completedPlatforms: 0,
      failedPlatforms: 0,
      platformResults: request.platforms.map(platform => ({
        platform: platform.platform,
        status: 'pending',
        retryCount: 0,
        priority: platform.priority
      })),
      errors: [],
      retryCount: 0,
      lastUpdated: new Date()
    };

    // Store progress
    this.activeJobs.set(bulkId, progress);

    // Create queue items for each platform
    const queueItems = this.createQueueItems(request);
    
    // Add to queue (sorted by priority)
    queueItems.forEach(item => {
      this.insertQueueItem(item);
    });

    // Emit job created event
    this.emit('job.created', { bulkId, request });

    logger.info('Bulk publish job created', {
      bulkId,
      platforms: request.platforms.length,
      scheduled: !!request.schedule?.publishAt
    });

    return bulkId;
  }

  async getBulkProgress(bulkId: string): Promise<BulkPublishProgress | null> {
    return this.activeJobs.get(bulkId) || null;
  }

  async cancelBulkJob(bulkId: string, userId: string): Promise<boolean> {
    const progress = this.activeJobs.get(bulkId);
    if (!progress) {
      return false;
    }

    // Update status
    progress.status = 'cancelled';
    progress.lastUpdated = new Date();

    // Remove from queue
    this.publishQueue = this.publishQueue.filter(item => item.bulkId !== bulkId);

    // Emit cancellation event
    this.emit('job.cancelled', { bulkId, userId });

    logger.info('Bulk publish job cancelled', { bulkId, userId });
    return true;
  }

  async pauseBulkJob(bulkId: string): Promise<boolean> {
    const progress = this.activeJobs.get(bulkId);
    if (!progress || progress.status !== 'running') {
      return false;
    }

    progress.status = 'paused';
    progress.lastUpdated = new Date();

    logger.info('Bulk publish job paused', { bulkId });
    return true;
  }

  async resumeBulkJob(bulkId: string): Promise<boolean> {
    const progress = this.activeJobs.get(bulkId);
    if (!progress || progress.status !== 'paused') {
      return false;
    }

    progress.status = 'running';
    progress.lastUpdated = new Date();

    logger.info('Bulk publish job resumed', { bulkId });
    return true;
  }

  async listBulkJobs(filters: BulkPublishFilters): Promise<BulkPublishProgress[]> {
    let jobs = Array.from(this.activeJobs.values());

    // Apply filters
    if (filters.status?.length) {
      jobs = jobs.filter(job => filters.status!.includes(job.status));
    }

    if (filters.platforms?.length) {
      jobs = jobs.filter(job => 
        job.platformResults.some(result => 
          filters.platforms!.includes(result.platform)
        )
      );
    }

    // Sort
    const sortBy = filters.sortBy || 'lastUpdated';
    const sortOrder = filters.sortOrder || 'desc';
    
    jobs.sort((a, b) => {
      const aVal = this.getSortValue(a, sortBy);
      const bVal = this.getSortValue(b, sortBy);
      
      if (sortOrder === 'desc') {
        return bVal - aVal;
      }
      return aVal - bVal;
    });

    // Pagination
    const offset = filters.offset || 0;
    const limit = filters.limit || 50;
    
    return jobs.slice(offset, offset + limit);
  }

  async getBulkStats(userId?: string): Promise<BulkPublishStats> {
    let jobs = Array.from(this.activeJobs.values());
    
    // Filter by user if provided
    if (userId) {
      // Would need to store userId in progress for filtering
      // For now, return all stats
    }

    const stats: BulkPublishStats = {
      total: jobs.length,
      pending: jobs.filter(j => j.status === 'pending').length,
      scheduled: jobs.filter(j => j.status === 'scheduled').length,
      running: jobs.filter(j => j.status === 'running').length,
      completed: jobs.filter(j => j.status === 'completed').length,
      failed: jobs.filter(j => j.status === 'failed').length,
      partial: jobs.filter(j => j.status === 'partial').length,
      cancelled: jobs.filter(j => j.status === 'cancelled').length,
      platformBreakdown: this.calculatePlatformBreakdown(jobs),
      successRate: this.calculateSuccessRate(jobs),
      averageCompletionTime: this.calculateAverageCompletionTime(jobs)
    };

    return stats;
  }

  // Private methods

  private validateBulkRequest(request: BulkPublishRequest): void {
    if (!request.id || !request.content || !request.platforms?.length) {
      throw new Error('Invalid bulk publish request: missing required fields');
    }

    if (request.platforms.length > 10) {
      throw new Error('Maximum 10 platforms allowed per bulk job');
    }

    // Validate each platform
    request.platforms.forEach((platform, index) => {
      if (!platform.platform || !platform.credentials) {
        throw new Error(`Platform ${index}: missing platform or credentials`);
      }
      
      if (platform.priority < 1 || platform.priority > 10) {
        throw new Error(`Platform ${index}: priority must be between 1-10`);
      }
    });
  }

  private createQueueItems(request: BulkPublishRequest): BulkPublishQueueItem[] {
    return request.platforms.map(platform => ({
      id: `${request.id}-${platform.platform}-${Date.now()}`,
      bulkId: request.id,
      platform: platform.platform,
      content: {
        ...request.content,
        // Apply platform customizations
        ...platform.customizations
      },
      credentials: platform.credentials,
      options: { ...request.options, ...platform.options },
      priority: platform.priority,
      scheduledAt: request.schedule?.publishAt || new Date(),
      attempts: 0,
      maxRetries: request.options?.maxRetries || 3,
      status: 'queued',
      createdAt: new Date()
    }));
  }

  private insertQueueItem(item: BulkPublishQueueItem): void {
    // Insert in priority order (higher priority first)
    let insertIndex = this.publishQueue.length;
    
    for (let i = 0; i < this.publishQueue.length; i++) {
      if (this.publishQueue[i].priority < item.priority) {
        insertIndex = i;
        break;
      }
    }
    
    this.publishQueue.splice(insertIndex, 0, item);
  }

  private async startQueueProcessor(): Promise<void> {
    setInterval(async () => {
      if (!this.isProcessing && this.publishQueue.length > 0) {
        await this.processQueue();
      }
    }, 1000); // Check every second
  }

  private async processQueue(): Promise<void> {
    this.isProcessing = true;

    try {
      const now = new Date();
      const readyItems = this.publishQueue.filter(item => 
        item.scheduledAt <= now && 
        item.status === 'queued' &&
        this.isJobActive(item.bulkId)
      );

      // Process up to maxConcurrentJobs items
      const itemsToProcess = readyItems.slice(0, this.maxConcurrentJobs);
      
      const promises = itemsToProcess.map(item => this.processQueueItem(item));
      await Promise.allSettled(promises);

    } catch (error) {
      logger.error('Queue processing error:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async processQueueItem(item: BulkPublishQueueItem): Promise<void> {
    const progress = this.activeJobs.get(item.bulkId);
    if (!progress || progress.status === 'cancelled' || progress.status === 'paused') {
      return;
    }

    // Update item status
    item.status = 'processing';
    item.lastAttemptAt = new Date();
    item.attempts++;

    // Update progress
    progress.currentPlatform = item.platform;
    progress.status = 'running';
    if (!progress.startedAt) {
      progress.startedAt = new Date();
    }

    // Find platform result
    const platformResult = progress.platformResults.find(r => r.platform === item.platform);
    if (platformResult) {
      platformResult.status = 'publishing';
      platformResult.startedAt = new Date();
    }

    this.emit('platform.started', { bulkId: item.bulkId, platform: item.platform });

    try {
      // Get appropriate CMS service
      const cmsService = this.getCMSService(item.platform, item.credentials);
      
      // Publish content
      const result = await cmsService.publish(item.content, item.options);

      // Update results
      if (platformResult) {
        platformResult.status = result.success ? 'completed' : 'failed';
        platformResult.result = result;
        platformResult.completedAt = new Date();
        
        if (!result.success) {
          platformResult.error = result.error;
          progress.errors.push({
            platform: item.platform,
            error: result.error || 'Unknown error',
            timestamp: new Date(),
            retryable: this.isRetryableError(result.error),
            details: result.details
          });
        }
      }

      // Update counters
      if (result.success) {
        progress.completedPlatforms++;
        this.emit('platform.completed', { 
          bulkId: item.bulkId, 
          platform: item.platform, 
          result 
        });
      } else {
        progress.failedPlatforms++;
        this.emit('platform.failed', { 
          bulkId: item.bulkId, 
          platform: item.platform, 
          error: result.error 
        });
      }

      // Remove from queue
      item.status = result.success ? 'completed' : 'failed';
      this.removeFromQueue(item.id);

    } catch (error) {
      logger.error('Platform publish error:', {
        bulkId: item.bulkId,
        platform: item.platform,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Handle retry logic
      if (item.attempts < item.maxRetries && this.isRetryableError(error)) {
        // Schedule retry
        item.status = 'queued';
        item.scheduledAt = new Date(Date.now() + this.retryDelayMs * item.attempts);
        
        if (platformResult) {
          platformResult.retryCount++;
        }
      } else {
        // Max retries exceeded
        item.status = 'failed';
        progress.failedPlatforms++;
        
        if (platformResult) {
          platformResult.status = 'failed';
          platformResult.error = error instanceof Error ? error.message : 'Unknown error';
          platformResult.completedAt = new Date();
        }

        progress.errors.push({
          platform: item.platform,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date(),
          retryable: false,
          details: error
        });

        this.removeFromQueue(item.id);
        this.emit('platform.failed', { 
          bulkId: item.bulkId, 
          platform: item.platform, 
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Check if bulk job is complete
    this.checkBulkJobCompletion(item.bulkId);
  }

  private getCMSService(platform: CMSPlatform, credentials: any): BaseCMSService {
    switch (platform) {
      case 'wordpress':
        return new WordPressService(credentials);
      case 'shopify':
        return new ShopifyService(credentials);
      case 'hubspot':
        return new HubSpotService(credentials);
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  private isRetryableError(error: any): boolean {
    if (!error) return false;
    
    const retryableErrors = [
      'NETWORK_ERROR',
      'TIMEOUT',
      'RATE_LIMIT',
      'SERVER_ERROR',
      'CONNECTION_RESET'
    ];

    const errorMessage = typeof error === 'string' ? error : error.message || '';
    return retryableErrors.some(retryable => 
      errorMessage.toUpperCase().includes(retryable)
    );
  }

  private removeFromQueue(itemId: string): void {
    this.publishQueue = this.publishQueue.filter(item => item.id !== itemId);
  }

  private isJobActive(bulkId: string): boolean {
    const progress = this.activeJobs.get(bulkId);
    return progress ? !['cancelled', 'completed', 'failed'].includes(progress.status) : false;
  }

  private checkBulkJobCompletion(bulkId: string): void {
    const progress = this.activeJobs.get(bulkId);
    if (!progress) return;

    const totalProcessed = progress.completedPlatforms + progress.failedPlatforms;
    
    if (totalProcessed >= progress.totalPlatforms) {
      // Job is complete
      if (progress.failedPlatforms === 0) {
        progress.status = 'completed';
        this.emit('job.completed', { bulkId });
      } else if (progress.completedPlatforms === 0) {
        progress.status = 'failed';
        this.emit('job.failed', { bulkId });
      } else {
        progress.status = 'partial';
        this.emit('job.partial', { bulkId });
      }

      progress.estimatedCompletion = new Date();
      progress.lastUpdated = new Date();
    } else {
      // Update estimated completion
      if (progress.startedAt && progress.completedPlatforms > 0) {
        const elapsed = Date.now() - progress.startedAt.getTime();
        const avgTimePerPlatform = elapsed / progress.completedPlatforms;
        const remaining = progress.totalPlatforms - totalProcessed;
        progress.estimatedCompletion = new Date(Date.now() + (avgTimePerPlatform * remaining));
      }
      
      progress.lastUpdated = new Date();
    }
  }

  private getSortValue(job: BulkPublishProgress, sortBy: string): number {
    switch (sortBy) {
      case 'lastUpdated':
        return job.lastUpdated.getTime();
      case 'startedAt':
        return job.startedAt?.getTime() || 0;
      default:
        return 0;
    }
  }

  private calculatePlatformBreakdown(jobs: BulkPublishProgress[]): Record<CMSPlatform, number> {
    const breakdown: Record<string, number> = {};
    
    jobs.forEach(job => {
      job.platformResults.forEach(result => {
        breakdown[result.platform] = (breakdown[result.platform] || 0) + 1;
      });
    });

    return breakdown as Record<CMSPlatform, number>;
  }

  private calculateSuccessRate(jobs: BulkPublishProgress[]): number {
    const completed = jobs.filter(job => job.status === 'completed').length;
    const total = jobs.filter(job => ['completed', 'failed', 'partial'].includes(job.status)).length;
    
    return total > 0 ? (completed / total) * 100 : 0;
  }

  private calculateAverageCompletionTime(jobs: BulkPublishProgress[]): number {
    const completedJobs = jobs.filter(job => 
      job.status === 'completed' && job.startedAt && job.estimatedCompletion
    );

    if (completedJobs.length === 0) return 0;

    const totalTime = completedJobs.reduce((sum, job) => {
      const duration = job.estimatedCompletion!.getTime() - job.startedAt!.getTime();
      return sum + duration;
    }, 0);

    return totalTime / completedJobs.length / 60000; // Convert to minutes
  }
}