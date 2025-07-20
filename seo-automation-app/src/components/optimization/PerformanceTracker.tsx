'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  Eye,
  Users,
  Clock,
  Target,
  Search,
  Globe,
  MousePointer,
  Calendar,
  Filter
} from 'lucide-react';

interface PerformanceMetric {
  id: string;
  name: string;
  current: number;
  previous: number;
  change: number;
  changeType: 'increase' | 'decrease';
  unit: string;
  icon: React.ReactNode;
  color: string;
}

interface KeywordPerformance {
  keyword: string;
  position: number;
  previousPosition: number;
  searchVolume: number;
  clicks: number;
  impressions: number;
  ctr: number;
  change: number;
}

interface PagePerformance {
  url: string;
  title: string;
  clicks: number;
  impressions: number;
  ctr: number;
  avgPosition: number;
  change: number;
}

export function PerformanceTracker() {
  const [timeRange, setTimeRange] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');

  const metrics: PerformanceMetric[] = [
    {
      id: '1',
      name: 'Organic Traffic',
      current: 45230,
      previous: 38940,
      change: 16.1,
      changeType: 'increase',
      unit: 'visits',
      icon: <Users className="h-4 w-4" />,
      color: 'text-blue-600'
    },
    {
      id: '2',
      name: 'Average Position',
      current: 8.2,
      previous: 12.4,
      change: -33.9,
      changeType: 'increase', // Lower position is better
      unit: '',
      icon: <Target className="h-4 w-4" />,
      color: 'text-green-600'
    },
    {
      id: '3',
      name: 'Click-Through Rate',
      current: 3.8,
      previous: 2.9,
      change: 31.0,
      changeType: 'increase',
      unit: '%',
      icon: <MousePointer className="h-4 w-4" />,
      color: 'text-purple-600'
    },
    {
      id: '4',
      name: 'Total Impressions',
      current: 1250000,
      previous: 980000,
      change: 27.6,
      changeType: 'increase',
      unit: '',
      icon: <Eye className="h-4 w-4" />,
      color: 'text-orange-600'
    },
    {
      id: '5',
      name: 'Indexed Pages',
      current: 1847,
      previous: 1623,
      change: 13.8,
      changeType: 'increase',
      unit: 'pages',
      icon: <Globe className="h-4 w-4" />,
      color: 'text-indigo-600'
    },
    {
      id: '6',
      name: 'Page Load Speed',
      current: 1.8,
      previous: 2.4,
      change: -25.0,
      changeType: 'increase', // Lower load time is better
      unit: 's',
      icon: <Clock className="h-4 w-4" />,
      color: 'text-teal-600'
    }
  ];

  const keywordPerformance: KeywordPerformance[] = [
    {
      keyword: 'content marketing',
      position: 3,
      previousPosition: 8,
      searchVolume: 12000,
      clicks: 1250,
      impressions: 45000,
      ctr: 2.8,
      change: 5
    },
    {
      keyword: 'seo optimization',
      position: 5,
      previousPosition: 12,
      searchVolume: 8900,
      clicks: 890,
      impressions: 38000,
      ctr: 2.3,
      change: 7
    },
    {
      keyword: 'digital marketing strategy',
      position: 7,
      previousPosition: 15,
      searchVolume: 6700,
      clicks: 670,
      impressions: 28000,
      ctr: 2.4,
      change: 8
    },
    {
      keyword: 'marketing automation',
      position: 12,
      previousPosition: 18,
      searchVolume: 5400,
      clicks: 320,
      impressions: 22000,
      ctr: 1.5,
      change: 6
    },
    {
      keyword: 'social media marketing',
      position: 15,
      previousPosition: 22,
      searchVolume: 9200,
      clicks: 280,
      impressions: 35000,
      ctr: 0.8,
      change: 7
    }
  ];

  const pagePerformance: PagePerformance[] = [
    {
      url: '/blog/content-marketing-guide',
      title: 'Complete Content Marketing Guide',
      clicks: 2340,
      impressions: 89000,
      ctr: 2.6,
      avgPosition: 4.2,
      change: 23.5
    },
    {
      url: '/blog/seo-best-practices',
      title: 'SEO Best Practices for 2025',
      clicks: 1890,
      impressions: 67000,
      ctr: 2.8,
      avgPosition: 3.8,
      change: 18.2
    },
    {
      url: '/services/digital-marketing',
      title: 'Digital Marketing Services',
      clicks: 1560,
      impressions: 45000,
      ctr: 3.5,
      avgPosition: 5.1,
      change: -5.3
    },
    {
      url: '/blog/marketing-automation-tools',
      title: 'Top Marketing Automation Tools',
      clicks: 1230,
      impressions: 38000,
      ctr: 3.2,
      avgPosition: 6.7,
      change: 31.2
    },
    {
      url: '/blog/social-media-strategy',
      title: 'Social Media Strategy Guide',
      clicks: 980,
      impressions: 42000,
      ctr: 2.3,
      avgPosition: 8.9,
      change: 12.8
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

  const getChangeIcon = (changeType: 'increase' | 'decrease', change: number) => {
    if (changeType === 'increase') {
      return <TrendingUp className="h-3 w-3 text-green-500" />;
    } else {
      return <TrendingDown className="h-3 w-3 text-red-500" />;
    }
  };

  const getChangeColor = (changeType: 'increase' | 'decrease') => {
    return changeType === 'increase' ? 'text-green-600' : 'text-red-600';
  };

  const getPositionChange = (current: number, previous: number) => {
    const change = previous - current; // Positive means improvement (lower position number)
    return {
      value: Math.abs(change),
      type: change > 0 ? 'increase' : 'decrease'
    };
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Tracking</h2>
          <p className="text-muted-foreground">
            Monitor your SEO performance and track improvements over time
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
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="keywords">
            <Search className="h-4 w-4 mr-2" />
            Keywords
          </TabsTrigger>
          <TabsTrigger value="pages">
            <Globe className="h-4 w-4 mr-2" />
            Pages
          </TabsTrigger>
          <TabsTrigger value="trends">
            <TrendingUp className="h-4 w-4 mr-2" />
            Trends
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {metrics.map((metric) => (
              <Card key={metric.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
                  <div className={metric.color}>
                    {metric.icon}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {metric.name === 'Average Position' ? metric.current.toFixed(1) : formatNumber(metric.current)}
                    {metric.unit && metric.name !== 'Average Position' && (
                      <span className="text-sm font-normal text-muted-foreground ml-1">
                        {metric.unit}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    {getChangeIcon(metric.changeType, metric.change)}
                    <span className={`ml-1 ${getChangeColor(metric.changeType)}`}>
                      {Math.abs(metric.change).toFixed(1)}%
                    </span>
                    <span className="ml-1">vs previous period</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Performance Summary */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Keywords</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {keywordPerformance.slice(0, 5).map((keyword, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{keyword.keyword}</div>
                        <div className="text-xs text-muted-foreground">
                          Position #{keyword.position} • {formatNumber(keyword.clicks)} clicks
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          +{keyword.change}
                        </Badge>
                        <TrendingUp className="h-3 w-3 text-green-500" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Performing Pages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pagePerformance.slice(0, 5).map((page, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-sm truncate">{page.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatNumber(page.clicks)} clicks • {page.ctr.toFixed(1)}% CTR
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${page.change > 0 ? 'text-green-600' : 'text-red-600'}`}
                        >
                          {page.change > 0 ? '+' : ''}{page.change.toFixed(1)}%
                        </Badge>
                        {page.change > 0 ? (
                          <TrendingUp className="h-3 w-3 text-green-500" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="keywords" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Keyword Performance ({keywordPerformance.length} keywords)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {keywordPerformance.map((keyword, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium">{keyword.keyword}</h4>
                        <Badge variant="outline">
                          Position #{keyword.position}
                        </Badge>
                        {keyword.change > 0 && (
                          <Badge className="bg-green-100 text-green-800">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            +{keyword.change}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-4 gap-4 text-sm text-muted-foreground">
                        <div>
                          <span>Volume: </span>
                          <span className="font-medium">{formatNumber(keyword.searchVolume)}</span>
                        </div>
                        <div>
                          <span>Clicks: </span>
                          <span className="font-medium">{formatNumber(keyword.clicks)}</span>
                        </div>
                        <div>
                          <span>Impressions: </span>
                          <span className="font-medium">{formatNumber(keyword.impressions)}</span>
                        </div>
                        <div>
                          <span>CTR: </span>
                          <span className="font-medium">{keyword.ctr.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Previous: #{keyword.previousPosition}</div>
                      <div className="flex items-center justify-end mt-1">
                        {getPositionChange(keyword.position, keyword.previousPosition).type === 'increase' ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pages" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Page Performance ({pagePerformance.length} pages)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pagePerformance.map((page, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium">{page.title}</h4>
                        <Badge 
                          variant="outline"
                          className={page.change > 0 ? 'text-green-600' : 'text-red-600'}
                        >
                          {page.change > 0 ? '+' : ''}{page.change.toFixed(1)}%
                        </Badge>
                      </div>
                      
                      <div className="text-xs text-muted-foreground mb-2">{page.url}</div>
                      
                      <div className="grid grid-cols-4 gap-4 text-sm text-muted-foreground">
                        <div>
                          <span>Clicks: </span>
                          <span className="font-medium">{formatNumber(page.clicks)}</span>
                        </div>
                        <div>
                          <span>Impressions: </span>
                          <span className="font-medium">{formatNumber(page.impressions)}</span>
                        </div>
                        <div>
                          <span>CTR: </span>
                          <span className="font-medium">{page.ctr.toFixed(1)}%</span>
                        </div>
                        <div>
                          <span>Avg Position: </span>
                          <span className="font-medium">{page.avgPosition.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      {page.change > 0 ? (
                        <TrendingUp className="h-5 w-5 text-green-500" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Trend Charts Coming Soon</h3>
                <p className="text-muted-foreground">
                  Interactive charts and trend analysis will be available here.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
