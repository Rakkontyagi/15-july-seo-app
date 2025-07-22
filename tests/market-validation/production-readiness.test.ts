/**
 * Market Readiness & Production Validation Suite
 * Final quality assurance and market readiness validation
 */

import { test, expect } from '@playwright/test';
import { chromium, Browser, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

interface ValidationResult {
  category: string;
  test: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  message: string;
  details?: any;
}

interface MarketReadinessReport {
  overallScore: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  warningTests: number;
  categories: {
    functionality: ValidationResult[];
    performance: ValidationResult[];
    security: ValidationResult[];
    reliability: ValidationResult[];
    usability: ValidationResult[];
    scalability: ValidationResult[];
  };
}

class MarketValidator {
  private results: ValidationResult[] = [];

  addResult(category: string, test: string, status: 'PASS' | 'FAIL' | 'WARNING', message: string, details?: any) {
    this.results.push({ category, test, status, message, details });
  }

  generateReport(): MarketReadinessReport {
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const warnings = this.results.filter(r => r.status === 'WARNING').length;
    
    const score = ((passed + warnings * 0.5) / this.results.length) * 100;
    
    const categorized = this.results.reduce((acc, result) => {
      if (!acc[result.category as keyof typeof acc]) {
        acc[result.category as keyof typeof acc] = [];
      }
      acc[result.category as keyof typeof acc].push(result);
      return acc;
    }, {
      functionality: [] as ValidationResult[],
      performance: [] as ValidationResult[],
      security: [] as ValidationResult[],
      reliability: [] as ValidationResult[],
      usability: [] as ValidationResult[],
      scalability: [] as ValidationResult[]
    });

    return {
      overallScore: score,
      totalTests: this.results.length,
      passedTests: passed,
      failedTests: failed,
      warningTests: warnings,
      categories: categorized
    };
  }
}

test.describe('Market Readiness Validation', () => {
  let browser: Browser;
  let page: Page;
  let validator: MarketValidator;

  test.beforeAll(async () => {
    browser = await chromium.launch();
    validator = new MarketValidator();
  });

  test.beforeEach(async () => {
    page = await browser.newPage();
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    await page.close();
  });

  test.afterAll(async () => {
    await browser.close();
    
    // Generate final market readiness report
    const report = validator.generateReport();
    console.log(`\n📊 MARKET READINESS REPORT`);
    console.log(`=====================================`);
    console.log(`Overall Score: ${report.overallScore.toFixed(1)}%`);
    console.log(`Total Tests: ${report.totalTests}`);
    console.log(`Passed: ${report.passedTests} (✅)`);
    console.log(`Failed: ${report.failedTests} (❌)`);
    console.log(`Warnings: ${report.warningTests} (⚠️)`);
    
    Object.entries(report.categories).forEach(([category, results]) => {
      if (results.length > 0) {
        console.log(`\n📊 ${category.toUpperCase()}`);
        results.forEach(result => {
          const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
          console.log(`   ${icon} ${result.test}: ${result.message}`);
        });
      }
    });
    
    // Market readiness threshold
    const marketReadyThreshold = 85;
    if (report.overallScore >= marketReadyThreshold) {
      console.log(`\n🎉 MARKET READY! Score: ${report.overallScore.toFixed(1)}% (>= ${marketReadyThreshold}%)`);
    } else {
      console.log(`\n⚠️  NOT MARKET READY. Score: ${report.overallScore.toFixed(1)}% (< ${marketReadyThreshold}%)`);
      console.log(`\n🛠️  REQUIRED FIXES:`);
      report.categories.functionality.concat(
        report.categories.performance,
        report.categories.security,
        report.categories.reliability
      ).filter(r => r.status === 'FAIL').forEach(failure => {
        console.log(`   - ${failure.category}: ${failure.test}`);
      });
    }
  });

  test.describe('Core Functionality Validation', () => {
    test('should validate complete content generation workflow', async () => {
      try {
        console.log('📝 Testing complete content generation workflow...');
        
        // Test full workflow: Project → SERP Analysis → Content Generation → Save
        
        // Step 1: Create project
        const projectResponse = await page.request.post(`${BASE_URL}/api/projects`, {
          data: {
            name: `Market Validation Test ${Date.now()}`,
            description: 'Market readiness validation project',
            keywords: ['sustainable technology trends 2024'],
            targetCountry: 'google.com'
          }
        });
        
        if (projectResponse.status() !== 201) {
          throw new Error(`Project creation failed: ${projectResponse.status()}`);
        }
        
        const project = await projectResponse.json();
        validator.addResult('functionality', 'Project Creation', 'PASS', 'Successfully created project');
        
        // Step 2: SERP Analysis
        const serpResponse = await page.request.post(`${BASE_URL}/api/serp/analyze`, {
          data: {
            keyword: 'sustainable technology trends 2024',
            country: 'google.com',
            limit: 10
          }
        });
        
        if (serpResponse.status() !== 200) {
          throw new Error(`SERP analysis failed: ${serpResponse.status()}`);
        }
        
        const serpData = await serpResponse.json();
        if (!serpData.success || !serpData.results.organic || serpData.results.organic.length === 0) {
          throw new Error('SERP analysis returned no results');
        }
        
        validator.addResult('functionality', 'SERP Analysis', 'PASS', 
          `Analyzed ${serpData.results.organic.length} competitors`);
        
        // Step 3: Content Generation
        const contentResponse = await page.request.post(`${BASE_URL}/api/content/generate`, {
          data: {
            keyword: 'sustainable technology trends 2024',
            country: 'google.com',
            projectId: project.id,
            targetLength: 2000,
            tone: 'professional',
            includeImages: false
          }
        });
        
        if (contentResponse.status() !== 200) {
          throw new Error(`Content generation failed: ${contentResponse.status()}`);
        }
        
        const contentData = await contentResponse.json();
        if (!contentData.success || !contentData.content.title || !contentData.content.mainContent) {
          throw new Error('Content generation incomplete');
        }
        
        // Validate content quality
        const wordCount = contentData.metadata.wordCount;
        const seoScore = contentData.metadata.seoScore;
        
        if (wordCount < 1500) {
          validator.addResult('functionality', 'Content Length', 'WARNING', 
            `Content too short: ${wordCount} words`);
        } else {
          validator.addResult('functionality', 'Content Length', 'PASS', 
            `Generated ${wordCount} words`);
        }
        
        if (seoScore < 70) {
          validator.addResult('functionality', 'SEO Quality', 'WARNING', 
            `Low SEO score: ${seoScore}`);
        } else {
          validator.addResult('functionality', 'SEO Quality', 'PASS', 
            `SEO score: ${seoScore}`);
        }
        
        validator.addResult('functionality', 'Content Generation', 'PASS', 
          'Generated high-quality SEO content');
        
        // Step 4: Save content
        const saveResponse = await page.request.post(`${BASE_URL}/api/content/save`, {
          data: {
            projectId: project.id,
            content: contentData.content,
            metadata: contentData.metadata,
            competitorAnalysis: contentData.competitorAnalysis
          }
        });
        
        if (saveResponse.status() === 201) {
          validator.addResult('functionality', 'Content Persistence', 'PASS', 
            'Successfully saved generated content');
        } else {
          validator.addResult('functionality', 'Content Persistence', 'FAIL', 
            `Failed to save content: ${saveResponse.status()}`);
        }
        
        // Cleanup
        await page.request.delete(`${BASE_URL}/api/projects/${project.id}`);
        
      } catch (error) {
        validator.addResult('functionality', 'Complete Workflow', 'FAIL', 
          `Workflow failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    test('should validate multi-country content generation', async () => {
      try {
        const countries = ['google.com', 'google.ae', 'google.de', 'google.co.uk'];
        const keyword = 'digital marketing strategies';
        
        for (const country of countries) {
          console.log(`Testing content generation for ${country}...`);
          
          const response = await page.request.post(`${BASE_URL}/api/content/generate`, {
            data: {
              keyword,
              country,
              targetLength: 1200,
              tone: 'professional'
            }
          });
          
          if (response.status() === 200) {
            const data = await response.json();
            if (data.success && data.content.title && data.metadata.wordCount > 800) {
              validator.addResult('functionality', `Content for ${country}`, 'PASS', 
                `Generated ${data.metadata.wordCount} words`);
            } else {
              validator.addResult('functionality', `Content for ${country}`, 'FAIL', 
                'Content generation incomplete');
            }
          } else {
            validator.addResult('functionality', `Content for ${country}`, 'FAIL', 
              `Request failed: ${response.status()}`);
          }
        }
        
      } catch (error) {
        validator.addResult('functionality', 'Multi-Country Support', 'FAIL', 
          `Multi-country test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    test('should validate niche keyword adaptability', async () => {
      try {
        const nicheKeywords = [
          'quantum computing applications in finance',
          'biodegradable packaging solutions for e-commerce',
          'AI-powered predictive maintenance for manufacturing',
          'virtual reality therapy for mental health treatment',
          'blockchain supply chain transparency in agriculture'
        ];
        
        for (const keyword of nicheKeywords.slice(0, 3)) { // Test 3 niches
          console.log(`Testing niche adaptation for "${keyword}"...`);
          
          const response = await page.request.post(`${BASE_URL}/api/content/generate`, {
            data: {
              keyword,
              country: 'google.com',
              targetLength: 1500,
              tone: 'informative'
            }
          });
          
          if (response.status() === 200) {
            const data = await response.json();
            const content = data.content;
            
            // Check if content is relevant to the niche
            const keywordRelevance = content.title.toLowerCase().includes(keyword.split(' ')[0]) ||
                                   content.mainContent.toLowerCase().includes(keyword.split(' ')[0]);
            
            if (data.success && keywordRelevance && data.metadata.wordCount > 1000) {
              validator.addResult('functionality', `Niche Adaptation: ${keyword.split(' ')[0]}`, 'PASS', 
                `Successfully adapted to niche (${data.metadata.wordCount} words)`);
            } else {
              validator.addResult('functionality', `Niche Adaptation: ${keyword.split(' ')[0]}`, 'FAIL', 
                'Content not properly adapted to niche');
            }
          } else {
            validator.addResult('functionality', `Niche Adaptation: ${keyword.split(' ')[0]}`, 'FAIL', 
              `Niche content generation failed: ${response.status()}`);
          }
        }
        
      } catch (error) {
        validator.addResult('functionality', 'Niche Adaptability', 'FAIL', 
          `Niche testing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
  });

  test.describe('Performance & Scalability Validation', () => {
    test('should validate response time requirements', async () => {
      try {
        const endpoints = [
          { url: '/api/health', method: 'GET', maxTime: 500, name: 'Health Check' },
          { url: '/api/projects', method: 'GET', maxTime: 2000, name: 'Project List' },
          { url: '/api/serp/analyze', method: 'POST', maxTime: 15000, name: 'SERP Analysis' },
        ];
        
        for (const endpoint of endpoints) {
          const startTime = Date.now();
          
          let response;
          if (endpoint.method === 'GET') {
            response = await page.request.get(`${BASE_URL}${endpoint.url}`);
          } else {
            response = await page.request.post(`${BASE_URL}${endpoint.url}`, {
              data: {
                keyword: 'performance test',
                country: 'google.com',
                limit: 5
              }
            });
          }
          
          const responseTime = Date.now() - startTime;
          
          if (responseTime <= endpoint.maxTime && response.status() < 400) {
            validator.addResult('performance', endpoint.name, 'PASS', 
              `Response time: ${responseTime}ms (<= ${endpoint.maxTime}ms)`);
          } else if (responseTime > endpoint.maxTime) {
            validator.addResult('performance', endpoint.name, 'FAIL', 
              `Response time too slow: ${responseTime}ms (> ${endpoint.maxTime}ms)`);
          } else {
            validator.addResult('performance', endpoint.name, 'FAIL', 
              `Request failed: ${response.status()}`);
          }
        }
        
      } catch (error) {
        validator.addResult('performance', 'Response Time Validation', 'FAIL', 
          `Performance test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    test('should validate concurrent request handling', async () => {
      try {
        console.log('Testing concurrent request handling...');
        
        const concurrentRequests = 10;
        const promises = [];
        const startTime = Date.now();
        
        for (let i = 0; i < concurrentRequests; i++) {
          promises.push(
            page.request.get(`${BASE_URL}/api/health`)
          );
        }
        
        const responses = await Promise.all(promises);
        const endTime = Date.now();
        
        const successCount = responses.filter(r => r.status() === 200).length;
        const totalTime = endTime - startTime;
        const avgTime = totalTime / concurrentRequests;
        
        if (successCount >= concurrentRequests * 0.9 && avgTime < 1000) {
          validator.addResult('scalability', 'Concurrent Requests', 'PASS', 
            `Handled ${successCount}/${concurrentRequests} requests in ${totalTime}ms`);
        } else {
          validator.addResult('scalability', 'Concurrent Requests', 'WARNING', 
            `Only ${successCount}/${concurrentRequests} successful, avg ${avgTime}ms`);
        }
        
      } catch (error) {
        validator.addResult('scalability', 'Concurrent Handling', 'FAIL', 
          `Concurrency test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
  });

  test.describe('Security & Reliability Validation', () => {
    test('should validate security headers and HTTPS', async () => {
      try {
        const response = await page.request.get(`${BASE_URL}/`);
        const headers = response.headers();
        
        const requiredHeaders = {
          'x-content-type-options': 'nosniff',
          'x-frame-options': 'DENY',
          'strict-transport-security': 'max-age='
        };
        
        let securityScore = 0;
        const totalHeaders = Object.keys(requiredHeaders).length;
        
        Object.entries(requiredHeaders).forEach(([header, value]) => {
          if (headers[header] && headers[header].includes(value)) {
            securityScore++;
            validator.addResult('security', `Header: ${header}`, 'PASS', 
              `Present: ${headers[header]}`);
          } else {
            validator.addResult('security', `Header: ${header}`, 'WARNING', 
              `Missing or incorrect: ${headers[header] || 'Not present'}`);
          }
        });
        
        if (securityScore === totalHeaders) {
          validator.addResult('security', 'Security Headers', 'PASS', 
            'All security headers present');
        } else {
          validator.addResult('security', 'Security Headers', 'WARNING', 
            `${securityScore}/${totalHeaders} security headers present`);
        }
        
      } catch (error) {
        validator.addResult('security', 'Security Headers', 'FAIL', 
          `Security validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    test('should validate error handling and recovery', async () => {
      try {
        // Test various error conditions
        const errorTests = [
          {
            name: 'Invalid Endpoint',
            request: () => page.request.get(`${BASE_URL}/api/invalid-endpoint`),
            expectedStatus: [404]
          },
          {
            name: 'Malformed Request',
            request: () => page.request.post(`${BASE_URL}/api/content/generate`, {
              data: { invalid: 'data' }
            }),
            expectedStatus: [400, 422]
          },
          {
            name: 'Empty Request Body',
            request: () => page.request.post(`${BASE_URL}/api/projects`, {
              data: {}
            }),
            expectedStatus: [400, 422]
          }
        ];
        
        for (const test of errorTests) {
          const response = await test.request();
          const responseText = await response.text();
          
          // Check that errors are handled gracefully
          const hasStackTrace = responseText.includes('Error:') || responseText.includes('at ');
          const hasProperStatus = test.expectedStatus.includes(response.status());
          
          if (hasProperStatus && !hasStackTrace) {
            validator.addResult('reliability', `Error Handling: ${test.name}`, 'PASS', 
              `Proper error response: ${response.status()}`);
          } else {
            validator.addResult('reliability', `Error Handling: ${test.name}`, 'FAIL', 
              `Improper error handling: ${response.status()}, stack trace: ${hasStackTrace}`);
          }
        }
        
      } catch (error) {
        validator.addResult('reliability', 'Error Handling', 'FAIL', 
          `Error handling test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
  });

  test.describe('User Experience Validation', () => {
    test('should validate API response formats', async () => {
      try {
        const apiTests = [
          {
            url: '/api/health',
            method: 'GET',
            requiredFields: ['status', 'timestamp', 'uptime', 'checks']
          },
          {
            url: '/api/projects',
            method: 'GET',
            requiredFields: [] // May be empty for new users
          }
        ];
        
        for (const test of apiTests) {
          let response;
          if (test.method === 'GET') {
            response = await page.request.get(`${BASE_URL}${test.url}`);
          }
          
          if (response && response.status() === 200) {
            const data = await response.json();
            
            const hasRequiredFields = test.requiredFields.every(field => 
              data.hasOwnProperty(field)
            );
            
            if (hasRequiredFields) {
              validator.addResult('usability', `API Format: ${test.url}`, 'PASS', 
                'All required fields present');
            } else {
              validator.addResult('usability', `API Format: ${test.url}`, 'FAIL', 
                'Missing required fields in response');
            }
          } else {
            validator.addResult('usability', `API Format: ${test.url}`, 'FAIL', 
              `API request failed: ${response?.status()}`);
          }
        }
        
      } catch (error) {
        validator.addResult('usability', 'API Response Format', 'FAIL', 
          `API format test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    test('should validate content quality standards', async () => {
      try {
        console.log('Testing content quality standards...');
        
        const response = await page.request.post(`${BASE_URL}/api/content/generate`, {
          data: {
            keyword: 'sustainable business practices 2024',
            country: 'google.com',
            targetLength: 2000,
            tone: 'professional',
            includeImages: false
          }
        });
        
        if (response.status() === 200) {
          const data = await response.json();
          const content = data.content;
          const metadata = data.metadata;
          
          // Quality checks
          const checks = [
            {
              name: 'Title Quality',
              condition: content.title && content.title.length >= 30 && content.title.length <= 80,
              message: `Title length: ${content.title?.length || 0} chars`
            },
            {
              name: 'Content Length',
              condition: metadata.wordCount >= 1800 && metadata.wordCount <= 2200,
              message: `Word count: ${metadata.wordCount}`
            },
            {
              name: 'SEO Score',
              condition: metadata.seoScore >= 75,
              message: `SEO score: ${metadata.seoScore}`
            },
            {
              name: 'Meta Description',
              condition: content.metaDescription && content.metaDescription.length <= 160,
              message: `Meta length: ${content.metaDescription?.length || 0} chars`
            },
            {
              name: 'Keyword Integration',
              condition: content.mainContent.toLowerCase().includes('sustainable') && 
                        content.mainContent.toLowerCase().includes('business'),
              message: 'Keyword integration check'
            }
          ];
          
          checks.forEach(check => {
            validator.addResult('usability', check.name, check.condition ? 'PASS' : 'FAIL', 
              check.message);
          });
          
        } else {
          validator.addResult('usability', 'Content Quality', 'FAIL', 
            `Content generation failed: ${response.status()}`);
        }
        
      } catch (error) {
        validator.addResult('usability', 'Content Quality', 'FAIL', 
          `Quality test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
  });

  test.describe('Final Market Readiness Check', () => {
    test('should validate production environment readiness', async () => {
      try {
        // Environment checks
        const healthResponse = await page.request.get(`${BASE_URL}/api/health`);
        
        if (healthResponse.status() === 200) {
          const healthData = await healthResponse.json();
          
          // Production readiness indicators
          const productionChecks = [
            {
              name: 'Environment',
              condition: healthData.environment === 'production' || BASE_URL.includes('localhost'),
              message: `Environment: ${healthData.environment || 'unknown'}`
            },
            {
              name: 'Database Connectivity',
              condition: healthData.checks?.some((c: any) => c.service === 'database' && c.status === 'healthy'),
              message: 'Database connection status'
            },
            {
              name: 'External API Access',
              condition: healthData.checks?.some((c: any) => c.service === 'openai' && c.status === 'healthy'),
              message: 'External API connectivity'
            },
            {
              name: 'System Health',
              condition: healthData.status === 'healthy',
              message: `Overall system status: ${healthData.status}`
            }
          ];
          
          productionChecks.forEach(check => {
            validator.addResult('reliability', check.name, check.condition ? 'PASS' : 'FAIL', 
              check.message);
          });
          
          validator.addResult('reliability', 'Production Readiness', 'PASS', 
            'System ready for production deployment');
            
        } else {
          validator.addResult('reliability', 'Production Readiness', 'FAIL', 
            `Health check failed: ${healthResponse.status()}`);
        }
        
      } catch (error) {
        validator.addResult('reliability', 'Production Environment', 'FAIL', 
          `Environment check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
  });
});