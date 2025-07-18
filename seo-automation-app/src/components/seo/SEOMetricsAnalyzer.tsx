/**
 * SEO Metrics Analyzer Component
 * Comprehensive SEO analysis interface with detailed metrics and recommendations
 */

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  BarChart3, 
  Target, 
  TrendingUp, 
  Users, 
  FileText, 
  Settings, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Zap,
  Eye,
  Award,
  Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SEOMetricsResult {
  overview: {
    overallScore: number;
    contentQuality: number;
    technicalSEO: number;
    keywordOptimization: number;
    userExperience: number;
    competitiveness: number;
  };
  analysis: {
    wordCount: any;
    keywordDensity: any;
    headingOptimization: any;
    lsiKeywords: any;
    entities: any;
    contentStructure: any;
    metaTags: any;
  };
  insights: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  actionPlan: Array<{
    priority: 'high' | 'medium' | 'low';
    category: string;
    action: string;
    impact: number;
    effort: number;
    timeframe: string;
  }>;
  competitorAnalysis?: {
    positionVsCompetitors: number;
    gapAnalysis: Array<{
      area: string;
      gap: number;
      recommendation: string;
    }>;
    opportunities: string[];
  };
  recommendations: string[];
  metadata: {
    analyzedAt: string;
    processingTime: number;
    contentLength: number;
    analysisDepth: string;
  };
}

interface AnalysisOptions {
  primaryKeyword: string;
  targetKeywords: string;
  brandName: string;
  analysisDepth: 'basic' | 'standard' | 'comprehensive';
  includeCompetitorAnalysis: boolean;
}

const DEFAULT_OPTIONS: AnalysisOptions = {
  primaryKeyword: '',
  targetKeywords: '',
  brandName: '',
  analysisDepth: 'standard',
  includeCompetitorAnalysis: false,
};

export default function SEOMetricsAnalyzer() {
  const [content, setContent] = useState('');
  const [html, setHtml] = useState('');
  const [options, setOptions] = useState<AnalysisOptions>(DEFAULT_OPTIONS);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<SEOMetricsResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const handleAnalyze = useCallback(async () => {
    if (!content.trim() || !options.primaryKeyword.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide content and primary keyword',
        variant: 'destructive',
      });
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    setProgress(0);

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 5, 90));
    }, 200);

    try {
      const response = await fetch('/api/seo/analyze-metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          html: html.trim() || undefined,
          options: {
            primaryKeyword: options.primaryKeyword,
            targetKeywords: options.targetKeywords.split(',').map(k => k.trim()).filter(Boolean),
            brandName: options.brandName || undefined,
            analysisDepth: options.analysisDepth,
            includeCompetitorAnalysis: options.includeCompetitorAnalysis,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Analysis failed');
      }

      if (data.success) {
        setResult(data.data);
        toast({
          title: 'Success',
          description: 'SEO analysis completed successfully',
        });
      } else {
        throw new Error(data.message || 'Analysis failed');
      }

    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      clearInterval(progressInterval);
      setProgress(100);
      setIsAnalyzing(false);
    }
  }, [content, html, options, toast]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            SEO Metrics Analysis
          </CardTitle>
          <CardDescription>
            Comprehensive SEO analysis with keyword optimization, content structure, and competitive insights
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primaryKeyword">Primary Keyword *</Label>
              <Input
                id="primaryKeyword"
                placeholder="e.g., SEO optimization"
                value={options.primaryKeyword}
                onChange={(e) => setOptions(prev => ({ ...prev, primaryKeyword: e.target.value }))}
                disabled={isAnalyzing}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="targetKeywords">Target Keywords (comma-separated)</Label>
              <Input
                id="targetKeywords"
                placeholder="e.g., search engine optimization, SEO tools"
                value={options.targetKeywords}
                onChange={(e) => setOptions(prev => ({ ...prev, targetKeywords: e.target.value }))}
                disabled={isAnalyzing}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brandName">Brand Name (optional)</Label>
              <Input
                id="brandName"
                placeholder="Your brand name"
                value={options.brandName}
                onChange={(e) => setOptions(prev => ({ ...prev, brandName: e.target.value }))}
                disabled={isAnalyzing}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="analysisDepth">Analysis Depth</Label>
              <select
                id="analysisDepth"
                className="w-full p-2 border rounded-md"
                value={options.analysisDepth}
                onChange={(e) => setOptions(prev => ({ ...prev, analysisDepth: e.target.value as any }))}
                disabled={isAnalyzing}
              >
                <option value="basic">Basic</option>
                <option value="standard">Standard</option>
                <option value="comprehensive">Comprehensive</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content to Analyze *</Label>
            <Textarea
              id="content"
              placeholder="Paste your content here for SEO analysis..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isAnalyzing}
              className="min-h-[200px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="html">HTML Source (optional)</Label>
            <Textarea
              id="html"
              placeholder="Paste HTML source for meta tag analysis..."
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              disabled={isAnalyzing}
              className="min-h-[100px] font-mono text-sm"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="includeCompetitorAnalysis"
              checked={options.includeCompetitorAnalysis}
              onCheckedChange={(checked) => setOptions(prev => ({ ...prev, includeCompetitorAnalysis: checked }))}
              disabled={isAnalyzing}
            />
            <Label htmlFor="includeCompetitorAnalysis">Include Competitor Analysis</Label>
          </div>

          <Button 
            onClick={handleAnalyze} 
            disabled={isAnalyzing || !content.trim() || !options.primaryKeyword.trim()}
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Analyzing SEO Metrics...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Analyze SEO Metrics
              </>
            )}
          </Button>

          {isAnalyzing && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground text-center">
                Running comprehensive SEO analysis... {progress}%
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Analysis Failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Overview Scores */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>SEO Performance Overview</span>
                <Badge variant="outline" className="text-sm">
                  {result.metadata.analysisDepth} Analysis
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="text-center">
                  <div className={`text-3xl font-bold ${getScoreColor(result.overview.overallScore)}`}>
                    {result.overview.overallScore}
                  </div>
                  <div className="text-sm text-muted-foreground">Overall</div>
                  <Badge variant={getScoreBadgeVariant(result.overview.overallScore)} className="mt-1">
                    {result.overview.overallScore >= 80 ? 'Excellent' : result.overview.overallScore >= 60 ? 'Good' : 'Needs Work'}
                  </Badge>
                </div>
                
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getScoreColor(result.overview.contentQuality)}`}>
                    {result.overview.contentQuality}
                  </div>
                  <div className="text-sm text-muted-foreground">Content Quality</div>
                </div>
                
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getScoreColor(result.overview.technicalSEO)}`}>
                    {result.overview.technicalSEO}
                  </div>
                  <div className="text-sm text-muted-foreground">Technical SEO</div>
                </div>
                
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getScoreColor(result.overview.keywordOptimization)}`}>
                    {result.overview.keywordOptimization}
                  </div>
                  <div className="text-sm text-muted-foreground">Keywords</div>
                </div>
                
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getScoreColor(result.overview.userExperience)}`}>
                    {result.overview.userExperience}
                  </div>
                  <div className="text-sm text-muted-foreground">User Experience</div>
                </div>
                
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getScoreColor(result.overview.competitiveness)}`}>
                    {result.overview.competitiveness}
                  </div>
                  <div className="text-sm text-muted-foreground">Competitive</div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Content Length:</span> {result.metadata.contentLength.toLocaleString()} chars
                </div>
                <div>
                  <span className="font-medium">Processing Time:</span> {result.metadata.processingTime}ms
                </div>
                <div>
                  <span className="font-medium">Analyzed:</span> {new Date(result.metadata.analyzedAt).toLocaleString()}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Analysis Tabs */}
          <Tabs defaultValue="insights" className="w-full">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="insights">
                <Eye className="h-4 w-4 mr-1" />
                Insights
              </TabsTrigger>
              <TabsTrigger value="keywords">
                <Target className="h-4 w-4 mr-1" />
                Keywords
              </TabsTrigger>
              <TabsTrigger value="content">
                <FileText className="h-4 w-4 mr-1" />
                Content
              </TabsTrigger>
              <TabsTrigger value="structure">
                <Settings className="h-4 w-4 mr-1" />
                Structure
              </TabsTrigger>
              <TabsTrigger value="technical">
                <Activity className="h-4 w-4 mr-1" />
                Technical
              </TabsTrigger>
              <TabsTrigger value="action-plan">
                <CheckCircle className="h-4 w-4 mr-1" />
                Action Plan
              </TabsTrigger>
              {result.competitorAnalysis && (
                <TabsTrigger value="competitors">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Competitors
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="insights" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-green-600">Strengths</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {result.insights.strengths.length > 0 ? (
                      <ul className="space-y-2">
                        {result.insights.strengths.map((strength, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{strength}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">No significant strengths identified</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-red-600">Weaknesses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {result.insights.weaknesses.length > 0 ? (
                      <ul className="space-y-2">
                        {result.insights.weaknesses.map((weakness, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{weakness}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">No significant weaknesses identified</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-blue-600">Opportunities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {result.insights.opportunities.length > 0 ? (
                      <ul className="space-y-2">
                        {result.insights.opportunities.map((opportunity, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{opportunity}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">No opportunities identified</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-orange-600">Threats</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {result.insights.threats.length > 0 ? (
                      <ul className="space-y-2">
                        {result.insights.threats.map((threat, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{threat}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">No threats identified</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="keywords" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Keyword Density</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">Primary Keyword</span>
                          <Badge variant={result.analysis.keywordDensity.overallDensity.isOptimal ? "default" : "destructive"}>
                            {result.analysis.keywordDensity.primaryKeyword.density}%
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Frequency: {result.analysis.keywordDensity.primaryKeyword.frequency} times
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Position: {result.analysis.keywordDensity.primaryKeyword.prominence.prominenceScore}/100
                        </div>
                      </div>

                      {result.analysis.keywordDensity.keywordVariations.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Keyword Variations</h4>
                          <div className="space-y-2">
                            {result.analysis.keywordDensity.keywordVariations.map((variation: any, index: number) => (
                              <div key={index} className="flex justify-between items-center">
                                <span className="text-sm">{variation.keyword}</span>
                                <Badge variant="outline">{variation.density}%</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>LSI Keywords</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>Topic Coverage</span>
                        <Badge variant={getScoreBadgeVariant(result.analysis.lsiKeywords.topicCoverage.score)}>
                          {result.analysis.lsiKeywords.topicCoverage.score}/100
                        </Badge>
                      </div>

                      {result.analysis.lsiKeywords.semanticGroups.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Semantic Groups</h4>
                          <div className="space-y-2">
                            {result.analysis.lsiKeywords.semanticGroups.map((group: any, index: number) => (
                              <div key={index} className="p-2 border rounded">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="font-medium text-sm">{group.theme}</span>
                                  <Badge variant="outline">{group.strength}/100</Badge>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {group.keywords.length} keywords, {group.coverage}% coverage
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {result.analysis.lsiKeywords.lsiKeywords.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Top LSI Keywords</h4>
                          <div className="flex flex-wrap gap-1">
                            {result.analysis.lsiKeywords.lsiKeywords.slice(0, 10).map((keyword: any, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {keyword.term} ({keyword.relevanceScore})
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="content" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Word Count Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Total Words:</span>
                        <span className="font-medium">{result.analysis.wordCount.totalWords.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Characters:</span>
                        <span className="font-medium">{result.analysis.wordCount.totalCharacters.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Reading Time:</span>
                        <span className="font-medium">{result.analysis.wordCount.readingTime.average} min</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Content Depth:</span>
                        <Badge variant={getScoreBadgeVariant(result.analysis.wordCount.contentDepth.score)}>
                          {result.analysis.wordCount.contentDepth.score}/100
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Unique Words:</span>
                        <span className="font-medium">{result.analysis.wordCount.uniqueWords.percentage}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Entities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Total Entities:</span>
                        <span className="font-medium">{result.analysis.entities.statistics.totalEntities}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Unique Entities:</span>
                        <span className="font-medium">{result.analysis.entities.statistics.uniqueEntities}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg Confidence:</span>
                        <Badge variant={getScoreBadgeVariant(result.analysis.entities.statistics.averageConfidence)}>
                          {result.analysis.entities.statistics.averageConfidence}/100
                        </Badge>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>People:</span>
                          <span>{result.analysis.entities.entityTypes.PERSON.length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Organizations:</span>
                          <span>{result.analysis.entities.entityTypes.ORGANIZATION.length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Locations:</span>
                          <span>{result.analysis.entities.entityTypes.LOCATION.length}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Content Patterns</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {result.analysis.contentStructure.patterns.length > 0 ? (
                        result.analysis.contentStructure.patterns.map((pattern: any, index: number) => (
                          <div key={index} className="flex justify-between items-center">
                            <span className="text-sm capitalize">{pattern.type.replace('_', ' ')}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{pattern.count}</span>
                              <Badge variant={getScoreBadgeVariant(pattern.seoValue)}>
                                {pattern.seoValue}
                              </Badge>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No structured patterns detected</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="structure" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Content Structure</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Structure Score:</span>
                        <Badge variant={getScoreBadgeVariant(result.analysis.contentStructure.overview.structureScore)}>
                          {result.analysis.contentStructure.overview.structureScore}/100
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Readability:</span>
                        <Badge variant={getScoreBadgeVariant(result.analysis.contentStructure.overview.readabilityScore)}>
                          {result.analysis.contentStructure.overview.readabilityScore}/100
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>SEO Optimization:</span>
                        <Badge variant={getScoreBadgeVariant(result.analysis.contentStructure.overview.seoOptimization)}>
                          {result.analysis.contentStructure.overview.seoOptimization}/100
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Sections:</span>
                        <span className="font-medium">{result.analysis.contentStructure.overview.totalSections}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg Section Length:</span>
                        <span className="font-medium">{result.analysis.contentStructure.overview.averageSectionLength} words</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Heading Optimization</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Total Headings:</span>
                        <span className="font-medium">{result.analysis.headingOptimization.overallAnalysis.totalHeadings}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>H1 Count:</span>
                        <Badge variant={result.analysis.headingOptimization.overallAnalysis.h1Count === 1 ? "default" : "destructive"}>
                          {result.analysis.headingOptimization.overallAnalysis.h1Count}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Keyword Optimized:</span>
                        <span className="font-medium">{result.analysis.headingOptimization.overallAnalysis.keywordOptimizedHeadings}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg Optimization:</span>
                        <Badge variant={getScoreBadgeVariant(result.analysis.headingOptimization.overallAnalysis.averageOptimizationScore)}>
                          {result.analysis.headingOptimization.overallAnalysis.averageOptimizationScore}/100
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Hierarchy Score:</span>
                        <Badge variant={getScoreBadgeVariant(result.analysis.headingOptimization.overallAnalysis.hierarchyScore)}>
                          {result.analysis.headingOptimization.overallAnalysis.hierarchyScore}/100
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {result.analysis.contentStructure.flow && (
                <Card>
                  <CardHeader>
                    <CardTitle>Content Flow</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Logical Progression:</span>
                        <Badge variant={result.analysis.contentStructure.flow.logicalProgression ? "default" : "destructive"}>
                          {result.analysis.contentStructure.flow.logicalProgression ? "Yes" : "No"}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Topic Coverage:</span>
                        <Badge variant={getScoreBadgeVariant(result.analysis.contentStructure.flow.topicCoverage)}>
                          {result.analysis.contentStructure.flow.topicCoverage}/100
                        </Badge>
                      </div>

                      {result.analysis.contentStructure.seoAnalysis && (
                        <>
                          <Separator />
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex justify-between">
                              <span>Has Introduction:</span>
                              <Badge variant={result.analysis.contentStructure.seoAnalysis.hasIntroduction ? "default" : "secondary"}>
                                {result.analysis.contentStructure.seoAnalysis.hasIntroduction ? "Yes" : "No"}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span>Has Conclusion:</span>
                              <Badge variant={result.analysis.contentStructure.seoAnalysis.hasConclusion ? "default" : "secondary"}>
                                {result.analysis.contentStructure.seoAnalysis.hasConclusion ? "Yes" : "No"}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span>Has Call-to-Action:</span>
                              <Badge variant={result.analysis.contentStructure.seoAnalysis.hasCallToAction ? "default" : "secondary"}>
                                {result.analysis.contentStructure.seoAnalysis.hasCallToAction ? "Yes" : "No"}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span>Internal Links:</span>
                              <span>{result.analysis.contentStructure.seoAnalysis.internalLinking.count}</span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="technical" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Meta Tags Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Overall Score:</span>
                        <Badge variant={getScoreBadgeVariant(result.analysis.metaTags.scores.overall)}>
                          {result.analysis.metaTags.scores.overall}/100
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Basic SEO:</span>
                        <Badge variant={getScoreBadgeVariant(result.analysis.metaTags.scores.basicSEO)}>
                          {result.analysis.metaTags.scores.basicSEO}/100
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Social Media:</span>
                        <Badge variant={getScoreBadgeVariant(result.analysis.metaTags.scores.socialMedia)}>
                          {result.analysis.metaTags.scores.socialMedia}/100
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Technical:</span>
                        <Badge variant={getScoreBadgeVariant(result.analysis.metaTags.scores.technical)}>
                          {result.analysis.metaTags.scores.technical}/100
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Title & Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium">Title Tag</span>
                          <Badge variant={result.analysis.metaTags.analysis.title.isOptimal ? "default" : "destructive"}>
                            {result.analysis.metaTags.analysis.title.length} chars
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Keyword: {result.analysis.metaTags.analysis.title.keywordPresence ? "✓" : "✗"} |
                          Brand: {result.analysis.metaTags.analysis.title.brandPresence ? "✓" : "✗"}
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium">Meta Description</span>
                          <Badge variant={result.analysis.metaTags.analysis.description.isOptimal ? "default" : "destructive"}>
                            {result.analysis.metaTags.analysis.description.length} chars
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Keyword: {result.analysis.metaTags.analysis.description.keywordPresence ? "✓" : "✗"} |
                          CTA: {result.analysis.metaTags.analysis.description.callToActionPresence ? "✓" : "✗"}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Open Graph</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Present:</span>
                        <Badge variant={result.analysis.metaTags.analysis.openGraph.present ? "default" : "destructive"}>
                          {result.analysis.metaTags.analysis.openGraph.present ? "Yes" : "No"}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Completeness:</span>
                        <Badge variant={getScoreBadgeVariant(result.analysis.metaTags.analysis.openGraph.completeness)}>
                          {result.analysis.metaTags.analysis.openGraph.completeness}%
                        </Badge>
                      </div>
                      {result.analysis.metaTags.analysis.openGraph.missingTags.length > 0 && (
                        <div>
                          <span className="text-sm font-medium">Missing Tags:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {result.analysis.metaTags.analysis.openGraph.missingTags.map((tag: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Technical Tags</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Canonical URL:</span>
                        <Badge variant={result.analysis.metaTags.analysis.technical.canonical ? "default" : "destructive"}>
                          {result.analysis.metaTags.analysis.technical.canonical ? "✓" : "✗"}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Robots Meta:</span>
                        <Badge variant={result.analysis.metaTags.analysis.technical.robots ? "default" : "secondary"}>
                          {result.analysis.metaTags.analysis.technical.robots ? "✓" : "✗"}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Viewport:</span>
                        <Badge variant={result.analysis.metaTags.analysis.technical.viewport ? "default" : "destructive"}>
                          {result.analysis.metaTags.analysis.technical.viewport ? "✓" : "✗"}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Charset:</span>
                        <Badge variant={result.analysis.metaTags.analysis.technical.charset ? "default" : "destructive"}>
                          {result.analysis.metaTags.analysis.technical.charset ? "✓" : "✗"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="action-plan" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Prioritized Action Plan</CardTitle>
                  <CardDescription>
                    Recommended actions sorted by priority and impact
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {result.actionPlan.map((action, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              action.priority === 'high' ? 'destructive' :
                              action.priority === 'medium' ? 'secondary' : 'outline'
                            }>
                              {action.priority.toUpperCase()}
                            </Badge>
                            <Badge variant="outline" className="capitalize">
                              {action.category}
                            </Badge>
                            <Badge variant="outline" className="capitalize">
                              {action.timeframe.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div className="text-right text-sm text-muted-foreground">
                            Impact: {action.impact}/100 | Effort: {action.effort}/100
                          </div>
                        </div>
                        <p className="text-sm">{action.action}</p>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Impact</div>
                            <Progress value={action.impact} className="h-2" />
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Effort</div>
                            <Progress value={action.effort} className="h-2" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {result.recommendations.slice(0, 10).map((recommendation, index) => (
                      <div key={index} className="flex items-start gap-2 p-2 border rounded">
                        <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{recommendation}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {result.competitorAnalysis && (
              <TabsContent value="competitors" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Competitive Position</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-blue-600">
                            #{result.competitorAnalysis.positionVsCompetitors}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Position vs Competitors
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <h4 className="font-medium mb-2">Opportunities</h4>
                          <div className="space-y-1">
                            {result.competitorAnalysis.opportunities.map((opportunity, index) => (
                              <div key={index} className="flex items-start gap-2">
                                <TrendingUp className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <span className="text-sm">{opportunity}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Gap Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {result.competitorAnalysis.gapAnalysis.map((gap, index) => (
                          <div key={index} className="p-3 border rounded">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium text-sm">{gap.area}</span>
                              <Badge variant={gap.gap > 0 ? "default" : "destructive"}>
                                {gap.gap > 0 ? '+' : ''}{gap.gap}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{gap.recommendation}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      )}
    </div>
  );
}
