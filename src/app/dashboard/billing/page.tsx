'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SubscriptionCard } from '@/components/billing/SubscriptionCard';
import { PlanSelector } from '@/components/billing/PlanSelector';
import { InvoiceHistory } from '@/components/billing/InvoiceHistory';
import { useToast } from '@/hooks/use-toast';
import { 
  SubscriptionTier, 
  UserSubscription, 
  UsageStats 
} from '@/services/subscription/subscription.service';

export default function BillingPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      
      // Load subscription tiers
      const tiersResponse = await fetch('/api/subscription/tiers');
      const tiersData = await tiersResponse.json();
      
      if (tiersData.success) {
        setTiers(tiersData.data);
      }
      
      // Load current subscription
      const subscriptionResponse = await fetch('/api/subscription');
      const subscriptionData = await subscriptionResponse.json();
      
      if (subscriptionData.success) {
        setSubscription(subscriptionData.data);
      }
      
      // Load usage stats
      const usageResponse = await fetch('/api/subscription/usage');
      const usageData = await usageResponse.json();
      
      if (usageData.success) {
        setUsage(usageData.data);
      }
    } catch (error) {
      console.error('Failed to load billing data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load billing information',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (tierId: string, billingCycle: 'monthly' | 'yearly') => {
    try {
      // For now, just show a toast - payment method integration would be needed
      toast({
        title: 'Plan Selection',
        description: `Selected ${billingCycle} plan. Payment integration needed.`,
      });
      
      // TODO: Implement payment method collection and subscription creation
      // This would typically involve:
      // 1. Collecting payment method with Stripe Elements
      // 2. Creating subscription via API
      // 3. Handling 3D Secure authentication if needed
      
    } catch (error) {
      console.error('Failed to select plan:', error);
      toast({
        title: 'Error',
        description: 'Failed to select plan',
        variant: 'destructive',
      });
    }
  };

  const handleUpgrade = () => {
    setActiveTab('plans');
  };

  const handleCancel = async () => {
    try {
      const response = await fetch('/api/subscription', {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Success',
          description: 'Subscription cancelled successfully',
        });
        loadBillingData();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel subscription',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing & Subscription</h1>
        <p className="text-muted-foreground">
          Manage your subscription and billing information
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="billing">Billing History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SubscriptionCard
              subscription={subscription}
              usage={usage}
              onUpgrade={handleUpgrade}
              onCancel={handleCancel}
            />
            
            <Card>
              <CardHeader>
                <CardTitle>Usage Statistics</CardTitle>
                <CardDescription>
                  Current billing period usage
                </CardDescription>
              </CardHeader>
              <CardContent>
                {usage ? (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Content Generated</span>
                      <span className="font-medium">{usage.content_generated}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>API Calls</span>
                      <span className="font-medium">{usage.api_calls}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Period</span>
                      <span>
                        {usage.billing_period_start} to {usage.billing_period_end}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No usage data available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="plans" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Choose Your Plan</CardTitle>
              <CardDescription>
                Select the plan that best fits your needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PlanSelector
                tiers={tiers}
                currentTierId={subscription?.subscription_tier_id}
                onSelectPlan={handleSelectPlan}
                onSubscriptionComplete={loadBillingData}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Usage Details</CardTitle>
              <CardDescription>
                Detailed usage statistics and limits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Usage analytics and detailed reports coming soon
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <InvoiceHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}