'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { UserSubscription, UsageStats } from '@/services/subscription/subscription.service';

interface SubscriptionCardProps {
  subscription: UserSubscription | null;
  usage: UsageStats | null;
  onUpgrade: () => void;
  onCancel: () => void;
}

export function SubscriptionCard({
  subscription,
  usage,
  onUpgrade,
  onCancel,
}: SubscriptionCardProps) {
  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Active Subscription</CardTitle>
          <CardDescription>
            Choose a plan to start generating content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onUpgrade} className="w-full">
            Choose Plan
          </Button>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Active</Badge>;
      case 'past_due':
        return <Badge variant="destructive">Past Due</Badge>;
      case 'canceled':
        return <Badge variant="outline">Canceled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const usagePercentage = usage
    ? Math.round((usage.content_generated / 100) * 100) // Assuming 100 is the limit
    : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Current Plan
              {getStatusBadge(subscription.status)}
            </CardTitle>
            <CardDescription>
              {subscription.subscription_tier_id || 'Unknown Plan'}
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">
              $0
            </p>
            <p className="text-sm text-muted-foreground">per month</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {subscription.current_period_end && (
          <div>
            <p className="text-sm text-muted-foreground">
              Next billing date: {formatDate(subscription.current_period_end)}
            </p>
            {subscription.cancel_at_period_end && (
              <p className="text-sm text-yellow-600">
                Your subscription will cancel at the end of the current period
              </p>
            )}
          </div>
        )}

        {usage && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Content Generated</span>
              <span>
                {usage.content_generated} / 100
              </span>
            </div>
            <Progress value={usagePercentage} className="h-2" />
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={onUpgrade} variant="outline" className="flex-1">
            {subscription.status === 'active' ? 'Upgrade Plan' : 'Reactivate'}
          </Button>
          {subscription.status === 'active' && !subscription.cancel_at_period_end && (
            <Button onClick={onCancel} variant="ghost" className="flex-1">
              Cancel Plan
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}