'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  CreditCard, 
  FileText, 
  TrendingUp, 
  Calendar,
  Settings,
  LogOut,
  Crown,
  Zap
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { supabase } from '@/lib/supabase/auth';

interface UserProfile {
  full_name: string;
  email: string;
  subscription_tier: 'free' | 'basic' | 'pro' | 'enterprise';
  subscription_status: 'active' | 'cancelled' | 'expired';
  usage_count: number;
  usage_limit: number;
  created_at: string;
}

interface UsageStats {
  totalContent: number;
  thisMonth: number;
  lastLogin: string;
  avgWordsPerArticle: number;
}

export default function DashboardPage() {
  const { user, signOut } = useAuthStore();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Fetch user profile from users table
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (profileError) {
          console.error('Profile fetch error:', profileError);
          // Fallback to basic user data if profile doesn't exist
          setUserProfile({
            full_name: user.user_metadata?.full_name || 'User',
            email: user.email || '',
            subscription_tier: 'free',
            subscription_status: 'active',
            usage_count: 0,
            usage_limit: 10,
            created_at: user.created_at,
          });
        } else {
          setUserProfile({
            full_name: profile.full_name || user.user_metadata?.full_name || 'User',
            email: profile.email || user.email || '',
            subscription_tier: profile.subscription_tier || 'free',
            subscription_status: profile.subscription_status || 'active',
            usage_count: profile.usage_count || 0,
            usage_limit: profile.usage_limit || 10,
            created_at: profile.created_at || user.created_at,
          });
        }

        // Fetch usage statistics from content generation history
        const { data: contentStats, error: statsError } = await supabase
          .from('content_generations')
          .select('id, created_at, word_count')
          .eq('user_id', user.id);

        if (statsError) {
          console.error('Stats fetch error:', statsError);
          // Fallback to zero stats
          setUsageStats({
            totalContent: 0,
            thisMonth: 0,
            lastLogin: new Date().toISOString(),
            avgWordsPerArticle: 0,
          });
        } else {
          const now = new Date();
          const thisMonth = contentStats?.filter(item => {
            const itemDate = new Date(item.created_at);
            return itemDate.getMonth() === now.getMonth() && 
                   itemDate.getFullYear() === now.getFullYear();
          }) || [];

          const totalWords = contentStats?.reduce((sum, item) => sum + (item.word_count || 0), 0) || 0;
          const avgWords = contentStats?.length ? Math.round(totalWords / contentStats.length) : 0;

          setUsageStats({
            totalContent: contentStats?.length || 0,
            thisMonth: thisMonth.length,
            lastLogin: new Date().toISOString(),
            avgWordsPerArticle: avgWords,
          });
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        // Fallback to basic data on error
        setUserProfile({
          full_name: user.user_metadata?.full_name || 'User',
          email: user.email || '',
          subscription_tier: 'free',
          subscription_status: 'active',
          usage_count: 0,
          usage_limit: 10,
          created_at: user.created_at,
        });
        setUsageStats({
          totalContent: 0,
          thisMonth: 0,
          lastLogin: new Date().toISOString(),
          avgWordsPerArticle: 0,
        });
        setLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getSubscriptionBadge = (tier: string) => {
    switch (tier) {
      case 'free':
        return <Badge variant="secondary">Free Plan</Badge>;
      case 'basic':
        return <Badge variant="default">Basic Plan</Badge>;
      case 'pro':
        return <Badge variant="default" className="bg-purple-600"><Crown className="w-3 h-3 mr-1" />Pro Plan</Badge>;
      case 'enterprise':
        return <Badge variant="default" className="bg-orange-600"><Zap className="w-3 h-3 mr-1" />Enterprise</Badge>;
      default:
        return <Badge variant="secondary">Free Plan</Badge>;
    }
  };

  const usagePercentage = userProfile ? (userProfile.usage_count / userProfile.usage_limit) * 100 : 0;

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full spacing-responsive">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-responsive-3xl font-bold">Welcome back, {userProfile?.full_name}!</h1>
          <p className="text-muted-foreground text-responsive-base">Here&apos;s what&apos;s happening with your SEO content generation.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="touch-target">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button variant="outline" size="sm" className="touch-target" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Account Status */}
      <div className="grid-responsive mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Account Status</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {getSubscriptionBadge(userProfile?.subscription_tier || 'free')}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Member since {new Date(userProfile?.created_at || '').toLocaleDateString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usage This Month</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userProfile?.usage_count || 0}/{userProfile?.usage_limit || 10}</div>
            <Progress value={usagePercentage} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {Math.round(100 - usagePercentage)}% remaining
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Content</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usageStats?.totalContent || 0}</div>
            <p className="text-xs text-muted-foreground">
              Avg. {usageStats?.avgWordsPerArticle || 0} words per article
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Activity</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Today</div>
            <p className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Usage Alert */}
      {usagePercentage > 80 && (
        <Alert className="mb-6">
          <AlertDescription>
            You've used {Math.round(usagePercentage)}% of your monthly limit. 
            {userProfile?.subscription_tier === 'free' ? ' Consider upgrading to a paid plan for more content generation.' : ' Your usage will reset next month.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Start creating content or manage your account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" size="lg">
              <FileText className="w-4 h-4 mr-2" />
              Generate New Content
            </Button>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline">
                <TrendingUp className="w-4 h-4 mr-2" />
                Analytics
              </Button>
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Projects
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest content generation activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Content generated successfully</p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New project created</p>
                  <p className="text-xs text-muted-foreground">Yesterday</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Account created</p>
                  <p className="text-xs text-muted-foreground">{new Date(userProfile?.created_at || '').toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}