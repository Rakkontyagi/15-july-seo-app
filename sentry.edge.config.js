// This file configures the initialization of Sentry for edge runtime
// Next.js requires these configuration files to be in the root directory

import { initializeSentry } from './src/lib/monitoring/sentry';

initializeSentry({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,
  enablePerformanceMonitoring: true,
  enableSessionReplay: false, // Disable session replay on edge
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
});