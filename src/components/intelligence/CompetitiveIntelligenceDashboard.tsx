/**
 * Competitive Intelligence Dashboard Component
 * Advanced competitive analysis with precision benchmarks and actionable insights
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
  Target, 
  TrendingUp, 
  BarChart3, 
  Users, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Award,
  Activity,
  Eye,
  FileText,
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CompetitiveAnalysisResult {
  overview: {
    competitivePosition: number;
    overallGap: number;
    improvementPotential: number;
    priorityActions: number;
    competitorCount: number;
  };
  currentAnalysis: {
    seoMetrics: any;
    topicDistribution: any;
    qualityAnalysis: any;
  };
  competitorAnalysis: {
    summary: any;
    individual: Array<{
      url: string;
      overallScore: number;
      keyStrengths: string[];
      keyMetrics: any;
    }>;
  };
  benchmarkReport: {
    keywordBenchmarks: any[];
    headingBenchmarks: any[];
    contentBenchmarks: any;
    gapAnalysis: any;
    actionPlan: any[];
    competitorInsights: any;
  };
  insights: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  recommendations: string[];
}

interface AnalysisOptions {
  primaryKeyword: string;
  targetKeywords: string;
  brandName: string;
  contentType: 'blog' | 'article' | 'product' | 'landing' | 'guide';
  targetAudience: 'general' | 'technical' | 'academic' | 'casual';
  analysisDepth: 'basic' | 'standard' | 'comprehensive';
  includeTopicMapping: boolean;
  includeQualityScoring: boolean;
  includeBenchmarkReport: boolean;
  prioritizeQuickWins: boolean;
}

interface CompetitorData {
  url: string;
  content: string;
  html?: string;
}

const DEFAULT_OPTIONS: AnalysisOptions = {
  primaryKeyword: '',
  targetKeywords: '',
  brandName: '',
  contentType: 'article',
  targetAudience: 'general',
  analysisDepth: 'comprehensive',
  includeTopicMapping: true,
  includeQualityScoring: true,
  includeBenchmarkReport: true,
  prioritizeQuickWins: true,
};

export default function CompetitiveIntelligenceDashboard() {
  const [content, setContent] = useState('');
  const [html, setHtml] = useState('');
  const [options, setOptions] = useState<AnalysisOptions>(DEFAULT_OPTIONS);
  const [competitors, setCompetitors] = useState<CompetitorData[]>([
    { url: '', content: '', html: '' }
  ]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<CompetitiveAnalysisResult | null>(null);
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

    const validCompetitors = competitors.filter(c => c.url.trim() && c.content.trim());
    if (validCompetitors.length === 0) {
      toast({
        title: 'Error',
        description: 'Please provide at least one competitor with URL and content',
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
      setProgress(prev => Math.min(prev + 3, 90));
    }, 300);

    try {
      const response = await fetch('/api/intelligence/analyze', {
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
            contentType: options.contentType,
            targetAudience: options.targetAudience,
            analysisDepth: options.analysisDepth,
            includeTopicMapping: options.includeTopicMapping,
            includeQualityScoring: options.includeQualityScoring,
            includeBenchmarkReport: options.includeBenchmarkReport,
            prioritizeQuickWins: options.prioritizeQuickWins,
          },
          competitorData: validCompetitors.map(c => ({
            url: c.url,
            content: c.content,
            html: c.html || undefined,
          })),
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
          description: 'Competitive intelligence analysis completed successfully',
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
  }, [content, html, options, competitors, toast]);

  const addCompetitor = () => {
    setCompetitors([...competitors, { url: '', content: '', html: '' }]);
  };

  const removeCompetitor = (index: number) => {
    setCompetitors(competitors.filter((_, i) => i !== index));
  };

  const updateCompetitor = (index: number, field: keyof CompetitorData, value: string) => {
    const updated = [...competitors];
    updated[index] = { ...updated[index], [field]: value };
    setCompetitors(updated);
  };

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

  const getPositionColor = (position: number) => {
    if (position === 1) return 'text-green-600';
    if (position === 2) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getGapColor = (gap: number) => {
    if (gap > 0) return 'text-green-600';
    if (gap > -20) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Competitive Intelligence Analysis
          </CardTitle>
          <CardDescription>
            Advanced competitive analysis with precision benchmarks and exact optimization targets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Analysis Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primaryKeyword">Primary Keyword *</Label>
              <Input
                id="primaryKeyword"
                placeholder="e.g., competitive SEO analysis"
                value={options.primaryKeyword}
                onChange={(e) => setOptions(prev => ({ ...prev, primaryKeyword: e.target.value }))}
                disabled={isAnalyzing}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="targetKeywords">Target Keywords (comma-separated)</Label>
              <Input
                id="targetKeywords"
                placeholder="e.g., SEO tools, competitor analysis"
                value={options.targetKeywords}
                onChange={(e) => setOptions(prev => ({ ...prev, targetKeywords: e.target.value }))}
                disabled={isAnalyzing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="brandName">Brand Name</Label>
              <Input
                id="brandName"
                placeholder="Your brand name"
                value={options.brandName}
                onChange={(e) => setOptions(prev => ({ ...prev, brandName: e.target.value }))}
                disabled={isAnalyzing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contentType">Content Type</Label>
              <select
                id="contentType"
                className="w-full p-2 border rounded-md"
                value={options.contentType}
                onChange={(e) => setOptions(prev => ({ ...prev, contentType: e.target.value as any }))}
                disabled={isAnalyzing}
              >
                <option value="blog">Blog Post</option>
                <option value="article">Article</option>
                <option value="product">Product Page</option>
                <option value="landing">Landing Page</option>
                <option value="guide">Guide</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetAudience">Target Audience</Label>
              <select
                id="targetAudience"
                className="w-full p-2 border rounded-md"
                value={options.targetAudience}
                onChange={(e) => setOptions(prev => ({ ...prev, targetAudience: e.target.value as any }))}
                disabled={isAnalyzing}
              >
                <option value="general">General</option>
                <option value="technical">Technical</option>
                <option value="academic">Academic</option>
                <option value="casual">Casual</option>
              </select>
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

          {/* Analysis Features */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="includeTopicMapping"
                checked={options.includeTopicMapping}
                onCheckedChange={(checked) => setOptions(prev => ({ ...prev, includeTopicMapping: checked }))}
                disabled={isAnalyzing}
              />
              <Label htmlFor="includeTopicMapping">Topic Mapping</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="includeQualityScoring"
                checked={options.includeQualityScoring}
                onCheckedChange={(checked) => setOptions(prev => ({ ...prev, includeQualityScoring: checked }))}
                disabled={isAnalyzing}
              />
              <Label htmlFor="includeQualityScoring">Quality Scoring</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="includeBenchmarkReport"
                checked={options.includeBenchmarkReport}
                onCheckedChange={(checked) => setOptions(prev => ({ ...prev, includeBenchmarkReport: checked }))}
                disabled={isAnalyzing}
              />
              <Label htmlFor="includeBenchmarkReport">Benchmark Report</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="prioritizeQuickWins"
                checked={options.prioritizeQuickWins}
                onCheckedChange={(checked) => setOptions(prev => ({ ...prev, prioritizeQuickWins: checked }))}
                disabled={isAnalyzing}
              />
              <Label htmlFor="prioritizeQuickWins">Quick Wins</Label>
            </div>
          </div>

          {/* Content Input */}
          <div className="space-y-2">
            <Label htmlFor="content">Your Content *</Label>
            <Textarea
              id="content"
              placeholder="Paste your content here for competitive analysis..."
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

          {/* Competitor Data */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-medium">Competitor Data</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCompetitor}
                disabled={isAnalyzing || competitors.length >= 5}
              >
                Add Competitor
              </Button>
            </div>

            {competitors.map((competitor, index) => (
              <Card key={index} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">Competitor {index + 1}</Label>
                    {competitors.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCompetitor(index)}
                        disabled={isAnalyzing}
                      >
                        Remove
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor={`competitor-url-${index}`}>URL *</Label>
                      <Input
                        id={`competitor-url-${index}`}
                        placeholder="https://competitor.com/page"
                        value={competitor.url}
                        onChange={(e) => updateCompetitor(index, 'url', e.target.value)}
                        disabled={isAnalyzing}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`competitor-html-${index}`}>HTML (optional)</Label>
                      <Input
                        id={`competitor-html-${index}`}
                        placeholder="HTML source code"
                        value={competitor.html || ''}
                        onChange={(e) => updateCompetitor(index, 'html', e.target.value)}
                        disabled={isAnalyzing}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`competitor-content-${index}`}>Content *</Label>
                    <Textarea
                      id={`competitor-content-${index}`}
                      placeholder="Competitor's content..."
                      value={competitor.content}
                      onChange={(e) => updateCompetitor(index, 'content', e.target.value)}
                      disabled={isAnalyzing}
                      className="min-h-[100px]"
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Button 
            onClick={handleAnalyze} 
            disabled={isAnalyzing || !content.trim() || !options.primaryKeyword.trim()}
            className="w-full"
            size="lg"
          >
            {isAnalyzing ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Analyzing Competitive Intelligence...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Analyze Competitive Intelligence
              </>
            )}
          </Button>

          {isAnalyzing && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground text-center">
                Running comprehensive competitive analysis... {progress}%
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
          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Competitive Position Overview</span>
                <Badge variant="outline" className="text-sm">
                  {result.overview.competitorCount} Competitors Analyzed
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className={`text-4xl font-bold ${getPositionColor(result.overview.competitivePosition)}`}>
                    #{result.overview.competitivePosition}
                  </div>
                  <div className="text-sm text-muted-foreground">Competitive Position</div>
                  <Badge variant={result.overview.competitivePosition === 1 ? "default" : "secondary"} className="mt-1">
                    {result.overview.competitivePosition === 1 ? 'Leading' : 
                     result.overview.competitivePosition === 2 ? 'Competitive' : 'Behind'}
                  </Badge>
                </div>
                
                <div className="text-center">
                  <div className={`text-3xl font-bold ${getGapColor(result.overview.overallGap)}`}>
                    {result.overview.overallGap > 0 ? '+' : ''}{result.overview.overallGap}
                  </div>
                  <div className="text-sm text-muted-foreground">Overall Gap</div>
                  <div className="text-xs text-muted-foreground mt-1">vs Competitors</div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {result.overview.improvementPotential}%
                  </div>
                  <div className="text-sm text-muted-foreground">Improvement Potential</div>
                  <Progress value={result.overview.improvementPotential} className="mt-2 h-2" />
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">
                    {result.overview.priorityActions}
                  </div>
                  <div className="text-sm text-muted-foreground">Priority Actions</div>
                  <div className="text-xs text-muted-foreground mt-1">High Impact</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Analysis Tabs */}
          <Tabs defaultValue="benchmarks" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="benchmarks">
                <Target className="h-4 w-4 mr-1" />
                Benchmarks
              </TabsTrigger>
              <TabsTrigger value="competitors">
                <Users className="h-4 w-4 mr-1" />
                Competitors
              </TabsTrigger>
              <TabsTrigger value="gaps">
                <TrendingUp className="h-4 w-4 mr-1" />
                Gap Analysis
              </TabsTrigger>
              <TabsTrigger value="actions">
                <CheckCircle className="h-4 w-4 mr-1" />
                Action Plan
              </TabsTrigger>
              <TabsTrigger value="insights">
                <Eye className="h-4 w-4 mr-1" />
                Insights
              </TabsTrigger>
              <TabsTrigger value="quality">
                <Award className="h-4 w-4 mr-1" />
                Quality
              </TabsTrigger>
            </TabsList>

            <TabsContent value="benchmarks" className="space-y-4">
              {result.benchmarkReport && (
                <>
                  {/* Keyword Benchmarks */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Keyword Benchmarks</CardTitle>
                      <CardDescription>Exact keyword density targets based on competitor analysis</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {result.benchmarkReport.keywordBenchmarks.map((kb: any, index: number) => (
                          <div key={index} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">"{kb.keyword}"</span>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">
                                  Current: {kb.currentDensity}%
                                </Badge>
                                <Badge variant={kb.currentDensity >= kb.recommendedDensity ? "default" : "destructive"}>
                                  Target: {kb.recommendedDensity}%
                                </Badge>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">{kb.exactAction}</p>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                              <div className="flex items-center gap-1">
                                <span>Title:</span>
                                <Badge variant={kb.placements.title ? "default" : "secondary"} className="text-xs">
                                  {kb.placements.title ? "✓" : "✗"}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-1">
                                <span>Headings:</span>
                                <Badge variant="outline" className="text-xs">
                                  {kb.placements.headings}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-1">
                                <span>First ¶:</span>
                                <Badge variant={kb.placements.firstParagraph ? "default" : "secondary"} className="text-xs">
                                  {kb.placements.firstParagraph ? "✓" : "✗"}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-1">
                                <span>Last ¶:</span>
                                <Badge variant={kb.placements.lastParagraph ? "default" : "secondary"} className="text-xs">
                                  {kb.placements.lastParagraph ? "✓" : "✗"}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-1">
                                <span>Meta:</span>
                                <Badge variant={kb.placements.metaDescription ? "default" : "secondary"} className="text-xs">
                                  {kb.placements.metaDescription ? "✓" : "✗"}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Heading Benchmarks */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Heading Structure Benchmarks</CardTitle>
                      <CardDescription>Optimal heading distribution and keyword optimization</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {result.benchmarkReport.headingBenchmarks.map((hb: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline">{hb.level}</Badge>
                              <div>
                                <div className="font-medium">
                                  {hb.currentCount} → {hb.recommendedCount} headings
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {hb.keywordOptimized}/{hb.recommendedKeywordOptimized} keyword-optimized
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium">
                                {hb.exactActions[0]}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Content Benchmarks */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Content Benchmarks</CardTitle>
                      <CardDescription>Content length, readability, and topic coverage targets</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 border rounded">
                          <div className="text-center mb-2">
                            <div className="text-2xl font-bold">
                              {result.benchmarkReport.contentBenchmarks.wordCount.current.toLocaleString()}
                            </div>
                            <div className="text-sm text-muted-foreground">Current Words</div>
                          </div>
                          <div className="text-center mb-2">
                            <div className="text-lg font-medium text-blue-600">
                              {result.benchmarkReport.contentBenchmarks.wordCount.recommended.toLocaleString()}
                            </div>
                            <div className="text-sm text-muted-foreground">Target Words</div>
                          </div>
                          <p className="text-xs text-center text-muted-foreground">
                            {result.benchmarkReport.contentBenchmarks.wordCount.exactAction}
                          </p>
                        </div>

                        <div className="p-4 border rounded">
                          <div className="text-center mb-2">
                            <div className="text-2xl font-bold">
                              {result.benchmarkReport.contentBenchmarks.readabilityScore.current}
                            </div>
                            <div className="text-sm text-muted-foreground">Current Readability</div>
                          </div>
                          <div className="text-center mb-2">
                            <div className="text-lg font-medium text-blue-600">
                              {result.benchmarkReport.contentBenchmarks.readabilityScore.recommended}
                            </div>
                            <div className="text-sm text-muted-foreground">Target Readability</div>
                          </div>
                          <p className="text-xs text-center text-muted-foreground">
                            {result.benchmarkReport.contentBenchmarks.readabilityScore.exactAction}
                          </p>
                        </div>

                        <div className="p-4 border rounded">
                          <div className="text-center mb-2">
                            <div className="text-2xl font-bold">
                              {result.benchmarkReport.contentBenchmarks.topicCoverage.current}%
                            </div>
                            <div className="text-sm text-muted-foreground">Current Coverage</div>
                          </div>
                          <div className="text-center mb-2">
                            <div className="text-lg font-medium text-blue-600">
                              {result.benchmarkReport.contentBenchmarks.topicCoverage.recommended}%
                            </div>
                            <div className="text-sm text-muted-foreground">Target Coverage</div>
                          </div>
                          {result.benchmarkReport.contentBenchmarks.topicCoverage.missingTopics.length > 0 && (
                            <div className="mt-2">
                              <div className="text-xs font-medium mb-1">Missing Topics:</div>
                              <div className="flex flex-wrap gap-1">
                                {result.benchmarkReport.contentBenchmarks.topicCoverage.missingTopics.slice(0, 3).map((topic: string, i: number) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {topic}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            <TabsContent value="competitors" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Competitor Analysis Summary</CardTitle>
                  <CardDescription>Performance comparison with top competitors</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="p-4 border rounded">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {result.competitorAnalysis.summary.averageScore}
                          </div>
                          <div className="text-sm text-muted-foreground">Average Competitor Score</div>
                        </div>
                      </div>
                      <div className="p-4 border rounded">
                        <div className="text-center">
                          <div className="text-lg font-medium">Top Performer</div>
                          <div className="text-sm text-muted-foreground truncate">
                            {result.competitorAnalysis.summary.topPerformer.url}
                          </div>
                          <Badge variant="default" className="mt-1">
                            {result.competitorAnalysis.summary.topPerformer.analysis.overview.overallScore}/100
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {result.competitorAnalysis.individual.map((competitor: any, index: number) => (
                        <div key={index} className="p-4 border rounded">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <div className="font-medium truncate">{competitor.url}</div>
                              <div className="text-sm text-muted-foreground">
                                Overall Score: {competitor.overallScore}/100
                              </div>
                            </div>
                            <Badge variant={getScoreBadgeVariant(competitor.overallScore)}>
                              {competitor.overallScore >= 80 ? 'Strong' :
                               competitor.overallScore >= 60 ? 'Good' : 'Weak'}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                            <div className="text-center">
                              <div className="font-medium">{competitor.keyMetrics.wordCount.toLocaleString()}</div>
                              <div className="text-xs text-muted-foreground">Words</div>
                            </div>
                            <div className="text-center">
                              <div className="font-medium">{competitor.keyMetrics.keywordDensity}%</div>
                              <div className="text-xs text-muted-foreground">Keyword Density</div>
                            </div>
                            <div className="text-center">
                              <div className="font-medium">{competitor.keyMetrics.headingCount}</div>
                              <div className="text-xs text-muted-foreground">Headings</div>
                            </div>
                            <div className="text-center">
                              <div className="font-medium">{competitor.keyMetrics.metaScore}</div>
                              <div className="text-xs text-muted-foreground">Meta Score</div>
                            </div>
                          </div>

                          {competitor.keyStrengths.length > 0 && (
                            <div>
                              <div className="text-sm font-medium mb-1">Key Strengths:</div>
                              <div className="flex flex-wrap gap-1">
                                {competitor.keyStrengths.map((strength: string, i: number) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {strength}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="gaps" className="space-y-4">
              {result.benchmarkReport && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-red-600">Critical Gaps</CardTitle>
                      <CardDescription>High-priority areas needing immediate attention</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {result.benchmarkReport.gapAnalysis.criticalGaps.length > 0 ? (
                          result.benchmarkReport.gapAnalysis.criticalGaps.map((gap: any, index: number) => (
                            <div key={index} className="p-3 border border-red-200 rounded">
                              <div className="font-medium text-sm">{gap.metric}</div>
                              <div className="text-xs text-muted-foreground mb-2">
                                Current: {gap.currentValue} | Target: {gap.recommendedTarget}
                              </div>
                              <div className="text-xs">{gap.exactAction}</div>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="destructive" className="text-xs">
                                  {gap.priority.toUpperCase()}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  Impact: {gap.impact}/100
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No critical gaps identified</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-blue-600">Opportunities</CardTitle>
                      <CardDescription>Areas with high improvement potential</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {result.benchmarkReport.gapAnalysis.opportunities.length > 0 ? (
                          result.benchmarkReport.gapAnalysis.opportunities.map((opp: any, index: number) => (
                            <div key={index} className="p-3 border border-blue-200 rounded">
                              <div className="font-medium text-sm">{opp.metric}</div>
                              <div className="text-xs text-muted-foreground mb-2">
                                Current: {opp.currentValue} | Potential: {opp.topPerformer}
                              </div>
                              <div className="text-xs">{opp.exactAction}</div>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="secondary" className="text-xs">
                                  {opp.priority.toUpperCase()}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  Impact: {opp.impact}/100
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No opportunities identified</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-green-600">Strengths</CardTitle>
                      <CardDescription>Areas where you outperform competitors</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {result.benchmarkReport.gapAnalysis.strengths.length > 0 ? (
                          result.benchmarkReport.gapAnalysis.strengths.map((strength: any, index: number) => (
                            <div key={index} className="p-3 border border-green-200 rounded">
                              <div className="font-medium text-sm">{strength.metric}</div>
                              <div className="text-xs text-muted-foreground mb-2">
                                Your Score: {strength.currentValue} | Competitor Avg: {strength.competitorAverage}
                              </div>
                              <div className="text-xs">{strength.exactAction}</div>
                              <Badge variant="default" className="text-xs mt-2">
                                STRENGTH
                              </Badge>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No competitive strengths identified</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="actions" className="space-y-4">
              {result.benchmarkReport && (
                <Card>
                  <CardHeader>
                    <CardTitle>Prioritized Action Plan</CardTitle>
                    <CardDescription>Step-by-step optimization roadmap with exact targets</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {result.benchmarkReport.actionPlan.map((action: any, index: number) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="font-medium mb-1">{action.action}</div>
                              <div className="text-sm text-muted-foreground mb-2">
                                Target: {action.target}
                              </div>
                              <div className="text-sm text-blue-600">
                                Expected Impact: {action.expectedImpact}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Badge variant={
                                action.priority === 'high' ? 'destructive' :
                                action.priority === 'medium' ? 'secondary' : 'outline'
                              }>
                                {action.priority.toUpperCase()}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {action.timeline}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Step {index + 1} of {result.benchmarkReport.actionPlan.length}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

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

            <TabsContent value="quality" className="space-y-4">
              {result.currentAnalysis.qualityAnalysis && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Content Quality Analysis</span>
                        <div className="flex items-center gap-2">
                          <Badge variant={getScoreBadgeVariant(result.currentAnalysis.qualityAnalysis.overallScore)} className="text-lg px-3 py-1">
                            {result.currentAnalysis.qualityAnalysis.qualityGrade}
                          </Badge>
                          <span className="text-2xl font-bold">
                            {result.currentAnalysis.qualityAnalysis.overallScore}/100
                          </span>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {result.currentAnalysis.qualityAnalysis.readability.readabilityScore}
                          </div>
                          <div className="text-sm text-muted-foreground">Readability</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Grade: {result.currentAnalysis.qualityAnalysis.readability.averageGrade}
                          </div>
                        </div>

                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {result.currentAnalysis.qualityAnalysis.structure.structureScore}
                          </div>
                          <div className="text-sm text-muted-foreground">Structure</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {result.currentAnalysis.qualityAnalysis.structure.paragraphCount} paragraphs
                          </div>
                        </div>

                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {result.currentAnalysis.qualityAnalysis.optimization.optimizationScore}
                          </div>
                          <div className="text-sm text-muted-foreground">Optimization</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {result.currentAnalysis.qualityAnalysis.optimization.keywordDensity}% density
                          </div>
                        </div>

                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">
                            {result.currentAnalysis.seoMetrics.overview.userExperience}
                          </div>
                          <div className="text-sm text-muted-foreground">User Experience</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Overall UX score
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-green-600">Quality Strengths</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {result.currentAnalysis.qualityAnalysis.strengths.length > 0 ? (
                          <ul className="space-y-2">
                            {result.currentAnalysis.qualityAnalysis.strengths.map((strength: string, index: number) => (
                              <li key={index} className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <span className="text-sm">{strength}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground">No quality strengths identified</p>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-red-600">Quality Issues</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {result.currentAnalysis.qualityAnalysis.weaknesses.length > 0 ? (
                          <ul className="space-y-2">
                            {result.currentAnalysis.qualityAnalysis.weaknesses.map((weakness: string, index: number) => (
                              <li key={index} className="flex items-start gap-2">
                                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                                <span className="text-sm">{weakness}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground">No quality issues identified</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>

          {/* Recommendations Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Top Recommendations</CardTitle>
              <CardDescription>Prioritized actions for maximum competitive advantage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {result.recommendations.slice(0, 10).map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-2 p-2 border rounded">
                    <div className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-xs font-medium">
                      {index + 1}
                    </div>
                    <span className="text-sm">{recommendation}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
