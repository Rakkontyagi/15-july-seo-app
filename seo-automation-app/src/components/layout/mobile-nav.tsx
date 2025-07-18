'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/cn';
import { useNavigationStore } from '@/store/navigation';
import { 
  LayoutDashboard, 
  FileText, 
  FolderOpen, 
  BarChart3, 
  Settings, 
  CreditCard,
  X,
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

interface MobileNavProps {
  onClose: () => void;
}

export function MobileNav({ onClose }: MobileNavProps) {
  const pathname = usePathname();
  const { setMobileMenuOpen } = useNavigationStore();
  
  const handleLinkClick = () => {
    setMobileMenuOpen(false);
    onClose();
  };

  return (
    <div className="md:hidden">
      <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
        <div className="fixed inset-y-0 left-0 z-50 w-full max-w-sm bg-background p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Crown className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold">SEO Generator</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Close menu</span>
            </Button>
          </div>

          <nav className="mt-8 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={handleLinkClick}
                  className={cn(
                    "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-8 pt-8 border-t">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Current Plan</span>
                <Badge variant="secondary" className="text-xs">
                  Free
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Content Generated</span>
                  <span>3/10</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '30%' }} />
                </div>
              </div>
              <Button size="sm" className="w-full">
                <Crown className="h-4 w-4 mr-2" />
                Upgrade Plan
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}