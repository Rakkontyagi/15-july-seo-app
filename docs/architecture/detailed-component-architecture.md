# Detailed Component Architecture

## 1. User Interface Layer

### Frontend Application Structure
```
src/
├── app/                          # Next.js 14+ App Router
│   ├── (auth)/                   # Authentication routes
│   │   ├── login/
│   │   ├── register/
│   │   └── reset-password/
│   ├── (dashboard)/              # Protected dashboard routes
│   │   ├── dashboard/
│   │   ├── content/
│   │   │   ├── generate/
│   │   │   ├── editor/
│   │   │   └── history/
│   │   ├── projects/
│   │   ├── analytics/
│   │   └── settings/
│   ├── api/                      # API routes
│   │   ├── auth/
│   │   ├── content/
│   │   ├── serp/
│   │   └── webhooks/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/                   # Reusable components
│   ├── ui/                      # Basic UI components
│   ├── forms/                   # Form components
│   ├── content/                 # Content-specific components
│   ├── analytics/               # Analytics components
│   └── layout/                  # Layout components
├── lib/                         # Utility libraries
│   ├── supabase/               # Supabase client
│   ├── ai/                     # AI service integrations
│   ├── scraping/               # Web scraping utilities
│   ├── seo/                    # SEO analysis utilities
│   └── utils/                  # General utilities
├── hooks/                       # Custom React hooks
├── store/                       # State management
├── types/                       # TypeScript definitions
└── middleware.ts                # Next.js middleware
```

### Key Frontend Features
- **Real-time Updates**: WebSocket connections for live progress
- **Responsive Design**: Mobile-first approach with breakpoints
- **Performance**: Code splitting and lazy loading
- **Error Boundaries**: Graceful error handling
- **Accessibility**: WCAG AA compliance

## 2. API Gateway Layer

### Vercel Serverless Functions
```javascript
// api/serp/analyze.ts
export default async function handler(req, res) {
  try {
    // Authentication check
    const user = await authenticateUser(req);
    
    // Rate limiting
    await enforceRateLimit(user.id);
    
    // Input validation
    const { keyword, location } = validateInput(req.body);
    
    // Process SERP analysis
    const results = await analyzeSERP(keyword, location);
    
    return res.json({ success: true, data: results });
  } catch (error) {
    return handleError(error, res);
  }
}
```

### Supabase Edge Functions
```typescript
// supabase/functions/content-generation/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );
    
    const { keyword, competitorData } = await req.json();
    
    // Generate content using AI
    const content = await generateContent(keyword, competitorData);
    
    // Store in database
    await supabase.from('generated_content').insert({
      keyword,
      content,
      user_id: userId,
      created_at: new Date().toISOString()
    });
    
    return new Response(JSON.stringify({ content }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
```

## 3. Core Business Logic Layer

### SERP Analysis Service
```typescript
class SERPAnalysisService {
  private primaryProvider: SerperProvider;
  private backupProvider: SerpApiProvider;
  
  async analyzeKeyword(keyword: string, location: string): Promise<SERPResults> {
    try {
      // Primary provider
      const results = await this.primaryProvider.search(keyword, location);
      return this.processResults(results);
    } catch (error) {
      // Fallback to backup provider
      logger.warn('Primary SERP provider failed, using backup');
      const results = await this.backupProvider.search(keyword, location);
      return this.processResults(results);
    }
  }
  
  private processResults(rawResults: any): SERPResults {
    return {
      topResults: rawResults.organic.slice(0, 5),
      regionalData: rawResults.localResults,
      relatedQueries: rawResults.relatedSearches,
      timestamp: new Date().toISOString()
    };
  }
}
```

### Content Scraping Service
```typescript
class ContentScrapingService {
  private firecrawl: FirecrawlClient;
  private backup: ScrapingBeeClient;
  
  async scrapeContent(url: string): Promise<ScrapedContent> {
    try {
      const content = await this.firecrawl.scrape(url, {
        formats: ['markdown', 'html'],
        includeTags: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'li'],
        excludeTags: ['nav', 'footer', 'aside', 'script'],
        waitFor: 2000
      });
      
      return this.processContent(content);
    } catch (error) {
      logger.warn('Firecrawl failed, using backup scraper');
      return this.scrapeWithBackup(url);
    }
  }
  
  private processContent(content: any): ScrapedContent {
    return {
      title: content.title,
      headings: this.extractHeadings(content.markdown),
      content: this.cleanContent(content.markdown),
      wordCount: this.countWords(content.markdown),
      links: this.extractLinks(content.html),
      metadata: content.metadata
    };
  }
}
```

### AI Content Generation Service
```typescript
class AIContentGenerationService {
  private openai: OpenAIClient;
  private qualityChecker: ContentQualityChecker;
  
  async generateContent(
    keyword: string,
    competitorData: CompetitorAnalysis[],
    options: GenerationOptions
  ): Promise<GeneratedContent> {
    
    const prompt = this.buildPrompt(keyword, competitorData, options);
    
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          { role: "system", content: this.getSystemPrompt() },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 4000
      });
      
      const content = response.choices[0].message.content;
      
      // Quality validation
      const qualityScore = await this.qualityChecker.analyze(content);
      
      if (qualityScore < 0.8) {
        throw new Error('Content quality below threshold');
      }
      
      return {
        content,
        wordCount: this.countWords(content),
        keywordDensity: this.calculateKeywordDensity(content, keyword),
        qualityScore,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Content generation failed', error);
      throw new ContentGenerationError(error.message);
    }
  }
}
```

## 4. Data Persistence Layer

### Database Schema (Supabase PostgreSQL)

```sql
-- Users and Authentication
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  subscription_tier VARCHAR(50) DEFAULT 'free',
  usage_limit INTEGER DEFAULT 10,
  usage_count INTEGER DEFAULT 0
);

-- Content Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generated Content
CREATE TABLE generated_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  keyword VARCHAR(255) NOT NULL,
  location VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  word_count INTEGER NOT NULL,
  keyword_density DECIMAL(5,2) NOT NULL,
  quality_score DECIMAL(3,2) NOT NULL,
  competitor_data JSONB NOT NULL,
  seo_metrics JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SERP Analysis Results
CREATE TABLE serp_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword VARCHAR(255) NOT NULL,
  location VARCHAR(100) NOT NULL,
  results JSONB NOT NULL,
  top_competitors JSONB NOT NULL,
  analysis_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '24 hours'
);

-- Competitor Content Analysis
CREATE TABLE competitor_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  serp_analysis_id UUID NOT NULL REFERENCES serp_analysis(id) ON DELETE CASCADE,
  url VARCHAR(500) NOT NULL,
  title VARCHAR(500),
  headings JSONB NOT NULL,
  content TEXT NOT NULL,
  word_count INTEGER NOT NULL,
  keyword_density DECIMAL(5,2) NOT NULL,
  lsi_keywords JSONB NOT NULL,
  entities JSONB NOT NULL,
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usage Analytics
CREATE TABLE usage_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  details JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own projects" ON projects
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own content" ON generated_content
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own analytics" ON usage_analytics
  FOR SELECT USING (auth.uid() = user_id);
```

### Caching Strategy
```typescript
class CacheService {
  private redis: RedisClient;
  
  async cacheCompetitorAnalysis(
    keyword: string,
    location: string,
    data: CompetitorAnalysis[],
    ttl: number = 3600
  ): Promise<void> {
    const key = `competitor:${keyword}:${location}`;
    await this.redis.setex(key, ttl, JSON.stringify(data));
  }
  
  async getCachedAnalysis(
    keyword: string,
    location: string
  ): Promise<CompetitorAnalysis[] | null> {
    const key = `competitor:${keyword}:${location}`;
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }
  
  async invalidateCache(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
```

## 5. Security Architecture

### Authentication & Authorization
```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  
  const { data: { session } } = await supabase.auth.getSession();
  
  // Protect dashboard routes
  if (req.nextUrl.pathname.startsWith('/dashboard')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }
  
  // Rate limiting
  const rateLimitResult = await checkRateLimit(req);
  if (!rateLimitResult.success) {
    return new NextResponse('Rate limit exceeded', { status: 429 });
  }
  
  return res;
}
```

### Input Validation & Sanitization
```typescript
import { z } from 'zod';

const ContentGenerationSchema = z.object({
  keyword: z.string().min(1).max(100).regex(/^[a-zA-Z0-9\s\-_]+$/),
  location: z.string().min(2).max(50),
  wordCount: z.number().min(300).max(5000).optional(),
  tone: z.enum(['professional', 'casual', 'technical']).optional()
});

export async function validateContentRequest(req: Request) {
  try {
    const body = await req.json();
    const validated = ContentGenerationSchema.parse(body);
    return { success: true, data: validated };
  } catch (error) {
    return { success: false, error: error.errors };
  }
}
```

## 6. Monitoring & Observability

### Error Tracking Setup
```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({ app }),
  ],
  tracesSampleRate: 1.0,
});

// Custom error tracking
export class ApplicationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public context?: any
  ) {
    super(message);
    this.name = 'ApplicationError';
    
    Sentry.captureException(this, {
      tags: { errorCode: code },
      extra: context
    });
  }
}
```

### Performance Monitoring
```typescript
class PerformanceMonitor {
  static async trackOperation<T>(
    name: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const start = performance.now();
    
    try {
      const result = await operation();
      const duration = performance.now() - start;
      
      // Log performance metrics
      await this.logMetric(name, duration, 'success');
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      await this.logMetric(name, duration, 'error');
      throw error;
    }
  }
  
  private static async logMetric(
    operation: string,
    duration: number,
    status: string
  ): Promise<void> {
    await supabase.from('performance_metrics').insert({
      operation,
      duration,
      status,
      timestamp: new Date().toISOString()
    });
  }
}
```
