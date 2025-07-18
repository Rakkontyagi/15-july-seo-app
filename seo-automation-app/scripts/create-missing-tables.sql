-- Create missing database tables for SEO Automation App
-- This SQL should be executed in the Supabase dashboard SQL editor

-- Enable required extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
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

-- Create serp_analysis table (cached SERP results)
CREATE TABLE IF NOT EXISTS public.serp_analysis (
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
CREATE TABLE IF NOT EXISTS public.competitor_analysis (
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
CREATE TABLE IF NOT EXISTS public.usage_analytics (
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
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_active ON public.projects(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_serp_analysis_keyword_country ON public.serp_analysis(keyword, country);
CREATE INDEX IF NOT EXISTS idx_serp_analysis_expires_at ON public.serp_analysis(expires_at);
CREATE INDEX IF NOT EXISTS idx_competitor_analysis_keyword ON public.competitor_analysis(keyword);
CREATE INDEX IF NOT EXISTS idx_competitor_analysis_expires_at ON public.competitor_analysis(expires_at);
CREATE INDEX IF NOT EXISTS idx_usage_analytics_user_id ON public.usage_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_analytics_created_at ON public.usage_analytics(created_at);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
DROP TRIGGER IF EXISTS set_projects_updated_at ON public.projects;
CREATE TRIGGER set_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- Enable RLS on all new tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.serp_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for projects table
CREATE POLICY "Users can view own projects" ON public.projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects" ON public.projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON public.projects
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON public.projects
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for SERP analysis table (shared but cached data)
CREATE POLICY "Authenticated users can view SERP analysis" ON public.serp_analysis
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert SERP analysis" ON public.serp_analysis
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update SERP analysis" ON public.serp_analysis
    FOR UPDATE TO authenticated USING (true);

-- Create RLS policies for competitor analysis table (shared but cached data)
CREATE POLICY "Authenticated users can view competitor analysis" ON public.competitor_analysis
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert competitor analysis" ON public.competitor_analysis
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update competitor analysis" ON public.competitor_analysis
    FOR UPDATE TO authenticated USING (true);

-- Create RLS policies for usage analytics table
CREATE POLICY "Users can view own usage analytics" ON public.usage_analytics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage analytics" ON public.usage_analytics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Service role policies for admin access
CREATE POLICY "Service role full access projects" ON public.projects
    FOR ALL USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

CREATE POLICY "Service role full access serp" ON public.serp_analysis
    FOR ALL USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

CREATE POLICY "Service role full access competitor" ON public.competitor_analysis
    FOR ALL USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

CREATE POLICY "Service role full access analytics" ON public.usage_analytics
    FOR ALL USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

-- Display completion message
SELECT 'Database schema creation completed successfully!' as message;