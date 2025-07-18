import { createClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/stripe/config';
import { BillingError, SubscriptionError } from '@/lib/errors/billing.errors';
import { SubscriptionInput, SubscriptionUpdateInput } from '@/lib/validation/billing.validation';

export interface SubscriptionTier {
  id: string;
  name: string;
  display_name: string;
  price_monthly: number;
  price_yearly: number;
  content_limit: number;
  features: Record<string, any>;
  stripe_price_id_monthly?: string;
  stripe_price_id_yearly?: string;
  is_active: boolean;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  subscription_tier_id: string;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid';
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface UsageStats {
  content_generated: number;
  api_calls: number;
  billing_period_start: string;
  billing_period_end: string;
}

export class SubscriptionService {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  async getSubscriptionTiers(): Promise<SubscriptionTier[]> {
    const { data, error } = await this.supabase
      .from('subscription_tiers')
      .select('*')
      .eq('is_active', true)
      .order('price_monthly', { ascending: true });

    if (error) {
      throw new SubscriptionError(`Failed to fetch subscription tiers: ${error.message}`);
    }

    return data || [];
  }

  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    const { data, error } = await this.supabase
      .from('user_subscriptions')
      .select(`
        *,
        subscription_tier:subscription_tiers(*)
      `)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new SubscriptionError(`Failed to fetch user subscription: ${error.message}`);
    }

    return data;
  }

  async createSubscription(userId: string, input: SubscriptionInput): Promise<UserSubscription> {
    try {
      // Get subscription tier
      const { data: tier, error: tierError } = await this.supabase
        .from('subscription_tiers')
        .select('*')
        .eq('id', input.tierId)
        .single();

      if (tierError || !tier) {
        throw new SubscriptionError('Invalid subscription tier');
      }

      // Get or create Stripe customer
      const { data: existingCustomer } = await this.supabase
        .from('stripe_customers')
        .select('stripe_customer_id')
        .eq('user_id', userId)
        .single();

      let customerId = existingCustomer?.stripe_customer_id;

      if (!customerId) {
        // Create new Stripe customer
        const { data: userProfile } = await this.supabase
          .from('users')
          .select('email, full_name')
          .eq('id', userId)
          .single();

        const customer = await stripe.customers.create({
          email: userProfile?.email,
          name: userProfile?.full_name,
          metadata: {
            user_id: userId,
          },
        });

        customerId = customer.id;

        // Store customer ID
        await this.supabase
          .from('stripe_customers')
          .insert({
            user_id: userId,
            stripe_customer_id: customerId,
          });
      }

      // Attach payment method to customer
      await stripe.paymentMethods.attach(input.paymentMethodId, {
        customer: customerId,
      });

      // Set as default payment method
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: input.paymentMethodId,
        },
      });

      // Get price ID based on billing cycle
      const priceId = input.billingCycle === 'monthly' 
        ? tier.stripe_price_id_monthly 
        : tier.stripe_price_id_yearly;

      if (!priceId) {
        throw new SubscriptionError('Price not configured for selected billing cycle');
      }

      // Create Stripe subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });

      // Create subscription record
      const { data: newSubscription, error: subscriptionError } = await this.supabase
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          subscription_tier_id: input.tierId,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: customerId,
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
        })
        .select()
        .single();

      if (subscriptionError) {
        throw new SubscriptionError(`Failed to create subscription record: ${subscriptionError.message}`);
      }

      return newSubscription;
    } catch (error) {
      if (error instanceof SubscriptionError) {
        throw error;
      }
      throw new BillingError(`Failed to create subscription: ${error.message}`);
    }
  }

  async updateSubscription(userId: string, input: SubscriptionUpdateInput): Promise<UserSubscription> {
    try {
      const currentSubscription = await this.getUserSubscription(userId);
      if (!currentSubscription) {
        throw new SubscriptionError('No active subscription found');
      }

      const updates: Partial<UserSubscription> = {};

      // Handle tier change
      if (input.tierId) {
        const { data: newTier } = await this.supabase
          .from('subscription_tiers')
          .select('*')
          .eq('id', input.tierId)
          .single();

        if (!newTier) {
          throw new SubscriptionError('Invalid subscription tier');
        }

        // Update Stripe subscription
        if (currentSubscription.stripe_subscription_id) {
          const priceId = input.billingCycle === 'monthly' 
            ? newTier.stripe_price_id_monthly 
            : newTier.stripe_price_id_yearly;

          await stripe.subscriptions.update(currentSubscription.stripe_subscription_id, {
            items: [{ price: priceId }],
            proration_behavior: 'create_prorations',
          });
        }

        updates.subscription_tier_id = input.tierId;
      }

      // Handle payment method change
      if (input.paymentMethodId && currentSubscription.stripe_customer_id) {
        await stripe.paymentMethods.attach(input.paymentMethodId, {
          customer: currentSubscription.stripe_customer_id,
        });

        await stripe.customers.update(currentSubscription.stripe_customer_id, {
          invoice_settings: {
            default_payment_method: input.paymentMethodId,
          },
        });
      }

      // Update subscription record
      const { data: updatedSubscription, error } = await this.supabase
        .from('user_subscriptions')
        .update(updates)
        .eq('id', currentSubscription.id)
        .select()
        .single();

      if (error) {
        throw new SubscriptionError(`Failed to update subscription: ${error.message}`);
      }

      return updatedSubscription;
    } catch (error) {
      if (error instanceof SubscriptionError) {
        throw error;
      }
      throw new BillingError(`Failed to update subscription: ${error.message}`);
    }
  }

  async cancelSubscription(userId: string): Promise<void> {
    try {
      const subscription = await this.getUserSubscription(userId);
      if (!subscription) {
        throw new SubscriptionError('No active subscription found');
      }

      // Cancel Stripe subscription at period end
      if (subscription.stripe_subscription_id) {
        await stripe.subscriptions.update(subscription.stripe_subscription_id, {
          cancel_at_period_end: true,
        });
      }

      // Update subscription record
      await this.supabase
        .from('user_subscriptions')
        .update({
          cancel_at_period_end: true,
        })
        .eq('id', subscription.id);
    } catch (error) {
      if (error instanceof SubscriptionError) {
        throw error;
      }
      throw new BillingError(`Failed to cancel subscription: ${error.message}`);
    }
  }

  async getUserUsage(userId: string): Promise<UsageStats | null> {
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const { data, error } = await this.supabase
      .from('usage_tracking')
      .select('*')
      .eq('user_id', userId)
      .eq('billing_period_start', startOfMonth.toISOString().split('T')[0])
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new SubscriptionError(`Failed to fetch usage stats: ${error.message}`);
    }

    return data;
  }

  async incrementUsage(userId: string, type: 'content' | 'api'): Promise<void> {
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const periodStart = startOfMonth.toISOString().split('T')[0];
    const periodEnd = endOfMonth.toISOString().split('T')[0];

    const incrementField = type === 'content' ? 'content_generated' : 'api_calls';

    const { error } = await this.supabase
      .from('usage_tracking')
      .upsert({
        user_id: userId,
        billing_period_start: periodStart,
        billing_period_end: periodEnd,
        [incrementField]: 1,
      })
      .eq('user_id', userId)
      .eq('billing_period_start', periodStart);

    if (error) {
      throw new SubscriptionError(`Failed to increment usage: ${error.message}`);
    }
  }

  async checkUsageLimit(userId: string): Promise<boolean> {
    const [subscription, usage] = await Promise.all([
      this.getUserSubscription(userId),
      this.getUserUsage(userId),
    ]);

    if (!subscription) {
      return false; // No subscription = no access
    }

    const { data: tier } = await this.supabase
      .from('subscription_tiers')
      .select('content_limit')
      .eq('id', subscription.subscription_tier_id)
      .single();

    if (!tier) {
      return false;
    }

    const usedContent = usage?.content_generated || 0;
    return usedContent < tier.content_limit;
  }
}