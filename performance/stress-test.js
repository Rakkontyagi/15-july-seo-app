/**
 * K6 Stress Testing Script
 * Tests system behavior under extreme load (10x expected capacity)
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter, Gauge, Rate, Trend } from 'k6/metrics';
import { randomItem, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';
import { config } from './k6-config.js';

// Custom metrics for stress testing
const systemRecoveryTime = new Trend('system_recovery_time');
const errorSpikes = new Counter('error_spikes');
const resourceExhaustion = new Gauge('resource_exhaustion');

// Stress test configuration
export const options = {
  scenarios: {
    stress_ramp_up: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 100 },   // Normal load
        { duration: '5m', target: 500 },   // Increase to stress
        { duration: '10m', target: 1000 }, // Extreme load
        { duration: '5m', target: 2000 },  // Breaking point
        { duration: '10m', target: 2000 }, // Sustain extreme load
        { duration: '5m', target: 500 },   // Scale down
        { duration: '5m', target: 0 }      // Recovery
      ],
      tags: { test_type: 'stress_ramp' }
    },
    
    spike_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 50 },    // Baseline
        { duration: '10s', target: 1500 }, // Sudden spike
        { duration: '3m', target: 1500 },  // Sustain spike
        { duration: '10s', target: 50 },   // Drop back
        { duration: '3m', target: 50 },    // Recovery period
        { duration: '10s', target: 0 }     // End
      ],
      tags: { test_type: 'spike' }
    }
  },
  
  thresholds: {
    // Stress test specific thresholds
    http_req_duration: ['p(99)<5000'], // 99% under 5s during stress
    http_req_failed: ['rate<0.05'],    // Error rate under 5% during stress
    system_recovery_time: ['max<30000'], // Recovery under 30s
    
    // Resource exhaustion thresholds
    resource_exhaustion: ['max<0.8'], // Resource usage under 80%
    
    // Performance degradation acceptable under stress
    'http_req_duration{test_type:stress_ramp}': ['p(95)<3000'],
    'http_req_duration{test_type:spike}': ['p(90)<2000']
  }
};

const BASE_URL = __ENV.BASE_URL || config.environments.staging.baseUrl;
const headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'User-Agent': 'K6-Stress-Test/1.0'
};

export function setup() {
  console.log(`Starting stress tests against: ${BASE_URL}`);
  
  // Verify system is healthy before stress testing
  const healthResponse = http.get(`${BASE_URL}/api/health`, { headers });
  
  if (healthResponse.status !== 200) {
    throw new Error(`System not healthy before stress test: ${healthResponse.status}`);
  }
  
  return {
    baseUrl: BASE_URL,
    startTime: new Date(),
    initialHealth: healthResponse.json()
  };
}

export default function(data) {
  const scenario = __ENV.K6_SCENARIO_NAME || 'stress_ramp_up';
  
  // Different behavior based on stress level
  const currentVUs = __VU;
  const stressLevel = getStressLevel(currentVUs);
  
  if (stressLevel === 'extreme') {
    extremeLoadScenario(data);
  } else if (stressLevel === 'high') {
    highLoadScenario(data);
  } else {
    normalLoadScenario(data);
  }
  
  // Adaptive sleep based on stress level
  const sleepTime = getSleepTime(stressLevel);
  sleep(sleepTime);
}

function getStressLevel(vus) {
  if (vus > 1500) return 'extreme';
  if (vus > 500) return 'high';
  return 'normal';
}

function getSleepTime(stressLevel) {
  switch (stressLevel) {
    case 'extreme': return randomIntBetween(0.1, 0.5);
    case 'high': return randomIntBetween(0.5, 1);
    case 'normal': return randomIntBetween(1, 2);
    default: return 1;
  }
}

function extremeLoadScenario(data) {
  group('Extreme Load Scenario', () => {
    // Focus on most critical endpoints only
    const criticalEndpoints = [
      '/api/health',
      '/api/serp/analyze',
      '/api/seo/analyze'
    ];
    
    const endpoint = randomItem(criticalEndpoints);
    const payload = getMinimalPayload(endpoint);
    
    const response = makeRequest(data.baseUrl + endpoint, payload);
    
    // Check for system exhaustion indicators
    checkSystemExhaustion(response);
    
    // Reduced expectations during extreme load
    const success = check(response, {
      'Response received': (r) => r.status > 0,
      'Not completely failed': (r) => r.status < 500 || r.status === 503,
      'Response time reasonable': (r) => r.timings.duration < 10000
    });
    
    if (!success) {
      errorSpikes.add(1);
    }
  });
}

function highLoadScenario(data) {
  group('High Load Scenario', () => {
    // Realistic but intense usage
    const workflows = [
      () => quickSerpAnalysis(data),
      () => basicSeoCheck(data),
      () => healthMonitoring(data)
    ];
    
    const workflow = randomItem(workflows);
    workflow();
  });
}

function normalLoadScenario(data) {
  group('Normal Load Scenario', () => {
    // Full feature testing
    const workflows = [
      () => fullContentGeneration(data),
      () => comprehensiveSeoAnalysis(data),
      () => cmsIntegration(data)
    ];
    
    const workflow = randomItem(workflows);
    workflow();
  });
}

function quickSerpAnalysis(data) {
  const response = http.post(`${data.baseUrl}/api/serp/analyze`,
    JSON.stringify({
      keyword: randomItem(config.testData.keywords),
      location: randomItem(config.testData.locations),
      resultsCount: 5 // Reduced for performance
    }),
    { headers, timeout: '10s' }
  );
  
  check(response, {
    'SERP analysis completed': (r) => r.status === 200,
    'SERP response time acceptable': (r) => r.timings.duration < 3000
  });
  
  return response;
}

function basicSeoCheck(data) {
  const response = http.post(`${data.baseUrl}/api/seo/analyze`,
    JSON.stringify({
      keyword: randomItem(config.testData.keywords),
      content: "Basic content for SEO analysis",
      quickAnalysis: true
    }),
    { headers, timeout: '5s' }
  );
  
  check(response, {
    'SEO analysis completed': (r) => r.status === 200,
    'SEO response time acceptable': (r) => r.timings.duration < 2000
  });
  
  return response;
}

function healthMonitoring(data) {
  const healthResponse = http.get(`${data.baseUrl}/api/health`, { headers });
  const metricsResponse = http.get(`${data.baseUrl}/api/metrics`, { headers });
  
  const healthOk = check(healthResponse, {
    'Health check responds': (r) => r.status === 200,
    'Health check fast': (r) => r.timings.duration < 1000
  });
  
  const metricsOk = check(metricsResponse, {
    'Metrics available': (r) => r.status === 200,
    'Metrics response time': (r) => r.timings.duration < 2000
  });
  
  // Monitor system resources if available
  if (metricsOk && metricsResponse.json()) {
    const metrics = metricsResponse.json();
    if (metrics.memory) {
      const memoryUsage = metrics.memory.heapUsed / metrics.memory.heapTotal;
      resourceExhaustion.add(memoryUsage);
    }
  }
  
  return healthOk && metricsOk;
}

function fullContentGeneration(data) {
  // Complete workflow but with timeouts
  const keyword = randomItem(config.testData.keywords);
  
  const serpResponse = http.post(`${data.baseUrl}/api/serp/analyze`,
    JSON.stringify({
      keyword: keyword,
      location: randomItem(config.testData.locations)
    }),
    { headers, timeout: '15s' }
  );
  
  if (serpResponse.status === 200) {
    const seoResponse = http.post(`${data.baseUrl}/api/seo/analyze`,
      JSON.stringify({
        keyword: keyword,
        content: "Generated content for analysis"
      }),
      { headers, timeout: '10s' }
    );
    
    check(seoResponse, {
      'Full workflow completed': (r) => r.status === 200
    });
  }
}

function comprehensiveSeoAnalysis(data) {
  const response = http.post(`${data.baseUrl}/api/seo/analyze`,
    JSON.stringify({
      keyword: randomItem(config.testData.keywords),
      content: generateLongContent(),
      analyzeCompetitors: true,
      deepAnalysis: true
    }),
    { headers, timeout: '20s' }
  );
  
  check(response, {
    'Comprehensive SEO completed': (r) => r.status === 200,
    'Analysis has detailed metrics': (r) => r.json() && r.json().detailed
  });
}

function cmsIntegration(data) {
  const platform = randomItem(['wordpress', 'shopify']);
  
  const response = http.post(`${data.baseUrl}/api/cms/${platform}/publish`,
    JSON.stringify({
      title: `Stress Test Content ${Date.now()}`,
      content: generateLongContent(),
      status: 'draft'
    }),
    { headers, timeout: '15s' }
  );
  
  check(response, {
    'CMS integration works': (r) => r.status === 200
  });
}

function makeRequest(url, payload) {
  if (payload) {
    return http.post(url, JSON.stringify(payload), { headers, timeout: '30s' });
  } else {
    return http.get(url, { headers, timeout: '30s' });
  }
}

function getMinimalPayload(endpoint) {
  const payloads = {
    '/api/serp/analyze': {
      keyword: 'SEO',
      location: 'US'
    },
    '/api/seo/analyze': {
      keyword: 'test',
      content: 'test content'
    }
  };
  
  return payloads[endpoint] || null;
}

function checkSystemExhaustion(response) {
  // Check for signs of system exhaustion
  if (response.status === 503) {
    resourceExhaustion.add(0.9); // Service unavailable
  } else if (response.status === 429) {
    resourceExhaustion.add(0.7); // Rate limited
  } else if (response.timings.duration > 10000) {
    resourceExhaustion.add(0.6); // Very slow response
  } else if (response.status >= 500) {
    resourceExhaustion.add(0.8); // Server error
  }
}

function generateLongContent() {
  const paragraphs = [
    "This is a comprehensive piece of content designed to test system performance under load.",
    "SEO optimization requires careful attention to keyword density, content structure, and user engagement metrics.",
    "Performance testing ensures that applications can handle real-world traffic patterns and usage spikes.",
    "Load testing with tools like K6 provides valuable insights into system behavior under stress conditions."
  ];
  
  return paragraphs.join(' ').repeat(randomIntBetween(2, 5));
}

export function teardown(data) {
  console.log('Stress test completed, checking system recovery...');
  
  const recoveryStartTime = new Date();
  let recovered = false;
  let attempts = 0;
  const maxAttempts = 10;
  
  // Check system recovery
  while (!recovered && attempts < maxAttempts) {
    attempts++;
    
    const healthResponse = http.get(`${data.baseUrl}/api/health`, { headers });
    
    if (healthResponse.status === 200) {
      const healthData = healthResponse.json();
      if (healthData && healthData.status === 'healthy') {
        recovered = true;
        const recoveryTime = new Date() - recoveryStartTime;
        systemRecoveryTime.add(recoveryTime);
        console.log(`System recovered in ${recoveryTime}ms`);
      }
    }
    
    if (!recovered) {
      sleep(3); // Wait 3 seconds before retry
    }
  }
  
  if (!recovered) {
    console.warn('System did not recover within expected time after stress test');
  }
  
  const totalDuration = new Date() - data.startTime;
  console.log(`Total stress test duration: ${totalDuration}ms`);
}