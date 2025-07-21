/**
 * Content Generation Dashboard
 * Implements Story 1.1 - Complete Content Generation UI Integration
 * Main interface for content generation with real-time progress tracking
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  MapPin, 
  FileText, 
  Settings, 
  Play, 
  Pause, 
  Square,
  Download,
  Eye,
  Edit,
  Sparkles,
  Clock,
  Target,
  TrendingUp
} from 'lucide-react';

import { useAppStore } from '@/lib/store/app-store';
import { contentGenerationOptimizer } from '@/lib/performance/content-generation-optimizer';
import { sseManager } from '@/lib/realtime/sse-manager';
import { performanceMonitor } from '@/lib/monitoring/performance-monitor';

// Types
interface ContentGenerationForm {
  keyword: string;
  location: string;
  contentType: 'blog-post' | 'service-page' | 'product-description';
  tone: string;
  targetAudience: string;
  wordCount: number;
}

interface GenerationProgress {
  stage: string;
  label: string;
  currentStep: number;
  totalSteps: number;
  percentage: number;
  estimatedTimeRemaining: number;
  error?: string;
}

export function ContentGenerationDashboard() {
  // State management
  const { user, subscription, usageStats, canGenerateContent } = useAppStore();
  const [form, setForm] = useState<ContentGenerationForm>({
    keyword: '',
    location: 'United States',
    contentType: 'blog-post',
    tone: 'professional',
    targetAudience: 'general',
    wordCount: 2000,
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [contentMetadata, setContentMetadata] = useState<any>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Real-time progress tracking
  useEffect(() => {
    if (isGenerating && generatedContent === null) {
      const handleProgressMessage = (message: any) => {
        if (message.type === 'progress') {
          setProgress(message.data);
        } else if (message.type === 'complete') {
          setGeneratedContent(message.data.content);
          setContentMetadata(message.data.metadata);
          setIsGenerating(false);
          setProgress(null);
        } else if (message.type === 'error') {
          setErrors(prev => [...prev, message.data.error]);
          setIsGenerating(false);
          setProgress(null);
        }
      };

      const handleProgressError = (error: Event) => {
        setErrors(prev => [...prev, 'Connection error during content generation']);
        setIsGenerating(false);
        setProgress(null);
      };

      // Create SSE connection for progress tracking
      sseManager.createConnection(
        user?.id || 'anonymous',
        `generation-${Date.now()}`,
        handleProgressMessage,
        handleProgressError
      );
    }
  }, [isGenerating, user?.id, generatedContent]);

  // Keyword suggestions
  useEffect(() => {
    if (form.keyword.length > 2) {
      // Simulate keyword suggestions
      const mockSuggestions = [
        `${form.keyword} guide`,
        `${form.keyword} tips`,
        `${form.keyword} best practices`,
        `${form.keyword} tutorial`,
        `${form.keyword} strategy`,
      ];
      setSuggestions(mockSuggestions);
    } else {
      setSuggestions([]);
    }
  }, [form.keyword]);

  // Form handlers
  const handleInputChange = (field: keyof ContentGenerationForm, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors([]); // Clear errors on form change
  };

  const validateForm = (): boolean => {
    const newErrors: string[] = [];

    if (!form.keyword.trim()) {
      newErrors.push('Keyword is required');
    }
    if (form.keyword.length < 3) {
      newErrors.push('Keyword must be at least 3 characters');
    }
    if (!form.location) {
      newErrors.push('Location is required');
    }
    if (form.wordCount < 300 || form.wordCount > 5000) {
      newErrors.push('Word count must be between 300 and 5000');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleGenerate = async () => {
    if (!validateForm()) return;
    if (!canGenerateContent) {
      setErrors(['Usage limit reached. Please upgrade your plan.']);
      return;
    }

    setIsGenerating(true);
    setGeneratedContent(null);
    setContentMetadata(null);
    setProgress({
      stage: 'initializing',
      label: 'Initializing content generation...',
      currentStep: 1,
      totalSteps: 6,
      percentage: 0,
      estimatedTimeRemaining: 300000, // 5 minutes
    });

    try {
      // Track generation start
      const startTime = Date.now();
      
      // Start content generation
      const result = await contentGenerationOptimizer.generateContent({
        keyword: form.keyword,
        location: form.location,
        contentType: form.contentType,
        customizations: {
          tone: form.tone,
          targetAudience: form.targetAudience,
          wordCount: form.wordCount,
        },
      });

      setGeneratedContent(result.content);
      setContentMetadata(result.metadata);
      setIsGenerating(false);
      setProgress(null);

      // Track successful generation
      performanceMonitor.trackContentGeneration({
        contentId: `content-${Date.now()}`,
        keyword: form.keyword,
        duration: Date.now() - startTime,
        success: true,
        timestamp: Date.now(),
        userId: user?.id,
      });

    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Content generation failed']);
      setIsGenerating(false);
      setProgress(null);

      // Track failed generation
      performanceMonitor.trackContentGeneration({
        contentId: `content-${Date.now()}`,
        keyword: form.keyword,
        duration: Date.now() - Date.now(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
        userId: user?.id,
      });
    }
  };

  const handleCancel = () => {
    setIsGenerating(false);
    setProgress(null);
    // Close SSE connection
    sseManager.closeAllConnections();
  };

  const handleExport = (format: string) => {
    if (!generatedContent) return;

    const blob = new Blob([generatedContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${form.keyword.replace(/\s+/g, '-')}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content Generation</h1>
          <p className="text-muted-foreground">
            Create high-quality, SEO-optimized content with AI assistance
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="outline">
            {usageStats?.current_usage || 0} / {usageStats?.usage_limit || 0} used
          </Badge>
          <Badge variant={subscription?.tier === 'enterprise' ? 'default' : 'secondary'}>
            {subscription?.tier || 'free'}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Generation Form */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Content Settings
              </CardTitle>
              <CardDescription>
                Configure your content generation parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Keyword Input */}
              <div className="space-y-2">
                <Label htmlFor="keyword">Target Keyword *</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="keyword"
                    placeholder="Enter your target keyword..."
                    value={form.keyword}
                    onChange={(e) => handleInputChange('keyword', e.target.value)}
                    className="pl-10"
                  />
                </div>
                {suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {suggestions.map((suggestion, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                        onClick={() => handleInputChange('keyword', suggestion)}
                      >
                        {suggestion}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Target Location *</Label>
                <Select value={form.location} onValueChange={(value) => handleInputChange('location', value)}>
                  <SelectTrigger>
                    <MapPin className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="United States">United States</SelectItem>
                    <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                    <SelectItem value="Canada">Canada</SelectItem>
                    <SelectItem value="Australia">Australia</SelectItem>
                    <SelectItem value="Germany">Germany</SelectItem>
                    <SelectItem value="France">France</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Content Type */}
              <div className="space-y-2">
                <Label htmlFor="contentType">Content Type *</Label>
                <Select value={form.contentType} onValueChange={(value) => handleInputChange('contentType', value)}>
                  <SelectTrigger>
                    <FileText className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blog-post">Blog Post</SelectItem>
                    <SelectItem value="service-page">Service Page</SelectItem>
                    <SelectItem value="product-description">Product Description</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Advanced Settings */}
              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-medium">Advanced Settings</h4>
                
                {/* Tone */}
                <div className="space-y-2">
                  <Label htmlFor="tone">Tone</Label>
                  <Select value={form.tone} onValueChange={(value) => handleInputChange('tone', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="authoritative">Authoritative</SelectItem>
                      <SelectItem value="conversational">Conversational</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Target Audience */}
                <div className="space-y-2">
                  <Label htmlFor="audience">Target Audience</Label>
                  <Select value={form.targetAudience} onValueChange={(value) => handleInputChange('targetAudience', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Audience</SelectItem>
                      <SelectItem value="beginners">Beginners</SelectItem>
                      <SelectItem value="professionals">Professionals</SelectItem>
                      <SelectItem value="experts">Experts</SelectItem>
                      <SelectItem value="business-owners">Business Owners</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Word Count */}
                <div className="space-y-2">
                  <Label htmlFor="wordCount">Target Word Count</Label>
                  <Input
                    id="wordCount"
                    type="number"
                    min="300"
                    max="5000"
                    value={form.wordCount}
                    onChange={(e) => handleInputChange('wordCount', parseInt(e.target.value) || 2000)}
                  />
                </div>
              </div>

              {/* Error Display */}
              {errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1">
                      {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !canGenerateContent}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Generate Content
                  </>
                )}
              </Button>

              {isGenerating && (
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="w-full"
                >
                  <Square className="w-4 h-4 mr-2" />
                  Cancel Generation
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Progress and Results */}
        <div className="lg:col-span-2">
          {/* Progress Tracking */}
          {progress && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Generation Progress
                </CardTitle>
                <CardDescription>
                  {progress.label}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Progress value={progress.percentage} className="w-full" />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Step {progress.currentStep} of {progress.totalSteps}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      ~{Math.round(progress.estimatedTimeRemaining / 1000)}s remaining
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Generated Content */}
          {generatedContent && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Generated Content
                    </CardTitle>
                    <CardDescription>
                      {contentMetadata?.wordCount} words • SEO Score: {contentMetadata?.seoScore}/100
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Select onValueChange={handleExport}>
                      <SelectTrigger className="w-32">
                        <Download className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Export" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="html">HTML</SelectItem>
                        <SelectItem value="markdown">Markdown</SelectItem>
                        <SelectItem value="docx">Word Doc</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm">
                    {generatedContent}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!isGenerating && !generatedContent && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Sparkles className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Ready to Generate Content</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Configure your settings and click "Generate Content" to create high-quality, SEO-optimized content.
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    SEO Optimized
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    High Quality
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Fast Generation
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
