/**
 * API Route: SEO Metrics Analysis
 * Comprehensive SEO analysis using the SEO Metrics Engine
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { createSEOMetricsEngine, SEOMetricsEngineOptions } from '@/lib/seo/seo-metrics-engine';
import { withAuth } from '@/lib/auth/middleware';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { withErrorHandler } from '@/lib/middleware/error-handler';
import { validateRequest } from '@/lib/validation/request-validator';

// Request validation schema
const seoAnalysisRequestSchema = z.object({
  content: z.string().min(100, 'Content must be at least 100 characters'),
  html: z.string().optional(),
  headings: z.array(z.object({
    level: z.number().min(1).max(6),
    text: z.string(),
    position: z.number(),
  })).optional(),
  options: z.object({
    primaryKeyword: z.string().min(1, 'Primary keyword is required'),
    targetKeywords: z.array(z.string()).optional(),
    brandName: z.string().optional(),
    competitorUrls: z.array(z.string().url()).optional(),
    analysisDepth: z.enum(['basic', 'standard', 'comprehensive']).optional(),
    includeCompetitorAnalysis: z.boolean().optional(),
    customWeights: z.object({
      content: z.number().min(0).max(1),
      technical: z.number().min(0).max(1),
      keywords: z.number().min(0).max(1),
      structure: z.number().min(0).max(1),
      meta: z.number().min(0).max(1),
    }).optional(),
    language: z.string().optional(),
  }),
  competitorData: z.array(z.object({
    url: z.string().url(),
    content: z.string(),
    html: z.string().optional(),
    headings: z.array(z.object({
      level: z.number().min(1).max(6),
      text: z.string(),
      position: z.number(),
    })).optional(),
  })).optional(),
});

type SEOAnalysisRequest = z.infer<typeof seoAnalysisRequestSchema>;

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      message: 'Only POST requests are supported',
    });
  }

  try {
    // Validate request
    const validatedData = await validateRequest(seoAnalysisRequestSchema, req.body);
    const { content, html, headings, options, competitorData } = validatedData as SEOAnalysisRequest;

    // Create SEO metrics engine
    const seoEngine = createSEOMetricsEngine(options as SEOMetricsEngineOptions);

    // Perform analysis
    const startTime = Date.now();
    
    let analysisResult;
    if (competitorData && competitorData.length > 0) {
      analysisResult = await seoEngine.analyzeWithCompetitors(
        content,
        html,
        headings,
        competitorData
      );
    } else {
      analysisResult = await seoEngine.analyzeSEOMetrics(content, html, headings);
    }

    const processingTime = Date.now() - startTime;

    // Prepare response
    const response = {
      success: true,
      data: {
        overview: analysisResult.overview,
        analysis: {
          wordCount: {
            totalWords: analysisResult.wordCount.totalWords,
            totalCharacters: analysisResult.wordCount.totalCharacters,
            readingTime: analysisResult.wordCount.readingTime,
            contentDepth: analysisResult.wordCount.contentDepth,
            uniqueWords: analysisResult.wordCount.uniqueWords,
          },
          keywordDensity: {
            primaryKeyword: analysisResult.keywordDensity.primaryKeyword,
            overallDensity: analysisResult.keywordDensity.overallDensity,
            keywordVariations: analysisResult.keywordDensity.keywordVariations.slice(0, 5),
            competitorComparison: analysisResult.keywordDensity.competitorComparison,
          },
          headingOptimization: {
            overallAnalysis: analysisResult.headingOptimization.overallAnalysis,
            keywordDistribution: analysisResult.headingOptimization.keywordDistribution,
            headings: analysisResult.headingOptimization.headings.slice(0, 10),
            competitorComparison: analysisResult.headingOptimization.competitorComparison,
          },
          lsiKeywords: {
            topicCoverage: analysisResult.lsiKeywords.topicCoverage,
            semanticGroups: analysisResult.lsiKeywords.semanticGroups.slice(0, 5),
            lsiKeywords: analysisResult.lsiKeywords.lsiKeywords.slice(0, 20),
            competitorComparison: analysisResult.lsiKeywords.competitorComparison,
          },
          entities: {
            statistics: analysisResult.entities.statistics,
            seoAnalysis: analysisResult.entities.seoAnalysis,
            entityTypes: {
              PERSON: analysisResult.entities.entityTypes.PERSON.slice(0, 5),
              ORGANIZATION: analysisResult.entities.entityTypes.ORGANIZATION.slice(0, 5),
              LOCATION: analysisResult.entities.entityTypes.LOCATION.slice(0, 5),
            },
          },
          contentStructure: {
            overview: analysisResult.contentStructure.overview,
            flow: analysisResult.contentStructure.flow,
            hierarchy: analysisResult.contentStructure.hierarchy,
            seoAnalysis: analysisResult.contentStructure.seoAnalysis,
            patterns: analysisResult.contentStructure.patterns,
          },
          metaTags: {
            scores: analysisResult.metaTags.scores,
            analysis: analysisResult.metaTags.analysis,
            competitorComparison: analysisResult.metaTags.competitorComparison,
          },
        },
        insights: analysisResult.insights,
        actionPlan: analysisResult.actionPlan,
        competitorAnalysis: analysisResult.competitorAnalysis,
        recommendations: analysisResult.recommendations.slice(0, 15), // Limit to top 15
        metadata: analysisResult.metadata,
      },
      processingTime,
      timestamp: new Date().toISOString(),
    };

    // Log successful analysis
    console.log(`SEO metrics analysis completed in ${processingTime}ms for ${content.length} characters`);

    return res.status(200).json(response);

  } catch (error) {
    console.error('SEO metrics analysis error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Analysis failed',
      message: (error as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
}

// Apply middleware
export default withErrorHandler(
  withRateLimit(
    withAuth(handler),
    {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 10, // 10 requests per window (more intensive analysis)
      message: 'Too many SEO analysis requests',
    }
  )
);
