/**
 * API Route: Advanced Competitive Intelligence Analysis
 * Orchestrates precision competitive analysis with exact benchmarks and recommendations
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { createSEOMetricsEngine } from '@/lib/seo/seo-metrics-engine';
import { createTopicDistributionMapper } from '@/lib/intelligence/topic-distribution-mapper';
import { createContentQualityScorer } from '@/lib/intelligence/content-quality-scorer';
import { createBenchmarkReporter } from '@/lib/intelligence/benchmark-reporter';
import { withAuth } from '@/lib/auth/middleware';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { withErrorHandler } from '@/lib/middleware/error-handler';
import { validateRequest } from '@/lib/validation/request-validator';

// Request validation schema
const competitiveAnalysisRequestSchema = z.object({
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
    contentType: z.enum(['blog', 'article', 'product', 'landing', 'guide']).optional(),
    targetAudience: z.enum(['general', 'technical', 'academic', 'casual']).optional(),
    analysisDepth: z.enum(['basic', 'standard', 'comprehensive']).optional(),
    includeTopicMapping: z.boolean().optional(),
    includeQualityScoring: z.boolean().optional(),
    includeBenchmarkReport: z.boolean().optional(),
    prioritizeQuickWins: z.boolean().optional(),
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
  })).min(1, 'At least one competitor is required for competitive analysis'),
});

type CompetitiveAnalysisRequest = z.infer<typeof competitiveAnalysisRequestSchema>;

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
    const validatedData = await validateRequest(competitiveAnalysisRequestSchema, req.body);
    const { content, html, headings, options, competitorData } = validatedData as CompetitiveAnalysisRequest;

    const startTime = Date.now();

    // Initialize analyzers
    const seoEngine = createSEOMetricsEngine({
      primaryKeyword: options.primaryKeyword,
      targetKeywords: options.targetKeywords || [],
      brandName: options.brandName,
      analysisDepth: options.analysisDepth || 'comprehensive',
      includeCompetitorAnalysis: true,
      language: options.language || 'en',
    });

    const topicMapper = options.includeTopicMapping !== false ? createTopicDistributionMapper({
      primaryKeyword: options.primaryKeyword,
      language: options.language || 'en',
      analyzeFlow: options.analysisDepth === 'comprehensive',
    }) : null;

    const qualityScorer = options.includeQualityScoring !== false ? createContentQualityScorer({
      primaryKeyword: options.primaryKeyword,
      targetAudience: options.targetAudience || 'general',
      contentType: options.contentType || 'article',
      language: options.language || 'en',
    }) : null;

    const benchmarkReporter = options.includeBenchmarkReport !== false ? createBenchmarkReporter({
      primaryKeyword: options.primaryKeyword,
      targetKeywords: options.targetKeywords || [],
      contentType: options.contentType || 'article',
      targetAudience: options.targetAudience || 'general',
      prioritizeQuickWins: options.prioritizeQuickWins !== false,
    }) : null;

    // Perform current content analysis
    const currentAnalysis = await seoEngine.analyzeSEOMetrics(content, html, headings);

    // Perform competitor analyses
    const competitorAnalyses = await Promise.all(
      competitorData.map(async (competitor) => {
        const competitorAnalysis = await seoEngine.analyzeSEOMetrics(
          competitor.content,
          competitor.html,
          competitor.headings
        );
        return {
          url: competitor.url,
          analysis: competitorAnalysis,
        };
      })
    );

    // Perform competitive comparison
    const competitiveAnalysis = await seoEngine.analyzeWithCompetitors(
      content,
      html,
      headings,
      competitorData
    );

    // Topic distribution analysis
    let topicDistribution = null;
    if (topicMapper) {
      const currentTopicAnalysis = topicMapper.mapTopicDistribution(content);
      topicDistribution = topicMapper.compareWithCompetitors(
        currentTopicAnalysis,
        competitorData.map(c => ({ url: c.url, content: c.content }))
      );
    }

    // Content quality analysis
    let qualityAnalysis = null;
    if (qualityScorer) {
      qualityAnalysis = qualityScorer.scoreContentQuality(content, html);
    }

    // Benchmark report generation
    let benchmarkReport = null;
    if (benchmarkReporter) {
      benchmarkReport = benchmarkReporter.generateBenchmarkReport(
        competitiveAnalysis,
        competitorAnalyses
      );
    }

    const processingTime = Date.now() - startTime;

    // Prepare comprehensive response
    const response = {
      success: true,
      data: {
        overview: {
          competitivePosition: benchmarkReport?.overview.competitivePosition || 2,
          overallGap: benchmarkReport?.overview.overallGap || 0,
          improvementPotential: benchmarkReport?.overview.improvementPotential || 50,
          priorityActions: benchmarkReport?.overview.priorityActions || 0,
          competitorCount: competitorData.length,
        },
        
        currentAnalysis: {
          seoMetrics: {
            overview: competitiveAnalysis.overview,
            wordCount: competitiveAnalysis.wordCount,
            keywordDensity: competitiveAnalysis.keywordDensity,
            headingOptimization: competitiveAnalysis.headingOptimization,
            contentStructure: competitiveAnalysis.contentStructure,
            metaTags: competitiveAnalysis.metaTags,
          },
          topicDistribution: topicDistribution ? {
            mainTopics: topicDistribution.mainTopics.slice(0, 10),
            topicFlow: topicDistribution.topicFlow,
            topicCoverage: topicDistribution.topicCoverage,
            competitorComparison: topicDistribution.competitorComparison,
          } : null,
          qualityAnalysis: qualityAnalysis ? {
            overallScore: qualityAnalysis.overallScore,
            qualityGrade: qualityAnalysis.qualityGrade,
            readability: qualityAnalysis.readability,
            structure: qualityAnalysis.structure,
            optimization: qualityAnalysis.optimization,
            strengths: qualityAnalysis.strengths,
            weaknesses: qualityAnalysis.weaknesses,
          } : null,
        },

        competitorAnalysis: {
          summary: {
            averageScore: Math.round(
              competitorAnalyses.reduce((sum, c) => sum + (c.analysis.overview.overallScore || 0), 0) / 
              competitorAnalyses.length
            ),
            topPerformer: competitorAnalyses.reduce((best, current) => 
              (current.analysis.overview.overallScore || 0) > (best.analysis.overview.overallScore || 0) 
                ? current : best
            ),
            commonStrengths: this.identifyCommonStrengths(competitorAnalyses),
            gaps: competitiveAnalysis.competitorAnalysis?.gapAnalysis || [],
          },
          individual: competitorAnalyses.map(c => ({
            url: c.url,
            overallScore: c.analysis.overview.overallScore,
            keyStrengths: this.identifyKeyStrengths(c.analysis),
            keyMetrics: {
              wordCount: c.analysis.wordCount.totalWords,
              keywordDensity: c.analysis.keywordDensity.primaryKeyword.density,
              headingCount: c.analysis.headingOptimization.overallAnalysis.totalHeadings,
              metaScore: c.analysis.metaTags.scores.overall,
            },
          })),
        },

        benchmarkReport: benchmarkReport ? {
          keywordBenchmarks: benchmarkReport.keywordBenchmarks,
          headingBenchmarks: benchmarkReport.headingBenchmarks,
          contentBenchmarks: benchmarkReport.contentBenchmarks,
          gapAnalysis: benchmarkReport.gapAnalysis,
          actionPlan: benchmarkReport.actionPlan,
          competitorInsights: benchmarkReport.competitorInsights,
        } : null,

        insights: {
          strengths: competitiveAnalysis.insights.strengths,
          weaknesses: competitiveAnalysis.insights.weaknesses,
          opportunities: competitiveAnalysis.insights.opportunities,
          threats: competitiveAnalysis.insights.threats,
        },

        recommendations: [
          ...competitiveAnalysis.recommendations.slice(0, 10),
          ...(topicDistribution?.competitorComparison?.recommendations || []).slice(0, 5),
          ...(qualityAnalysis?.recommendations || []).slice(0, 5),
        ].slice(0, 15), // Limit to top 15 recommendations
      },
      
      metadata: {
        analyzedAt: new Date().toISOString(),
        processingTime,
        contentLength: content.length,
        competitorCount: competitorData.length,
        analysisDepth: options.analysisDepth || 'comprehensive',
        featuresEnabled: {
          topicMapping: !!topicMapper,
          qualityScoring: !!qualityScorer,
          benchmarkReport: !!benchmarkReporter,
        },
      },
    };

    // Log successful analysis
    console.log(`Competitive intelligence analysis completed in ${processingTime}ms for ${content.length} characters with ${competitorData.length} competitors`);

    return res.status(200).json(response);

  } catch (error) {
    console.error('Competitive intelligence analysis error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Analysis failed',
      message: (error as Error).message,
      timestamp: new Date().toISOString(),
    });
  }

  // Helper methods (would be moved to class in real implementation)
  function identifyCommonStrengths(analyses: Array<{ url: string; analysis: any }>): string[] {
    const strengths: string[] = [];
    
    const avgWordCount = analyses.reduce((sum, a) => sum + (a.analysis.wordCount?.totalWords || 0), 0) / analyses.length;
    if (avgWordCount > 1500) strengths.push('Long-form content strategy');
    
    const avgMetaScore = analyses.reduce((sum, a) => sum + (a.analysis.metaTags?.scores?.overall || 0), 0) / analyses.length;
    if (avgMetaScore > 80) strengths.push('Strong meta tag optimization');
    
    return strengths;
  }

  function identifyKeyStrengths(analysis: any): string[] {
    const strengths: string[] = [];
    
    if (analysis.overview?.overallScore > 80) strengths.push('High overall SEO score');
    if (analysis.keywordDensity?.overallDensity?.isOptimal) strengths.push('Optimal keyword density');
    if (analysis.metaTags?.scores?.overall > 85) strengths.push('Excellent meta optimization');
    
    return strengths.slice(0, 3);
  }
}

// Apply middleware
export default withErrorHandler(
  withRateLimit(
    withAuth(handler),
    {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 requests per window (very intensive analysis)
      message: 'Too many competitive intelligence requests',
    }
  )
);
