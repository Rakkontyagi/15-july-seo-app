/**
 * Advanced Analytics Dashboard
 * Implements Story 3.1 - Enterprise analytics with real-time data visualization
 * Comprehensive usage analytics, performance metrics, and business insights
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  FileText, 
  Clock, 
  Target, 
  DollarSign,
  Activity,
  Zap,
  Globe,
  Calendar,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';

import { useAppStore } from '@/lib/store/app-store';
import { enterpriseSubscriptionManager } from '@/lib/subscription/enterprise-subscription-manager';
import { performanceMonitor } from '@/lib/monitoring/performance-monitor';

// Types
interface AnalyticsData {
  overview: OverviewMetrics;
  usage: UsageAnalytics;
  performance: PerformanceAnalytics;
  content: ContentAnalytics;
  users: UserAnalytics;
  revenue: RevenueAnalytics;
}

interface OverviewMetrics {
  totalUsers: number;
  activeUsers: number;
  contentGenerated: number;
  revenue: number;
  growthRate: number;
  conversionRate: number;
}

interface UsageAnalytics {
  dailyUsage: Array<{ date: string; contentGenerated: number; apiCalls: number; activeUsers: number }>;
  featureUsage: Array<{ feature: string; usage: number; percentage: number }>;
  planDistribution: Array<{ plan: string; users: number; revenue: number }>;
}

interface PerformanceAnalytics {
  responseTime: Array<{ time: string; avg: number; p95: number; p99: number }>;
  errorRate: Array<{ time: string; rate: number }>;
  uptime: number;
  throughput: Array<{ time: string; requests: number }>;
}

interface ContentAnalytics {
  contentTypes: Array<{ type: string; count: number; avgQuality: number }>;
  seoScores: Array<{ range: string; count: number }>;
  topKeywords: Array<{ keyword: string; count: number; avgScore: number }>;
  contentTrends: Array<{ date: string; blogPosts: number; servicePages: number; productDescriptions: number }>;
}

interface UserAnalytics {
  userGrowth: Array<{ date: string; newUsers: number; totalUsers: number }>;
  userEngagement: Array<{ date: string; dailyActive: number; weeklyActive: number; monthlyActive: number }>;
  retentionCohorts: Array<{ cohort: string; week1: number; week2: number; week4: number; week8: number }>;
  geographicDistribution: Array<{ country: string; users: number; percentage: number }>;
}

interface RevenueAnalytics {
  monthlyRevenue: Array<{ month: string; revenue: number; growth: number }>;
  revenueByPlan: Array<{ plan: string; revenue: number; users: number; arpu: number }>;
  churnRate: Array<{ month: string; churnRate: number; newSubscriptions: number }>;
  ltv: Array<{ cohort: string; ltv: number; paybackPeriod: number }>;
}

export function AdvancedAnalyticsDashboard() {
  const { user, subscription } = useAppStore();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('overview');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Load analytics data
  useEffect(() => {
    loadAnalyticsData();
    
    if (autoRefresh) {
      const interval = setInterval(loadAnalyticsData, 60000); // Refresh every minute
      return () => clearInterval(interval);
    }
  }, [timeRange, autoRefresh]);

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    
    try {
      // Simulate loading analytics data (in production, this would call actual analytics API)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const data = generateMockAnalyticsData(timeRange);
      setAnalyticsData(data);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = (format: 'csv' | 'pdf' | 'excel') => {
    // Implement data export functionality
    console.log(`Exporting analytics data as ${format}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-12">
        <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No Analytics Data</h3>
        <p className="text-muted-foreground">Unable to load analytics data. Please try again.</p>
        <Button onClick={loadAnalyticsData} className="mt-4">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into your content generation platform
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={() => setAutoRefresh(!autoRefresh)}>
            <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh
          </Button>
          
          <Select onValueChange={handleExportData}>
            <SelectTrigger className="w-32">
              <Download className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Export" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="excel">Excel</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" />
                +{analyticsData.overview.growthRate}%
              </span>
              from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Content Generated</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.contentGenerated.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" />
                +23%
              </span>
              from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analyticsData.overview.revenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" />
                +18%
              </span>
              from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" />
                +2.1%
              </span>
              from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs value={selectedMetric} onValueChange={setSelectedMetric} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Daily Usage Trends</CardTitle>
                <CardDescription>Content generation and API usage over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analyticsData.usage.dailyUsage}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="contentGenerated" stackId="1" stroke="#8884d8" fill="#8884d8" />
                    <Area type="monotone" dataKey="apiCalls" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Plan Distribution</CardTitle>
                <CardDescription>Revenue and user distribution by subscription plan</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.usage.planDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ plan, percentage }) => `${plan} (${percentage}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="users"
                    >
                      {analyticsData.usage.planDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042'][index % 4]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Feature Usage</CardTitle>
                <CardDescription>Most popular features and their usage rates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.usage.featureUsage.map((feature, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{feature.feature}</span>
                        <span>{feature.usage.toLocaleString()} uses</span>
                      </div>
                      <Progress value={feature.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Users</CardTitle>
                <CardDescription>Daily active users over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.usage.dailyUsage}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="activeUsers" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Response Time</CardTitle>
                <CardDescription>API response time percentiles</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.performance.responseTime}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="avg" stroke="#8884d8" name="Average" />
                    <Line type="monotone" dataKey="p95" stroke="#82ca9d" name="95th Percentile" />
                    <Line type="monotone" dataKey="p99" stroke="#ffc658" name="99th Percentile" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>Uptime and error rates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uptime</span>
                    <span className="font-medium">{analyticsData.performance.uptime}%</span>
                  </div>
                  <Progress value={analyticsData.performance.uptime} className="h-2" />
                </div>
                
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={analyticsData.performance.errorRate}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="rate" stroke="#ff7300" fill="#ff7300" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Content Types</CardTitle>
                <CardDescription>Distribution of generated content types</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.content.contentTypes}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SEO Score Distribution</CardTitle>
                <CardDescription>Quality distribution of generated content</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.content.seoScores}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top Keywords</CardTitle>
              <CardDescription>Most frequently used keywords and their performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.content.topKeywords.map((keyword, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <span className="font-medium">{keyword.keyword}</span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>{keyword.count} uses</span>
                      <span>Avg Score: {keyword.avgScore}/100</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
                <CardDescription>New user acquisition over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analyticsData.users.userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="newUsers" stackId="1" stroke="#8884d8" fill="#8884d8" />
                    <Area type="monotone" dataKey="totalUsers" stackId="2" stroke="#82ca9d" fill="#82ca9d" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Geographic Distribution</CardTitle>
                <CardDescription>Users by country</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.users.geographicDistribution.map((country, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center">
                          <Globe className="w-4 h-4 mr-2" />
                          {country.country}
                        </span>
                        <span>{country.users.toLocaleString()} users</span>
                      </div>
                      <Progress value={country.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue</CardTitle>
                <CardDescription>Revenue growth over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analyticsData.revenue.monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="revenue" stroke="#8884d8" fill="#8884d8" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue by Plan</CardTitle>
                <CardDescription>Revenue breakdown by subscription tier</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.revenue.revenueByPlan.map((plan, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Badge variant={plan.plan === 'Enterprise' ? 'default' : 'outline'}>
                          {plan.plan}
                        </Badge>
                        <span>{plan.users} users</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${plan.revenue.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">
                          ${plan.arpu} ARPU
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Mock data generator
function generateMockAnalyticsData(timeRange: string): AnalyticsData {
  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
  
  return {
    overview: {
      totalUsers: 12847,
      activeUsers: 8934,
      contentGenerated: 45623,
      revenue: 89450,
      growthRate: 15.3,
      conversionRate: 12.8,
    },
    usage: {
      dailyUsage: Array.from({ length: days }, (_, i) => ({
        date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        contentGenerated: Math.floor(Math.random() * 200) + 100,
        apiCalls: Math.floor(Math.random() * 1000) + 500,
        activeUsers: Math.floor(Math.random() * 300) + 200,
      })),
      featureUsage: [
        { feature: 'Blog Post Generation', usage: 15420, percentage: 45 },
        { feature: 'SEO Analysis', usage: 12340, percentage: 36 },
        { feature: 'Content Templates', usage: 8760, percentage: 26 },
        { feature: 'Team Collaboration', usage: 6540, percentage: 19 },
        { feature: 'API Integration', usage: 4320, percentage: 13 },
      ],
      planDistribution: [
        { plan: 'Free', users: 5420, revenue: 0 },
        { plan: 'Professional', users: 4320, revenue: 45600 },
        { plan: 'Enterprise', users: 3107, revenue: 43850 },
      ],
    },
    performance: {
      responseTime: Array.from({ length: 24 }, (_, i) => ({
        time: `${i}:00`,
        avg: Math.floor(Math.random() * 500) + 200,
        p95: Math.floor(Math.random() * 800) + 400,
        p99: Math.floor(Math.random() * 1200) + 600,
      })),
      errorRate: Array.from({ length: 24 }, (_, i) => ({
        time: `${i}:00`,
        rate: Math.random() * 2,
      })),
      uptime: 99.8,
      throughput: Array.from({ length: 24 }, (_, i) => ({
        time: `${i}:00`,
        requests: Math.floor(Math.random() * 1000) + 500,
      })),
    },
    content: {
      contentTypes: [
        { type: 'Blog Posts', count: 18420, avgQuality: 87 },
        { type: 'Service Pages', count: 12340, avgQuality: 91 },
        { type: 'Product Descriptions', count: 14863, avgQuality: 84 },
      ],
      seoScores: [
        { range: '90-100', count: 12450 },
        { range: '80-89', count: 18320 },
        { range: '70-79', count: 10240 },
        { range: '60-69', count: 4613 },
      ],
      topKeywords: [
        { keyword: 'digital marketing', count: 1240, avgScore: 92 },
        { keyword: 'SEO optimization', count: 1120, avgScore: 89 },
        { keyword: 'content strategy', count: 980, avgScore: 91 },
        { keyword: 'social media', count: 850, avgScore: 87 },
        { keyword: 'email marketing', count: 720, avgScore: 88 },
      ],
      contentTrends: Array.from({ length: days }, (_, i) => ({
        date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        blogPosts: Math.floor(Math.random() * 50) + 20,
        servicePages: Math.floor(Math.random() * 30) + 15,
        productDescriptions: Math.floor(Math.random() * 40) + 25,
      })),
    },
    users: {
      userGrowth: Array.from({ length: days }, (_, i) => ({
        date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        newUsers: Math.floor(Math.random() * 50) + 10,
        totalUsers: 12000 + i * 15,
      })),
      userEngagement: Array.from({ length: days }, (_, i) => ({
        date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        dailyActive: Math.floor(Math.random() * 300) + 200,
        weeklyActive: Math.floor(Math.random() * 800) + 600,
        monthlyActive: Math.floor(Math.random() * 2000) + 1500,
      })),
      retentionCohorts: [
        { cohort: 'Jan 2024', week1: 85, week2: 72, week4: 58, week8: 45 },
        { cohort: 'Feb 2024', week1: 88, week2: 75, week4: 62, week8: 48 },
        { cohort: 'Mar 2024', week1: 91, week2: 78, week4: 65, week8: 52 },
      ],
      geographicDistribution: [
        { country: 'United States', users: 5420, percentage: 42 },
        { country: 'United Kingdom', users: 2340, percentage: 18 },
        { country: 'Canada', users: 1560, percentage: 12 },
        { country: 'Australia', users: 1240, percentage: 10 },
        { country: 'Germany', users: 980, percentage: 8 },
        { country: 'Others', users: 1307, percentage: 10 },
      ],
    },
    revenue: {
      monthlyRevenue: Array.from({ length: 12 }, (_, i) => ({
        month: new Date(2024, i, 1).toLocaleDateString('en-US', { month: 'short' }),
        revenue: Math.floor(Math.random() * 20000) + 70000,
        growth: Math.floor(Math.random() * 30) + 5,
      })),
      revenueByPlan: [
        { plan: 'Professional', revenue: 45600, users: 4320, arpu: 10.56 },
        { plan: 'Enterprise', revenue: 43850, users: 3107, arpu: 14.11 },
      ],
      churnRate: Array.from({ length: 12 }, (_, i) => ({
        month: new Date(2024, i, 1).toLocaleDateString('en-US', { month: 'short' }),
        churnRate: Math.random() * 5 + 2,
        newSubscriptions: Math.floor(Math.random() * 200) + 100,
      })),
      ltv: [
        { cohort: 'Q1 2024', ltv: 450, paybackPeriod: 3.2 },
        { cohort: 'Q2 2024', ltv: 520, paybackPeriod: 2.8 },
        { cohort: 'Q3 2024', ltv: 480, paybackPeriod: 3.1 },
      ],
    },
  };
}
