import { NextRequest, NextResponse } from 'next/server';
import { getUnifiedSERPService } from '@/lib/serp/unified-serp.service';
import { getSERPCacheService } from '@/lib/cache/serp-cache';
import { authenticateRequest } from '@/lib/auth/middleware';
import { logger } from '@/lib/logging/logger';

// GET endpoint to check SERP service health
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serpService = getUnifiedSERPService();
    const cacheService = getSERPCacheService();

    // Check provider health
    const providerHealth = await serpService.checkProviderHealth();
    const availableProviders = serpService.getAvailableProviders();

    // Get cache statistics
    const cacheStats = cacheService.getStats();

    // Compile health report
    const healthReport = {
      status: availableProviders.length > 0 ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      providers: {
        available: availableProviders,
        health: providerHealth,
        primary: 'serper',
        backup: ['serpapi']
      },
      cache: {
        enabled: true,
        stats: cacheStats
      },
      features: {
        regionalTargeting: true,
        batchProcessing: true,
        competitorAnalysis: true,
        caching: true
      }
    };

    logger.info('SERP health check completed', {
      userId: user.id,
      status: healthReport.status
    });

    return NextResponse.json({
      success: true,
      data: healthReport
    });

  } catch (error) {
    logger.error('SERP health check failed:', error);
    
    return NextResponse.json({
      success: false,
      data: {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}