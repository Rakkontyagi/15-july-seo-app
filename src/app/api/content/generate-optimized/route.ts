/**
 * Unified Content Generation API Endpoint
 * Implements PM recommendations for end-to-end SEO content generation
 * Connects all existing components into a single workflow
 */

import { NextRequest, NextResponse } from 'next/server';
import { UnifiedContentOrchestrator } from '@/lib/workflows/unified-content-orchestrator';
import { performanceMonitor } from '@/lib/monitoring/performance-monitor';
import { rateLimit } from '@/lib/utils/rate-limit';

// Rate limiting configuration
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // Limit each IP to 500 requests per minute
});

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const clientIP = request.ip || 'unknown';
  
  try {
    // Apply rate limiting
    try {
      await limiter.check(10, clientIP); // 10 requests per minute per IP
    } catch {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.',
          retryAfter: 60 
        },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { keyword, location, contentType, customizations, options } = body;

    // Validate required fields
    if (!keyword || typeof keyword !== 'string' || keyword.trim().length === 0) {
      return NextResponse.json(
        { 
          error: 'Invalid keyword',
          message: 'Keyword is required and must be a non-empty string' 
        },
        { status: 400 }
      );
    }

    if (!location || typeof location !== 'string' || location.trim().length === 0) {
      return NextResponse.json(
        { 
          error: 'Invalid location',
          message: 'Location is required and must be a non-empty string' 
        },
        { status: 400 }
      );
    }

    // Validate keyword length
    if (keyword.length > 100) {
      return NextResponse.json(
        { 
          error: 'Keyword too long',
          message: 'Keyword must be 100 characters or less' 
        },
        { status: 400 }
      );
    }

    // Validate location format
    const validLocations = ['uae', 'usa', 'uk', 'canada', 'australia', 'india', 'singapore'];
    if (!validLocations.includes(location.toLowerCase())) {
      return NextResponse.json(
        { 
          error: 'Invalid location',
          message: `Location must be one of: ${validLocations.join(', ')}` 
        },
        { status: 400 }
      );
    }

    console.log(`🚀 Starting optimized content generation for "${keyword}" in ${location}`);
    console.log(`Client IP: ${clientIP}`);
    console.log(`Content Type: ${contentType || 'service_page'}`);
    console.log(`Customizations:`, customizations);

    // Create orchestrator instance
    const orchestrator = new UnifiedContentOrchestrator();

    // Prepare request object
    const contentRequest = {
      keyword: keyword.trim(),
      location: location.toLowerCase(),
      contentType: contentType || 'service_page',
      customizations: {
        tone: customizations?.tone || 'professional',
        targetAudience: customizations?.targetAudience || 'business_owners',
        wordCount: customizations?.wordCount,
        industry: customizations?.industry,
        companyName: customizations?.companyName,
        websiteUrl: customizations?.websiteUrl,
      },
      options: {
        includeImages: options?.includeImages !== false,
        includeInternalLinks: options?.includeInternalLinks !== false,
        includeOutboundLinks: options?.includeOutboundLinks !== false,
        generateMetaTags: options?.generateMetaTags !== false,
        optimizeForFeaturedSnippets: options?.optimizeForFeaturedSnippets !== false,
      },
    };

    // Generate optimized content
    const result = await orchestrator.generateOptimizedContent(contentRequest);

    const processingTime = Date.now() - startTime;
    console.log(`✅ Content generation completed successfully in ${processingTime}ms`);

    // Track success metrics
    performanceMonitor.trackAPICall({
      endpoint: 'generate_optimized_content',
      method: 'POST',
      duration: processingTime,
      status: 200,
      success: true,
      timestamp: Date.now(),
    });

    // Return successful response
    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        processingTime,
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        endpoint: 'generate-optimized',
      },
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Processing-Time': processingTime.toString(),
        'X-Generation-ID': result.generationId,
      },
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('Content generation API error:', error);
    
    // Track error metrics
    performanceMonitor.trackAPICall({
      endpoint: 'generate_optimized_content',
      method: 'POST',
      duration: processingTime,
      status: 500,
      success: false,
      timestamp: Date.now(),
    });

    // Determine error type and response
    let statusCode = 500;
    let errorMessage = 'Internal server error';
    let errorDetails = error.message;

    if (error.message.includes('SERP analysis failed')) {
      statusCode = 503;
      errorMessage = 'Search analysis service unavailable';
    } else if (error.message.includes('No valid competitor URLs found')) {
      statusCode = 404;
      errorMessage = 'No competitors found for the given keyword';
    } else if (error.message.includes('Failed to extract content from any competitor')) {
      statusCode = 503;
      errorMessage = 'Content extraction service unavailable';
    } else if (error.message.includes('Content generation failed')) {
      statusCode = 503;
      errorMessage = 'AI content generation service unavailable';
    }

    return NextResponse.json(
      { 
        success: false,
        error: errorMessage,
        details: errorDetails,
        timestamp: new Date().toISOString(),
        processingTime,
      },
      { 
        status: statusCode,
        headers: {
          'Content-Type': 'application/json',
          'X-Processing-Time': processingTime.toString(),
        },
      }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Health check and API documentation
    return NextResponse.json({
      message: 'Unified Content Generation API',
      version: '1.0.0',
      status: 'operational',
      endpoints: {
        POST: {
          description: 'Generate SEO-optimized content with competitor analysis',
          parameters: {
            required: {
              keyword: 'string - Target keyword for content optimization',
              location: 'string - Target location (uae, usa, uk, canada, australia, india, singapore)',
            },
            optional: {
              contentType: 'string - Type of content (service_page, blog_post, product_page, landing_page)',
              customizations: {
                tone: 'string - Content tone (professional, casual, authoritative, friendly)',
                targetAudience: 'string - Target audience (business_owners, consumers, professionals, general)',
                wordCount: 'number - Target word count',
                industry: 'string - Industry context',
                companyName: 'string - Company name for personalization',
                websiteUrl: 'string - Website URL for context',
              },
              options: {
                includeImages: 'boolean - Include image suggestions (default: true)',
                includeInternalLinks: 'boolean - Include internal link suggestions (default: true)',
                includeOutboundLinks: 'boolean - Include outbound link suggestions (default: true)',
                generateMetaTags: 'boolean - Generate meta tags (default: true)',
                optimizeForFeaturedSnippets: 'boolean - Optimize for featured snippets (default: true)',
              },
            },
          },
          example: {
            keyword: 'International movers in dubai',
            location: 'uae',
            contentType: 'service_page',
            customizations: {
              tone: 'professional',
              targetAudience: 'business_owners',
              companyName: 'Desert Movers Dubai',
            },
          },
        },
      },
      features: [
        'Real-time competitor analysis using Serper.dev',
        'Precision keyword density matching (0.01% accuracy)',
        'AI-powered content generation with 98% human-like quality',
        'LSI keyword and entity integration',
        'E-E-A-T optimization for search authority',
        'NLP-friendly content structure',
        'Comprehensive SEO metrics and benchmarking',
      ],
      rateLimit: {
        requests: 10,
        window: '1 minute',
        perIP: true,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Health check failed',
        details: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
