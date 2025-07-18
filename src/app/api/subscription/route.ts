import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { SubscriptionService } from '@/services/subscription/subscription.service';
import { subscriptionSchema, subscriptionUpdateSchema } from '@/lib/validation/billing.validation';
import { APIError, AuthenticationError } from '@/lib/errors/billing.errors';
import { z } from 'zod';
import { stripe } from '@/lib/stripe/config';

const subscriptionService = new SubscriptionService();

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new AuthenticationError();
    }
    
    const subscription = await subscriptionService.getUserSubscription(session.user.id);
    
    return NextResponse.json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    console.error('Failed to fetch subscription:', error);
    
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
    
    const body = await request.json();
    const { tier_id, billing_cycle, payment_method_id } = body;
    
    // Get the subscription tier
    const { data: tier } = await supabase
      .from('subscription_tiers')
      .select('*')
      .eq('id', tier_id)
      .single();
    
    if (!tier) {
      throw new APIError('Subscription tier not found', 404);
    }
    
    // Get or create Stripe customer
    let customer;
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email')
      .eq('id', session.user.id)
      .single();
    
    if (profile?.stripe_customer_id) {
      customer = await stripe.customers.retrieve(profile.stripe_customer_id);
    } else {
      customer = await stripe.customers.create({
        email: session.user.email,
        metadata: {
          user_id: session.user.id,
        },
      });
      
      // Update profile with Stripe customer ID
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customer.id })
        .eq('id', session.user.id);
    }
    
    // Attach payment method to customer
    await stripe.paymentMethods.attach(payment_method_id, {
      customer: customer.id,
    });
    
    // Set as default payment method
    await stripe.customers.update(customer.id, {
      invoice_settings: {
        default_payment_method: payment_method_id,
      },
    });
    
    // Create Stripe subscription
    const price = billing_cycle === 'yearly' ? tier.price_yearly : tier.price_monthly;
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: tier.display_name,
            },
            unit_amount: price * 100, // Convert to cents
            recurring: {
              interval: billing_cycle === 'yearly' ? 'year' : 'month',
            },
          },
        },
      ],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });
    
    // Create subscription record in database
    await supabase
      .from('user_subscriptions')
      .insert({
        user_id: session.user.id,
        subscription_tier_id: tier_id,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: customer.id,
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
      });
    
    const result = {
      subscription_id: subscription.id,
      client_secret: subscription.latest_invoice?.payment_intent?.client_secret,
      status: subscription.status,
      requires_action: subscription.status === 'incomplete',
    };
    
    return NextResponse.json({
      success: true,
      data: result,
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create subscription:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.issues,
        },
        { status: 400 }
      );
    }
    
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

export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new AuthenticationError();
    }
    
    const body = await request.json();
    const validatedData = subscriptionUpdateSchema.parse(body);
    
    const subscription = await subscriptionService.updateSubscription(
      session.user.id,
      validatedData
    );
    
    return NextResponse.json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    console.error('Failed to update subscription:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.issues,
        },
        { status: 400 }
      );
    }
    
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

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new AuthenticationError();
    }
    
    await subscriptionService.cancelSubscription(session.user.id);
    
    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully',
    });
  } catch (error) {
    console.error('Failed to cancel subscription:', error);
    
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