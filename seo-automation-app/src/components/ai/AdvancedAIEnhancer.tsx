'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  Sparkles, 
  Wand2,
  Target,
  TrendingUp,
  Eye,
  Users,
  Globe,
  Zap,
  RefreshCw,
  Copy,
  Check,
  ArrowRight,
  Lightbulb,
  BarChart3,
  MessageSquare,
  FileText,
  Settings
} from 'lucide-react';

interface AIEnhancement {
  id: string;
  type: 'tone' | 'style' | 'seo' | 'readability' | 'engagement' | 'structure';
  title: string;
  description: string;
  original: string;
  enhanced: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  metrics: {
    readabilityImprovement: number;
    seoScoreImprovement: number;
    engagementPotential: number;
  };
}

interface AIEnhancerProps {
  content: string;
  targetAudience?: string;
  contentGoal?: string;
  onContentUpdate?: (content: string) => void;
}

export function AdvancedAIEnhancer({ 
  content, 
  targetAudience = 'general', 
  contentGoal = 'inform',
  onContentUpdate 
}: AIEnhancerProps) {
  const [enhancements, setEnhancements] = useState<AIEnhancement[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('enhance');
  const [selectedEnhancements, setSelectedEnhancements] = useState<string[]>([]);
  const [customPrompt, setCustomPrompt] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const promptRef = useRef<HTMLTextAreaElement>(null);

  const enhancementTypes = [
    {
      id: 'tone',
      name: 'Tone Optimization',
      description: 'Adjust tone to match your target audience',
      icon: <MessageSquare className="h-4 w-4" />,
      color: 'bg-blue-100 text-blue-800'
    },
    {
      id: 'style',
      name: 'Writing Style',
      description: 'Improve writing style and flow',
      icon: <FileText className="h-4 w-4" />,
      color: 'bg-purple-100 text-purple-800'
    },
    {
      id: 'seo',
      name: 'SEO Enhancement',
      description: 'Optimize for search engines',
      icon: <Target className="h-4 w-4" />,
      color: 'bg-green-100 text-green-800'
    },
    {
      id: 'readability',
      name: 'Readability',
      description: 'Make content easier to read',
      icon: <Eye className="h-4 w-4" />,
      color: 'bg-orange-100 text-orange-800'
    },
    {
      id: 'engagement',
      name: 'Engagement',
      description: 'Increase reader engagement',
      icon: <Users className="h-4 w-4" />,
      color: 'bg-pink-100 text-pink-800'
    },
    {
      id: 'structure',
      name: 'Structure',
      description: 'Improve content organization',
      icon: <BarChart3 className="h-4 w-4" />,
      color: 'bg-indigo-100 text-indigo-800'
    }
  ];

  const handleAnalyzeContent = async () => {
    if (!content.trim()) return;

    setIsAnalyzing(true);
    setEnhancements([]);

    try {
      // Simulate AI analysis
      await new Promise(resolve => setTimeout(resolve, 3000));

      const mockEnhancements: AIEnhancement[] = [
        {
          id: '1',
          type: 'tone',
          title: 'Adjust Tone for Target Audience',
          description: 'Make the content more conversational and engaging for your audience',
          original: 'Search engine optimization is a complex process that requires technical expertise.',
          enhanced: 'SEO might seem complicated at first, but with the right approach, you can master it step by step.',
          confidence: 92,
          impact: 'high',
          metrics: {
            readabilityImprovement: 25,
            seoScoreImprovement: 8,
            engagementPotential: 35
          }
        },
        {
          id: '2',
          type: 'seo',
          title: 'Keyword Integration',
          description: 'Naturally integrate target keywords for better SEO performance',
          original: 'This guide will help you understand the basics.',
          enhanced: 'This comprehensive SEO guide will help you understand the fundamentals of search engine optimization.',
          confidence: 88,
          impact: 'high',
          metrics: {
            readabilityImprovement: 5,
            seoScoreImprovement: 40,
            engagementPotential: 15
          }
        },
        {
          id: '3',
          type: 'readability',
          title: 'Simplify Complex Sentences',
          description: 'Break down complex sentences for better readability',
          original: 'The implementation of advanced SEO strategies requires a comprehensive understanding of search engine algorithms, user behavior patterns, and content optimization techniques.',
          enhanced: 'Advanced SEO strategies need three key things: understanding search algorithms, knowing user behavior, and mastering content optimization. Each element builds on the others.',
          confidence: 85,
          impact: 'medium',
          metrics: {
            readabilityImprovement: 45,
            seoScoreImprovement: 12,
            engagementPotential: 28
          }
        },
        {
          id: '4',
          type: 'engagement',
          title: 'Add Engaging Elements',
          description: 'Include questions and interactive elements to boost engagement',
          original: 'Content marketing is important for businesses.',
          enhanced: 'Why do some businesses see 3x more leads from content marketing? The secret lies in creating content that truly connects with your audience.',
          confidence: 90,
          impact: 'high',
          metrics: {
            readabilityImprovement: 20,
            seoScoreImprovement: 15,
            engagementPotential: 50
          }
        },
        {
          id: '5',
          type: 'structure',
          title: 'Improve Content Structure',
          description: 'Add clear headings and better organization',
          original: 'Here are some tips for better SEO...',
          enhanced: '## 5 Proven SEO Strategies That Actually Work\n\nReady to boost your search rankings? Here are the strategies that deliver real results:\n\n### 1. Keyword Research That Matters',
          confidence: 87,
          impact: 'medium',
          metrics: {
            readabilityImprovement: 30,
            seoScoreImprovement: 25,
            engagementPotential: 22
          }
        }
      ];

      setEnhancements(mockEnhancements);
    } catch (error) {
      console.error('Enhancement analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCustomEnhancement = async () => {
    if (!customPrompt.trim()) return;

    setIsAnalyzing(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const customEnhancement: AIEnhancement = {
        id: Date.now().toString(),
        type: 'style',
        title: 'Custom Enhancement',
        description: `Applied your custom request: "${customPrompt}"`,
        original: content.substring(0, 100) + '...',
        enhanced: `Enhanced content based on your request: "${customPrompt}". The content has been optimized to meet your specific requirements while maintaining quality and readability.`,
        confidence: 85,
        impact: 'medium',
        metrics: {
          readabilityImprovement: 20,
          seoScoreImprovement: 15,
          engagementPotential: 25
        }
      };

      setEnhancements(prev => [customEnhancement, ...prev]);
      setCustomPrompt('');
    } catch (error) {
      console.error('Custom enhancement failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleToggleEnhancement = (enhancementId: string) => {
    setSelectedEnhancements(prev =>
      prev.includes(enhancementId)
        ? prev.filter(id => id !== enhancementId)
        : [...prev, enhancementId]
    );
  };

  const handleApplyEnhancements = () => {
    const selectedItems = enhancements.filter(e => selectedEnhancements.includes(e.id));
    if (selectedItems.length === 0) return;

    // In a real app, this would apply the enhancements to the content
    const enhancedContent = selectedItems.reduce((acc, enhancement) => {
      return acc.replace(enhancement.original, enhancement.enhanced);
    }, content);

    onContentUpdate?.(enhancedContent);
    setSelectedEnhancements([]);
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getImpactColor = (impact: 'high' | 'medium' | 'low') => {
    switch (impact) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
    }
  };

  const getTypeConfig = (type: string) => {
    return enhancementTypes.find(t => t.id === type) || enhancementTypes[0];
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="h-5 w-5 mr-2" />
            Advanced AI Content Enhancer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="enhance">
                <Sparkles className="h-4 w-4 mr-2" />
                Auto Enhance
              </TabsTrigger>
              <TabsTrigger value="custom">
                <Wand2 className="h-4 w-4 mr-2" />
                Custom Request
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="enhance" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">AI-Powered Content Enhancement</h3>
                  <p className="text-sm text-muted-foreground">
                    Automatically improve your content across multiple dimensions
                  </p>
                </div>
                <Button
                  onClick={handleAnalyzeContent}
                  disabled={isAnalyzing || !content.trim()}
                >
                  {isAnalyzing ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Brain className="h-4 w-4 mr-2" />
                  )}
                  {isAnalyzing ? 'Analyzing...' : 'Analyze Content'}
                </Button>
              </div>

              {/* Enhancement Types */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {enhancementTypes.map((type) => (
                  <div key={type.id} className="p-3 border rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      {type.icon}
                      <span className="font-medium text-sm">{type.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{type.description}</p>
                  </div>
                ))}
              </div>

              {/* Enhancements Results */}
              {enhancements.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Enhancement Suggestions ({enhancements.length})</h4>
                    {selectedEnhancements.length > 0 && (
                      <Button onClick={handleApplyEnhancements}>
                        <Zap className="h-4 w-4 mr-2" />
                        Apply Selected ({selectedEnhancements.length})
                      </Button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {enhancements.map((enhancement) => {
                      const typeConfig = getTypeConfig(enhancement.type);
                      const isSelected = selectedEnhancements.includes(enhancement.id);

                      return (
                        <div
                          key={enhancement.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                            isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-muted/50'
                          }`}
                          onClick={() => handleToggleEnhancement(enhancement.id)}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              {typeConfig.icon}
                              <h5 className="font-medium">{enhancement.title}</h5>
                              <Badge className={typeConfig.color}>
                                {typeConfig.name}
                              </Badge>
                              <Badge className={getImpactColor(enhancement.impact)}>
                                {enhancement.impact} impact
                              </Badge>
                            </div>
                            <div className="text-sm font-medium text-green-600">
                              {enhancement.confidence}% confidence
                            </div>
                          </div>

                          <p className="text-sm text-muted-foreground mb-3">
                            {enhancement.description}
                          </p>

                          <div className="space-y-3">
                            <div>
                              <div className="text-xs font-medium text-muted-foreground mb-1">Original:</div>
                              <div className="text-sm bg-red-50 p-2 rounded border-l-2 border-red-200">
                                {enhancement.original}
                              </div>
                            </div>

                            <div className="flex items-center">
                              <ArrowRight className="h-4 w-4 text-muted-foreground mx-2" />
                            </div>

                            <div>
                              <div className="text-xs font-medium text-muted-foreground mb-1">Enhanced:</div>
                              <div className="text-sm bg-green-50 p-2 rounded border-l-2 border-green-200">
                                {enhancement.enhanced}
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 grid grid-cols-3 gap-4 text-xs">
                            <div>
                              <div className="text-muted-foreground">Readability</div>
                              <div className="font-medium text-green-600">
                                +{enhancement.metrics.readabilityImprovement}%
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">SEO Score</div>
                              <div className="font-medium text-blue-600">
                                +{enhancement.metrics.seoScoreImprovement}%
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Engagement</div>
                              <div className="font-medium text-purple-600">
                                +{enhancement.metrics.engagementPotential}%
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleEnhancement(enhancement.id)}
                                className="rounded"
                              />
                              <span className="text-sm">Select for application</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(enhancement.enhanced, enhancement.id);
                              }}
                            >
                              {copiedId === enhancement.id ? (
                                <Check className="h-3 w-3 mr-1" />
                              ) : (
                                <Copy className="h-3 w-3 mr-1" />
                              )}
                              {copiedId === enhancement.id ? 'Copied' : 'Copy'}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="custom" className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Custom Enhancement Request</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Describe how you'd like to enhance your content, and AI will apply your specific requirements.
                </p>
                
                <Textarea
                  ref={promptRef}
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="e.g., 'Make this more technical and add specific examples' or 'Simplify for beginners and add more analogies'"
                  className="min-h-[100px] mb-4"
                />

                <Button
                  onClick={handleCustomEnhancement}
                  disabled={isAnalyzing || !customPrompt.trim()}
                  className="w-full"
                >
                  {isAnalyzing ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4 mr-2" />
                  )}
                  {isAnalyzing ? 'Enhancing...' : 'Apply Custom Enhancement'}
                </Button>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Quick Enhancement Prompts</h4>
                {[
                  'Make this more conversational and engaging',
                  'Add more technical details and examples',
                  'Simplify for beginners with analogies',
                  'Make it more persuasive and action-oriented',
                  'Add more data and statistics',
                  'Improve the storytelling elements'
                ].map((prompt, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setCustomPrompt(prompt)}
                    className="w-full justify-start"
                  >
                    <Lightbulb className="h-3 w-3 mr-2" />
                    {prompt}
                  </Button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Target Audience</label>
                  <select className="w-full px-3 py-2 border rounded-md bg-background">
                    <option value="general">General Audience</option>
                    <option value="beginners">Beginners</option>
                    <option value="professionals">Professionals</option>
                    <option value="experts">Experts</option>
                    <option value="students">Students</option>
                    <option value="business">Business Leaders</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Content Goal</label>
                  <select className="w-full px-3 py-2 border rounded-md bg-background">
                    <option value="inform">Inform</option>
                    <option value="persuade">Persuade</option>
                    <option value="entertain">Entertain</option>
                    <option value="educate">Educate</option>
                    <option value="convert">Convert</option>
                    <option value="engage">Engage</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Enhancement Focus</label>
                  <div className="space-y-2">
                    {enhancementTypes.map((type) => (
                      <label key={type.id} className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span className="text-sm">{type.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
