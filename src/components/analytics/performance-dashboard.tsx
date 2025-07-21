'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { usePerformanceMonitoring, PERFORMANCE_BUDGETS } from '@/lib/monitoring/performance';
import { Activity, AlertTriangle, CheckCircle, Clock, TrendingUp, TrendingDown } from 'lucide-react';

interface PerformanceDashboardProps {
  className?: string;
}

type MetricData = {
  avg: number;
  min: number;
  max: number;
  count: number;
};

export function PerformanceDashboard({ className }: PerformanceDashboardProps) {
  const { getMetrics, getAlerts, clearMetrics } = usePerformanceMonitoring();
  const [metrics, setMetrics] = useState<Record<string, MetricData>>({});
  const [alerts, setAlerts] = useState<Record<string, number>>({});
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
  useEffect(() => {
    const updateMetrics = () => {
      setMetrics(getMetrics());
      setAlerts(getAlerts());
      setLastUpdate(new Date());
    };
    
    updateMetrics();
    const interval = setInterval(updateMetrics, 5000); // Update every 5 seconds
    
    return () => clearInterval(interval);
  }, [getMetrics, getAlerts]);
  
  const getMetricStatus = (name: string, value: number) => {
    const budget = PERFORMANCE_BUDGETS[name as keyof typeof PERFORMANCE_BUDGETS];
    if (!budget) return 'unknown';
    
    const ratio = value / budget;
    if (ratio <= 0.7) return 'good';
    if (ratio <= 0.9) return 'warning';
    return 'poor';
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'poor': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };
  
  const formatMetricName = (name: string) => {
    return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };
  
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };
  
  const coreWebVitals = ['FCP', 'LCP', 'FID', 'CLS', 'TTFB'];
  const customMetrics = Object.keys(metrics).filter(key => !coreWebVitals.includes(key));
  
  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Performance Dashboard</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </span>
          <Button variant="outline" size="sm" onClick={clearMetrics}>
            Clear Metrics
          </Button>
        </div>
      </div>
      
      {/* Core Web Vitals */}
      <Card className="p-6">
        <h3 className="text-md font-medium mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Core Web Vitals
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coreWebVitals.map((vital) => {
            const metric = metrics[vital];
            if (!metric) return null;
            
            const status = getMetricStatus(vital, metric.avg);
            const budget = PERFORMANCE_BUDGETS[vital as keyof typeof PERFORMANCE_BUDGETS];
            const progress = budget ? Math.min((metric.avg / budget) * 100, 100) : 0;
            
            return (
              <div key={vital} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{vital}</span>
                  {getStatusIcon(status)}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Average</span>
                    <span className={getStatusColor(status)}>
                      {formatDuration(metric.avg)}
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Min: {formatDuration(metric.min)}</span>
                    <span>Max: {formatDuration(metric.max)}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {metric.count} measurements
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
      
      {/* Custom Metrics */}
      {customMetrics.length > 0 && (
        <Card className="p-6">
          <h3 className="text-md font-medium mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Custom Metrics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customMetrics.map((name) => {
              const metric = metrics[name];
              const status = getMetricStatus(name, metric.avg);
              
              return (
                <div key={name} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{formatMetricName(name)}</span>
                    {getStatusIcon(status)}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Average</span>
                      <span className={getStatusColor(status)}>
                        {formatDuration(metric.avg)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Min: {formatDuration(metric.min)}</span>
                      <span>Max: {formatDuration(metric.max)}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {metric.count} measurements
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
      
      {/* Performance Alerts */}
      {Object.keys(alerts).length > 0 && (
        <Card className="p-6">
          <h3 className="text-md font-medium mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            Performance Alerts
          </h3>
          <div className="space-y-2">
            {Object.entries(alerts).map(([alert, count]) => (
              <div key={alert} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium">{formatMetricName(alert)}</span>
                </div>
                <Badge variant="destructive">{count} times</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
      
      {/* Performance Summary */}
      <Card className="p-6">
        <h3 className="text-md font-medium mb-4 flex items-center gap-2">
          <TrendingDown className="h-4 w-4" />
          Performance Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {Object.values(metrics).filter(m => getMetricStatus('', m.avg) === 'good').length}
            </div>
            <div className="text-sm text-green-600">Good Performance</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {Object.values(metrics).filter(m => getMetricStatus('', m.avg) === 'warning').length}
            </div>
            <div className="text-sm text-yellow-600">Needs Improvement</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {Object.values(metrics).filter(m => getMetricStatus('', m.avg) === 'poor').length}
            </div>
            <div className="text-sm text-red-600">Poor Performance</div>
          </div>
        </div>
      </Card>
    </div>
  );
}