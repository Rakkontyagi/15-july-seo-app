'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useNavigationStore } from '@/store/navigation';
import { useAuthStore } from '@/store/auth';
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  BarChart3,
  Settings,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Crown,
  Users,
  HelpCircle,
  LogOut,
  Zap,
  Brain
} from 'lucide-react';

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Overview and quick actions'
  },
  {
    name: 'Content Generator',
    href: '/dashboard/content',
    icon: FileText,
    description: 'AI-powered content creation',
    badge: 'AI'
  },
  {
    name: 'Generate Content',
    href: '/dashboard/generate',
    icon: Zap,
    description: 'Advanced content generation dashboard',
    badge: 'NEW'
  },
  {
    name: 'Content Editor',
    href: '/dashboard/editor',
    icon: FileText,
    description: 'Real-time content editor with AI assistance',
    badge: 'AI'
  },
  {
    name: 'Content Optimization',
    href: '/dashboard/optimize',
    icon: TrendingUp,
    description: 'Advanced content optimization and analysis',
    badge: 'PRO'
  },
  {
    name: 'Analytics & Reports',
    href: '/dashboard/analytics',
    icon: BarChart3,
    description: 'Comprehensive analytics and automated reporting',
    badge: 'INSIGHTS'
  },
  {
    name: 'AI Lab',
    href: '/dashboard/ai-lab',
    icon: Brain,
    description: 'Advanced AI-powered content tools and insights',
    badge: 'BETA'
  },
  {
    name: 'Team Collaboration',
    href: '/dashboard/team',
    icon: Users,
    description: 'Manage team projects and collaborative workflows',
    badge: 'ENTERPRISE'
  },
  {
    name: 'Integrations & API',
    href: '/dashboard/integrations',
    icon: Zap,
    description: 'Connect external services and manage API integrations',
    badge: 'ENTERPRISE'
  },
  {
    name: 'Projects',
    href: '/dashboard/projects',
    icon: FolderOpen,
    description: 'Manage your content projects'
  },
  {
    name: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
    description: 'Performance insights',
    badge: 'Pro'
  },
];

const secondaryNavigation = [
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    description: 'Account and preferences'
  },
  {
    name: 'Billing',
    href: '/dashboard/billing',
    icon: CreditCard,
    description: 'Subscription and usage'
  },
  {
    name: 'Help & Support',
    href: '/dashboard/help',
    icon: HelpCircle,
    description: 'Documentation and support'
  },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const {
    sidebarCollapsed,
    activeSection,
    toggleSidebar,
    setActiveSection
  } = useNavigationStore();
  const { user, signOut } = useAuthStore();

  useEffect(() => {
    // Update active section based on pathname
    const currentSection = pathname.split('/')[2] || 'dashboard';
    setActiveSection(currentSection);
  }, [pathname, setActiveSection]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col h-full border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300 ease-in-out",
        sidebarCollapsed ? "w-16" : "w-64 lg:w-72",
        className
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-2">
              <Crown className="h-6 w-6 text-primary" />
              <span className="text-lg font-semibold">SEO Generator</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="ml-auto h-8 w-8 p-0"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 p-4 space-y-2" role="navigation" aria-label="Primary navigation">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors group",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                aria-current={isActive ? "page" : undefined}
                title={sidebarCollapsed ? item.name : undefined}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                {!sidebarCollapsed && (
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span>{item.name}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.description}
                    </p>
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        <Separator />

        {/* Secondary Navigation */}
        <nav className="p-4 space-y-2" role="navigation" aria-label="Secondary navigation">
          {secondaryNavigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                aria-current={isActive ? "page" : undefined}
                title={sidebarCollapsed ? item.name : undefined}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                {!sidebarCollapsed && (
                  <div className="flex-1">
                    <span>{item.name}</span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.description}
                    </p>
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        <Separator />

        {/* User Section */}
        <div className="p-4">
          {!sidebarCollapsed && user && (
            <div className="mb-3">
              <div className="flex items-center space-x-3 p-2 rounded-lg bg-muted/50">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-xs font-medium text-primary-foreground">
                    {user.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.email}</p>
                  <p className="text-xs text-muted-foreground">Free Plan</p>
                </div>
              </div>
            </div>
          )}

          {!sidebarCollapsed && (
            <div className="mb-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Usage</span>
                <Badge variant="secondary" className="text-xs">
                  Free
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Content</span>
                  <span>3/10</span>
                </div>
                <Progress value={30} className="h-2" />
              </div>
              <Button size="sm" className="w-full">
                <Crown className="h-4 w-4 mr-2" />
                Upgrade Plan
              </Button>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className={cn(
              "w-full justify-start",
              sidebarCollapsed && "justify-center px-0"
            )}
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            {!sidebarCollapsed && <span className="ml-3">Sign Out</span>}
          </Button>
        </div>
      </div>
    </aside>
  );
}