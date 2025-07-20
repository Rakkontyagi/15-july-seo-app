'use client';

import { useState } from 'react';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { AnalyticsOverview } from '@/components/analytics/AnalyticsOverview';
import { ContentPerformance } from '@/components/analytics/ContentPerformance';
import { SEOInsights } from '@/components/analytics/SEOInsights';
import { ReportGenerator } from '@/components/analytics/ReportGenerator';
import { 
  BarChart3, 
  TrendingUp, 
  FileText,
  Download,
  Calendar,
  Filter,
  Target,
  Users,
  Eye,
  MousePointer,
  Clock,
  Globe
} from 'lucide-react';

interface AnalyticsMetric {
  id: string;
  name: string;
  value: number;
  change: number;
  changeType: 'increase' | 'decrease';
  unit: string;
  icon: React.ReactNode;
  description: string;
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');

  const keyMetrics: AnalyticsMetric[] = [
    {
      id: '1',
      name: 'Total Content Views',
      value: 125430,
      change: 18.2,
      changeType: 'increase',
      unit: 'views',
      icon: <Eye className="h-4 w-4" />,
      description: 'Total page views across all content'
    },
    {
      id: '2',
      name: 'Organic Traffic',
      value: 89240,
      change: 24.5,
      changeType: 'increase',
      unit: 'visits',
      icon: <Users className="h-4 w-4" />,
      description: 'Visitors from search engines'
    },
    {
      id: '3',
      name: 'Average Session Duration',
      value: 3.2,
      change: 12.8,
      changeType: 'increase',
      unit: 'min',
      icon: <Clock className="h-4 w-4" />,
      description: 'Average time spent on site'
    },
    {
      id: '4',
      name: 'Conversion Rate',
      value: 4.7,
      change: 8.3,
      changeType: 'increase',
      unit: '%',
      icon: <Target className="h-4 w-4" />,
      description: 'Percentage of visitors who convert'
    },
    {
      id: '5',
      name: 'Bounce Rate',
      value: 32.1,
      change: -15.4,
      changeType: 'increase', // Lower bounce rate is better
      unit: '%',
      icon: <MousePointer className="h-4 w-4" />,
      description: 'Percentage of single-page sessions'
    },
    {
      id: '6',
      name: 'Pages per Session',
      value: 2.8,
      change: 22.1,
      changeType: 'increase',
      unit: 'pages',
      icon: <Globe className="h-4 w-4" />,
      description: 'Average pages viewed per session'
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

  const getChangeColor = (changeType: 'increase' | 'decrease') => {
    return changeType === 'increase' ? 'text-green-600' : 'text-red-600';
  };

  const getChangeIcon = (changeType: 'increase' | 'decrease') => {
    return changeType === 'increase' ? (
      <TrendingUp className="h-3 w-3 text-green-500" />
    ) : (
      <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />
    );
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Analytics & Reports' }
      ]} />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-responsive-3xl font-bold">Analytics & Reports</h1>
          <p className="text-muted-foreground text-responsive-base">
            Comprehensive analytics and insights for your content performance
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {keyMetrics.map((metric) => (
          <Card key={metric.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
              <div className="text-muted-foreground">
                {metric.icon}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metric.name === 'Average Session Duration' ? 
                  `${metric.value.toFixed(1)}${metric.unit}` :
                  `${formatNumber(metric.value)}${metric.unit !== 'views' && metric.unit !== 'visits' && metric.unit !== 'pages' ? metric.unit : ''}`
                }
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                {getChangeIcon(metric.changeType)}
                <span className={`ml-1 ${getChangeColor(metric.changeType)}`}>
                  {Math.abs(metric.change).toFixed(1)}%
                </span>
                <span className="ml-1">vs previous period</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {metric.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="content">
            <FileText className="h-4 w-4 mr-2" />
            Content Performance
          </TabsTrigger>
          <TabsTrigger value="seo">
            <TrendingUp className="h-4 w-4 mr-2" />
            SEO Insights
          </TabsTrigger>
          <TabsTrigger value="reports">
            <Download className="h-4 w-4 mr-2" />
            Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <AnalyticsOverview timeRange={timeRange} />
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <ContentPerformance timeRange={timeRange} />
        </TabsContent>

        <TabsContent value="seo" className="space-y-6">
          <SEOInsights timeRange={timeRange} />
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <ReportGenerator />
        </TabsContent>
      </Tabs>

      {/* Quick Insights */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Top Performing Content
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { title: 'Complete SEO Guide 2025', views: 12500, change: 23.5 },
                { title: 'Content Marketing Strategy', views: 9800, change: 18.2 },
                { title: 'Digital Marketing Trends', views: 8600, change: 31.7 },
                { title: 'Social Media Best Practices', views: 7200, change: 12.4 },
                { title: 'Email Marketing Guide', views: 6800, change: 8.9 }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{item.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatNumber(item.views)} views
                    </div>
                  </div>
                  <Badge variant="outline" className="text-green-600">
                    +{item.change.toFixed(1)}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2" />
              Conversion Funnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { stage: 'Visitors', count: 89240, percentage: 100 },
                { stage: 'Page Views', count: 249872, percentage: 89.2 },
                { stage: 'Engaged Users', count: 62450, percentage: 70.0 },
                { stage: 'Newsletter Signups', count: 8924, percentage: 10.0 },
                { stage: 'Conversions', count: 4195, percentage: 4.7 }
              ].map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{item.stage}</span>
                    <span className="font-medium">
                      {formatNumber(item.count)} ({item.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <Progress value={item.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
