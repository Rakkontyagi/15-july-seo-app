'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  TrendingUp,
  TrendingDown,
  Eye,
  Users,
  Target,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Globe,
  Clock,
  MessageSquare,
  ThumbsUp,
  Share2,
  Bookmark
} from 'lucide-react';

interface ContentInsight {
  id: string;
  type: 'opportunity' | 'warning' | 'success' | 'trend';
  category: 'seo' | 'engagement' | 'readability' | 'performance' | 'audience';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  actionable: boolean;
  metrics?: {
    current: number;
    potential: number;
    improvement: number;
  };
}

interface ContentMetrics {
  readabilityScore: number;
  seoScore: number;
  engagementScore: number;
  sentimentScore: number;
  uniquenessScore: number;
  expertiseScore: number;
  trustworthinessScore: number;
  authorityScore: number;
}

interface AudienceInsight {
  segment: string;
  percentage: number;
  engagement: number;
  preferences: string[];
  recommendations: string[];
}

export function ContentInsightsDashboard({ content }: { content: string }) {
  const [insights, setInsights] = useState<ContentInsight[]>([]);
  const [metrics, setMetrics] = useState<ContentMetrics | null>(null);
  const [audienceInsights, setAudienceInsights] = useState<AudienceInsight[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (content.trim()) {
      analyzeContent();
    }
  }, [content]);

  const analyzeContent = async () => {
    setIsAnalyzing(true);

    try {
      // Simulate AI analysis
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockMetrics: ContentMetrics = {
        readabilityScore: 78,
        seoScore: 85,
        engagementScore: 72,
        sentimentScore: 82,
        uniquenessScore: 91,
        expertiseScore: 76,
        trustworthinessScore: 88,
        authorityScore: 74
      };

      const mockInsights: ContentInsight[] = [
        {
          id: '1',
          type: 'opportunity',
          category: 'seo',
          title: 'Keyword Density Optimization',
          description: 'Your primary keyword appears only 0.8% of the time. Increasing to 1.5-2% could improve rankings.',
          impact: 'high',
          confidence: 89,
          actionable: true,
          metrics: {
            current: 0.8,
            potential: 1.8,
            improvement: 125
          }
        },
        {
          id: '2',
          type: 'success',
          category: 'readability',
          title: 'Excellent Readability Score',
          description: 'Your content has a Flesch Reading Ease score of 78, making it accessible to a wide audience.',
          impact: 'medium',
          confidence: 95,
          actionable: false
        },
        {
          id: '3',
          type: 'warning',
          category: 'engagement',
          title: 'Low Emotional Appeal',
          description: 'Content lacks emotional triggers that drive engagement. Consider adding personal stories or examples.',
          impact: 'medium',
          confidence: 82,
          actionable: true,
          metrics: {
            current: 32,
            potential: 68,
            improvement: 112
          }
        },
        {
          id: '4',
          type: 'opportunity',
          category: 'performance',
          title: 'Add Interactive Elements',
          description: 'Including polls, quizzes, or interactive content could increase time on page by 40%.',
          impact: 'high',
          confidence: 76,
          actionable: true,
          metrics: {
            current: 180,
            potential: 252,
            improvement: 40
          }
        },
        {
          id: '5',
          type: 'trend',
          category: 'audience',
          title: 'Growing Interest in Topic',
          description: 'Search volume for your topic has increased 23% in the last 30 days.',
          impact: 'medium',
          confidence: 91,
          actionable: false
        }
      ];

      const mockAudienceInsights: AudienceInsight[] = [
        {
          segment: 'Marketing Professionals',
          percentage: 45,
          engagement: 87,
          preferences: ['Data-driven insights', 'Case studies', 'Actionable tips'],
          recommendations: ['Add more statistics', 'Include real examples', 'Provide step-by-step guides']
        },
        {
          segment: 'Business Owners',
          percentage: 32,
          engagement: 74,
          preferences: ['ROI focus', 'Quick wins', 'Strategic insights'],
          recommendations: ['Highlight business impact', 'Add cost-benefit analysis', 'Include success metrics']
        },
        {
          segment: 'Students/Learners',
          percentage: 23,
          engagement: 69,
          preferences: ['Educational content', 'Explanations', 'Resources'],
          recommendations: ['Add definitions', 'Include learning resources', 'Provide examples']
        }
      ];

      setMetrics(mockMetrics);
      setInsights(mockInsights);
      setAudienceInsights(mockAudienceInsights);
    } catch (error) {
      console.error('Content analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getInsightIcon = (type: ContentInsight['type']) => {
    switch (type) {
      case 'opportunity': return <Lightbulb className="h-4 w-4 text-yellow-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'trend': return <TrendingUp className="h-4 w-4 text-blue-500" />;
    }
  };

  const getInsightColor = (type: ContentInsight['type']) => {
    switch (type) {
      case 'opportunity': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'warning': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'success': return 'bg-green-100 text-green-800 border-green-200';
      case 'trend': return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'seo': return <Target className="h-4 w-4" />;
      case 'engagement': return <Users className="h-4 w-4" />;
      case 'readability': return <Eye className="h-4 w-4" />;
      case 'performance': return <BarChart3 className="h-4 w-4" />;
      case 'audience': return <Globe className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  if (!content.trim()) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">AI Content Insights</h3>
            <p className="text-muted-foreground">
              Add content to get AI-powered insights and recommendations
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Brain className="h-5 w-5 mr-2" />
              AI Content Insights
            </span>
            {isAnalyzing && (
              <Badge variant="outline">
                <Activity className="h-3 w-3 mr-1 animate-pulse" />
                Analyzing...
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">
                <BarChart3 className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="insights">
                <Lightbulb className="h-4 w-4 mr-2" />
                Insights
              </TabsTrigger>
              <TabsTrigger value="audience">
                <Users className="h-4 w-4 mr-2" />
                Audience
              </TabsTrigger>
              <TabsTrigger value="performance">
                <TrendingUp className="h-4 w-4 mr-2" />
                Performance
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {metrics && (
                <>
                  {/* Core Metrics */}
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">SEO Score</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className={`text-2xl font-bold ${getScoreColor(metrics.seoScore)}`}>
                          {metrics.seoScore}%
                        </div>
                        <Progress value={metrics.seoScore} className="mt-2" />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Readability</CardTitle>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className={`text-2xl font-bold ${getScoreColor(metrics.readabilityScore)}`}>
                          {metrics.readabilityScore}%
                        </div>
                        <Progress value={metrics.readabilityScore} className="mt-2" />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Engagement</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className={`text-2xl font-bold ${getScoreColor(metrics.engagementScore)}`}>
                          {metrics.engagementScore}%
                        </div>
                        <Progress value={metrics.engagementScore} className="mt-2" />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Uniqueness</CardTitle>
                        <Zap className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className={`text-2xl font-bold ${getScoreColor(metrics.uniquenessScore)}`}>
                          {metrics.uniquenessScore}%
                        </div>
                        <Progress value={metrics.uniquenessScore} className="mt-2" />
                      </CardContent>
                    </Card>
                  </div>

                  {/* E-E-A-T Scores */}
                  <Card>
                    <CardHeader>
                      <CardTitle>E-E-A-T Assessment</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Expertise</span>
                            <span className={getScoreColor(metrics.expertiseScore)}>
                              {metrics.expertiseScore}%
                            </span>
                          </div>
                          <Progress value={metrics.expertiseScore} className="h-2" />
                        </div>
                        
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Trustworthiness</span>
                            <span className={getScoreColor(metrics.trustworthinessScore)}>
                              {metrics.trustworthinessScore}%
                            </span>
                          </div>
                          <Progress value={metrics.trustworthinessScore} className="h-2" />
                        </div>
                        
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Authority</span>
                            <span className={getScoreColor(metrics.authorityScore)}>
                              {metrics.authorityScore}%
                            </span>
                          </div>
                          <Progress value={metrics.authorityScore} className="h-2" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Stats */}
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {Math.round(content.length / 5)}
                      </div>
                      <div className="text-sm text-muted-foreground">Estimated Words</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">3.2</div>
                      <div className="text-sm text-muted-foreground">Reading Time (min)</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {metrics.sentimentScore}%
                      </div>
                      <div className="text-sm text-muted-foreground">Positive Sentiment</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">12</div>
                      <div className="text-sm text-muted-foreground">Key Topics</div>
                    </div>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="insights" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">AI-Generated Insights ({insights.length})</h3>
                <Button variant="outline" size="sm" onClick={analyzeContent}>
                  <Brain className="h-4 w-4 mr-2" />
                  Refresh Analysis
                </Button>
              </div>

              <div className="space-y-3">
                {insights.map((insight) => (
                  <div
                    key={insight.id}
                    className={`p-4 border rounded-lg ${getInsightColor(insight.type)}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getInsightIcon(insight.type)}
                        <h4 className="font-medium">{insight.title}</h4>
                        <Badge variant="outline" className="capitalize">
                          {insight.category}
                        </Badge>
                      </div>
                      <div className="text-sm font-medium">
                        {insight.confidence}% confidence
                      </div>
                    </div>

                    <p className="text-sm mb-3">{insight.description}</p>

                    {insight.metrics && (
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Current</div>
                          <div className="font-medium">{insight.metrics.current}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Potential</div>
                          <div className="font-medium">{insight.metrics.potential}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Improvement</div>
                          <div className="font-medium text-green-600">
                            +{insight.metrics.improvement}%
                          </div>
                        </div>
                      </div>
                    )}

                    {insight.actionable && (
                      <div className="mt-3">
                        <Button size="sm" variant="outline">
                          <Zap className="h-3 w-3 mr-1" />
                          Apply Suggestion
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="audience" className="space-y-4">
              <h3 className="font-medium">Audience Analysis</h3>
              
              <div className="space-y-4">
                {audienceInsights.map((audience, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{audience.segment}</CardTitle>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{audience.percentage}% of audience</Badge>
                          <Badge className={getScoreColor(audience.engagement) === 'text-green-600' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                            {audience.engagement}% engaged
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <h5 className="font-medium text-sm mb-2">Preferences</h5>
                          <div className="space-y-1">
                            {audience.preferences.map((pref, i) => (
                              <div key={i} className="flex items-center space-x-2 text-sm">
                                <ThumbsUp className="h-3 w-3 text-green-500" />
                                <span>{pref}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h5 className="font-medium text-sm mb-2">Recommendations</h5>
                          <div className="space-y-1">
                            {audience.recommendations.map((rec, i) => (
                              <div key={i} className="flex items-center space-x-2 text-sm">
                                <Lightbulb className="h-3 w-3 text-yellow-500" />
                                <span>{rec}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-4">
              <h3 className="font-medium">Performance Predictions</h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Engagement Forecast</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Expected Views</span>
                        <span className="font-medium">2,400 - 3,200</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Avg. Time on Page</span>
                        <span className="font-medium">3:45</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Social Shares</span>
                        <span className="font-medium">45 - 78</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Comments</span>
                        <span className="font-medium">12 - 25</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">SEO Potential</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Ranking Potential</span>
                        <span className="font-medium text-green-600">High</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Competition Level</span>
                        <span className="font-medium text-yellow-600">Medium</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Search Volume</span>
                        <span className="font-medium">8,900/month</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Click Potential</span>
                        <span className="font-medium">890 - 1,200</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
