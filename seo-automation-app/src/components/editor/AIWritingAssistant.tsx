'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { createComponentLogger } from '@/lib/logging/logger';
import { 
  Brain, 
  Lightbulb, 
  Wand2,
  RefreshCw,
  Copy,
  Check,
  Sparkles,
  MessageSquare,
  PenTool,
  Target,
  TrendingUp
} from 'lucide-react';

interface AISuggestion {
  id: string;
  type: 'rewrite' | 'expand' | 'improve' | 'optimize';
  title: string;
  original: string;
  suggestion: string;
  reasoning: string;
  confidence: number;
}

interface AIWritingAssistantProps {
  content: string;
  selectedText?: string;
  targetKeyword?: string;
  onApplySuggestion?: (suggestion: string) => void;
  onInsertText?: (text: string) => void;
}

export function AIWritingAssistant({
  content,
  selectedText = '',
  targetKeyword = '',
  onApplySuggestion,
  onInsertText
}: AIWritingAssistantProps) {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [activeMode, setActiveMode] = useState<'suggestions' | 'chat' | 'templates'>('suggestions');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const promptRef = useRef<HTMLTextAreaElement>(null);

  const generateSuggestions = async (text: string = selectedText || content) => {
    if (!text.trim()) return;

    setIsGenerating(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockSuggestions: AISuggestion[] = [
        {
          id: '1',
          type: 'improve',
          title: 'Enhance Clarity',
          original: text.substring(0, 100) + '...',
          suggestion: 'Search engine optimization (SEO) is a crucial digital marketing strategy that helps websites rank higher in search results, ultimately driving more organic traffic and improving online visibility.',
          reasoning: 'Made the sentence more specific and added context about benefits',
          confidence: 92
        },
        {
          id: '2',
          type: 'optimize',
          title: 'SEO Optimization',
          original: text.substring(0, 100) + '...',
          suggestion: `When implementing ${targetKeyword || 'SEO strategies'}, it's essential to focus on both technical optimization and content quality to achieve sustainable rankings in search engine results.`,
          reasoning: 'Integrated target keyword naturally while maintaining readability',
          confidence: 88
        },
        {
          id: '3',
          type: 'expand',
          title: 'Add Detail',
          original: text.substring(0, 100) + '...',
          suggestion: text + ' This approach involves multiple components including keyword research, on-page optimization, technical SEO improvements, and content strategy development. Each element plays a vital role in improving search engine visibility.',
          reasoning: 'Added specific details and examples to make content more comprehensive',
          confidence: 85
        }
      ];
      
      setSuggestions(mockSuggestions);
    } catch (error) {
      const logger = createComponentLogger('AIWritingAssistant');
      logger.error('Failed to generate suggestions:', { error: error instanceof Error ? error.message : error });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCustomPrompt = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const customSuggestion: AISuggestion = {
        id: Date.now().toString(),
        type: 'rewrite',
        title: 'Custom Request',
        original: selectedText || 'Selected content',
        suggestion: `Based on your request: "${prompt}", here's an improved version that addresses your specific needs while maintaining SEO best practices and readability.`,
        reasoning: `Generated based on your custom prompt: "${prompt}"`,
        confidence: 90
      };
      
      setSuggestions(prev => [customSuggestion, ...prev]);
      setPrompt('');
    } catch (error) {
      const logger = createComponentLogger('AIWritingAssistant');
      logger.error('Failed to process custom prompt:', { error: error instanceof Error ? error.message : error });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      const logger = createComponentLogger('AIWritingAssistant');
      logger.error('Failed to copy:', { error: error instanceof Error ? error.message : error });
    }
  };

  const getTypeIcon = (type: AISuggestion['type']) => {
    switch (type) {
      case 'rewrite': return <PenTool className="h-4 w-4" />;
      case 'expand': return <TrendingUp className="h-4 w-4" />;
      case 'improve': return <Sparkles className="h-4 w-4" />;
      case 'optimize': return <Target className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: AISuggestion['type']) => {
    switch (type) {
      case 'rewrite': return 'bg-blue-100 text-blue-800';
      case 'expand': return 'bg-green-100 text-green-800';
      case 'improve': return 'bg-purple-100 text-purple-800';
      case 'optimize': return 'bg-orange-100 text-orange-800';
    }
  };

  const templates = [
    {
      id: 'intro',
      title: 'Introduction Paragraph',
      description: 'Generate an engaging introduction',
      prompt: 'Write an engaging introduction paragraph for this topic'
    },
    {
      id: 'conclusion',
      title: 'Conclusion',
      description: 'Create a compelling conclusion',
      prompt: 'Write a compelling conclusion that summarizes the key points'
    },
    {
      id: 'bullet-points',
      title: 'Bullet Points',
      description: 'Convert text to bullet points',
      prompt: 'Convert this content into clear, concise bullet points'
    },
    {
      id: 'call-to-action',
      title: 'Call to Action',
      description: 'Generate a persuasive CTA',
      prompt: 'Create a persuasive call-to-action for this content'
    }
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Brain className="h-5 w-5 mr-2" />
          AI Writing Assistant
        </CardTitle>
        
        <div className="flex space-x-1">
          <Button
            variant={activeMode === 'suggestions' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveMode('suggestions')}
          >
            <Lightbulb className="h-4 w-4 mr-1" />
            Suggestions
          </Button>
          <Button
            variant={activeMode === 'chat' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveMode('chat')}
          >
            <MessageSquare className="h-4 w-4 mr-1" />
            Chat
          </Button>
          <Button
            variant={activeMode === 'templates' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveMode('templates')}
          >
            <Wand2 className="h-4 w-4 mr-1" />
            Templates
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {activeMode === 'suggestions' && (
          <>
            <div className="flex space-x-2">
              <Button
                onClick={() => generateSuggestions()}
                disabled={isGenerating || !content.trim()}
                className="flex-1"
              >
                {isGenerating ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                {isGenerating ? 'Generating...' : 'Get AI Suggestions'}
              </Button>
            </div>

            {selectedText && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm font-medium text-blue-800 mb-1">Selected Text:</div>
                <div className="text-sm text-blue-700">"{selectedText.substring(0, 100)}..."</div>
              </div>
            )}

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {suggestions.map((suggestion) => (
                <div key={suggestion.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(suggestion.type)}
                      <span className="font-medium text-sm">{suggestion.title}</span>
                      <Badge className={getTypeColor(suggestion.type)}>
                        {suggestion.type}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Badge variant="outline" className="text-xs">
                        {suggestion.confidence}% confidence
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded text-sm mb-2">
                    {suggestion.suggestion}
                  </div>
                  
                  <div className="text-xs text-muted-foreground mb-3">
                    <strong>Why this helps:</strong> {suggestion.reasoning}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => onApplySuggestion?.(suggestion.suggestion)}
                    >
                      Apply
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(suggestion.suggestion, suggestion.id)}
                    >
                      {copiedId === suggestion.id ? (
                        <Check className="h-3 w-3 mr-1" />
                      ) : (
                        <Copy className="h-3 w-3 mr-1" />
                      )}
                      {copiedId === suggestion.id ? 'Copied' : 'Copy'}
                    </Button>
                  </div>
                </div>
              ))}
              
              {suggestions.length === 0 && !isGenerating && (
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Click "Get AI Suggestions" to see recommendations</p>
                </div>
              )}
            </div>
          </>
        )}

        {activeMode === 'chat' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Ask AI to help with your content:
              </label>
              <Textarea
                ref={promptRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., 'Make this paragraph more engaging' or 'Add more technical details about SEO'"
                className="min-h-[80px]"
              />
            </div>
            
            <Button
              onClick={handleCustomPrompt}
              disabled={isGenerating || !prompt.trim()}
              className="w-full"
            >
              {isGenerating ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <MessageSquare className="h-4 w-4 mr-2" />
              )}
              {isGenerating ? 'Processing...' : 'Send Request'}
            </Button>
          </div>
        )}

        {activeMode === 'templates' && (
          <div className="grid gap-3">
            {templates.map((template) => (
              <div
                key={template.id}
                className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                onClick={() => {
                  setPrompt(template.prompt);
                  setActiveMode('chat');
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-sm">{template.title}</h4>
                    <p className="text-xs text-muted-foreground">{template.description}</p>
                  </div>
                  <Wand2 className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
