'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  TrendingUp,
  TrendingDown,
  Eye,
  Users,
  Clock,
  MousePointer,
  Share,
  Heart,
  MessageCircle,
  Search,
  Filter,
  ExternalLink
} from 'lucide-react';

interface ContentPerformanceProps {
  timeRange: string;
}

interface ContentItem {
  id: string;
  title: string;
  url: string;
  type: 'blog' | 'page' | 'guide' | 'case-study';
  publishDate: string;
  views: number;
  uniqueVisitors: number;
  avgTimeOnPage: number;
  bounceRate: number;
  socialShares: number;
  comments: number;
  conversions: number;
  conversionRate: number;
  change: number;
  changeType: 'increase' | 'decrease';
  status: 'published' | 'draft' | 'archived';
}

export function ContentPerformance({ timeRange }: ContentPerformanceProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('views');
  const [filterType, setFilterType] = useState('all');

  const contentItems: ContentItem[] = [
    {
      id: '1',
      title: 'Complete SEO Guide for 2025',
      url: '/blog/seo-guide-2025',
      type: 'guide',
      publishDate: '2025-01-15',
      views: 12450,
      uniqueVisitors: 8920,
      avgTimeOnPage: 4.2,
      bounceRate: 28.5,
      socialShares: 234,
      comments: 45,
      conversions: 89,
      conversionRate: 1.0,
      change: 23.5,
      changeType: 'increase',
      status: 'published'
    },
    {
      id: '2',
      title: 'Content Marketing Strategy That Works',
      url: '/blog/content-marketing-strategy',
      type: 'blog',
      publishDate: '2025-01-12',
      views: 9870,
      uniqueVisitors: 7230,
      avgTimeOnPage: 3.8,
      bounceRate: 32.1,
      socialShares: 189,
      comments: 32,
      conversions: 67,
      conversionRate: 0.9,
      change: 18.2,
      changeType: 'increase',
      status: 'published'
    },
    {
      id: '3',
      title: 'Digital Marketing Trends 2025',
      url: '/blog/digital-marketing-trends',
      type: 'blog',
      publishDate: '2025-01-10',
      views: 8640,
      uniqueVisitors: 6450,
      avgTimeOnPage: 3.1,
      bounceRate: 35.7,
      socialShares: 156,
      comments: 28,
      conversions: 52,
      conversionRate: 0.8,
      change: 31.7,
      changeType: 'increase',
      status: 'published'
    },
    {
      id: '4',
      title: 'E-commerce SEO Case Study',
      url: '/case-studies/ecommerce-seo',
      type: 'case-study',
      publishDate: '2025-01-08',
      views: 7230,
      uniqueVisitors: 5890,
      avgTimeOnPage: 5.6,
      bounceRate: 22.3,
      socialShares: 98,
      comments: 19,
      conversions: 124,
      conversionRate: 2.1,
      change: 12.4,
      changeType: 'increase',
      status: 'published'
    },
    {
      id: '5',
      title: 'Social Media Marketing Best Practices',
      url: '/blog/social-media-best-practices',
      type: 'blog',
      publishDate: '2025-01-05',
      views: 6890,
      uniqueVisitors: 5120,
      avgTimeOnPage: 2.9,
      bounceRate: 38.9,
      socialShares: 267,
      comments: 41,
      conversions: 34,
      conversionRate: 0.7,
      change: 8.9,
      changeType: 'increase',
      status: 'published'
    },
    {
      id: '6',
      title: 'Email Marketing Automation Guide',
      url: '/blog/email-marketing-automation',
      type: 'guide',
      publishDate: '2025-01-03',
      views: 5670,
      uniqueVisitors: 4230,
      avgTimeOnPage: 4.8,
      bounceRate: 25.6,
      socialShares: 123,
      comments: 22,
      conversions: 78,
      conversionRate: 1.8,
      change: -5.3,
      changeType: 'decrease',
      status: 'published'
    }
  ];

  const filteredContent = contentItems
    .filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || item.type === filterType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'views': return b.views - a.views;
        case 'conversions': return b.conversions - a.conversions;
        case 'engagement': return (b.avgTimeOnPage * (100 - b.bounceRate)) - (a.avgTimeOnPage * (100 - a.bounceRate));
        case 'date': return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
        default: return 0;
      }
    });

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'blog': return 'bg-blue-100 text-blue-800';
      case 'guide': return 'bg-green-100 text-green-800';
      case 'case-study': return 'bg-purple-100 text-purple-800';
      case 'page': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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

  const topPerformers = contentItems.slice(0, 3);
  const totalViews = contentItems.reduce((sum, item) => sum + item.views, 0);
  const totalConversions = contentItems.reduce((sum, item) => sum + item.conversions, 0);
  const avgEngagement = contentItems.reduce((sum, item) => sum + (item.avgTimeOnPage * (100 - item.bounceRate)), 0) / contentItems.length;

  return (
    <div className="space-y-6">
      {/* Content Performance Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Content Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalViews)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-green-600">+18.2%</span>
              <span className="ml-1">vs previous period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversions</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalConversions}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-green-600">+24.5%</span>
              <span className="ml-1">vs previous period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Engagement</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgEngagement.toFixed(1)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-green-600">+12.8%</span>
              <span className="ml-1">engagement score</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published Content</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contentItems.length}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <span>pieces of content</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Top Performing Content
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topPerformers.map((item, index) => (
              <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="text-2xl font-bold text-muted-foreground">
                    #{index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium">{item.title}</h4>
                      <Badge className={getTypeColor(item.type)}>
                        {item.type}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatNumber(item.views)} views • {item.conversions} conversions • {item.avgTimeOnPage.toFixed(1)}m avg time
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className={getChangeColor(item.changeType)}>
                    {getChangeIcon(item.changeType)}
                    <span className="ml-1">{Math.abs(item.change).toFixed(1)}%</span>
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Content Library */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Content Library ({filteredContent.length} items)
            </span>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
              >
                <option value="all">All Types</option>
                <option value="blog">Blog Posts</option>
                <option value="guide">Guides</option>
                <option value="case-study">Case Studies</option>
                <option value="page">Pages</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
              >
                <option value="views">Sort by Views</option>
                <option value="conversions">Sort by Conversions</option>
                <option value="engagement">Sort by Engagement</option>
                <option value="date">Sort by Date</option>
              </select>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredContent.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-medium">{item.title}</h4>
                    <Badge className={getTypeColor(item.type)}>
                      {item.type}
                    </Badge>
                    <Badge variant="outline" className={getChangeColor(item.changeType)}>
                      {getChangeIcon(item.changeType)}
                      <span className="ml-1">{Math.abs(item.change).toFixed(1)}%</span>
                    </Badge>
                  </div>
                  
                  <div className="text-xs text-muted-foreground mb-2">
                    {item.url} • Published {new Date(item.publishDate).toLocaleDateString()}
                  </div>
                  
                  <div className="grid grid-cols-6 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Views</div>
                      <div className="font-medium">{formatNumber(item.views)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Visitors</div>
                      <div className="font-medium">{formatNumber(item.uniqueVisitors)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Avg Time</div>
                      <div className="font-medium">{item.avgTimeOnPage.toFixed(1)}m</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Bounce Rate</div>
                      <div className="font-medium">{item.bounceRate.toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Conversions</div>
                      <div className="font-medium">{item.conversions}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Conv Rate</div>
                      <div className="font-medium">{item.conversionRate.toFixed(1)}%</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                    <Share className="h-3 w-3" />
                    <span>{item.socialShares}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                    <MessageCircle className="h-3 w-3" />
                    <span>{item.comments}</span>
                  </div>
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
