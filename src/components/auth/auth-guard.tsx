'use client';

import { useAuthStore } from '@/store/auth';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAuth?: boolean;
}

export function AuthGuard({ 
  children, 
  fallback = null, 
  requireAuth = true 
}: AuthGuardProps) {
  const { user, loading, initialized } = useAuthStore();

  // Still loading or not initialized
  if (!initialized || loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check auth requirement
  const hasUser = !!user;
  const shouldShow = requireAuth ? hasUser : !hasUser;

  if (!shouldShow) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Convenience components
export function AuthenticatedOnly({ children, fallback }: Omit<AuthGuardProps, 'requireAuth'>) {
  return (
    <AuthGuard requireAuth={true} fallback={fallback}>
      {children}
    </AuthGuard>
  );
}

export function UnauthenticatedOnly({ children, fallback }: Omit<AuthGuardProps, 'requireAuth'>) {
  return (
    <AuthGuard requireAuth={false} fallback={fallback}>
      {children}
    </AuthGuard>
  );
}