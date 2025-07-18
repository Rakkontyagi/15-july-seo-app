// Bulk Publishing Status API Endpoint

import { NextRequest, NextResponse } from 'next/server';
import { createServiceLogger } from '@/lib/logging/logger';
import { BulkPublisherService } from '@/lib/bulk-publishing/bulk-publisher.service';
import { authenticateRequest } from '@/lib/auth/middleware';

const logger = createServiceLogger('bulk-status-api');

// Global service instance (shared with publish endpoint)
const bulkPublisher = new BulkPublisherService();

// GET endpoint - retrieve bulk job status
export async function GET(
  request: NextRequest,
  { params }: { params: { bulkId: string } }
) {
  try {
    // Authenticate request
    const { user } = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bulkId = params.bulkId;

    // Get bulk progress
    const progress = await bulkPublisher.getBulkProgress(bulkId);

    if (!progress) {
      return NextResponse.json(
        { error: 'Bulk job not found' },
        { status: 404 }
      );
    }

    // Calculate additional metrics
    const totalPlatforms = progress.totalPlatforms;
    const completedPlatforms = progress.completedPlatforms;
    const failedPlatforms = progress.failedPlatforms;
    const pendingPlatforms = totalPlatforms - completedPlatforms - failedPlatforms;
    const completionPercentage = totalPlatforms > 0 
      ? Math.round((completedPlatforms / totalPlatforms) * 100) 
      : 0;

    // Group platform results by status
    const platformsByStatus = {
      pending: progress.platformResults.filter(p => p.status === 'pending'),
      publishing: progress.platformResults.filter(p => p.status === 'publishing'),
      completed: progress.platformResults.filter(p => p.status === 'completed'),
      failed: progress.platformResults.filter(p => p.status === 'failed'),
      skipped: progress.platformResults.filter(p => p.status === 'skipped'),
    };

    // Calculate time metrics
    let timeMetrics = {};
    if (progress.startedAt) {
      const now = new Date();
      const elapsed = now.getTime() - progress.startedAt.getTime();
      
      timeMetrics = {
        elapsedTime: Math.round(elapsed / 1000), // seconds
        elapsedTimeFormatted: this.formatDuration(elapsed),
        estimatedRemaining: progress.estimatedCompletion 
          ? Math.max(0, Math.round((progress.estimatedCompletion.getTime() - now.getTime()) / 1000))
          : null,
        estimatedCompletionFormatted: progress.estimatedCompletion?.toISOString(),
      };
    }

    logger.info('Bulk status retrieved', {
      userId: user.id,
      bulkId,
      status: progress.status,
      completionPercentage
    });

    return NextResponse.json({
      success: true,
      data: {
        bulkId,
        status: progress.status,
        progress: {
          total: totalPlatforms,
          completed: completedPlatforms,
          failed: failedPlatforms,
          pending: pendingPlatforms,
          percentage: completionPercentage,
        },
        platforms: {
          byStatus: platformsByStatus,
          results: progress.platformResults.map(result => ({
            platform: result.platform,
            status: result.status,
            priority: result.priority,
            startedAt: result.startedAt?.toISOString(),
            completedAt: result.completedAt?.toISOString(),
            url: result.result?.url,
            contentId: result.result?.contentId,
            error: result.error,
            retryCount: result.retryCount,
          })),
        },
        timing: timeMetrics,
        errors: progress.errors.map(error => ({
          platform: error.platform,
          message: error.error,
          timestamp: error.timestamp.toISOString(),
          retryable: error.retryable,
          code: error.code,
        })),
        retryCount: progress.retryCount,
        lastUpdated: progress.lastUpdated.toISOString(),
        currentPlatform: progress.currentPlatform,
      }
    });

  } catch (error) {
    logger.error('Bulk status error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      bulkId: params.bulkId
    });

    return NextResponse.json(
      { error: 'Failed to retrieve bulk status' },
      { status: 500 }
    );
  }

  // Helper method to format duration
  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}

// PATCH endpoint - update bulk job (pause/resume/cancel)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { bulkId: string } }
) {
  try {
    // Authenticate request
    const { user } = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bulkId = params.bulkId;
    const body = await request.json();
    const action = body.action;

    if (!['pause', 'resume', 'cancel'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be: pause, resume, or cancel' },
        { status: 400 }
      );
    }

    let result = false;

    switch (action) {
      case 'pause':
        result = await bulkPublisher.pauseBulkJob(bulkId);
        break;
      case 'resume':
        result = await bulkPublisher.resumeBulkJob(bulkId);
        break;
      case 'cancel':
        result = await bulkPublisher.cancelBulkJob(bulkId, user.id);
        break;
    }

    if (!result) {
      return NextResponse.json(
        { error: `Failed to ${action} bulk job. Job may not exist or be in wrong state.` },
        { status: 400 }
      );
    }

    logger.info(`Bulk job ${action}ed`, {
      userId: user.id,
      bulkId,
      action
    });

    return NextResponse.json({
      success: true,
      data: {
        bulkId,
        action,
        message: `Bulk job ${action}ed successfully`
      }
    });

  } catch (error) {
    logger.error('Bulk job action error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      bulkId: params.bulkId
    });

    return NextResponse.json(
      { error: 'Failed to perform action on bulk job' },
      { status: 500 }
    );
  }
}