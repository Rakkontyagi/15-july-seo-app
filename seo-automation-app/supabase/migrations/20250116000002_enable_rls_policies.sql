-- Enable Row Level Security (RLS) policies
-- Migration: 20250116000002_enable_rls_policies.sql
-- Created: 2025-01-16
-- Description: Enables RLS and creates security policies for all tables

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.serp_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_analytics ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Projects table policies
CREATE POLICY "Users can view own projects" ON public.projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects" ON public.projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON public.projects
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON public.projects
    FOR DELETE USING (auth.uid() = user_id);

-- Generated content table policies
CREATE POLICY "Users can view own content" ON public.generated_content
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own content" ON public.generated_content
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own content" ON public.generated_content
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own content" ON public.generated_content
    FOR DELETE USING (auth.uid() = user_id);

-- SERP analysis table policies (shared but cached data)
CREATE POLICY "Authenticated users can view SERP analysis" ON public.serp_analysis
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert SERP analysis" ON public.serp_analysis
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update SERP analysis" ON public.serp_analysis
    FOR UPDATE TO authenticated USING (true);

-- Competitor analysis table policies (shared but cached data)
CREATE POLICY "Authenticated users can view competitor analysis" ON public.competitor_analysis
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert competitor analysis" ON public.competitor_analysis
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update competitor analysis" ON public.competitor_analysis
    FOR UPDATE TO authenticated USING (true);

-- Usage analytics table policies
CREATE POLICY "Users can view own usage analytics" ON public.usage_analytics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage analytics" ON public.usage_analytics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Service role policies for admin access
CREATE POLICY "Service role full access users" ON public.users
    FOR ALL USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

CREATE POLICY "Service role full access projects" ON public.projects
    FOR ALL USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

CREATE POLICY "Service role full access content" ON public.generated_content
    FOR ALL USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

CREATE POLICY "Service role full access serp" ON public.serp_analysis
    FOR ALL USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

CREATE POLICY "Service role full access competitor" ON public.competitor_analysis
    FOR ALL USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

CREATE POLICY "Service role full access analytics" ON public.usage_analytics
    FOR ALL USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');