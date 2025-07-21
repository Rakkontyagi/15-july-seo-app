/**
 * Health Monitoring Dashboard Component
 * Real-time monitoring of API services and system health
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  RefreshCw,
  Server,
  Zap,
  TrendingUp,
  TrendingDown,
  Wifi,
  WifiOff,
  Shield,
  Database
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  lastCheck: string;
  responseTime: number;
  uptime: number;
  errorRate: number;
  consecutiveFailures: number;
  averageResponseTime: number;
}

interface ProviderHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: string;
  responseTime: number;
  successRate: number;
  errorCount: number;
}

interface OverallHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  healthyServices: number;
  degradedServices: number;
  unhealthyServices: number;
  totalServices: number;
}

interface SystemMetrics {
  totalServices: number;
  healthyServices: number;
  degradedServices: number;
  unhealthyServices: number;
  averageResponseTime: number;
  averageUptime: number;
}

interface HealthData {
  overall: OverallHealth;
  system: SystemMetrics;
  services: ServiceHealth[];
  providers: ProviderHealth[];
}

export default function HealthDashboard() {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchHealthData = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/health/status');
      const data = await response.json();

      if (data.success) {
        setHealthData(data.data);
        setLastUpdated(new Date().toLocaleTimeString());
      } else {
        throw new Error(data.message || 'Failed to fetch health data');
      }
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const triggerHealthCheck = useCallback(async (serviceName: string) => {
    try {
      const response = await fetch('/api/health/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ service: serviceName }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: `Health check triggered for ${serviceName}`,
        });
        // Refresh data after a short delay
        setTimeout(fetchHealthData, 2000);
      } else {
        throw new Error(data.message || 'Failed to trigger health check');
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: (err as Error).message,
        variant: 'destructive',
      });
    }
  }, [fetchHealthData, toast]);

  // Initial load and auto-refresh
  useEffect(() => {
    fetchHealthData();
  }, [fetchHealthData]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchHealthData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [autoRefresh, fetchHealthData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'unhealthy': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'healthy': return 'default';
      case 'degraded': return 'secondary';
      case 'unhealthy': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />;
      case 'degraded': return <AlertTriangle className="h-4 w-4" />;
      case 'unhealthy': return <WifiOff className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatUptime = (uptime: number) => {
    return `${uptime.toFixed(2)}%`;
  };

  const formatResponseTime = (time: number) => {
    return `${time.toFixed(0)}ms`;
  };

  const formatLastCheck = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        <span>Loading health status...</span>
      </div>
    );
  }

  if (error && !healthData) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error Loading Health Data</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Health Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time monitoring of API services and system health
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Last updated: {lastUpdated}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-pulse' : ''}`} />
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchHealthData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {healthData && (
        <>
          {/* Overall Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Overall System Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                <div className="text-center">
                  <div className={`text-4xl font-bold ${getStatusColor(healthData.overall.status)}`}>
                    {getStatusIcon(healthData.overall.status)}
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">System Status</div>
                  <Badge variant={getStatusBadgeVariant(healthData.overall.status)} className="mt-1">
                    {healthData.overall.status.toUpperCase()}
                  </Badge>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {healthData.system.healthyServices}
                  </div>
                  <div className="text-sm text-muted-foreground">Healthy Services</div>
                  <Progress value={(healthData.system.healthyServices / healthData.system.totalServices) * 100} className="mt-2 h-2" />
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600">
                    {healthData.system.degradedServices}
                  </div>
                  <div className="text-sm text-muted-foreground">Degraded Services</div>
                  <Progress value={(healthData.system.degradedServices / healthData.system.totalServices) * 100} className="mt-2 h-2" />
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">
                    {healthData.system.unhealthyServices}
                  </div>
                  <div className="text-sm text-muted-foreground">Unhealthy Services</div>
                  <Progress value={(healthData.system.unhealthyServices / healthData.system.totalServices) * 100} className="mt-2 h-2" />
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {formatResponseTime(healthData.system.averageResponseTime)}
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Response Time</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatUptime(healthData.system.averageUptime)} uptime
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Status */}
          <Tabs defaultValue="services" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="services">
                <Server className="h-4 w-4 mr-2" />
                API Services
              </TabsTrigger>
              <TabsTrigger value="providers">
                <Database className="h-4 w-4 mr-2" />
                Search Providers
              </TabsTrigger>
            </TabsList>

            <TabsContent value="services" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {healthData.services.map((service) => (
                  <Card key={service.name}>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between text-lg">
                        <span className="capitalize">{service.name.replace('-', ' ')}</span>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(service.status)}
                          <Badge variant={getStatusBadgeVariant(service.status)}>
                            {service.status}
                          </Badge>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="text-muted-foreground">Response Time</div>
                          <div className="font-medium">{formatResponseTime(service.responseTime)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Uptime</div>
                          <div className="font-medium">{formatUptime(service.uptime)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Error Rate</div>
                          <div className="font-medium">{service.errorRate.toFixed(1)}%</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Failures</div>
                          <div className="font-medium">{service.consecutiveFailures}</div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Last check: {formatLastCheck(service.lastCheck)}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => triggerHealthCheck(service.name)}
                        >
                          <Zap className="h-3 w-3 mr-1" />
                          Check Now
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="providers" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {healthData.providers.map((provider) => (
                  <Card key={provider.name}>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between text-lg">
                        <span className="capitalize">{provider.name}</span>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(provider.status)}
                          <Badge variant={getStatusBadgeVariant(provider.status)}>
                            {provider.status}
                          </Badge>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="text-muted-foreground">Response Time</div>
                          <div className="font-medium">{formatResponseTime(provider.responseTime)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Success Rate</div>
                          <div className="font-medium">{provider.successRate.toFixed(1)}%</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Error Count</div>
                          <div className="font-medium">{provider.errorCount}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Status</div>
                          <div className={`font-medium ${getStatusColor(provider.status)}`}>
                            {provider.status}
                          </div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="text-xs text-muted-foreground">
                        Last check: {formatLastCheck(provider.lastCheck)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
