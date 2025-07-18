import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import Stripe from 'https://esm.sh/stripe@13.11.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
    });

    const signature = req.headers.get('stripe-signature');
    const body = await req.text();
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!signature || !webhookSecret) {
      console.error('Missing signature or webhook secret');
      return new Response('Missing signature or webhook secret', { status: 400 });
    }

    let event: WebhookEvent;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret) as WebhookEvent;
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return new Response('Webhook signature verification failed', { status: 400 });
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
        await handleSubscriptionUpdate(supabase, event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(supabase, event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(supabase, event.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(supabase, event.data.object);
        break;

      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(supabase, event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response('Error processing webhook', { status: 500 });
  }
});

async function handleSubscriptionUpdate(supabase: any, subscription: any) {
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
    // Create new subscription record
    // Note: This requires customer metadata to include user_id
    const customer = await supabase
      .from('stripe_customers')
      .select('user_id')
      .eq('stripe_customer_id', subscription.customer)
      .single();

    if (customer?.data?.user_id) {
      await supabase
        .from('user_subscriptions')
        .insert({
          user_id: customer.data.user_id,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: subscription.customer,
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
        });
    }
  }
}

async function handleSubscriptionDeleted(supabase: any, subscription: any) {
  await supabase
    .from('user_subscriptions')
    .update({
      status: 'canceled',
      cancel_at_period_end: true,
    })
    .eq('stripe_subscription_id', subscription.id);
}

async function handlePaymentSucceeded(supabase: any, invoice: any) {
  // Reset usage tracking for new billing period
  if (invoice.billing_reason === 'subscription_cycle') {
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('user_id')
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
    }
  }
}

async function handlePaymentFailed(supabase: any, invoice: any) {
  // Update subscription status to past_due
  await supabase
    .from('user_subscriptions')
    .update({
      status: 'past_due',
    })
    .eq('stripe_subscription_id', invoice.subscription);
}

async function handleTrialWillEnd(supabase: any, subscription: any) {
  // Send notification about trial ending
  // This would typically trigger an email notification
  console.log('Trial will end for subscription:', subscription.id);
}