/**
 * K6 Endurance Testing Script
 * Tests system stability and performance over extended periods
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter, Gauge, Rate, Trend } from 'k6/metrics';
import { randomItem, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';
import { config } from './k6-config.js';

// Custom metrics for endurance testing
const memoryLeakDetection = new Trend('memory_leak_detection');
const performanceDrift = new Trend('performance_drift');
const systemStaminaRate = new Rate('system_stamina_rate');
const resourceExhaustionCount = new Counter('resource_exhaustion_count');
const longTermStability = new Rate('long_term_stability');

// Endurance test configuration
export const options = {
  scenarios: {
    extended_load: {
      executor: 'constant-vus',
      vus: 200,
      duration: '30m', // 30 minutes of sustained load
      tags: { test_type: 'extended_load' }
    },
    
    gradual_endurance: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5m', target: 50 },   // Warm-up
        { duration: '10m', target: 150 }, // Increase load
        { duration: '20m', target: 200 }, // Sustained endurance
        { duration: '10m', target: 300 }, // Peak endurance
        { duration: '20m', target: 300 }, // Extended peak
        { duration: '5m', target: 0 }     // Cool-down
      ],
      tags: { test_type: 'gradual_endurance' }
    },
    
    memory_pressure: {
      executor: 'constant-vus',
      vus: 100,
      duration: '45m', // Extended duration for memory leak detection
      tags: { test_type: 'memory_pressure' }
    }
  },
  
  thresholds: {
    // Endurance-specific thresholds
    http_req_duration: ['p(95)<2000'], // 95% under 2s throughout duration
    http_req_failed: ['rate<0.02'],    // Error rate under 2% over time
    system_stamina_rate: ['rate>0.95'], // 95% system stamina
    long_term_stability: ['rate>0.98'], // 98% long-term stability
    
    // Memory and performance drift
    memory_leak_detection: ['max<1.5'], // Max 50% memory increase
    performance_drift: ['max<1.3'],     // Max 30% performance degradation
    
    // Resource exhaustion
    resource_exhaustion_count: ['count<10'], // Less than 10 exhaustion events
    
    // Different expectations for different endurance types
    'http_req_duration{test_type:extended_load}': ['p(90)<1500'],
    'http_req_duration{test_type:gradual_endurance}': ['p(95)<2000'],
    'http_req_duration{test_type:memory_pressure}': ['p(90)<1800']
  }
};

const BASE_URL = __ENV.BASE_URL || config.environments.staging.baseUrl;
const headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'User-Agent': 'K6-Endurance-Test/1.0'
};

let baselineMetrics = {
  responseTime: 0,
  memoryUsage: 0,
  cpuUsage: 0
};

export function setup() {
  console.log(`Starting endurance tests against: ${BASE_URL}`);
  
  // Establish baseline metrics
  const healthResponse = http.get(`${BASE_URL}/api/health`, { headers });
  const metricsResponse = http.get(`${BASE_URL}/api/metrics`, { headers });
  
  if (healthResponse.status !== 200) {
    throw new Error(`System not healthy before endurance test: ${healthResponse.status}`);
  }
  
  // Record baseline metrics
  baselineMetrics.responseTime = healthResponse.timings.duration;
  
  if (metricsResponse.status === 200) {
    const metrics = metricsResponse.json();
    baselineMetrics.memoryUsage = metrics.memory?.heapUsed || 0;
    baselineMetrics.cpuUsage = metrics.cpu?.usage || 0;
  }
  
  return {
    baseUrl: BASE_URL,
    startTime: new Date(),
    baseline: baselineMetrics,
    testPhase: 'warmup'
  };
}

export default function(data) {
  const testPhase = determineTestPhase();
  const iteration = __ITER;
  
  // Different strategies based on test phase and duration
  if (testPhase === 'peak_endurance') {
    peakEnduranceScenario(data, iteration);
  } else if (testPhase === 'memory_intensive') {
    memoryIntensiveScenario(data, iteration);
  } else {
    standardEnduranceScenario(data, iteration);
  }
  
  // Monitor system health periodically
  if (iteration % 50 === 0) {
    monitorSystemHealth(data, iteration);
  }
  
  // Adaptive sleep based on test phase
  const sleepTime = getEnduranceSleep(testPhase);
  sleep(sleepTime);
}

function determineTestPhase() {
  const scenario = __ENV.K6_SCENARIO_NAME || 'extended_load';
  const elapsedTime = new Date() - new Date(__ENV.K6_START_TIME || Date.now());
  
  if (scenario === 'memory_pressure') return 'memory_intensive';
  if (elapsedTime > 1800000) return 'peak_endurance'; // After 30 minutes
  return 'standard_endurance';
}

function getEnduranceSleep(phase) {
  switch (phase) {
    case 'peak_endurance': return randomIntBetween(0.5, 1.5);
    case 'memory_intensive': return randomIntBetween(1, 2);
    case 'standard_endurance': return randomIntBetween(1, 3);
    default: return 2;
  }
}

function standardEnduranceScenario(data, iteration) {
  group('Standard Endurance Scenario', () => {
    // Rotate through different workflows to test various system components
    const workflowType = iteration % 4;
    
    switch (workflowType) {
      case 0:
        contentGenerationEndurance(data);
        break;
      case 1:
        serpAnalysisEndurance(data);
        break;
      case 2:
        seoAnalysisEndurance(data);
        break;
      case 3:
        cmsIntegrationEndurance(data);
        break;
    }
  });
}

function peakEnduranceScenario(data, iteration) {
  group('Peak Endurance Scenario', () => {
    // More intensive operations during peak endurance
    const intensiveWorkflows = [
      () => comprehensiveContentGeneration(data),
      () => deepSerpAnalysis(data),
      () => advancedSeoAnalysis(data)
    ];
    
    const workflow = randomItem(intensiveWorkflows);
    workflow();
  });
}

function memoryIntensiveScenario(data, iteration) {
  group('Memory Intensive Scenario', () => {
    // Operations designed to stress memory usage
    largeDatasetProcessing(data);
    multipleSimultaneousAnalyses(data);
    
    // Trigger garbage collection check
    if (iteration % 100 === 0) {
      memoryLeakCheck(data);
    }
  });
}

function contentGenerationEndurance(data) {
  const keyword = randomItem(config.testData.keywords);
  
  const response = http.post(`${data.baseUrl}/api/serp/analyze`,
    JSON.stringify({
      keyword: keyword,
      location: randomItem(config.testData.locations),
      resultsCount: 10
    }),
    { headers, timeout: '15s' }
  );
  
  const stable = check(response, {
    'Content generation endurance': (r) => r.status === 200,
    'Content generation time stable': (r) => r.timings.duration < 3000
  });
  
  longTermStability.add(stable ? 1 : 0);
  
  // Check for performance drift
  const drift = response.timings.duration / data.baseline.responseTime;
  performanceDrift.add(drift);
}

function serpAnalysisEndurance(data) {
  const response = http.post(`${data.baseUrl}/api/serp/analyze`,
    JSON.stringify({
      keyword: randomItem(config.testData.keywords),
      location: randomItem(config.testData.locations),
      includeRelated: true,
      deepAnalysis: false // Lighter analysis for endurance
    }),
    { headers, timeout: '12s' }
  );
  
  const stable = check(response, {
    'SERP endurance analysis': (r) => r.status === 200,
    'SERP endurance time': (r) => r.timings.duration < 2500
  });
  
  systemStaminaRate.add(stable ? 1 : 0);
}

function seoAnalysisEndurance(data) {
  const response = http.post(`${data.baseUrl}/api/seo/analyze`,
    JSON.stringify({
      keyword: randomItem(config.testData.keywords),
      content: generateEnduranceContent(),
      quickAnalysis: true
    }),
    { headers, timeout: '10s' }
  );
  
  const stable = check(response, {
    'SEO endurance analysis': (r) => r.status === 200,
    'SEO endurance time': (r) => r.timings.duration < 2000
  });
  
  longTermStability.add(stable ? 1 : 0);
}

function cmsIntegrationEndurance(data) {
  const platform = randomItem(['wordpress', 'shopify']);
  
  const response = http.post(`${data.baseUrl}/api/cms/${platform}/publish`,
    JSON.stringify({
      title: `Endurance Test ${Date.now()}`,
      content: generateEnduranceContent(),
      status: 'draft'
    }),
    { headers, timeout: '15s' }
  );
  
  const stable = check(response, {
    'CMS endurance integration': (r) => r.status === 200,
    'CMS endurance time': (r) => r.timings.duration < 3000
  });
  
  systemStaminaRate.add(stable ? 1 : 0);
}

function comprehensiveContentGeneration(data) {
  const keyword = randomItem(config.testData.keywords);
  
  // Multi-step comprehensive workflow
  const serpResponse = http.post(`${data.baseUrl}/api/serp/analyze`,
    JSON.stringify({
      keyword: keyword,
      location: randomItem(config.testData.locations),
      resultsCount: 20,
      deepAnalysis: true
    }),
    { headers, timeout: '20s' }
  );
  
  if (serpResponse.status === 200) {
    const intelligenceResponse = http.post(`${data.baseUrl}/api/intelligence/analyze`,
      JSON.stringify({
        keyword: keyword,
        competitorData: serpResponse.json()?.data || {},
        analysisType: 'comprehensive'
      }),
      { headers, timeout: '25s' }
    );
    
    check(intelligenceResponse, {
      'Comprehensive generation endurance': (r) => r.status === 200,
      'Comprehensive generation time': (r) => r.timings.duration < 5000
    });
  }
}

function deepSerpAnalysis(data) {
  const response = http.post(`${data.baseUrl}/api/serp/analyze`,
    JSON.stringify({
      keyword: randomItem(config.testData.keywords),
      location: randomItem(config.testData.locations),
      resultsCount: 50, // Larger dataset
      includeRelated: true,
      deepAnalysis: true,
      competitorAnalysis: true
    }),
    { headers, timeout: '30s' }
  );
  
  check(response, {
    'Deep SERP endurance': (r) => r.status === 200,
    'Deep SERP time stable': (r) => r.timings.duration < 8000
  });
}

function advancedSeoAnalysis(data) {
  const response = http.post(`${data.baseUrl}/api/seo/analyze`,
    JSON.stringify({
      keyword: randomItem(config.testData.keywords),
      content: generateLargeContent(),
      analyzeCompetitors: true,
      deepAnalysis: true,
      includeRecommendations: true
    }),
    { headers, timeout: '25s' }
  );
  
  check(response, {
    'Advanced SEO endurance': (r) => r.status === 200,
    'Advanced SEO time stable': (r) => r.timings.duration < 6000
  });
}

function largeDatasetProcessing(data) {
  // Process multiple keywords simultaneously
  const keywords = config.testData.keywords.slice(0, 5);
  
  const responses = keywords.map(keyword => {
    return http.post(`${data.baseUrl}/api/seo/analyze`,
      JSON.stringify({
        keyword: keyword,
        content: generateLargeContent(),
        batchProcess: true
      }),
      { headers, timeout: '20s' }
    );
  });
  
  const allSuccessful = responses.every(r => r.status === 200);
  systemStaminaRate.add(allSuccessful ? 1 : 0);
}

function multipleSimultaneousAnalyses(data) {
  // Simulate concurrent user operations
  const operations = [
    () => http.get(`${data.baseUrl}/api/health`, { headers }),
    () => http.post(`${data.baseUrl}/api/serp/analyze`, 
      JSON.stringify({
        keyword: randomItem(config.testData.keywords),
        location: 'US'
      }), { headers, timeout: '15s' }),
    () => http.post(`${data.baseUrl}/api/seo/analyze`,
      JSON.stringify({
        keyword: 'test',
        content: 'test content'
      }), { headers, timeout: '10s' })
  ];
  
  operations.forEach(op => op());
}

function monitorSystemHealth(data, iteration) {
  group('System Health Monitoring', () => {
    const healthResponse = http.get(`${data.baseUrl}/api/health`, { headers });
    const metricsResponse = http.get(`${data.baseUrl}/api/metrics`, { headers });
    
    // Check basic health
    const healthy = check(healthResponse, {
      'System remains healthy': (r) => r.status === 200,
      'Health check responsive': (r) => r.timings.duration < 1000
    });
    
    if (!healthy) {
      resourceExhaustionCount.add(1);
    }
    
    // Monitor memory usage if available
    if (metricsResponse.status === 200) {
      const metrics = metricsResponse.json();
      
      if (metrics.memory && data.baseline.memoryUsage > 0) {
        const memoryRatio = metrics.memory.heapUsed / data.baseline.memoryUsage;
        memoryLeakDetection.add(memoryRatio);
        
        if (memoryRatio > 2.0) {
          console.warn(`Potential memory leak detected at iteration ${iteration}: ${memoryRatio}x baseline`);
        }
      }
    }
  });
}

function memoryLeakCheck(data) {
  // Force a more intensive memory operation to check for leaks
  const heavyResponse = http.post(`${data.baseUrl}/api/seo/analyze`,
    JSON.stringify({
      keyword: randomItem(config.testData.keywords),
      content: generateVeryLargeContent(),
      memoryIntensive: true
    }),
    { headers, timeout: '30s' }
  );
  
  check(heavyResponse, {
    'Memory intensive operation completes': (r) => r.status === 200,
    'Memory intensive operation time': (r) => r.timings.duration < 10000
  });
}

function generateEnduranceContent() {
  const baseContent = `Endurance test content for sustained load testing. `;
  return baseContent.repeat(randomIntBetween(5, 15));
}

function generateLargeContent() {
  const baseContent = `Large content block for endurance testing with comprehensive analysis. This content is designed to stress test the system's ability to handle substantial text processing over extended periods. `;
  return baseContent.repeat(randomIntBetween(20, 50));
}

function generateVeryLargeContent() {
  const baseContent = `Very large content block specifically designed for memory pressure testing. This extensive text is used to evaluate system behavior under memory-intensive operations during endurance testing scenarios. `;
  return baseContent.repeat(randomIntBetween(100, 200));
}

export function teardown(data) {
  console.log('Endurance test completed, evaluating system stability...');
  
  const totalDuration = new Date() - data.startTime;
  const hours = Math.floor(totalDuration / 3600000);
  const minutes = Math.floor((totalDuration % 3600000) / 60000);
  
  console.log(`Total endurance test duration: ${hours}h ${minutes}m`);
  
  // Final system health check
  const finalHealthResponse = http.get(`${data.baseUrl}/api/health`, { headers });
  const finalMetricsResponse = http.get(`${data.baseUrl}/api/metrics`, { headers });
  
  if (finalHealthResponse.status === 200) {
    console.log('✅ System remained healthy throughout endurance test');
    
    // Check for performance degradation
    const finalResponseTime = finalHealthResponse.timings.duration;
    const performanceRatio = finalResponseTime / data.baseline.responseTime;
    
    if (performanceRatio > 1.5) {
      console.warn(`⚠️ Performance degraded by ${((performanceRatio - 1) * 100).toFixed(1)}% during endurance test`);
    } else {
      console.log(`✅ Performance remained stable (${((performanceRatio - 1) * 100).toFixed(1)}% change)`);
    }
    
    // Check for memory leaks
    if (finalMetricsResponse.status === 200) {
      const finalMetrics = finalMetricsResponse.json();
      if (finalMetrics.memory && data.baseline.memoryUsage > 0) {
        const memoryRatio = finalMetrics.memory.heapUsed / data.baseline.memoryUsage;
        
        if (memoryRatio > 1.8) {
          console.warn(`⚠️ Potential memory leak detected: ${((memoryRatio - 1) * 100).toFixed(1)}% increase`);
        } else {
          console.log(`✅ Memory usage stable: ${((memoryRatio - 1) * 100).toFixed(1)}% change`);
        }
      }
    }
  } else {
    console.error('❌ System health degraded during endurance test');
  }
}