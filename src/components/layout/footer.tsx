'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/cn';
import {
  Crown,
  Mail,
  MessageCircle,
  FileText,
  Shield,
  Users,
  Github,
  Twitter,
  Linkedin,
  ExternalLink,
  Heart
} from 'lucide-react';

const footerNavigation = {
  product: [
    { name: 'Content Generator', href: '/dashboard/content' },
    { name: 'Analytics', href: '/dashboard/analytics' },
    { name: 'Projects', href: '/dashboard/projects' },
    { name: 'Pricing', href: '/pricing' },
  ],
  support: [
    { name: 'Documentation', href: '/docs' },
    { name: 'Help Center', href: '/help' },
    { name: 'Contact Support', href: '/support' },
    { name: 'Status Page', href: '/status', external: true },
  ],
  company: [
    { name: 'About', href: '/about' },
    { name: 'Blog', href: '/blog' },
    { name: 'Careers', href: '/careers' },
    { name: 'Partners', href: '/partners' },
  ],
  legal: [
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Cookie Policy', href: '/cookies' },
    { name: 'GDPR', href: '/gdpr' },
  ],
};

const socialLinks = [
  {
    name: 'Twitter',
    href: 'https://twitter.com/seogenerator',
    icon: Twitter,
    label: 'Follow us on Twitter'
  },
  {
    name: 'LinkedIn',
    href: 'https://linkedin.com/company/seogenerator',
    icon: Linkedin,
    label: 'Connect on LinkedIn'
  },
  {
    name: 'GitHub',
    href: 'https://github.com/seogenerator',
    icon: Github,
    label: 'View our GitHub'
  },
];

interface FooterProps {
  className?: string;
  variant?: 'default' | 'minimal';
}

export function Footer({ className, variant = 'default' }: FooterProps) {
  const currentYear = new Date().getFullYear();

  if (variant === 'minimal') {
    return (
      <footer
        className={cn(
          "border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
          className
        )}
        role="contentinfo"
        aria-label="Site footer"
      >
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <Crown className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">SEO Generator</span>
              <Badge variant="secondary" className="text-xs">
                Beta
              </Badge>
            </div>

            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>© {currentYear} SEO Generator</span>
              <Link
                href="/privacy"
                className="hover:text-foreground transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="hover:text-foreground transition-colors"
              >
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer
      className={cn(
        "border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
      role="contentinfo"
      aria-label="Site footer"
    >
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <Crown className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">SEO Generator</span>
              <Badge variant="secondary" className="text-xs">
                Beta
              </Badge>
            </div>

            <p className="text-muted-foreground mb-6 max-w-md">
              AI-powered SEO content generation platform that helps you create
              high-quality, optimized content at scale. Built for content creators,
              marketers, and businesses.
            </p>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <Button size="sm" asChild>
                <Link href="/dashboard/content">
                  <FileText className="h-4 w-4 mr-2" />
                  Start Creating
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/support">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Get Support
                </Link>
              </Button>
            </div>

            {/* Social Links */}
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <Button
                  key={social.name}
                  variant="ghost"
                  size="sm"
                  asChild
                  className="h-9 w-9 p-0"
                >
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                  >
                    <social.icon className="h-4 w-4" />
                  </a>
                </Button>
              ))}
            </div>
          </div>

          {/* Navigation Sections */}
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-3">
              {footerNavigation.product.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-3">
              {footerNavigation.support.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-muted-foreground hover:text-foreground transition-colors text-sm flex items-center"
                    {...(item.external && {
                      target: '_blank',
                      rel: 'noopener noreferrer'
                    })}
                  >
                    {item.name}
                    {item.external && (
                      <ExternalLink className="h-3 w-3 ml-1" />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-3">
              {footerNavigation.company.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-6">
              <h4 className="font-medium mb-3 text-sm">Legal</h4>
              <ul className="space-y-2">
                {footerNavigation.legal.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-muted-foreground hover:text-foreground transition-colors text-xs"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>© {currentYear} SEO Generator. All rights reserved.</span>
            <div className="hidden md:flex items-center space-x-1">
              <span>Made with</span>
              <Heart className="h-3 w-3 text-red-500 fill-current" />
              <span>for content creators</span>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
            <div className="flex items-center space-x-2">
              <Shield className="h-3 w-3" />
              <span>SOC 2 Compliant</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="h-3 w-3" />
              <span>GDPR Ready</span>
            </div>
            <Badge variant="outline" className="text-xs">
              v1.0.0
            </Badge>
          </div>
        </div>
      </div>
    </footer>
  );
}