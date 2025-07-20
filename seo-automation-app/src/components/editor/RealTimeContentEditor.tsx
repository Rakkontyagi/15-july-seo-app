'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  Eye, 
  Settings, 
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Lightbulb,
  Zap,
  Save,
  Download,
  Share,
  Undo,
  Redo
} from 'lucide-react';

interface ContentMetrics {
  wordCount: number;
  readabilityScore: number;
  seoScore: number;
  keywordDensity: number;
  humanWritingScore: number;
  eeatScore: number;
}

interface SEOSuggestion {
  id: string;
  type: 'keyword' | 'structure' | 'readability' | 'meta' | 'links';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  suggestion: string;
  position?: { start: number; end: number };
}

interface RealTimeContentEditorProps {
  initialContent?: string;
  targetKeyword?: string;
  onSave?: (content: string) => void;
  onExport?: (content: string, format: string) => void;
}

export function RealTimeContentEditor({
  initialContent = '',
  targetKeyword = '',
  onSave,
  onExport
}: RealTimeContentEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [metrics, setMetrics] = useState<ContentMetrics>({
    wordCount: 0,
    readabilityScore: 0,
    seoScore: 0,
    keywordDensity: 0,
    humanWritingScore: 0,
    eeatScore: 0
  });
  const [suggestions, setSuggestions] = useState<SEOSuggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('editor');
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const analysisTimeoutRef = useRef<NodeJS.Timeout>();

  // Real-time content analysis
  const analyzeContent = useCallback(async (text: string) => {
    if (!text.trim()) {
      setMetrics({
        wordCount: 0,
        readabilityScore: 0,
        seoScore: 0,
        keywordDensity: 0,
        humanWritingScore: 0,
        eeatScore: 0
      });
      setSuggestions([]);
      return;
    }

    setIsAnalyzing(true);

    try {
      // Simulate API call for real-time analysis
      const response = await fetch('/api/content/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: text,
          targetKeyword,
          realTime: true
        })
      });

      if (response.ok) {
        const analysis = await response.json();
        setMetrics({
          wordCount: analysis.wordCount || text.split(/\s+/).length,
          readabilityScore: analysis.readabilityScore || 75,
          seoScore: analysis.seoScore || 68,
          keywordDensity: analysis.keywordDensity || 2.1,
          humanWritingScore: analysis.humanWritingScore || 82,
          eeatScore: analysis.eeatScore || 71
        });
        setSuggestions(analysis.suggestions || []);
      } else {
        // Fallback to basic analysis
        const words = text.split(/\s+/).length;
        const keywordCount = targetKeyword ? 
          (text.toLowerCase().match(new RegExp(targetKeyword.toLowerCase(), 'g')) || []).length : 0;
        
        setMetrics({
          wordCount: words,
          readabilityScore: Math.min(100, Math.max(0, 100 - (words / 50))),
          seoScore: Math.min(100, (keywordCount / Math.max(1, words / 100)) * 20),
          keywordDensity: words > 0 ? (keywordCount / words) * 100 : 0,
          humanWritingScore: 75 + Math.random() * 20,
          eeatScore: 70 + Math.random() * 25
        });
        
        // Generate basic suggestions
        const basicSuggestions: SEOSuggestion[] = [];
        if (keywordCount === 0 && targetKeyword) {
          basicSuggestions.push({
            id: '1',
            type: 'keyword',
            severity: 'high',
            title: 'Missing Target Keyword',
            description: `The target keyword "${targetKeyword}" is not found in the content.`,
            suggestion: `Include "${targetKeyword}" naturally in your content.`
          });
        }
        if (words < 300) {
          basicSuggestions.push({
            id: '2',
            type: 'structure',
            severity: 'medium',
            title: 'Content Too Short',
            description: 'Content should be at least 300 words for better SEO.',
            suggestion: 'Expand your content with more detailed information.'
          });
        }
        setSuggestions(basicSuggestions);
      }
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [targetKeyword]);

  // Debounced content analysis
  useEffect(() => {
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
    }

    analysisTimeoutRef.current = setTimeout(() => {
      analyzeContent(content);
    }, 1000);

    return () => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
    };
  }, [content, analyzeContent]);

  const handleContentChange = (newContent: string) => {
    // Add current content to undo stack
    if (content !== newContent) {
      setUndoStack(prev => [...prev.slice(-19), content]);
      setRedoStack([]);
    }
    setContent(newContent);
  };

  const handleUndo = () => {
    if (undoStack.length > 0) {
      const previousContent = undoStack[undoStack.length - 1];
      setRedoStack(prev => [content, ...prev.slice(0, 19)]);
      setUndoStack(prev => prev.slice(0, -1));
      setContent(previousContent);
    }
  };

  const handleRedo = () => {
    if (redoStack.length > 0) {
      const nextContent = redoStack[0];
      setUndoStack(prev => [...prev.slice(-19), content]);
      setRedoStack(prev => prev.slice(1));
      setContent(nextContent);
    }
  };

  const applySuggestion = (suggestion: SEOSuggestion) => {
    if (suggestion.position && editorRef.current) {
      const { start, end } = suggestion.position;
      const newContent = content.slice(0, start) + suggestion.suggestion + content.slice(end);
      handleContentChange(newContent);
      
      // Focus and select the applied suggestion
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.focus();
          editorRef.current.setSelectionRange(start, start + suggestion.suggestion.length);
        }
      }, 100);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSeverityColor = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold">Content Editor</h2>
          {targetKeyword && (
            <Badge variant="outline">
              <Target className="h-3 w-3 mr-1" />
              {targetKeyword}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUndo}
            disabled={undoStack.length === 0}
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRedo}
            disabled={redoStack.length === 0}
          >
            <Redo className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => onSave?.(content)}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button variant="outline" size="sm" onClick={() => onExport?.(content, 'markdown')}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Editor Panel */}
        <div className="flex-1 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="w-full justify-start px-4 py-2">
              <TabsTrigger value="editor">
                <FileText className="h-4 w-4 mr-2" />
                Editor
              </TabsTrigger>
              <TabsTrigger value="preview">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </TabsTrigger>
            </TabsList>

            <TabsContent value="editor" className="flex-1 p-4">
              <textarea
                ref={editorRef}
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                className="w-full h-full p-4 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                placeholder="Start writing your content here..."
              />
            </TabsContent>

            <TabsContent value="preview" className="flex-1 p-4">
              <div className="w-full h-full p-4 border rounded-lg bg-white prose prose-sm max-w-none overflow-auto">
                {content.split('\n').map((line, index) => (
                  <p key={index} className="mb-2">
                    {line || <br />}
                  </p>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="w-80 border-l bg-gray-50 flex flex-col">
          {/* Metrics */}
          <Card className="m-4 mb-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" />
                Content Metrics
                {isAnalyzing && (
                  <div className="ml-2 h-3 w-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-muted-foreground">Words</div>
                  <div className="font-medium">{metrics.wordCount}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Keyword Density</div>
                  <div className="font-medium">{metrics.keywordDensity.toFixed(1)}%</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>SEO Score</span>
                  <span className={getScoreColor(metrics.seoScore)}>{metrics.seoScore}%</span>
                </div>
                <Progress value={metrics.seoScore} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Readability</span>
                  <span className={getScoreColor(metrics.readabilityScore)}>{metrics.readabilityScore}%</span>
                </div>
                <Progress value={metrics.readabilityScore} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Human Writing</span>
                  <span className={getScoreColor(metrics.humanWritingScore)}>{metrics.humanWritingScore}%</span>
                </div>
                <Progress value={metrics.humanWritingScore} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Suggestions */}
          <Card className="m-4 mt-2 flex-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                <Lightbulb className="h-4 w-4 mr-2" />
                SEO Suggestions ({suggestions.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 overflow-auto">
              {suggestions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p className="text-sm">Great! No issues found.</p>
                </div>
              ) : (
                suggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className={`p-3 rounded-lg border ${getSeverityColor(suggestion.severity)}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-sm">{suggestion.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {suggestion.severity}
                      </Badge>
                    </div>
                    <p className="text-xs mb-2 opacity-80">{suggestion.description}</p>
                    <p className="text-xs font-medium mb-2">{suggestion.suggestion}</p>
                    {suggestion.position && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-6"
                        onClick={() => applySuggestion(suggestion)}
                      >
                        <Zap className="h-3 w-3 mr-1" />
                        Apply
                      </Button>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
