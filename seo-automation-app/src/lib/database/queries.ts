/**
 * Database query functions and utilities
 * Provides type-safe database operations using Supabase
 */

import { createClient } from '@supabase/supabase-js';
import { 
  User, 
  Project, 
  GeneratedContent, 
  SerpAnalysis, 
  CompetitorAnalysis, 
  UsageAnalytics 
} from './schema';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// User operations
export const userQueries = {
  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data;
  },

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, updates: Partial<User>): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user profile:', error);
      return null;
    }

    return data;
  },

  /**
   * Increment user usage count
   */
  async incrementUsageCount(userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('users')
      .update({ 
        usage_count: supabase.raw('usage_count + 1') 
      })
      .eq('id', userId);

    if (error) {
      console.error('Error incrementing usage count:', error);
      return false;
    }

    return true;
  },

  /**
   * Check if user has remaining usage quota
   */
  async checkUsageQuota(userId: string): Promise<{ canUse: boolean; remaining: number }> {
    const user = await this.getUserProfile(userId);
    
    if (!user) {
      return { canUse: false, remaining: 0 };
    }

    const remaining = user.usage_limit - user.usage_count;
    return {
      canUse: remaining > 0,
      remaining: Math.max(0, remaining)
    };
  }
};

// Project operations
export const projectQueries = {
  /**
   * Get all projects for a user
   */
  async getUserProjects(userId: string): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user projects:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Create a new project
   */
  async createProject(project: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<Project | null> {
    const { data, error } = await supabase
      .from('projects')
      .insert(project)
      .select()
      .single();

    if (error) {
      console.error('Error creating project:', error);
      return null;
    }

    return data;
  },

  /**
   * Update project
   */
  async updateProject(projectId: string, updates: Partial<Project>): Promise<Project | null> {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId)
      .select()
      .single();

    if (error) {
      console.error('Error updating project:', error);
      return null;
    }

    return data;
  },

  /**
   * Delete project (soft delete)
   */
  async deleteProject(projectId: string): Promise<boolean> {
    const { error } = await supabase
      .from('projects')
      .update({ is_active: false })
      .eq('id', projectId);

    if (error) {
      console.error('Error deleting project:', error);
      return false;
    }

    return true;
  }
};

// Content operations
export const contentQueries = {
  /**
   * Get content for a project
   */
  async getProjectContent(projectId: string): Promise<GeneratedContent[]> {
    const { data, error } = await supabase
      .from('generated_content')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching project content:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Create new content
   */
  async createContent(content: Omit<GeneratedContent, 'id' | 'created_at' | 'updated_at'>): Promise<GeneratedContent | null> {
    const { data, error } = await supabase
      .from('generated_content')
      .insert(content)
      .select()
      .single();

    if (error) {
      console.error('Error creating content:', error);
      return null;
    }

    return data;
  },

  /**
   * Update content
   */
  async updateContent(contentId: string, updates: Partial<GeneratedContent>): Promise<GeneratedContent | null> {
    const { data, error } = await supabase
      .from('generated_content')
      .update(updates)
      .eq('id', contentId)
      .select()
      .single();

    if (error) {
      console.error('Error updating content:', error);
      return null;
    }

    return data;
  },

  /**
   * Get content by user
   */
  async getUserContent(userId: string): Promise<GeneratedContent[]> {
    const { data, error } = await supabase
      .from('generated_content')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user content:', error);
      return [];
    }

    return data || [];
  }
};

// SERP analysis operations
export const serpQueries = {
  /**
   * Get cached SERP analysis
   */
  async getCachedSerpAnalysis(keyword: string, country: string, language: string = 'en'): Promise<SerpAnalysis | null> {
    const { data, error } = await supabase
      .from('serp_analysis')
      .select('*')
      .eq('keyword', keyword)
      .eq('country', country)
      .eq('language', language)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error) {
      return null;
    }

    return data;
  },

  /**
   * Cache SERP analysis results
   */
  async cacheSerpAnalysis(analysis: Omit<SerpAnalysis, 'id' | 'created_at'>): Promise<SerpAnalysis | null> {
    const { data, error } = await supabase
      .from('serp_analysis')
      .upsert(analysis, { onConflict: 'keyword,country,language,search_engine' })
      .select()
      .single();

    if (error) {
      console.error('Error caching SERP analysis:', error);
      return null;
    }

    return data;
  },

  /**
   * Clean expired SERP analysis
   */
  async cleanExpiredSerpAnalysis(): Promise<boolean> {
    const { error } = await supabase
      .from('serp_analysis')
      .delete()
      .lt('expires_at', new Date().toISOString());

    if (error) {
      console.error('Error cleaning expired SERP analysis:', error);
      return false;
    }

    return true;
  }
};

// Competitor analysis operations
export const competitorQueries = {
  /**
   * Get cached competitor analysis
   */
  async getCachedCompetitorAnalysis(url: string, keyword: string): Promise<CompetitorAnalysis | null> {
    const { data, error } = await supabase
      .from('competitor_analysis')
      .select('*')
      .eq('url', url)
      .eq('keyword', keyword)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error) {
      return null;
    }

    return data;
  },

  /**
   * Cache competitor analysis results
   */
  async cacheCompetitorAnalysis(analysis: Omit<CompetitorAnalysis, 'id' | 'created_at'>): Promise<CompetitorAnalysis | null> {
    const { data, error } = await supabase
      .from('competitor_analysis')
      .upsert(analysis, { onConflict: 'url,keyword' })
      .select()
      .single();

    if (error) {
      console.error('Error caching competitor analysis:', error);
      return null;
    }

    return data;
  },

  /**
   * Get competitor analysis by keyword
   */
  async getCompetitorAnalysisByKeyword(keyword: string): Promise<CompetitorAnalysis[]> {
    const { data, error } = await supabase
      .from('competitor_analysis')
      .select('*')
      .eq('keyword', keyword)
      .gt('expires_at', new Date().toISOString())
      .order('scraped_at', { ascending: false });

    if (error) {
      console.error('Error fetching competitor analysis:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Clean expired competitor analysis
   */
  async cleanExpiredCompetitorAnalysis(): Promise<boolean> {
    const { error } = await supabase
      .from('competitor_analysis')
      .delete()
      .lt('expires_at', new Date().toISOString());

    if (error) {
      console.error('Error cleaning expired competitor analysis:', error);
      return false;
    }

    return true;
  }
};

// Usage analytics operations
export const analyticsQueries = {
  /**
   * Log user action
   */
  async logUserAction(analytics: Omit<UsageAnalytics, 'id' | 'created_at'>): Promise<UsageAnalytics | null> {
    const { data, error } = await supabase
      .from('usage_analytics')
      .insert(analytics)
      .select()
      .single();

    if (error) {
      console.error('Error logging user action:', error);
      return null;
    }

    return data;
  },

  /**
   * Get user usage analytics
   */
  async getUserAnalytics(userId: string, limit: number = 100): Promise<UsageAnalytics[]> {
    const { data, error } = await supabase
      .from('usage_analytics')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching user analytics:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Get usage statistics for a user
   */
  async getUserUsageStats(userId: string): Promise<{
    totalActions: number;
    totalTokens: number;
    actionsByType: Record<string, number>;
    avgProcessingTime: number;
    successRate: number;
  }> {
    const analytics = await this.getUserAnalytics(userId, 1000);

    const totalActions = analytics.length;
    const totalTokens = analytics.reduce((sum, a) => sum + a.tokens_used, 0);
    const actionsByType = analytics.reduce((acc, a) => {
      acc[a.action_type] = (acc[a.action_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const processingTimes = analytics
      .filter(a => a.processing_time_ms !== null)
      .map(a => a.processing_time_ms!);
    const avgProcessingTime = processingTimes.length > 0 
      ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length 
      : 0;

    const successCount = analytics.filter(a => a.success).length;
    const successRate = totalActions > 0 ? successCount / totalActions : 0;

    return {
      totalActions,
      totalTokens,
      actionsByType,
      avgProcessingTime,
      successRate
    };
  }
};

// Health check and maintenance
export const maintenanceQueries = {
  /**
   * Health check - verify database connectivity
   */
  async healthCheck(): Promise<{ isHealthy: boolean; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1);

      if (error) {
        return { isHealthy: false, error: error.message };
      }

      return { isHealthy: true };
    } catch (error) {
      return { 
        isHealthy: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  },

  /**
   * Clean expired data
   */
  async cleanExpiredData(): Promise<boolean> {
    try {
      const serpCleanup = await serpQueries.cleanExpiredSerpAnalysis();
      const competitorCleanup = await competitorQueries.cleanExpiredCompetitorAnalysis();

      return serpCleanup && competitorCleanup;
    } catch (error) {
      console.error('Error cleaning expired data:', error);
      return false;
    }
  }
};