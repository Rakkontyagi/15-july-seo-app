// Usage Examples

import { SEOAutomationClient } from './api-client';

// Initialize client
const client = new SEOAutomationClient({
  baseUrl: 'https://seo-automation-app.vercel.app/api',
  token: 'your-jwt-token'
});

// Authentication
async function login() {
  const result = await client.authLogin({
    email: 'user@example.com',
    password: 'password123'
  });
  
  client.setToken(result.token);
  return result;
}

// Generate content
async function generateContent() {
  const content = await client.contentGenerate({
    keyword: 'SEO best practices',
    industry: 'Digital Marketing',
    targetAudience: 'Marketing professionals',
    wordCount: 1500,
    tone: 'authoritative'
  });
  
  return content;
}

// SERP analysis
async function analyzeSERP() {
  const analysis = await client.serpAnalyze({
    keyword: 'SEO tools',
    location: 'United States',
    numResults: 10
  });
  
  return analysis;
}

// Export client instance
export const seoClient = new SEOAutomationClient();
