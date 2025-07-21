/**
 * Error Monitoring Dashboard for SEO Automation App
 * Provides comprehensive error analytics and system health monitoring
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  TrendingUp, 
  Activity, 
  Clock, 
  Users, 
  Server,
  RefreshCw,
  Download,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { logAggregator, LogSearchQuery } from '@/lib/logging/log-aggregator';
import { serviceHealthMonitor } from '@/lib/monitoring/service-monitor';
import { alertManager } from '@/lib/monitoring/alerts';
import { cn } from '@/lib/utils';

interface ErrorStats {
  totalErrors: number;
  errorRate: number;
  criticalErrors: number;
  resolvedErrors: number;
  avgResolutionTime: number;
  topErrorTypes: Array<{ type: string; count: number }>;
  errorTrend: Array<{ time: string; count: number }>;
}

interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  services: Record<string, any>;
  uptime: number;
  responseTime: number;
}

export function ErrorMonitoringDashboard() {
  const [errorStats, setErrorStats] = useState<ErrorStats | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [recentErrors, setRecentErrors] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [timeRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load error statistics
      const stats = await loadErrorStats();
      setErrorStats(stats);

      // Load system health
      const health = await loadSystemHealth();
      setSystemHealth(health);

      // Load recent errors
      const errors = await loadRecentErrors();
      setRecentErrors(errors);

      // Load recent alerts
      const recentAlerts = alertManager.getRecentEvents(10);
      setAlerts(recentAlerts);

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadErrorStats = async (): Promise<ErrorStats> => {
    const now = new Date();
    const timeRangeMs = getTimeRangeMs(timeRange);
    const startTime = new Date(now.getTime() - timeRangeMs);

    const query: LogSearchQuery = {
      level: 'error',
      startTime: startTime.toISOString(),
      endTime: now.toISOString(),
      limit: 1000
    };

    const result = logAggregator.searchLogs(query);
    
    // Calculate error rate (errors per hour)
    const hoursInRange = timeRangeMs / (1000 * 60 * 60);
    const errorRate = result.total / hoursInRange;

    // Count critical errors
    const criticalErrors = result.logs.filter(log => 
      log.context?.severity === 'critical' || 
      log.message.toLowerCase().includes('critical')
    ).length;

    // Mock resolved errors and resolution time
    const resolvedErrors = Math.floor(result.total * 0.8);
    const avgResolutionTime = 45; // minutes

    // Top error types
    const errorTypes = new Map<string, number>();
    result.logs.forEach(log => {
      const type = log.context?.errorType || 'unknown';
      errorTypes.set(type, (errorTypes.get(type) || 0) + 1);
    });

    const topErrorTypes = Array.from(errorTypes.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Error trend (hourly buckets)
    const errorTrend = result.aggregations?.timeDistribution || [];

    return {
      totalErrors: result.total,
      errorRate: Math.round(errorRate * 100) / 100,
      criticalErrors,
      resolvedErrors,
      avgResolutionTime,
      topErrorTypes,
      errorTrend
    };
  };

  const loadSystemHealth = async (): Promise<SystemHealth> => {
    const health = serviceHealthMonitor.getSystemHealth();
    
    return {
      overall: health.status,
      services: health.services,
      uptime: 99.9, // Mock uptime percentage
      responseTime: 250 // Mock average response time
    };
  };

  const loadRecentErrors = async () => {
    const query: LogSearchQuery = {
      level: 'error',
      limit: 20,
      sortBy: 'timestamp',
      sortOrder: 'desc'
    };

    const result = logAggregator.searchLogs(query);
    return result.logs;
  };

  const getTimeRangeMs = (range: string): number => {
    switch (range) {
      case '1h': return 60 * 60 * 1000;
      case '24h': return 24 * 60 * 60 * 1000;
      case '7d': return 7 * 24 * 60 * 60 * 1000;
      case '30d': return 30 * 24 * 60 * 60 * 1000;
      default: return 24 * 60 * 60 * 1000;
    }
  };

  const exportErrorData = () => {
    const query: LogSearchQuery = {
      level: 'error',
      limit: 1000
    };
    
    const data = logAggregator.exportLogs(query);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-logs-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading && !errorStats) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Error Monitoring</h1>
          <p className="text-gray-600">System health and error analytics dashboard</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          
          <Button onClick={exportErrorData} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          <Button onClick={loadDashboardData} variant="outline" size="sm">
            <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className={cn('h-3 w-3 rounded-full', {
                'bg-green-500': systemHealth?.overall === 'healthy',
                'bg-yellow-500': systemHealth?.overall === 'degraded',
                'bg-red-500': systemHealth?.overall === 'unhealthy'
              })} />
              <span className="text-lg font-semibold capitalize">
                {systemHealth?.overall || 'Unknown'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span className="text-2xl font-bold">{errorStats?.totalErrors || 0}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {errorStats?.errorRate || 0} errors/hour
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Critical Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-red-600" />
              <span className="text-2xl font-bold text-red-600">
                {errorStats?.criticalErrors || 0}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Resolution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">
                {errorStats?.avgResolutionTime || 0}m
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Recent Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No recent alerts</p>
          ) : (
            <div className="space-y-3">
              {alerts.slice(0, 5).map((alert, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant={
                      alert.severity === 'critical' ? 'destructive' :
                      alert.severity === 'high' ? 'destructive' :
                      alert.severity === 'medium' ? 'default' : 'secondary'
                    }>
                      {alert.severity}
                    </Badge>
                    <div>
                      <p className="font-medium">{alert.ruleName}</p>
                      <p className="text-sm text-gray-600">{alert.message}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Types and Recent Errors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Error Types */}
        <Card>
          <CardHeader>
            <CardTitle>Top Error Types</CardTitle>
          </CardHeader>
          <CardContent>
            {errorStats?.topErrorTypes.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No errors in selected time range</p>
            ) : (
              <div className="space-y-3">
                {errorStats?.topErrorTypes.map((errorType, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{errorType.type}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full"
                          style={{ 
                            width: `${(errorType.count / (errorStats?.totalErrors || 1)) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">{errorType.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Errors */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Errors</CardTitle>
          </CardHeader>
          <CardContent>
            {recentErrors.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recent errors</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {recentErrors.slice(0, 10).map((error, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-600 truncate">
                          {error.message}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {error.userId && (
                            <Badge variant="outline" className="text-xs">
                              <Users className="h-3 w-3 mr-1" />
                              {error.userId.substring(0, 8)}
                            </Badge>
                          )}
                          {error.endpoint && (
                            <Badge variant="outline" className="text-xs">
                              <Server className="h-3 w-3 mr-1" />
                              {error.endpoint}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 ml-2">
                        {new Date(error.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
