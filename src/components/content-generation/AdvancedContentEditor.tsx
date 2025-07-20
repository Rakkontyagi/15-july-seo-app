/**
 * Advanced Content Editor
 * Completes Story 1.1 - Rich text editing with SEO suggestions
 * Real-time SEO analysis and content optimization
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Edit3, 
  Eye, 
  Save, 
  Download, 
  Share2, 
  Target, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Search,
  Hash,
  FileText,
  BarChart3
} from 'lucide-react';

// Types
interface SEOAnalysis {
  overallScore: number;
  keywordDensity: number;
  readabilityScore: number;
  headingStructure: number;
  metaOptimization: number;
  suggestions: SEOSuggestion[];
}

interface SEOSuggestion {
  type: 'keyword' | 'heading' | 'readability' | 'meta' | 'structure';
  severity: 'low' | 'medium' | 'high';
  message: string;
  suggestion: string;
  position?: number;
}

interface ContentMetrics {
  wordCount: number;
  characterCount: number;
  paragraphCount: number;
  sentenceCount: number;
  averageWordsPerSentence: number;
  readingTime: number;
}

interface AdvancedContentEditorProps {
  initialContent: string;
  keyword: string;
  contentType: string;
  onSave: (content: string, metadata: any) => void;
  onExport: (format: string) => void;
}

export function AdvancedContentEditor({
  initialContent,
  keyword,
  contentType,
  onSave,
  onExport
}: AdvancedContentEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [seoAnalysis, setSeoAnalysis] = useState<SEOAnalysis | null>(null);
  const [contentMetrics, setContentMetrics] = useState<ContentMetrics | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('editor');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Real-time SEO analysis
  const analyzeContent = useCallback(async (text: string) => {
    if (!text.trim()) return;

    setIsAnalyzing(true);
    
    try {
      // Simulate SEO analysis (in production, this would call actual SEO analysis service)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const analysis = performSEOAnalysis(text, keyword);
      const metrics = calculateContentMetrics(text);
      
      setSeoAnalysis(analysis);
      setContentMetrics(metrics);
    } catch (error) {
      console.error('SEO analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [keyword]);

  // Debounced content analysis
  useEffect(() => {
    const timer = setTimeout(() => {
      analyzeContent(content);
    }, 2000); // Analyze 2 seconds after user stops typing

    return () => clearTimeout(timer);
  }, [content, analyzeContent]);

  // Track unsaved changes
  useEffect(() => {
    setHasUnsavedChanges(content !== initialContent);
  }, [content, initialContent]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
  };

  const handleSave = () => {
    onSave(content, {
      seoAnalysis,
      contentMetrics,
      lastModified: new Date().toISOString(),
    });
    setHasUnsavedChanges(false);
  };

  const applySuggestion = (suggestion: SEOSuggestion) => {
    // Apply SEO suggestion to content
    let newContent = content;
    
    switch (suggestion.type) {
      case 'keyword':
        // Add keyword naturally to content
        newContent = insertKeywordNaturally(content, keyword, suggestion.position);
        break;
      case 'heading':
        // Improve heading structure
        newContent = improveHeadingStructure(content);
        break;
      case 'readability':
        // Improve readability
        newContent = improveReadability(content);
        break;
    }
    
    setContent(newContent);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Editor Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold">Content Editor</h2>
          {hasUnsavedChanges && (
            <Badge variant="outline" className="text-orange-600">
              Unsaved Changes
            </Badge>
          )}
          {seoAnalysis && (
            <Badge variant={seoAnalysis.overallScore >= 80 ? 'default' : 'secondary'}>
              SEO Score: {seoAnalysis.overallScore}/100
            </Badge>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => onExport('html')}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button onClick={handleSave} disabled={!hasUnsavedChanges}>
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex">
        {/* Content Editor */}
        <div className="flex-1 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="editor" className="flex items-center gap-2">
                <Edit3 className="w-4 h-4" />
                Editor
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Preview
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="editor" className="flex-1 p-4">
              <textarea
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                className="w-full h-full p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Start writing your content..."
                style={{ minHeight: '500px' }}
              />
            </TabsContent>
            
            <TabsContent value="preview" className="flex-1 p-4">
              <div className="prose max-w-none h-full overflow-auto border rounded-lg p-4">
                <div dangerouslySetInnerHTML={{ __html: formatContentForPreview(content) }} />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* SEO Analysis Sidebar */}
        <div className="w-80 border-l bg-gray-50 overflow-auto">
          <div className="p-4 space-y-6">
            {/* SEO Score Overview */}
            {seoAnalysis && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Target className="w-5 h-5" />
                    SEO Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Overall Score</span>
                      <span className="font-medium">{seoAnalysis.overallScore}/100</span>
                    </div>
                    <Progress value={seoAnalysis.overallScore} className="h-2" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Keyword Density</span>
                        <span>{seoAnalysis.keywordDensity.toFixed(1)}%</span>
                      </div>
                      <Progress value={seoAnalysis.keywordDensity * 20} className="h-1" />
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Readability</span>
                        <span>{seoAnalysis.readabilityScore}/100</span>
                      </div>
                      <Progress value={seoAnalysis.readabilityScore} className="h-1" />
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Headings</span>
                        <span>{seoAnalysis.headingStructure}/100</span>
                      </div>
                      <Progress value={seoAnalysis.headingStructure} className="h-1" />
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Meta</span>
                        <span>{seoAnalysis.metaOptimization}/100</span>
                      </div>
                      <Progress value={seoAnalysis.metaOptimization} className="h-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Content Metrics */}
            {contentMetrics && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BarChart3 className="w-5 h-5" />
                    Content Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Word Count</span>
                    <span className="font-medium">{contentMetrics.wordCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Reading Time</span>
                    <span className="font-medium">{contentMetrics.readingTime} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Paragraphs</span>
                    <span className="font-medium">{contentMetrics.paragraphCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Words/Sentence</span>
                    <span className="font-medium">{contentMetrics.averageWordsPerSentence.toFixed(1)}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* SEO Suggestions */}
            {seoAnalysis && seoAnalysis.suggestions.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Lightbulb className="w-5 h-5" />
                    SEO Suggestions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {seoAnalysis.suggestions.map((suggestion, index) => (
                    <Alert key={index} className="p-3">
                      <div className="flex items-start gap-2">
                        {suggestion.severity === 'high' ? (
                          <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
                        ) : suggestion.severity === 'medium' ? (
                          <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5" />
                        )}
                        <div className="flex-1 space-y-2">
                          <AlertDescription className="text-sm">
                            {suggestion.message}
                          </AlertDescription>
                          <div className="text-xs text-muted-foreground">
                            {suggestion.suggestion}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 text-xs"
                            onClick={() => applySuggestion(suggestion)}
                          >
                            Apply Fix
                          </Button>
                        </div>
                      </div>
                    </Alert>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Analysis Loading */}
            {isAnalyzing && (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-center space-y-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-sm text-muted-foreground">Analyzing content...</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function performSEOAnalysis(content: string, keyword: string): SEOAnalysis {
  const words = content.toLowerCase().split(/\s+/);
  const keywordCount = words.filter(word => word.includes(keyword.toLowerCase())).length;
  const keywordDensity = (keywordCount / words.length) * 100;
  
  const headings = content.match(/^#+\s/gm) || [];
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  const suggestions: SEOSuggestion[] = [];
  
  // Keyword density suggestions
  if (keywordDensity < 1) {
    suggestions.push({
      type: 'keyword',
      severity: 'high',
      message: 'Keyword density is too low',
      suggestion: `Add "${keyword}" more naturally throughout the content`,
    });
  } else if (keywordDensity > 3) {
    suggestions.push({
      type: 'keyword',
      severity: 'medium',
      message: 'Keyword density might be too high',
      suggestion: 'Reduce keyword usage to avoid over-optimization',
    });
  }
  
  // Heading structure suggestions
  if (headings.length < 3) {
    suggestions.push({
      type: 'heading',
      severity: 'medium',
      message: 'Add more headings for better structure',
      suggestion: 'Break content into sections with descriptive headings',
    });
  }
  
  // Readability suggestions
  const avgWordsPerSentence = words.length / sentences.length;
  if (avgWordsPerSentence > 20) {
    suggestions.push({
      type: 'readability',
      severity: 'medium',
      message: 'Sentences are too long',
      suggestion: 'Break long sentences into shorter ones for better readability',
    });
  }
  
  return {
    overallScore: Math.min(100, Math.max(0, 
      (keywordDensity >= 1 && keywordDensity <= 3 ? 25 : 15) +
      (headings.length >= 3 ? 25 : 15) +
      (avgWordsPerSentence <= 20 ? 25 : 15) +
      (words.length >= 300 ? 25 : 15)
    )),
    keywordDensity,
    readabilityScore: Math.max(0, 100 - (avgWordsPerSentence - 15) * 2),
    headingStructure: Math.min(100, headings.length * 20),
    metaOptimization: 75, // Placeholder
    suggestions,
  };
}

function calculateContentMetrics(content: string): ContentMetrics {
  const words = content.split(/\s+/).filter(word => word.length > 0);
  const characters = content.length;
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  return {
    wordCount: words.length,
    characterCount: characters,
    paragraphCount: paragraphs.length,
    sentenceCount: sentences.length,
    averageWordsPerSentence: words.length / sentences.length,
    readingTime: Math.ceil(words.length / 200), // Assuming 200 WPM reading speed
  };
}

function formatContentForPreview(content: string): string {
  // Convert markdown-like syntax to HTML
  return content
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(.*)$/gm, '<p>$1</p>')
    .replace(/<p><\/p>/g, '')
    .replace(/<p>(<h[1-6]>.*<\/h[1-6]>)<\/p>/g, '$1');
}

function insertKeywordNaturally(content: string, keyword: string, position?: number): string {
  // Simple implementation - in production, this would use NLP
  const sentences = content.split('.');
  if (sentences.length > 1) {
    const targetSentence = Math.floor(sentences.length / 2);
    sentences[targetSentence] = sentences[targetSentence].replace(/\b(\w+)\b/, `$1 ${keyword}`);
    return sentences.join('.');
  }
  return content;
}

function improveHeadingStructure(content: string): string {
  // Simple implementation - add headings where appropriate
  const paragraphs = content.split('\n\n');
  if (paragraphs.length > 3) {
    paragraphs[1] = `## Key Points\n\n${paragraphs[1]}`;
    if (paragraphs.length > 5) {
      paragraphs[Math.floor(paragraphs.length / 2)] = `## Important Details\n\n${paragraphs[Math.floor(paragraphs.length / 2)]}`;
    }
  }
  return paragraphs.join('\n\n');
}

function improveReadability(content: string): string {
  // Simple implementation - break long sentences
  return content.replace(/([.!?])\s*([A-Z])/g, '$1\n\n$2');
}
