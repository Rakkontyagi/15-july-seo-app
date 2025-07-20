/**
 * Unified Content Generation Hook
 * Implements PM recommendations for frontend integration with unified workflow
 * Provides React hook for SEO-optimized content generation
 */

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

// Types
export interface ContentGenerationRequest {
  keyword: string;
  location: string;
  contentType?: 'service_page' | 'blog_post' | 'product_page' | 'landing_page';
  customizations?: {
    tone?: 'professional' | 'casual' | 'authoritative' | 'friendly';
    targetAudience?: 'business_owners' | 'consumers' | 'professionals' | 'general';
    wordCount?: number;
    industry?: string;
    companyName?: string;
    websiteUrl?: string;
  };
  options?: {
    includeImages?: boolean;
    includeInternalLinks?: boolean;
    includeOutboundLinks?: boolean;
    generateMetaTags?: boolean;
    optimizeForFeaturedSnippets?: boolean;
  };
}

export interface ContentGenerationResult {
  content: string;
  metaTags: {
    title: string;
    description: string;
    keywords: string[];
  };
  seoMetrics: {
    keywordDensity: number;
    targetDensity: number;
    densityAccuracy: number;
    headingOptimization: number;
    readabilityScore: number;
    overallScore: number;
    lsiKeywordsUsed: number;
    entitiesIntegrated: number;
  };
  benchmarks: {
    averageWordCount: number;
    averageHeadings: number;
    averageKeywordDensity: number;
    averageOptimizedHeadings: number;
    lsiKeywords: string[];
    entities: string[];
    variations: string[];
  };
  competitorAnalysis: {
    topCompetitors: Array<{
      url: string;
      title: string;
      wordCount: number;
      keywordDensity: number;
      headingCount: number;
      optimizedHeadings: number;
    }>;
    averageMetrics: {
      wordCount: number;
      keywordDensity: number;
      headingCount: number;
      optimizedHeadings: number;
    };
    insights: string[];
  };
  qualityAnalysis: {
    humanWritingScore: number;
    aiDetectionRisk: 'low' | 'medium' | 'high';
    eeAtScore: number;
    nlpFriendliness: number;
    grammarScore: number;
    overallQuality: number;
  };
  processingTime: number;
  generationId: string;
}

export interface GenerationProgress {
  stage: 'serp_analysis' | 'content_extraction' | 'benchmark_calculation' | 'content_generation' | 'validation' | 'completed';
  message: string;
  progress: number; // 0-100
  timeElapsed: number;
  estimatedTimeRemaining?: number;
}

export interface UseUnifiedContentGenerationReturn {
  generateContent: (request: ContentGenerationRequest) => Promise<ContentGenerationResult>;
  isGenerating: boolean;
  progress: GenerationProgress | null;
  result: ContentGenerationResult | null;
  error: string | null;
  reset: () => void;
  cancel: () => void;
}

export function useUnifiedContentGeneration(): UseUnifiedContentGenerationReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [result, setResult] = useState<ContentGenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const { toast } = useToast();

  const generateContent = useCallback(async (request: ContentGenerationRequest): Promise<ContentGenerationResult> => {
    // Reset state
    setIsGenerating(true);
    setProgress(null);
    setResult(null);
    setError(null);

    // Create abort controller for cancellation
    const controller = new AbortController();
    setAbortController(controller);

    const startTime = Date.now();

    try {
      // Validate request
      if (!request.keyword || !request.location) {
        throw new Error('Keyword and location are required');
      }

      // Start progress tracking
      setProgress({
        stage: 'serp_analysis',
        message: 'Analyzing search results and competitors...',
        progress: 10,
        timeElapsed: 0,
      });

      // Make API request
      const response = await fetch('/api/content/generate-optimized', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      // Update progress
      setProgress({
        stage: 'content_extraction',
        message: 'Extracting competitor content...',
        progress: 30,
        timeElapsed: Date.now() - startTime,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || `HTTP ${response.status}`);
      }

      // Update progress
      setProgress({
        stage: 'benchmark_calculation',
        message: 'Calculating SEO benchmarks...',
        progress: 50,
        timeElapsed: Date.now() - startTime,
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Content generation failed');
      }

      // Update progress
      setProgress({
        stage: 'content_generation',
        message: 'Generating optimized content...',
        progress: 70,
        timeElapsed: Date.now() - startTime,
      });

      // Simulate final progress steps
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setProgress({
        stage: 'validation',
        message: 'Validating content quality...',
        progress: 90,
        timeElapsed: Date.now() - startTime,
      });

      await new Promise(resolve => setTimeout(resolve, 300));

      setProgress({
        stage: 'completed',
        message: 'Content generation completed!',
        progress: 100,
        timeElapsed: Date.now() - startTime,
      });

      const generationResult = data.data as ContentGenerationResult;
      setResult(generationResult);

      // Show success toast
      toast({
        title: 'Content Generated Successfully!',
        description: `Generated ${generationResult.content.split(' ').length} words with ${generationResult.seoMetrics.overallScore.toFixed(1)}% SEO score`,
        variant: 'default',
      });

      return generationResult;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      
      // Handle specific error types
      if (errorMessage.includes('aborted')) {
        setError('Content generation was cancelled');
        toast({
          title: 'Generation Cancelled',
          description: 'Content generation was cancelled by user',
          variant: 'destructive',
        });
      } else if (errorMessage.includes('Rate limit exceeded')) {
        setError('Rate limit exceeded. Please try again later.');
        toast({
          title: 'Rate Limit Exceeded',
          description: 'Too many requests. Please wait a moment before trying again.',
          variant: 'destructive',
        });
      } else if (errorMessage.includes('No competitors found')) {
        setError('No competitors found for the given keyword. Try a different keyword.');
        toast({
          title: 'No Competitors Found',
          description: 'Unable to find competitors for analysis. Try a different keyword.',
          variant: 'destructive',
        });
      } else {
        setError(errorMessage);
        toast({
          title: 'Generation Failed',
          description: errorMessage,
          variant: 'destructive',
        });
      }

      console.error('Content generation error:', err);
      throw err;

    } finally {
      setIsGenerating(false);
      setAbortController(null);
    }
  }, [toast]);

  const reset = useCallback(() => {
    setIsGenerating(false);
    setProgress(null);
    setResult(null);
    setError(null);
    setAbortController(null);
  }, []);

  const cancel = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setIsGenerating(false);
      setProgress(null);
      setError('Content generation was cancelled');
      setAbortController(null);
      
      toast({
        title: 'Generation Cancelled',
        description: 'Content generation was cancelled',
        variant: 'default',
      });
    }
  }, [abortController, toast]);

  return {
    generateContent,
    isGenerating,
    progress,
    result,
    error,
    reset,
    cancel,
  };
}

// Helper function to format progress time
export function formatProgressTime(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${remainingSeconds}s`;
}

// Helper function to get progress color
export function getProgressColor(progress: number): string {
  if (progress < 30) return 'bg-blue-500';
  if (progress < 60) return 'bg-yellow-500';
  if (progress < 90) return 'bg-orange-500';
  return 'bg-green-500';
}

// Helper function to estimate remaining time
export function estimateRemainingTime(progress: number, timeElapsed: number): number {
  if (progress <= 0) return 0;
  const totalEstimatedTime = (timeElapsed / progress) * 100;
  return Math.max(0, totalEstimatedTime - timeElapsed);
}
