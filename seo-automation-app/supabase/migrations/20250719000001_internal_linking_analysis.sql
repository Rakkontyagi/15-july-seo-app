-- Migration: Internal Linking Analysis System
-- Description: Creates tables and indexes for storing internal linking analysis results
-- Date: 2025-07-19

-- Create internal_linking_analysis table
CREATE TABLE IF NOT EXISTS public.internal_linking_analysis (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    domain VARCHAR(255) NOT NULL,
    sitemap_url VARCHAR(500) NOT NULL,
    pages_analyzed INTEGER NOT NULL DEFAULT 0,
    linking_opportunities JSONB NOT NULL DEFAULT '{}',
    anchor_text_suggestions JSONB NOT NULL DEFAULT '[]',
    distribution_analysis JSONB DEFAULT NULL,
    contextual_placements JSONB DEFAULT '[]',
    analysis_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_pages_analyzed CHECK (pages_analyzed >= 0),
    CONSTRAINT valid_domain_format CHECK (domain ~ '^https?://[a-zA-Z0-9.-]+'),
    CONSTRAINT valid_sitemap_url CHECK (sitemap_url ~ '^https?://[a-zA-Z0-9.-]+')
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_internal_linking_analysis_user_id 
    ON public.internal_linking_analysis(user_id);

CREATE INDEX IF NOT EXISTS idx_internal_linking_analysis_domain 
    ON public.internal_linking_analysis(domain);

CREATE INDEX IF NOT EXISTS idx_internal_linking_analysis_created_at 
    ON public.internal_linking_analysis(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_internal_linking_analysis_user_domain 
    ON public.internal_linking_analysis(user_id, domain);

-- Create GIN index for JSONB columns for efficient querying
CREATE INDEX IF NOT EXISTS idx_internal_linking_opportunities_gin 
    ON public.internal_linking_analysis USING GIN (linking_opportunities);

CREATE INDEX IF NOT EXISTS idx_internal_linking_metadata_gin 
    ON public.internal_linking_analysis USING GIN (analysis_metadata);

-- Create internal_linking_recommendations table for storing processed recommendations
CREATE TABLE IF NOT EXISTS public.internal_linking_recommendations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    analysis_id UUID REFERENCES public.internal_linking_analysis(id) ON DELETE CASCADE NOT NULL,
    source_url VARCHAR(500) NOT NULL,
    target_url VARCHAR(500) NOT NULL,
    relevance_score DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    relevance_breakdown JSONB NOT NULL DEFAULT '{}',
    anchor_text_suggestions JSONB NOT NULL DEFAULT '[]',
    contextual_placements JSONB NOT NULL DEFAULT '[]',
    priority VARCHAR(10) NOT NULL DEFAULT 'medium',
    implementation_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_relevance_score CHECK (relevance_score >= 0 AND relevance_score <= 100),
    CONSTRAINT valid_priority CHECK (priority IN ('high', 'medium', 'low')),
    CONSTRAINT valid_implementation_status CHECK (implementation_status IN ('pending', 'implemented', 'rejected', 'in_progress')),
    CONSTRAINT unique_source_target_per_analysis UNIQUE (analysis_id, source_url, target_url)
);

-- Create indexes for recommendations table
CREATE INDEX IF NOT EXISTS idx_internal_linking_recommendations_analysis_id 
    ON public.internal_linking_recommendations(analysis_id);

CREATE INDEX IF NOT EXISTS idx_internal_linking_recommendations_relevance_score 
    ON public.internal_linking_recommendations(relevance_score DESC);

CREATE INDEX IF NOT EXISTS idx_internal_linking_recommendations_priority 
    ON public.internal_linking_recommendations(priority);

CREATE INDEX IF NOT EXISTS idx_internal_linking_recommendations_status 
    ON public.internal_linking_recommendations(implementation_status);

-- Create internal_linking_performance table for tracking implementation results
CREATE TABLE IF NOT EXISTS public.internal_linking_performance (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    recommendation_id UUID REFERENCES public.internal_linking_recommendations(id) ON DELETE CASCADE NOT NULL,
    implementation_date TIMESTAMP WITH TIME ZONE NOT NULL,
    performance_metrics JSONB NOT NULL DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_implementation_date CHECK (implementation_date <= NOW())
);

-- Create index for performance tracking
CREATE INDEX IF NOT EXISTS idx_internal_linking_performance_recommendation_id 
    ON public.internal_linking_performance(recommendation_id);

CREATE INDEX IF NOT EXISTS idx_internal_linking_performance_implementation_date 
    ON public.internal_linking_performance(implementation_date DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_internal_linking_analysis_updated_at 
    BEFORE UPDATE ON public.internal_linking_analysis 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_internal_linking_recommendations_updated_at 
    BEFORE UPDATE ON public.internal_linking_recommendations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create view for analysis summary
CREATE OR REPLACE VIEW public.internal_linking_analysis_summary AS
SELECT 
    ila.id,
    ila.user_id,
    ila.domain,
    ila.pages_analyzed,
    ila.created_at,
    COUNT(ilr.id) as total_recommendations,
    COUNT(CASE WHEN ilr.priority = 'high' THEN 1 END) as high_priority_count,
    COUNT(CASE WHEN ilr.priority = 'medium' THEN 1 END) as medium_priority_count,
    COUNT(CASE WHEN ilr.priority = 'low' THEN 1 END) as low_priority_count,
    COUNT(CASE WHEN ilr.implementation_status = 'implemented' THEN 1 END) as implemented_count,
    AVG(ilr.relevance_score) as average_relevance_score,
    MAX(ilr.relevance_score) as max_relevance_score
FROM public.internal_linking_analysis ila
LEFT JOIN public.internal_linking_recommendations ilr ON ila.id = ilr.analysis_id
GROUP BY ila.id, ila.user_id, ila.domain, ila.pages_analyzed, ila.created_at;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.internal_linking_analysis TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.internal_linking_recommendations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.internal_linking_performance TO authenticated;
GRANT SELECT ON public.internal_linking_analysis_summary TO authenticated;

-- Enable Row Level Security (RLS)
ALTER TABLE public.internal_linking_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_linking_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_linking_performance ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own internal linking analyses" 
    ON public.internal_linking_analysis FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own internal linking analyses" 
    ON public.internal_linking_analysis FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own internal linking analyses" 
    ON public.internal_linking_analysis FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own internal linking analyses" 
    ON public.internal_linking_analysis FOR DELETE 
    USING (auth.uid() = user_id);

-- Recommendations policies
CREATE POLICY "Users can view recommendations for their analyses" 
    ON public.internal_linking_recommendations FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM public.internal_linking_analysis 
        WHERE id = analysis_id AND user_id = auth.uid()
    ));

CREATE POLICY "Users can insert recommendations for their analyses" 
    ON public.internal_linking_recommendations FOR INSERT 
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.internal_linking_analysis 
        WHERE id = analysis_id AND user_id = auth.uid()
    ));

CREATE POLICY "Users can update recommendations for their analyses" 
    ON public.internal_linking_recommendations FOR UPDATE 
    USING (EXISTS (
        SELECT 1 FROM public.internal_linking_analysis 
        WHERE id = analysis_id AND user_id = auth.uid()
    ));

CREATE POLICY "Users can delete recommendations for their analyses" 
    ON public.internal_linking_recommendations FOR DELETE 
    USING (EXISTS (
        SELECT 1 FROM public.internal_linking_analysis 
        WHERE id = analysis_id AND user_id = auth.uid()
    ));

-- Performance tracking policies
CREATE POLICY "Users can view performance data for their recommendations" 
    ON public.internal_linking_performance FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM public.internal_linking_recommendations ilr
        JOIN public.internal_linking_analysis ila ON ilr.analysis_id = ila.id
        WHERE ilr.id = recommendation_id AND ila.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert performance data for their recommendations" 
    ON public.internal_linking_performance FOR INSERT 
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.internal_linking_recommendations ilr
        JOIN public.internal_linking_analysis ila ON ilr.analysis_id = ila.id
        WHERE ilr.id = recommendation_id AND ila.user_id = auth.uid()
    ));

-- Add comments for documentation
COMMENT ON TABLE public.internal_linking_analysis IS 'Stores internal linking analysis results for websites';
COMMENT ON TABLE public.internal_linking_recommendations IS 'Stores individual linking recommendations with relevance scores';
COMMENT ON TABLE public.internal_linking_performance IS 'Tracks performance metrics after implementing recommendations';
COMMENT ON VIEW public.internal_linking_analysis_summary IS 'Provides summary statistics for internal linking analyses';

-- Create function to clean up old analyses (optional)
CREATE OR REPLACE FUNCTION cleanup_old_internal_linking_analyses()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.internal_linking_analysis 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_internal_linking_analyses() IS 'Cleans up internal linking analyses older than 90 days';

-- Insert initial data or configuration if needed
-- (This section can be used for default configurations or seed data)
