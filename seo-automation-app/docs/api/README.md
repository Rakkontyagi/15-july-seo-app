# SEO Automation API Documentation

## Overview

The SEO Automation API provides comprehensive endpoints for AI-powered content generation, SEO analysis, and competitor intelligence. This API is designed to help developers integrate advanced SEO capabilities into their applications.

## Quick Start

### 1. Authentication

All API endpoints (except `/health` and authentication endpoints) require JWT authentication:

```bash
curl -X POST https://seo-automation-app.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }'
```

### 2. Using the API

Include the JWT token in the Authorization header:

```bash
curl -X POST https://seo-automation-app.vercel.app/api/content/generate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "keyword": "SEO best practices",
    "industry": "Digital Marketing",
    "targetAudience": "Marketing professionals",
    "wordCount": 1500
  }'
```

## API Documentation

### Interactive Documentation

Visit our interactive Swagger UI documentation:
- **Production**: https://seo-automation-app.vercel.app/api/docs
- **Development**: http://localhost:3000/api/docs

### OpenAPI Specification

Download the complete OpenAPI specification:
- **YAML Format**: [openapi.yaml](./openapi.yaml)
- **JSON Format**: Available via `/api/docs` with `Accept: application/json` header

## Client SDKs

### TypeScript/JavaScript Client

Generate and use the TypeScript client:

```bash
npm run generate:api-client
```

```typescript
import { SEOAutomationClient } from './src/lib/api/generated/api-client';

const client = new SEOAutomationClient({
  baseUrl: 'https://seo-automation-app.vercel.app/api',
  token: 'your-jwt-token'
});

// Generate content
const content = await client.contentGenerate({
  keyword: 'SEO automation',
  industry: 'SaaS',
  targetAudience: 'Developers',
  wordCount: 2000
});
```

### Postman Collection

Import our Postman collection for easy API testing:
1. Download [seo-automation-collection.json](../postman/seo-automation-collection.json)
2. Import into Postman
3. Set environment variables for `base_url` and `jwt_token`

## Core Features

### 1. Content Generation

Generate SEO-optimized content with advanced AI:

- **Competitor Analysis**: Analyzes top 5 ranking pages
- **Keyword Integration**: Precise density matching (±0.1%)
- **E-E-A-T Optimization**: Experience, Expertise, Authoritativeness, Trust
- **Human Writing Patterns**: Natural language flow
- **Real-time Data**: 2025 facts and current information

### 2. SEO Analysis

Comprehensive content and SERP analysis:

- **SERP Analysis**: Real-time search results data
- **Keyword Density**: Precise measurement and optimization
- **Readability Scoring**: Multiple readability metrics
- **Technical SEO**: Structure, links, and optimization factors

### 3. Intelligence Features

Advanced AI-powered insights:

- **Gap Analysis**: Identify content opportunities
- **Competitor Intelligence**: Strengths, weaknesses, strategies
- **Strategic Recommendations**: Prioritized action items

## Rate Limits

| Endpoint Type | Rate Limit |
|---------------|------------|
| General | 100 requests/minute |
| AI Generation | 10 requests/minute |
| Analysis | 50 requests/minute |

## Error Handling

All errors return JSON with consistent structure:

```json
{
  "error": "Error Type",
  "message": "Human-readable error message",
  "details": {
    "field": "Specific validation error"
  },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### Common HTTP Status Codes

- `200` - Success
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (resource already exists)
- `429` - Rate Limit Exceeded
- `500` - Internal Server Error

## Environment Setup

### Development

```bash
# Install dependencies
npm install --legacy-peer-deps

# Set up environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

### Environment Variables

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key
OPENAI_API_KEY=your_openai_key
SERPER_API_KEY=your_serper_key
FIRECRAWL_API_KEY=your_firecrawl_key

# Optional
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret
RATE_LIMIT_ENABLED=true
```

## Testing

### API Testing

```bash
# Run API tests
npm run test:api

# Run integration tests
npm run test:integration

# Test specific endpoints
npm run test -- --testPathPattern=api
```

### Performance Testing

```bash
# Run performance tests
npm run performance:api

# Load testing
npm run performance:load

# Stress testing
npm run performance:stress
```

## Examples

### Content Generation Workflow

```typescript
// 1. Authenticate
const loginResult = await client.authLogin({
  email: 'user@example.com',
  password: 'password'
});

client.setToken(loginResult.token);

// 2. Analyze SERP
const serpAnalysis = await client.serpAnalyze({
  keyword: 'content marketing automation',
  location: 'United States'
});

// 3. Generate content
const content = await client.contentGenerate({
  keyword: 'content marketing automation',
  industry: 'Marketing Technology',
  targetAudience: 'Marketing professionals',
  wordCount: 2000,
  competitorInsights: 'Top competitors focus on basic automation without AI reasoning'
});

// 4. Analyze generated content
const seoAnalysis = await client.seoAnalyze({
  content: content.data.content,
  targetKeywords: ['content marketing', 'automation', 'AI']
});
```

### Batch Processing

```typescript
// Process multiple keywords
const keywords = ['SEO tools', 'content marketing', 'digital strategy'];

const results = await Promise.all(
  keywords.map(keyword => 
    client.contentGenerate({
      keyword,
      industry: 'Digital Marketing',
      targetAudience: 'Marketers',
      wordCount: 1500
    })
  )
);
```

## Support

- **Documentation**: Full API reference at `/api/docs`
- **GitHub**: [Issues and feedback](https://github.com/seo-automation/api/issues)
- **Email**: support@seo-automation.com

## Changelog

### v1.0.0 (Current)
- Initial API release
- Content generation with competitor analysis
- SERP analysis with real-time data
- Advanced intelligence features
- TypeScript client SDK
- Comprehensive documentation

---

*This documentation is automatically updated with each release.*