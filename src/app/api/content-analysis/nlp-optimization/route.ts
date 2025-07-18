import { NextRequest, NextResponse } from 'next/server';
import { AdvancedNLPOptimizer } from '@/lib/content-analysis/nlp-optimizer';

export async function POST(request: NextRequest) {
  try {
    const { content, options = {} } = await request.json();

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is required and must be a string' },
        { status: 400 }
      );
    }

    const optimizer = new AdvancedNLPOptimizer();
    const result = await optimizer.optimizeForNLP(content);

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('NLP optimization error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to optimize content for NLP',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const content = searchParams.get('content');

  if (!content) {
    return NextResponse.json(
      { error: 'Content parameter is required' },
      { status: 400 }
    );
  }

  try {
    const optimizer = new AdvancedNLPOptimizer();
    
    // For GET requests, return analysis only (no optimization)
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const metrics = {
      totalSentences: sentences.length,
      estimatedOptimizations: sentences.length * 0.3, // Rough estimate
      complexity: sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length
    };

    return NextResponse.json({
      success: true,
      data: {
        analysis: metrics,
        recommendations: [
          'Use POST method for full NLP optimization',
          'Content analysis shows potential for improvement'
        ]
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('NLP analysis error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to analyze content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}