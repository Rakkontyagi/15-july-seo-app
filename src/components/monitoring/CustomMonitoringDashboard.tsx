'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  LineChart, 
  PieChart, 
  TrendingUp, 
  TrendingDown,
  Clock,
  Database,
  Server,
  Globe,
  Users,
  FileText,
  Search,
  AlertTriangle,
  CheckCircle,
  Activity,
  Zap,
  RefreshCw,
  Download,
  Settings,
  Filter
} from 'lucide-react';

import { performanceTracker } from '@/lib/monitoring/performance-metrics';
import { alertingSystem } from '@/lib/monitoring/alerting';
import { sentryManager } from '@/lib/monitoring/sentry';
import RealTimePerformanceMonitor from './RealTimePerformanceMonitor';
import UserBehaviorAnalytics from './UserBehaviorAnalytics';
import MonitoringDashboard from './MonitoringDashboard';

interface BusinessMetrics {
  contentGeneration: {
    totalToday: number;
    successRate: number;
    averageTime: number;
    tokensUsed: number;
    trend: 'up' | 'down' | 'stable';
  };
  serpAnalysis: {
    totalToday: number;
    successRate: number;
    averageTime: number;
    cacheHitRate: number;
    trend: 'up' | 'down' | 'stable';
  };
  userEngagement: {
    activeUsers: number;
    sessionDuration: number;
    pageViews: number;
    bounceRate: number;
    trend: 'up' | 'down' | 'stable';
  };
}

interface TechnicalMetrics {
  vercelFunctions: {
    totalInvocations: number;
    averageExecutionTime: number;
    errorRate: number;
    coldStartRate: number;
    topSlowFunctions: Array<{ name: string; time: number }>;
  };
  supabaseQueries: {
    totalQueries: number;
    averageExecutionTime: number;
    slowQueryCount: number;
    cacheHitRate: number;
    topSlowQueries: Array<{ table: string; type: string; time: number }>;
  };
  systemHealth: {
    overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    uptime: number;
    memoryUsage: number;
    cpuUsage: number;
    errorRate: number;
  };
}

interface CustomDashboardConfig {
  refreshInterval: number;
  showBusinessMetrics: boolean;
  showTechnicalMetrics: boolean;
  showRealTimeAlerts: boolean;
  autoRefresh: boolean;
  theme: 'light' | 'dark';
}

export default function CustomMonitoringDashboard() {
  const [businessMetrics, setBusinessMetrics] = useState<BusinessMetrics | null>(null);
  const [technicalMetrics, setTechnicalMetrics] = useState<TechnicalMetrics | null>(null);
  const [config, setConfig] = useState<CustomDashboardConfig>({
    refreshInterval: 30000,
    showBusinessMetrics: true,
    showTechnicalMetrics: true,
    showRealTimeAlerts: true,
    autoRefresh: true,
    theme: 'light'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadDashboardData();
    
    let interval: NodeJS.Timeout | null = null;
    if (config.autoRefresh) {
      interval = setInterval(loadDashboardData, config.refreshInterval);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [config.autoRefresh, config.refreshInterval]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      await Promise.all([
        loadBusinessMetrics(),
        loadTechnicalMetrics()
      ]);
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      sentryManager.captureError(error as Error, {
        component: 'CustomMonitoringDashboard',
        action: 'loadDashboardData'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadBusinessMetrics = async () => {
    const customMetrics = performanceTracker.getCustomMetrics();
    
    const businessMetrics: BusinessMetrics = {
      contentGeneration: {
        totalToday: customMetrics.contentGeneration.totalGenerations,
        successRate: customMetrics.contentGeneration.successRate,
        averageTime: customMetrics.contentGeneration.averageTime,
        tokensUsed: customMetrics.contentGeneration.tokensUsed,
        trend: getTrend(customMetrics.contentGeneration.successRate, 95)
      },
      serpAnalysis: {
        totalToday: customMetrics.serpAnalysis.totalAnalyses,
        successRate: customMetrics.serpAnalysis.successRate,
        averageTime: customMetrics.serpAnalysis.averageTime,
        cacheHitRate: customMetrics.serpAnalysis.cacheHitRate,
        trend: getTrend(customMetrics.serpAnalysis.successRate, 95)
      },
      userEngagement: {
        activeUsers: customMetrics.userSessions.activeSessions,
        sessionDuration: customMetrics.userSessions.averageSessionDuration,
        pageViews: customMetrics.userSessions.pageViews,
        bounceRate: customMetrics.userSessions.bounceRate,
        trend: getTrend(100 - customMetrics.userSessions.bounceRate, 70)
      }
    };
    
    setBusinessMetrics(businessMetrics);
  };

  const loadTechnicalMetrics = async () => {
    const vercelMetrics = performanceTracker.getVercelMetrics();
    const supabaseMetrics = performanceTracker.getSupabaseMetrics();
    const summary = performanceTracker.getPerformanceSummary();
    
    // Calculate Vercel function metrics
    const vercelFunctions = Array.from(vercelMetrics.values());
    const totalInvocations = vercelFunctions.reduce((sum, fn) => sum + fn.invocations, 0);
    const averageExecutionTime = vercelFunctions.reduce((sum, fn) => sum + fn.executionTime, 0) / vercelFunctions.length || 0;
    const errorRate = vercelFunctions.reduce((sum, fn) => sum + fn.errors, 0) / totalInvocations * 100 || 0;
    const coldStartRate = vercelFunctions.filter(fn => fn.coldStart).length / vercelFunctions.length * 100 || 0;
    
    // Calculate Supabase query metrics
    const allQueries = Array.from(supabaseMetrics.values()).flat();
    const totalQueries = allQueries.length;
    const averageQueryTime = allQueries.reduce((sum, query) => sum + query.executionTime, 0) / totalQueries || 0;
    const slowQueryCount = allQueries.filter(query => query.slowQuery).length;
    const queryCacheHitRate = allQueries.filter(query => query.cacheHit).length / totalQueries * 100 || 0;
    
    const technicalMetrics: TechnicalMetrics = {
      vercelFunctions: {
        totalInvocations,
        averageExecutionTime,
        errorRate,
        coldStartRate,
        topSlowFunctions: summary.topSlowFunctions.slice(0, 5).map(fn => ({
          name: fn.functionName,
          time: fn.executionTime
        }))
      },
      supabaseQueries: {
        totalQueries,
        averageExecutionTime: averageQueryTime,
        slowQueryCount,
        cacheHitRate: queryCacheHitRate,
        topSlowQueries: summary.topSlowQueries.slice(0, 5).map(query => ({
          table: query.table,
          type: query.queryType,
          time: query.executionTime
        }))
      },
      systemHealth: {
        overallStatus: getOverallSystemStatus(),
        uptime: 99.9, // Mock uptime
        memoryUsage: Math.random() * 80 + 20,
        cpuUsage: Math.random() * 60 + 20,
        errorRate: errorRate
      }
    };
    
    setTechnicalMetrics(technicalMetrics);
  };

  const getTrend = (value: number, threshold: number): 'up' | 'down' | 'stable' => {
    if (value > threshold * 1.1) return 'up';
    if (value < threshold * 0.9) return 'down';
    return 'stable';
  };

  const getOverallSystemStatus = (): 'healthy' | 'degraded' | 'unhealthy' => {
    const alerts = alertingSystem.getActiveAlerts();
    const criticalAlerts = alerts.filter(alert => alert.severity === 'critical');
    const highAlerts = alerts.filter(alert => alert.severity === 'high');
    
    if (criticalAlerts.length > 0) return 'unhealthy';
    if (highAlerts.length > 2) return 'degraded';
    return 'healthy';
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-500" />;
      case 'stable': return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'degraded': return 'text-yellow-600 bg-yellow-100';
      case 'unhealthy': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const exportDashboardData = () => {
    const data = {
      businessMetrics,
      technicalMetrics,
      config,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monitoring-dashboard-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Custom Monitoring Dashboard</h1>
          <p className="text-gray-600">Comprehensive application monitoring and business metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportDashboardData}
            disabled={isLoading}
          >
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadDashboardData}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfig(prev => ({ ...prev, autoRefresh: !prev.autoRefresh }))}
          >
            <Settings className="w-4 h-4 mr-1" />
            {config.autoRefresh ? 'Pause' : 'Resume'}
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-blue-600" />
              <span className="font-medium">System Status</span>
            </div>
            <Badge className={getHealthColor(technicalMetrics?.systemHealth.overallStatus || 'healthy')}>
              {technicalMetrics?.systemHealth.overallStatus || 'Loading...'}
            </Badge>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-green-600" />
              <span className="font-medium">Uptime</span>
            </div>
            <div className="text-2xl font-bold">{technicalMetrics?.systemHealth.uptime || 0}%</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-purple-600" />
              <span className="font-medium">Active Alerts</span>
            </div>
            <div className="text-2xl font-bold">{alertingSystem.getActiveAlerts().length}</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <RefreshCw className="w-5 h-5 text-orange-600" />
              <span className="font-medium">Last Update</span>
            </div>
            <div className="text-sm text-gray-600">{lastUpdate.toLocaleTimeString()}</div>
          </div>
        </div>
      </Card>

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="technical">Technical</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Business Metrics Overview */}
          {config.showBusinessMetrics && businessMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold">Content Generation</h3>
                  </div>
                  {getTrendIcon(businessMetrics.contentGeneration.trend)}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Today</span>
                    <span className="font-medium">{businessMetrics.contentGeneration.totalToday}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Success Rate</span>
                    <span className="font-medium">{businessMetrics.contentGeneration.successRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Avg Time</span>
                    <span className="font-medium">{formatDuration(businessMetrics.contentGeneration.averageTime)}</span>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Search className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold">SERP Analysis</h3>
                  </div>
                  {getTrendIcon(businessMetrics.serpAnalysis.trend)}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Today</span>
                    <span className="font-medium">{businessMetrics.serpAnalysis.totalToday}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Success Rate</span>
                    <span className="font-medium">{businessMetrics.serpAnalysis.successRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Cache Hit Rate</span>
                    <span className="font-medium">{businessMetrics.serpAnalysis.cacheHitRate.toFixed(1)}%</span>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-600" />
                    <h3 className="font-semibold">User Engagement</h3>
                  </div>
                  {getTrendIcon(businessMetrics.userEngagement.trend)}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Active Users</span>
                    <span className="font-medium">{businessMetrics.userEngagement.activeUsers}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Session Duration</span>
                    <span className="font-medium">{formatDuration(businessMetrics.userEngagement.sessionDuration * 1000)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Bounce Rate</span>
                    <span className="font-medium">{businessMetrics.userEngagement.bounceRate.toFixed(1)}%</span>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Technical Metrics Overview */}
          {config.showTechnicalMetrics && technicalMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Server className="w-5 h-5 text-orange-600" />
                  <h3 className="font-semibold">Vercel Functions</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Invocations</span>
                    <span className="font-medium">{formatNumber(technicalMetrics.vercelFunctions.totalInvocations)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Avg Execution Time</span>
                    <span className="font-medium">{formatDuration(technicalMetrics.vercelFunctions.averageExecutionTime)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Error Rate</span>
                    <span className="font-medium">{technicalMetrics.vercelFunctions.errorRate.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Cold Start Rate</span>
                    <span className="font-medium">{technicalMetrics.vercelFunctions.coldStartRate.toFixed(1)}%</span>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Database className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold">Supabase Queries</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Queries</span>
                    <span className="font-medium">{formatNumber(technicalMetrics.supabaseQueries.totalQueries)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Avg Execution Time</span>
                    <span className="font-medium">{formatDuration(technicalMetrics.supabaseQueries.averageExecutionTime)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Slow Queries</span>
                    <span className="font-medium">{technicalMetrics.supabaseQueries.slowQueryCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Cache Hit Rate</span>
                    <span className="font-medium">{technicalMetrics.supabaseQueries.cacheHitRate.toFixed(1)}%</span>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="business" className="space-y-4">
          {/* Business metrics detailed view */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Content Generation Metrics</h3>
              {businessMetrics && (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Success Rate</span>
                      <span className="text-sm">{businessMetrics.contentGeneration.successRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={businessMetrics.contentGeneration.successRate} className="h-2" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{businessMetrics.contentGeneration.totalToday}</div>
                      <div className="text-sm text-gray-600">Total Generated</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{formatNumber(businessMetrics.contentGeneration.tokensUsed)}</div>
                      <div className="text-sm text-gray-600">Tokens Used</div>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">SERP Analysis Metrics</h3>
              {businessMetrics && (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Cache Hit Rate</span>
                      <span className="text-sm">{businessMetrics.serpAnalysis.cacheHitRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={businessMetrics.serpAnalysis.cacheHitRate} className="h-2" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{businessMetrics.serpAnalysis.totalToday}</div>
                      <div className="text-sm text-gray-600">Total Analyses</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{formatDuration(businessMetrics.serpAnalysis.averageTime)}</div>
                      <div className="text-sm text-gray-600">Avg Time</div>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="technical" className="space-y-4">
          {/* Technical metrics detailed view */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Top Slow Functions</h3>
              {technicalMetrics && (
                <div className="space-y-3">
                  {technicalMetrics.vercelFunctions.topSlowFunctions.map((fn, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">{fn.name}</span>
                      <Badge variant="outline">{formatDuration(fn.time)}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Top Slow Queries</h3>
              {technicalMetrics && (
                <div className="space-y-3">
                  {technicalMetrics.supabaseQueries.topSlowQueries.map((query, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{query.table}</div>
                        <div className="text-sm text-gray-600">{query.type}</div>
                      </div>
                      <Badge variant="outline">{formatDuration(query.time)}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <RealTimePerformanceMonitor />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <UserBehaviorAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}