'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Check } from 'lucide-react';
import { SubscriptionTier } from '@/services/subscription/subscription.service';
import { PaymentMethodForm } from './PaymentMethodForm';
import { Elements } from '@stripe/react-stripe-js';
import { getStripe } from '@/lib/stripe/stripe-client';

interface PlanSelectorProps {
  tiers: SubscriptionTier[];
  currentTierId?: string;
  onSelectPlan: (tierId: string, billingCycle: 'monthly' | 'yearly') => void;
  onSubscriptionComplete?: () => void;
}

export function PlanSelector({ tiers, currentTierId, onSelectPlan, onSubscriptionComplete }: PlanSelectorProps) {
  const [isYearly, setIsYearly] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [stripePromise] = useState(() => getStripe());

  const getPrice = (tier: SubscriptionTier) => {
    return isYearly ? tier.price_yearly : tier.price_monthly;
  };

  const getYearlySavings = (tier: SubscriptionTier) => {
    const monthlyCost = tier.price_monthly * 12;
    const yearlyCost = tier.price_yearly;
    const savings = monthlyCost - yearlyCost;
    const percentage = Math.round((savings / monthlyCost) * 100);
    return { savings, percentage };
  };

  const formatFeatures = (features: Record<string, any>) => {
    const featureList = [];
    
    if (features.content_generation) {
      featureList.push('Content Generation');
    }
    if (features.advanced_seo) {
      featureList.push('Advanced SEO Analysis');
    }
    if (features.competitor_analysis) {
      featureList.push('Competitor Analysis');
    }
    if (features.bulk_generation) {
      featureList.push('Bulk Content Generation');
    }
    if (features.api_access) {
      featureList.push('API Access');
    }
    if (features.white_label) {
      featureList.push('White Label');
    }
    
    return featureList;
  };

  const getSupportLevel = (support: string) => {
    switch (support) {
      case 'email':
        return 'Email Support';
      case 'priority_email':
        return 'Priority Email Support';
      case 'phone':
        return 'Phone + Email Support';
      default:
        return 'Email Support';
    }
  };

  const handleSelectPlan = (tier: SubscriptionTier, cycle: 'monthly' | 'yearly') => {
    setSelectedTier(tier);
    setBillingCycle(cycle);
    setShowPaymentForm(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentForm(false);
    setSelectedTier(null);
    onSubscriptionComplete?.();
  };

  const handlePaymentCancel = () => {
    setShowPaymentForm(false);
    setSelectedTier(null);
  };

  if (showPaymentForm && selectedTier) {
    return (
      <Elements stripe={stripePromise}>
        <PaymentMethodForm
          selectedTier={selectedTier}
          billingCycle={billingCycle}
          onSuccess={handlePaymentSuccess}
          onCancel={handlePaymentCancel}
        />
      </Elements>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center space-x-2">
        <Label htmlFor="billing-toggle">Monthly</Label>
        <Switch
          id="billing-toggle"
          checked={isYearly}
          onCheckedChange={setIsYearly}
        />
        <Label htmlFor="billing-toggle">Yearly</Label>
        {isYearly && (
          <Badge variant="secondary" className="ml-2">
            Save up to 17%
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tiers.map((tier) => {
          const isCurrentPlan = currentTierId === tier.id;
          const isPopular = tier.name === 'pro';
          const yearlySavings = getYearlySavings(tier);
          const features = formatFeatures(tier.features);

          return (
            <Card
              key={tier.id}
              className={`relative ${
                isPopular ? 'border-primary shadow-lg' : ''
              } ${isCurrentPlan ? 'ring-2 ring-primary' : ''}`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                </div>
              )}
              {isCurrentPlan && (
                <div className="absolute -top-3 right-4">
                  <Badge variant="outline">Current Plan</Badge>
                </div>
              )}
              
              <CardHeader>
                <CardTitle className="text-xl">{tier.display_name}</CardTitle>
                <CardDescription>
                  Perfect for {tier.name === 'basic' ? 'individuals' : 
                           tier.name === 'pro' ? 'small teams' : 'large organizations'}
                </CardDescription>
                <div className="flex items-baseline space-x-1">
                  <span className="text-3xl font-bold">${getPrice(tier)}</span>
                  <span className="text-muted-foreground">
                    / {isYearly ? 'year' : 'month'}
                  </span>
                </div>
                {isYearly && yearlySavings.savings > 0 && (
                  <p className="text-sm text-green-600">
                    Save ${yearlySavings.savings} ({yearlySavings.percentage}%) yearly
                  </p>
                )}
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm">
                      {tier.content_limit} content pieces per month
                    </span>
                  </div>
                  
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                  
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm">
                      {getSupportLevel(tier.features.support)}
                    </span>
                  </div>
                </div>
                
                <Button
                  onClick={() => handleSelectPlan(tier, isYearly ? 'yearly' : 'monthly')}
                  className="w-full"
                  variant={isCurrentPlan ? 'outline' : 'default'}
                  disabled={isCurrentPlan}
                >
                  {isCurrentPlan ? 'Current Plan' : 'Select Plan'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}