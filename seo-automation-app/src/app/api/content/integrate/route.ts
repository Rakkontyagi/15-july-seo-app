/**
 * Content Integration API Route
 * Implements Story 3.3: Precision Keyword Integration
 * Integrates CompetitorDataAverager, ContentIntegrationEngine, and KeywordDensityMatcher
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { CompetitorDataAverager, type CompetitorAnalysis } from '@/lib/content/competitor-data-averager';
import { ContentIntegrationEngine, type Entity } from '@/lib/content/content-integration-engine';
import { KeywordDensityMatcher } from '@/lib/content/keyword-density-matcher';

// Request validation schema
const integrationRequestSchema = z.object({
  content: z.string().min(100, 'Content must be at least 100 characters'),
  primaryKeyword: z.string().min(1, 'Primary keyword is required'),
  lsiKeywords: z.array(z.string()).min(1, 'At least one LSI keyword required'),
  entities: z.array(z.object({
    name: z.string(),
    type: z.enum(['PERSON', 'ORGANIZATION', 'LOCATION', 'PRODUCT', 'EVENT']),
    relevance: z.number().min(0).max(1),
    context: z.string().optional(),
  })),
  competitorData: z.array(z.object({
    url: z.string().url(),
    wordCount: z.number().positive(),
    keywordDensity: z.number().min(0).max(10),
    headingOptimization: z.number().min(0),
    lsiKeywordCount: z.number().min(0),
    entityCount: z.number().min(0),
    readabilityScore: z.number().min(0).max(100),
    contentQuality: z.number().min(0).max(100),
  })).length(5, 'Exactly 5 competitors required for precise averaging'),
  options: z.object({
    validatePrecision: z.boolean().default(true),
    generateReport: z.boolean().default(true),
    maxDensity: z.number().min(0).max(5).default(3.5),
  }).optional(),
});

type IntegrationRequest = z.infer<typeof integrationRequestSchema>;

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request
    const body = await request.json();
    const validatedData = integrationRequestSchema.parse(body);

    // Initialize services
    const competitorAverager = new CompetitorDataAverager();
    const integrationEngine = new ContentIntegrationEngine();
    const densityMatcher = new KeywordDensityMatcher();

    // Step 1: Calculate precise competitor benchmarks
    const benchmarks = competitorAverager.calculatePreciseAverages(validatedData.competitorData);
    
    // Step 2: Generate entity averages for additional context
    const entityAverages = competitorAverager.calculateEntityAverages(validatedData.competitorData);

    // Step 3: Integrate content with precision
    const integratedContent = integrationEngine.integrateKeywordsIntoContent(
      validatedData.content,
      benchmarks,
      validatedData.lsiKeywords,
      validatedData.entities
    );

    // Step 4: Validate density matching
    const densityMatching = densityMatcher.matchAgainstBenchmarks(
      integratedContent.content,
      validatedData.primaryKeyword,
      validatedData.lsiKeywords,
      benchmarks
    );

    // Step 5: Validate integrated content
    const contentValidation = densityMatcher.validateIntegratedContent(
      integratedContent,
      validatedData.primaryKeyword,
      benchmarks
    );

    // Step 6: Generate comprehensive report (if requested)
    let detailedReport = null;
    if (validatedData.options?.generateReport) {
      detailedReport = competitorAverager.generateAveragingReport(
        validatedData.competitorData,
        benchmarks
      );
    }

    // Step 7: Extract keyword variations for analysis
    const keywordVariations = densityMatcher.extractKeywordVariations(
      integratedContent.content,
      validatedData.primaryKeyword
    );

    // Prepare response
    const response = {
      success: true,
      data: {
        // Integrated content
        integratedContent: {
          content: integratedContent.content,
          keywordDensityAchieved: integratedContent.keywordDensityAchieved,
          headingOptimizationCount: integratedContent.headingOptimizationCount,
          naturalFlowScore: integratedContent.naturalFlowScore,
          lsiKeywordsIntegrated: integratedContent.lsiKeywordsIntegrated,
          entitiesIntegrated: integratedContent.entitiesIntegrated,
        },

        // Benchmark targets
        benchmarks: {
          wordCount: benchmarks.wordCount,
          keywordDensity: benchmarks.keywordDensity,
          headingOptimization: benchmarks.headingOptimization,
          lsiKeywordTargets: benchmarks.lsiKeywordTargets,
          entityTargets: benchmarks.entityTargets,
          readabilityTarget: benchmarks.readabilityTarget,
          qualityTarget: benchmarks.qualityTarget,
        },

        // Density matching analysis
        densityAnalysis: {
          primaryKeyword: densityMatching.primaryKeyword,
          lsiKeywords: densityMatching.lsiKeywords,
          overallMatch: densityMatching.overallMatch,
          averagePrecision: densityMatching.averagePrecision,
          competitorAlignment: densityMatching.competitorAlignment,
          optimizationSuggestions: densityMatching.optimizationSuggestions,
        },

        // Content validation
        validation: {
          isValid: contentValidation.isValid,
          densityAccuracy: contentValidation.densityAccuracy,
          benchmarkCompliance: contentValidation.benchmarkCompliance,
          validationIssues: contentValidation.validationIssues,
        },

        // Keyword variations
        keywordVariations: keywordVariations.slice(0, 10), // Limit to top 10

        // Entity analysis
        entityAnalysis: {
          averageEntityCount: entityAverages.averageEntityCount,
          topEntityTypes: entityAverages.topEntityTypes,
          entityDensityTarget: entityAverages.entityDensityTarget,
        },

        // Integration report
        integrationReport: integratedContent.integrationReport,

        // Processing metadata
        metadata: {
          processedAt: new Date().toISOString(),
          competitorsAnalyzed: validatedData.competitorData.length,
          originalWordCount: validatedData.content.split(/\s+/).length,
          optimizedWordCount: integratedContent.content.split(/\s+/).length,
          processingTime: Date.now() - Date.now(), // Placeholder
        },
      },

      // Optional detailed report
      ...(detailedReport && { detailedReport }),
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Content integration error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: 'INTEGRATION_ERROR',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        code: 'UNKNOWN_ERROR',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Health check endpoint
  return NextResponse.json({
    success: true,
    message: 'Content Integration API is operational',
    version: '1.0.0',
    capabilities: [
      'Competitor data averaging',
      'Precision keyword integration',
      'LSI keyword distribution',
      'Entity integration',
      'Density matching validation',
      'Natural flow assessment',
    ],
    requirements: {
      competitorCount: 5,
      precisionThreshold: 0.01,
      maxKeywordDensity: 3.5,
      minNaturalFlowScore: 70,
    },
  });
}

// OPTIONS handler for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
