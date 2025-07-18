# SEO Automation Platform

A modern, AI-powered SEO content generation platform built with Next.js 15 and TypeScript.

## Features

- 🚀 **Modern Stack**: Next.js 15 + TypeScript + Tailwind CSS
- 🔐 **Authentication**: Supabase Auth with Row Level Security
- 🤖 **AI Integration**: OpenAI and Anthropic API support
- 🔍 **SERP Analysis**: Real-time search engine analysis with Serper.dev
- 🕷️ **Web Scraping**: Content extraction with Firecrawl
- 📊 **Analytics**: Built-in usage tracking and monitoring
- 🎨 **UI Components**: shadcn/ui with Radix UI primitives
- ✅ **Type Safety**: Full TypeScript coverage with strict mode
- 🧪 **Testing**: Jest unit tests + Playwright E2E tests
- 📦 **State Management**: Zustand for client state
- 🔄 **Real-time**: Supabase real-time subscriptions

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in the required values:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# AI Services
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# Web Scraping Services
SERPER_API_KEY=your_serper_api_key
FIRECRAWL_API_KEY=your_firecrawl_api_key

# Analytics and Monitoring
VERCEL_ANALYTICS_ID=your_vercel_analytics_id
SENTRY_DSN=your_sentry_dsn

# Application Settings
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables** (see above)

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open http://localhost:3000** in your browser

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage
- `npm run test:e2e` - Run E2E tests
- `npm run test:e2e:ui` - Run E2E tests with UI

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **AI**: OpenAI GPT-4o-mini, Anthropic Claude
- **External APIs**: Serper.dev (SERP), Firecrawl (scraping)
- **Testing**: Jest, Testing Library, Playwright
- **Deployment**: Vercel
- **CI/CD**: GitHub Actions

## Project Structure

```
src/
├── app/                    # Next.js App Router
├── components/             # React components
│   ├── ui/                # Base UI components
│   ├── forms/             # Form components
│   ├── content/           # Content components
│   ├── analytics/         # Analytics components
│   └── layout/            # Layout components
├── lib/                   # Utility libraries
│   ├── supabase/          # Supabase clients
│   ├── ai/                # AI integrations
│   ├── scraping/          # Web scraping
│   ├── seo/               # SEO utilities
│   └── utils/             # General utilities
├── hooks/                 # Custom React hooks
├── store/                 # State management
├── types/                 # TypeScript types
└── middleware.ts          # Next.js middleware
```

## License

MIT License - see [LICENSE](./LICENSE) for details.
