/**
 * Stripe Integration Service
 * Completes Story 1.2 - Enterprise subscription billing and payment processing
 * Handles subscriptions, invoicing, and payment management
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { enterpriseSubscriptionManager } from '@/lib/subscription/enterprise-subscription-manager';
import { performanceMonitor } from '@/lib/monitoring/performance-monitor';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Types
export interface StripeCustomer {
  id: string;
  email: string;
  name?: string;
  organizationId: string;
  stripeCustomerId: string;
  defaultPaymentMethod?: string;
  billingAddress?: Stripe.Address;
  taxIds?: string[];
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  stripePriceId: string;
  tier: 'free' | 'trial' | 'professional' | 'enterprise';
  billingInterval: 'month' | 'year';
  amount: number;
  currency: string;
  features: string[];
  limits: {
    contentGenerations: number;
    apiCalls: number;
    storageGB: number;
    teamMembers: number;
  };
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  clientSecret: string;
  customerId: string;
  organizationId: string;
  metadata: Record<string, string>;
}

export interface Invoice {
  id: string;
  stripeInvoiceId: string;
  customerId: string;
  organizationId: string;
  amount: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  dueDate: string;
  paidAt?: string;
  hostedInvoiceUrl?: string;
  invoicePdf?: string;
  lineItems: InvoiceLineItem[];
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitAmount: number;
  totalAmount: number;
  period?: {
    start: string;
    end: string;
  };
}

// Subscription Plans Configuration
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    stripePriceId: '', // No Stripe price for free plan
    tier: 'free',
    billingInterval: 'month',
    amount: 0,
    currency: 'usd',
    features: ['Basic content generation', 'Limited templates', 'Community support'],
    limits: {
      contentGenerations: 10,
      apiCalls: 100,
      storageGB: 1,
      teamMembers: 1,
    },
  },
  {
    id: 'professional-monthly',
    name: 'Professional (Monthly)',
    stripePriceId: process.env.STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID!,
    tier: 'professional',
    billingInterval: 'month',
    amount: 4900, // $49.00
    currency: 'usd',
    features: [
      'Unlimited content generation',
      'All templates',
      'Advanced SEO analysis',
      'Priority support',
      'Team collaboration',
    ],
    limits: {
      contentGenerations: 1000,
      apiCalls: 10000,
      storageGB: 50,
      teamMembers: 5,
    },
  },
  {
    id: 'professional-yearly',
    name: 'Professional (Yearly)',
    stripePriceId: process.env.STRIPE_PROFESSIONAL_YEARLY_PRICE_ID!,
    tier: 'professional',
    billingInterval: 'year',
    amount: 49000, // $490.00 (2 months free)
    currency: 'usd',
    features: [
      'Unlimited content generation',
      'All templates',
      'Advanced SEO analysis',
      'Priority support',
      'Team collaboration',
    ],
    limits: {
      contentGenerations: 1000,
      apiCalls: 10000,
      storageGB: 50,
      teamMembers: 5,
    },
  },
  {
    id: 'enterprise-monthly',
    name: 'Enterprise (Monthly)',
    stripePriceId: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID!,
    tier: 'enterprise',
    billingInterval: 'month',
    amount: 19900, // $199.00
    currency: 'usd',
    features: [
      'Unlimited everything',
      'Custom templates',
      'Advanced analytics',
      'Dedicated support',
      'Custom integrations',
      'SLA guarantee',
    ],
    limits: {
      contentGenerations: -1, // Unlimited
      apiCalls: -1, // Unlimited
      storageGB: 500,
      teamMembers: 50,
    },
  },
];

// Stripe Integration Service
export class StripeIntegrationService {
  private static instance: StripeIntegrationService;

  static getInstance(): StripeIntegrationService {
    if (!StripeIntegrationService.instance) {
      StripeIntegrationService.instance = new StripeIntegrationService();
    }
    return StripeIntegrationService.instance;
  }

  // Customer Management
  async createCustomer(
    organizationId: string,
    email: string,
    name?: string,
    metadata?: Record<string, string>
  ): Promise<StripeCustomer> {
    const startTime = Date.now();

    try {
      // Create Stripe customer
      const stripeCustomer = await stripe.customers.create({
        email,
        name,
        metadata: {
          organizationId,
          ...metadata,
        },
      });

      // Store customer in database
      const customer: Omit<StripeCustomer, 'id'> = {
        email,
        name,
        organizationId,
        stripeCustomerId: stripeCustomer.id,
      };

      const { data, error } = await supabase
        .from('stripe_customers')
        .insert(customer)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to store customer: ${error.message}`);
      }

      // Track performance
      performanceMonitor.trackAPICall({
        endpoint: 'create_customer',
        method: 'POST',
        duration: Date.now() - startTime,
        status: 200,
        success: true,
        timestamp: Date.now(),
      });

      return data as StripeCustomer;

    } catch (error) {
      performanceMonitor.trackAPICall({
        endpoint: 'create_customer',
        method: 'POST',
        duration: Date.now() - startTime,
        status: 500,
        success: false,
        timestamp: Date.now(),
      });

      throw error;
    }
  }

  // Subscription Management
  async createSubscription(
    customerId: string,
    planId: string,
    paymentMethodId?: string
  ): Promise<Stripe.Subscription> {
    const startTime = Date.now();

    try {
      const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
      if (!plan) {
        throw new Error('Invalid subscription plan');
      }

      // Get customer from database
      const { data: customer, error } = await supabase
        .from('stripe_customers')
        .select('*')
        .eq('id', customerId)
        .single();

      if (error || !customer) {
        throw new Error('Customer not found');
      }

      // Create subscription in Stripe
      const subscriptionParams: Stripe.SubscriptionCreateParams = {
        customer: customer.stripeCustomerId,
        items: [{ price: plan.stripePriceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          organizationId: customer.organizationId,
          planId,
        },
      };

      if (paymentMethodId) {
        subscriptionParams.default_payment_method = paymentMethodId;
      }

      const subscription = await stripe.subscriptions.create(subscriptionParams);

      // Update enterprise subscription in database
      await this.updateEnterpriseSubscription(customer.organizationId, subscription, plan);

      // Track performance
      performanceMonitor.trackAPICall({
        endpoint: 'create_subscription',
        method: 'POST',
        duration: Date.now() - startTime,
        status: 200,
        success: true,
        timestamp: Date.now(),
      });

      return subscription;

    } catch (error) {
      performanceMonitor.trackAPICall({
        endpoint: 'create_subscription',
        method: 'POST',
        duration: Date.now() - startTime,
        status: 500,
        success: false,
        timestamp: Date.now(),
      });

      throw error;
    }
  }

  private async updateEnterpriseSubscription(
    organizationId: string,
    stripeSubscription: Stripe.Subscription,
    plan: SubscriptionPlan
  ): Promise<void> {
    const subscriptionData = {
      tier: plan.tier,
      status: this.mapStripeStatus(stripeSubscription.status),
      billing_cycle: plan.billingInterval === 'year' ? 'yearly' : 'monthly',
      usage_limits: plan.limits,
      stripe_subscription_id: stripeSubscription.id,
      next_billing_date: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('enterprise_subscriptions')
      .upsert({
        organization_id: organizationId,
        ...subscriptionData,
      });

    if (error) {
      throw new Error(`Failed to update enterprise subscription: ${error.message}`);
    }
  }

  // Payment Intent Management
  async createPaymentIntent(
    customerId: string,
    amount: number,
    currency: string = 'usd',
    metadata?: Record<string, string>
  ): Promise<PaymentIntent> {
    const startTime = Date.now();

    try {
      // Get customer from database
      const { data: customer, error } = await supabase
        .from('stripe_customers')
        .select('*')
        .eq('id', customerId)
        .single();

      if (error || !customer) {
        throw new Error('Customer not found');
      }

      // Create payment intent in Stripe
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency,
        customer: customer.stripeCustomerId,
        automatic_payment_methods: { enabled: true },
        metadata: {
          organizationId: customer.organizationId,
          ...metadata,
        },
      });

      // Store payment intent in database
      const paymentIntentData: Omit<PaymentIntent, 'id'> = {
        amount,
        currency,
        status: paymentIntent.status,
        clientSecret: paymentIntent.client_secret!,
        customerId,
        organizationId: customer.organizationId,
        metadata: metadata || {},
      };

      const { data, error: insertError } = await supabase
        .from('payment_intents')
        .insert(paymentIntentData)
        .select()
        .single();

      if (insertError) {
        throw new Error(`Failed to store payment intent: ${insertError.message}`);
      }

      // Track performance
      performanceMonitor.trackAPICall({
        endpoint: 'create_payment_intent',
        method: 'POST',
        duration: Date.now() - startTime,
        status: 200,
        success: true,
        timestamp: Date.now(),
      });

      return data as PaymentIntent;

    } catch (error) {
      performanceMonitor.trackAPICall({
        endpoint: 'create_payment_intent',
        method: 'POST',
        duration: Date.now() - startTime,
        status: 500,
        success: false,
        timestamp: Date.now(),
      });

      throw error;
    }
  }

  // Invoice Management
  async createInvoice(
    customerId: string,
    lineItems: InvoiceLineItem[],
    dueDate?: Date
  ): Promise<Invoice> {
    const startTime = Date.now();

    try {
      // Get customer from database
      const { data: customer, error } = await supabase
        .from('stripe_customers')
        .select('*')
        .eq('id', customerId)
        .single();

      if (error || !customer) {
        throw new Error('Customer not found');
      }

      // Create invoice in Stripe
      const invoice = await stripe.invoices.create({
        customer: customer.stripeCustomerId,
        collection_method: 'send_invoice',
        days_until_due: dueDate ? Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 30,
        metadata: {
          organizationId: customer.organizationId,
        },
      });

      // Add line items
      for (const item of lineItems) {
        await stripe.invoiceItems.create({
          customer: customer.stripeCustomerId,
          invoice: invoice.id,
          description: item.description,
          quantity: item.quantity,
          unit_amount: item.unitAmount,
        });
      }

      // Finalize invoice
      const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);

      // Store invoice in database
      const invoiceData: Omit<Invoice, 'id'> = {
        stripeInvoiceId: finalizedInvoice.id,
        customerId,
        organizationId: customer.organizationId,
        amount: finalizedInvoice.amount_due,
        currency: finalizedInvoice.currency,
        status: this.mapInvoiceStatus(finalizedInvoice.status),
        dueDate: new Date(finalizedInvoice.due_date! * 1000).toISOString(),
        hostedInvoiceUrl: finalizedInvoice.hosted_invoice_url,
        invoicePdf: finalizedInvoice.invoice_pdf,
        lineItems,
      };

      const { data, error: insertError } = await supabase
        .from('invoices')
        .insert(invoiceData)
        .select()
        .single();

      if (insertError) {
        throw new Error(`Failed to store invoice: ${insertError.message}`);
      }

      // Track performance
      performanceMonitor.trackAPICall({
        endpoint: 'create_invoice',
        method: 'POST',
        duration: Date.now() - startTime,
        status: 200,
        success: true,
        timestamp: Date.now(),
      });

      return data as Invoice;

    } catch (error) {
      performanceMonitor.trackAPICall({
        endpoint: 'create_invoice',
        method: 'POST',
        duration: Date.now() - startTime,
        status: 500,
        success: false,
        timestamp: Date.now(),
      });

      throw error;
    }
  }

  // Webhook Handling
  async handleWebhook(
    payload: string,
    signature: string
  ): Promise<void> {
    const startTime = Date.now();

    try {
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );

      console.log(`🔔 Stripe webhook received: ${event.type}`);

      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionCancellation(event.data.object as Stripe.Subscription);
          break;

        case 'invoice.payment_succeeded':
          await this.handlePaymentSuccess(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          await this.handlePaymentFailure(event.data.object as Stripe.Invoice);
          break;

        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSuccess(event.data.object as Stripe.PaymentIntent);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailure(event.data.object as Stripe.PaymentIntent);
          break;

        default:
          console.log(`Unhandled webhook event type: ${event.type}`);
      }

      // Track performance
      performanceMonitor.trackAPICall({
        endpoint: 'handle_webhook',
        method: 'POST',
        duration: Date.now() - startTime,
        status: 200,
        success: true,
        timestamp: Date.now(),
      });

    } catch (error) {
      console.error('Webhook handling error:', error);
      
      performanceMonitor.trackAPICall({
        endpoint: 'handle_webhook',
        method: 'POST',
        duration: Date.now() - startTime,
        status: 500,
        success: false,
        timestamp: Date.now(),
      });

      throw error;
    }
  }

  private async handleSubscriptionUpdate(subscription: Stripe.Subscription): Promise<void> {
    const organizationId = subscription.metadata.organizationId;
    if (!organizationId) return;

    const planId = subscription.metadata.planId;
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!plan) return;

    await this.updateEnterpriseSubscription(organizationId, subscription, plan);
  }

  private async handleSubscriptionCancellation(subscription: Stripe.Subscription): Promise<void> {
    const organizationId = subscription.metadata.organizationId;
    if (!organizationId) return;

    await supabase
      .from('enterprise_subscriptions')
      .update({
        status: 'canceled',
        updated_at: new Date().toISOString(),
      })
      .eq('organization_id', organizationId);
  }

  private async handlePaymentSuccess(invoice: Stripe.Invoice): Promise<void> {
    // Update invoice status in database
    await supabase
      .from('invoices')
      .update({
        status: 'paid',
        paidAt: new Date().toISOString(),
      })
      .eq('stripeInvoiceId', invoice.id);
  }

  private async handlePaymentFailure(invoice: Stripe.Invoice): Promise<void> {
    const organizationId = invoice.metadata?.organizationId;
    if (!organizationId) return;

    // Handle payment failure
    await enterpriseSubscriptionManager.handleFailedPayment(
      organizationId,
      invoice.payment_intent as string,
      'Payment failed for invoice'
    );
  }

  private async handlePaymentIntentSuccess(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    // Update payment intent status
    await supabase
      .from('payment_intents')
      .update({ status: paymentIntent.status })
      .eq('clientSecret', paymentIntent.client_secret);
  }

  private async handlePaymentIntentFailure(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const organizationId = paymentIntent.metadata?.organizationId;
    if (!organizationId) return;

    // Update payment intent status
    await supabase
      .from('payment_intents')
      .update({ status: paymentIntent.status })
      .eq('clientSecret', paymentIntent.client_secret);

    // Handle payment failure
    await enterpriseSubscriptionManager.handleFailedPayment(
      organizationId,
      paymentIntent.id,
      'Payment intent failed'
    );
  }

  // Utility Methods
  private mapStripeStatus(stripeStatus: string): string {
    switch (stripeStatus) {
      case 'active': return 'active';
      case 'canceled': return 'canceled';
      case 'past_due': return 'past_due';
      case 'trialing': return 'trialing';
      default: return 'active';
    }
  }

  private mapInvoiceStatus(stripeStatus: Stripe.Invoice.Status): Invoice['status'] {
    switch (stripeStatus) {
      case 'draft': return 'draft';
      case 'open': return 'open';
      case 'paid': return 'paid';
      case 'void': return 'void';
      case 'uncollectible': return 'uncollectible';
      default: return 'open';
    }
  }

  // Public API Methods
  async getCustomer(organizationId: string): Promise<StripeCustomer | null> {
    const { data, error } = await supabase
      .from('stripe_customers')
      .select('*')
      .eq('organizationId', organizationId)
      .single();

    if (error) {
      console.error('Error fetching customer:', error);
      return null;
    }

    return data as StripeCustomer;
  }

  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return SUBSCRIPTION_PLANS;
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
  }

  async updateSubscription(subscriptionId: string, newPlanId: string): Promise<Stripe.Subscription> {
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === newPlanId);
    if (!plan) {
      throw new Error('Invalid subscription plan');
    }

    return await stripe.subscriptions.update(subscriptionId, {
      items: [{ price: plan.stripePriceId }],
      proration_behavior: 'create_prorations',
    });
  }
}

// Export singleton instance
export const stripeIntegrationService = StripeIntegrationService.getInstance();
