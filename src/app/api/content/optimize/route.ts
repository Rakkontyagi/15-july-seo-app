// Advanced NLP Content Optimization API Endpoint

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceLogger } from '@/lib/logging/logger';
import { NLPOptimizer } from '@/lib/ai/nlp-optimizer';
import { ProhibitedPhraseDetector } from '../../../../../src/lib/content-analysis/prohibited-phrase-detector';
import { authenticateRequest } from '@/lib/auth/middleware';

const logger = createServiceLogger('nlp-optimization-api');

// Request validation schema
const optimizeContentSchema = z.object({
  content: z.string()
    .min(50, 'Content must be at least 50 characters')
    .max(50000, 'Content must be less than 50,000 characters'),
  optimizationTypes: z.array(z.enum([
    'svo-enforcement',
    'prohibited-phrases',
    'language-precision',
    'filler-elimination',
    'sentence-complexity',
    'grammar-validation',
    'content-flow',
    'all'
  ])).default(['all']),
  strictMode: z.boolean().default(false),
  preserveStyle: z.boolean().default(true),
  targetComplexityScore: z.number()
    .min(10, 'Target complexity score must be at least 10')
    .max(100, 'Target complexity score must be less than 100')
    .optional(),
  customProhibitedPhrases: z.array(z.string()).optional()
});

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Authenticate request
    const authResult = await authenticateRequest(request);
    if (!authResult.user) {
      logger.warn('Unauthorized NLP optimization attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = optimizeContentSchema.parse(body);

    logger.info('NLP optimization request received', {
      userId: authResult.user.id,
      contentLength: validatedData.content.length,
      optimizationTypes: validatedData.optimizationTypes,
      strictMode: validatedData.strictMode
    });

    // Initialize optimizers
    const nlpOptimizer = new NLPOptimizer();
    const prohibitedPhraseDetector = new ProhibitedPhraseDetector();

    // Determine optimization types
    const optimizationTypes = validatedData.optimizationTypes.includes('all') 
      ? ['svo-enforcement', 'prohibited-phrases', 'language-precision', 'filler-elimination', 'sentence-complexity', 'grammar-validation', 'content-flow']
      : validatedData.optimizationTypes;

    // Perform comprehensive NLP optimization
    const optimizationResult = nlpOptimizer.optimize(validatedData.content);

    // Additional prohibited phrase detection if custom phrases provided
    let additionalProhibitedDetection = null;
    if (validatedData.customProhibitedPhrases && validatedData.customProhibitedPhrases.length > 0) {
      const customDetectionResult = prohibitedPhraseDetector.detectProhibitedPhrases(
        optimizationResult.optimizedContent,
        validatedData.customProhibitedPhrases
      );
      additionalProhibitedDetection = {
        detectedPhrases: customDetectionResult.detectedPhrases,
        suggestions: customDetectionResult.suggestions,
        severity: customDetectionResult.severity
      };
    }

    // Calculate improvement metrics
    const originalWordCount = validatedData.content.split(/\s+/).length;
    const optimizedWordCount = optimizationResult.optimizedContent.split(/\s+/).length;
    const wordReduction = originalWordCount - optimizedWordCount;
    const wordReductionPercentage = (wordReduction / originalWordCount) * 100;

    // Generate quality assessment
    const qualityAssessment = {
      overallImprovement: calculateOverallImprovement(optimizationResult.metrics),
      readabilityImprovement: optimizationResult.metrics.svoComplianceScore > 80 ? 'Significant' : 'Moderate',
      precisionImprovement: optimizationResult.metrics.languagePrecisionScore > 75 ? 'High' : 'Moderate',
      clarityImprovement: optimizationResult.metrics.fillerContentPercentage < 3 ? 'Excellent' : 'Good'
    };

    const processingTime = Date.now() - startTime;

    logger.info('NLP optimization completed successfully', {
      userId: authResult.user.id,
      originalWordCount,
      optimizedWordCount,
      wordReduction,
      overallScore: optimizationResult.metrics.svoComplianceScore,
      processingTime
    });

    // Return successful response
    return NextResponse.json({
      success: true,
      data: {
        originalContent: validatedData.content,
        optimizedContent: optimizationResult.optimizedContent,
        metrics: optimizationResult.metrics,
        changes: optimizationResult.changes,
        issues: optimizationResult.issues,
        recommendations: optimizationResult.recommendations,
        additionalProhibitedDetection,
        improvementMetrics: {
          originalWordCount,
          optimizedWordCount,
          wordReduction,
          wordReductionPercentage,
          totalChanges: optimizationResult.changes.length
        },
        qualityAssessment
      },
      metadata: {
        processingTime,
        optimizationTypes: optimizationTypes,
        strictMode: validatedData.strictMode,
        version: '1.0.0',
        timestamp: new Date().toISOString()
      }
    }, { status: 200 });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    logger.error('NLP optimization failed', {
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

    return NextResponse.json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred during NLP optimization'
    }, { status: 500 });
  }
}

// GET endpoint for retrieving optimization capabilities
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

    // Return service capabilities
    return NextResponse.json({
      status: 'operational',
      version: '1.0.0',
      capabilities: {
        optimizationTypes: [
          {
            type: 'svo-enforcement',
            description: 'Enforces Subject-Verb-Object sentence structure for clarity',
            features: ['passive-to-active conversion', 'weak starter strengthening', 'SVO analysis']
          },
          {
            type: 'prohibited-phrases',
            description: 'Removes overused SEO terms and replaces with alternatives',
            features: ['overused term detection', 'alternative suggestions', 'severity scoring']
          },
          {
            type: 'language-precision',
            description: 'Replaces vague terms with precise alternatives',
            features: ['vague word detection', 'precision scoring', 'specific replacements']
          },
          {
            type: 'filler-elimination',
            description: 'Removes unnecessary filler words and phrases',
            features: ['filler detection', 'content compression', 'clarity improvement']
          },
          {
            type: 'sentence-complexity',
            description: 'Analyzes and optimizes sentence complexity',
            features: ['complexity scoring', 'readability optimization', 'structure analysis']
          },
          {
            type: 'grammar-validation',
            description: 'Validates grammar and syntax accuracy',
            features: ['grammar checking', 'syntax validation', 'error detection']
          },
          {
            type: 'content-flow',
            description: 'Optimizes content flow and transitions',
            features: ['transition analysis', 'flow scoring', 'coherence improvement']
          }
        ],
        limits: {
          minContentLength: 50,
          maxContentLength: 50000,
          maxCustomProhibitedPhrases: 100
        },
        metrics: [
          'svoComplianceScore',
          'prohibitedPhrasesRemoved',
          'languagePrecisionScore',
          'fillerContentPercentage',
          'sentenceComplexityScore',
          'grammarAccuracyScore',
          'contentFlowScore'
        ]
      }
    });

  } catch (error) {
    logger.error('Error retrieving NLP optimization capabilities', { error: error.message });
    return NextResponse.json({
      error: 'Internal Server Error'
    }, { status: 500 });
  }
}

/**
 * Calculate overall improvement score
 */
function calculateOverallImprovement(metrics: any): string {
  const scores = [
    metrics.svoComplianceScore,
    metrics.languagePrecisionScore,
    metrics.grammarAccuracyScore,
    metrics.contentFlowScore
  ];

  const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

  if (averageScore >= 90) return 'Excellent';
  if (averageScore >= 80) return 'Very Good';
  if (averageScore >= 70) return 'Good';
  if (averageScore >= 60) return 'Fair';
  return 'Needs Improvement';
}
