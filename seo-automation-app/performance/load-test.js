/**
 * K6 Load Testing Script for SEO Automation App
 * Tests all API endpoints under 10x expected user load
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter, Gauge, Rate, Trend } from 'k6/metrics';
import { randomItem, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';
import { config } from './k6-config.js';

// Custom metrics for business-specific measurements
const serpAnalysisDuration = new Trend('serp_analysis_duration');
const contentGenerationDuration = new Trend('content_generation_duration');
const cmsPublishDuration = new Trend('cms_publish_duration');
const databaseQueryDuration = new Trend('database_query_duration');
const memoryUsage = new Gauge('memory_usage');
const errorRate = new Rate('error_rate');
const apiSuccessRate = new Rate('api_success_rate');

// Load test configuration
export const options = {
  scenarios: config.scenarios,
  thresholds: config.thresholds,
  ext: {
    loadimpact: {
      distribution: {
        'amazon:us:ashburn': { loadZone: 'amazon:us:ashburn', percent: 50 },
        'amazon:ie:dublin': { loadZone: 'amazon:ie:dublin', percent: 25 },
        'amazon:sg:singapore': { loadZone: 'amazon:sg:singapore', percent: 25 }
      }
    }
  }
};

// Environment setup
const BASE_URL = __ENV.BASE_URL || config.environments.staging.baseUrl;
const TIMEOUT = __ENV.TIMEOUT || '30s';

// Authentication headers (if needed)
const headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'User-Agent': 'K6-Performance-Test/1.0'
};

// Test data
const testData = config.testData;

/**
 * Setup function - runs once before all tests
 */
export function setup() {
  console.log(`Starting performance tests against: ${BASE_URL}`);
  
  // Health check before starting tests
  const healthResponse = http.get(`${BASE_URL}/api/health`, { headers });
  
  if (healthResponse.status !== 200) {
    throw new Error(`Health check failed: ${healthResponse.status}`);
  }
  
  console.log('Health check passed, starting load tests...');
  
  return {
    baseUrl: BASE_URL,
    startTime: new Date()
  };
}

/**
 * Main test function - runs for each virtual user
 */
export default function(data) {
  const testScenario = Math.random();
  
  // Distribute load across different user workflows
  if (testScenario < 0.3) {
    contentGenerationWorkflow(data);
  } else if (testScenario < 0.6) {
    serpAnalysisWorkflow(data);
  } else if (testScenario < 0.8) {
    seoAnalysisWorkflow(data);
  } else {
    cmsIntegrationWorkflow(data);
  }
  
  // Random sleep between requests to simulate real user behavior
  sleep(randomIntBetween(1, 3));
}

/**
 * Content Generation Workflow
 */
function contentGenerationWorkflow(data) {
  group('Content Generation Workflow', () => {
    const keyword = randomItem(testData.keywords);
    const location = randomItem(testData.locations);
    const contentType = randomItem(testData.contentTypes);
    
    // Step 1: SERP Analysis
    const serpStartTime = new Date();
    const serpResponse = http.post(`${data.baseUrl}/api/serp/analyze`, 
      JSON.stringify({
        keyword: keyword,
        location: location,
        resultsCount: 10
      }), 
      { headers, timeout: TIMEOUT }
    );
    
    const serpDuration = new Date() - serpStartTime;
    serpAnalysisDuration.add(serpDuration);
    
    const serpSuccess = check(serpResponse, {
      'SERP analysis status is 200': (r) => r.status === 200,
      'SERP analysis response time < 2s': (r) => r.timings.duration < 2000,
      'SERP analysis has data': (r) => r.json() && r.json().data
    });
    
    apiSuccessRate.add(serpSuccess);
    
    if (!serpSuccess) {
      errorRate.add(1);
      return;
    }
    
    // Step 2: Content Scraping
    const scrapingResponse = http.post(`${data.baseUrl}/api/scraping/extract`,
      JSON.stringify({
        urls: serpResponse.json().data.topResults.slice(0, 3).map(r => r.url),
        extractContent: true,
        extractMetrics: true
      }),
      { headers, timeout: TIMEOUT }
    );
    
    check(scrapingResponse, {
      'Content scraping status is 200': (r) => r.status === 200,
      'Content scraping response time < 5s': (r) => r.timings.duration < 5000,
      'Content scraping has content': (r) => r.json() && r.json().data
    });
    
    // Step 3: SEO Analysis
    const seoResponse = http.post(`${data.baseUrl}/api/seo/analyze`,
      JSON.stringify({
        keyword: keyword,
        content: "Sample content for analysis",
        targetWordCount: 1000
      }),
      { headers, timeout: TIMEOUT }
    );
    
    check(seoResponse, {
      'SEO analysis status is 200': (r) => r.status === 200,
      'SEO analysis response time < 1s': (r) => r.timings.duration < 1000,
      'SEO analysis has metrics': (r) => r.json() && r.json().metrics
    });
    
    // Step 4: Intelligence Analysis
    const intelligenceStartTime = new Date();
    const intelligenceResponse = http.post(`${data.baseUrl}/api/intelligence/analyze`,
      JSON.stringify({
        keyword: keyword,
        competitorData: scrapingResponse.json()?.data || {},
        analysisType: 'comprehensive'
      }),
      { headers, timeout: TIMEOUT }
    );
    
    const intelligenceDuration = new Date() - intelligenceStartTime;
    contentGenerationDuration.add(intelligenceDuration);
    
    check(intelligenceResponse, {
      'Intelligence analysis status is 200': (r) => r.status === 200,
      'Intelligence analysis response time < 3s': (r) => r.timings.duration < 3000,
      'Intelligence analysis has insights': (r) => r.json() && r.json().insights
    });
  });
}

/**
 * SERP Analysis Workflow
 */
function serpAnalysisWorkflow(data) {
  group('SERP Analysis Workflow', () => {
    const keyword = randomItem(testData.keywords);
    const location = randomItem(testData.locations);
    
    // Single SERP analysis
    const response = http.post(`${data.baseUrl}/api/serp/analyze`,
      JSON.stringify({
        keyword: keyword,
        location: location,
        resultsCount: 10,
        includeRelated: true
      }),
      { headers, timeout: TIMEOUT }
    );
    
    const success = check(response, {
      'SERP analysis status is 200': (r) => r.status === 200,
      'SERP analysis response time < 2s': (r) => r.timings.duration < 2000,
      'SERP analysis has results': (r) => r.json() && r.json().data && r.json().data.topResults
    });
    
    apiSuccessRate.add(success);
    serpAnalysisDuration.add(response.timings.duration);
    
    if (success) {
      // Follow-up: Get competitors
      const competitorsResponse = http.get(`${data.baseUrl}/api/serp/competitors?keyword=${encodeURIComponent(keyword)}`,
        { headers, timeout: TIMEOUT }
      );
      
      check(competitorsResponse, {
        'Competitors fetch status is 200': (r) => r.status === 200,
        'Competitors response time < 1s': (r) => r.timings.duration < 1000
      });
    }
  });
}

/**
 * SEO Analysis Workflow
 */
function seoAnalysisWorkflow(data) {
  group('SEO Analysis Workflow', () => {
    const keyword = randomItem(testData.keywords);
    
    // SEO metrics analysis
    const metricsResponse = http.post(`${data.baseUrl}/api/seo/analyze`,
      JSON.stringify({
        keyword: keyword,
        content: generateTestContent(keyword),
        url: `https://example.com/${keyword.replace(/\s+/g, '-').toLowerCase()}`,
        analyzeCompetitors: true
      }),
      { headers, timeout: TIMEOUT }
    );
    
    const success = check(metricsResponse, {
      'SEO analysis status is 200': (r) => r.status === 200,
      'SEO analysis response time < 1s': (r) => r.timings.duration < 1000,
      'SEO analysis has score': (r) => r.json() && typeof r.json().score === 'number'
    });
    
    apiSuccessRate.add(success);
    
    if (success) {
      // Follow-up: SEO comparison
      const compareResponse = http.post(`${data.baseUrl}/api/seo/compare`,
        JSON.stringify({
          primary: metricsResponse.json(),
          competitors: ['competitor1.com', 'competitor2.com']
        }),
        { headers, timeout: TIMEOUT }
      );
      
      check(compareResponse, {
        'SEO comparison status is 200': (r) => r.status === 200,
        'SEO comparison response time < 2s': (r) => r.timings.duration < 2000
      });
    }
  });
}

/**
 * CMS Integration Workflow
 */
function cmsIntegrationWorkflow(data) {
  group('CMS Integration Workflow', () => {
    const contentType = randomItem(testData.contentTypes);
    const platform = randomItem(['wordpress', 'shopify', 'hubspot']);
    
    // Simulate content publishing
    const publishStartTime = new Date();
    const publishResponse = http.post(`${data.baseUrl}/api/cms/${platform}/publish`,
      JSON.stringify({
        title: `Test Content - ${new Date().toISOString()}`,
        content: generateTestContent(randomItem(testData.keywords)),
        contentType: contentType,
        status: 'draft'
      }),
      { headers, timeout: TIMEOUT }
    );
    
    const publishDuration = new Date() - publishStartTime;
    cmsPublishDuration.add(publishDuration);
    
    const success = check(publishResponse, {
      'CMS publish status is 200': (r) => r.status === 200,
      'CMS publish response time < 3s': (r) => r.timings.duration < 3000,
      'CMS publish has ID': (r) => r.json() && r.json().id
    });
    
    apiSuccessRate.add(success);
    
    if (success) {
      const contentId = publishResponse.json().id;
      
      // Follow-up: Check sync status
      const statusResponse = http.get(`${data.baseUrl}/api/cms/${platform}/sync-status?id=${contentId}`,
        { headers, timeout: TIMEOUT }
      );
      
      check(statusResponse, {
        'CMS sync status is 200': (r) => r.status === 200,
        'CMS sync response time < 1s': (r) => r.timings.duration < 1000
      });
    }
  });
}

/**
 * Health and Monitoring Checks
 */
function healthMonitoringChecks(data) {
  group('Health and Monitoring', () => {
    // Health check
    const healthResponse = http.get(`${data.baseUrl}/api/health`, { headers });
    
    check(healthResponse, {
      'Health check status is 200': (r) => r.status === 200,
      'Health check response time < 500ms': (r) => r.timings.duration < 500,
      'Health check reports healthy': (r) => r.json() && r.json().status === 'healthy'
    });
    
    // Metrics check
    const metricsResponse = http.get(`${data.baseUrl}/api/metrics`, { headers });
    
    check(metricsResponse, {
      'Metrics status is 200': (r) => r.status === 200,
      'Metrics response time < 1s': (r) => r.timings.duration < 1000,
      'Metrics has data': (r) => r.json() && Object.keys(r.json()).length > 0
    });
    
    // Extract memory usage from metrics if available
    if (metricsResponse.status === 200) {
      const metrics = metricsResponse.json();
      if (metrics.memory) {
        memoryUsage.add(metrics.memory.heapUsed || 0);
      }
    }
  });
}

/**
 * Generate test content for realistic load testing
 */
function generateTestContent(keyword) {
  const contentTemplates = [
    `This is a comprehensive guide about ${keyword}. Understanding ${keyword} is crucial for success.`,
    `${keyword} has become increasingly important in today's digital landscape. Here's what you need to know.`,
    `Learn everything about ${keyword} with this detailed analysis and practical examples.`
  ];
  
  return randomItem(contentTemplates);
}

/**
 * Teardown function - runs once after all tests
 */
export function teardown(data) {
  console.log(`Performance tests completed. Duration: ${new Date() - data.startTime}ms`);
  
  // Final health check
  const finalHealthResponse = http.get(`${data.baseUrl}/api/health`, { headers });
  
  if (finalHealthResponse.status !== 200) {
    console.warn('Final health check failed - system may be under stress');
  } else {
    console.log('Final health check passed - system recovered successfully');
  }
}

// Export for external use
export {
  contentGenerationWorkflow,
  serpAnalysisWorkflow,
  seoAnalysisWorkflow,
  cmsIntegrationWorkflow,
  healthMonitoringChecks
};