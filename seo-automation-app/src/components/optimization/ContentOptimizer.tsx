'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Zap, 
  Target, 
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  Search,
  Globe,
  FileText,
  BarChart3,
  Users,
  Clock,
  RefreshCw
} from 'lucide-react';

interface OptimizationSuggestion {
  id: string;
  category: 'seo' | 'performance' | 'accessibility' | 'content';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  currentValue?: string;
  recommendedValue?: string;
  applied: boolean;
}

interface OptimizationResults {
  url: string;
  overallScore: number;
  seoScore: number;
  performanceScore: number;
  accessibilityScore: number;
  contentScore: number;
  suggestions: OptimizationSuggestion[];
  isAnalyzing: boolean;
}

export function ContentOptimizer() {
  const [url, setUrl] = useState('');
  const [targetKeyword, setTargetKeyword] = useState('');
  const [results, setResults] = useState<OptimizationResults | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const handleAnalyze = async () => {
    if (!url.trim()) return;

    setResults({
      url,
      overallScore: 0,
      seoScore: 0,
      performanceScore: 0,
      accessibilityScore: 0,
      contentScore: 0,
      suggestions: [],
      isAnalyzing: true
    });

    // Simulate analysis
    await new Promise(resolve => setTimeout(resolve, 3000));

    const mockSuggestions: OptimizationSuggestion[] = [
      {
        id: '1',
        category: 'seo',
        priority: 'high',
        title: 'Missing Meta Description',
        description: 'Your page is missing a meta description, which is crucial for search engine rankings.',
        impact: 'High impact on click-through rates from search results',
        effort: 'low',
        currentValue: 'None',
        recommendedValue: 'Add a compelling 150-160 character meta description',
        applied: false
      },
      {
        id: '2',
        category: 'seo',
        priority: 'high',
        title: 'Optimize Title Tag',
        description: 'Your title tag could be optimized for better keyword targeting.',
        impact: 'Direct impact on search rankings and CTR',
        effort: 'low',
        currentValue: 'Generic Page Title',
        recommendedValue: `Include "${targetKeyword}" in title tag`,
        applied: false
      },
      {
        id: '3',
        category: 'performance',
        priority: 'medium',
        title: 'Optimize Images',
        description: 'Several images are not optimized and are slowing down page load time.',
        impact: 'Improves page speed and user experience',
        effort: 'medium',
        currentValue: '2.3s load time',
        recommendedValue: 'Compress images to reduce to <1.5s',
        applied: false
      },
      {
        id: '4',
        category: 'content',
        priority: 'medium',
        title: 'Improve Content Length',
        description: 'Content is shorter than recommended for this topic.',
        impact: 'Better search rankings for competitive keywords',
        effort: 'high',
        currentValue: '450 words',
        recommendedValue: 'Expand to 800-1200 words',
        applied: false
      },
      {
        id: '5',
        category: 'accessibility',
        priority: 'low',
        title: 'Add Alt Text to Images',
        description: 'Some images are missing alt text for screen readers.',
        impact: 'Improves accessibility and SEO',
        effort: 'low',
        currentValue: '3 images missing alt text',
        recommendedValue: 'Add descriptive alt text to all images',
        applied: false
      }
    ];

    setResults({
      url,
      overallScore: 76,
      seoScore: 68,
      performanceScore: 82,
      accessibilityScore: 74,
      contentScore: 79,
      suggestions: mockSuggestions,
      isAnalyzing: false
    });
  };

  const handleApplySuggestion = (suggestionId: string) => {
    if (!results) return;

    setResults({
      ...results,
      suggestions: results.suggestions.map(s =>
        s.id === suggestionId ? { ...s, applied: true } : s
      )
    });
  };

  const filteredSuggestions = results?.suggestions.filter(s =>
    activeCategory === 'all' || s.category === activeCategory
  ) || [];

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'seo': return <Search className="h-4 w-4" />;
      case 'performance': return <Zap className="h-4 w-4" />;
      case 'accessibility': return <Users className="h-4 w-4" />;
      case 'content': return <FileText className="h-4 w-4" />;
      default: return <BarChart3 className="h-4 w-4" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const categories = [
    { id: 'all', label: 'All Categories', count: filteredSuggestions.length },
    { id: 'seo', label: 'SEO', count: results?.suggestions.filter(s => s.category === 'seo').length || 0 },
    { id: 'performance', label: 'Performance', count: results?.suggestions.filter(s => s.category === 'performance').length || 0 },
    { id: 'content', label: 'Content', count: results?.suggestions.filter(s => s.category === 'content').length || 0 },
    { id: 'accessibility', label: 'Accessibility', count: results?.suggestions.filter(s => s.category === 'accessibility').length || 0 }
  ];

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="h-5 w-5 mr-2" />
            Content Optimizer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2">
                URL to Optimize *
              </label>
              <Input
                type="url"
                placeholder="https://example.com/page"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Target Keyword (Optional)
              </label>
              <Input
                placeholder="e.g., content marketing"
                value={targetKeyword}
                onChange={(e) => setTargetKeyword(e.target.value)}
              />
            </div>
          </div>
          
          <Button 
            onClick={handleAnalyze}
            disabled={!url.trim() || (results?.isAnalyzing || false)}
            className="w-full"
          >
            {results?.isAnalyzing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Analyze & Optimize
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {results && (
        <>
          {/* Scores Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Optimization Scores
                </span>
                <div className={`text-2xl font-bold ${getScoreColor(results.overallScore)}`}>
                  {results.overallScore}%
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>SEO</span>
                    <span className={getScoreColor(results.seoScore)}>
                      {results.seoScore}%
                    </span>
                  </div>
                  <Progress value={results.seoScore} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Performance</span>
                    <span className={getScoreColor(results.performanceScore)}>
                      {results.performanceScore}%
                    </span>
                  </div>
                  <Progress value={results.performanceScore} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Content</span>
                    <span className={getScoreColor(results.contentScore)}>
                      {results.contentScore}%
                    </span>
                  </div>
                  <Progress value={results.contentScore} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Accessibility</span>
                    <span className={getScoreColor(results.accessibilityScore)}>
                      {results.accessibilityScore}%
                    </span>
                  </div>
                  <Progress value={results.accessibilityScore} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lightbulb className="h-5 w-5 mr-2" />
                Optimization Suggestions ({results.suggestions.length})
              </CardTitle>
              
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={activeCategory === category.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveCategory(category.id)}
                  >
                    {getCategoryIcon(category.id)}
                    <span className="ml-1">{category.label}</span>
                    {category.count > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {category.count}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredSuggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className={`p-4 border rounded-lg ${suggestion.applied ? 'bg-green-50 border-green-200' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        {getCategoryIcon(suggestion.category)}
                        <h4 className="font-medium">{suggestion.title}</h4>
                        <Badge className={getPriorityColor(suggestion.priority)}>
                          {suggestion.priority}
                        </Badge>
                        {suggestion.applied && (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Applied
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">
                      {suggestion.description}
                    </p>
                    
                    <div className="grid gap-3 md:grid-cols-2 mb-3">
                      {suggestion.currentValue && (
                        <div>
                          <div className="text-xs font-medium text-muted-foreground">Current</div>
                          <div className="text-sm">{suggestion.currentValue}</div>
                        </div>
                      )}
                      {suggestion.recommendedValue && (
                        <div>
                          <div className="text-xs font-medium text-muted-foreground">Recommended</div>
                          <div className="text-sm font-medium">{suggestion.recommendedValue}</div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span>Impact: {suggestion.impact}</span>
                        <span>Effort: {suggestion.effort}</span>
                      </div>
                      
                      {!suggestion.applied && (
                        <Button
                          size="sm"
                          onClick={() => handleApplySuggestion(suggestion.id)}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Apply
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                
                {filteredSuggestions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <p>No suggestions in this category. Great job!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
