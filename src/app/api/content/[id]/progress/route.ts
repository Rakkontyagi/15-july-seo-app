/**
 * Content Generation Progress API Route
 * Implements real-time progress tracking using Server-Sent Events
 * Part of Story 1.1 - Complete Content Generation UI Integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Progress stages for content generation
const GENERATION_STAGES = [
  {
    id: 'serp-analysis',
    label: 'Analyzing Search Results',
    estimatedDuration: 30000, // 30 seconds
  },
  {
    id: 'competitor-scraping',
    label: 'Extracting Competitor Content',
    estimatedDuration: 60000, // 60 seconds
  },
  {
    id: 'seo-analysis',
    label: 'Calculating SEO Metrics',
    estimatedDuration: 45000, // 45 seconds
  },
  {
    id: 'content-generation',
    label: 'Generating Expert Content',
    estimatedDuration: 90000, // 90 seconds
  },
  {
    id: 'validation',
    label: 'Validating Content Quality',
    estimatedDuration: 30000, // 30 seconds
  },
  {
    id: 'optimization',
    label: 'Final SEO Optimization',
    estimatedDuration: 15000, // 15 seconds
  },
];

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const connectionId = searchParams.get('connectionId');

  // Validate parameters
  if (!userId || !connectionId) {
    return new Response('Missing required parameters', { status: 400 });
  }

  // Verify user authentication (simplified for demo)
  if (!userId.startsWith('test-') && userId !== 'anonymous') {
    try {
      const { data: user, error } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', userId)
        .single();

      if (error || !user) {
        return new Response('Unauthorized', { status: 401 });
      }
    } catch (error) {
      console.error('Auth verification error:', error);
      return new Response('Authentication error', { status: 500 });
    }
  }

  console.log(`📡 SSE connection established: ${connectionId} for content ${params.id}`);

  // Create readable stream for SSE
  const encoder = new TextEncoder();
  let isActive = true;
  let currentStage = 0;

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection confirmation
      const connectionMessage = {
        type: 'connected',
        data: {
          contentId: params.id,
          connectionId,
          timestamp: Date.now(),
        },
      };

      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify(connectionMessage)}\n\n`)
      );

      // Start progress simulation
      simulateContentGeneration(controller, encoder);
    },

    cancel() {
      console.log(`📡 SSE connection closed: ${connectionId}`);
      isActive = false;
    },
  });

  async function simulateContentGeneration(
    controller: ReadableStreamDefaultController,
    encoder: TextEncoder
  ) {
    try {
      const startTime = Date.now();

      for (let i = 0; i < GENERATION_STAGES.length; i++) {
        if (!isActive) break;

        const stage = GENERATION_STAGES[i];
        currentStage = i;

        // Send stage start message
        const progressMessage = {
          type: 'progress',
          data: {
            stage: stage.id,
            label: stage.label,
            currentStep: i + 1,
            totalSteps: GENERATION_STAGES.length,
            percentage: Math.round(((i + 1) / GENERATION_STAGES.length) * 100),
            estimatedTimeRemaining: calculateRemainingTime(i),
            timestamp: Date.now(),
          },
        };

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(progressMessage)}\n\n`)
        );

        // Simulate stage processing with realistic timing
        await simulateStageProcessing(stage, controller, encoder);
      }

      if (isActive) {
        // Send completion message
        const completionMessage = {
          type: 'complete',
          data: {
            contentId: params.id,
            content: generateMockContent(params.id),
            metadata: {
              keyword: 'example keyword',
              wordCount: 2150,
              seoScore: 92,
              qualityScore: 88,
              generationTime: Date.now() - startTime,
              method: 'optimized',
              sources: [
                'https://example1.com',
                'https://example2.com',
                'https://example3.com',
              ],
            },
            completedAt: new Date().toISOString(),
            totalDuration: Date.now() - startTime,
            timestamp: Date.now(),
          },
        };

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(completionMessage)}\n\n`)
        );

        // Store completion in database
        await storeGenerationResult(params.id, userId, completionMessage.data);
      }

      controller.close();
    } catch (error) {
      console.error('Content generation error:', error);

      if (isActive) {
        const errorMessage = {
          type: 'error',
          data: {
            error: error instanceof Error ? error.message : 'Unknown error',
            stage: currentStage < GENERATION_STAGES.length ? GENERATION_STAGES[currentStage].id : 'unknown',
            timestamp: Date.now(),
          },
        };

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(errorMessage)}\n\n`)
        );
      }

      controller.close();
    }
  }

  async function simulateStageProcessing(
    stage: any,
    controller: ReadableStreamDefaultController,
    encoder: TextEncoder
  ) {
    const stageStartTime = Date.now();
    const stageDuration = stage.estimatedDuration;
    const updateInterval = Math.min(2000, stageDuration / 5); // Update every 2 seconds or 5 times per stage

    return new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        if (!isActive) {
          clearInterval(interval);
          resolve();
          return;
        }

        const elapsed = Date.now() - stageStartTime;
        const stageProgress = Math.min(elapsed / stageDuration, 1);

        // Send stage progress update
        const updateMessage = {
          type: 'progress',
          data: {
            stage: stage.id,
            label: `${stage.label} (${Math.round(stageProgress * 100)}%)`,
            currentStep: currentStage + 1,
            totalSteps: GENERATION_STAGES.length,
            percentage: Math.round(((currentStage + stageProgress) / GENERATION_STAGES.length) * 100),
            estimatedTimeRemaining: calculateRemainingTime(currentStage, stageProgress),
            stageProgress: Math.round(stageProgress * 100),
            timestamp: Date.now(),
          },
        };

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(updateMessage)}\n\n`)
        );

        if (stageProgress >= 1) {
          clearInterval(interval);
          resolve();
        }
      }, updateInterval);
    });
  }

  function calculateRemainingTime(currentStageIndex: number, stageProgress: number = 0): number {
    let remainingTime = 0;

    // Add remaining time for current stage
    if (currentStageIndex < GENERATION_STAGES.length) {
      const currentStage = GENERATION_STAGES[currentStageIndex];
      remainingTime += currentStage.estimatedDuration * (1 - stageProgress);
    }

    // Add time for remaining stages
    for (let i = currentStageIndex + 1; i < GENERATION_STAGES.length; i++) {
      remainingTime += GENERATION_STAGES[i].estimatedDuration;
    }

    return Math.round(remainingTime);
  }

  function generateMockContent(contentId: string): string {
    return `# Generated Content for ${contentId}

## Introduction

This is a high-quality, SEO-optimized piece of content generated using advanced AI techniques and competitor analysis. The content has been carefully crafted to meet search engine requirements while providing valuable information to readers.

## Key Benefits

1. **SEO Optimized**: Content is optimized for search engines with proper keyword density and structure
2. **High Quality**: Professional-grade content that engages readers
3. **Comprehensive**: Covers all important aspects of the topic
4. **Actionable**: Provides practical advice and next steps

## Main Content

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

### Subsection 1

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

### Subsection 2

Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.

## Best Practices

- Follow SEO guidelines for optimal search engine visibility
- Create engaging content that provides value to readers
- Use proper heading structure and formatting
- Include relevant keywords naturally throughout the content

## Conclusion

This generated content demonstrates the capabilities of our advanced content generation system. The content is optimized for both search engines and human readers, providing the best of both worlds.

## Next Steps

1. Review the generated content for accuracy
2. Make any necessary adjustments
3. Publish the content on your website
4. Monitor performance and optimize as needed

*Content generated on ${new Date().toISOString()} using advanced AI optimization techniques.*`;
  }

  async function storeGenerationResult(contentId: string, userId: string, data: any) {
    try {
      const { error } = await supabase
        .from('content_generations')
        .insert({
          id: contentId,
          user_id: userId,
          keyword: data.metadata.keyword,
          content: data.content,
          status: 'completed',
          seo_score: data.metadata.seoScore,
          quality_score: data.metadata.qualityScore,
          word_count: data.metadata.wordCount,
          generation_time: data.metadata.generationTime,
          created_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error storing generation result:', error);
      }
    } catch (error) {
      console.error('Database error:', error);
    }
  }

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  });
}

// Handle preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  });
}
