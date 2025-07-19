// AI Content Generation API Endpoint

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceLogger } from '@/lib/logging/logger';
import { AIContentGenerator, ContentGenerationOptions } from '@/lib/ai/content-generator';
import { authenticateRequest } from '@/lib/auth/middleware';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { withErrorHandler } from '@/lib/middleware/error-handler';

const logger = createServiceLogger('content-generation-api');

// Request validation schema
const generateContentSchema = z.object({
  keyword: z.string()
    .min(1, 'Keyword is required')
    .max(100, 'Keyword must be less than 100 characters'),
  industry: z.string()
    .min(1, 'Industry is required')
    .max(50, 'Industry must be less than 50 characters'),
  targetAudience: z.string()
    .min(1, 'Target audience is required')
    .max(50, 'Target audience must be less than 50 characters'),
  tone: z.enum(['authoritative', 'conversational', 'academic', 'practical', 'thought-provoking'])
    .default('authoritative'),
  wordCount: z.number()
    .min(300, 'Word count must be at least 300')
    .max(5000, 'Word count must be less than 5000')
    .default(1500),
  competitorInsights: z.string().optional(),
  targetKeywordDensity: z.number()
    .min(0.5, 'Keyword density must be at least 0.5%')
    .max(5.0, 'Keyword density must be less than 5%')
    .optional(),
  lsiKeywords: z.array(z.string()).optional(),
  entities: z.array(z.object({
    name: z.string(),
    type: z.string()
  })).optional(),
  targetOptimizedHeadingsCount: z.number()
    .min(1, 'Must have at least 1 optimized heading')
    .max(10, 'Cannot have more than 10 optimized headings')
    .optional(),
  keywordVariations: z.array(z.string()).optional(),
  relatedKeywords: z.array(z.string()).optional(),
  comparisonCorpus: z.array(z.string()).optional(),
  potentialSubtopics: z.array(z.string()).optional(),
  contentId: z.string().optional(),
  sensitiveTopics: z.array(z.string()).optional()
});

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Authenticate request
    const authResult = await authenticateRequest(request);
    if (!authResult.user) {
      logger.warn('Unauthorized content generation attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = generateContentSchema.parse(body);

    logger.info('Content generation request received', {
      userId: authResult.user.id,
      keyword: validatedData.keyword,
      industry: validatedData.industry,
      wordCount: validatedData.wordCount
    });

    // Initialize AI content generator
    const contentGenerator = new AIContentGenerator();

    // Prepare generation options
    const options: ContentGenerationOptions = {
      keyword: validatedData.keyword,
      industry: validatedData.industry,
      targetAudience: validatedData.targetAudience,
      tone: validatedData.tone,
      wordCount: validatedData.wordCount,
      competitorInsights: validatedData.competitorInsights,
      targetKeywordDensity: validatedData.targetKeywordDensity,
      lsiKeywords: validatedData.lsiKeywords,
      entities: validatedData.entities,
      targetOptimizedHeadingsCount: validatedData.targetOptimizedHeadingsCount,
      keywordVariations: validatedData.keywordVariations,
      relatedKeywords: validatedData.relatedKeywords,
      comparisonCorpus: validatedData.comparisonCorpus,
      potentialSubtopics: validatedData.potentialSubtopics,
      contentId: validatedData.contentId,
      sensitiveTopics: validatedData.sensitiveTopics
    };

    // Generate content
    const result = await contentGenerator.generate(options);

    const processingTime = Date.now() - startTime;

    logger.info('Content generation completed successfully', {
      userId: authResult.user.id,
      keyword: validatedData.keyword,
      wordCount: result.wordCount,
      qualityScore: result.qualityAnalysis.overallScore,
      processingTime
    });

    // Return successful response
    return NextResponse.json({
      success: true,
      data: {
        content: result.content,
        wordCount: result.wordCount,
        qualityAnalysis: result.qualityAnalysis,
        humanWritingAnalysis: result.humanWritingAnalysis,
        eeatOptimization: result.eeatOptimization,
        userValueAnalysis: result.userValueAnalysis,
        authoritySignalAnalysis: result.authoritySignalAnalysis,
        nlpOptimizationIssues: result.nlpOptimizationIssues,
        contentBalanceIssues: result.contentBalanceIssues,
        uniquenessVerification: result.uniquenessVerification,
        topicalClusterCompletion: result.topicalClusterCompletion,
        factVerificationResults: result.factVerificationResults,
        sourceValidationResults: result.sourceValidationResults,
        contentAccuracyAnalysis: result.contentAccuracyAnalysis,
        hallucinationDetection: result.hallucinationDetection,
        expertReviewTrigger: result.expertReviewTrigger,
        contentVersion: result.contentVersion,
        timestamp: result.timestamp
      },
      metadata: {
        processingTime,
        model: 'gpt-4o',
        version: '1.0.0'
      }
    }, { status: 200 });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    logger.error('Content generation failed', {
      error: error.message,
      stack: error.stack,
      processingTime
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation Error',
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      }, { status: 400 });
    }

    if (error.message.includes('OPENAI_API_KEY')) {
      return NextResponse.json({
        error: 'Configuration Error',
        message: 'AI service is not properly configured'
      }, { status: 500 });
    }

    if (error.message.includes('Content quality below threshold')) {
      return NextResponse.json({
        error: 'Quality Error',
        message: 'Generated content did not meet quality standards. Please try again.'
      }, { status: 422 });
    }

    return NextResponse.json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred during content generation'
    }, { status: 500 });
  }
}

// GET endpoint for retrieving generation status or configuration
export async function GET(request: NextRequest) {
  try {
    // Authenticate request
    const authResult = await authenticateRequest(request);
    if (!authResult.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Return service status and configuration
    return NextResponse.json({
      status: 'operational',
      version: '1.0.0',
      capabilities: {
        maxWordCount: 5000,
        minWordCount: 300,
        supportedTones: ['authoritative', 'conversational', 'academic', 'practical', 'thought-provoking'],
        supportedAnalysis: [
          'quality-analysis',
          'human-writing-patterns',
          'eeat-optimization',
          'user-value-analysis',
          'authority-signals',
          'nlp-optimization',
          'uniqueness-verification',
          'fact-verification',
          'source-validation',
          'content-accuracy',
          'hallucination-detection',
          'expert-review-trigger'
        ]
      },
      limits: {
        keywordDensity: { min: 0.5, max: 5.0 },
        optimizedHeadings: { min: 1, max: 10 }
      }
    });

  } catch (error) {
    logger.error('Error retrieving content generation status', { error: error.message });
    return NextResponse.json({
      error: 'Internal Server Error'
    }, { status: 500 });
  }
}
