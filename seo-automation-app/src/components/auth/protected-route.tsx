'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Crown, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase/auth';

type SubscriptionTier = 'free' | 'basic' | 'pro' | 'enterprise';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireSubscription?: SubscriptionTier;
  showUpgrade?: boolean;
}

const tierHierarchy: Record<SubscriptionTier, number> = {
  free: 0,
  basic: 1,
  pro: 2,
  enterprise: 3,
};

function hasAccess(userTier: SubscriptionTier, requiredTier: SubscriptionTier): boolean {
  return tierHierarchy[userTier] >= tierHierarchy[requiredTier];
}

export function ProtectedRoute({ 
  children, 
  fallback,
  requireSubscription = 'free',
  showUpgrade = true
}: ProtectedRouteProps) {
  const { user, loading, initialized } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [userSubscriptionTier, setUserSubscriptionTier] = useState<SubscriptionTier>('free');
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (initialized && !loading && !user && mounted) {
      router.push('/login');
    }
  }, [user, loading, initialized, router, mounted]);

  useEffect(() => {
    const fetchSubscriptionTier = async () => {
      if (!user) {
        setSubscriptionLoading(false);
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('users')
          .select('subscription_tier')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Failed to fetch subscription tier:', error);
          // Fallback to free tier if query fails
          setUserSubscriptionTier('free');
        } else {
          setUserSubscriptionTier(profile.subscription_tier || 'free');
        }
      } catch (error) {
        console.error('Error fetching subscription:', error);
        setUserSubscriptionTier('free');
      } finally {
        setSubscriptionLoading(false);
      }
    };

    fetchSubscriptionTier();
  }, [user]);

  // Show loading state while checking auth and subscription
  if (!mounted || !initialized || loading || subscriptionLoading) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )
    );
  }

  // Redirect will happen via useEffect, but show loading while redirect is happening
  if (!user) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )
    );
  }

  // Check subscription tier access
  if (!hasAccess(userSubscriptionTier, requireSubscription)) {
    if (showUpgrade) {
      return (
        <div className="container mx-auto max-w-2xl py-16 px-4">
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">Premium Feature</h1>
              <p className="text-muted-foreground text-lg">
                This feature requires a {requireSubscription} subscription or higher.
              </p>
            </div>

            <Alert className="text-left">
              <Crown className="h-4 w-4" />
              <AlertDescription>
                <strong>Current Plan:</strong> {userSubscriptionTier.charAt(0).toUpperCase() + userSubscriptionTier.slice(1)}
                <br />
                <strong>Required Plan:</strong> {requireSubscription.charAt(0).toUpperCase() + requireSubscription.slice(1)} or higher
              </AlertDescription>
            </Alert>

            <div className="flex gap-4 justify-center">
              <Button 
                onClick={() => router.push('/dashboard/billing')}
                className="px-6"
              >
                <Crown className="w-4 h-4 mr-2" />
                Upgrade Plan
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.back()}
              >
                Go Back
              </Button>
            </div>
          </div>
        </div>
      );
    } else {
      router.push('/dashboard/billing');
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      );
    }
  }

  return <>{children}</>;
}