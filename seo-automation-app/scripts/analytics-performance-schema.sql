-- Analytics and Performance Tracking Schema for Story 4.4
-- Comprehensive database schema for content performance, traffic analytics, and reporting

-- 1. Content Performance Tracking Table
CREATE TABLE IF NOT EXISTS public.content_performance (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    content_id UUID REFERENCES public.generated_content(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Search Rankings
    target_keyword TEXT NOT NULL,
    current_rank INTEGER,
    previous_rank INTEGER,
    rank_change INTEGER DEFAULT 0,
    search_engine TEXT DEFAULT 'google',
    location TEXT DEFAULT 'US',
    
    -- Traffic Metrics
    organic_traffic INTEGER DEFAULT 0,
    organic_clicks INTEGER DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    ctr DECIMAL(5,2) DEFAULT 0,
    average_position DECIMAL(5,2),
    
    -- Performance Metrics
    bounce_rate DECIMAL(5,2),
    time_on_page INTEGER, -- seconds
    pages_per_session DECIMAL(5,2),
    conversion_rate DECIMAL(5,2),
    conversions INTEGER DEFAULT 0,
    
    -- Metadata
    tracking_date DATE NOT NULL DEFAULT CURRENT_DATE,
    data_source TEXT DEFAULT 'google_search_console',
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(content_id, target_keyword, tracking_date, search_engine, location)
);

-- 2. Keyword Ranking History Table
CREATE TABLE IF NOT EXISTS public.keyword_ranking_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    content_id UUID REFERENCES public.generated_content(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    
    keyword TEXT NOT NULL,
    rank_position INTEGER,
    search_volume INTEGER,
    difficulty_score INTEGER,
    search_engine TEXT DEFAULT 'google',
    location TEXT DEFAULT 'US',
    device TEXT DEFAULT 'desktop' CHECK (device IN ('desktop', 'mobile', 'tablet')),
    
    -- Historical tracking
    tracked_date DATE NOT NULL DEFAULT CURRENT_DATE,
    rank_change_1d INTEGER DEFAULT 0,
    rank_change_7d INTEGER DEFAULT 0,
    rank_change_30d INTEGER DEFAULT 0,
    
    -- Competition data
    top_competitor_url TEXT,
    competitor_rank INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(keyword, search_engine, location, device, tracked_date, project_id)
);

-- 3. Traffic Analytics Table
CREATE TABLE IF NOT EXISTS public.traffic_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    content_id UUID REFERENCES public.generated_content(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Traffic Sources
    organic_traffic INTEGER DEFAULT 0,
    direct_traffic INTEGER DEFAULT 0,
    referral_traffic INTEGER DEFAULT 0,
    social_traffic INTEGER DEFAULT 0,
    paid_traffic INTEGER DEFAULT 0,
    
    -- Engagement Metrics
    page_views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    sessions INTEGER DEFAULT 0,
    avg_session_duration INTEGER DEFAULT 0, -- seconds
    bounce_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Conversion Metrics
    goal_completions INTEGER DEFAULT 0,
    goal_conversion_rate DECIMAL(5,2) DEFAULT 0,
    revenue DECIMAL(10,2) DEFAULT 0,
    
    -- Geographic and Device Data
    top_countries JSONB DEFAULT '[]',
    device_breakdown JSONB DEFAULT '{}',
    
    -- Time period
    date_range_start DATE NOT NULL,
    date_range_end DATE NOT NULL,
    data_source TEXT DEFAULT 'google_analytics',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(content_id, date_range_start, date_range_end, data_source)
);

-- 4. Competitor Performance Comparison Table
CREATE TABLE IF NOT EXISTS public.competitor_performance (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    content_id UUID REFERENCES public.generated_content(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Competitor Information
    competitor_url TEXT NOT NULL,
    competitor_domain TEXT NOT NULL,
    competitor_title TEXT,
    
    -- Ranking Comparison
    our_rank INTEGER,
    competitor_rank INTEGER,
    rank_difference INTEGER,
    keyword TEXT NOT NULL,
    
    -- Content Comparison
    our_word_count INTEGER,
    competitor_word_count INTEGER,
    our_seo_score DECIMAL(5,2),
    competitor_seo_score DECIMAL(5,2),
    
    -- Performance Metrics
    our_traffic_estimate INTEGER,
    competitor_traffic_estimate INTEGER,
    our_backlinks INTEGER DEFAULT 0,
    competitor_backlinks INTEGER DEFAULT 0,
    
    -- Analysis Results
    competitive_advantage JSONB DEFAULT '{}',
    improvement_opportunities JSONB DEFAULT '[]',
    
    analysis_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(content_id, competitor_url, keyword, analysis_date)
);

-- 5. ROI Calculation Data Table
CREATE TABLE IF NOT EXISTS public.content_roi_data (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    content_id UUID REFERENCES public.generated_content(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Cost Data
    content_creation_cost DECIMAL(10,2) DEFAULT 0,
    promotion_cost DECIMAL(10,2) DEFAULT 0,
    total_investment DECIMAL(10,2) DEFAULT 0,
    
    -- Revenue Data
    direct_revenue DECIMAL(10,2) DEFAULT 0,
    attributed_revenue DECIMAL(10,2) DEFAULT 0,
    estimated_revenue DECIMAL(10,2) DEFAULT 0,
    
    -- Traffic Value
    organic_traffic_value DECIMAL(10,2) DEFAULT 0,
    conversion_value DECIMAL(10,2) DEFAULT 0,
    brand_awareness_value DECIMAL(10,2) DEFAULT 0,
    
    -- ROI Calculations
    roi_percentage DECIMAL(8,2) DEFAULT 0,
    payback_period_days INTEGER,
    lifetime_value DECIMAL(10,2) DEFAULT 0,
    
    -- Time Savings
    time_saved_hours DECIMAL(8,2) DEFAULT 0,
    time_saved_value DECIMAL(10,2) DEFAULT 0,
    
    calculation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    calculation_method TEXT DEFAULT 'automated',
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(content_id, calculation_date)
);

-- 6. Automated Reports Table
CREATE TABLE IF NOT EXISTS public.automated_reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    
    -- Report Configuration
    report_name TEXT NOT NULL,
    report_type TEXT NOT NULL CHECK (report_type IN ('weekly', 'monthly', 'quarterly', 'custom')),
    report_format TEXT DEFAULT 'pdf' CHECK (report_format IN ('pdf', 'html', 'json', 'csv')),
    
    -- Schedule Configuration
    schedule_enabled BOOLEAN DEFAULT true,
    schedule_frequency TEXT NOT NULL CHECK (schedule_frequency IN ('weekly', 'monthly', 'quarterly')),
    schedule_day_of_week INTEGER, -- 0-6 for weekly reports
    schedule_day_of_month INTEGER, -- 1-31 for monthly reports
    next_run_date TIMESTAMP WITH TIME ZONE,
    
    -- Report Content Configuration
    include_performance_metrics BOOLEAN DEFAULT true,
    include_traffic_analytics BOOLEAN DEFAULT true,
    include_keyword_rankings BOOLEAN DEFAULT true,
    include_competitor_analysis BOOLEAN DEFAULT true,
    include_roi_calculations BOOLEAN DEFAULT true,
    
    -- Delivery Configuration
    email_recipients TEXT[] DEFAULT '{}',
    webhook_url TEXT,
    
    -- Report Data
    last_generated_at TIMESTAMP WITH TIME ZONE,
    last_report_data JSONB,
    generation_status TEXT DEFAULT 'pending' CHECK (generation_status IN ('pending', 'generating', 'completed', 'failed')),
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Report Generation Log Table
CREATE TABLE IF NOT EXISTS public.report_generation_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    report_id UUID REFERENCES public.automated_reports(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    
    generation_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    generation_completed_at TIMESTAMP WITH TIME ZONE,
    generation_status TEXT NOT NULL CHECK (generation_status IN ('started', 'completed', 'failed')),
    
    -- Report Metrics
    content_pieces_analyzed INTEGER DEFAULT 0,
    data_points_processed INTEGER DEFAULT 0,
    processing_time_ms INTEGER,
    
    -- File Information
    report_file_path TEXT,
    report_file_size INTEGER,
    report_url TEXT,
    
    error_message TEXT,
    error_details JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_content_performance_content_id ON public.content_performance(content_id);
CREATE INDEX IF NOT EXISTS idx_content_performance_project_id ON public.content_performance(project_id);
CREATE INDEX IF NOT EXISTS idx_content_performance_user_id ON public.content_performance(user_id);
CREATE INDEX IF NOT EXISTS idx_content_performance_tracking_date ON public.content_performance(tracking_date);
CREATE INDEX IF NOT EXISTS idx_content_performance_keyword ON public.content_performance(target_keyword);

CREATE INDEX IF NOT EXISTS idx_keyword_ranking_history_keyword ON public.keyword_ranking_history(keyword);
CREATE INDEX IF NOT EXISTS idx_keyword_ranking_history_project_id ON public.keyword_ranking_history(project_id);
CREATE INDEX IF NOT EXISTS idx_keyword_ranking_history_tracked_date ON public.keyword_ranking_history(tracked_date);

CREATE INDEX IF NOT EXISTS idx_traffic_analytics_content_id ON public.traffic_analytics(content_id);
CREATE INDEX IF NOT EXISTS idx_traffic_analytics_project_id ON public.traffic_analytics(project_id);
CREATE INDEX IF NOT EXISTS idx_traffic_analytics_date_range ON public.traffic_analytics(date_range_start, date_range_end);

CREATE INDEX IF NOT EXISTS idx_competitor_performance_content_id ON public.competitor_performance(content_id);
CREATE INDEX IF NOT EXISTS idx_competitor_performance_keyword ON public.competitor_performance(keyword);
CREATE INDEX IF NOT EXISTS idx_competitor_performance_analysis_date ON public.competitor_performance(analysis_date);

CREATE INDEX IF NOT EXISTS idx_content_roi_data_content_id ON public.content_roi_data(content_id);
CREATE INDEX IF NOT EXISTS idx_content_roi_data_calculation_date ON public.content_roi_data(calculation_date);

CREATE INDEX IF NOT EXISTS idx_automated_reports_user_id ON public.automated_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_automated_reports_next_run_date ON public.automated_reports(next_run_date);
CREATE INDEX IF NOT EXISTS idx_automated_reports_active ON public.automated_reports(is_active);

-- 9. Enable Row Level Security
ALTER TABLE public.content_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keyword_ranking_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traffic_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_roi_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automated_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_generation_log ENABLE ROW LEVEL SECURITY;

-- 10. Create RLS Policies for content_performance
CREATE POLICY "Users can view their own content performance data" ON public.content_performance
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own content performance data" ON public.content_performance
    FOR ALL USING (user_id = auth.uid());

-- 11. Create RLS Policies for keyword_ranking_history
CREATE POLICY "Users can view their own keyword ranking history" ON public.keyword_ranking_history
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own keyword ranking history" ON public.keyword_ranking_history
    FOR ALL USING (user_id = auth.uid());

-- 12. Create RLS Policies for traffic_analytics
CREATE POLICY "Users can view their own traffic analytics" ON public.traffic_analytics
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own traffic analytics" ON public.traffic_analytics
    FOR ALL USING (user_id = auth.uid());

-- 13. Create RLS Policies for competitor_performance
CREATE POLICY "Users can view their own competitor performance data" ON public.competitor_performance
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own competitor performance data" ON public.competitor_performance
    FOR ALL USING (user_id = auth.uid());

-- 14. Create RLS Policies for content_roi_data
CREATE POLICY "Users can view their own ROI data" ON public.content_roi_data
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own ROI data" ON public.content_roi_data
    FOR ALL USING (user_id = auth.uid());

-- 15. Create RLS Policies for automated_reports
CREATE POLICY "Users can view their own reports" ON public.automated_reports
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own reports" ON public.automated_reports
    FOR ALL USING (user_id = auth.uid());

-- 16. Create RLS Policies for report_generation_log
CREATE POLICY "Users can view their own report generation logs" ON public.report_generation_log
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own report generation logs" ON public.report_generation_log
    FOR ALL USING (user_id = auth.uid());

-- 17. Create Functions for Analytics Calculations
CREATE OR REPLACE FUNCTION calculate_content_roi(content_uuid UUID)
RETURNS TABLE(
    roi_percentage DECIMAL(8,2),
    total_investment DECIMAL(10,2),
    total_return DECIMAL(10,2),
    payback_period_days INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        CASE
            WHEN crd.total_investment > 0 THEN
                ((crd.direct_revenue + crd.attributed_revenue + crd.organic_traffic_value) - crd.total_investment) / crd.total_investment * 100
            ELSE 0
        END as roi_percentage,
        crd.total_investment,
        (crd.direct_revenue + crd.attributed_revenue + crd.organic_traffic_value) as total_return,
        crd.payback_period_days
    FROM public.content_roi_data crd
    WHERE crd.content_id = content_uuid
    ORDER BY crd.calculation_date DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 18. Create Function to Update Performance Metrics
CREATE OR REPLACE FUNCTION update_content_performance_metrics(content_uuid UUID)
RETURNS void AS $$
BEGIN
    -- Update latest performance data
    INSERT INTO public.content_performance (
        content_id,
        project_id,
        user_id,
        target_keyword,
        current_rank,
        organic_traffic,
        tracking_date
    )
    SELECT
        gc.id,
        gc.project_id,
        gc.user_id,
        unnest(gc.keywords),
        NULL, -- Will be updated by external API
        0, -- Will be updated by external API
        CURRENT_DATE
    FROM public.generated_content gc
    WHERE gc.id = content_uuid
    AND NOT EXISTS (
        SELECT 1 FROM public.content_performance cp
        WHERE cp.content_id = content_uuid
        AND cp.tracking_date = CURRENT_DATE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 19. Create Trigger for Automatic Performance Tracking
CREATE OR REPLACE FUNCTION trigger_performance_tracking()
RETURNS trigger AS $$
BEGIN
    -- When content is published, start tracking performance
    IF NEW.status = 'published' AND OLD.status != 'published' THEN
        PERFORM update_content_performance_metrics(NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER content_performance_tracking_trigger
    AFTER UPDATE ON public.generated_content
    FOR EACH ROW EXECUTE FUNCTION trigger_performance_tracking();
