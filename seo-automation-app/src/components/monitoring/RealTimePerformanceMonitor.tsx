'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { usePerformanceMonitoring, PERFORMANCE_BUDGETS } from '@/lib/monitoring/performance';
import { sentryManager } from '@/lib/monitoring/sentry';
import { Activity, AlertTriangle, CheckCircle, Clock, Zap, RefreshCw } from 'lucide-react';

interface PerformanceMetric {
  name: string;
  value: number;
  budget: number;
  status: 'good' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
}

interface RealTimeMetrics {
  [key: string]: {
    avg: number;
    min: number;
    max: number;
    count: number;
  };
}

export default function RealTimePerformanceMonitor() {
  const [metrics, setMetrics] = useState<RealTimeMetrics>({});
  const [alerts, setAlerts] = useState<Record<string, number>>({});
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const { getMetrics, getAlerts, clearMetrics } = usePerformanceMonitoring();

  // Core Web Vitals tracking
  const [webVitals, setWebVitals] = useState<{
    FCP?: number;
    LCP?: number;
    FID?: number;
    CLS?: number;
    TTFB?: number;
  }>({});

  useEffect(() => {
    if (isMonitoring) {
      // Update metrics every 2 seconds
      intervalRef.current = setInterval(() => {
        const currentMetrics = getMetrics();
        const currentAlerts = getAlerts();
        
        setMetrics(currentMetrics);
        setAlerts(currentAlerts);
        setLastUpdate(new Date());
        
        // Track Web Vitals if available
        if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
          trackWebVitals();
        }
      }, 2000);
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [isMonitoring, getMetrics, getAlerts]);

  const trackWebVitals = () => {
    try {
      // Track FCP (First Contentful Paint)
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fcp = entries.find(entry => entry.name === 'first-contentful-paint');
        if (fcp) {
          setWebVitals(prev => ({ ...prev, FCP: fcp.startTime }));
        }
      });
      fcpObserver.observe({ entryTypes: ['paint'] });
      
      // Track LCP (Largest Contentful Paint)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          setWebVitals(prev => ({ ...prev, LCP: lastEntry.startTime }));
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      
      // Track FID (First Input Delay)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fid = entries[0];
        if (fid) {
          setWebVitals(prev => ({ ...prev, FID: fid.processingStart - fid.startTime }));
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      
      // Track CLS (Cumulative Layout Shift)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        setWebVitals(prev => ({ ...prev, CLS: clsValue }));
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      
    } catch (error) {
      console.warn('Web Vitals tracking not supported:', error);
    }
  };

  const processMetrics = (): PerformanceMetric[] => {
    const processed: PerformanceMetric[] = [];
    
    Object.entries(metrics).forEach(([name, data]) => {
      const budget = PERFORMANCE_BUDGETS[name as keyof typeof PERFORMANCE_BUDGETS];
      if (budget) {
        const status = data.avg <= budget * 0.8 ? 'good' : 
                      data.avg <= budget ? 'warning' : 'critical';
        
        processed.push({
          name,
          value: data.avg,
          budget,
          status,
          trend: 'stable' // In a real implementation, this would be calculated
        });
      }
    });
    
    return processed.sort((a, b) => a.name.localeCompare(b.name));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatMetricName = (name: string) => {
    return name.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatValue = (value: number) => {
    if (value < 1000) return `${Math.round(value)}ms`;
    return `${(value / 1000).toFixed(1)}s`;
  };

  const handleClearMetrics = () => {
    clearMetrics();
    setMetrics({});
    setAlerts({});
    setWebVitals({});
    
    // Log action to Sentry
    sentryManager.addBreadcrumb(
      'Performance metrics cleared',
      'monitoring',
      'info',
      { timestamp: new Date().toISOString() }
    );
  };

  const handleToggleMonitoring = () => {
    setIsMonitoring(!isMonitoring);
    
    // Log action to Sentry
    sentryManager.addBreadcrumb(
      `Performance monitoring ${isMonitoring ? 'disabled' : 'enabled'}`,
      'monitoring',
      'info',
      { timestamp: new Date().toISOString() }
    );
  };

  const processedMetrics = processMetrics();
  const criticalAlerts = Object.entries(alerts).filter(([_, count]) => count > 5);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-semibold">Real-Time Performance Monitor</h2>
          <Badge variant={isMonitoring ? 'default' : 'secondary'}>
            {isMonitoring ? 'Active' : 'Paused'}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleMonitoring}
          >
            {isMonitoring ? 'Pause' : 'Start'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearMetrics}
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Clear
          </Button>
        </div>
      </div>

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold text-red-800">Critical Performance Alerts</h3>
          </div>
          <div className="space-y-1">
            {criticalAlerts.map(([alert, count]) => (
              <div key={alert} className="text-sm text-red-700">
                {formatMetricName(alert.replace('_exceeded', ''))}: {count} violations
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Web Vitals */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Core Web Vitals</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(webVitals).map(([metric, value]) => {
            const budget = PERFORMANCE_BUDGETS[metric as keyof typeof PERFORMANCE_BUDGETS];
            const percentage = budget ? Math.min((value / budget) * 100, 100) : 0;
            const status = !budget ? 'good' : 
                          value <= budget * 0.8 ? 'good' : 
                          value <= budget ? 'warning' : 'critical';
            
            return (
              <div key={metric} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{metric}</span>
                  {getStatusIcon(status)}
                </div>
                <div className="text-lg font-semibold mb-1">
                  {metric === 'CLS' ? value.toFixed(3) : formatValue(value)}
                </div>
                {budget && (
                  <Progress 
                    value={percentage} 
                    className="h-2"
                    aria-label={`${metric} performance`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Performance Metrics</h3>
        <div className="space-y-3">
          {processedMetrics.map((metric) => (
            <div key={metric.name} className="flex items-center gap-4 p-3 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{formatMetricName(metric.name)}</span>
                  <Badge className={getStatusColor(metric.status)}>
                    {metric.status}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600">
                  Current: {formatValue(metric.value)} | Budget: {formatValue(metric.budget)}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {getStatusIcon(metric.status)}
                <div className="w-24">
                  <Progress 
                    value={Math.min((metric.value / metric.budget) * 100, 100)}
                    className="h-2"
                    aria-label={`${metric.name} performance`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monitoring Status */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4" />
          <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
        </div>
        <div>
          Monitoring {Object.keys(metrics).length} metrics
        </div>
      </div>
    </Card>
  );
}