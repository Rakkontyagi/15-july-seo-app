/**
 * API Route: Health Status Monitoring
 * Provides comprehensive health status for all API services
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { createHealthMonitor } from '@/lib/api/health-monitor';
import { createFallbackProviderSystem } from '@/lib/api/fallback-providers';
import { withAuth } from '@/lib/auth/middleware';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { withErrorHandler } from '@/lib/middleware/error-handler';

// Health check configurations
const HEALTH_CHECKS = [
  {
    name: 'serper-api',
    url: 'https://google.serper.dev/search',
    method: 'POST' as const,
    headers: {
      'X-API-KEY': process.env.SERPER_API_KEY || '',
      'Content-Type': 'application/json',
    },
    body: { q: 'health check' },
    timeout: 10000,
    interval: 5 * 60 * 1000, // 5 minutes
    retries: 2,
    expectedStatus: [200],
  },
  {
    name: 'openai-api',
    url: 'https://api.openai.com/v1/models',
    method: 'GET' as const,
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY || ''}`,
    },
    timeout: 15000,
    interval: 10 * 60 * 1000, // 10 minutes
    retries: 2,
    expectedStatus: [200],
  },
  {
    name: 'firecrawl-api',
    url: 'https://api.firecrawl.dev/v0/crawl',
    method: 'POST' as const,
    headers: {
      'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY || ''}`,
      'Content-Type': 'application/json',
    },
    body: { url: 'https://example.com' },
    timeout: 20000,
    interval: 15 * 60 * 1000, // 15 minutes
    retries: 3,
    expectedStatus: [200, 202],
  },
  {
    name: 'supabase-db',
    url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`,
    method: 'GET' as const,
    headers: {
      'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`,
    },
    timeout: 5000,
    interval: 2 * 60 * 1000, // 2 minutes
    retries: 2,
    expectedStatus: [200],
  },
];

// Initialize health monitor
const healthMonitor = createHealthMonitor({
  checks: HEALTH_CHECKS.filter(check => 
    check.headers.Authorization !== 'Bearer ' && 
    check.headers['X-API-KEY'] !== '' &&
    check.headers.apikey !== ''
  ),
  alerts: {
    enabled: true,
    thresholds: {
      consecutiveFailures: 3,
      errorRate: 50,
      responseTime: 10000,
      uptime: 95,
    },
    notifications: {
      webhook: process.env.HEALTH_WEBHOOK_URL,
    },
  },
  metricsRetention: 7, // 7 days
  globalTimeout: 30000,
  enableDetailedLogging: process.env.NODE_ENV === 'development',
});

// Initialize fallback provider system for additional monitoring
const fallbackSystem = createFallbackProviderSystem();

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method, query } = req;

  try {
    switch (method) {
      case 'GET':
        return await handleGetHealth(req, res);
      case 'POST':
        return await handleTriggerCheck(req, res);
      default:
        return res.status(405).json({
          success: false,
          error: 'Method not allowed',
          message: `Method ${method} not supported`,
        });
    }
  } catch (error) {
    console.error('Health status API error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: (error as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Handle GET request for health status
 */
async function handleGetHealth(req: NextApiRequest, res: NextApiResponse) {
  const { service, metrics, hours } = req.query;

  // Get specific service health
  if (service && typeof service === 'string') {
    const serviceHealth = healthMonitor.getServiceHealth(service);
    
    if (!serviceHealth) {
      return res.status(404).json({
        success: false,
        error: 'Service not found',
        message: `Service ${service} not found`,
      });
    }

    const response: any = {
      success: true,
      data: serviceHealth,
    };

    // Include metrics if requested
    if (metrics === 'true') {
      const metricsHours = hours ? parseInt(hours as string, 10) : 24;
      response.data.metrics = healthMonitor.getServiceMetrics(service, metricsHours);
    }

    return res.status(200).json(response);
  }

  // Get overall health status
  const overallHealth = healthMonitor.getOverallHealth();
  const allServices = healthMonitor.getHealthStatus();
  const providerHealth = fallbackSystem.getHealthStatus();

  // Calculate system-wide metrics
  const systemMetrics = {
    totalServices: allServices.length,
    healthyServices: allServices.filter(s => s.status === 'healthy').length,
    degradedServices: allServices.filter(s => s.status === 'degraded').length,
    unhealthyServices: allServices.filter(s => s.status === 'unhealthy').length,
    averageResponseTime: allServices.length > 0 ? 
      allServices.reduce((sum, s) => sum + s.averageResponseTime, 0) / allServices.length : 0,
    averageUptime: allServices.length > 0 ? 
      allServices.reduce((sum, s) => sum + s.uptime, 0) / allServices.length : 100,
  };

  const response = {
    success: true,
    data: {
      overall: overallHealth,
      system: systemMetrics,
      services: allServices.map(service => ({
        name: service.name,
        status: service.status,
        lastCheck: service.lastCheck,
        responseTime: service.responseTime,
        uptime: service.uptime,
        errorRate: service.errorRate,
        consecutiveFailures: service.consecutiveFailures,
        averageResponseTime: service.averageResponseTime,
      })),
      providers: providerHealth.map(provider => ({
        name: provider.name,
        status: provider.status,
        lastCheck: provider.lastCheck,
        responseTime: provider.responseTime,
        successRate: provider.successRate,
        errorCount: provider.errorCount,
      })),
    },
    timestamp: new Date().toISOString(),
  };

  // Set appropriate status code based on overall health
  const statusCode = overallHealth.status === 'healthy' ? 200 : 
                    overallHealth.status === 'degraded' ? 200 : 503;

  return res.status(statusCode).json(response);
}

/**
 * Handle POST request to trigger health check
 */
async function handleTriggerCheck(req: NextApiRequest, res: NextApiResponse) {
  const { service } = req.body;

  if (!service || typeof service !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Invalid request',
      message: 'Service name is required',
    });
  }

  try {
    const result = await healthMonitor.triggerHealthCheck(service);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Service not found',
        message: `Service ${service} not found`,
      });
    }

    return res.status(200).json({
      success: true,
      data: result,
      message: `Health check triggered for ${service}`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Health check failed',
      message: (error as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
}

// Apply middleware with relaxed rate limiting for health checks
export default withErrorHandler(
  withRateLimit(
    withAuth(handler, { requireAuth: false }), // Health checks should be accessible
    {
      windowMs: 1 * 60 * 1000, // 1 minute
      max: 60, // 60 requests per minute
      message: 'Too many health check requests',
    }
  )
);
