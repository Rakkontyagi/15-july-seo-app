'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex items-center justify-center min-h-screen p-4 bg-background">
          <div className="text-center space-y-4 max-w-md">
            <div className="text-6xl">💥</div>
            <h1 className="text-2xl font-bold">Critical Error</h1>
            <p className="text-muted-foreground">
              A critical error occurred that prevented the application from loading. 
              Please refresh the page or contact support.
            </p>
            <div className="flex flex-col gap-2">
              <button 
                onClick={reset}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Try Again
              </button>
              <button 
                onClick={() => window.location.href = '/'}
                className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors"
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}