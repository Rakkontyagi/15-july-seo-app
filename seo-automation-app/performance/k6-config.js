/**
 * K6 Performance Testing Configuration
 * Defines load testing scenarios for 10x expected user capacity
 */

export const config = {
  // Base configuration for expected user load
  expectedUsers: {
    concurrent: 50,      // Expected concurrent users
    requestsPerSecond: 100, // Expected requests per second
    duration: '5m'       // Normal test duration
  },

  // 10x load configuration for stress testing
  stressLoad: {
    concurrent: 500,     // 10x concurrent users
    requestsPerSecond: 1000, // 10x requests per second
    duration: '10m'      // Extended duration for stress testing
  },

  // Performance thresholds for acceptance criteria
  thresholds: {
    // Response time thresholds
    http_req_duration: ['p(95)<1000'], // 95% of requests under 1s
    http_req_duration_api: ['p(95)<500'], // 95% of API requests under 500ms
    
    // Error rate thresholds
    http_req_failed: ['rate<0.01'], // Error rate under 1%
    
    // Database performance thresholds
    database_query_duration: ['p(95)<200'], // 95% of DB queries under 200ms
    
    // Memory usage thresholds
    memory_usage: ['max<2048'], // Max memory under 2GB
    
    // Concurrent user thresholds
    vus: ['max<600'], // Max virtual users
    
    // Custom business metrics
    content_generation_duration: ['p(95)<5000'], // Content generation under 5s
    serp_analysis_duration: ['p(95)<2000'], // SERP analysis under 2s
    cms_publish_duration: ['p(95)<3000'] // CMS publishing under 3s
  },

  // Test scenarios for different load patterns
  scenarios: {
    // Baseline performance test
    baseline: {
      executor: 'constant-vus',
      vus: 50,
      duration: '5m',
      tags: { test_type: 'baseline' }
    },

    // Stress test with 10x load
    stress_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 100 },  // Warm-up
        { duration: '5m', target: 500 },  // Stress load
        { duration: '10m', target: 500 }, // Sustain stress
        { duration: '2m', target: 0 }     // Cool-down
      ],
      tags: { test_type: 'stress' }
    },

    // Spike test for traffic surges
    spike_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 50 },   // Normal load
        { duration: '30s', target: 1000 }, // Sudden spike
        { duration: '1m', target: 1000 },  // Sustain spike
        { duration: '30s', target: 50 },   // Back to normal
        { duration: '1m', target: 0 }      // Cool-down
      ],
      tags: { test_type: 'spike' }
    },

    // Load test for gradual increase
    load_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5m', target: 100 },
        { duration: '10m', target: 200 },
        { duration: '10m', target: 300 },
        { duration: '10m', target: 400 },
        { duration: '10m', target: 500 },
        { duration: '5m', target: 0 }
      ],
      tags: { test_type: 'load' }
    },

    // Endurance test for extended periods
    endurance_test: {
      executor: 'constant-vus',
      vus: 200,
      duration: '30m',
      tags: { test_type: 'endurance' }
    }
  },

  // Environment configurations
  environments: {
    local: {
      baseUrl: 'http://localhost:3000',
      timeout: '30s'
    },
    staging: {
      baseUrl: 'https://seo-automation-app-staging.vercel.app',
      timeout: '60s'
    },
    production: {
      baseUrl: 'https://seo-automation-app.vercel.app',
      timeout: '60s'
    }
  },

  // Test data sets for realistic load testing
  testData: {
    keywords: [
      'SEO optimization',
      'content marketing',
      'digital marketing strategy',
      'search engine ranking',
      'website traffic analysis',
      'keyword research tools',
      'backlink analysis',
      'competitor analysis',
      'content strategy',
      'on-page SEO'
    ],
    locations: [
      'United States',
      'United Kingdom',
      'Canada',
      'Australia',
      'Germany',
      'France',
      'Spain',
      'Italy',
      'Netherlands',
      'Sweden'
    ],
    contentTypes: [
      'blog_post',
      'product_description',
      'landing_page',
      'meta_description',
      'social_media_post'
    ]
  }
};

export default config;