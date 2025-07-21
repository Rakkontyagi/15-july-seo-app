/**
 * Database schema definitions and types
 * This file contains TypeScript types that match the database schema
 */

// User profile with subscription information
export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  subscription_tier: 'free' | 'basic' | 'pro' | 'enterprise';
  subscription_status: 'active' | 'cancelled' | 'expired';
  subscription_ends_at?: string;
  usage_count: number;
  usage_limit: number;
  created_at: string;
  updated_at: string;
}

// Content project organization with client/campaign support
export interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  client_name?: string;
  campaign_name?: string;
  category?: string;
  status: 'active' | 'completed' | 'on_hold' | 'archived';
  due_date?: string;
  completion_percentage: number;
  target_keywords: string[];
  target_country: string;
  target_language: string;
  domain_url?: string;
  settings: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Generated SEO content with metrics
export interface GeneratedContent {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  content: string;
  meta_description?: string;
  keywords: string[];
  content_type: 'article' | 'blog' | 'product' | 'landing';
  word_count?: number;
  seo_score?: number;
  status: 'draft' | 'published' | 'archived';
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Cached SERP analysis results
export interface SerpAnalysis {
  id: string;
  keyword: string;
  country: string;
  language: string;
  search_engine: string;
  results: Record<string, any>;
  total_results?: number;
  analysis_metadata: Record<string, any>;
  expires_at: string;
  created_at: string;
}

// Competitor analysis data
export interface CompetitorAnalysis {
  id: string;
  url: string;
  keyword: string;
  title?: string;
  meta_description?: string;
  content_preview?: string;
  word_count?: number;
  headings: Array<any>;
  internal_links: Array<any>;
  external_links: Array<any>;
  images: Array<any>;
  analysis_data: Record<string, any>;
  scraped_at: string;
  expires_at: string;
  created_at: string;
}

// Usage analytics tracking
export interface UsageAnalytics {
  id: string;
  user_id: string;
  action_type: 'content_generation' | 'serp_analysis' | 'competitor_analysis' | 'export';
  resource_id?: string;
  metadata: Record<string, any>;
  tokens_used: number;
  processing_time_ms?: number;
  success: boolean;
  error_message?: string;
  created_at: string;
}

// Project tag system
export interface ProjectTag {
  id: string;
  project_id: string;
  tag_name: string;
  tag_color: string;
  created_at: string;
}

// Content tag system
export interface ContentTag {
  id: string;
  content_id: string;
  tag_name: string;
  tag_color: string;
  created_at: string;
}

// Project access control for client sharing
export interface ProjectAccessControl {
  id: string;
  project_id: string;
  user_id?: string;
  email?: string;
  role: 'owner' | 'editor' | 'viewer';
  permissions: Record<string, any>;
  invited_by?: string;
  invited_at: string;
  accepted_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Content calendar for scheduling
export interface ContentCalendar {
  id: string;
  project_id: string;
  content_id?: string;
  title: string;
  description?: string;
  scheduled_date: string;
  status: 'planned' | 'in_progress' | 'published' | 'cancelled';
  platform?: string;
  metadata: Record<string, any>;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// Project metrics for progress tracking
export interface ProjectMetrics {
  id: string;
  project_id: string;
  total_content_pieces: number;
  completed_content_pieces: number;
  average_seo_score: number;
  average_word_count: number;
  last_activity_at?: string;
  calculated_at: string;
}

// Content performance tracking
export interface ContentPerformance {
  id: string;
  content_id: string;
  project_id: string;
  user_id: string;
  target_keyword: string;
  current_rank?: number;
  previous_rank?: number;
  rank_change: number;
  search_engine: string;
  location: string;
  organic_traffic: number;
  organic_clicks: number;
  impressions: number;
  ctr: number;
  average_position?: number;
  bounce_rate?: number;
  time_on_page?: number;
  pages_per_session?: number;
  conversion_rate?: number;
  conversions: number;
  tracking_date: string;
  data_source: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Keyword ranking history
export interface KeywordRankingHistory {
  id: string;
  content_id?: string;
  project_id: string;
  user_id: string;
  keyword: string;
  rank_position?: number;
  search_volume?: number;
  difficulty_score?: number;
  search_engine: string;
  location: string;
  device: 'desktop' | 'mobile' | 'tablet';
  tracked_date: string;
  rank_change_1d: number;
  rank_change_7d: number;
  rank_change_30d: number;
  top_competitor_url?: string;
  competitor_rank?: number;
  created_at: string;
}

// Traffic analytics
export interface TrafficAnalytics {
  id: string;
  content_id?: string;
  project_id: string;
  user_id: string;
  organic_traffic: number;
  direct_traffic: number;
  referral_traffic: number;
  social_traffic: number;
  paid_traffic: number;
  page_views: number;
  unique_visitors: number;
  sessions: number;
  avg_session_duration: number;
  bounce_rate: number;
  goal_completions: number;
  goal_conversion_rate: number;
  revenue: number;
  top_countries: any[];
  device_breakdown: Record<string, any>;
  date_range_start: string;
  date_range_end: string;
  data_source: string;
  created_at: string;
  updated_at: string;
}

// Competitor performance comparison
export interface CompetitorPerformance {
  id: string;
  content_id: string;
  project_id: string;
  user_id: string;
  competitor_url: string;
  competitor_domain: string;
  competitor_title?: string;
  our_rank?: number;
  competitor_rank?: number;
  rank_difference?: number;
  keyword: string;
  our_word_count?: number;
  competitor_word_count?: number;
  our_seo_score?: number;
  competitor_seo_score?: number;
  our_traffic_estimate?: number;
  competitor_traffic_estimate?: number;
  our_backlinks: number;
  competitor_backlinks: number;
  competitive_advantage: Record<string, any>;
  improvement_opportunities: any[];
  analysis_date: string;
  created_at: string;
}

// Content ROI data
export interface ContentROIData {
  id: string;
  content_id: string;
  project_id: string;
  user_id: string;
  content_creation_cost: number;
  promotion_cost: number;
  total_investment: number;
  direct_revenue: number;
  attributed_revenue: number;
  estimated_revenue: number;
  organic_traffic_value: number;
  conversion_value: number;
  brand_awareness_value: number;
  roi_percentage: number;
  payback_period_days?: number;
  lifetime_value: number;
  time_saved_hours: number;
  time_saved_value: number;
  calculation_date: string;
  calculation_method: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Automated reports
export interface AutomatedReport {
  id: string;
  user_id: string;
  project_id?: string;
  report_name: string;
  report_type: 'weekly' | 'monthly' | 'quarterly' | 'custom';
  report_format: 'pdf' | 'html' | 'json' | 'csv';
  schedule_enabled: boolean;
  schedule_frequency: 'weekly' | 'monthly' | 'quarterly';
  schedule_day_of_week?: number;
  schedule_day_of_month?: number;
  next_run_date?: string;
  include_performance_metrics: boolean;
  include_traffic_analytics: boolean;
  include_keyword_rankings: boolean;
  include_competitor_analysis: boolean;
  include_roi_calculations: boolean;
  email_recipients: string[];
  webhook_url?: string;
  last_generated_at?: string;
  last_report_data?: Record<string, any>;
  generation_status: 'pending' | 'generating' | 'completed' | 'failed';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Report generation log
export interface ReportGenerationLog {
  id: string;
  report_id: string;
  user_id: string;
  generation_started_at: string;
  generation_completed_at?: string;
  generation_status: 'started' | 'completed' | 'failed';
  content_pieces_analyzed: number;
  data_points_processed: number;
  processing_time_ms?: number;
  report_file_path?: string;
  report_file_size?: number;
  report_url?: string;
  error_message?: string;
  error_details?: Record<string, any>;
  created_at: string;
}

// Database table names
export const TABLE_NAMES = {
  USERS: 'users',
  PROJECTS: 'projects',
  GENERATED_CONTENT: 'generated_content',
  SERP_ANALYSIS: 'serp_analysis',
  COMPETITOR_ANALYSIS: 'competitor_analysis',
  USAGE_ANALYTICS: 'usage_analytics',
  PROJECT_TAGS: 'project_tags',
  CONTENT_TAGS: 'content_tags',
  PROJECT_ACCESS_CONTROL: 'project_access_control',
  CONTENT_CALENDAR: 'content_calendar',
  PROJECT_METRICS: 'project_metrics',
  CONTENT_PERFORMANCE: 'content_performance',
  KEYWORD_RANKING_HISTORY: 'keyword_ranking_history',
  TRAFFIC_ANALYTICS: 'traffic_analytics',
  COMPETITOR_PERFORMANCE: 'competitor_performance',
  CONTENT_ROI_DATA: 'content_roi_data',
  AUTOMATED_REPORTS: 'automated_reports',
  REPORT_GENERATION_LOG: 'report_generation_log',
} as const;

// Database indexes for performance
export const INDEXES = {
  PROJECTS_USER_ID: 'idx_projects_user_id',
  PROJECTS_ACTIVE: 'idx_projects_active',
  GENERATED_CONTENT_PROJECT_ID: 'idx_generated_content_project_id',
  GENERATED_CONTENT_USER_ID: 'idx_generated_content_user_id',
  GENERATED_CONTENT_STATUS: 'idx_generated_content_status',
  SERP_ANALYSIS_KEYWORD_COUNTRY: 'idx_serp_analysis_keyword_country',
  SERP_ANALYSIS_EXPIRES_AT: 'idx_serp_analysis_expires_at',
  COMPETITOR_ANALYSIS_KEYWORD: 'idx_competitor_analysis_keyword',
  COMPETITOR_ANALYSIS_EXPIRES_AT: 'idx_competitor_analysis_expires_at',
  USAGE_ANALYTICS_USER_ID: 'idx_usage_analytics_user_id',
  USAGE_ANALYTICS_CREATED_AT: 'idx_usage_analytics_created_at',
} as const;

// SQL Schema Creation Statements
export const CREATE_TABLES_SQL = {
  USERS: `
    CREATE TABLE IF NOT EXISTS public.users (
      id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      full_name TEXT,
      avatar_url TEXT,
      subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'pro', 'enterprise')),
      subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'expired')),
      subscription_ends_at TIMESTAMP WITH TIME ZONE,
      usage_count INTEGER DEFAULT 0,
      usage_limit INTEGER DEFAULT 10,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `,
  
  PROJECTS: `
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
  `,
  
  GENERATED_CONTENT: `
    CREATE TABLE IF NOT EXISTS public.generated_content (
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
  `,
  
  SERP_ANALYSIS: `
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
  `,
  
  COMPETITOR_ANALYSIS: `
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
  `,
  
  USAGE_ANALYTICS: `
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
  `,
} as const;