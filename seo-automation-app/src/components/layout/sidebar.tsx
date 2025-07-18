'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useNavigationStore } from '@/store/navigation';
import { 
  LayoutDashboard, 
  FileText, 
  FolderOpen, 
  BarChart3, 
  Settings, 
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Crown
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Content Generator', href: '/dashboard/content', icon: FileText },
  { name: 'Projects', href: '/dashboard/projects', icon: FolderOpen },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
];

export function Sidebar() {
  const pathname = usePathname();
  const { 
    sidebarCollapsed, 
    activeSection, 
    toggleSidebar, 
    setActiveSection 
  } = useNavigationStore();

  useEffect(() => {
    // Update active section based on pathname
    const currentSection = pathname.split('/')[2] || 'dashboard';
    setActiveSection(currentSection);
  }, [pathname, setActiveSection]);

  return (
    <div className={cn(
      "hidden md:flex flex-col border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-200",
      sidebarCollapsed ? "w-16" : "w-64 lg:w-72"
    )}>
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between p-4">
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-2">
              <Crown className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Navigation</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="ml-auto"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
            <span className="sr-only">Toggle sidebar</span>
          </Button>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {!sidebarCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {!sidebarCollapsed && (
          <div className="p-4 border-t">
            <div className="space-y-3">
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
          </div>
        )}
      </div>
    </div>
  );
}