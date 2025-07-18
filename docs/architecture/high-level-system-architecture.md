# High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           USER INTERFACE LAYER                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  Next.js 14+ Frontend (Vercel)                                             │
│  • React 18 with TypeScript                                                │
│  • Tailwind CSS + Radix UI Components                                      │
│  • Real-time UI updates via Supabase subscriptions                        │
│  • Responsive design (mobile-first)                                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY LAYER                                │
├─────────────────────────────────────────────────────────────────────────────┤
│  Vercel Serverless Functions + Supabase Edge Functions                     │
│  • Authentication & Authorization (JWT)                                    │
│  • Rate limiting & Request validation                                      │
│  • Load balancing & Circuit breakers                                      │
│  • API versioning & Documentation                                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CORE BUSINESS LOGIC LAYER                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │
│  │  SERP Analysis  │  │ Content Scraper │  │ AI Content Gen  │            │
│  │    Service      │  │    Service      │  │    Service      │            │
│  │                 │  │                 │  │                 │            │
│  │ • Serper.dev    │  │ • Firecrawl API │  │ • OpenAI GPT-4+ │            │
│  │ • Multi-region  │  │ • Content clean │  │ • Custom prompts│            │
│  │ • Backup APIs   │  │ • Structure ext │  │ • E-E-A-T opt   │            │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘            │
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │
│  │ SEO Metrics     │  │ LSI Keyword     │  │ Content Quality │            │
│  │   Analysis      │  │   Extraction    │  │   Validation    │            │
│  │                 │  │                 │  │                 │            │
│  │ • Keyword den.  │  │ • NLP analysis  │  │ • Fact checking │            │
│  │ • Heading opt.  │  │ • Entity recog. │  │ • Grammar check │            │
│  │ • Competitor    │  │ • Semantic rel. │  │ • Plagiarism    │            │
│  │   benchmarks    │  │                 │  │   detection     │            │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA PERSISTENCE LAYER                           │
├─────────────────────────────────────────────────────────────────────────────┤
│  Supabase PostgreSQL with Row Level Security (RLS)                         │
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │
│  │   User Data     │  │  Content Data   │  │ Analytics Data  │            │
│  │                 │  │                 │  │                 │            │
│  │ • Profiles      │  │ • Generated     │  │ • Usage metrics │            │
│  │ • Subscriptions │  │   content       │  │ • Performance   │            │
│  │ • API keys      │  │ • Projects      │  │ • Error logs    │            │
│  │ • Preferences   │  │ • Templates     │  │ • Audit trails  │            │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘            │
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │
│  │ Competitor Data │  │   SEO Metrics   │  │   Cache Layer   │            │
│  │                 │  │                 │  │                 │            │
│  │ • SERP results  │  │ • Keyword data  │  │ • Redis cache   │            │
│  │ • Scraped cont. │  │ • Density calc. │  │ • Session store │            │
│  │ • Analysis res. │  │ • LSI keywords  │  │ • Rate limits   │            │
│  │ • Benchmark     │  │ • Entity data   │  │ • API responses │            │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EXTERNAL SERVICES LAYER                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │
│  │  Search APIs    │  │  Content APIs   │  │   AI Services   │            │
│  │                 │  │                 │  │                 │            │
│  │ • Serper.dev    │  │ • Firecrawl     │  │ • OpenAI GPT-4+ │            │
│  │ • SerpApi       │  │ • ScrapingBee   │  │ • Google NLP    │            │
│  │ • ScrapingBee   │  │ • Crawlee       │  │ • Grammarly API │            │
│  │   (backup)      │  │   (backup)      │  │   (optional)    │            │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘            │
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │
│  │   Monitoring    │  │    Payment      │  │   Email/Notify  │            │
│  │                 │  │                 │  │                 │            │
│  │ • Sentry        │  │ • Stripe        │  │ • Supabase Auth │            │
│  │ • Vercel        │  │ • Supabase      │  │ • SendGrid      │            │
│  │   Analytics     │  │   Billing       │  │   (optional)    │            │
│  │ • LogRocket     │  │                 │  │                 │            │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```
