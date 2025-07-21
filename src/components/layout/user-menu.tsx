'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Settings, 
  CreditCard, 
  LogOut, 
  ChevronDown,
  Crown,
  HelpCircle,
  Moon,
  Sun,
  Bell,
  Shield,
  FileText
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { user, signOut } = useAuthStore();
  const router = useRouter();

  // Mock subscription data - in real implementation, get from Supabase
  const subscription = {
    tier: 'free',
    usageCount: 3,
    usageLimit: 10,
    nextBilling: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleMenuItemClick = (href: string) => {
    setIsOpen(false);
    router.push(href);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    // In real implementation, would toggle theme
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2"
      >
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="h-4 w-4" />
        </div>
        <span className="hidden md:block text-sm font-medium">
          {user?.user_metadata?.full_name || 'User'}
        </span>
        <ChevronDown className="h-4 w-4" />
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-md border bg-popover shadow-lg">
            {/* User Info Header */}
            <div className="px-4 py-3 border-b">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user?.user_metadata?.full_name || 'User'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.email}
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  <Crown className="h-3 w-3 mr-1" />
                  {subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)}
                </Badge>
              </div>
            </div>

            {/* Usage Stats */}
            <div className="px-4 py-3 border-b bg-muted/50">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Usage this month</span>
                <span className="font-medium">{subscription.usageCount}/{subscription.usageLimit}</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(subscription.usageCount / subscription.usageLimit) * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Resets {subscription.nextBilling.toLocaleDateString()}
              </p>
            </div>
            
            {/* Menu Items */}
            <div className="py-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start px-4 py-2"
                onClick={() => handleMenuItemClick('/dashboard/settings/profile')}
              >
                <User className="h-4 w-4 mr-3" />
                Profile & Account
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start px-4 py-2"
                onClick={() => handleMenuItemClick('/dashboard/settings')}
              >
                <Settings className="h-4 w-4 mr-3" />
                Settings
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start px-4 py-2"
                onClick={() => handleMenuItemClick('/dashboard/billing')}
              >
                <CreditCard className="h-4 w-4 mr-3" />
                Billing & Plans
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start px-4 py-2"
                onClick={() => handleMenuItemClick('/dashboard/settings/notifications')}
              >
                <Bell className="h-4 w-4 mr-3" />
                Notifications
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start px-4 py-2"
                onClick={() => handleMenuItemClick('/dashboard/settings/privacy')}
              >
                <Shield className="h-4 w-4 mr-3" />
                Privacy & Security
              </Button>

              <Separator className="my-1" />

              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start px-4 py-2"
                onClick={toggleDarkMode}
              >
                {isDarkMode ? (
                  <Sun className="h-4 w-4 mr-3" />
                ) : (
                  <Moon className="h-4 w-4 mr-3" />
                )}
                {isDarkMode ? 'Light Mode' : 'Dark Mode'}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start px-4 py-2"
                onClick={() => handleMenuItemClick('/docs')}
              >
                <FileText className="h-4 w-4 mr-3" />
                Documentation
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start px-4 py-2"
                onClick={() => handleMenuItemClick('/support')}
              >
                <HelpCircle className="h-4 w-4 mr-3" />
                Help & Support
              </Button>
              
              <Separator className="my-1" />
              
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start px-4 py-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-3" />
                Sign Out
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}