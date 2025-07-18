'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  MousePointer, 
  Eye, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  PieChart,
  Filter,
  Calendar,
  Download
} from 'lucide-react';
import { sentryManager } from '@/lib/monitoring/sentry';

interface UserSession {
  id: string;
  userId?: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  pageViews: number;
  clicks: number;
  scrollDepth: number;
  bounced: boolean;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  userAgent: string;
  country?: string;
  referrer?: string;
}

interface PageMetrics {
  path: string;
  views: number;
  unique_visitors: number;
  avg_time_on_page: number;
  bounce_rate: number;
  exit_rate: number;
  scroll_depth: number;
  conversion_rate: number;
}

interface UserBehaviorMetrics {
  total_sessions: number;
  unique_users: number;
  avg_session_duration: number;
  bounce_rate: number;
  pages_per_session: number;
  new_users_percentage: number;
  returning_users_percentage: number;
  most_popular_pages: PageMetrics[];
  user_flow: { from: string; to: string; count: number }[];
  device_breakdown: { type: string; count: number; percentage: number }[];
  geographic_data: { country: string; sessions: number; percentage: number }[];
  time_on_site_distribution: { range: string; count: number }[];
}

interface HeatmapData {
  x: number;
  y: number;
  intensity: number;
  clicks: number;
  element?: string;
}

export default function UserBehaviorAnalytics() {
  const [metrics, setMetrics] = useState<UserBehaviorMetrics>({
    total_sessions: 0,
    unique_users: 0,
    avg_session_duration: 0,
    bounce_rate: 0,
    pages_per_session: 0,
    new_users_percentage: 0,
    returning_users_percentage: 0,
    most_popular_pages: [],
    user_flow: [],
    device_breakdown: [],
    geographic_data: [],
    time_on_site_distribution: []
  });
  
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [selectedDateRange, setSelectedDateRange] = useState('7d');
  const [selectedPage, setSelectedPage] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Real-time session tracking
  useEffect(() => {
    startSessionTracking();
    fetchAnalyticsData();
    
    const interval = setInterval(fetchAnalyticsData, 60000); // Update every minute
    
    return () => {
      clearInterval(interval);
      endSessionTracking();
    };
  }, [selectedDateRange, selectedPage]);

  const startSessionTracking = () => {
    if (typeof window === 'undefined') return;
    
    const sessionId = generateSessionId();
    const session: UserSession = {
      id: sessionId,
      startTime: new Date(),
      duration: 0,
      pageViews: 1,
      clicks: 0,
      scrollDepth: 0,
      bounced: false,
      deviceType: getDeviceType(),
      userAgent: navigator.userAgent,
      referrer: document.referrer
    };
    
    // Track page views
    trackPageView(window.location.pathname);
    
    // Track clicks
    document.addEventListener('click', handleClick);
    
    // Track scroll depth
    document.addEventListener('scroll', handleScroll);
    
    // Track time on page
    const startTime = Date.now();
    const trackTimeOnPage = () => {
      const timeOnPage = Date.now() - startTime;
      session.duration = timeOnPage;
      sessionStorage.setItem('currentSession', JSON.stringify(session));
    };
    
    const timeInterval = setInterval(trackTimeOnPage, 1000);
    
    // Store session data
    sessionStorage.setItem('currentSession', JSON.stringify(session));
    sessionStorage.setItem('timeInterval', timeInterval.toString());
    
    // Track session start
    sentryManager.addBreadcrumb(
      'User session started',
      'analytics',
      'info',
      { sessionId, deviceType: session.deviceType }
    );
  };

  const endSessionTracking = () => {
    const sessionData = sessionStorage.getItem('currentSession');
    const timeInterval = sessionStorage.getItem('timeInterval');
    
    if (sessionData) {
      const session = JSON.parse(sessionData);
      session.endTime = new Date();
      
      // Send session data to analytics
      sendSessionData(session);
      
      // Clear session storage
      sessionStorage.removeItem('currentSession');
      
      if (timeInterval) {
        clearInterval(parseInt(timeInterval));
        sessionStorage.removeItem('timeInterval');
      }
    }
  };

  const generateSessionId = () => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const getDeviceType = (): 'desktop' | 'mobile' | 'tablet' => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('tablet') || (userAgent.includes('android') && !userAgent.includes('mobile'))) {
      return 'tablet';
    }
    if (userAgent.includes('mobile') || userAgent.includes('iphone') || userAgent.includes('ipod')) {
      return 'mobile';
    }
    return 'desktop';
  };

  const trackPageView = (path: string) => {
    const sessionData = sessionStorage.getItem('currentSession');
    if (sessionData) {
      const session = JSON.parse(sessionData);
      session.pageViews++;
      sessionStorage.setItem('currentSession', JSON.stringify(session));
    }
    
    // Track in analytics
    sentryManager.addBreadcrumb(
      'Page view tracked',
      'analytics',
      'info',
      { path, timestamp: new Date().toISOString() }
    );
  };

  const handleClick = (event: MouseEvent) => {
    const sessionData = sessionStorage.getItem('currentSession');
    if (sessionData) {
      const session = JSON.parse(sessionData);
      session.clicks++;
      sessionStorage.setItem('currentSession', JSON.stringify(session));
    }
    
    // Track heatmap data
    const heatmapPoint: HeatmapData = {
      x: event.clientX,
      y: event.clientY,
      intensity: 1,
      clicks: 1,
      element: (event.target as HTMLElement)?.tagName || 'unknown'
    };
    
    setHeatmapData(prev => [...prev, heatmapPoint]);
  };

  const handleScroll = () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollDepth = Math.round((scrollTop / scrollHeight) * 100);
    
    const sessionData = sessionStorage.getItem('currentSession');
    if (sessionData) {
      const session = JSON.parse(sessionData);
      session.scrollDepth = Math.max(session.scrollDepth, scrollDepth);
      sessionStorage.setItem('currentSession', JSON.stringify(session));
    }
  };

  const sendSessionData = async (session: UserSession) => {
    try {
      // In a real implementation, this would send to your analytics backend
      console.log('Session completed:', session);
      
      // Update local state
      setSessions(prev => [...prev, session]);
      
    } catch (error) {
      console.error('Failed to send session data:', error);
      sentryManager.captureError(error as Error, {
        component: 'UserBehaviorAnalytics',
        action: 'sendSessionData',
        sessionId: session.id
      });
    }
  };

  const fetchAnalyticsData = async () => {
    try {
      setIsLoading(true);
      
      // Simulate fetching analytics data
      // In a real implementation, this would fetch from your analytics API
      const mockMetrics: UserBehaviorMetrics = {
        total_sessions: Math.floor(Math.random() * 1000) + 500,
        unique_users: Math.floor(Math.random() * 300) + 200,
        avg_session_duration: Math.random() * 300 + 120,
        bounce_rate: Math.random() * 40 + 30,
        pages_per_session: Math.random() * 3 + 2,
        new_users_percentage: Math.random() * 40 + 40,
        returning_users_percentage: Math.random() * 40 + 40,
        most_popular_pages: [
          { path: '/dashboard', views: 342, unique_visitors: 256, avg_time_on_page: 145, bounce_rate: 32, exit_rate: 28, scroll_depth: 67, conversion_rate: 8.5 },
          { path: '/content', views: 298, unique_visitors: 203, avg_time_on_page: 189, bounce_rate: 28, exit_rate: 25, scroll_depth: 72, conversion_rate: 12.3 },
          { path: '/analytics', views: 187, unique_visitors: 142, avg_time_on_page: 234, bounce_rate: 24, exit_rate: 22, scroll_depth: 81, conversion_rate: 15.7 },
          { path: '/settings', views: 156, unique_visitors: 98, avg_time_on_page: 98, bounce_rate: 45, exit_rate: 42, scroll_depth: 45, conversion_rate: 5.2 }
        ],
        user_flow: [
          { from: '/dashboard', to: '/content', count: 45 },
          { from: '/content', to: '/analytics', count: 32 },
          { from: '/dashboard', to: '/settings', count: 28 },
          { from: '/analytics', to: '/dashboard', count: 24 }
        ],
        device_breakdown: [
          { type: 'desktop', count: 342, percentage: 58.2 },
          { type: 'mobile', count: 198, percentage: 33.7 },
          { type: 'tablet', count: 48, percentage: 8.1 }
        ],
        geographic_data: [
          { country: 'United States', sessions: 245, percentage: 41.7 },
          { country: 'United Kingdom', sessions: 89, percentage: 15.1 },
          { country: 'Canada', sessions: 67, percentage: 11.4 },
          { country: 'Australia', sessions: 43, percentage: 7.3 },
          { country: 'Germany', sessions: 32, percentage: 5.4 }
        ],
        time_on_site_distribution: [
          { range: '0-30s', count: 123 },
          { range: '30s-1m', count: 89 },
          { range: '1-2m', count: 156 },
          { range: '2-5m', count: 198 },
          { range: '5m+', count: 89 }
        ]
      };
      
      setMetrics(mockMetrics);
      setLastUpdate(new Date());
      
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
      sentryManager.captureError(error as Error, {
        component: 'UserBehaviorAnalytics',
        action: 'fetchAnalyticsData'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportAnalytics = () => {
    const data = {
      metrics,
      sessions: sessions.slice(-100), // Last 100 sessions
      heatmapData,
      dateRange: selectedDateRange,
      selectedPage,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `user-analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    sentryManager.addBreadcrumb(
      'User analytics exported',
      'analytics',
      'info',
      { timestamp: new Date().toISOString() }
    );
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">User Behavior Analytics</h2>
          <p className="text-gray-600">Track user interactions and behavior patterns</p>
        </div>
        <div className="flex items-center gap-2">
          <select 
            value={selectedDateRange} 
            onChange={(e) => setSelectedDateRange(e.target.value)}
            className="px-3 py-1 border rounded-md"
          >
            <option value="1d">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 3 months</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={exportAnalytics}
            disabled={isLoading}
          >
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium">Total Sessions</span>
          </div>
          <div className="text-2xl font-bold">{metrics.total_sessions.toLocaleString()}</div>
          <div className="text-sm text-gray-600">{formatPercentage(metrics.new_users_percentage)} new users</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium">Unique Users</span>
          </div>
          <div className="text-2xl font-bold">{metrics.unique_users.toLocaleString()}</div>
          <div className="text-sm text-gray-600">{formatPercentage(metrics.returning_users_percentage)} returning</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium">Avg Session Duration</span>
          </div>
          <div className="text-2xl font-bold">{formatDuration(metrics.avg_session_duration)}</div>
          <div className="text-sm text-gray-600">{metrics.pages_per_session.toFixed(1)} pages/session</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-5 h-5 text-red-600" />
            <span className="text-sm font-medium">Bounce Rate</span>
          </div>
          <div className="text-2xl font-bold">{formatPercentage(metrics.bounce_rate)}</div>
          <div className="text-sm text-gray-600">Single page visits</div>
        </Card>
      </div>

      {/* Most Popular Pages */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Most Popular Pages</h3>
        </div>
        <div className="space-y-3">
          {metrics.most_popular_pages.map((page) => (
            <div key={page.path} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <div className="font-medium">{page.path}</div>
                <div className="text-sm text-gray-600">
                  {page.views} views • {page.unique_visitors} unique visitors
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="text-center">
                  <div className="font-medium">{formatDuration(page.avg_time_on_page)}</div>
                  <div className="text-gray-600">Avg time</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">{formatPercentage(page.bounce_rate)}</div>
                  <div className="text-gray-600">Bounce rate</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">{formatPercentage(page.conversion_rate)}</div>
                  <div className="text-gray-600">Conversion</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Device and Geographic Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold">Device Breakdown</h3>
          </div>
          <div className="space-y-3">
            {metrics.device_breakdown.map((device) => (
              <div key={device.type} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                  <span className="capitalize">{device.type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{device.count}</span>
                  <span className="font-medium">{formatPercentage(device.percentage)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold">Geographic Distribution</h3>
          </div>
          <div className="space-y-3">
            {metrics.geographic_data.map((geo) => (
              <div key={geo.country} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-600"></div>
                  <span>{geo.country}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{geo.sessions}</span>
                  <span className="font-medium">{formatPercentage(geo.percentage)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Time on Site Distribution */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-orange-600" />
          <h3 className="text-lg font-semibold">Time on Site Distribution</h3>
        </div>
        <div className="space-y-3">
          {metrics.time_on_site_distribution.map((timeRange) => (
            <div key={timeRange.range} className="flex items-center gap-4">
              <div className="w-20 text-sm font-medium">{timeRange.range}</div>
              <div className="flex-1">
                <Progress 
                  value={(timeRange.count / metrics.total_sessions) * 100} 
                  className="h-2"
                />
              </div>
              <div className="text-sm text-gray-600">{timeRange.count} sessions</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Last Updated */}
      <div className="text-center text-sm text-gray-500">
        Last updated: {lastUpdate.toLocaleString()}
      </div>
    </div>
  );
}