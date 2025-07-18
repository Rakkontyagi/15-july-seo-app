// Bulk Publishing API Endpoint

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceLogger } from '@/lib/logging/logger';
import { BulkPublisherService } from '@/lib/bulk-publishing/bulk-publisher.service';
import { BulkSchedulerService } from '@/lib/bulk-publishing/scheduler.service';
import { authenticateRequest } from '@/lib/auth/middleware';
import { BulkPublishRequest, CMSPlatform } from '@/types/bulk-publishing';
import { v4 as uuidv4 } from 'uuid';

const logger = createServiceLogger('bulk-publish-api');

// Global service instances
const bulkPublisher = new BulkPublisherService();
const bulkScheduler = new BulkSchedulerService(bulkPublisher);

// Request validation schema
const bulkPublishRequestSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  content: z.object({
    title: z.string().min(1, 'Content title is required').max(200),
    content: z.string().min(1, 'Content body is required'),
    excerpt: z.string().optional(),
    slug: z.string().optional(),
    status: z.enum(['draft', 'published', 'scheduled', 'private']).default('published'),
    categories: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    author: z.string().optional(),
    metaTitle: z.string().max(60).optional(),
    metaDescription: z.string().max(160).optional(),
    focusKeyword: z.string().optional(),
    canonicalUrl: z.string().url().optional(),
    featuredImage: z.string().url().optional(),
    schemaMarkup: z.string().optional(),
  }),
  platforms: z.array(z.object({
    platform: z.enum(['wordpress', 'shopify', 'hubspot']),
    credentials: z.object({
      endpoint: z.string().url(),
      apiKey: z.string().min(1),
      username: z.string().optional(),
      password: z.string().optional(),
      storeId: z.string().optional(),
      hubId: z.string().optional(),
    }),
    options: z.object({
      updateIfExists: z.boolean().optional(),
      skipDuplicateCheck: z.boolean().optional(),
      autoGenerateSlug: z.boolean().optional(),
      preserveFormatting: z.boolean().optional(),
      injectSchema: z.boolean().optional(),
    }).optional(),
    customizations: z.object({
      title: z.string().optional(),
      content: z.string().optional(),
      excerpt: z.string().optional(),
      tags: z.array(z.string()).optional(),
      categories: z.array(z.string()).optional(),
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
      featuredImage: z.string().url().optional(),
    }).optional(),
    priority: z.number().min(1).max(10).default(5),
  })).min(1, 'At least one platform is required').max(10, 'Maximum 10 platforms allowed'),
  schedule: z.object({
    publishAt: z.string().datetime().optional(),
    staggered: z.boolean().optional(),
    staggerInterval: z.number().min(1).max(60).optional(), // minutes
    timezone: z.string().optional().default('UTC'),
    recurringSchedule: z.object({
      frequency: z.enum(['daily', 'weekly', 'monthly']),
      interval: z.number().min(1).max(365),
      daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
      endDate: z.string().datetime().optional(),
      maxOccurrences: z.number().min(1).max(1000).optional(),
    }).optional(),
  }).optional(),
  options: z.object({
    skipDuplicateCheck: z.boolean().optional(),
    updateIfExists: z.boolean().optional(),
    continueOnError: z.boolean().optional().default(true),
    maxRetries: z.number().min(0).max(10).optional().default(3),
    retryDelay: z.number().min(1).max(3600).optional().default(30), // seconds
    notifyOnCompletion: z.boolean().optional().default(false),
    notifyOnError: z.boolean().optional().default(true),
  }).optional(),
});

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Authenticate request
    const { user } = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = bulkPublishRequestSchema.parse(body);

    // Generate unique bulk ID
    const bulkId = uuidv4();

    logger.info('Bulk publish request initiated', {
      userId: user.id,
      bulkId,
      title: validatedData.title,
      platforms: validatedData.platforms.length,
      scheduled: !!validatedData.schedule?.publishAt
    });

    // Create bulk publish request object
    const bulkRequest: BulkPublishRequest = {
      id: bulkId,
      userId: user.id,
      title: validatedData.title,
      content: {
        ...validatedData.content,
        author: validatedData.content.author || user.email || user.id,
        publishDate: validatedData.schedule?.publishAt 
          ? new Date(validatedData.schedule.publishAt) 
          : undefined,
      },
      platforms: validatedData.platforms.map(platform => ({
        platform: platform.platform as CMSPlatform,
        credentials: {
          platform: platform.platform as CMSPlatform,
          endpoint: platform.credentials.endpoint,
          apiKey: platform.credentials.apiKey,
          username: platform.credentials.username,
          password: platform.credentials.password,
          storeId: platform.credentials.storeId,
          hubId: platform.credentials.hubId,
        },
        options: platform.options,
        customizations: platform.customizations,
        priority: platform.priority,
      })),
      schedule: validatedData.schedule ? {
        publishAt: validatedData.schedule.publishAt ? new Date(validatedData.schedule.publishAt) : undefined,
        staggered: validatedData.schedule.staggered,
        staggerInterval: validatedData.schedule.staggerInterval,
        timezone: validatedData.schedule.timezone,
        recurringSchedule: validatedData.schedule.recurringSchedule ? {
          frequency: validatedData.schedule.recurringSchedule.frequency,
          interval: validatedData.schedule.recurringSchedule.interval,
          daysOfWeek: validatedData.schedule.recurringSchedule.daysOfWeek,
          endDate: validatedData.schedule.recurringSchedule.endDate 
            ? new Date(validatedData.schedule.recurringSchedule.endDate) 
            : undefined,
          maxOccurrences: validatedData.schedule.recurringSchedule.maxOccurrences,
        } : undefined,
      } : undefined,
      options: validatedData.options,
      createdAt: new Date(),
      status: 'pending'
    };

    // Validate platform credentials
    for (const platform of bulkRequest.platforms) {
      try {
        // This would validate credentials in a real implementation
        // For now, just check required fields
        if (!platform.credentials.apiKey) {
          throw new Error(`Missing API key for ${platform.platform}`);
        }
      } catch (error) {
        return NextResponse.json(
          { 
            error: `Invalid credentials for ${platform.platform}`,
            details: error instanceof Error ? error.message : 'Unknown error'
          },
          { status: 400 }
        );
      }
    }

    // Submit to scheduler or direct publisher
    let resultBulkId: string;
    
    if (validatedData.schedule?.publishAt || validatedData.schedule?.recurringSchedule) {
      // Use scheduler for scheduled/recurring jobs
      resultBulkId = await bulkScheduler.schedulePublish(bulkRequest);
    } else {
      // Use direct publisher for immediate jobs
      resultBulkId = await bulkPublisher.createBulkPublishJob(bulkRequest);
    }

    // Log the result
    const duration = Date.now() - startTime;
    logger.logApiCall({
      method: 'POST',
      path: '/api/cms/bulk/publish',
      statusCode: 200,
      duration,
      userId: user.id,
      metadata: {
        bulkId: resultBulkId,
        platforms: validatedData.platforms.length,
        scheduled: !!validatedData.schedule?.publishAt,
        recurring: !!validatedData.schedule?.recurringSchedule
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        bulkId: resultBulkId,
        status: bulkRequest.status,
        platforms: bulkRequest.platforms.length,
        scheduled: !!bulkRequest.schedule?.publishAt,
        estimatedCompletionTime: bulkRequest.schedule?.publishAt || new Date(),
        trackingUrl: `/api/cms/bulk/${resultBulkId}/status`
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    
    if (error instanceof z.ZodError) {
      logger.warn('Bulk publish validation error', {
        errors: error.errors,
        duration
      });
      
      return NextResponse.json(
        { 
          error: 'Validation error',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    logger.error('Bulk publish error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      duration
    });

    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}