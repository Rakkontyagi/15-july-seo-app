'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database, 
  Globe, 
  Server,
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  RefreshCw
} from 'lucide-react';

import RealTimePerformanceMonitor from './RealTimePerformanceMonitor';
import { ErrorMonitoringDashboard } from '../admin/ErrorMonitoringDashboard';
import { HealthDashboard } from './HealthDashboard';
import { sentryManager } from '@/lib/monitoring/sentry';

interface SystemHealth {
  database: 'healthy' | 'degraded' | 'down';
  api: 'healthy' | 'degraded' | 'down';
  external_services: 'healthy' | 'degraded' | 'down';
  overall: 'healthy' | 'degraded' | 'down';
}

interface UserMetrics {
  active_users: number;
  page_views: number;
  bounce_rate: number;
  avg_session_duration: number;
  error_rate: number;
}

interface AlertingSummary {
  total_alerts: number;
  critical_alerts: number;
  warning_alerts: number;
  resolved_alerts: number;
  avg_response_time: number;
}

export default function MonitoringDashboard() {
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    database: 'healthy',
    api: 'healthy',
    external_services: 'healthy',
    overall: 'healthy'
  });
  
  const [userMetrics, setUserMetrics] = useState<UserMetrics>({
    active_users: 0,
    page_views: 0,
    bounce_rate: 0,
    avg_session_duration: 0,
    error_rate: 0
  });
  
  const [alertingSummary, setAlertingSummary] = useState<AlertingSummary>({
    total_alerts: 0,
    critical_alerts: 0,
    warning_alerts: 0,
    resolved_alerts: 0,
    avg_response_time: 0
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    fetchMonitoringData();
    
    // Update every 30 seconds
    const interval = setInterval(fetchMonitoringData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchMonitoringData = async () => {
    try {
      setIsLoading(true);
      
      // In a real implementation, these would be actual API calls
      // For now, we'll simulate with realistic data
      
      // Simulate API health check
      const healthResponse = await fetch('/api/health').catch(() => null);
      const apiHealth = healthResponse?.ok ? 'healthy' : 'degraded';
      
      // Simulate system health data
      const mockSystemHealth: SystemHealth = {
        database: Math.random() > 0.1 ? 'healthy' : 'degraded',
        api: apiHealth as 'healthy' | 'degraded',
        external_services: Math.random() > 0.2 ? 'healthy' : 'degraded',
        overall: 'healthy'
      };
      
      // Determine overall health
      const healthValues = Object.values(mockSystemHealth).filter(v => v !== 'healthy');
      if (healthValues.includes('down')) {
        mockSystemHealth.overall = 'down';
      } else if (healthValues.includes('degraded')) {
        mockSystemHealth.overall = 'degraded';
      }
      
      setSystemHealth(mockSystemHealth);
      
      // Simulate user metrics
      setUserMetrics({
        active_users: Math.floor(Math.random() * 50) + 10,
        page_views: Math.floor(Math.random() * 1000) + 500,
        bounce_rate: Math.random() * 40 + 30,
        avg_session_duration: Math.random() * 300 + 120,
        error_rate: Math.random() * 5
      });
      
      // Simulate alerting summary
      const totalAlerts = Math.floor(Math.random() * 20);
      const criticalAlerts = Math.floor(totalAlerts * 0.1);
      const warningAlerts = Math.floor(totalAlerts * 0.3);
      
      setAlertingSummary({
        total_alerts: totalAlerts,
        critical_alerts: criticalAlerts,
        warning_alerts: warningAlerts,
        resolved_alerts: Math.floor(Math.random() * 50) + 20,
        avg_response_time: Math.random() * 60 + 30
      });
      
      setLastUpdate(new Date());
      
    } catch (error) {
      console.error('Failed to fetch monitoring data:', error);
      sentryManager.captureError(error as Error, {
        component: 'MonitoringDashboard',
        action: 'fetchMonitoringData'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'degraded': return 'text-yellow-600 bg-yellow-100';
      case 'down': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4" />;
      case 'degraded': return <AlertTriangle className="w-4 h-4" />;
      case 'down': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getTrendIcon = (value: number, threshold: number) => {
    if (value > threshold) return <TrendingUp className="w-4 h-4 text-red-500" />;
    if (value < threshold * 0.8) return <TrendingDown className="w-4 h-4 text-green-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  const exportMetrics = () => {
    const data = {
      systemHealth,
      userMetrics,
      alertingSummary,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monitoring-metrics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    sentryManager.addBreadcrumb(
      'Monitoring metrics exported',
      'monitoring',
      'info',
      { timestamp: new Date().toISOString() }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Monitoring Dashboard</h1>
          <p className="text-gray-600">Real-time application monitoring and alerting</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportMetrics}
            disabled={isLoading}
          >
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMonitoringData}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-5 h-5 text-blue-600" />
            <span className="font-medium">Database</span>
          </div>
          <Badge className={getHealthColor(systemHealth.database)}>
            {getHealthIcon(systemHealth.database)}
            <span className="ml-1 capitalize">{systemHealth.database}</span>
          </Badge>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Server className="w-5 h-5 text-green-600" />
            <span className="font-medium">API</span>
          </div>
          <Badge className={getHealthColor(systemHealth.api)}>
            {getHealthIcon(systemHealth.api)}
            <span className="ml-1 capitalize">{systemHealth.api}</span>
          </Badge>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-5 h-5 text-purple-600" />
            <span className="font-medium">External Services</span>
          </div>
          <Badge className={getHealthColor(systemHealth.external_services)}>
            {getHealthIcon(systemHealth.external_services)}
            <span className="ml-1 capitalize">{systemHealth.external_services}</span>
          </Badge>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-orange-600" />
            <span className="font-medium">Overall Health</span>
          </div>
          <Badge className={getHealthColor(systemHealth.overall)}>
            {getHealthIcon(systemHealth.overall)}
            <span className="ml-1 capitalize">{systemHealth.overall}</span>
          </Badge>
        </Card>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Active Users</span>
            {getTrendIcon(userMetrics.active_users, 25)}
          </div>
          <div className="text-2xl font-bold">{userMetrics.active_users}</div>
          <div className="text-sm text-gray-500">Currently online</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Page Views</span>
            {getTrendIcon(userMetrics.page_views, 750)}
          </div>
          <div className="text-2xl font-bold">{userMetrics.page_views.toLocaleString()}</div>
          <div className="text-sm text-gray-500">Last 24 hours</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Error Rate</span>
            {getTrendIcon(userMetrics.error_rate, 2)}
          </div>
          <div className="text-2xl font-bold">{userMetrics.error_rate.toFixed(2)}%</div>
          <div className="text-sm text-gray-500">Last hour</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Avg Response Time</span>
            {getTrendIcon(alertingSummary.avg_response_time, 45)}
          </div>
          <div className="text-2xl font-bold">{alertingSummary.avg_response_time.toFixed(0)}s</div>
          <div className="text-sm text-gray-500">Alert resolution</div>
        </Card>
      </div>

      {/* Detailed Monitoring Tabs */}
      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
          <TabsTrigger value="health">Health Checks</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <RealTimePerformanceMonitor />
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <ErrorMonitoringDashboard />
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <HealthDashboard />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-semibold">Alerting Summary</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{alertingSummary.total_alerts}</div>
                <div className="text-sm text-gray-600">Total Alerts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{alertingSummary.critical_alerts}</div>
                <div className="text-sm text-gray-600">Critical</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{alertingSummary.warning_alerts}</div>
                <div className="text-sm text-gray-600">Warning</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{alertingSummary.resolved_alerts}</div>
                <div className="text-sm text-gray-600">Resolved</div>
              </div>
            </div>
            
            <div className="text-sm text-gray-600 text-center">
              Last updated: {lastUpdate.toLocaleString()}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}