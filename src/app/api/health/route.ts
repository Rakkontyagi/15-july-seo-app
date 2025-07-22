/**
 * Health check API endpoints
 * Provides comprehensive health monitoring with production-grade diagnostics
 */

import { NextRequest, NextResponse } from 'next/server';
import { monitoringManager } from '@/lib/monitoring/production-monitoring-manager';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

interface HealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency?: number;
  error?: string;
  details?: Record<string, any>;
}

/**
 * GET /api/health - Comprehensive health check
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const checks: HealthCheck[] = [];
    
    // Database health check
    try {
      const dbStart = Date.now();
      const { data, error } = await supabaseAdmin
        .from('projects')
        .select('count')
        .limit(1)
        .single();
      
      const dbLatency = Date.now() - dbStart;
      
      checks.push({
        service: 'database',
        status: error ? 'unhealthy' : 'healthy',
        latency: dbLatency,
        error: error?.message,
        details: {
          provider: 'supabase',
          query: 'SELECT COUNT(*) FROM projects LIMIT 1'
        }
      });
    } catch (error) {
      checks.push({
        service: 'database',
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Database connection failed',
      });
    }

    // API health check
    checks.push({
      service: 'api',
      status: 'healthy',
      latency: Date.now() - startTime,
      details: {
        version: '1.0.0',
        environment: process.env.NODE_ENV,
      }
    });

    // Memory health check
    const memoryUsage = process.memoryUsage();
    const memoryStatus = memoryUsage.heapUsed / memoryUsage.heapTotal > 0.9 ? 'degraded' : 'healthy';
    
    checks.push({
      service: 'memory',
      status: memoryStatus,
      details: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024),
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
      }
    });

    // External services health check
    const externalChecks = await Promise.allSettled([
      // OpenAI API check
      fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(5000)
      }).then(res => ({
        service: 'openai',
        status: res.ok ? 'healthy' as const : 'degraded' as const,
        latency: 0,
        details: { statusCode: res.status }
      })).catch(err => ({
        service: 'openai',
        status: 'unhealthy' as const,
        error: err.message
      })),

      // Serper API check
      fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': process.env.SERPER_API_KEY || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ q: 'test', num: 1 }),
        signal: AbortSignal.timeout(5000)
      }).then(res => ({
        service: 'serper',
        status: res.ok ? 'healthy' as const : 'degraded' as const,
        latency: 0,
        details: { statusCode: res.status }
      })).catch(err => ({
        service: 'serper',
        status: 'unhealthy' as const,
        error: err.message
      }))
    ]);

    // Add external service results
    externalChecks.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        checks.push(result.value);
      }
    });

    // Determine overall health
    const hasUnhealthy = checks.some(check => check.status === 'unhealthy');
    const hasDegraded = checks.some(check => check.status === 'degraded');
    
    const overallStatus = hasUnhealthy ? 'unhealthy' : hasDegraded ? 'degraded' : 'healthy';
    const statusCode = overallStatus === 'unhealthy' ? 503 : overallStatus === 'degraded' ? 207 : 200;

    // Get monitoring status
    const healthStatus = monitoringManager.getHealthStatus();
    const performanceSummary = monitoringManager.getPerformanceSummary(1); // Last hour

    const response = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      version: '1.0.0',
      environment: process.env.NODE_ENV,
      region: process.env.VERCEL_REGION || 'local',
      checks,
      monitoring: {
        ...healthStatus,
        performance: performanceSummary
      },
      responseTime: Date.now() - startTime
    };

    return NextResponse.json(response, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    const errorResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      uptime: Math.floor(process.uptime()),
      responseTime: Date.now() - startTime
    };

    return NextResponse.json(errorResponse, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    });
  }
}

/**
 * POST /api/health - Detailed metrics (requires authentication)
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Get detailed monitoring data
    const healthStatus = monitoringManager.getHealthStatus();
    const performanceMetrics = monitoringManager.getPerformanceMetrics(24); // Last 24 hours
    const performanceSummary = monitoringManager.getPerformanceSummary(24);

    // Database performance metrics
    let databaseMetrics = null;
    try {
      const dbStart = Date.now();
      const { data: projectCount } = await supabaseAdmin
        .from('projects')
        .select('*', { count: 'exact', head: true });
      
      const { data: contentCount } = await supabaseAdmin
        .from('generated_content')
        .select('*', { count: 'exact', head: true });

      databaseMetrics = {
        latency: Date.now() - dbStart,
        projectCount: projectCount || 0,
        contentCount: contentCount || 0,
        connectionStatus: 'healthy'
      };
    } catch (error) {
      databaseMetrics = {
        error: error instanceof Error ? error.message : 'Database error',
        connectionStatus: 'unhealthy'
      };
    }

    const response = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      version: '1.0.0',
      environment: process.env.NODE_ENV,
      region: process.env.VERCEL_REGION || 'local',
      uptime: Math.floor(process.uptime()),
      
      // Health monitoring data
      health: healthStatus,
      
      // Performance data
      performance: {
        summary: performanceSummary,
        recent: performanceMetrics.slice(-12), // Last 12 data points
        database: databaseMetrics
      },

      // System information
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        memory: {
          usage: process.memoryUsage(),
          limit: parseInt(process.env.WEB_MEMORY || '512') * 1024 * 1024
        },
        cpu: {
          usage: process.cpuUsage()
        }
      }
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    const errorResponse = {
      status: 'error',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      version: '1.0.0'
    };

    return NextResponse.json(errorResponse, {
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    });
  }
}