import { z } from 'zod';

// CMS Platform Types
export const CMSPlatformEnum = z.enum(['wordpress', 'shopify', 'hubspot', 'custom']);
export type CMSPlatform = z.infer<typeof CMSPlatformEnum>;

// Content Status Types
export const ContentStatusEnum = z.enum(['draft', 'scheduled', 'published', 'failed', 'syncing']);
export type ContentStatus = z.infer<typeof ContentStatusEnum>;

// Publishing Priority Types
export const PublishingPriorityEnum = z.enum(['low', 'medium', 'high', 'urgent']);
export type PublishingPriority = z.infer<typeof PublishingPriorityEnum>;

// Base Content Schema
export const BaseContentSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  excerpt: z.string().optional(),
  author: z.string(),
  tags: z.array(z.string()).default([]),
  categories: z.array(z.string()).default([]),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  featuredImage: z.string().optional(),
  status: ContentStatusEnum.default('draft'),
  scheduledDate: z.date().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type BaseContent = z.infer<typeof BaseContentSchema>;

// CMS Configuration Schema
export const CMSConfigSchema = z.object({
  platform: CMSPlatformEnum,
  apiUrl: z.string().url(),
  apiKey: z.string(),
  username: z.string().optional(),
  password: z.string().optional(),
  additionalSettings: z.record(z.any()).optional(),
});

export type CMSConfig = z.infer<typeof CMSConfigSchema>;

// Bulk Publishing Schema
export const BulkPublishingJobSchema = z.object({
  id: z.string(),
  name: z.string(),
  contentIds: z.array(z.string()),
  platforms: z.array(CMSPlatformEnum),
  scheduledDate: z.date().optional(),
  priority: PublishingPriorityEnum.default('medium'),
  status: z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']).default('pending'),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  completedAt: z.date().optional(),
  progress: z.object({
    total: z.number(),
    completed: z.number(),
    failed: z.number(),
    percentage: z.number(),
  }).default({ total: 0, completed: 0, failed: 0, percentage: 0 }),
});

export type BulkPublishingJob = z.infer<typeof BulkPublishingJobSchema>;

// Publishing Status Schema
export const PublishingStatusSchema = z.object({
  id: z.string(),
  contentId: z.string(),
  jobId: z.string().optional(),
  platform: CMSPlatformEnum,
  status: ContentStatusEnum,
  externalId: z.string().optional(),
  externalUrl: z.string().optional(),
  error: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  attempts: z.number().default(0),
  maxAttempts: z.number().default(3),
  lastAttemptAt: z.date().optional(),
  scheduledAt: z.date().optional(),
  publishedAt: z.date().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type PublishingStatus = z.infer<typeof PublishingStatusSchema>;

// Content Synchronization Schema
export const ContentSyncSchema = z.object({
  id: z.string(),
  contentId: z.string(),
  platform: CMSPlatformEnum,
  externalId: z.string(),
  lastSyncAt: z.date(),
  syncStatus: z.enum(['synced', 'out_of_sync', 'conflict', 'error']),
  localHash: z.string(),
  remoteHash: z.string(),
  conflictData: z.object({
    localVersion: z.any().optional(),
    remoteVersion: z.any().optional(),
    conflictFields: z.array(z.string()).optional(),
  }).optional(),
  syncDirection: z.enum(['bidirectional', 'local_to_remote', 'remote_to_local']).default('bidirectional'),
  autoResolve: z.boolean().default(false),
  metadata: z.record(z.any()).optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type ContentSync = z.infer<typeof ContentSyncSchema>;

// API Response Schemas
export const PublishResponseSchema = z.object({
  success: z.boolean(),
  externalId: z.string().optional(),
  externalUrl: z.string().optional(),
  message: z.string().optional(),
  error: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export type PublishResponse = z.infer<typeof PublishResponseSchema>;

export const BulkPublishResponseSchema = z.object({
  jobId: z.string(),
  status: z.string(),
  message: z.string(),
  progress: z.object({
    total: z.number(),
    queued: z.number(),
    completed: z.number(),
    failed: z.number(),
  }),
});

export type BulkPublishResponse = z.infer<typeof BulkPublishResponseSchema>;

// CMS Service Interface
export interface ICMSService {
  publish(content: BaseContent, config: CMSConfig): Promise<PublishResponse>;
  update(contentId: string, content: Partial<BaseContent>, config: CMSConfig): Promise<PublishResponse>;
  delete(contentId: string, config: CMSConfig): Promise<PublishResponse>;
  getStatus(contentId: string, config: CMSConfig): Promise<PublishingStatus>;
  sync(contentId: string, config: CMSConfig): Promise<ContentSync>;
}

// Bulk Publishing Service Interface
export interface IBulkPublishingService {
  createJob(
    contentIds: string[],
    platforms: CMSPlatform[],
    scheduledDate?: Date,
    priority?: PublishingPriority
  ): Promise<BulkPublishingJob>;
  
  executeJob(jobId: string): Promise<void>;
  getJobStatus(jobId: string): Promise<BulkPublishingJob>;
  cancelJob(jobId: string): Promise<void>;
  listJobs(filters?: Partial<BulkPublishingJob>): Promise<BulkPublishingJob[]>;
}

// Publishing Status Service Interface
export interface IPublishingStatusService {
  trackPublication(
    contentId: string,
    platform: CMSPlatform,
    jobId?: string
  ): Promise<PublishingStatus>;
  
  updateStatus(
    statusId: string,
    updates: Partial<PublishingStatus>
  ): Promise<PublishingStatus>;
  
  getContentStatus(contentId: string): Promise<PublishingStatus[]>;
  getJobStatuses(jobId: string): Promise<PublishingStatus[]>;
  retryFailedPublication(statusId: string): Promise<void>;
  getStatusSummary(filters?: any): Promise<{
    total: number;
    published: number;
    failed: number;
    pending: number;
    scheduled: number;
  }>;
}

// Content Sync Service Interface
export interface IContentSyncService {
  syncContent(
    contentId: string,
    platform: CMSPlatform,
    direction?: 'bidirectional' | 'local_to_remote' | 'remote_to_local'
  ): Promise<ContentSync>;
  
  detectConflicts(contentId: string, platform: CMSPlatform): Promise<ContentSync>;
  resolveConflict(syncId: string, resolution: 'local' | 'remote' | 'merge'): Promise<ContentSync>;
  getSyncStatus(contentId: string): Promise<ContentSync[]>;
  enableAutoSync(contentId: string, platform: CMSPlatform): Promise<void>;
  disableAutoSync(syncId: string): Promise<void>;
}

// Validation Helpers
export const validateCMSConfig = (config: any): CMSConfig => {
  return CMSConfigSchema.parse(config);
};

export const validateBaseContent = (content: any): BaseContent => {
  return BaseContentSchema.parse(content);
};

export const validateBulkPublishingJob = (job: any): BulkPublishingJob => {
  return BulkPublishingJobSchema.parse(job);
};

export const validatePublishingStatus = (status: any): PublishingStatus => {
  return PublishingStatusSchema.parse(status);
};

export const validateContentSync = (sync: any): ContentSync => {
  return ContentSyncSchema.parse(sync);
};