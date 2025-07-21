-- Create SERP Analysis table
CREATE TABLE IF NOT EXISTS serp_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    batch_job_id UUID REFERENCES batch_jobs(id) ON DELETE SET NULL,
    keyword VARCHAR(255) NOT NULL,
    location VARCHAR(100) NOT NULL,
    google_domain VARCHAR(50) NOT NULL,
    results JSONB NOT NULL,
    top_competitors JSONB NOT NULL,
    analysis_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '24 hours',
    notes TEXT,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_serp_analysis_user_id ON serp_analysis(user_id);
CREATE INDEX idx_serp_analysis_keyword ON serp_analysis(keyword);
CREATE INDEX idx_serp_analysis_location ON serp_analysis(location);
CREATE INDEX idx_serp_analysis_analysis_date ON serp_analysis(analysis_date DESC);
CREATE INDEX idx_serp_analysis_expires_at ON serp_analysis(expires_at);
CREATE INDEX idx_serp_analysis_batch_job_id ON serp_analysis(batch_job_id);

-- Create SERP Cache table
CREATE TABLE IF NOT EXISTS serp_cache (
    cache_key VARCHAR(500) PRIMARY KEY,
    keyword VARCHAR(255) NOT NULL,
    location VARCHAR(100) NOT NULL,
    results JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create index for cache expiration
CREATE INDEX idx_serp_cache_expires_at ON serp_cache(expires_at);

-- Create Batch Jobs table
CREATE TABLE IF NOT EXISTS batch_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    total_items INTEGER NOT NULL DEFAULT 0,
    completed_items INTEGER NOT NULL DEFAULT 0,
    progress DECIMAL(5,2) DEFAULT 0,
    metadata JSONB,
    results JSONB,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for batch jobs
CREATE INDEX idx_batch_jobs_user_id ON batch_jobs(user_id);
CREATE INDEX idx_batch_jobs_type ON batch_jobs(type);
CREATE INDEX idx_batch_jobs_status ON batch_jobs(status);
CREATE INDEX idx_batch_jobs_created_at ON batch_jobs(created_at DESC);

-- Row Level Security (RLS) policies
ALTER TABLE serp_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_jobs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own SERP analyses
CREATE POLICY "Users can view own SERP analyses" ON serp_analysis
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own SERP analyses" ON serp_analysis
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own SERP analyses" ON serp_analysis
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own SERP analyses" ON serp_analysis
    FOR DELETE USING (auth.uid() = user_id);

-- Users can only see their own batch jobs
CREATE POLICY "Users can view own batch jobs" ON batch_jobs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own batch jobs" ON batch_jobs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own batch jobs" ON batch_jobs
    FOR UPDATE USING (auth.uid() = user_id);

-- Function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_serp_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM serp_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_serp_analysis_updated_at BEFORE UPDATE ON serp_analysis
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_batch_jobs_updated_at BEFORE UPDATE ON batch_jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();