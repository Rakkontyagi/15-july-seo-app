/**
 * Expert Content Generation API Route
 * Implements Story 3.1: Expert-Level Content Generation (FR5, FR11)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ExpertContentGenerator, type ExpertContentRequest } from '@/lib/ai/expert-content-generator';

// Request validation schema
const expertContentRequestSchema = z.object({
  topic: z.string().min(1, 'Topic is required'),
  industry: z.string().min(1, 'Industry is required'),
  targetAudience: z.enum(['beginner', 'intermediate', 'expert', 'mixed']),
  contentType: z.enum(['article', 'guide', 'tutorial', 'analysis', 'whitepaper']),
  wordCount: z.number().min(500).max(10000),
  keywords: z.array(z.string()).min(1, 'At least one keyword is required'),
  expertiseLevel: z.enum(['advanced', 'expert', 'master']),
  includePersonalExperience: z.boolean().default(true),
  includeCaseStudies: z.boolean().default(true),
  includeDataPoints: z.boolean().default(true),
  requireAuthoritySignals: z.boolean().default(true),
  targetExpertiseScore: z.number().min(0).max(100).default(85),
});

type ExpertContentRequestType = z.infer<typeof expertContentRequestSchema>;

// Global expert content generator instance
const expertGenerator = new ExpertContentGenerator();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = expertContentRequestSchema.parse(body);

    // Generate expert content
    const result = await expertGenerator.generateExpertContent(validatedData);

    return NextResponse.json({
      success: true,
      data: {
        content: result.content,
        expertiseScore: result.expertiseScore,
        authoritySignals: result.authoritySignals,
        industryDepth: result.industryDepth,
        metadata: result.metadata,
        experienceIndicators: result.experienceIndicators,
        practicalWisdom: result.practicalWisdom,
        thoughtLeadership: result.thoughtLeadership,
      },
    });
  } catch (error) {
    console.error('Expert content generation error:', error);

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

    return NextResponse.json(
      {
        success: false,
        error: 'Expert content generation failed',
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'capabilities':
        return NextResponse.json({
          success: true,
          data: {
            supportedIndustries: [
              'technology',
              'healthcare',
              'finance',
              'manufacturing',
              'retail',
              'education',
              'consulting',
              'marketing',
            ],
            contentTypes: [
              'article',
              'guide',
              'tutorial',
              'analysis',
              'whitepaper',
            ],
            expertiseLevels: [
              'advanced',
              'expert',
              'master',
            ],
            targetAudiences: [
              'beginner',
              'intermediate',
              'expert',
              'mixed',
            ],
            wordCountRange: {
              min: 500,
              max: 10000,
              recommended: 2500,
            },
            features: [
              'Personal experience integration',
              'Case study inclusion',
              'Data-driven insights',
              'Industry-specific terminology',
              'Thought leadership perspectives',
              'Practical wisdom extraction',
              'Authority signal optimization',
            ],
          },
        });

      case 'templates':
        return NextResponse.json({
          success: true,
          data: {
            contentStructures: {
              article: [
                'Executive Summary',
                'Industry Context',
                'Core Principles',
                'Implementation Strategies',
                'Case Studies',
                'Best Practices',
                'Common Pitfalls',
                'Future Trends',
                'Recommendations',
                'Conclusion',
              ],
              guide: [
                'Introduction',
                'Prerequisites',
                'Step-by-Step Process',
                'Advanced Techniques',
                'Troubleshooting',
                'Best Practices',
                'Real-World Examples',
                'Next Steps',
              ],
              whitepaper: [
                'Executive Summary',
                'Problem Statement',
                'Market Analysis',
                'Solution Framework',
                'Implementation Methodology',
                'Case Studies',
                'ROI Analysis',
                'Recommendations',
                'Conclusion',
              ],
            },
            expertiseIndicators: [
              'Years of experience references',
              'Client project examples',
              'Industry transformation insights',
              'Practical implementation advice',
              'Lessons learned from failures',
              'Future trend predictions',
              'Strategic recommendations',
            ],
          },
        });

      case 'examples':
        return NextResponse.json({
          success: true,
          data: {
            sampleRequests: [
              {
                topic: 'Digital Transformation Strategy',
                industry: 'technology',
                targetAudience: 'expert',
                contentType: 'whitepaper',
                wordCount: 3500,
                keywords: ['digital transformation', 'enterprise architecture', 'change management'],
                expertiseLevel: 'master',
                includePersonalExperience: true,
                includeCaseStudies: true,
                includeDataPoints: true,
              },
              {
                topic: 'Advanced SEO Optimization',
                industry: 'marketing',
                targetAudience: 'intermediate',
                contentType: 'guide',
                wordCount: 2500,
                keywords: ['SEO', 'search optimization', 'content strategy'],
                expertiseLevel: 'expert',
                includePersonalExperience: true,
                includeCaseStudies: true,
                includeDataPoints: true,
              },
            ],
            expertiseScoreFactors: [
              'Personal experience references (20%)',
              'Case study inclusion (25%)',
              'Industry-specific terminology (15%)',
              'Data-driven insights (20%)',
              'Practical wisdom sharing (20%)',
            ],
          },
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Use: capabilities, templates, or examples' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Expert content API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
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
