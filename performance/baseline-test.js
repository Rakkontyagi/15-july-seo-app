/**
 * K6 Baseline Testing Script
 * Establishes performance baselines and validates optimal system behavior
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter, Gauge, Rate, Trend } from 'k6/metrics';
import { randomItem, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';
import { config } from './k6-config.js';

// Custom metrics for baseline measurements
const baselineResponseTime = new Trend('baseline_response_time');
const baselineMemoryUsage = new Gauge('baseline_memory_usage');
const baselineCpuUsage = new Gauge('baseline_cpu_usage');
const baselineSuccessRate = new Rate('baseline_success_rate');
const baselineThroughput = new Rate('baseline_throughput');
const baselineStability = new Rate('baseline_stability');

// Baseline test configuration
export const options = {
  scenarios: {
    single_user: {
      executor: 'constant-vus',
      vus: 1,
      duration: '2m',
      tags: { test_type: 'single_user_baseline' }
    },
    
    minimal_load: {
      executor: 'constant-vus',
      vus: 5,
      duration: '3m',
      tags: { test_type: 'minimal_load_baseline' }
    },
    
    optimal_load: {
      executor: 'constant-vus',
      vus: 10,
      duration: '5m',
      tags: { test_type: 'optimal_load_baseline' }
    },
    
    functionality_validation: {
      executor: 'per-vu-iterations',
      vus: 1,
      iterations: 1,
      maxDuration: '10m',
      tags: { test_type: 'functionality_validation' }
    }
  },
  
  thresholds: {
    // Strict baseline thresholds for optimal conditions
    http_req_duration: ['p(95)<500'],  // 95% under 500ms
    http_req_failed: ['rate<0.001'],   // Error rate under 0.1%
    baseline_success_rate: ['rate>0.999'], // 99.9% success rate
    baseline_stability: ['rate>0.995'],    // 99.5% stability
    
    // Performance expectations by test type
    'http_req_duration{test_type:single_user_baseline}': ['p(99)<300'],
    'http_req_duration{test_type:minimal_load_baseline}': ['p(95)<400'],
    'http_req_duration{test_type:optimal_load_baseline}': ['p(95)<500'],
    'http_req_duration{test_type:functionality_validation}': ['max<1000'],
    
    // Resource usage baselines
    baseline_memory_usage: ['max<512'], // Max 512MB memory
    baseline_cpu_usage: ['max<0.3']     // Max 30% CPU
  }
};

const BASE_URL = __ENV.BASE_URL || config.environments.staging.baseUrl;
const headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'User-Agent': 'K6-Baseline-Test/1.0'
};

let performanceBaselines = {};

export function setup() {
  console.log(`Establishing performance baselines against: ${BASE_URL}`);
  
  // Pre-warm the system
  console.log('Pre-warming system...');
  for (let i = 0; i < 3; i++) {
    http.get(`${BASE_URL}/api/health`, { headers });
    sleep(1);
  }
  
  console.log('Starting baseline measurements...');
  
  return {
    baseUrl: BASE_URL,
    startTime: new Date(),
    measurements: []
  };
}

export default function(data) {
  const scenario = __ENV.K6_SCENARIO_NAME || 'optimal_load';
  
  if (scenario === 'functionality_validation') {
    functionalityValidationSuite(data);
  } else {
    performanceBaselineSuite(data, scenario);
  }
  
  // Consistent spacing between requests for baseline measurement
  sleep(randomIntBetween(1, 2));
}

function performanceBaselineSuite(data, scenario) {
  group('Performance Baseline Suite', () => {
    // Rotate through core operations to establish comprehensive baselines
    const operations = [
      () => healthCheckBaseline(data),
      () => serpAnalysisBaseline(data),
      () => seoAnalysisBaseline(data),
      () => cmsIntegrationBaseline(data),
      () => systemMetricsBaseline(data)
    ];
    
    const operation = operations[__ITER % operations.length];
    operation();
  });
}

function functionalityValidationSuite(data) {
  group('Comprehensive Functionality Validation', () => {
    console.log('Validating all system functionality...');
    
    // Test all major endpoints and workflows
    validateHealthEndpoints(data);
    validateSerpEndpoints(data);
    validateSeoEndpoints(data);
    validateScrapingEndpoints(data);
    validateIntelligenceEndpoints(data);
    validateCmsEndpoints(data);
    validateSystemEndpoints(data);
    
    console.log('Functionality validation completed');
  });
}

function healthCheckBaseline(data) {
  const startTime = new Date();
  const response = http.get(`${data.baseUrl}/api/health`, { headers });
  const duration = new Date() - startTime;
  
  const success = check(response, {
    'Health check baseline success': (r) => r.status === 200,
    'Health check baseline time': (r) => r.timings.duration < 200,
    'Health check baseline content': (r) => r.json() && r.json().status === 'healthy'
  });
  
  baselineResponseTime.add(duration);
  baselineSuccessRate.add(success ? 1 : 0);
  baselineStability.add(success ? 1 : 0);
  
  recordBaseline('health_check', duration, success);
}

function serpAnalysisBaseline(data) {
  const keyword = 'SEO optimization'; // Consistent keyword for baseline
  const startTime = new Date();
  
  const response = http.post(`${data.baseUrl}/api/serp/analyze`,
    JSON.stringify({
      keyword: keyword,
      location: 'United States',
      resultsCount: 10
    }),
    { headers, timeout: '10s' }
  );
  
  const duration = new Date() - startTime;
  
  const success = check(response, {
    'SERP baseline success': (r) => r.status === 200,
    'SERP baseline time': (r) => r.timings.duration < 1000,
    'SERP baseline data': (r) => r.json() && r.json().data && r.json().data.topResults
  });
  
  baselineResponseTime.add(duration);
  baselineSuccessRate.add(success ? 1 : 0);
  baselineThroughput.add(1);
  
  recordBaseline('serp_analysis', duration, success);
}

function seoAnalysisBaseline(data) {
  const startTime = new Date();
  
  const response = http.post(`${data.baseUrl}/api/seo/analyze`,
    JSON.stringify({
      keyword: 'content marketing',
      content: generateBaselineContent(),
      quickAnalysis: true
    }),
    { headers, timeout: '8s' }
  );
  
  const duration = new Date() - startTime;
  
  const success = check(response, {
    'SEO baseline success': (r) => r.status === 200,
    'SEO baseline time': (r) => r.timings.duration < 800,
    'SEO baseline metrics': (r) => r.json() && typeof r.json().score === 'number'
  });
  
  baselineResponseTime.add(duration);
  baselineSuccessRate.add(success ? 1 : 0);
  
  recordBaseline('seo_analysis', duration, success);
}

function cmsIntegrationBaseline(data) {
  const startTime = new Date();
  
  const response = http.post(`${data.baseUrl}/api/cms/wordpress/publish`,
    JSON.stringify({
      title: `Baseline Test ${Date.now()}`,
      content: generateBaselineContent(),
      status: 'draft'
    }),
    { headers, timeout: '10s' }
  );
  
  const duration = new Date() - startTime;
  
  const success = check(response, {
    'CMS baseline success': (r) => r.status === 200,
    'CMS baseline time': (r) => r.timings.duration < 1200,
    'CMS baseline response': (r) => r.json() && r.json().id
  });
  
  baselineResponseTime.add(duration);
  baselineSuccessRate.add(success ? 1 : 0);
  
  recordBaseline('cms_integration', duration, success);
}

function systemMetricsBaseline(data) {
  const response = http.get(`${data.baseUrl}/api/metrics`, { headers });
  
  const success = check(response, {
    'Metrics baseline success': (r) => r.status === 200,
    'Metrics baseline time': (r) => r.timings.duration < 500,
    'Metrics baseline data': (r) => r.json() && Object.keys(r.json()).length > 0
  });
  
  if (success && response.json()) {
    const metrics = response.json();
    
    if (metrics.memory) {
      baselineMemoryUsage.add(metrics.memory.heapUsed / (1024 * 1024)); // Convert to MB
    }
    
    if (metrics.cpu) {
      baselineCpuUsage.add(metrics.cpu.usage || 0);
    }
  }
  
  baselineStability.add(success ? 1 : 0);
}

// Comprehensive functionality validation functions
function validateHealthEndpoints(data) {
  group('Health Endpoints Validation', () => {
    const healthResponse = http.get(`${data.baseUrl}/api/health`, { headers });
    const readinessResponse = http.get(`${data.baseUrl}/api/ready`, { headers });
    
    check(healthResponse, {
      'Health endpoint functional': (r) => r.status === 200,
      'Health endpoint returns status': (r) => r.json() && r.json().status
    });
    
    // Readiness endpoint might not exist, so check conditionally
    if (readinessResponse.status !== 404) {
      check(readinessResponse, {
        'Readiness endpoint functional': (r) => r.status === 200
      });
    }
  });
}

function validateSerpEndpoints(data) {
  group('SERP Endpoints Validation', () => {
    const analysisResponse = http.post(`${data.baseUrl}/api/serp/analyze`,
      JSON.stringify({
        keyword: 'test keyword',
        location: 'United States'
      }),
      { headers, timeout: '15s' }
    );
    
    check(analysisResponse, {
      'SERP analysis endpoint functional': (r) => r.status === 200,
      'SERP analysis returns data': (r) => r.json() && r.json().data
    });
    
    // Test competitors endpoint if available
    const competitorsResponse = http.get(`${data.baseUrl}/api/serp/competitors?keyword=test`, { headers });
    if (competitorsResponse.status !== 404) {
      check(competitorsResponse, {
        'SERP competitors endpoint functional': (r) => r.status === 200
      });
    }
  });
}

function validateSeoEndpoints(data) {
  group('SEO Endpoints Validation', () => {
    const analysisResponse = http.post(`${data.baseUrl}/api/seo/analyze`,
      JSON.stringify({
        keyword: 'test keyword',
        content: 'Test content for SEO analysis'
      }),
      { headers, timeout: '12s' }
    );
    
    check(analysisResponse, {
      'SEO analysis endpoint functional': (r) => r.status === 200,
      'SEO analysis returns score': (r) => r.json() && typeof r.json().score === 'number'
    });
    
    // Test comparison endpoint if available
    const compareResponse = http.post(`${data.baseUrl}/api/seo/compare`,
      JSON.stringify({
        primary: { content: 'test content' },
        competitors: ['example.com']
      }),
      { headers, timeout: '10s' }
    );
    
    if (compareResponse.status !== 404) {
      check(compareResponse, {
        'SEO comparison endpoint functional': (r) => r.status === 200
      });
    }
  });
}

function validateScrapingEndpoints(data) {
  group('Scraping Endpoints Validation', () => {
    const extractResponse = http.post(`${data.baseUrl}/api/scraping/extract`,
      JSON.stringify({
        urls: ['https://example.com'],
        extractContent: true
      }),
      { headers, timeout: '20s' }
    );
    
    check(extractResponse, {
      'Content extraction endpoint functional': (r) => r.status === 200 || r.status === 422, // 422 for invalid URL is acceptable
      'Content extraction responds': (r) => r.body.length > 0
    });
  });
}

function validateIntelligenceEndpoints(data) {
  group('Intelligence Endpoints Validation', () => {
    const intelligenceResponse = http.post(`${data.baseUrl}/api/intelligence/analyze`,
      JSON.stringify({
        keyword: 'test keyword',
        competitorData: {},
        analysisType: 'basic'
      }),
      { headers, timeout: '15s' }
    );
    
    check(intelligenceResponse, {
      'Intelligence analysis endpoint functional': (r) => r.status === 200,
      'Intelligence analysis returns insights': (r) => r.json() && r.json().insights
    });
  });
}

function validateCmsEndpoints(data) {
  group('CMS Endpoints Validation', () => {
    const platforms = ['wordpress', 'shopify'];
    
    platforms.forEach(platform => {
      const publishResponse = http.post(`${data.baseUrl}/api/cms/${platform}/publish`,
        JSON.stringify({
          title: 'Baseline Test',
          content: 'Test content',
          status: 'draft'
        }),
        { headers, timeout: '15s' }
      );
      
      check(publishResponse, {
        [`CMS ${platform} publish functional`]: (r) => r.status === 200,
        [`CMS ${platform} returns ID`]: (r) => r.json() && r.json().id
      });
    });
  });
}

function validateSystemEndpoints(data) {
  group('System Endpoints Validation', () => {
    const metricsResponse = http.get(`${data.baseUrl}/api/metrics`, { headers });
    
    check(metricsResponse, {
      'System metrics endpoint functional': (r) => r.status === 200,
      'System metrics returns data': (r) => r.json() && Object.keys(r.json()).length > 0
    });
  });
}

function generateBaselineContent() {
  return `This is baseline test content used for consistent performance measurement. 
  The content includes standard SEO elements and maintains consistent length for reliable testing. 
  This ensures that performance variations are due to system changes rather than content differences.`;
}

function recordBaseline(operation, duration, success) {
  if (!performanceBaselines[operation]) {
    performanceBaselines[operation] = {
      durations: [],
      successCount: 0,
      totalCount: 0
    };
  }
  
  performanceBaselines[operation].durations.push(duration);
  performanceBaselines[operation].totalCount++;
  if (success) {
    performanceBaselines[operation].successCount++;
  }
}

export function teardown(data) {
  console.log('Baseline testing completed. Generating baseline report...');
  
  const totalDuration = new Date() - data.startTime;
  console.log(`Total baseline test duration: ${totalDuration}ms`);
  
  // Calculate and report baselines
  Object.keys(performanceBaselines).forEach(operation => {
    const baseline = performanceBaselines[operation];
    const durations = baseline.durations;
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const p95Duration = percentile(durations, 95);
    const successRate = baseline.successCount / baseline.totalCount;
    
    console.log(`📊 ${operation} baseline:`);
    console.log(`   Average: ${avgDuration.toFixed(0)}ms`);
    console.log(`   P95: ${p95Duration.toFixed(0)}ms`);
    console.log(`   Success Rate: ${(successRate * 100).toFixed(2)}%`);
    console.log('');
  });
  
  // Final system state check
  const finalHealthResponse = http.get(`${data.baseUrl}/api/health`, { headers });
  const finalMetricsResponse = http.get(`${data.baseUrl}/api/metrics`, { headers });
  
  if (finalHealthResponse.status === 200) {
    console.log('✅ System baseline established successfully');
    
    if (finalMetricsResponse.status === 200) {
      const metrics = finalMetricsResponse.json();
      if (metrics.memory) {
        console.log(`📈 Baseline Memory Usage: ${(metrics.memory.heapUsed / (1024 * 1024)).toFixed(1)}MB`);
      }
      if (metrics.cpu) {
        console.log(`📈 Baseline CPU Usage: ${(metrics.cpu.usage * 100).toFixed(1)}%`);
      }
    }
  } else {
    console.error('❌ System baseline could not be established - health check failed');
  }
  
  console.log('\n🎯 Baseline measurements complete. Use these values for performance comparison in load tests.');
}

function percentile(values, p) {
  const sorted = values.slice().sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[index] || 0;
}