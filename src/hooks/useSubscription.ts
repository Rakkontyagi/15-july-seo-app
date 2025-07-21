import { useState, useEffect } from 'react';

interface Subscription {
  tier_name: string;
  status: string;
  current_period_end: Date;
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Mock subscription data for now
    setTimeout(() => {
      setSubscription({
        tier_name: 'Free Plan',
        status: 'Active',
        current_period_end: new Date(),
      });
      setLoading(false);
    }, 1000);
  }, []);

  const upgradeSubscription = async () => {
    try {
      // Mock upgrade logic
      console.log('Upgrading subscription...');
    } catch (err) {
      setError('Failed to upgrade subscription');
    }
  };

  const cancelSubscription = async () => {
    try {
      // Mock cancel logic
      console.log('Canceling subscription...');
    } catch (err) {
      setError('Failed to cancel subscription');
    }
  };

  return {
    subscription,
    loading,
    error,
    upgradeSubscription,
    cancelSubscription,
  };
}
