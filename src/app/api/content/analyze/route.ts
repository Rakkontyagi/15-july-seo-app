// Content Analysis API Endpoint

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceLogger } from '@/lib/logging/logger';
import { ContentQualityChecker } from '@/lib/ai/quality-checker';
import { HumanWritingPatternAnalyzer } from '@/lib/ai/human-writing-patterns';
import { EeatOptimizer } from '@/lib/ai/eeat-optimizer';
import { UserValueOptimizer } from '@/lib/ai/user-value-optimizer';
import { AuthoritySignalIntegrator } from '@/lib/ai/authority-signal-integrator';
import { authenticateRequest } from '@/lib/auth/middleware';

const logger = createServiceLogger('content-analysis-api');

// Request validation schema
const analyzeContentSchema = z.object({
  content: z.string()
    .min(100, 'Content must be at least 100 characters')
    .max(50000, 'Content must be less than 50,000 characters'),
  keyword: z.string()
    .min(1, 'Keyword is required')
    .max(100, 'Keyword must be less than 100 characters'),
  industry: z.string()
    .min(1, 'Industry is required')
    .max(50, 'Industry must be less than 50 characters'),
  targetAudience: z.string()
    .min(1, 'Target audience is required')
    .max(50, 'Target audience must be less than 50 characters'),
  analysisTypes: z.array(z.enum([
    'quality',
    'human-writing',
    'eeat',
    'user-value',
    'authority-signals',
    'all'
  ])).default(['all'])
});

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Authenticate request
    const authResult = await authenticateRequest(request);
    if (!authResult.user) {
      logger.warn('Unauthorized content analysis attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = analyzeContentSchema.parse(body);

    logger.info('Content analysis request received', {
      userId: authResult.user.id,
      keyword: validatedData.keyword,
      industry: validatedData.industry,
      contentLength: validatedData.content.length,
      analysisTypes: validatedData.analysisTypes
    });

    const analysisResults: any = {};
    const analysisTypes = validatedData.analysisTypes.includes('all') 
      ? ['quality', 'human-writing', 'eeat', 'user-value', 'authority-signals']
      : validatedData.analysisTypes;

    // Initialize analyzers
    const qualityChecker = new ContentQualityChecker();
    const humanWritingAnalyzer = new HumanWritingPatternAnalyzer();
    const eeatOptimizer = new EeatOptimizer();
    const userValueOptimizer = new UserValueOptimizer();
    const authoritySignalIntegrator = new AuthoritySignalIntegrator();

    // Perform requested analyses
    if (analysisTypes.includes('quality')) {
      logger.info('Running quality analysis');
      analysisResults.qualityAnalysis = await qualityChecker.analyze(validatedData.content);
    }

    if (analysisTypes.includes('human-writing')) {
      logger.info('Running human writing pattern analysis');
      analysisResults.humanWritingAnalysis = humanWritingAnalyzer.analyze(validatedData.content);
    }

    if (analysisTypes.includes('eeat')) {
      logger.info('Running E-E-A-T optimization analysis');
      analysisResults.eeatOptimization = eeatOptimizer.optimize(validatedData.content, {
        industry: validatedData.industry,
        keyword: validatedData.keyword
      });
    }

    if (analysisTypes.includes('user-value')) {
      logger.info('Running user value analysis');
      analysisResults.userValueAnalysis = userValueOptimizer.optimize(validatedData.content, {
        keyword: validatedData.keyword,
        targetAudience: validatedData.targetAudience
      });
    }

    if (analysisTypes.includes('authority-signals')) {
      logger.info('Running authority signal analysis');
      analysisResults.authoritySignalAnalysis = authoritySignalIntegrator.integrate(validatedData.content);
    }

    // Calculate overall scores
    const overallScores = {
      qualityScore: analysisResults.qualityAnalysis?.overallScore || null,
      humanWritingScore: analysisResults.humanWritingAnalysis?.overallScore || null,
      eeatScore: analysisResults.eeatOptimization?.overallScore || null,
      userValueScore: analysisResults.userValueAnalysis?.overallScore || null,
      authorityScore: analysisResults.authoritySignalAnalysis?.overallScore || null
    };

    // Calculate composite score
    const validScores = Object.values(overallScores).filter(score => score !== null) as number[];
    const compositeScore = validScores.length > 0 
      ? validScores.reduce((sum, score) => sum + score, 0) / validScores.length 
      : null;

    const processingTime = Date.now() - startTime;

    logger.info('Content analysis completed successfully', {
      userId: authResult.user.id,
      keyword: validatedData.keyword,
      compositeScore,
      processingTime
    });

    // Return successful response
    return NextResponse.json({
      success: true,
      data: {
        ...analysisResults,
        overallScores,
        compositeScore,
        contentMetrics: {
          wordCount: validatedData.content.split(/\s+/).length,
          characterCount: validatedData.content.length,
          paragraphCount: validatedData.content.split(/\n\s*\n/).length,
          sentenceCount: validatedData.content.split(/[.!?]+/).filter(s => s.trim().length > 0).length
        }
      },
      metadata: {
        processingTime,
        analysisTypes: analysisTypes,
        version: '1.0.0',
        timestamp: new Date().toISOString()
      }
    }, { status: 200 });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    logger.error('Content analysis failed', {
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
      message: 'An unexpected error occurred during content analysis'
    }, { status: 500 });
  }
}

// GET endpoint for retrieving analysis capabilities
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
        analysisTypes: [
          {
            type: 'quality',
            description: 'Grammar, syntax, readability, and professional writing standards',
            metrics: ['grammar', 'syntax', 'readability', 'coherence', 'style']
          },
          {
            type: 'human-writing',
            description: 'Natural flow, sentence variety, and AI detection avoidance',
            metrics: ['naturalFlow', 'sentenceVariety', 'aiDetectionScore', 'humanLikeness']
          },
          {
            type: 'eeat',
            description: 'Experience, Expertise, Authoritativeness, and Trustworthiness',
            metrics: ['experience', 'expertise', 'authoritativeness', 'trustworthiness']
          },
          {
            type: 'user-value',
            description: 'User intent satisfaction and actionable insights',
            metrics: ['intentSatisfaction', 'actionableInsights', 'comprehensiveness']
          },
          {
            type: 'authority-signals',
            description: 'Expert opinions, case studies, and data-driven insights',
            metrics: ['expertOpinions', 'caseStudies', 'dataInsights', 'bestPractices']
          }
        ],
        limits: {
          minContentLength: 100,
          maxContentLength: 50000
        }
      }
    });

  } catch (error) {
    logger.error('Error retrieving content analysis capabilities', { error: error.message });
    return NextResponse.json({
      error: 'Internal Server Error'
    }, { status: 500 });
  }
}
