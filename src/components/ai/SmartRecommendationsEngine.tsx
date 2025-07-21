'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Sparkles, 
  TrendingUp,
  Target,
  Lightbulb,
  Users,
  Calendar,
  BarChart3,
  Zap,
  Clock,
  Globe,
  Search,
  FileText,
  ArrowRight,
  Star,
  ThumbsUp,
  Eye,
  Share2,
  Bookmark,
  RefreshCw
} from 'lucide-react';

interface ContentRecommendation {
  id: string;
  type: 'topic' | 'keyword' | 'format' | 'timing' | 'audience' | 'optimization';
  title: string;
  description: string;
  reasoning: string;
  priority: 'high' | 'medium' | 'low';
  confidence: number;
  estimatedImpact: {
    traffic: number;
    engagement: number;
    conversions: number;
  };
  difficulty: 'easy' | 'medium' | 'hard';
  timeToImplement: string;
  category: string;
  tags: string[];
  actionable: boolean;
}

interface TrendingTopic {
  topic: string;
  searchVolume: number;
  growth: number;
  competition: 'low' | 'medium' | 'high';
  relevanceScore: number;
  suggestedAngles: string[];
}

interface ContentGap {
  keyword: string;
  searchVolume: number;
  difficulty: number;
  competitorCoverage: number;
  opportunity: number;
  suggestedContentType: string;
}

export function SmartRecommendationsEngine() {
  const [recommendations, setRecommendations] = useState<ContentRecommendation[]>([]);
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [contentGaps, setContentGaps] = useState<ContentGap[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('recommendations');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    setIsLoading(true);

    try {
      // Simulate AI recommendation generation
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockRecommendations: ContentRecommendation[] = [
        {
          id: '1',
          type: 'topic',
          title: 'Create Content About "AI Content Marketing Trends 2025"',
          description: 'High-potential topic with growing search interest and low competition',
          reasoning: 'Search volume increased 340% in the last 3 months. Your audience shows high engagement with AI-related content.',
          priority: 'high',
          confidence: 94,
          estimatedImpact: {
            traffic: 2400,
            engagement: 85,
            conversions: 12
          },
          difficulty: 'medium',
          timeToImplement: '3-4 hours',
          category: 'Content Strategy',
          tags: ['AI', 'Marketing', 'Trends', 'High-Impact'],
          actionable: true
        },
        {
          id: '2',
          type: 'keyword',
          title: 'Target "Content Optimization Tools" Keyword',
          description: 'Underutilized keyword with excellent ranking potential',
          reasoning: 'Keyword has 8,900 monthly searches with medium competition. Your domain authority gives you a strong advantage.',
          priority: 'high',
          confidence: 87,
          estimatedImpact: {
            traffic: 1800,
            engagement: 72,
            conversions: 8
          },
          difficulty: 'easy',
          timeToImplement: '2-3 hours',
          category: 'SEO',
          tags: ['Keywords', 'Tools', 'Optimization'],
          actionable: true
        },
        {
          id: '3',
          type: 'format',
          title: 'Convert Top Blog Posts to Video Content',
          description: 'Video content performs 3x better for your audience',
          reasoning: 'Your audience engagement with video content is 340% higher than text. Top blog posts have proven topics.',
          priority: 'medium',
          confidence: 78,
          estimatedImpact: {
            traffic: 1200,
            engagement: 156,
            conversions: 15
          },
          difficulty: 'hard',
          timeToImplement: '8-12 hours',
          category: 'Content Format',
          tags: ['Video', 'Repurposing', 'Engagement'],
          actionable: true
        },
        {
          id: '4',
          type: 'timing',
          title: 'Publish Content on Tuesday Mornings',
          description: 'Optimal timing for maximum reach and engagement',
          reasoning: 'Analysis shows your audience is most active on Tuesday 9-11 AM. 45% higher engagement during this window.',
          priority: 'low',
          confidence: 82,
          estimatedImpact: {
            traffic: 0,
            engagement: 45,
            conversions: 3
          },
          difficulty: 'easy',
          timeToImplement: '5 minutes',
          category: 'Publishing Strategy',
          tags: ['Timing', 'Engagement', 'Quick-Win'],
          actionable: true
        },
        {
          id: '5',
          type: 'audience',
          title: 'Create Beginner-Friendly Content Series',
          description: 'Large untapped audience segment with high conversion potential',
          reasoning: '68% of your traffic searches for beginner content, but only 23% of your content targets beginners.',
          priority: 'medium',
          confidence: 91,
          estimatedImpact: {
            traffic: 3200,
            engagement: 67,
            conversions: 18
          },
          difficulty: 'medium',
          timeToImplement: '6-8 hours',
          category: 'Audience Development',
          tags: ['Beginners', 'Series', 'Education'],
          actionable: true
        }
      ];

      const mockTrendingTopics: TrendingTopic[] = [
        {
          topic: 'AI-Powered SEO Tools',
          searchVolume: 12400,
          growth: 245,
          competition: 'medium',
          relevanceScore: 94,
          suggestedAngles: ['Tool comparisons', 'Implementation guides', 'ROI analysis']
        },
        {
          topic: 'Voice Search Optimization',
          searchVolume: 8900,
          growth: 156,
          competition: 'low',
          relevanceScore: 87,
          suggestedAngles: ['Local SEO impact', 'Content strategy', 'Technical setup']
        },
        {
          topic: 'Content Personalization',
          searchVolume: 6700,
          growth: 189,
          competition: 'high',
          relevanceScore: 82,
          suggestedAngles: ['AI implementation', 'User experience', 'Conversion impact']
        }
      ];

      const mockContentGaps: ContentGap[] = [
        {
          keyword: 'content marketing automation',
          searchVolume: 5400,
          difficulty: 45,
          competitorCoverage: 23,
          opportunity: 87,
          suggestedContentType: 'Comprehensive Guide'
        },
        {
          keyword: 'seo content templates',
          searchVolume: 3200,
          difficulty: 38,
          competitorCoverage: 15,
          opportunity: 92,
          suggestedContentType: 'Resource Library'
        },
        {
          keyword: 'content performance metrics',
          searchVolume: 4100,
          difficulty: 52,
          competitorCoverage: 34,
          opportunity: 78,
          suggestedContentType: 'Data-Driven Article'
        }
      ];

      setRecommendations(mockRecommendations);
      setTrendingTopics(mockTrendingTopics);
      setContentGaps(mockContentGaps);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
    }
  };

  const getDifficultyColor = (difficulty: 'easy' | 'medium' | 'hard') => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
    }
  };

  const getCompetitionColor = (competition: 'low' | 'medium' | 'high') => {
    switch (competition) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'topic': return <Lightbulb className="h-4 w-4" />;
      case 'keyword': return <Target className="h-4 w-4" />;
      case 'format': return <FileText className="h-4 w-4" />;
      case 'timing': return <Clock className="h-4 w-4" />;
      case 'audience': return <Users className="h-4 w-4" />;
      case 'optimization': return <Zap className="h-4 w-4" />;
      default: return <Sparkles className="h-4 w-4" />;
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const filteredRecommendations = recommendations.filter(rec => 
    selectedFilters.length === 0 || selectedFilters.includes(rec.priority)
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Sparkles className="h-5 w-5 mr-2" />
              Smart Content Recommendations
            </span>
            <Button variant="outline" onClick={loadRecommendations} disabled={isLoading}>
              {isLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="recommendations">
                <Lightbulb className="h-4 w-4 mr-2" />
                Recommendations
              </TabsTrigger>
              <TabsTrigger value="trending">
                <TrendingUp className="h-4 w-4 mr-2" />
                Trending
              </TabsTrigger>
              <TabsTrigger value="gaps">
                <Target className="h-4 w-4 mr-2" />
                Content Gaps
              </TabsTrigger>
              <TabsTrigger value="insights">
                <BarChart3 className="h-4 w-4 mr-2" />
                Insights
              </TabsTrigger>
            </TabsList>

            <TabsContent value="recommendations" className="space-y-4">
              {/* Filters */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Filter by priority:</span>
                {['high', 'medium', 'low'].map((priority) => (
                  <Button
                    key={priority}
                    variant={selectedFilters.includes(priority) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setSelectedFilters(prev =>
                        prev.includes(priority)
                          ? prev.filter(p => p !== priority)
                          : [...prev, priority]
                      );
                    }}
                  >
                    {priority}
                  </Button>
                ))}
                {selectedFilters.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFilters([])}
                  >
                    Clear
                  </Button>
                )}
              </div>

              {/* Recommendations List */}
              <div className="space-y-4">
                {filteredRecommendations.map((rec) => (
                  <Card key={rec.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          {getTypeIcon(rec.type)}
                          <div>
                            <h4 className="font-medium">{rec.title}</h4>
                            <p className="text-sm text-muted-foreground">{rec.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getPriorityColor(rec.priority)}>
                            {rec.priority}
                          </Badge>
                          <Badge variant="outline">
                            {rec.confidence}% confidence
                          </Badge>
                        </div>
                      </div>

                      <div className="bg-muted/50 p-3 rounded-md mb-4">
                        <p className="text-sm">{rec.reasoning}</p>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <div className="text-xs text-muted-foreground">Est. Traffic</div>
                          <div className="font-medium text-blue-600">
                            +{formatNumber(rec.estimatedImpact.traffic)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Engagement</div>
                          <div className="font-medium text-green-600">
                            +{rec.estimatedImpact.engagement}%
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Conversions</div>
                          <div className="font-medium text-purple-600">
                            +{rec.estimatedImpact.conversions}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Time Needed</div>
                          <div className="font-medium">{rec.timeToImplement}</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge className={getDifficultyColor(rec.difficulty)}>
                            {rec.difficulty}
                          </Badge>
                          <Badge variant="outline">{rec.category}</Badge>
                          {rec.tags.slice(0, 2).map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        {rec.actionable && (
                          <Button size="sm">
                            <ArrowRight className="h-3 w-3 mr-1" />
                            Implement
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="trending" className="space-y-4">
              <h3 className="font-medium">Trending Topics in Your Niche</h3>
              
              <div className="space-y-4">
                {trendingTopics.map((topic, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">{topic.topic}</h4>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            +{topic.growth}%
                          </Badge>
                          <Badge className={`${getCompetitionColor(topic.competition)} bg-transparent border`}>
                            {topic.competition} competition
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                        <div>
                          <div className="text-muted-foreground">Search Volume</div>
                          <div className="font-medium">{formatNumber(topic.searchVolume)}/mo</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Relevance</div>
                          <div className="font-medium">{topic.relevanceScore}%</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Growth</div>
                          <div className="font-medium text-green-600">+{topic.growth}%</div>
                        </div>
                      </div>

                      <div>
                        <div className="text-sm font-medium mb-2">Suggested Content Angles:</div>
                        <div className="flex flex-wrap gap-2">
                          {topic.suggestedAngles.map((angle, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {angle}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="gaps" className="space-y-4">
              <h3 className="font-medium">Content Gap Opportunities</h3>
              
              <div className="space-y-3">
                {contentGaps.map((gap, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{gap.keyword}</h4>
                      <p className="text-sm text-muted-foreground">
                        Suggested format: {gap.suggestedContentType}
                      </p>
                      
                      <div className="grid grid-cols-4 gap-4 mt-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Volume: </span>
                          <span className="font-medium">{formatNumber(gap.searchVolume)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Difficulty: </span>
                          <span className="font-medium">{gap.difficulty}%</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Coverage: </span>
                          <span className="font-medium">{gap.competitorCoverage}%</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Opportunity: </span>
                          <span className="font-medium text-green-600">{gap.opportunity}%</span>
                        </div>
                      </div>
                    </div>
                    
                    <Button size="sm" variant="outline">
                      <Target className="h-3 w-3 mr-1" />
                      Create Content
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="insights" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Content Performance Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Best Performing Content Type</span>
                        <span className="font-medium">How-to Guides</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Optimal Content Length</span>
                        <span className="font-medium">1,200-1,800 words</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Best Publishing Day</span>
                        <span className="font-medium">Tuesday</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Peak Engagement Time</span>
                        <span className="font-medium">9-11 AM</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Audience Preferences</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Preferred Content Format</span>
                        <span className="font-medium">Step-by-step guides</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Engagement Driver</span>
                        <span className="font-medium">Practical examples</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Content Depth</span>
                        <span className="font-medium">Comprehensive</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Visual Preference</span>
                        <span className="font-medium">Screenshots & diagrams</span>
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
