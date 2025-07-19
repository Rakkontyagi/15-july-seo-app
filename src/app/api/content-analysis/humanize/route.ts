/**
 * API endpoint for content humanization
 * Story 7.1: Internal AI Humanization Engine and Pattern Detection
 */

import { NextRequest, NextResponse } from 'next/server';
import { InternalHumanizationEngine } from '@/lib/content-analysis/humanization-engine';
import { HumanizationConfig, ProcessingOptions } from '@/types/content-analysis';

// Rate limiting configuration
const RATE_LIMIT = {
  maxRequests: 100,
  windowMs: 15 * 60 * 1000, // 15 minutes
};

// Request tracking for rate limiting
const requestCounts = new Map<string, { count: number; resetTime: number }>();

/**
 * POST /api/content-analysis/humanize
 * Humanizes content to make it appear more human-written
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.ip || 'unknown';
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { content, config, options } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is required and must be a string' },
        { status: 400 }
      );
    }

    if (content.length > 50000) {
      return NextResponse.json(
        { error: 'Content too long. Maximum 50,000 characters allowed.' },
        { status: 400 }
      );
    }

    // Validate configuration if provided
    const validatedConfig = validateConfig(config);
    const validatedOptions = validateOptions(options);

    // Initialize humanization engine
    const engine = new InternalHumanizationEngine(validatedConfig, validatedOptions);

    // Process content
    const startTime = Date.now();
    const result = await engine.processContent(content);
    const processingTime = Date.now() - startTime;

    // Return results
    return NextResponse.json({
      success: true,
      data: {
        ...result,
        processingTime,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Humanization API error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Content cannot be empty')) {
        return NextResponse.json(
          { error: 'Content cannot be empty' },
          { status: 400 }
        );
      }
      
      if (error.message.includes('timeout')) {
        return NextResponse.json(
          { error: 'Processing timeout. Please try with shorter content.' },
          { status: 408 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error during content processing' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/content-analysis/humanize
 * Returns API information and usage guidelines
 */
export async function GET() {
  return NextResponse.json({
    name: 'Content Humanization API',
    version: '1.0.0',
    description: 'Analyzes and humanizes AI-generated content to make it appear more natural and human-written',
    endpoints: {
      POST: {
        description: 'Humanize content',
        parameters: {
          content: {
            type: 'string',
            required: true,
            maxLength: 50000,
            description: 'The content to humanize'
          },
          config: {
            type: 'object',
            required: false,
            description: 'Humanization configuration options',
            properties: {
              aggressiveness: {
                type: 'string',
                enum: ['conservative', 'moderate', 'aggressive'],
                default: 'moderate'
              },
              preserveStyle: {
                type: 'boolean',
                default: true
              },
              targetAudience: {
                type: 'string',
                enum: ['general', 'academic', 'professional', 'casual'],
                default: 'general'
              },
              qualityThreshold: {
                type: 'number',
                min: 0,
                max: 1,
                default: 0.8
              },
              enabledFeatures: {
                type: 'object',
                description: 'Toggle specific humanization features'
              }
            }
          },
          options: {
            type: 'object',
            required: false,
            description: 'Processing options',
            properties: {
              maxProcessingTime: {
                type: 'number',
                default: 30000,
                description: 'Maximum processing time in milliseconds'
              },
              enableCaching: {
                type: 'boolean',
                default: true
              },
              detailedAnalysis: {
                type: 'boolean',
                default: true
              }
            }
          }
        }
      }
    },
    rateLimit: {
      maxRequests: RATE_LIMIT.maxRequests,
      windowMs: RATE_LIMIT.windowMs,
      description: `Maximum ${RATE_LIMIT.maxRequests} requests per ${RATE_LIMIT.windowMs / 60000} minutes`
    },
    examples: {
      request: {
        content: 'In conclusion, this comprehensive analysis demonstrates significant improvements.',
        config: {
          aggressiveness: 'moderate',
          targetAudience: 'general'
        }
      },
      response: {
        success: true,
        data: {
          originalContent: 'In conclusion, this comprehensive analysis demonstrates significant improvements.',
          humanizedContent: 'This analysis shows real improvements. The results speak for themselves.',
          analysis: {
            aiPatterns: {
              overallRiskScore: 0.75,
              aiTypicalPhraseCount: 2
            }
          },
          metrics: {
            humanizationScore: 0.85,
            authenticityScore: 0.82,
            naturalness: 0.78,
            aiDetectionRisk: 0.25
          },
          recommendations: [
            'Replace formal transitions with casual alternatives',
            'Add personal touches and specific examples'
          ]
        }
      }
    }
  });
}

/**
 * Rate limiting implementation
 */
function checkRateLimit(clientIP: string): boolean {
  const now = Date.now();
  const clientData = requestCounts.get(clientIP);

  if (!clientData || now > clientData.resetTime) {
    // Reset or initialize counter
    requestCounts.set(clientIP, {
      count: 1,
      resetTime: now + RATE_LIMIT.windowMs
    });
    return true;
  }

  if (clientData.count >= RATE_LIMIT.maxRequests) {
    return false;
  }

  clientData.count++;
  return true;
}

/**
 * Validate humanization configuration
 */
function validateConfig(config: any): Partial<HumanizationConfig> | undefined {
  if (!config) return undefined;

  const validatedConfig: Partial<HumanizationConfig> = {};

  if (config.aggressiveness && ['conservative', 'moderate', 'aggressive'].includes(config.aggressiveness)) {
    validatedConfig.aggressiveness = config.aggressiveness;
  }

  if (typeof config.preserveStyle === 'boolean') {
    validatedConfig.preserveStyle = config.preserveStyle;
  }

  if (config.targetAudience && ['general', 'academic', 'professional', 'casual'].includes(config.targetAudience)) {
    validatedConfig.targetAudience = config.targetAudience;
  }

  if (typeof config.qualityThreshold === 'number' && config.qualityThreshold >= 0 && config.qualityThreshold <= 1) {
    validatedConfig.qualityThreshold = config.qualityThreshold;
  }

  if (config.enabledFeatures && typeof config.enabledFeatures === 'object') {
    validatedConfig.enabledFeatures = {};
    const features = ['patternDetection', 'structureVariation', 'vocabularyEnhancement', 'humanMarkers', 'imperfections', 'conversationalElements', 'patternBreaking'];
    
    features.forEach(feature => {
      if (typeof config.enabledFeatures[feature] === 'boolean') {
        validatedConfig.enabledFeatures![feature as keyof typeof validatedConfig.enabledFeatures] = config.enabledFeatures[feature];
      }
    });
  }

  return Object.keys(validatedConfig).length > 0 ? validatedConfig : undefined;
}

/**
 * Validate processing options
 */
function validateOptions(options: any): Partial<ProcessingOptions> | undefined {
  if (!options) return undefined;

  const validatedOptions: Partial<ProcessingOptions> = {};

  if (typeof options.maxProcessingTime === 'number' && options.maxProcessingTime > 0 && options.maxProcessingTime <= 60000) {
    validatedOptions.maxProcessingTime = options.maxProcessingTime;
  }

  if (typeof options.enableCaching === 'boolean') {
    validatedOptions.enableCaching = options.enableCaching;
  }

  if (typeof options.parallelProcessing === 'boolean') {
    validatedOptions.parallelProcessing = options.parallelProcessing;
  }

  if (typeof options.detailedAnalysis === 'boolean') {
    validatedOptions.detailedAnalysis = options.detailedAnalysis;
  }

  return Object.keys(validatedOptions).length > 0 ? validatedOptions : undefined;
}
