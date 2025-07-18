import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionService } from '@/services/subscription/subscription.service';
import { APIError } from '@/lib/errors/billing.errors';

const subscriptionService = new SubscriptionService();

export async function GET(request: NextRequest) {
  try {
    const tiers = await subscriptionService.getSubscriptionTiers();
    
    return NextResponse.json({
      success: true,
      data: tiers,
    });
  } catch (error) {
    console.error('Failed to fetch subscription tiers:', error);
    
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