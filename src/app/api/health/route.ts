/**
 * Health check API endpoints
 * Provides public health check endpoints for monitoring and alerting
 */

import { NextRequest, NextResponse } from 'next/server';
import { healthChecks, healthMonitor, queryTracker, maintenanceUtils } from '@/lib/monitoring/health-checks';
import { auditUtils, AuditEventType, AuditSeverity } from '@/lib/security/audit-logging';
import { rateLimiters } from '@/lib/security/rate-limiting';

/**
 * GET /api/health - Quick health check
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  
  try {
    // Rate limiting
    const rateLimitResult = rateLimiters.api.general(`health:${ip}`);
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
    
    // Perform quick health check
    const healthResult = await healthChecks.quick();
    const responseTime = Date.now() - startTime;
    
    // Log health check
    await auditUtils.logSystem(
      AuditEventType.SYSTEM_ERROR,
      'health_check',
      `Health check performed: ${healthResult.healthy ? 'healthy' : 'unhealthy'}`,
      healthResult.healthy,
      healthResult.healthy ? undefined : healthResult.details
    );
    
    return NextResponse.json({
      status: healthResult.healthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime,
      details: healthResult.details,
      version: '1.0.0',
    }, {
      status: healthResult.healthy ? 200 : 503,
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
      'health_check_error',
      'Health check failed',
      false,
      error instanceof Error ? error.message : 'Unknown error'
    );
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      responseTime,
      error: 'Health check failed',
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
 * POST /api/health - Full health check (requires authentication)
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  
  try {
    // Rate limiting - more restrictive for full health check
    const rateLimitResult = rateLimiters.database.read(`health-full:${ip}`);
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
    
    // Perform full health check
    const healthResult = await healthChecks.full();
    const responseTime = Date.now() - startTime;
    
    // Log full health check
    await auditUtils.logSystem(
      AuditEventType.SYSTEM_ERROR,
      'full_health_check',
      `Full health check performed: ${healthResult.overall.status}`,
      healthResult.overall.status === 'healthy',
      healthResult.overall.status !== 'healthy' ? healthResult.overall.details : undefined
    );
    
    return NextResponse.json({
      ...healthResult,
      timestamp: new Date().toISOString(),
      responseTime,
      version: '1.0.0',
    }, {
      status: healthResult.overall.status === 'healthy' ? 200 : 503,
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
      'full_health_check_error',
      'Full health check failed',
      false,
      error instanceof Error ? error.message : 'Unknown error'
    );
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      responseTime,
      error: 'Full health check failed',
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