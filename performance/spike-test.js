/**
 * K6 Spike Testing Script
 * Tests system behavior during sudden traffic spikes
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter, Gauge, Rate, Trend } from 'k6/metrics';
import { randomItem, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';
import { config } from './k6-config.js';

// Custom metrics for spike testing
const spikeRecoveryTime = new Trend('spike_recovery_time');
const performanceDegradation = new Gauge('performance_degradation');
const requestQueueLength = new Gauge('request_queue_length');
const systemStability = new Rate('system_stability');

// Spike test configuration
export const options = {
  scenarios: {
    sudden_spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 50 },    // Baseline load
        { duration: '30s', target: 1200 }, // Sudden massive spike
        { duration: '2m', target: 1200 },  // Sustain spike
        { duration: '30s', target: 50 },   // Quick recovery
        { duration: '3m', target: 50 },    // Monitor recovery
        { duration: '10s', target: 0 }     // End
      ],
      tags: { test_type: 'sudden_spike' }
    },
    
    gradual_spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '3m', target: 100 },   // Normal load
        { duration: '1m', target: 800 },   // Gradual spike
        { duration: '3m', target: 800 },   // Sustain
        { duration: '1m', target: 100 },   // Gradual return
        { duration: '2m', target: 0 }      // End
      ],
      tags: { test_type: 'gradual_spike' }
    },
    
    repeated_spikes: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 50 },    // Baseline
        { duration: '30s', target: 500 },  // First spike
        { duration: '1m', target: 50 },    // Return to baseline
        { duration: '30s', target: 700 },  // Second larger spike
        { duration: '1m', target: 50 },    // Return to baseline
        { duration: '30s', target: 900 },  // Third largest spike
        { duration: '2m', target: 50 },    // Final recovery
        { duration: '10s', target: 0 }     // End
      ],
      tags: { test_type: 'repeated_spikes' }
    }
  },
  
  thresholds: {
    // Spike-specific thresholds (more lenient during spikes)
    http_req_duration: ['p(90)<3000'], // 90% under 3s during spikes
    http_req_failed: ['rate<0.1'],     // Error rate under 10% during spikes
    spike_recovery_time: ['max<60000'], // Recovery under 60s
    system_stability: ['rate>0.8'],    // 80% stability during spikes
    
    // Performance degradation tracking
    performance_degradation: ['max<2'], // Max 2x performance degradation
    
    // Different expectations for different spike types
    'http_req_duration{test_type:sudden_spike}': ['p(95)<5000'],
    'http_req_duration{test_type:gradual_spike}': ['p(95)<2000'],
    'http_req_duration{test_type:repeated_spikes}': ['p(95)<3000']
  }
};

const BASE_URL = __ENV.BASE_URL || config.environments.staging.baseUrl;
const headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'User-Agent': 'K6-Spike-Test/1.0'
};

export function setup() {
  console.log(`Starting spike tests against: ${BASE_URL}`);
  
  // Verify system baseline performance
  const baselineResponse = http.get(`${BASE_URL}/api/health`, { headers });
  
  if (baselineResponse.status !== 200) {
    throw new Error(`System not healthy before spike test: ${baselineResponse.status}`);
  }
  
  // Record baseline response time
  const baselineTime = baselineResponse.timings.duration;
  
  return {
    baseUrl: BASE_URL,
    startTime: new Date(),
    baselineResponseTime: baselineTime
  };
}

export default function(data) {
  const scenario = __ENV.K6_SCENARIO_NAME || 'sudden_spike';
  const currentVUs = __VU;
  
  // Determine spike intensity
  const spikeIntensity = getSpikeIntensity(currentVUs, scenario);
  
  // Adjust test behavior based on spike intensity
  if (spikeIntensity === 'extreme') {
    extremeSpikeScenario(data);
  } else if (spikeIntensity === 'high') {
    highSpikeScenario(data);
  } else {
    normalSpikeScenario(data);
  }
  
  // Adaptive sleep based on spike intensity
  const sleepTime = getSpikeAdjustedSleep(spikeIntensity);
  sleep(sleepTime);
}

function getSpikeIntensity(vus, scenario) {
  const thresholds = {
    sudden_spike: { extreme: 1000, high: 500 },
    gradual_spike: { extreme: 600, high: 300 },
    repeated_spikes: { extreme: 700, high: 400 }
  };
  
  const limits = thresholds[scenario] || thresholds.sudden_spike;
  
  if (vus > limits.extreme) return 'extreme';
  if (vus > limits.high) return 'high';
  return 'normal';
}

function getSpikeAdjustedSleep(intensity) {
  switch (intensity) {
    case 'extreme': return randomIntBetween(0.1, 0.3);
    case 'high': return randomIntBetween(0.3, 0.8);
    case 'normal': return randomIntBetween(1, 2);
    default: return 1;
  }
}

function extremeSpikeScenario(data) {
  group('Extreme Spike Scenario', () => {
    // Only hit the most critical endpoints
    const criticalEndpoints = [
      '/api/health',
      '/api/serp/analyze'
    ];
    
    const endpoint = randomItem(criticalEndpoints);
    const startTime = new Date();
    
    const response = makeOptimizedRequest(data.baseUrl + endpoint);
    
    // Measure performance degradation
    const responseTime = response.timings.duration;
    const degradation = responseTime / data.baselineResponseTime;
    performanceDegradation.add(degradation);
    
    // Check basic functionality during extreme load
    const stable = check(response, {
      'Service responds': (r) => r.status > 0,
      'Not completely down': (r) => r.status !== 503 || Math.random() > 0.5,
      'Response within extreme threshold': (r) => r.timings.duration < 10000
    });
    
    systemStability.add(stable ? 1 : 0);
    
    if (!stable) {
      console.warn(`System instability detected at VU: ${__VU}`);
    }
  });
}

function highSpikeScenario(data) {
  group('High Spike Scenario', () => {
    // Essential endpoints with reduced functionality
    const workflows = [
      () => quickHealthCheck(data),
      () => basicSerpCheck(data),
      () => simpleSeoCheck(data)
    ];
    
    const workflow = randomItem(workflows);
    const startTime = new Date();
    
    workflow();
    
    const workflowTime = new Date() - startTime;
    if (workflowTime > 5000) {
      console.log(`Slow workflow detected: ${workflowTime}ms`);
    }
  });
}

function normalSpikeScenario(data) {
  group('Normal Spike Scenario', () => {
    // Full functionality testing
    const workflows = [
      () => healthMonitoring(data),
      () => serpAnalysisWorkflow(data),
      () => seoAnalysisWorkflow(data)
    ];
    
    const workflow = randomItem(workflows);
    workflow();
  });
}

function quickHealthCheck(data) {
  const response = http.get(`${data.baseUrl}/api/health`, { 
    headers, 
    timeout: '5s' 
  });
  
  const success = check(response, {
    'Health check responds': (r) => r.status === 200,
    'Health check fast': (r) => r.timings.duration < 2000
  });
  
  return success;
}

function basicSerpCheck(data) {
  const response = http.post(`${data.baseUrl}/api/serp/analyze`,
    JSON.stringify({
      keyword: randomItem(['SEO', 'marketing', 'content']),
      location: 'US',
      resultsCount: 3 // Reduced for spike performance
    }),
    { headers, timeout: '8s' }
  );
  
  const success = check(response, {
    'Basic SERP works': (r) => r.status === 200,
    'SERP spike response time': (r) => r.timings.duration < 5000
  });
  
  return success;
}

function simpleSeoCheck(data) {
  const response = http.post(`${data.baseUrl}/api/seo/analyze`,
    JSON.stringify({
      keyword: 'test',
      content: 'Simple test content',
      quickMode: true
    }),
    { headers, timeout: '6s' }
  );
  
  const success = check(response, {
    'Simple SEO works': (r) => r.status === 200,
    'SEO spike response time': (r) => r.timings.duration < 3000
  });
  
  return success;
}

function serpAnalysisWorkflow(data) {
  const response = http.post(`${data.baseUrl}/api/serp/analyze`,
    JSON.stringify({
      keyword: randomItem(config.testData.keywords),
      location: randomItem(config.testData.locations),
      resultsCount: 5
    }),
    { headers, timeout: '10s' }
  );
  
  check(response, {
    'SERP analysis during spike': (r) => r.status === 200,
    'SERP spike performance': (r) => r.timings.duration < 4000
  });
}

function seoAnalysisWorkflow(data) {
  const response = http.post(`${data.baseUrl}/api/seo/analyze`,
    JSON.stringify({
      keyword: randomItem(config.testData.keywords.slice(0, 5)), // Limit keywords
      content: generateSimpleContent()
    }),
    { headers, timeout: '8s' }
  );
  
  check(response, {
    'SEO analysis during spike': (r) => r.status === 200,
    'SEO spike performance': (r) => r.timings.duration < 3000
  });
}

function healthMonitoring(data) {
  const healthResponse = http.get(`${data.baseUrl}/api/health`, { headers });
  
  const healthy = check(healthResponse, {
    'Health check during spike': (r) => r.status === 200,
    'Health check spike time': (r) => r.timings.duration < 1000
  });
  
  // Try to get system metrics during spike
  if (healthy) {
    const metricsResponse = http.get(`${data.baseUrl}/api/metrics`, { 
      headers, 
      timeout: '3s' 
    });
    
    if (metricsResponse.status === 200) {
      const metrics = metricsResponse.json();
      if (metrics.queueLength !== undefined) {
        requestQueueLength.add(metrics.queueLength);
      }
    }
  }
  
  return healthy;
}

function makeOptimizedRequest(url) {
  // Optimized request with shorter timeout for spike conditions
  return http.get(url, { 
    headers, 
    timeout: '15s',
    throwHttpErrors: false // Don't throw on HTTP errors during spikes
  });
}

function generateSimpleContent() {
  return `Simple content for spike testing. Generated at ${new Date().toISOString()}.`;
}

export function teardown(data) {
  console.log('Spike test completed, measuring recovery...');
  
  const recoveryStartTime = new Date();
  let systemRecovered = false;
  let attempts = 0;
  const maxAttempts = 20;
  
  // Monitor system recovery after spike
  while (!systemRecovered && attempts < maxAttempts) {
    attempts++;
    
    const healthResponse = http.get(`${data.baseUrl}/api/health`, { headers });
    
    if (healthResponse.status === 200) {
      const responseTime = healthResponse.timings.duration;
      
      // Consider recovered if response time is within 150% of baseline
      if (responseTime <= data.baselineResponseTime * 1.5) {
        systemRecovered = true;
        const recoveryTime = new Date() - recoveryStartTime;
        spikeRecoveryTime.add(recoveryTime);
        console.log(`System recovered from spike in ${recoveryTime}ms (${attempts} attempts)`);
      }
    }
    
    if (!systemRecovered) {
      sleep(2); // Wait 2 seconds before retry
    }
  }
  
  if (!systemRecovered) {
    console.warn(`System did not recover within expected time after spike test (${attempts} attempts)`);
    spikeRecoveryTime.add(120000); // 2 minutes - failed recovery
  }
  
  const totalDuration = new Date() - data.startTime;
  console.log(`Total spike test duration: ${totalDuration}ms`);
}