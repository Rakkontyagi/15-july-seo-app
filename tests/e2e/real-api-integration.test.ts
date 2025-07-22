/**
 * End-to-End Integration Tests with Real APIs
 * Comprehensive testing of all production APIs and workflows
 */

import { test, expect } from '@playwright/test';
import { chromium, Browser, Page } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 300000; // 5 minutes for API calls

// Real test data - NO MOCKS
const TEST_KEYWORDS = [
  'best digital marketing strategies 2024',
  'sustainable fashion trends',
  'artificial intelligence in healthcare',
  'remote work productivity tips',
  'electric vehicle charging stations'
];

const TEST_COUNTRIES = [
  'google.com', // United States
  'google.ae', // UAE
  'google.de', // Germany
  'google.com.au', // Australia
  'google.co.uk' // United Kingdom
];

interface ContentGenerationResult {
  success: boolean;
  content: {
    title: string;
    introduction: string;
    mainContent: string;
    conclusion: string;
    metaDescription: string;
    keywords: string[];
  };
  metadata: {
    wordCount: number;
    readingTime: number;
    seoScore: number;
  };
  competitorAnalysis: {
    topCompetitors: any[];
    competitorInsights: string[];
  };
}

test.describe('Real API Integration Tests', () => {
  let browser: Browser;
  let page: Page;

  test.beforeAll(async () => {
    browser = await chromium.launch();
  });

  test.beforeEach(async () => {
    page = await browser.newPage();
    
    // Set longer timeout for API calls
    page.setDefaultTimeout(TEST_TIMEOUT);
    
    // Navigate to application
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    await page.close();
  });

  test.afterAll(async () => {
    await browser.close();
  });

  test.describe('SERP Analysis API Integration', () => {
    test('should successfully analyze SERP for multiple keywords and countries', async () => {
      for (const keyword of TEST_KEYWORDS.slice(0, 2)) { // Test 2 keywords
        for (const country of TEST_COUNTRIES.slice(0, 2)) { // Test 2 countries
          console.log(`Testing SERP analysis for "${keyword}" in ${country}`);
          
          // Call SERP analysis API
          const response = await page.request.post(`${BASE_URL}/api/serp/analyze`, {
            data: {
              keyword,
              country,
              limit: 10
            }
          });

          expect(response.status()).toBe(200);
          
          const serpData = await response.json();
          
          // Validate SERP response structure
          expect(serpData).toHaveProperty('success', true);
          expect(serpData).toHaveProperty('results');
          expect(serpData.results).toHaveProperty('organic');
          expect(Array.isArray(serpData.results.organic)).toBeTruthy();
          expect(serpData.results.organic.length).toBeGreaterThan(0);
          
          // Validate organic results structure
          const firstResult = serpData.results.organic[0];
          expect(firstResult).toHaveProperty('title');
          expect(firstResult).toHaveProperty('link');
          expect(firstResult).toHaveProperty('snippet');
          expect(firstResult).toHaveProperty('position');
          
          // Validate metadata
          expect(serpData).toHaveProperty('metadata');
          expect(serpData.metadata).toHaveProperty('keyword', keyword);
          expect(serpData.metadata).toHaveProperty('country', country);
          expect(serpData.metadata).toHaveProperty('totalResults');
          
          console.log(`✅ SERP analysis successful for "${keyword}" in ${country}`);
          console.log(`   Found ${serpData.results.organic.length} organic results`);
        }
      }
    });

    test('should handle invalid keyword gracefully', async () => {
      const response = await page.request.post(`${BASE_URL}/api/serp/analyze`, {
        data: {
          keyword: '', // Empty keyword
          country: 'google.com'
        }
      });

      expect(response.status()).toBe(400);
      const errorData = await response.json();
      expect(errorData).toHaveProperty('error');
      expect(errorData.error).toContain('keyword');
    });
  });

  test.describe('Content Generation API Integration', () => {
    test('should generate high-quality SEO content with real competitor analysis', async () => {
      const testKeyword = TEST_KEYWORDS[0];
      const testCountry = TEST_COUNTRIES[0];
      
      console.log(`Generating content for "${testKeyword}" targeting ${testCountry}`);
      
      // Generate content with real APIs
      const response = await page.request.post(`${BASE_URL}/api/content/generate`, {
        data: {
          keyword: testKeyword,
          country: testCountry,
          targetLength: 2000,
          includeImages: false, // Skip images for faster testing
          tone: 'professional',
          contentType: 'blog_post'
        }
      });

      expect(response.status()).toBe(200);
      
      const contentResult: ContentGenerationResult = await response.json();
      
      // Validate content generation response
      expect(contentResult).toHaveProperty('success', true);
      expect(contentResult).toHaveProperty('content');
      expect(contentResult).toHaveProperty('metadata');
      expect(contentResult).toHaveProperty('competitorAnalysis');
      
      // Validate content structure
      const { content } = contentResult;
      expect(content.title).toBeTruthy();
      expect(content.title.length).toBeGreaterThan(20);
      expect(content.title.length).toBeLessThan(100);
      
      expect(content.introduction).toBeTruthy();
      expect(content.introduction.length).toBeGreaterThan(100);
      
      expect(content.mainContent).toBeTruthy();
      expect(content.mainContent.length).toBeGreaterThan(1000);
      
      expect(content.conclusion).toBeTruthy();
      expect(content.conclusion.length).toBeGreaterThan(100);
      
      expect(content.metaDescription).toBeTruthy();
      expect(content.metaDescription.length).toBeLessThan(160);
      
      expect(Array.isArray(content.keywords)).toBeTruthy();
      expect(content.keywords.length).toBeGreaterThan(0);
      
      // Validate metadata
      const { metadata } = contentResult;
      expect(metadata.wordCount).toBeGreaterThan(500);
      expect(metadata.readingTime).toBeGreaterThan(2);
      expect(metadata.seoScore).toBeGreaterThan(70); // Minimum SEO score
      
      // Validate competitor analysis
      const { competitorAnalysis } = contentResult;
      expect(Array.isArray(competitorAnalysis.topCompetitors)).toBeTruthy();
      expect(competitorAnalysis.topCompetitors.length).toBeGreaterThan(0);
      expect(Array.isArray(competitorAnalysis.competitorInsights)).toBeTruthy();
      expect(competitorAnalysis.competitorInsights.length).toBeGreaterThan(0);
      
      // Validate content quality
      expect(content.mainContent).toContain(testKeyword.toLowerCase());
      expect(content.title.toLowerCase()).toContain(testKeyword.split(' ')[0]);
      
      console.log(`✅ Content generation successful`);
      console.log(`   Title: ${content.title}`);
      console.log(`   Word Count: ${metadata.wordCount}`);
      console.log(`   SEO Score: ${metadata.seoScore}`);
      console.log(`   Competitors Analyzed: ${competitorAnalysis.topCompetitors.length}`);
    });

    test('should generate content for different niches and countries', async () => {
      const testCases = [
        { keyword: TEST_KEYWORDS[1], country: TEST_COUNTRIES[1] },
        { keyword: TEST_KEYWORDS[2], country: TEST_COUNTRIES[2] }
      ];
      
      for (const { keyword, country } of testCases) {
        console.log(`Testing niche content generation for "${keyword}" in ${country}`);
        
        const response = await page.request.post(`${BASE_URL}/api/content/generate`, {
          data: {
            keyword,
            country,
            targetLength: 1500,
            includeImages: false,
            tone: 'informative'
          }
        });

        expect(response.status()).toBe(200);
        
        const contentResult = await response.json();
        
        expect(contentResult.success).toBe(true);
        expect(contentResult.content.title).toBeTruthy();
        expect(contentResult.content.mainContent).toBeTruthy();
        expect(contentResult.metadata.wordCount).toBeGreaterThan(800);
        expect(contentResult.competitorAnalysis.topCompetitors.length).toBeGreaterThan(0);
        
        console.log(`✅ Niche content generation successful for "${keyword}"`);
      }
    });
  });

  test.describe('OpenAI API Integration', () => {
    test('should successfully connect to OpenAI API and generate content', async () => {
      const response = await page.request.post(`${BASE_URL}/api/ai/generate`, {
        data: {
          prompt: 'Write a professional introduction about sustainable technology trends in 2024',
          maxTokens: 500,
          temperature: 0.7
        }
      });

      expect(response.status()).toBe(200);
      
      const aiResult = await response.json();
      
      expect(aiResult).toHaveProperty('success', true);
      expect(aiResult).toHaveProperty('content');
      expect(aiResult.content).toBeTruthy();
      expect(aiResult.content.length).toBeGreaterThan(200);
      
      console.log('✅ OpenAI API integration successful');
      console.log(`   Generated ${aiResult.content.length} characters`);
    });
  });

  test.describe('Firecrawl API Integration', () => {
    test('should successfully scrape competitor content', async () => {
      // Get a real competitor URL from SERP analysis first
      const serpResponse = await page.request.post(`${BASE_URL}/api/serp/analyze`, {
        data: {
          keyword: TEST_KEYWORDS[0],
          country: 'google.com',
          limit: 5
        }
      });
      
      const serpData = await serpResponse.json();
      const competitorUrl = serpData.results.organic[0].link;
      
      console.log(`Scraping competitor content from: ${competitorUrl}`);
      
      const scrapeResponse = await page.request.post(`${BASE_URL}/api/content/scrape`, {
        data: {
          url: competitorUrl,
          extractContent: true,
          extractMetadata: true
        }
      });

      expect(scrapeResponse.status()).toBe(200);
      
      const scrapeResult = await scrapeResponse.json();
      
      expect(scrapeResult).toHaveProperty('success', true);
      expect(scrapeResult).toHaveProperty('content');
      expect(scrapeResult).toHaveProperty('metadata');
      
      expect(scrapeResult.content.text).toBeTruthy();
      expect(scrapeResult.content.text.length).toBeGreaterThan(100);
      
      expect(scrapeResult.metadata.title).toBeTruthy();
      expect(scrapeResult.metadata.url).toBe(competitorUrl);
      
      console.log('✅ Firecrawl API integration successful');
      console.log(`   Scraped ${scrapeResult.content.text.length} characters from ${competitorUrl}`);
    });
  });

  test.describe('Database Integration', () => {
    test('should successfully save and retrieve project data', async () => {
      const projectData = {
        name: `E2E Test Project - ${Date.now()}`,
        description: 'Automated E2E test project',
        keywords: TEST_KEYWORDS.slice(0, 2),
        targetCountry: TEST_COUNTRIES[0],
        settings: {
          contentType: 'blog_post',
          tone: 'professional',
          targetLength: 2000
        }
      };
      
      // Create project
      const createResponse = await page.request.post(`${BASE_URL}/api/projects`, {
        data: projectData
      });

      expect(createResponse.status()).toBe(201);
      
      const createdProject = await createResponse.json();
      expect(createdProject).toHaveProperty('id');
      expect(createdProject.name).toBe(projectData.name);
      
      const projectId = createdProject.id;
      console.log(`✅ Project created with ID: ${projectId}`);
      
      // Retrieve project
      const getResponse = await page.request.get(`${BASE_URL}/api/projects/${projectId}`);
      expect(getResponse.status()).toBe(200);
      
      const retrievedProject = await getResponse.json();
      expect(retrievedProject.id).toBe(projectId);
      expect(retrievedProject.name).toBe(projectData.name);
      
      console.log('✅ Project retrieval successful');
      
      // Update project
      const updateData = {
        ...projectData,
        name: `Updated ${projectData.name}`,
        status: 'active'
      };
      
      const updateResponse = await page.request.put(`${BASE_URL}/api/projects/${projectId}`, {
        data: updateData
      });
      
      expect(updateResponse.status()).toBe(200);
      console.log('✅ Project update successful');
      
      // Delete project (cleanup)
      const deleteResponse = await page.request.delete(`${BASE_URL}/api/projects/${projectId}`);
      expect(deleteResponse.status()).toBe(200);
      console.log('✅ Project deletion successful');
    });
  });

  test.describe('Health Check Integration', () => {
    test('should confirm all services are healthy', async () => {
      const response = await page.request.get(`${BASE_URL}/api/health`);
      
      expect(response.status()).toBe(200);
      
      const healthData = await response.json();
      
      expect(healthData).toHaveProperty('status', 'healthy');
      expect(healthData).toHaveProperty('checks');
      
      const checks = healthData.checks;
      expect(Array.isArray(checks)).toBeTruthy();
      
      // Verify all critical services are healthy
      const databaseCheck = checks.find(c => c.service === 'database');
      expect(databaseCheck?.status).toBe('healthy');
      
      const apiCheck = checks.find(c => c.service === 'api');
      expect(apiCheck?.status).toBe('healthy');
      
      const memoryCheck = checks.find(c => c.service === 'memory');
      expect(['healthy', 'degraded'].includes(memoryCheck?.status)).toBeTruthy();
      
      console.log('✅ All critical services are healthy');
      console.log(`   Database latency: ${databaseCheck?.latency}ms`);
      console.log(`   API response time: ${healthData.responseTime}ms`);
    });

    test('should provide detailed metrics', async () => {
      const response = await page.request.post(`${BASE_URL}/api/health`);
      
      expect(response.status()).toBe(200);
      
      const metricsData = await response.json();
      
      expect(metricsData).toHaveProperty('performance');
      expect(metricsData).toHaveProperty('system');
      expect(metricsData).toHaveProperty('health');
      
      console.log('✅ Detailed health metrics available');
      console.log(`   Uptime: ${metricsData.uptime} seconds`);
    });
  });

  test.describe('End-to-End Workflow', () => {
    test('should complete full content generation workflow', async () => {
      const keyword = TEST_KEYWORDS[3];
      const country = TEST_COUNTRIES[0];
      
      console.log(`Starting full workflow for "${keyword}"`);
      
      // Step 1: Create project
      const projectResponse = await page.request.post(`${BASE_URL}/api/projects`, {
        data: {
          name: `E2E Workflow Test - ${Date.now()}`,
          description: 'Full workflow test',
          keywords: [keyword],
          targetCountry: country
        }
      });
      
      expect(projectResponse.status()).toBe(201);
      const project = await projectResponse.json();
      const projectId = project.id;
      
      console.log(`✅ Step 1: Project created (${projectId})`);
      
      // Step 2: Analyze SERP
      const serpResponse = await page.request.post(`${BASE_URL}/api/serp/analyze`, {
        data: { keyword, country, limit: 10 }
      });
      
      expect(serpResponse.status()).toBe(200);
      const serpData = await serpResponse.json();
      expect(serpData.success).toBe(true);
      
      console.log(`✅ Step 2: SERP analysis completed (${serpData.results.organic.length} competitors)`);
      
      // Step 3: Generate content
      const contentResponse = await page.request.post(`${BASE_URL}/api/content/generate`, {
        data: {
          keyword,
          country,
          projectId,
          targetLength: 1800,
          includeImages: false
        }
      });
      
      expect(contentResponse.status()).toBe(200);
      const contentData = await contentResponse.json();
      expect(contentData.success).toBe(true);
      
      console.log(`✅ Step 3: Content generated (${contentData.metadata.wordCount} words, SEO score: ${contentData.metadata.seoScore})`);
      
      // Step 4: Save generated content
      const saveResponse = await page.request.post(`${BASE_URL}/api/content/save`, {
        data: {
          projectId,
          content: contentData.content,
          metadata: contentData.metadata,
          competitorAnalysis: contentData.competitorAnalysis
        }
      });
      
      expect(saveResponse.status()).toBe(201);
      const savedContent = await saveResponse.json();
      
      console.log(`✅ Step 4: Content saved (${savedContent.id})`);
      
      // Step 5: Validate saved content
      const validateResponse = await page.request.get(`${BASE_URL}/api/content/${savedContent.id}`);
      expect(validateResponse.status()).toBe(200);
      
      const retrievedContent = await validateResponse.json();
      expect(retrievedContent.content.title).toBe(contentData.content.title);
      
      console.log(`✅ Step 5: Content validation successful`);
      
      // Cleanup
      await page.request.delete(`${BASE_URL}/api/projects/${projectId}`);
      
      console.log(`🎉 Full workflow completed successfully for "${keyword}"`);
    });
  });
});