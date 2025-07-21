'use client';

import { cn } from '@/lib/utils/cn';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

interface LoadingDotsProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

interface LoadingSkeletonProps {
  className?: string;
  lines?: number;
  avatar?: boolean;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-gray-300 border-t-primary',
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export function LoadingDots({ size = 'md', className }: LoadingDotsProps) {
  const sizeClasses = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
  };

  return (
    <div className={cn('flex space-x-1', className)} role="status" aria-label="Loading">
      <div className={cn('bg-primary rounded-full animate-bounce', sizeClasses[size])} style={{ animationDelay: '0ms' }} />
      <div className={cn('bg-primary rounded-full animate-bounce', sizeClasses[size])} style={{ animationDelay: '150ms' }} />
      <div className={cn('bg-primary rounded-full animate-bounce', sizeClasses[size])} style={{ animationDelay: '300ms' }} />
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export function LoadingSkeleton({ className, lines = 3, avatar = false }: LoadingSkeletonProps) {
  return (
    <div className={cn('animate-pulse', className)} role="status" aria-label="Loading content">
      <div className="flex space-x-4">
        {avatar && (
          <div className="rounded-full bg-gray-300 h-10 w-10 flex-shrink-0" />
        )}
        <div className="flex-1 space-y-2">
          {Array.from({ length: lines }).map((_, index) => (
            <div
              key={index}
              className={cn(
                'h-4 bg-gray-300 rounded',
                index === lines - 1 ? 'w-3/4' : 'w-full'
              )}
            />
          ))}
        </div>
      </div>
      <span className="sr-only">Loading content...</span>
    </div>
  );
}

export function LoadingCard({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse', className)} role="status" aria-label="Loading card">
      <div className="border border-gray-200 rounded-lg p-4 space-y-3">
        <div className="h-4 bg-gray-300 rounded w-3/4" />
        <div className="space-y-2">
          <div className="h-3 bg-gray-300 rounded w-full" />
          <div className="h-3 bg-gray-300 rounded w-5/6" />
        </div>
        <div className="flex space-x-2">
          <div className="h-6 bg-gray-300 rounded w-16" />
          <div className="h-6 bg-gray-300 rounded w-20" />
        </div>
      </div>
      <span className="sr-only">Loading card...</span>
    </div>
  );
}

export function LoadingButton({ children, loading = false, className }: { 
  children: React.ReactNode;
  loading?: boolean;
  className?: string;
}) {
  return (
    <button
      className={cn(
        'relative inline-flex items-center justify-center',
        loading && 'cursor-not-allowed opacity-70',
        className
      )}
      disabled={loading}
    >
      {loading && (
        <LoadingSpinner size="sm" className="absolute" />
      )}
      <span className={cn(loading && 'opacity-0')}>
        {children}
      </span>
    </button>
  );
}

export function LoadingPage({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

export function LoadingOverlay({ 
  isVisible, 
  message = 'Loading...',
  className 
}: { 
  isVisible: boolean;
  message?: string;
  className?: string;
}) {
  if (!isVisible) return null;

  return (
    <div className={cn(
      'fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center',
      className
    )}>
      <div className="text-center space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}