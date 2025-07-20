'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown,
  Users,
  Eye,
  MousePointer,
  Clock,
  Target,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';

interface AnalyticsOverviewProps {
  timeRange: string;
}

interface TrafficSource {
  source: string;
  visitors: number;
  percentage: number;
  change: number;
  color: string;
}

interface DeviceData {
  device: string;
  visitors: number;
  percentage: number;
  icon: React.ReactNode;
}

interface GeographicData {
  country: string;
  visitors: number;
  percentage: number;
  flag: string;
}

export function AnalyticsOverview({ timeRange }: AnalyticsOverviewProps) {
  const [activeChart, setActiveChart] = useState('traffic');

  const trafficSources: TrafficSource[] = [
    {
      source: 'Organic Search',
      visitors: 45230,
      percentage: 52.3,
      change: 18.2,
      color: 'bg-blue-500'
    },
    {
      source: 'Direct',
      visitors: 23450,
      percentage: 27.1,
      change: 12.5,
      color: 'bg-green-500'
    },
    {
      source: 'Social Media',
      visitors: 12890,
      percentage: 14.9,
      change: -5.3,
      color: 'bg-purple-500'
    },
    {
      source: 'Referral',
      visitors: 3420,
      percentage: 4.0,
      change: 23.7,
      color: 'bg-orange-500'
    },
    {
      source: 'Email',
      visitors: 1450,
      percentage: 1.7,
      change: 8.9,
      color: 'bg-pink-500'
    }
  ];

  const deviceData: DeviceData[] = [
    {
      device: 'Desktop',
      visitors: 48920,
      percentage: 56.5,
      icon: <Monitor className="h-4 w-4" />
    },
    {
      device: 'Mobile',
      visitors: 32450,
      percentage: 37.5,
      icon: <Smartphone className="h-4 w-4" />
    },
    {
      device: 'Tablet',
      visitors: 5180,
      percentage: 6.0,
      icon: <Tablet className="h-4 w-4" />
    }
  ];

  const geographicData: GeographicData[] = [
    { country: 'United States', visitors: 34520, percentage: 39.9, flag: '🇺🇸' },
    { country: 'United Kingdom', visitors: 12890, percentage: 14.9, flag: '🇬🇧' },
    { country: 'Canada', visitors: 8940, percentage: 10.3, flag: '🇨🇦' },
    { country: 'Australia', visitors: 6780, percentage: 7.8, flag: '🇦🇺' },
    { country: 'Germany', visitors: 5430, percentage: 6.3, flag: '🇩🇪' },
    { country: 'France', visitors: 4320, percentage: 5.0, flag: '🇫🇷' },
    { country: 'Other', visitors: 13670, percentage: 15.8, flag: '🌍' }
  ];

  const behaviorMetrics = [
    {
      name: 'Pages per Session',
      value: 2.8,
      change: 15.3,
      changeType: 'increase' as const,
      description: 'Average pages viewed per session'
    },
    {
      name: 'Average Session Duration',
      value: 3.2,
      change: 8.7,
      changeType: 'increase' as const,
      description: 'Average time spent on site (minutes)'
    },
    {
      name: 'Bounce Rate',
      value: 32.1,
      change: -12.4,
      changeType: 'increase' as const, // Lower bounce rate is better
      description: 'Percentage of single-page sessions'
    },
    {
      name: 'New vs Returning',
      value: 68.5,
      change: 5.2,
      changeType: 'increase' as const,
      description: 'Percentage of new visitors'
    }
  ];

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getChangeIcon = (changeType: 'increase' | 'decrease') => {
    return changeType === 'increase' ? (
      <TrendingUp className="h-3 w-3 text-green-500" />
    ) : (
      <TrendingDown className="h-3 w-3 text-red-500" />
    );
  };

  const getChangeColor = (changeType: 'increase' | 'decrease') => {
    return changeType === 'increase' ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Traffic Sources */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Traffic Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {trafficSources.map((source, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${source.color}`}></div>
                      <span>{source.source}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{formatNumber(source.visitors)}</span>
                      <Badge 
                        variant="outline" 
                        className={source.change > 0 ? 'text-green-600' : 'text-red-600'}
                      >
                        {source.change > 0 ? '+' : ''}{source.change.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Progress value={source.percentage} className="flex-1 h-2" />
                    <span className="text-xs text-muted-foreground w-12">
                      {source.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              User Behavior
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {behaviorMetrics.map((metric, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{metric.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {metric.description}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">
                      {metric.name === 'Average Session Duration' ? 
                        `${metric.value.toFixed(1)}m` : 
                        `${metric.value.toFixed(1)}${metric.name.includes('Rate') || metric.name.includes('vs') ? '%' : ''}`
                      }
                    </div>
                    <div className="flex items-center text-xs">
                      {getChangeIcon(metric.changeType)}
                      <span className={`ml-1 ${getChangeColor(metric.changeType)}`}>
                        {Math.abs(metric.change).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Device and Geographic Data */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Smartphone className="h-5 w-5 mr-2" />
              Device Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {deviceData.map((device, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-muted-foreground">
                      {device.icon}
                    </div>
                    <span className="font-medium text-sm">{device.device}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="font-medium">{formatNumber(device.visitors)}</div>
                      <div className="text-xs text-muted-foreground">
                        {device.percentage.toFixed(1)}%
                      </div>
                    </div>
                    <div className="w-16">
                      <Progress value={device.percentage} className="h-2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Globe className="h-5 w-5 mr-2" />
              Geographic Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {geographicData.map((country, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{country.flag}</span>
                    <span className="font-medium text-sm">{country.country}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="font-medium">{formatNumber(country.visitors)}</div>
                      <div className="text-xs text-muted-foreground">
                        {country.percentage.toFixed(1)}%
                      </div>
                    </div>
                    <div className="w-16">
                      <Progress value={country.percentage} className="h-2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Engagement Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">86.4%</div>
              <div className="text-sm text-muted-foreground">Engagement Rate</div>
              <div className="flex items-center justify-center mt-1">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-xs text-green-600">+12.3%</span>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">4.2</div>
              <div className="text-sm text-muted-foreground">Avg. Page Depth</div>
              <div className="flex items-center justify-center mt-1">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-xs text-green-600">+8.7%</span>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">2:45</div>
              <div className="text-sm text-muted-foreground">Avg. Time on Page</div>
              <div className="flex items-center justify-center mt-1">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-xs text-green-600">+15.2%</span>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">73.2%</div>
              <div className="text-sm text-muted-foreground">Return Visitor Rate</div>
              <div className="flex items-center justify-center mt-1">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-xs text-green-600">+6.8%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Real-time Activity
            </span>
            <Badge variant="outline" className="text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              Live
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold">247</div>
              <div className="text-sm text-muted-foreground">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">1,423</div>
              <div className="text-sm text-muted-foreground">Page Views (Last Hour)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">89</div>
              <div className="text-sm text-muted-foreground">New Sessions</div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="text-sm font-medium text-blue-800 mb-1">
              Top Active Page
            </div>
            <div className="text-sm text-blue-700">
              /blog/seo-best-practices-2025 - 43 active users
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
