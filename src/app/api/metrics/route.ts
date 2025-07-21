/**
 * Metrics API endpoints
 * Provides performance metrics and monitoring data
 */

import { NextRequest, NextResponse } from 'next/server';
import { queryTracker, healthMonitor, maintenanceUtils } from '@/lib/monitoring/health-checks';
import { auditUtils, AuditEventType } from '@/lib/security/audit-logging';
import { rateLimiters } from '@/lib/security/rate-limiting';

/**
 * GET /api/metrics - Get performance metrics
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  
  try {
    // Rate limiting
    const rateLimitResult = rateLimiters.database.read(`metrics:${ip}`);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimitResult.retryAfter || 0) / 1000).toString(),
          }
        }
      );
    }
    
    // TODO: Add authentication check here
    // For now, allow all requests
    
    // Get metrics
    const queryMetrics = queryTracker.getMetrics();
    const slowQueries = queryTracker.getSlowQueries();
    const healthHistory = healthMonitor.getHealthHistory();
    const performanceHistory = healthMonitor.getPerformanceHistory();
    
    const responseTime = Date.now() - startTime;
    
    // Log metrics access
    await auditUtils.logSystem(
      AuditEventType.DATA_ACCESSED,
      'metrics_access',
      'Performance metrics accessed',
      true
    );
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      responseTime,
      metrics: {
        queries: queryMetrics,
        slowQueries,
        health: {
          history: healthHistory.slice(-10), // Last 10 health checks
          current: healthHistory[healthHistory.length - 1],
        },
        performance: {
          history: performanceHistory.slice(-10), // Last 10 performance checks
          current: performanceHistory[performanceHistory.length - 1],
        },
      },
      version: '1.0.0',
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      },
    });
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    // Log error
    await auditUtils.logSystem(
      AuditEventType.SYSTEM_ERROR,
      'metrics_error',
      'Metrics access failed',
      false,
      error instanceof Error ? error.message : 'Unknown error'
    );
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      responseTime,
      error: 'Metrics access failed',
      version: '1.0.0',
    }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      },
    });
  }
}

/**
 * POST /api/metrics/reset - Reset metrics (admin only)
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  
  try {
    // Rate limiting
    const rateLimitResult = rateLimiters.database.write(`metrics-reset:${ip}`);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimitResult.retryAfter || 0) / 1000).toString(),
          }
        }
      );
    }
    
    // TODO: Add admin authentication check here
    // For now, allow all requests
    
    // Reset metrics
    queryTracker.reset();
    healthMonitor.clearHistory();
    
    const responseTime = Date.now() - startTime;
    
    // Log metrics reset
    await auditUtils.logSystem(
      AuditEventType.CONFIGURATION_CHANGED,
      'metrics_reset',
      'Performance metrics reset',
      true
    );
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      responseTime,
      message: 'Metrics reset successfully',
      version: '1.0.0',
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      },
    });
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    // Log error
    await auditUtils.logSystem(
      AuditEventType.SYSTEM_ERROR,
      'metrics_reset_error',
      'Metrics reset failed',
      false,
      error instanceof Error ? error.message : 'Unknown error'
    );
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      responseTime,
      error: 'Metrics reset failed',
      version: '1.0.0',
    }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      },
    });
  }
}

/**
 * PUT /api/metrics/maintenance - Run maintenance tasks
 */
export async function PUT(request: NextRequest) {
  const startTime = Date.now();
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  
  try {
    // Rate limiting - very restrictive for maintenance
    const rateLimitResult = rateLimiters.database.bulk(`maintenance:${ip}`);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimitResult.retryAfter || 0) / 1000).toString(),
          }
        }
      );
    }
    
    // TODO: Add admin authentication check here
    // For now, allow all requests
    
    // Run maintenance tasks
    const cleanupResult = await maintenanceUtils.cleanupExpiredData();
    const optimizeResult = await maintenanceUtils.optimizePerformance();
    
    const responseTime = Date.now() - startTime;
    
    // Log maintenance
    await auditUtils.logSystem(
      AuditEventType.SYSTEM_ERROR,
      'maintenance_run',
      'Database maintenance performed',
      cleanupResult.success && optimizeResult.success
    );
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      responseTime,
      results: {
        cleanup: cleanupResult,
        optimization: optimizeResult,
      },
      version: '1.0.0',
    }, {
      status: cleanupResult.success && optimizeResult.success ? 200 : 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      },
    });
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    // Log error
    await auditUtils.logSystem(
      AuditEventType.SYSTEM_ERROR,
      'maintenance_error',
      'Database maintenance failed',
      false,
      error instanceof Error ? error.message : 'Unknown error'
    );
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      responseTime,
      error: 'Maintenance failed',
      version: '1.0.0',
    }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      },
    });
  }
}