'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  TrendingUp, 
  Target,
  Search,
  Globe,
  BarChart3,
  Eye,
  Link,
  FileText,
  Zap,
  Plus,
  X
} from 'lucide-react';

interface Competitor {
  id: string;
  domain: string;
  name: string;
  overallScore: number;
  seoScore: number;
  contentScore: number;
  backlinks: number;
  organicKeywords: number;
  monthlyTraffic: number;
  topKeywords: string[];
  strengths: string[];
  weaknesses: string[];
}

interface CompetitorGap {
  keyword: string;
  yourRank: number | null;
  competitorRank: number;
  searchVolume: number;
  difficulty: number;
  opportunity: 'high' | 'medium' | 'low';
}

export function CompetitorAnalysis() {
  const [yourDomain, setYourDomain] = useState('');
  const [competitorDomains, setCompetitorDomains] = useState<string[]>(['']);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [gaps, setGaps] = useState<CompetitorGap[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  const handleAddCompetitor = () => {
    setCompetitorDomains([...competitorDomains, '']);
  };

  const handleRemoveCompetitor = (index: number) => {
    setCompetitorDomains(competitorDomains.filter((_, i) => i !== index));
  };

  const handleCompetitorChange = (index: number, value: string) => {
    const updated = [...competitorDomains];
    updated[index] = value;
    setCompetitorDomains(updated);
  };

  const handleAnalyze = async () => {
    if (!yourDomain.trim() || competitorDomains.filter(d => d.trim()).length === 0) return;

    setIsAnalyzing(true);

    // Simulate analysis
    await new Promise(resolve => setTimeout(resolve, 4000));

    const mockCompetitors: Competitor[] = [
      {
        id: '1',
        domain: 'competitor1.com',
        name: 'Competitor 1',
        overallScore: 88,
        seoScore: 92,
        contentScore: 85,
        backlinks: 15420,
        organicKeywords: 3240,
        monthlyTraffic: 125000,
        topKeywords: ['digital marketing', 'seo tools', 'content strategy'],
        strengths: ['Strong backlink profile', 'High-quality content', 'Technical SEO'],
        weaknesses: ['Limited social presence', 'Slow page speed']
      },
      {
        id: '2',
        domain: 'competitor2.com',
        name: 'Competitor 2',
        overallScore: 82,
        seoScore: 79,
        contentScore: 88,
        backlinks: 8930,
        organicKeywords: 2180,
        monthlyTraffic: 89000,
        topKeywords: ['marketing automation', 'lead generation', 'email marketing'],
        strengths: ['Excellent content marketing', 'Strong brand presence'],
        weaknesses: ['Weak technical SEO', 'Limited keyword diversity']
      },
      {
        id: '3',
        domain: 'competitor3.com',
        name: 'Competitor 3',
        overallScore: 75,
        seoScore: 73,
        contentScore: 79,
        backlinks: 5670,
        organicKeywords: 1890,
        monthlyTraffic: 67000,
        topKeywords: ['social media marketing', 'influencer marketing', 'brand strategy'],
        strengths: ['Strong social media presence', 'Innovative content'],
        weaknesses: ['Poor site structure', 'Limited backlinks']
      }
    ];

    const mockGaps: CompetitorGap[] = [
      {
        keyword: 'content marketing strategy',
        yourRank: null,
        competitorRank: 3,
        searchVolume: 8900,
        difficulty: 65,
        opportunity: 'high'
      },
      {
        keyword: 'seo best practices',
        yourRank: 15,
        competitorRank: 2,
        searchVolume: 12000,
        difficulty: 72,
        opportunity: 'high'
      },
      {
        keyword: 'digital marketing trends',
        yourRank: 8,
        competitorRank: 1,
        searchVolume: 6700,
        difficulty: 58,
        opportunity: 'medium'
      },
      {
        keyword: 'marketing automation tools',
        yourRank: null,
        competitorRank: 5,
        searchVolume: 4500,
        difficulty: 68,
        opportunity: 'medium'
      },
      {
        keyword: 'social media strategy',
        yourRank: 12,
        competitorRank: 4,
        searchVolume: 5200,
        difficulty: 55,
        opportunity: 'low'
      }
    ];

    setCompetitors(mockCompetitors);
    setGaps(mockGaps);
    setIsAnalyzing(false);
  };

  const getOpportunityColor = (opportunity: 'high' | 'medium' | 'low') => {
    switch (opportunity) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Analysis Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Competitor Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Your Domain *
            </label>
            <Input
              type="url"
              placeholder="yourdomain.com"
              value={yourDomain}
              onChange={(e) => setYourDomain(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Competitor Domains *
            </label>
            <div className="space-y-2">
              {competitorDomains.map((domain, index) => (
                <div key={index} className="flex space-x-2">
                  <Input
                    placeholder="competitor.com"
                    value={domain}
                    onChange={(e) => handleCompetitorChange(index, e.target.value)}
                  />
                  {competitorDomains.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveCompetitor(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddCompetitor}
                disabled={competitorDomains.length >= 5}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Competitor
              </Button>
            </div>
          </div>

          <Button 
            onClick={handleAnalyze}
            disabled={!yourDomain.trim() || competitorDomains.filter(d => d.trim()).length === 0 || isAnalyzing}
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <Search className="h-4 w-4 mr-2 animate-pulse" />
                Analyzing Competitors...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Analyze Competitors
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {competitors.length > 0 && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="gaps">
              <Target className="h-4 w-4 mr-2" />
              Keyword Gaps
            </TabsTrigger>
            <TabsTrigger value="insights">
              <Eye className="h-4 w-4 mr-2" />
              Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6">
              {competitors.map((competitor) => (
                <Card key={competitor.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center">
                        <Globe className="h-5 w-5 mr-2" />
                        {competitor.name}
                      </span>
                      <div className={`text-2xl font-bold ${getScoreColor(competitor.overallScore)}`}>
                        {competitor.overallScore}%
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>SEO Score</span>
                            <span className={getScoreColor(competitor.seoScore)}>
                              {competitor.seoScore}%
                            </span>
                          </div>
                          <Progress value={competitor.seoScore} className="h-2" />
                        </div>
                        
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Content Score</span>
                            <span className={getScoreColor(competitor.contentScore)}>
                              {competitor.contentScore}%
                            </span>
                          </div>
                          <Progress value={competitor.contentScore} className="h-2" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Backlinks</div>
                          <div className="font-medium">{competitor.backlinks.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Keywords</div>
                          <div className="font-medium">{competitor.organicKeywords.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Monthly Traffic</div>
                          <div className="font-medium">{competitor.monthlyTraffic.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Domain</div>
                          <div className="font-medium">{competitor.domain}</div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div>
                        <h4 className="font-medium text-sm mb-2">Top Keywords</h4>
                        <div className="flex flex-wrap gap-1">
                          {competitor.topKeywords.map((keyword, index) => (
                            <Badge key={index} variant="outline">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-sm mb-2">Strengths & Weaknesses</h4>
                        <div className="space-y-2">
                          <div>
                            <div className="text-xs text-green-600 font-medium">Strengths:</div>
                            <div className="text-xs text-muted-foreground">
                              {competitor.strengths.join(', ')}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-red-600 font-medium">Weaknesses:</div>
                            <div className="text-xs text-muted-foreground">
                              {competitor.weaknesses.join(', ')}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="gaps" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Keyword Gap Analysis ({gaps.length} opportunities)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {gaps.map((gap, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-medium">{gap.keyword}</h4>
                          <Badge className={getOpportunityColor(gap.opportunity)}>
                            {gap.opportunity} opportunity
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-4 text-sm text-muted-foreground">
                          <div>
                            <span>Your Rank: </span>
                            <span className="font-medium">
                              {gap.yourRank ? `#${gap.yourRank}` : 'Not ranking'}
                            </span>
                          </div>
                          <div>
                            <span>Competitor: </span>
                            <span className="font-medium">#{gap.competitorRank}</span>
                          </div>
                          <div>
                            <span>Volume: </span>
                            <span className="font-medium">{gap.searchVolume.toLocaleString()}</span>
                          </div>
                          <div>
                            <span>Difficulty: </span>
                            <span className="font-medium">{gap.difficulty}%</span>
                          </div>
                        </div>
                      </div>
                      
                      <Button size="sm">
                        <Target className="h-3 w-3 mr-1" />
                        Target
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Key Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <div className="font-medium text-sm text-blue-800 mb-1">
                        Content Gap Opportunity
                      </div>
                      <div className="text-sm text-blue-700">
                        Your competitors are ranking for 15+ keywords you're not targeting. 
                        Focus on content marketing strategy topics.
                      </div>
                    </div>
                    
                    <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                      <div className="font-medium text-sm text-green-800 mb-1">
                        Backlink Opportunity
                      </div>
                      <div className="text-sm text-green-700">
                        Competitor 1 has 3x more backlinks. Target their referring domains 
                        for link building opportunities.
                      </div>
                    </div>
                    
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <div className="font-medium text-sm text-yellow-800 mb-1">
                        Technical SEO Gap
                      </div>
                      <div className="text-sm text-yellow-700">
                        Your site speed is slower than all competitors. 
                        Optimize for better performance scores.
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Zap className="h-5 w-5 mr-2" />
                    Action Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                      <div>
                        <div className="font-medium text-sm">High Priority</div>
                        <div className="text-sm text-muted-foreground">
                          Create content for "content marketing strategy" - 8.9K monthly searches
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                      <div>
                        <div className="font-medium text-sm">Medium Priority</div>
                        <div className="text-sm text-muted-foreground">
                          Improve page speed to match competitor performance
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <div className="font-medium text-sm">Low Priority</div>
                        <div className="text-sm text-muted-foreground">
                          Build backlinks from competitor referring domains
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
