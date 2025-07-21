'use client';

import { useState, useEffect } from 'react';
import { createComponentLogger } from '@/lib/logging/logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Target, 
  TrendingUp, 
  Eye, 
  Link,
  Hash,
  FileText,
  AlertTriangle,
  CheckCircle,
  Info,
  Lightbulb,
  Zap
} from 'lucide-react';

interface SEOAnalysis {
  overallScore: number;
  keywordAnalysis: {
    primaryKeyword: string;
    density: number;
    prominence: number;
    distribution: number;
    relatedKeywords: string[];
  };
  contentStructure: {
    headingStructure: { level: number; text: string; optimized: boolean }[];
    paragraphCount: number;
    averageParagraphLength: number;
    listCount: number;
  };
  readability: {
    fleschScore: number;
    averageSentenceLength: number;
    complexWords: number;
    grade: string;
  };
  technicalSEO: {
    wordCount: number;
    imageCount: number;
    linkCount: { internal: number; external: number };
    metaDescription: string;
    title: string;
  };
  suggestions: Array<{
    id: string;
    category: 'keyword' | 'structure' | 'readability' | 'technical';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    action: string;
  }>;
}

interface SEOAnalysisPanelProps {
  content: string;
  targetKeyword: string;
  onApplySuggestion?: (suggestionId: string) => void;
}

export function SEOAnalysisPanel({ content, targetKeyword, onApplySuggestion }: SEOAnalysisPanelProps) {
  const [analysis, setAnalysis] = useState<SEOAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (content.trim()) {
      analyzeContent();
    }
  }, [content, targetKeyword]);

  const analyzeContent = async () => {
    setIsAnalyzing(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock analysis data
      const words = content.split(/\s+/).length;
      const sentences = content.split(/[.!?]+/).length;
      const keywordMatches = content.toLowerCase().split(targetKeyword.toLowerCase()).length - 1;
      
      const mockAnalysis: SEOAnalysis = {
        overallScore: Math.min(100, Math.max(0, 60 + Math.random() * 30)),
        keywordAnalysis: {
          primaryKeyword: targetKeyword,
          density: words > 0 ? (keywordMatches / words) * 100 : 0,
          prominence: keywordMatches > 0 ? 85 : 0,
          distribution: keywordMatches > 0 ? 75 : 0,
          relatedKeywords: ['seo tips', 'search optimization', 'ranking factors']
        },
        contentStructure: {
          headingStructure: [
            { level: 1, text: 'Main Title', optimized: true },
            { level: 2, text: 'Section 1', optimized: false },
            { level: 2, text: 'Section 2', optimized: true }
          ],
          paragraphCount: Math.ceil(words / 100),
          averageParagraphLength: words > 0 ? Math.floor(words / Math.max(1, Math.ceil(words / 100))) : 0,
          listCount: (content.match(/^\s*[-*+]\s/gm) || []).length
        },
        readability: {
          fleschScore: Math.min(100, Math.max(0, 100 - (words / sentences) * 2)),
          averageSentenceLength: sentences > 0 ? words / sentences : 0,
          complexWords: Math.floor(words * 0.1),
          grade: '8th Grade'
        },
        technicalSEO: {
          wordCount: words,
          imageCount: (content.match(/!\[.*?\]\(.*?\)/g) || []).length,
          linkCount: {
            internal: (content.match(/\[.*?\]\(\/.*?\)/g) || []).length,
            external: (content.match(/\[.*?\]\(https?:\/\/.*?\)/g) || []).length
          },
          metaDescription: '',
          title: ''
        },
        suggestions: [
          {
            id: '1',
            category: 'keyword',
            priority: 'high',
            title: 'Improve Keyword Density',
            description: 'Your keyword density is below optimal range',
            action: 'Add 2-3 more instances of your target keyword naturally'
          },
          {
            id: '2',
            category: 'structure',
            priority: 'medium',
            title: 'Add More Subheadings',
            description: 'Break up long content with more H2 and H3 headings',
            action: 'Add subheadings every 200-300 words'
          },
          {
            id: '3',
            category: 'readability',
            priority: 'low',
            title: 'Simplify Complex Sentences',
            description: 'Some sentences are too long and complex',
            action: 'Break long sentences into shorter ones'
          }
        ]
      };
      
      setAnalysis(mockAnalysis);
    } catch (error) {
      const logger = createComponentLogger('SEOAnalysisPanel');
      logger.error('SEO analysis failed', { error: error instanceof Error ? error.message : error });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'keyword': return <Target className="h-4 w-4" />;
      case 'structure': return <FileText className="h-4 w-4" />;
      case 'readability': return <Eye className="h-4 w-4" />;
      case 'technical': return <Hash className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  if (!analysis) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-8">
          {isAnalyzing ? (
            <div className="text-center">
              <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Analyzing content...</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Start writing to see SEO analysis</p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            SEO Analysis
          </span>
          <div className={`text-2xl font-bold ${getScoreColor(analysis.overallScore)}`}>
            {Math.round(analysis.overallScore)}%
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="keywords">Keywords</TabsTrigger>
            <TabsTrigger value="structure">Structure</TabsTrigger>
            <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Word Count</div>
                <div className="text-lg font-semibold">{analysis.technicalSEO.wordCount}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Readability</div>
                <div className="text-lg font-semibold">{analysis.readability.grade}</div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Keyword Optimization</span>
                  <span className={getScoreColor(analysis.keywordAnalysis.prominence)}>
                    {Math.round(analysis.keywordAnalysis.prominence)}%
                  </span>
                </div>
                <Progress value={analysis.keywordAnalysis.prominence} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Content Structure</span>
                  <span className={getScoreColor(75)}>75%</span>
                </div>
                <Progress value={75} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Readability Score</span>
                  <span className={getScoreColor(analysis.readability.fleschScore)}>
                    {Math.round(analysis.readability.fleschScore)}%
                  </span>
                </div>
                <Progress value={analysis.readability.fleschScore} className="h-2" />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="keywords" className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Primary Keyword</h4>
              <Badge variant="outline" className="mb-3">
                <Target className="h-3 w-3 mr-1" />
                {analysis.keywordAnalysis.primaryKeyword}
              </Badge>
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Density</div>
                  <div className="font-medium">{analysis.keywordAnalysis.density.toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Prominence</div>
                  <div className="font-medium">{Math.round(analysis.keywordAnalysis.prominence)}%</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Distribution</div>
                  <div className="font-medium">{Math.round(analysis.keywordAnalysis.distribution)}%</div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Related Keywords</h4>
              <div className="flex flex-wrap gap-2">
                {analysis.keywordAnalysis.relatedKeywords.map((keyword, index) => (
                  <Badge key={index} variant="secondary">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="structure" className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Heading Structure</h4>
              <div className="space-y-2">
                {analysis.contentStructure.headingStructure.map((heading, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="flex items-center">
                      <span className="w-8 text-muted-foreground">H{heading.level}</span>
                      {heading.text}
                    </span>
                    {heading.optimized ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Paragraphs</div>
                <div className="font-medium">{analysis.contentStructure.paragraphCount}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Lists</div>
                <div className="font-medium">{analysis.contentStructure.listCount}</div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Links</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Internal</div>
                  <div className="font-medium">{analysis.technicalSEO.linkCount.internal}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">External</div>
                  <div className="font-medium">{analysis.technicalSEO.linkCount.external}</div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="suggestions" className="space-y-3">
            {analysis.suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className={`p-3 rounded-lg border ${getPriorityColor(suggestion.priority)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center">
                    {getCategoryIcon(suggestion.category)}
                    <h4 className="font-medium text-sm ml-2">{suggestion.title}</h4>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {suggestion.priority}
                  </Badge>
                </div>
                <p className="text-xs mb-2 opacity-80">{suggestion.description}</p>
                <p className="text-xs font-medium mb-2">{suggestion.action}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-6"
                  onClick={() => onApplySuggestion?.(suggestion.id)}
                >
                  <Zap className="h-3 w-3 mr-1" />
                  Apply Fix
                </Button>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
