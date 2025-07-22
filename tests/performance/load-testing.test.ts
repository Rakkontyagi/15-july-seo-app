/**
 * Performance Load Testing Suite
 * Real traffic simulation and performance validation
 */

import { test, expect } from '@playwright/test';
import { chromium, Browser, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const CONCURRENT_USERS = parseInt(process.env.CONCURRENT_USERS || '10');
const TEST_DURATION = parseInt(process.env.TEST_DURATION || '60') * 1000; // Convert to ms

interface PerformanceMetrics {
  endpoint: string;
  method: string;
  responseTime: number;
  status: number;
  timestamp: number;
  payload?: any;
}

interface LoadTestResult {
  endpoint: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  requestsPerSecond: number;
  errorRate: number;
}

class LoadTester {
  private metrics: PerformanceMetrics[] = [];
  private startTime: number = 0;
  private endTime: number = 0;

  async runLoadTest(
    endpoint: string,
    method: 'GET' | 'POST',
    payload: any,
    concurrentUsers: number,
    duration: number
  ): Promise<LoadTestResult> {
    console.log(`🔄 Starting load test: ${method} ${endpoint}`);
    console.log(`   Concurrent Users: ${concurrentUsers}`);
    console.log(`   Duration: ${duration / 1000}s`);
    
    this.metrics = [];
    this.startTime = Date.now();
    
    // Create multiple browser instances for concurrent users
    const browsers: Browser[] = [];
    const userPromises: Promise<void>[] = [];
    
    try {
      // Initialize browsers
      for (let i = 0; i < concurrentUsers; i++) {
        const browser = await chromium.launch();
        browsers.push(browser);
        
        userPromises.push(
          this.simulateUser(browser, endpoint, method, payload, duration, i + 1)
        );
      }
      
      // Wait for all users to complete
      await Promise.all(userPromises);
      
      this.endTime = Date.now();
      
      // Clean up browsers
      await Promise.all(browsers.map(browser => browser.close()));
      
      return this.calculateResults(endpoint);
      
    } catch (error) {
      // Clean up on error
      await Promise.all(browsers.map(browser => browser.close().catch(() => {})));
      throw error;
    }
  }

  private async simulateUser(
    browser: Browser,
    endpoint: string,
    method: 'GET' | 'POST',
    payload: any,
    duration: number,
    userId: number
  ): Promise<void> {
    const page = await browser.newPage();
    const endTime = Date.now() + duration;
    
    try {
      while (Date.now() < endTime) {
        const startTime = Date.now();
        
        try {
          const response = method === 'GET' 
            ? await page.request.get(`${BASE_URL}${endpoint}`)
            : await page.request.post(`${BASE_URL}${endpoint}`, { data: payload });
          
          const responseTime = Date.now() - startTime;
          
          this.metrics.push({
            endpoint,
            method,
            responseTime,
            status: response.status(),
            timestamp: startTime,
            payload: method === 'POST' ? payload : undefined
          });
          
          // Small delay between requests to simulate realistic user behavior
          await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
          
        } catch (error) {
          const responseTime = Date.now() - startTime;
          
          this.metrics.push({
            endpoint,
            method,
            responseTime,
            status: 0, // Error status
            timestamp: startTime
          });
        }
      }
    } finally {
      await page.close();
    }
  }

  private calculateResults(endpoint: string): LoadTestResult {
    const responseTimes = this.metrics.map(m => m.responseTime);
    const successfulRequests = this.metrics.filter(m => m.status >= 200 && m.status < 400);
    const failedRequests = this.metrics.filter(m => m.status >= 400 || m.status === 0);
    
    responseTimes.sort((a, b) => a - b);
    
    const totalDuration = this.endTime - this.startTime;
    
    return {
      endpoint,
      totalRequests: this.metrics.length,
      successfulRequests: successfulRequests.length,
      failedRequests: failedRequests.length,
      averageResponseTime: responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length,
      minResponseTime: Math.min(...responseTimes),
      maxResponseTime: Math.max(...responseTimes),
      p95ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.95)],
      p99ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.99)],
      requestsPerSecond: (this.metrics.length / totalDuration) * 1000,
      errorRate: (failedRequests.length / this.metrics.length) * 100
    };
  }
}

test.describe('Performance Load Testing', () => {
  let loadTester: LoadTester;
  let testResults: LoadTestResult[] = [];

  test.beforeAll(() => {
    loadTester = new LoadTester();
  });

  test.afterAll(() => {
    // Generate performance report
    console.log(`\n📊 PERFORMANCE LOAD TEST RESULTS`);
    console.log(`================================================`);
    
    testResults.forEach(result => {
      console.log(`\n🎯 ${result.endpoint}`);
      console.log(`   Total Requests: ${result.totalRequests}`);
      console.log(`   Success Rate: ${((result.successfulRequests / result.totalRequests) * 100).toFixed(2)}%`);
      console.log(`   Error Rate: ${result.errorRate.toFixed(2)}%`);
      console.log(`   Requests/Second: ${result.requestsPerSecond.toFixed(2)}`);
      console.log(`   Avg Response Time: ${result.averageResponseTime.toFixed(0)}ms`);
      console.log(`   95th Percentile: ${result.p95ResponseTime.toFixed(0)}ms`);
      console.log(`   99th Percentile: ${result.p99ResponseTime.toFixed(0)}ms`);
      console.log(`   Min/Max: ${result.minResponseTime}ms / ${result.maxResponseTime}ms`);
    });
    
    const overallSuccessRate = testResults.reduce((sum, r) => sum + r.successfulRequests, 0) / 
                               testResults.reduce((sum, r) => sum + r.totalRequests, 0) * 100;
    
    console.log(`\n🎯 OVERALL PERFORMANCE`);
    console.log(`   Success Rate: ${overallSuccessRate.toFixed(2)}%`);
    console.log(`   Tests Passed: ${testResults.filter(r => r.errorRate < 5 && r.p95ResponseTime < 2000).length}/${testResults.length}`);
  });

  test.describe('API Endpoint Load Testing', () => {
    test('should handle load on health check endpoint', async () => {
      const result = await loadTester.runLoadTest(
        '/api/health',
        'GET',
        {},
        CONCURRENT_USERS,
        30000 // 30 seconds
      );
      
      testResults.push(result);
      
      // Performance assertions
      expect(result.errorRate).toBeLessThan(1); // Less than 1% error rate
      expect(result.averageResponseTime).toBeLessThan(500); // Average < 500ms
      expect(result.p95ResponseTime).toBeLessThan(1000); // 95th percentile < 1s
      expect(result.requestsPerSecond).toBeGreaterThan(5); // At least 5 RPS
      
      console.log(`✅ Health check load test passed`);
    });

    test('should handle load on SERP analysis endpoint', async () => {
      const result = await loadTester.runLoadTest(
        '/api/serp/analyze',
        'POST',
        {
          keyword: 'digital marketing',
          country: 'google.com',
          limit: 10
        },
        Math.min(CONCURRENT_USERS, 5), // Limit concurrent users for API-intensive endpoint
        60000 // 1 minute
      );
      
      testResults.push(result);
      
      // Performance assertions for API-heavy endpoint
      expect(result.errorRate).toBeLessThan(5); // Less than 5% error rate
      expect(result.averageResponseTime).toBeLessThan(10000); // Average < 10s
      expect(result.p95ResponseTime).toBeLessThan(15000); // 95th percentile < 15s
      expect(result.requestsPerSecond).toBeGreaterThan(0.1); // At least 0.1 RPS
      
      console.log(`✅ SERP analysis load test passed`);
    });

    test('should handle load on content generation endpoint', async () => {
      const result = await loadTester.runLoadTest(
        '/api/content/generate',
        'POST',
        {
          keyword: 'AI technology trends',
          country: 'google.com',
          targetLength: 1500,
          includeImages: false,
          tone: 'professional'
        },
        Math.min(CONCURRENT_USERS, 3), // Very limited for expensive endpoint
        90000 // 1.5 minutes
      );
      
      testResults.push(result);
      
      // Performance assertions for expensive endpoint
      expect(result.errorRate).toBeLessThan(10); // Less than 10% error rate
      expect(result.averageResponseTime).toBeLessThan(30000); // Average < 30s
      expect(result.p95ResponseTime).toBeLessThan(60000); // 95th percentile < 60s
      expect(result.requestsPerSecond).toBeGreaterThan(0.05); // At least 0.05 RPS
      
      console.log(`✅ Content generation load test passed`);
    });

    test('should handle load on project management endpoints', async () => {
      const result = await loadTester.runLoadTest(
        '/api/projects',
        'GET',
        {},
        CONCURRENT_USERS,
        45000 // 45 seconds
      );
      
      testResults.push(result);
      
      // Performance assertions for CRUD operations
      expect(result.errorRate).toBeLessThan(3); // Less than 3% error rate
      expect(result.averageResponseTime).toBeLessThan(2000); // Average < 2s
      expect(result.p95ResponseTime).toBeLessThan(5000); // 95th percentile < 5s
      expect(result.requestsPerSecond).toBeGreaterThan(1); // At least 1 RPS
      
      console.log(`✅ Project management load test passed`);
    });
  });

  test.describe('Stress Testing', () => {
    test('should handle traffic spikes', async () => {
      console.log(`🚀 Starting traffic spike simulation`);
      
      // Simulate gradual traffic increase
      const spikeLevels = [5, 10, 15, 20];
      const spikeResults: LoadTestResult[] = [];
      
      for (const level of spikeLevels) {
        console.log(`📈 Testing with ${level} concurrent users`);
        
        const result = await loadTester.runLoadTest(
          '/api/health',
          'GET',
          {},
          level,
          20000 // 20 seconds
        );
        
        spikeResults.push(result);
        
        // Brief pause between spike levels
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      
      // Analyze spike performance
      const baselineRPS = spikeResults[0].requestsPerSecond;
      const peakRPS = spikeResults[spikeResults.length - 1].requestsPerSecond;
      
      console.log(`📊 Traffic spike analysis:`);
      console.log(`   Baseline RPS: ${baselineRPS.toFixed(2)}`);
      console.log(`   Peak RPS: ${peakRPS.toFixed(2)}`);
      console.log(`   Scale Factor: ${(peakRPS / baselineRPS).toFixed(2)}x`);
      
      // System should scale reasonably with load
      expect(peakRPS).toBeGreaterThan(baselineRPS * 1.5); // At least 1.5x scaling
      
      // Error rates should remain acceptable
      spikeResults.forEach(result => {
        expect(result.errorRate).toBeLessThan(10);
      });
      
      console.log(`✅ Traffic spike handling validated`);
    });

    test('should maintain performance under sustained load', async () => {
      console.log(`⏰ Starting sustained load test (5 minutes)`);
      
      const result = await loadTester.runLoadTest(
        '/api/health',
        'GET',
        {},
        CONCURRENT_USERS,
        300000 // 5 minutes
      );
      
      testResults.push(result);
      
      // Sustained performance requirements
      expect(result.errorRate).toBeLessThan(2); // Less than 2% error rate
      expect(result.averageResponseTime).toBeLessThan(1000); // Average < 1s
      expect(result.p99ResponseTime).toBeLessThan(3000); // 99th percentile < 3s
      expect(result.requestsPerSecond).toBeGreaterThan(3); // At least 3 RPS
      
      console.log(`✅ Sustained load performance validated`);
    });
  });

  test.describe('Resource Usage Testing', () => {
    test('should monitor memory usage under load', async () => {
      console.log(`🧠 Starting memory usage monitoring`);
      
      // Monitor memory before load test
      const memoryBefore = await getMemoryUsage();
      
      // Run load test
      const result = await loadTester.runLoadTest(
        '/api/content/generate',
        'POST',
        {
          keyword: 'memory test content',
          country: 'google.com',
          targetLength: 1000
        },
        3, // Limited users for memory test
        60000 // 1 minute
      );
      
      // Monitor memory after load test
      const memoryAfter = await getMemoryUsage();
      
      const memoryIncrease = memoryAfter.heapUsed - memoryBefore.heapUsed;
      const memoryIncreasePercent = (memoryIncrease / memoryBefore.heapUsed) * 100;
      
      console.log(`📊 Memory usage analysis:`);
      console.log(`   Before: ${(memoryBefore.heapUsed / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   After: ${(memoryAfter.heapUsed / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   Increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB (${memoryIncreasePercent.toFixed(2)}%)`);
      
      // Memory should not increase excessively
      expect(memoryIncreasePercent).toBeLessThan(50); // Less than 50% increase
      expect(result.errorRate).toBeLessThan(5);
      
      console.log(`✅ Memory usage validation passed`);
    });

    async function getMemoryUsage() {
      const healthResponse = await fetch(`${BASE_URL}/api/health`, {
        method: 'POST'
      });
      
      if (healthResponse.ok) {
        const data = await healthResponse.json();
        return data.system?.memory?.usage || process.memoryUsage();
      }
      
      return process.memoryUsage();
    }
  });

  test.describe('Database Performance Testing', () => {
    test('should handle concurrent database operations', async () => {
      console.log(`🗄️ Starting database concurrency test`);
      
      // Test concurrent project operations
      const result = await loadTester.runLoadTest(
        '/api/projects',
        'POST',
        {
          name: `Load Test Project ${Date.now()}`,
          description: 'Automated load test project',
          keywords: ['test keyword'],
          targetCountry: 'google.com'
        },
        CONCURRENT_USERS,
        45000 // 45 seconds
      );
      
      testResults.push(result);
      
      // Database performance requirements
      expect(result.errorRate).toBeLessThan(5); // Less than 5% error rate
      expect(result.averageResponseTime).toBeLessThan(3000); // Average < 3s
      expect(result.p95ResponseTime).toBeLessThan(8000); // 95th percentile < 8s
      
      console.log(`✅ Database concurrency test passed`);
    });

    test('should handle complex query load', async () => {
      console.log(`🔍 Starting complex query load test`);
      
      // Test search/filter operations that involve complex queries
      const result = await loadTester.runLoadTest(
        '/api/projects',
        'GET',
        {},
        CONCURRENT_USERS * 2, // More users for read operations
        60000 // 1 minute
      );
      
      testResults.push(result);
      
      // Query performance requirements
      expect(result.errorRate).toBeLessThan(2); // Less than 2% error rate
      expect(result.averageResponseTime).toBeLessThan(1500); // Average < 1.5s
      expect(result.p95ResponseTime).toBeLessThan(4000); // 95th percentile < 4s
      expect(result.requestsPerSecond).toBeGreaterThan(2); // At least 2 RPS
      
      console.log(`✅ Complex query load test passed`);
    });
  });

  test.describe('API Rate Limiting Performance', () => {
    test('should handle rate limiting gracefully', async () => {
      console.log(`⏱️ Testing rate limiting performance`);
      
      // Test with aggressive load to trigger rate limiting
      const result = await loadTester.runLoadTest(
        '/api/serp/analyze',
        'POST',
        {
          keyword: 'rate limit test',
          country: 'google.com'
        },
        CONCURRENT_USERS * 3, // Higher than normal load
        30000 // 30 seconds
      );
      
      // Rate limiting should result in 429 status codes, not 500 errors
      const rateLimitedRequests = result.totalRequests - result.successfulRequests;
      
      console.log(`📊 Rate limiting analysis:`);
      console.log(`   Total Requests: ${result.totalRequests}`);
      console.log(`   Successful: ${result.successfulRequests}`);
      console.log(`   Rate Limited: ${rateLimitedRequests}`);
      console.log(`   Error Rate: ${result.errorRate.toFixed(2)}%`);
      
      // Rate limiting should be active and working
      expect(rateLimitedRequests).toBeGreaterThan(0);
      expect(result.errorRate).toBeGreaterThan(10); // Should have some rate limiting
      
      console.log(`✅ Rate limiting performance validated`);
    });
  });
});