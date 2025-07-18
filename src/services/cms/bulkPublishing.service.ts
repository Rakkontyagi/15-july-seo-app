import { z } from 'zod';
import {
  BulkPublishingJob,
  BulkPublishingJobSchema,
  CMSPlatform,
  PublishingPriority,
  IBulkPublishingService,
  BaseContent,
  CMSConfig,
  PublishingStatus,
} from '../../types/cms';

// Input schemas for bulk publishing operations
const CreateBulkJobInputSchema = z.object({
  name: z.string().min(1, 'Job name is required'),
  contentIds: z.array(z.string()).min(1, 'At least one content ID is required'),
  platforms: z.array(z.enum(['wordpress', 'shopify', 'hubspot', 'custom'])).min(1, 'At least one platform is required'),
  scheduledDate: z.date().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
});

const JobFiltersSchema = z.object({
  status: z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']).optional(),
  platform: z.enum(['wordpress', 'shopify', 'hubspot', 'custom']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
}).optional();

export type CreateBulkJobInput = z.infer<typeof CreateBulkJobInputSchema>;
export type JobFilters = z.infer<typeof JobFiltersSchema>;

export class BulkPublishingService implements IBulkPublishingService {
  private jobs: Map<string, BulkPublishingJob> = new Map();
  private jobQueue: string[] = [];
  private isProcessing = false;

  /**
   * Creates a new bulk publishing job for multiple content pieces across platforms.
   */
  async createJob(
    contentIds: string[],
    platforms: CMSPlatform[],
    scheduledDate?: Date,
    priority: PublishingPriority = 'medium',
    name?: string
  ): Promise<BulkPublishingJob> {
    const input = {
      name: name || `Bulk Publish ${new Date().toISOString()}`,
      contentIds,
      platforms,
      scheduledDate,
      priority,
    };

    CreateBulkJobInputSchema.parse(input);

    const jobId = this.generateJobId();
    const job: BulkPublishingJob = {
      id: jobId,
      name: input.name,
      contentIds: input.contentIds,
      platforms: input.platforms,
      scheduledDate: input.scheduledDate,
      priority: input.priority,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      progress: {
        total: input.contentIds.length * input.platforms.length,
        completed: 0,
        failed: 0,
        percentage: 0,
      },
    };

    this.jobs.set(jobId, job);
    
    // Add to queue based on priority
    this.addToQueue(jobId, input.priority);
    
    // Start processing if not already running
    if (!this.isProcessing) {
      this.processQueue();
    }

    return job;
  }

  /**
   * Executes a bulk publishing job by processing all content items across all platforms.
   */
  async executeJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    if (job.status !== 'pending') {
      throw new Error(`Job ${jobId} is not in pending status`);
    }

    // Check if job is scheduled for the future
    if (job.scheduledDate && job.scheduledDate > new Date()) {
      throw new Error(`Job ${jobId} is scheduled for ${job.scheduledDate.toISOString()}`);
    }

    try {
      job.status = 'running';
      job.updatedAt = new Date();
      this.jobs.set(jobId, job);

      await this.processJobContent(job);

      job.status = 'completed';
      job.completedAt = new Date();
      job.updatedAt = new Date();
      job.progress.percentage = 100;

    } catch (error) {
      job.status = 'failed';
      job.updatedAt = new Date();
      throw error;
    } finally {
      this.jobs.set(jobId, job);
    }
  }

  /**
   * Gets the current status of a bulk publishing job.
   */
  async getJobStatus(jobId: string): Promise<BulkPublishingJob> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }
    return { ...job };
  }

  /**
   * Cancels a bulk publishing job if it's still pending or running.
   */
  async cancelJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    if (job.status === 'completed') {
      throw new Error(`Job ${jobId} is already completed and cannot be cancelled`);
    }

    job.status = 'cancelled';
    job.updatedAt = new Date();
    this.jobs.set(jobId, job);

    // Remove from queue if pending
    const queueIndex = this.jobQueue.indexOf(jobId);
    if (queueIndex > -1) {
      this.jobQueue.splice(queueIndex, 1);
    }
  }

  /**
   * Lists bulk publishing jobs with optional filtering.
   */
  async listJobs(filters?: JobFilters): Promise<BulkPublishingJob[]> {
    JobFiltersSchema.parse(filters);

    let jobs = Array.from(this.jobs.values());

    if (filters) {
      if (filters.status) {
        jobs = jobs.filter(job => job.status === filters.status);
      }
      if (filters.priority) {
        jobs = jobs.filter(job => job.priority === filters.priority);
      }
      if (filters.dateFrom) {
        jobs = jobs.filter(job => job.createdAt >= filters.dateFrom!);
      }
      if (filters.dateTo) {
        jobs = jobs.filter(job => job.createdAt <= filters.dateTo!);
      }
    }

    // Sort by priority and creation date
    return jobs.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];

      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }

  /**
   * Gets bulk publishing statistics and metrics.
   */
  async getJobMetrics(): Promise<{
    total: number;
    pending: number;
    running: number;
    completed: number;
    failed: number;
    cancelled: number;
    avgCompletionTime: number;
  }> {
    const jobs = Array.from(this.jobs.values());
    const completedJobs = jobs.filter(job => job.status === 'completed' && job.completedAt);
    
    const avgCompletionTime = completedJobs.length > 0
      ? completedJobs.reduce((sum, job) => {
          const duration = job.completedAt!.getTime() - job.createdAt.getTime();
          return sum + duration;
        }, 0) / completedJobs.length
      : 0;

    return {
      total: jobs.length,
      pending: jobs.filter(job => job.status === 'pending').length,
      running: jobs.filter(job => job.status === 'running').length,
      completed: jobs.filter(job => job.status === 'completed').length,
      failed: jobs.filter(job => job.status === 'failed').length,
      cancelled: jobs.filter(job => job.status === 'cancelled').length,
      avgCompletionTime: Math.round(avgCompletionTime),
    };
  }

  /**
   * Processes the job queue in priority order.
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.jobQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.jobQueue.length > 0) {
        const jobId = this.jobQueue.shift()!;
        const job = this.jobs.get(jobId);

        if (!job || job.status !== 'pending') {
          continue;
        }

        // Check if job is scheduled for the future
        if (job.scheduledDate && job.scheduledDate > new Date()) {
          // Re-queue for later
          this.jobQueue.push(jobId);
          break;
        }

        try {
          await this.executeJob(jobId);
        } catch (error) {
          console.error(`Failed to execute job ${jobId}:`, error);
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Adds a job to the queue based on priority.
   */
  private addToQueue(jobId: string, priority: PublishingPriority): void {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    const jobPriority = priorityOrder[priority];

    // Find the correct position to insert based on priority
    let insertIndex = this.jobQueue.length;
    for (let i = 0; i < this.jobQueue.length; i++) {
      const existingJob = this.jobs.get(this.jobQueue[i]);
      if (existingJob) {
        const existingPriority = priorityOrder[existingJob.priority];
        if (jobPriority < existingPriority) {
          insertIndex = i;
          break;
        }
      }
    }

    this.jobQueue.splice(insertIndex, 0, jobId);
  }

  /**
   * Processes all content items in a job across all platforms.
   */
  private async processJobContent(job: BulkPublishingJob): Promise<void> {
    const totalItems = job.contentIds.length * job.platforms.length;
    let completed = 0;
    let failed = 0;

    for (const contentId of job.contentIds) {
      for (const platform of job.platforms) {
        try {
          // Simulate content publishing (in real implementation, this would call actual CMS services)
          await this.publishToplatform(contentId, platform);
          completed++;
        } catch (error) {
          failed++;
          console.error(`Failed to publish content ${contentId} to ${platform}:`, error);
        }

        // Update progress
        job.progress = {
          total: totalItems,
          completed,
          failed,
          percentage: Math.round(((completed + failed) / totalItems) * 100),
        };
        job.updatedAt = new Date();
        this.jobs.set(job.id, job);
      }
    }
  }

  /**
   * Simulates publishing content to a specific platform.
   * In real implementation, this would integrate with actual CMS services.
   */
  private async publishToplatform(contentId: string, platform: CMSPlatform): Promise<void> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

    // Simulate occasional failures for testing
    if (Math.random() < 0.05) { // 5% failure rate
      throw new Error(`Simulated failure publishing to ${platform}`);
    }

    console.log(`Successfully published content ${contentId} to ${platform}`);
  }

  /**
   * Generates a unique job ID.
   */
  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Schedules jobs to run at their scheduled times.
   */
  async scheduleJobs(): Promise<void> {
    const now = new Date();
    const jobs = Array.from(this.jobs.values());
    
    const scheduledJobs = jobs.filter(job => 
      job.status === 'pending' && 
      job.scheduledDate && 
      job.scheduledDate <= now &&
      !this.jobQueue.includes(job.id)
    );

    for (const job of scheduledJobs) {
      this.addToQueue(job.id, job.priority);
    }

    if (scheduledJobs.length > 0 && !this.isProcessing) {
      this.processQueue();
    }
  }
}