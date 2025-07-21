/**
 * Database types for Supabase
 * Generated based on the database schema
 */

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          subscription_tier: 'free' | 'basic' | 'pro' | 'enterprise';
          subscription_status: 'active' | 'cancelled' | 'expired';
          subscription_ends_at: string | null;
          usage_count: number;
          usage_limit: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          subscription_tier?: 'free' | 'basic' | 'pro' | 'enterprise';
          subscription_status?: 'active' | 'cancelled' | 'expired';
          subscription_ends_at?: string | null;
          usage_count?: number;
          usage_limit?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          subscription_tier?: 'free' | 'basic' | 'pro' | 'enterprise';
          subscription_status?: 'active' | 'cancelled' | 'expired';
          subscription_ends_at?: string | null;
          usage_count?: number;
          usage_limit?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          target_keywords: string[];
          target_country: string;
          target_language: string;
          domain_url: string | null;
          settings: Record<string, any>;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          target_keywords?: string[];
          target_country?: string;
          target_language?: string;
          domain_url?: string | null;
          settings?: Record<string, any>;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          target_keywords?: string[];
          target_country?: string;
          target_language?: string;
          domain_url?: string | null;
          settings?: Record<string, any>;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      generated_content: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          title: string;
          content: string;
          meta_description: string | null;
          keywords: string[];
          content_type: 'article' | 'blog' | 'product' | 'landing';
          word_count: number | null;
          seo_score: number | null;
          status: 'draft' | 'published' | 'archived';
          metadata: Record<string, any>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          title: string;
          content: string;
          meta_description?: string | null;
          keywords?: string[];
          content_type?: 'article' | 'blog' | 'product' | 'landing';
          word_count?: number | null;
          seo_score?: number | null;
          status?: 'draft' | 'published' | 'archived';
          metadata?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          title?: string;
          content?: string;
          meta_description?: string | null;
          keywords?: string[];
          content_type?: 'article' | 'blog' | 'product' | 'landing';
          word_count?: number | null;
          seo_score?: number | null;
          status?: 'draft' | 'published' | 'archived';
          metadata?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
      };
      serp_analysis: {
        Row: {
          id: string;
          keyword: string;
          country: string;
          language: string;
          search_engine: string;
          results: Record<string, any>;
          total_results: number | null;
          analysis_metadata: Record<string, any>;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          keyword: string;
          country: string;
          language?: string;
          search_engine?: string;
          results: Record<string, any>;
          total_results?: number | null;
          analysis_metadata?: Record<string, any>;
          expires_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          keyword?: string;
          country?: string;
          language?: string;
          search_engine?: string;
          results?: Record<string, any>;
          total_results?: number | null;
          analysis_metadata?: Record<string, any>;
          expires_at?: string;
          created_at?: string;
        };
      };
      competitor_analysis: {
        Row: {
          id: string;
          url: string;
          keyword: string;
          title: string | null;
          meta_description: string | null;
          content_preview: string | null;
          word_count: number | null;
          headings: Array<any>;
          internal_links: Array<any>;
          external_links: Array<any>;
          images: Array<any>;
          analysis_data: Record<string, any>;
          scraped_at: string;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          url: string;
          keyword: string;
          title?: string | null;
          meta_description?: string | null;
          content_preview?: string | null;
          word_count?: number | null;
          headings?: Array<any>;
          internal_links?: Array<any>;
          external_links?: Array<any>;
          images?: Array<any>;
          analysis_data?: Record<string, any>;
          scraped_at?: string;
          expires_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          url?: string;
          keyword?: string;
          title?: string | null;
          meta_description?: string | null;
          content_preview?: string | null;
          word_count?: number | null;
          headings?: Array<any>;
          internal_links?: Array<any>;
          external_links?: Array<any>;
          images?: Array<any>;
          analysis_data?: Record<string, any>;
          scraped_at?: string;
          expires_at?: string;
          created_at?: string;
        };
      };
      usage_analytics: {
        Row: {
          id: string;
          user_id: string;
          action_type: 'content_generation' | 'serp_analysis' | 'competitor_analysis' | 'export';
          resource_id: string | null;
          metadata: Record<string, any>;
          tokens_used: number;
          processing_time_ms: number | null;
          success: boolean;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          action_type: 'content_generation' | 'serp_analysis' | 'competitor_analysis' | 'export';
          resource_id?: string | null;
          metadata?: Record<string, any>;
          tokens_used?: number;
          processing_time_ms?: number | null;
          success?: boolean;
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          action_type?: 'content_generation' | 'serp_analysis' | 'competitor_analysis' | 'export';
          resource_id?: string | null;
          metadata?: Record<string, any>;
          tokens_used?: number;
          processing_time_ms?: number | null;
          success?: boolean;
          error_message?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Utility types for easy access
export type User = Database['public']['Tables']['users']['Row'];
export type Project = Database['public']['Tables']['projects']['Row'];
export type GeneratedContent = Database['public']['Tables']['generated_content']['Row'];
export type SerpAnalysis = Database['public']['Tables']['serp_analysis']['Row'];
export type CompetitorAnalysis = Database['public']['Tables']['competitor_analysis']['Row'];
export type UsageAnalytics = Database['public']['Tables']['usage_analytics']['Row'];

// Insert types
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
export type GeneratedContentInsert = Database['public']['Tables']['generated_content']['Insert'];
export type SerpAnalysisInsert = Database['public']['Tables']['serp_analysis']['Insert'];
export type CompetitorAnalysisInsert = Database['public']['Tables']['competitor_analysis']['Insert'];
export type UsageAnalyticsInsert = Database['public']['Tables']['usage_analytics']['Insert'];

// Update types
export type UserUpdate = Database['public']['Tables']['users']['Update'];
export type ProjectUpdate = Database['public']['Tables']['projects']['Update'];
export type GeneratedContentUpdate = Database['public']['Tables']['generated_content']['Update'];
export type SerpAnalysisUpdate = Database['public']['Tables']['serp_analysis']['Update'];
export type CompetitorAnalysisUpdate = Database['public']['Tables']['competitor_analysis']['Update'];
export type UsageAnalyticsUpdate = Database['public']['Tables']['usage_analytics']['Update'];

// Enum types
export type SubscriptionTier = 'free' | 'basic' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired';
export type ContentType = 'article' | 'blog' | 'product' | 'landing';
export type ContentStatus = 'draft' | 'published' | 'archived';
export type ActionType = 'content_generation' | 'serp_analysis' | 'competitor_analysis' | 'export';

// Helper types for common operations
export type CreateUserProfile = Omit<UserInsert, 'id' | 'created_at' | 'updated_at'>;
export type CreateProject = Omit<ProjectInsert, 'id' | 'created_at' | 'updated_at'>;
export type CreateContent = Omit<GeneratedContentInsert, 'id' | 'created_at' | 'updated_at'>;
export type LogUsage = Omit<UsageAnalyticsInsert, 'id' | 'created_at'>;

// Response types for API operations
export interface DatabaseResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface DatabaseListResponse<T> {
  data: T[];
  error: string | null;
  success: boolean;
  count?: number;
}

export interface DatabaseHealthCheck {
  healthy: boolean;
  timestamp: string;
  error?: string;
}

export interface TableStatus {
  table: string;
  exists: boolean;
  error: string | null;
}

// Subscription and usage types
export interface SubscriptionInfo {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  ends_at: string | null;
  usage_count: number;
  usage_limit: number;
}

export interface UsageQuota {
  canUse: boolean;
  remaining: number;
  percentage: number;
}

export interface UsageStats {
  totalActions: number;
  totalTokens: number;
  actionsByType: Record<ActionType, number>;
  avgProcessingTime: number;
  successRate: number;
}

// Real-time event types
export interface RealtimeEvent<T> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T | null;
  old: T | null;
  table: string;
  commit_timestamp: string;
}

export interface RealtimeSubscription {
  id: string;
  table: string;
  event: string;
  callback: (event: RealtimeEvent<any>) => void;
}