module.exports = {
  ci: {
    collect: {
      url: [
        'https://seo-automation-app.vercel.app',
        'https://seo-automation-app.vercel.app/dashboard',
        'https://seo-automation-app.vercel.app/api/health'
      ],
      startServerCommand: 'npm run start',
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
      }
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', {minScore: 0.85}],
        'categories:accessibility': ['error', {minScore: 0.95}],
        'categories:best-practices': ['warn', {minScore: 0.90}],
        'categories:seo': ['error', {minScore: 0.95}],
        'categories:pwa': ['warn', {minScore: 0.80}],
        
        // Core Web Vitals
        'first-contentful-paint': ['warn', {maxNumericValue: 1500}],
        'largest-contentful-paint': ['error', {maxNumericValue: 2500}],
        'first-input-delay': ['error', {maxNumericValue: 100}],
        'cumulative-layout-shift': ['error', {maxNumericValue: 0.1}],
        'total-blocking-time': ['warn', {maxNumericValue: 200}],
        
        // Additional Performance Metrics
        'speed-index': ['warn', {maxNumericValue: 3000}],
        'time-to-interactive': ['warn', {maxNumericValue: 3800}],
        'max-potential-fid': ['warn', {maxNumericValue: 130}],
        
        // Network & Loading
        'server-response-time': ['warn', {maxNumericValue: 600}],
        'render-blocking-resources': ['warn', {maxNumericValue: 500}],
        'unused-css-rules': ['warn', {maxNumericValue: 20000}],
        'unused-javascript': ['warn', {maxNumericValue: 50000}],
        
        // Security & Best Practices
        'is-on-https': 'error',
        'uses-http2': 'warn',
        'no-vulnerable-libraries': 'error',
        'csp-xss': 'warn',
      }
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};