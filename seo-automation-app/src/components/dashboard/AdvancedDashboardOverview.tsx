'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown,
  Users,
  Eye,
  Target,
  Zap,
  Brain,
  BarChart3,
  Clock,
  Globe,
  FileText,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Calendar,
  Star,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface DashboardMetric {
  id: string;
  name: string;
  value: string;
  change: number;
  changeType: 'increase' | 'decrease';
  icon: React.ReactNode;
  color: string;
  description: string;
  target?: number;
  unit?: string;
}

interface RecentActivity {
  id: string;
  type: 'content_generated' | 'optimization_applied' | 'report_created' | 'analysis_completed';
  title: string;
  description: string;
  timestamp: string;
  status: 'success' | 'warning' | 'info';
  icon: React.ReactNode;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  badge?: string;
  color: string;
}

export function AdvancedDashboardOverview() {
  const [metrics, setMetrics] = useState<DashboardMetric[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockMetrics: DashboardMetric[] = [
        {
          id: '1',
          name: 'Total Content Generated',
          value: '2,847',
          change: 23.5,
          changeType: 'increase',
          icon: <FileText className="h-4 w-4" />,
          color: 'text-blue-600',
          description: 'AI-generated content pieces this month',
          unit: 'pieces'
        },
        {
          id: '2',
          name: 'SEO Score Average',
          value: '87%',
          change: 12.3,
          changeType: 'increase',
          icon: <Target className="h-4 w-4" />,
          color: 'text-green-600',
          description: 'Average SEO optimization score',
          target: 90
        },
        {
          id: '3',
          name: 'Content Views',
          value: '1.2M',
          change: 18.7,
          changeType: 'increase',
          icon: <Eye className="h-4 w-4" />,
          color: 'text-purple-600',
          description: 'Total content views this month'
        },
        {
          id: '4',
          name: 'Engagement Rate',
          value: '4.8%',
          change: -2.1,
          changeType: 'decrease',
          icon: <Users className="h-4 w-4" />,
          color: 'text-orange-600',
          description: 'Average engagement across all content'
        },
        {
          id: '5',
          name: 'AI Optimizations',
          value: '1,456',
          change: 34.2,
          changeType: 'increase',
          icon: <Brain className="h-4 w-4" />,
          color: 'text-indigo-600',
          description: 'AI-powered optimizations applied'
        },
        {
          id: '6',
          name: 'Time Saved',
          value: '127h',
          change: 28.9,
          changeType: 'increase',
          icon: <Clock className="h-4 w-4" />,
          color: 'text-teal-600',
          description: 'Time saved through automation'
        }
      ];

      const mockActivity: RecentActivity[] = [
        {
          id: '1',
          type: 'content_generated',
          title: 'AI Content Generated',
          description: 'Generated "SEO Best Practices 2025" blog post',
          timestamp: '2 minutes ago',
          status: 'success',
          icon: <Sparkles className="h-4 w-4" />
        },
        {
          id: '2',
          type: 'optimization_applied',
          title: 'Content Optimized',
          description: 'Applied 12 SEO improvements to marketing guide',
          timestamp: '15 minutes ago',
          status: 'success',
          icon: <Zap className="h-4 w-4" />
        },
        {
          id: '3',
          type: 'analysis_completed',
          title: 'Competitor Analysis',
          description: 'Analyzed 5 competitors for keyword gaps',
          timestamp: '1 hour ago',
          status: 'info',
          icon: <BarChart3 className="h-4 w-4" />
        },
        {
          id: '4',
          type: 'report_created',
          title: 'Monthly Report Generated',
          description: 'SEO performance report ready for download',
          timestamp: '2 hours ago',
          status: 'success',
          icon: <FileText className="h-4 w-4" />
        },
        {
          id: '5',
          type: 'optimization_applied',
          title: 'Bulk Optimization',
          description: 'Optimized 25 blog posts for mobile performance',
          timestamp: '3 hours ago',
          status: 'warning',
          icon: <Globe className="h-4 w-4" />
        }
      ];

      setMetrics(mockMetrics);
      setRecentActivity(mockActivity);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions: QuickAction[] = [
    {
      id: '1',
      title: 'Generate Content',
      description: 'Create new AI-powered content',
      icon: <Sparkles className="h-5 w-5" />,
      href: '/dashboard/generate',
      badge: 'AI',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      id: '2',
      title: 'Optimize Content',
      description: 'Improve existing content',
      icon: <Zap className="h-5 w-5" />,
      href: '/dashboard/optimize',
      badge: 'PRO',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      id: '3',
      title: 'AI Lab',
      description: 'Advanced AI tools',
      icon: <Brain className="h-5 w-5" />,
      href: '/dashboard/ai-lab',
      badge: 'BETA',
      color: 'bg-indigo-500 hover:bg-indigo-600'
    },
    {
      id: '4',
      title: 'View Analytics',
      description: 'Performance insights',
      icon: <BarChart3 className="h-5 w-5" />,
      href: '/dashboard/analytics',
      color: 'bg-green-500 hover:bg-green-600'
    }
  ];

  const getChangeIcon = (changeType: 'increase' | 'decrease') => {
    return changeType === 'increase' ? (
      <ArrowUpRight className="h-3 w-3 text-green-500" />
    ) : (
      <ArrowDownRight className="h-3 w-3 text-red-500" />
    );
  };

  const getChangeColor = (changeType: 'increase' | 'decrease') => {
    return changeType === 'increase' ? 'text-green-600' : 'text-red-600';
  };

  const getActivityIcon = (status: 'success' | 'warning' | 'info') => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info': return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  const formatNumber = (num: string): string => {
    // Already formatted in mock data
    return num;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-full"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => (
          <Card key={metric.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
              <div className={metric.color}>
                {metric.icon}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {getChangeIcon(metric.changeType)}
                <span className={`ml-1 ${getChangeColor(metric.changeType)}`}>
                  {Math.abs(metric.change).toFixed(1)}%
                </span>
                <span className="ml-1">vs last month</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {metric.description}
              </p>
              {metric.target && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Progress to target</span>
                    <span>{Math.round((parseInt(metric.value) / metric.target) * 100)}%</span>
                  </div>
                  <Progress 
                    value={(parseInt(metric.value.replace('%', '')) / metric.target) * 100} 
                    className="h-1" 
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="h-5 w-5 mr-2" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {quickActions.map((action) => (
                <Button
                  key={action.id}
                  variant="outline"
                  className={`h-auto p-4 justify-start ${action.color} text-white border-0`}
                  asChild
                >
                  <a href={action.href}>
                    <div className="flex items-center space-x-3">
                      {action.icon}
                      <div className="text-left">
                        <div className="font-medium flex items-center">
                          {action.title}
                          {action.badge && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              {action.badge}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs opacity-90">{action.description}</div>
                      </div>
                    </div>
                  </a>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Recent Activity
              </span>
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {getActivityIcon(activity.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium">{activity.title}</p>
                      {activity.icon}
                    </div>
                    <p className="text-xs text-muted-foreground">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Performance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">94%</div>
              <div className="text-sm text-muted-foreground">Content Quality Score</div>
              <div className="text-xs text-green-600 mt-1">+8% from last month</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">127</div>
              <div className="text-sm text-muted-foreground">Hours Saved</div>
              <div className="text-xs text-blue-600 mt-1">Through AI automation</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">$12.4K</div>
              <div className="text-sm text-muted-foreground">Value Generated</div>
              <div className="text-xs text-purple-600 mt-1">ROI from content</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
