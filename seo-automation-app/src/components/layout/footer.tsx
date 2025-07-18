import Link from 'next/link';
import { Crown } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex flex-col items-center justify-between gap-4 py-6 md:flex-row">
        <div className="flex items-center space-x-2">
          <Crown className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">SEO Generator</span>
        </div>
        
        <nav className="flex items-center space-x-6 text-sm">
          <Link
            href="/docs"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Documentation
          </Link>
          <Link
            href="/support"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Support
          </Link>
          <Link
            href="/privacy"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Terms
          </Link>
        </nav>
        
        <div className="text-sm text-muted-foreground">
          © 2024 SEO Generator. All rights reserved.
        </div>
      </div>
    </footer>
  );
}