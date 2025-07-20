/**
 * Enterprise Subscription Manager
 * Implements Story 1.2 - Complete Subscription System Enterprise Features
 * Handles advanced usage tracking, team management, and enterprise billing
 */

import { createClient } from '@supabase/supabase-js';
import { performanceMonitor } from '@/lib/monitoring/performance-monitor';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Types
export interface EnterpriseSubscription {
  id: string;
  organization_id: string;
  tier: 'free' | 'trial' | 'professional' | 'enterprise';
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'suspended';
  billing_cycle: 'monthly' | 'quarterly' | 'yearly' | 'custom';
  custom_billing_date?: string;
  seats_included: number;
  seats_used: number;
  usage_limits: {
    content_generations: number;
    api_calls: number;
    storage_gb: number;
    team_members: number;
  };
  current_usage: {
    content_generations: number;
    api_calls: number;
    storage_gb: number;
    team_members: number;
  };
  features: string[];
  created_at: string;
  updated_at: string;
  next_billing_date: string;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
}

export interface TeamMember {
  id: string;
  user_id: string;
  organization_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  permissions: string[];
  invited_by: string;
  invited_at: string;
  joined_at?: string;
  status: 'pending' | 'active' | 'suspended';
  last_active: string;
}

export interface UsageEvent {
  id: string;
  organization_id: string;
  user_id: string;
  event_type: 'content_generation' | 'api_call' | 'storage_upload' | 'team_invite';
  resource_id?: string;
  metadata: Record<string, any>;
  timestamp: string;
  billing_period: string;
}

export interface BillingAlert {
  id: string;
  organization_id: string;
  alert_type: 'usage_warning' | 'usage_limit' | 'payment_failed' | 'subscription_expiring';
  threshold: number;
  current_value: number;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  resolved_at?: string;
}

// Enterprise Subscription Manager
export class EnterpriseSubscriptionManager {
  private static instance: EnterpriseSubscriptionManager;

  static getInstance(): EnterpriseSubscriptionManager {
    if (!EnterpriseSubscriptionManager.instance) {
      EnterpriseSubscriptionManager.instance = new EnterpriseSubscriptionManager();
    }
    return EnterpriseSubscriptionManager.instance;
  }

  // Usage Tracking Methods
  async trackUsage(
    organizationId: string,
    userId: string,
    eventType: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    const startTime = Date.now();

    try {
      // Get current billing period
      const billingPeriod = this.getCurrentBillingPeriod();

      // Create usage event
      const usageEvent: Partial<UsageEvent> = {
        organization_id: organizationId,
        user_id: userId,
        event_type: eventType as any,
        metadata,
        timestamp: new Date().toISOString(),
        billing_period: billingPeriod,
      };

      // Store usage event
      const { error } = await supabase
        .from('usage_events')
        .insert(usageEvent);

      if (error) {
        throw new Error(`Failed to track usage: ${error.message}`);
      }

      // Update current usage counters
      await this.updateUsageCounters(organizationId, eventType, metadata);

      // Check usage limits and send alerts if necessary
      await this.checkUsageLimits(organizationId);

      // Track performance
      performanceMonitor.trackAPICall({
        endpoint: 'track_usage',
        method: 'POST',
        duration: Date.now() - startTime,
        status: 200,
        success: true,
        timestamp: Date.now(),
        userId,
      });

    } catch (error) {
      console.error('Error tracking usage:', error);
      
      performanceMonitor.trackAPICall({
        endpoint: 'track_usage',
        method: 'POST',
        duration: Date.now() - startTime,
        status: 500,
        success: false,
        timestamp: Date.now(),
        userId,
      });

      throw error;
    }
  }

  private async updateUsageCounters(
    organizationId: string,
    eventType: string,
    metadata: Record<string, any>
  ): Promise<void> {
    const billingPeriod = this.getCurrentBillingPeriod();

    // Get current subscription
    const { data: subscription, error } = await supabase
      .from('enterprise_subscriptions')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    if (error || !subscription) {
      throw new Error('Subscription not found');
    }

    // Calculate usage increment
    let usageIncrement: Partial<EnterpriseSubscription['current_usage']> = {};

    switch (eventType) {
      case 'content_generation':
        usageIncrement.content_generations = 1;
        break;
      case 'api_call':
        usageIncrement.api_calls = 1;
        break;
      case 'storage_upload':
        usageIncrement.storage_gb = metadata.size_gb || 0;
        break;
      case 'team_invite':
        // Team member count is handled separately
        break;
    }

    // Update subscription usage
    if (Object.keys(usageIncrement).length > 0) {
      const newUsage = {
        content_generations: subscription.current_usage.content_generations + (usageIncrement.content_generations || 0),
        api_calls: subscription.current_usage.api_calls + (usageIncrement.api_calls || 0),
        storage_gb: subscription.current_usage.storage_gb + (usageIncrement.storage_gb || 0),
        team_members: subscription.current_usage.team_members, // Updated separately
      };

      const { error: updateError } = await supabase
        .from('enterprise_subscriptions')
        .update({ current_usage: newUsage })
        .eq('organization_id', organizationId);

      if (updateError) {
        throw new Error(`Failed to update usage counters: ${updateError.message}`);
      }
    }
  }

  private async checkUsageLimits(organizationId: string): Promise<void> {
    const { data: subscription, error } = await supabase
      .from('enterprise_subscriptions')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    if (error || !subscription) return;

    const alerts: Partial<BillingAlert>[] = [];

    // Check each usage type
    Object.entries(subscription.current_usage).forEach(([usageType, currentValue]) => {
      const limit = subscription.usage_limits[usageType as keyof typeof subscription.usage_limits];
      const usagePercentage = (currentValue / limit) * 100;

      // Warning at 80%
      if (usagePercentage >= 80 && usagePercentage < 100) {
        alerts.push({
          organization_id: organizationId,
          alert_type: 'usage_warning',
          threshold: 80,
          current_value: usagePercentage,
          message: `${usageType} usage is at ${usagePercentage.toFixed(1)}% of limit`,
          severity: 'medium',
          created_at: new Date().toISOString(),
        });
      }

      // Critical at 100%
      if (usagePercentage >= 100) {
        alerts.push({
          organization_id: organizationId,
          alert_type: 'usage_limit',
          threshold: 100,
          current_value: usagePercentage,
          message: `${usageType} usage limit exceeded (${usagePercentage.toFixed(1)}%)`,
          severity: 'critical',
          created_at: new Date().toISOString(),
        });
      }
    });

    // Store alerts
    if (alerts.length > 0) {
      const { error: alertError } = await supabase
        .from('billing_alerts')
        .insert(alerts);

      if (alertError) {
        console.error('Error creating billing alerts:', alertError);
      }

      // Send notifications
      await this.sendUsageAlerts(organizationId, alerts);
    }
  }

  // Team Management Methods
  async inviteTeamMember(
    organizationId: string,
    invitedBy: string,
    email: string,
    role: TeamMember['role'],
    permissions: string[] = []
  ): Promise<TeamMember> {
    const startTime = Date.now();

    try {
      // Check if organization has available seats
      const canAddMember = await this.checkTeamSeats(organizationId);
      if (!canAddMember) {
        throw new Error('No available team seats. Please upgrade your plan.');
      }

      // Create team member invitation
      const teamMember: Partial<TeamMember> = {
        organization_id: organizationId,
        role,
        permissions,
        invited_by: invitedBy,
        invited_at: new Date().toISOString(),
        status: 'pending',
      };

      const { data, error } = await supabase
        .from('team_members')
        .insert(teamMember)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to invite team member: ${error.message}`);
      }

      // Send invitation email (would integrate with email service)
      await this.sendTeamInvitation(email, organizationId, data.id);

      // Track usage
      await this.trackUsage(organizationId, invitedBy, 'team_invite', {
        invited_email: email,
        role,
        permissions,
      });

      // Track performance
      performanceMonitor.trackAPICall({
        endpoint: 'invite_team_member',
        method: 'POST',
        duration: Date.now() - startTime,
        status: 200,
        success: true,
        timestamp: Date.now(),
        userId: invitedBy,
      });

      return data as TeamMember;

    } catch (error) {
      performanceMonitor.trackAPICall({
        endpoint: 'invite_team_member',
        method: 'POST',
        duration: Date.now() - startTime,
        status: 500,
        success: false,
        timestamp: Date.now(),
        userId: invitedBy,
      });

      throw error;
    }
  }

  private async checkTeamSeats(organizationId: string): Promise<boolean> {
    const { data: subscription, error } = await supabase
      .from('enterprise_subscriptions')
      .select('seats_included, seats_used')
      .eq('organization_id', organizationId)
      .single();

    if (error || !subscription) {
      throw new Error('Subscription not found');
    }

    return subscription.seats_used < subscription.seats_included;
  }

  // Billing Management Methods
  async handleFailedPayment(
    organizationId: string,
    paymentIntentId: string,
    error: string
  ): Promise<void> {
    try {
      // Create billing alert
      const alert: Partial<BillingAlert> = {
        organization_id: organizationId,
        alert_type: 'payment_failed',
        threshold: 0,
        current_value: 1,
        message: `Payment failed: ${error}`,
        severity: 'critical',
        created_at: new Date().toISOString(),
      };

      await supabase.from('billing_alerts').insert(alert);

      // Update subscription status
      await supabase
        .from('enterprise_subscriptions')
        .update({ status: 'past_due' })
        .eq('organization_id', organizationId);

      // Send notification to organization admins
      await this.notifyPaymentFailure(organizationId, error);

      // Start retry sequence
      await this.schedulePaymentRetry(organizationId, paymentIntentId);

    } catch (error) {
      console.error('Error handling failed payment:', error);
    }
  }

  async processCustomBilling(
    organizationId: string,
    billingDate: string
  ): Promise<void> {
    try {
      // Get subscription details
      const { data: subscription, error } = await supabase
        .from('enterprise_subscriptions')
        .select('*')
        .eq('organization_id', organizationId)
        .single();

      if (error || !subscription) {
        throw new Error('Subscription not found');
      }

      // Calculate billing amount based on usage
      const billingAmount = await this.calculateCustomBilling(subscription);

      // Create invoice (would integrate with Stripe)
      await this.createCustomInvoice(organizationId, billingAmount);

      // Update next billing date
      const nextBillingDate = this.calculateNextBillingDate(
        billingDate,
        subscription.billing_cycle
      );

      await supabase
        .from('enterprise_subscriptions')
        .update({ next_billing_date: nextBillingDate })
        .eq('organization_id', organizationId);

    } catch (error) {
      console.error('Error processing custom billing:', error);
    }
  }

  // Utility Methods
  private getCurrentBillingPeriod(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  private calculateNextBillingDate(currentDate: string, cycle: string): string {
    const date = new Date(currentDate);
    
    switch (cycle) {
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'quarterly':
        date.setMonth(date.getMonth() + 3);
        break;
      case 'yearly':
        date.setFullYear(date.getFullYear() + 1);
        break;
      case 'custom':
        // Custom billing cycles handled separately
        break;
    }
    
    return date.toISOString();
  }

  private async calculateCustomBilling(subscription: EnterpriseSubscription): Promise<number> {
    // Implement custom billing calculation logic
    // This would typically involve usage-based pricing
    return 0; // Placeholder
  }

  private async sendUsageAlerts(
    organizationId: string,
    alerts: Partial<BillingAlert>[]
  ): Promise<void> {
    // Implement alert notification logic
    console.log(`Sending ${alerts.length} usage alerts for organization ${organizationId}`);
  }

  private async sendTeamInvitation(
    email: string,
    organizationId: string,
    invitationId: string
  ): Promise<void> {
    // Implement team invitation email logic
    console.log(`Sending team invitation to ${email} for organization ${organizationId}`);
  }

  private async notifyPaymentFailure(
    organizationId: string,
    error: string
  ): Promise<void> {
    // Implement payment failure notification logic
    console.log(`Notifying payment failure for organization ${organizationId}: ${error}`);
  }

  private async schedulePaymentRetry(
    organizationId: string,
    paymentIntentId: string
  ): Promise<void> {
    // Implement payment retry scheduling logic
    console.log(`Scheduling payment retry for organization ${organizationId}`);
  }

  private async createCustomInvoice(
    organizationId: string,
    amount: number
  ): Promise<void> {
    // Implement custom invoice creation logic
    console.log(`Creating custom invoice for organization ${organizationId}: $${amount}`);
  }

  // Public API Methods
  async getSubscription(organizationId: string): Promise<EnterpriseSubscription | null> {
    const { data, error } = await supabase
      .from('enterprise_subscriptions')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    if (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }

    return data as EnterpriseSubscription;
  }

  async getUsageAnalytics(
    organizationId: string,
    period: string = 'current'
  ): Promise<any> {
    const { data, error } = await supabase
      .from('usage_events')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('billing_period', period);

    if (error) {
      console.error('Error fetching usage analytics:', error);
      return null;
    }

    return this.aggregateUsageData(data);
  }

  private aggregateUsageData(events: UsageEvent[]): any {
    // Implement usage data aggregation logic
    return {
      totalEvents: events.length,
      byType: events.reduce((acc, event) => {
        acc[event.event_type] = (acc[event.event_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}

// Export singleton instance
export const enterpriseSubscriptionManager = EnterpriseSubscriptionManager.getInstance();
