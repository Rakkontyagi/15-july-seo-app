// This file configures the initialization of Sentry on the browser/client side
// Next.js requires these configuration files to be in the root directory

import { initializeSentry } from './src/lib/monitoring/sentry';

initializeSentry({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  enablePerformanceMonitoring: true,
  enableSessionReplay: true,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});