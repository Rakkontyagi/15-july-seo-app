import { NextRequest, NextResponse } from 'next/server';
import { stripe, getStripeWebhookSecret } from '@/lib/stripe/config';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { NotificationService } from '@/services/notification/notification.service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const notificationService = new NotificationService();

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = headers();
    const signature = headersList.get('stripe-signature');
    
    if (!signature) {
      console.error('Missing Stripe signature');
      return NextResponse.json(
        { error: 'Missing Stripe signature' },
        { status: 400 }
      );
    }
    
    const webhookSecret = getStripeWebhookSecret();
    
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }
    
    console.log('Processing webhook event:', event.type);
    
    // Log the event for audit purposes
    await supabase.from('billing_events').insert({
      event_type: event.type,
      stripe_event_id: event.id,
      event_data: event.data,
    });
    
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object);
        break;
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
        
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
        
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
        
      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Error processing webhook' },
      { status: 500 }
    );
  }
}

async function handleSubscriptionUpdate(subscription: any) {
  const { data: existingSubscription } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('stripe_subscription_id', subscription.id)
    .single();
    
  if (existingSubscription) {
    // Update existing subscription
    await supabase
      .from('user_subscriptions')
      .update({
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
      })
      .eq('stripe_subscription_id', subscription.id);
  } else {
    // Get user from Stripe customer
    const customer = await stripe.customers.retrieve(subscription.customer);
    if (customer.deleted) {
      console.error('Customer is deleted');
      return;
    }
    
    const userId = customer.metadata?.user_id;
    if (!userId) {
      console.error('No user_id in customer metadata');
      return;
    }
    
    // Create new subscription record
    await supabase
      .from('user_subscriptions')
      .insert({
        user_id: userId,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer,
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
      });
  }
}

async function handleSubscriptionDeleted(subscription: any) {
  await supabase
    .from('user_subscriptions')
    .update({
      status: 'canceled',
      cancel_at_period_end: true,
    })
    .eq('stripe_subscription_id', subscription.id);
}

async function handlePaymentSucceeded(invoice: any) {
  // Reset usage tracking for new billing period
  if (invoice.billing_reason === 'subscription_cycle') {
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('user_id, subscription_tier_id')
      .eq('stripe_subscription_id', invoice.subscription)
      .single();
      
    if (subscription) {
      const periodStart = new Date(invoice.period_start * 1000).toISOString().split('T')[0];
      const periodEnd = new Date(invoice.period_end * 1000).toISOString().split('T')[0];
      
      await supabase
        .from('usage_tracking')
        .upsert({
          user_id: subscription.user_id,
          billing_period_start: periodStart,
          billing_period_end: periodEnd,
          content_generated: 0,
          api_calls: 0,
        });

      // Send renewal notification
      const { data: tier } = await supabase
        .from('subscription_tiers')
        .select('display_name, price_monthly')
        .eq('id', subscription.subscription_tier_id)
        .single();

      if (tier) {
        await notificationService.sendSubscriptionRenewalNotification(
          subscription.user_id,
          {
            planName: tier.display_name,
            amount: tier.price_monthly * 100,
            nextBillingDate: new Date(invoice.period_end * 1000).toISOString(),
          }
        );
      }
    }
  }
}

async function handlePaymentFailed(invoice: any) {
  // Update subscription status to past_due
  await supabase
    .from('user_subscriptions')
    .update({
      status: 'past_due',
    })
    .eq('stripe_subscription_id', invoice.subscription);

  // Send payment failed notification
  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', invoice.subscription)
    .single();

  if (subscription) {
    await notificationService.sendPaymentFailedNotification(
      subscription.user_id,
      {
        amount: invoice.amount_due,
        attemptDate: new Date(invoice.created * 1000).toISOString(),
        reason: invoice.last_finalization_error?.message || 'Payment method declined',
        updatePaymentUrl: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
      }
    );
  }
}

async function handleTrialWillEnd(subscription: any) {
  // Send notification about trial ending
  // This would typically trigger an email notification
  console.log('Trial will end for subscription:', subscription.id);
}