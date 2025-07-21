-- Project Management Schema Updates for Story 4.3
-- Adds client/campaign organization, tag system, and enhanced project management

-- 1. Update projects table with client/campaign organization
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS client_name TEXT,
ADD COLUMN IF NOT EXISTS campaign_name TEXT,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on_hold', 'archived')),
ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100);

-- 2. Create project_tags table for tag system
CREATE TABLE IF NOT EXISTS public.project_tags (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    tag_name TEXT NOT NULL,
    tag_color TEXT DEFAULT '#3B82F6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, tag_name)
);

-- 3. Create content_tags table for content categorization
CREATE TABLE IF NOT EXISTS public.content_tags (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    content_id UUID REFERENCES public.generated_content(id) ON DELETE CASCADE NOT NULL,
    tag_name TEXT NOT NULL,
    tag_color TEXT DEFAULT '#3B82F6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(content_id, tag_name)
);

-- 4. Create project_access_control table for client access controls
CREATE TABLE IF NOT EXISTS public.project_access_control (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    email TEXT, -- For external clients who don't have accounts yet
    role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
    permissions JSONB DEFAULT '{}',
    invited_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, user_id),
    UNIQUE(project_id, email)
);

-- 5. Create content_calendar table for content scheduling
CREATE TABLE IF NOT EXISTS public.content_calendar (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    content_id UUID REFERENCES public.generated_content(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'published', 'cancelled')),
    platform TEXT, -- e.g., 'wordpress', 'shopify', 'manual'
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create project_metrics table for progress tracking
CREATE TABLE IF NOT EXISTS public.project_metrics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    total_content_pieces INTEGER DEFAULT 0,
    completed_content_pieces INTEGER DEFAULT 0,
    average_seo_score DECIMAL(5,2) DEFAULT 0,
    average_word_count INTEGER DEFAULT 0,
    last_activity_at TIMESTAMP WITH TIME ZONE,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id)
);

-- 7. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_client_campaign ON public.projects(client_name, campaign_name);
CREATE INDEX IF NOT EXISTS idx_projects_category ON public.projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_due_date ON public.projects(due_date);
CREATE INDEX IF NOT EXISTS idx_project_tags_project_id ON public.project_tags(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tags_tag_name ON public.project_tags(tag_name);
CREATE INDEX IF NOT EXISTS idx_content_tags_content_id ON public.content_tags(content_id);
CREATE INDEX IF NOT EXISTS idx_content_tags_tag_name ON public.content_tags(tag_name);
CREATE INDEX IF NOT EXISTS idx_project_access_project_id ON public.project_access_control(project_id);
CREATE INDEX IF NOT EXISTS idx_project_access_user_id ON public.project_access_control(user_id);
CREATE INDEX IF NOT EXISTS idx_content_calendar_project_id ON public.content_calendar(project_id);
CREATE INDEX IF NOT EXISTS idx_content_calendar_scheduled_date ON public.content_calendar(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_project_metrics_project_id ON public.project_metrics(project_id);

-- 8. Enable Row Level Security
ALTER TABLE public.project_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_access_control ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_metrics ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policies for project_tags
CREATE POLICY "Users can view project tags for accessible projects" ON public.project_tags
    FOR SELECT USING (
        project_id IN (
            SELECT p.id FROM public.projects p 
            WHERE p.user_id = auth.uid() 
            OR p.id IN (
                SELECT pac.project_id FROM public.project_access_control pac 
                WHERE pac.user_id = auth.uid() AND pac.is_active = true
            )
        )
    );

CREATE POLICY "Users can manage project tags for owned projects" ON public.project_tags
    FOR ALL USING (
        project_id IN (
            SELECT p.id FROM public.projects p WHERE p.user_id = auth.uid()
        )
    );

-- 10. Create RLS policies for content_tags
CREATE POLICY "Users can view content tags for accessible content" ON public.content_tags
    FOR SELECT USING (
        content_id IN (
            SELECT gc.id FROM public.generated_content gc
            JOIN public.projects p ON gc.project_id = p.id
            WHERE p.user_id = auth.uid()
            OR p.id IN (
                SELECT pac.project_id FROM public.project_access_control pac 
                WHERE pac.user_id = auth.uid() AND pac.is_active = true
            )
        )
    );

CREATE POLICY "Users can manage content tags for owned content" ON public.content_tags
    FOR ALL USING (
        content_id IN (
            SELECT gc.id FROM public.generated_content gc
            JOIN public.projects p ON gc.project_id = p.id
            WHERE p.user_id = auth.uid()
        )
    );

-- 11. Create RLS policies for project_access_control
CREATE POLICY "Users can view access control for owned projects" ON public.project_access_control
    FOR SELECT USING (
        project_id IN (
            SELECT p.id FROM public.projects p WHERE p.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage access control for owned projects" ON public.project_access_control
    FOR ALL USING (
        project_id IN (
            SELECT p.id FROM public.projects p WHERE p.user_id = auth.uid()
        )
    );

-- 12. Create RLS policies for content_calendar
CREATE POLICY "Users can view calendar for accessible projects" ON public.content_calendar
    FOR SELECT USING (
        project_id IN (
            SELECT p.id FROM public.projects p 
            WHERE p.user_id = auth.uid() 
            OR p.id IN (
                SELECT pac.project_id FROM public.project_access_control pac 
                WHERE pac.user_id = auth.uid() AND pac.is_active = true
            )
        )
    );

CREATE POLICY "Users can manage calendar for owned projects" ON public.content_calendar
    FOR ALL USING (
        project_id IN (
            SELECT p.id FROM public.projects p WHERE p.user_id = auth.uid()
        )
    );

-- 13. Create RLS policies for project_metrics
CREATE POLICY "Users can view metrics for accessible projects" ON public.project_metrics
    FOR SELECT USING (
        project_id IN (
            SELECT p.id FROM public.projects p 
            WHERE p.user_id = auth.uid() 
            OR p.id IN (
                SELECT pac.project_id FROM public.project_access_control pac 
                WHERE pac.user_id = auth.uid() AND pac.is_active = true
            )
        )
    );

CREATE POLICY "System can update project metrics" ON public.project_metrics
    FOR ALL USING (true); -- Allow system updates for metrics calculation

-- 14. Create function to update project metrics
CREATE OR REPLACE FUNCTION update_project_metrics(project_uuid UUID)
RETURNS void AS $$
BEGIN
    INSERT INTO public.project_metrics (
        project_id,
        total_content_pieces,
        completed_content_pieces,
        average_seo_score,
        average_word_count,
        last_activity_at,
        calculated_at
    )
    SELECT 
        project_uuid,
        COUNT(*) as total_content_pieces,
        COUNT(*) FILTER (WHERE status = 'published') as completed_content_pieces,
        COALESCE(AVG(seo_score), 0) as average_seo_score,
        COALESCE(AVG(word_count), 0) as average_word_count,
        MAX(updated_at) as last_activity_at,
        NOW() as calculated_at
    FROM public.generated_content 
    WHERE project_id = project_uuid
    ON CONFLICT (project_id) 
    DO UPDATE SET
        total_content_pieces = EXCLUDED.total_content_pieces,
        completed_content_pieces = EXCLUDED.completed_content_pieces,
        average_seo_score = EXCLUDED.average_seo_score,
        average_word_count = EXCLUDED.average_word_count,
        last_activity_at = EXCLUDED.last_activity_at,
        calculated_at = EXCLUDED.calculated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15. Create trigger to auto-update project metrics
CREATE OR REPLACE FUNCTION trigger_update_project_metrics()
RETURNS trigger AS $$
BEGIN
    PERFORM update_project_metrics(COALESCE(NEW.project_id, OLD.project_id));
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_project_metrics_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.generated_content
    FOR EACH ROW EXECUTE FUNCTION trigger_update_project_metrics();
