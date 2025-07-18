// Bulk Publishing Types

import { CMSCredentials, CMSContent, CMSPublishOptions, CMSPublishResult, CMSPlatform } from './cms';

export interface BulkPublishRequest {
  id: string;
  userId: string;
  title: string;
  content: CMSContent;
  platforms: BulkPublishPlatform[];
  schedule?: BulkScheduleOptions;
  options?: BulkPublishGlobalOptions;
  createdAt: Date;
  status: BulkPublishStatus;
}

export interface BulkPublishPlatform {
  platform: CMSPlatform;
  credentials: CMSCredentials;
  options?: CMSPublishOptions;
  customizations?: PlatformCustomizations;
  priority: number; // 1-10, higher = published first
}

export interface PlatformCustomizations {
  title?: string;
  content?: string;
  excerpt?: string;
  tags?: string[];
  categories?: string[];
  metaTitle?: string;
  metaDescription?: string;
  featuredImage?: string;
}

export interface BulkScheduleOptions {
  publishAt: Date;
  staggered?: boolean;
  staggerInterval?: number; // minutes between publications
  timezone?: string;
  recurringSchedule?: RecurringSchedule;
}

export interface RecurringSchedule {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number; // every N days/weeks/months
  daysOfWeek?: number[]; // 0-6, Sunday=0
  endDate?: Date;
  maxOccurrences?: number;
}

export interface BulkPublishGlobalOptions {
  skipDuplicateCheck?: boolean;
  updateIfExists?: boolean;
  continueOnError?: boolean;
  maxRetries?: number;
  retryDelay?: number; // seconds
  notifyOnCompletion?: boolean;
  notifyOnError?: boolean;
}

export type BulkPublishStatus = 
  | 'pending'     // Waiting to start
  | 'scheduled'   // Scheduled for future
  | 'running'     // Currently publishing
  | 'paused'      // Temporarily paused
  | 'completed'   // All platforms completed
  | 'failed'      // Critical failure
  | 'partial'     // Some platforms succeeded, some failed
  | 'cancelled';  // User cancelled

export interface BulkPublishProgress {
  bulkId: string;
  status: BulkPublishStatus;
  totalPlatforms: number;
  completedPlatforms: number;
  failedPlatforms: number;
  currentPlatform?: CMSPlatform;
  startedAt?: Date;
  estimatedCompletion?: Date;
  platformResults: PlatformPublishResult[];
  errors: BulkPublishError[];
  retryCount: number;
  lastUpdated: Date;
}

export interface PlatformPublishResult {
  platform: CMSPlatform;
  status: 'pending' | 'publishing' | 'completed' | 'failed' | 'skipped';
  result?: CMSPublishResult;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  retryCount: number;
  priority: number;
}

export interface BulkPublishError {
  platform: CMSPlatform;
  error: string;
  timestamp: Date;
  retryable: boolean;
  code?: string;
  details?: any;
}

export interface BulkPublishFilters {
  userId?: string;
  status?: BulkPublishStatus[];
  platforms?: CMSPlatform[];
  dateFrom?: Date;
  dateTo?: Date;
  title?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'scheduledAt' | 'updatedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface BulkPublishStats {
  total: number;
  pending: number;
  scheduled: number;
  running: number;
  completed: number;
  failed: number;
  partial: number;
  cancelled: number;
  platformBreakdown: Record<CMSPlatform, number>;
  successRate: number; // percentage
  averageCompletionTime: number; // minutes
}

export interface BulkPublishTemplate {
  id: string;
  name: string;
  description?: string;
  platforms: BulkPublishPlatform[];
  defaultOptions?: BulkPublishGlobalOptions;
  defaultSchedule?: Partial<BulkScheduleOptions>;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
}

export interface BulkPublishQueueItem {
  id: string;
  bulkId: string;
  platform: CMSPlatform;
  content: CMSContent;
  credentials: CMSCredentials;
  options?: CMSPublishOptions;
  priority: number;
  scheduledAt: Date;
  attempts: number;
  maxRetries: number;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  createdAt: Date;
  lastAttemptAt?: Date;
}

export interface BulkPublishWebhook {
  id: string;
  bulkId: string;
  event: BulkPublishWebhookEvent;
  url: string;
  headers?: Record<string, string>;
  payload: any;
  status: 'pending' | 'sent' | 'failed';
  attempts: number;
  createdAt: Date;
  sentAt?: Date;
}

export type BulkPublishWebhookEvent = 
  | 'bulk.started'
  | 'bulk.completed'
  | 'bulk.failed'
  | 'bulk.partial'
  | 'platform.started'
  | 'platform.completed'
  | 'platform.failed'
  | 'bulk.cancelled';

export interface BulkPublishNotification {
  id: string;
  bulkId: string;
  userId: string;
  type: 'email' | 'webhook' | 'in_app';
  event: BulkPublishWebhookEvent;
  recipient: string;
  subject?: string;
  message: string;
  status: 'pending' | 'sent' | 'failed';
  createdAt: Date;
  sentAt?: Date;
}

export interface BulkPublishAnalytics {
  bulkId: string;
  totalPublishTime: number; // minutes
  platformTimings: Record<CMSPlatform, number>; // minutes per platform
  retryBreakdown: Record<CMSPlatform, number>;
  errorBreakdown: Record<string, number>; // error type -> count
  successRate: number;
  averageProcessingTime: number; // minutes per platform
  peakMemoryUsage?: number; // MB
  networkUsage?: number; // MB
}

export interface BulkPublishAPIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: string[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  meta?: {
    requestId: string;
    timestamp: Date;
    version: string;
  };
}