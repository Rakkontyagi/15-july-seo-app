import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { SubscriptionService } from '@/services/subscription/subscription.service';
import { APIError, AuthenticationError } from '@/lib/errors/billing.errors';

const subscriptionService = new SubscriptionService();

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new AuthenticationError();
    }
    
    const usage = await subscriptionService.getUserUsage(session.user.id);
    
    return NextResponse.json({
      success: true,
      data: usage,
    });
  } catch (error) {
    console.error('Failed to fetch usage:', error);
    
    if (error instanceof APIError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code,
        },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new AuthenticationError();
    }
    
    const { type } = await request.json();
    
    if (!type || !['content', 'api'].includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid usage type. Must be "content" or "api"',
        },
        { status: 400 }
      );
    }
    
    // Check usage limit before incrementing
    const canUse = await subscriptionService.checkUsageLimit(session.user.id);
    if (!canUse) {
      return NextResponse.json(
        {
          success: false,
          error: 'Usage limit exceeded',
          code: 'USAGE_LIMIT_EXCEEDED',
        },
        { status: 429 }
      );
    }
    
    await subscriptionService.incrementUsage(session.user.id, type);
    
    return NextResponse.json({
      success: true,
      message: 'Usage incremented successfully',
    });
  } catch (error) {
    console.error('Failed to increment usage:', error);
    
    if (error instanceof APIError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code,
        },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}