// AI Content Generation API Endpoint

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceLogger } from '@/lib/logging/logger';
import { AIContentGenerator, ContentGenerationOptions } from '@/lib/ai/content-generator';
import { authenticateRequest } from '@/lib/auth/middleware';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { withErrorHandler } from '@/lib/middleware/error-handler';
import { sanitizeText, sanitizeArray } from '@/lib/validation/sanitizer';
import { withCors } from '@/lib/middleware/cors';
import { CurrentInformationIntegrator } from '@/lib/ai/current-information-integrator';

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

// Internal POST handler
async function handlePOST(request: NextRequest) {
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

    // Sanitize all string inputs to prevent SQL injection and XSS
    const sanitizedData = {
      ...validatedData,
      keyword: sanitizeText(validatedData.keyword, { maxLength: 100 }),
      industry: sanitizeText(validatedData.industry, { maxLength: 50 }),
      targetAudience: sanitizeText(validatedData.targetAudience, { maxLength: 50 }),
      competitorInsights: validatedData.competitorInsights ? sanitizeText(validatedData.competitorInsights, { maxLength: 5000 }) : undefined,
      lsiKeywords: validatedData.lsiKeywords ? sanitizeArray(validatedData.lsiKeywords, { maxLength: 100 }) : undefined,
      entities: validatedData.entities ? validatedData.entities.map(entity => ({
        name: sanitizeText(entity.name, { maxLength: 100 }),
        type: sanitizeText(entity.type, { maxLength: 50 })
      })) : undefined,
      keywordVariations: validatedData.keywordVariations ? sanitizeArray(validatedData.keywordVariations, { maxLength: 100 }) : undefined,
      relatedKeywords: validatedData.relatedKeywords ? sanitizeArray(validatedData.relatedKeywords, { maxLength: 100 }) : undefined,
      comparisonCorpus: validatedData.comparisonCorpus ? sanitizeArray(validatedData.comparisonCorpus, { maxLength: 1000 }) : undefined,
      potentialSubtopics: validatedData.potentialSubtopics ? sanitizeArray(validatedData.potentialSubtopics, { maxLength: 200 }) : undefined,
      contentId: validatedData.contentId ? sanitizeText(validatedData.contentId, { maxLength: 50 }) : undefined,
      sensitiveTopics: validatedData.sensitiveTopics ? sanitizeArray(validatedData.sensitiveTopics, { maxLength: 100 }) : undefined
    };

    logger.info('Content generation request received', {
      userId: authResult.user.id,
      keyword: sanitizedData.keyword,
      industry: sanitizedData.industry,
      wordCount: sanitizedData.wordCount
    });

    // Initialize AI content generator
    const contentGenerator = new AIContentGenerator();
    const currentInfoIntegrator = new CurrentInformationIntegrator();

    // Fetch real-time 2025 facts and current information
    logger.info('Fetching current information for content generation', {
      keyword: sanitizedData.keyword,
      industry: sanitizedData.industry
    });

    let currentInformation;
    try {
      currentInformation = await currentInfoIntegrator.fetchCurrentInformation(
        sanitizedData.keyword,
        sanitizedData.industry
      );
      logger.info('Current information fetched successfully', {
        factsCount: currentInformation.facts2025.length,
        trendsCount: currentInformation.industryTrends.length
      });
    } catch (error) {
      logger.warn('Failed to fetch current information, proceeding without real-time data', { error });
      currentInformation = null;
    }

    // Prepare generation options
    const options: ContentGenerationOptions = {
      keyword: sanitizedData.keyword,
      industry: sanitizedData.industry,
      targetAudience: sanitizedData.targetAudience,
      tone: sanitizedData.tone,
      wordCount: sanitizedData.wordCount,
      competitorInsights: sanitizedData.competitorInsights,
      targetKeywordDensity: sanitizedData.targetKeywordDensity,
      lsiKeywords: sanitizedData.lsiKeywords,
      entities: sanitizedData.entities,
      targetOptimizedHeadingsCount: sanitizedData.targetOptimizedHeadingsCount,
      keywordVariations: sanitizedData.keywordVariations,
      relatedKeywords: sanitizedData.relatedKeywords,
      comparisonCorpus: sanitizedData.comparisonCorpus,
      potentialSubtopics: sanitizedData.potentialSubtopics,
      contentId: sanitizedData.contentId,
      sensitiveTopics: sanitizedData.sensitiveTopics,
      currentInformation: currentInformation ? {
        facts2025: currentInformation.facts2025,
        recentDevelopments: currentInformation.recentDevelopments,
        industryTrends: currentInformation.industryTrends,
        relevantEvents: currentInformation.relevantEvents
      } : undefined
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
        version: '1.0.0',
        currentInformationUsed: !!currentInformation,
        factsIntegrated: currentInformation ? currentInformation.facts2025.length : 0
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

// Internal GET handler
async function handleGET(request: NextRequest) {
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

// Export CORS-protected route handlers
export const POST = withCors(handlePOST);
export const GET = withCors(handleGET);
