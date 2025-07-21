'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { UserMenu } from '@/components/layout/user-menu';
import { MobileNav } from '@/components/layout/mobile-nav';
import { Badge } from '@/components/ui/badge';
import { NotificationBell } from '@/components/ui/notification-system';
import { Menu, Search, Crown } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useNavigationStore } from '@/store/navigation';

export function Header() {
  const { user } = useAuthStore();
  const { mobileMenuOpen, toggleMobileMenu } = useNavigationStore();

  return (
    <header 
      className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      role="banner"
      aria-label="Main navigation"
    >
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden touch-target"
            onClick={toggleMobileMenu}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            aria-label="Toggle mobile menu"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
          
          <Link 
            href="/dashboard" 
            className="flex items-center space-x-2"
            aria-label="SEO Generator home"
          >
            <div className="rounded-lg bg-primary p-2" role="img" aria-label="SEO Generator logo">
              <Crown className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">SEO Generator</span>
          </Link>
        </div>

        <nav 
          className="hidden md:flex items-center space-x-6"
          role="navigation"
          aria-label="Primary navigation"
        >
          <Link
            href="/dashboard"
            className="text-sm font-medium transition-colors hover:text-primary accessible-hover"
            aria-label="Go to dashboard"
          >
            Dashboard
          </Link>
          <Link
            href="/dashboard/content"
            className="text-sm font-medium transition-colors hover:text-primary accessible-hover"
            aria-label="Go to content generator"
          >
            Content
          </Link>
          <Link
            href="/dashboard/projects"
            className="text-sm font-medium transition-colors hover:text-primary accessible-hover"
            aria-label="Go to projects"
          >
            Projects
          </Link>
          <Link
            href="/dashboard/analytics"
            className="text-sm font-medium transition-colors hover:text-primary accessible-hover"
            aria-label="Go to analytics"
          >
            Analytics
          </Link>
        </nav>

        <div className="flex items-center space-x-4" role="group" aria-label="User actions">
          <div className="hidden md:flex items-center space-x-2">
            <Badge variant="secondary" className="text-xs" aria-label="Current subscription plan">
              Free Plan
            </Badge>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="hidden md:flex touch-target"
            aria-label="Search content"
          >
            <Search className="h-4 w-4" />
            <span className="sr-only">Search</span>
          </Button>
          
          <NotificationBell />
          
          <UserMenu />
        </div>
      </div>

      {mobileMenuOpen && (
        <MobileNav onClose={() => toggleMobileMenu()} />
      )}
    </header>
  );
}