'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  TrendingUp,
  TrendingDown,
  Target,
  Eye,
  MousePointer,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Info,
  Lightbulb,
  ExternalLink
} from 'lucide-react';

interface SEOInsightsProps {
  timeRange: string;
}

interface KeywordInsight {
  keyword: string;
  position: number;
  previousPosition: number;
  searchVolume: number;
  clicks: number;
  impressions: number;
  ctr: number;
  difficulty: number;
  opportunity: 'high' | 'medium' | 'low';
  trend: 'up' | 'down' | 'stable';
}

interface SEOIssue {
  id: string;
  type: 'critical' | 'warning' | 'info';
  category: 'technical' | 'content' | 'performance' | 'mobile';
  title: string;
  description: string;
  impact: string;
  pages: number;
  recommendation: string;
}

interface CompetitorInsight {
  competitor: string;
  domain: string;
  organicKeywords: number;
  estimatedTraffic: number;
  commonKeywords: number;
  avgPosition: number;
  gapOpportunities: number;
}

export function SEOInsights({ timeRange }: SEOInsightsProps) {
  const [activeInsight, setActiveInsight] = useState('keywords');

  const keywordInsights: KeywordInsight[] = [
    {
      keyword: 'content marketing',
      position: 3,
      previousPosition: 8,
      searchVolume: 12000,
      clicks: 1250,
      impressions: 45000,
      ctr: 2.8,
      difficulty: 65,
      opportunity: 'high',
      trend: 'up'
    },
    {
      keyword: 'seo optimization',
      position: 5,
      previousPosition: 12,
      searchVolume: 8900,
      clicks: 890,
      impressions: 38000,
      ctr: 2.3,
      difficulty: 72,
      opportunity: 'high',
      trend: 'up'
    },
    {
      keyword: 'digital marketing strategy',
      position: 7,
      previousPosition: 15,
      searchVolume: 6700,
      clicks: 670,
      impressions: 28000,
      ctr: 2.4,
      difficulty: 58,
      opportunity: 'medium',
      trend: 'up'
    },
    {
      keyword: 'marketing automation',
      position: 12,
      previousPosition: 18,
      searchVolume: 5400,
      clicks: 320,
      impressions: 22000,
      ctr: 1.5,
      difficulty: 68,
      opportunity: 'medium',
      trend: 'up'
    },
    {
      keyword: 'social media marketing',
      position: 15,
      previousPosition: 22,
      searchVolume: 9200,
      clicks: 280,
      impressions: 35000,
      ctr: 0.8,
      difficulty: 55,
      opportunity: 'low',
      trend: 'up'
    }
  ];

  const seoIssues: SEOIssue[] = [
    {
      id: '1',
      type: 'critical',
      category: 'technical',
      title: 'Missing Meta Descriptions',
      description: 'Several pages are missing meta descriptions',
      impact: 'Reduced click-through rates from search results',
      pages: 23,
      recommendation: 'Add unique, compelling meta descriptions to all pages'
    },
    {
      id: '2',
      type: 'warning',
      category: 'performance',
      title: 'Slow Page Load Speed',
      description: 'Multiple pages have load times over 3 seconds',
      impact: 'Poor user experience and lower search rankings',
      pages: 15,
      recommendation: 'Optimize images and enable compression'
    },
    {
      id: '3',
      type: 'warning',
      category: 'content',
      title: 'Thin Content Pages',
      description: 'Pages with less than 300 words of content',
      impact: 'Limited ranking potential for competitive keywords',
      pages: 8,
      recommendation: 'Expand content with valuable information'
    },
    {
      id: '4',
      type: 'info',
      category: 'mobile',
      title: 'Mobile Usability Issues',
      description: 'Some elements are too small for mobile users',
      impact: 'Reduced mobile user experience',
      pages: 5,
      recommendation: 'Ensure touch targets are at least 44px'
    }
  ];

  const competitorInsights: CompetitorInsight[] = [
    {
      competitor: 'Competitor A',
      domain: 'competitor-a.com',
      organicKeywords: 3240,
      estimatedTraffic: 125000,
      commonKeywords: 89,
      avgPosition: 4.2,
      gapOpportunities: 156
    },
    {
      competitor: 'Competitor B',
      domain: 'competitor-b.com',
      organicKeywords: 2180,
      estimatedTraffic: 89000,
      commonKeywords: 67,
      avgPosition: 6.8,
      gapOpportunities: 123
    },
    {
      competitor: 'Competitor C',
      domain: 'competitor-c.com',
      organicKeywords: 1890,
      estimatedTraffic: 67000,
      commonKeywords: 45,
      avgPosition: 8.1,
      gapOpportunities: 98
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

  const getOpportunityColor = (opportunity: 'high' | 'medium' | 'low') => {
    switch (opportunity) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
    }
  };

  const getIssueIcon = (type: 'critical' | 'warning' | 'info') => {
    switch (type) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info': return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getIssueColor = (type: 'critical' | 'warning' | 'info') => {
    switch (type) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'down': return <TrendingDown className="h-3 w-3 text-red-500" />;
      case 'stable': return <div className="h-3 w-3 bg-gray-400 rounded-full" />;
    }
  };

  const totalKeywords = keywordInsights.length;
  const improvingKeywords = keywordInsights.filter(k => k.trend === 'up').length;
  const avgPosition = keywordInsights.reduce((sum, k) => sum + k.position, 0) / totalKeywords;
  const totalClicks = keywordInsights.reduce((sum, k) => sum + k.clicks, 0);

  return (
    <div className="space-y-6">
      {/* SEO Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tracked Keywords</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalKeywords}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-green-600">{improvingKeywords} improving</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Position</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgPosition.toFixed(1)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-green-600">+2.3 positions</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalClicks)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-green-600">+18.2%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SEO Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{seoIssues.length}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <span>{seoIssues.filter(i => i.type === 'critical').length} critical</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insight Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        <Button
          variant={activeInsight === 'keywords' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveInsight('keywords')}
        >
          <Search className="h-4 w-4 mr-2" />
          Keywords
        </Button>
        <Button
          variant={activeInsight === 'issues' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveInsight('issues')}
        >
          <AlertTriangle className="h-4 w-4 mr-2" />
          Issues
        </Button>
        <Button
          variant={activeInsight === 'competitors' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveInsight('competitors')}
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          Competitors
        </Button>
        <Button
          variant={activeInsight === 'opportunities' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveInsight('opportunities')}
        >
          <Lightbulb className="h-4 w-4 mr-2" />
          Opportunities
        </Button>
      </div>

      {/* Keywords Insight */}
      {activeInsight === 'keywords' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="h-5 w-5 mr-2" />
              Keyword Performance ({keywordInsights.length} keywords)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {keywordInsights.map((keyword, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-medium">{keyword.keyword}</h4>
                      <Badge variant="outline">
                        Position #{keyword.position}
                      </Badge>
                      <Badge className={getOpportunityColor(keyword.opportunity)}>
                        {keyword.opportunity} opportunity
                      </Badge>
                      {getTrendIcon(keyword.trend)}
                    </div>
                    
                    <div className="grid grid-cols-5 gap-4 text-sm text-muted-foreground">
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
                      <div>
                        <span>Difficulty: </span>
                        <span className="font-medium">{keyword.difficulty}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">
                      Previous: #{keyword.previousPosition}
                    </div>
                    <div className="text-sm font-medium text-green-600">
                      +{keyword.previousPosition - keyword.position} positions
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* SEO Issues */}
      {activeInsight === 'issues' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              SEO Issues ({seoIssues.length} issues found)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {seoIssues.map((issue) => (
                <div key={issue.id} className={`p-4 border rounded-lg ${getIssueColor(issue.type)}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {getIssueIcon(issue.type)}
                      <h4 className="font-medium">{issue.title}</h4>
                      <Badge variant="outline">
                        {issue.pages} pages affected
                      </Badge>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {issue.category}
                    </Badge>
                  </div>
                  
                  <p className="text-sm mb-2">{issue.description}</p>
                  
                  <div className="space-y-2">
                    <div>
                      <div className="text-xs font-medium text-muted-foreground">Impact</div>
                      <div className="text-sm">{issue.impact}</div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-muted-foreground">Recommendation</div>
                      <div className="text-sm font-medium">{issue.recommendation}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Competitor Analysis */}
      {activeInsight === 'competitors' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Competitor Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {competitorInsights.map((competitor, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-medium">{competitor.competitor}</h4>
                      <Badge variant="outline">{competitor.domain}</Badge>
                    </div>
                    
                    <div className="grid grid-cols-5 gap-4 text-sm text-muted-foreground">
                      <div>
                        <span>Keywords: </span>
                        <span className="font-medium">{formatNumber(competitor.organicKeywords)}</span>
                      </div>
                      <div>
                        <span>Traffic: </span>
                        <span className="font-medium">{formatNumber(competitor.estimatedTraffic)}</span>
                      </div>
                      <div>
                        <span>Common: </span>
                        <span className="font-medium">{competitor.commonKeywords}</span>
                      </div>
                      <div>
                        <span>Avg Pos: </span>
                        <span className="font-medium">{competitor.avgPosition.toFixed(1)}</span>
                      </div>
                      <div>
                        <span>Gaps: </span>
                        <span className="font-medium text-green-600">{competitor.gapOpportunities}</span>
                      </div>
                    </div>
                  </div>
                  
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Analyze
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Opportunities */}
      {activeInsight === 'opportunities' && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lightbulb className="h-5 w-5 mr-2" />
                Quick Wins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="font-medium text-sm text-green-800 mb-1">
                    Optimize for "content marketing strategy"
                  </div>
                  <div className="text-sm text-green-700">
                    Currently ranking #7, high search volume (6.7K), medium difficulty
                  </div>
                </div>
                
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="font-medium text-sm text-blue-800 mb-1">
                    Fix missing meta descriptions
                  </div>
                  <div className="text-sm text-blue-700">
                    23 pages missing meta descriptions - easy fix with high impact
                  </div>
                </div>
                
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="font-medium text-sm text-yellow-800 mb-1">
                    Improve page load speed
                  </div>
                  <div className="text-sm text-yellow-700">
                    15 pages loading slowly - optimize images and enable compression
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Long-term Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-md">
                  <div className="font-medium text-sm text-purple-800 mb-1">
                    Target competitor keywords
                  </div>
                  <div className="text-sm text-purple-700">
                    156 keyword gaps identified from competitor analysis
                  </div>
                </div>
                
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-md">
                  <div className="font-medium text-sm text-indigo-800 mb-1">
                    Expand thin content pages
                  </div>
                  <div className="text-sm text-indigo-700">
                    8 pages with &lt;300 words - opportunity for comprehensive content
                  </div>
                </div>
                
                <div className="p-3 bg-pink-50 border border-pink-200 rounded-md">
                  <div className="font-medium text-sm text-pink-800 mb-1">
                    Build topical authority
                  </div>
                  <div className="text-sm text-pink-700">
                    Create content clusters around your top-performing keywords
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
