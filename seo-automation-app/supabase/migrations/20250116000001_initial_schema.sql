-- Initial database schema for SEO Automation App
-- Migration: 20250116000001_initial_schema.sql
-- Created: 2025-01-16
-- Description: Creates core tables for users, projects, and content generation

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create users table (extends auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'pro', 'enterprise')),
    subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'expired')),
    subscription_ends_at TIMESTAMP WITH TIME ZONE,
    usage_count INTEGER DEFAULT 0,
    usage_limit INTEGER DEFAULT 10, -- free tier limit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create projects table
CREATE TABLE public.projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    target_keywords TEXT[],
    target_country TEXT DEFAULT 'US',
    target_language TEXT DEFAULT 'en',
    domain_url TEXT,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create generated_content table
CREATE TABLE public.generated_content (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    meta_description TEXT,
    keywords TEXT[],
    content_type TEXT DEFAULT 'article' CHECK (content_type IN ('article', 'blog', 'product', 'landing')),
    word_count INTEGER,
    seo_score INTEGER,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create serp_analysis table (cached SERP results)
CREATE TABLE public.serp_analysis (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    keyword TEXT NOT NULL,
    country TEXT NOT NULL,
    language TEXT DEFAULT 'en',
    search_engine TEXT DEFAULT 'google',
    results JSONB NOT NULL,
    total_results BIGINT,
    analysis_metadata JSONB DEFAULT '{}',
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(keyword, country, language, search_engine)
);

-- Create competitor_analysis table (scraped competitor data)
CREATE TABLE public.competitor_analysis (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    url TEXT NOT NULL,
    keyword TEXT NOT NULL,
    title TEXT,
    meta_description TEXT,
    content_preview TEXT,
    word_count INTEGER,
    headings JSONB DEFAULT '[]',
    internal_links JSONB DEFAULT '[]',
    external_links JSONB DEFAULT '[]',
    images JSONB DEFAULT '[]',
    analysis_data JSONB DEFAULT '{}',
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(url, keyword)
);

-- Create usage_analytics table (usage tracking)
CREATE TABLE public.usage_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    action_type TEXT NOT NULL CHECK (action_type IN ('content_generation', 'serp_analysis', 'competitor_analysis', 'export')),
    resource_id UUID,
    metadata JSONB DEFAULT '{}',
    tokens_used INTEGER DEFAULT 0,
    processing_time_ms INTEGER,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_projects_active ON public.projects(is_active) WHERE is_active = true;
CREATE INDEX idx_generated_content_project_id ON public.generated_content(project_id);
CREATE INDEX idx_generated_content_user_id ON public.generated_content(user_id);
CREATE INDEX idx_generated_content_status ON public.generated_content(status);
CREATE INDEX idx_serp_analysis_keyword_country ON public.serp_analysis(keyword, country);
CREATE INDEX idx_serp_analysis_expires_at ON public.serp_analysis(expires_at);
CREATE INDEX idx_competitor_analysis_keyword ON public.competitor_analysis(keyword);
CREATE INDEX idx_competitor_analysis_expires_at ON public.competitor_analysis(expires_at);
CREATE INDEX idx_usage_analytics_user_id ON public.usage_analytics(user_id);
CREATE INDEX idx_usage_analytics_created_at ON public.usage_analytics(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER set_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_generated_content_updated_at
    BEFORE UPDATE ON public.generated_content
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();