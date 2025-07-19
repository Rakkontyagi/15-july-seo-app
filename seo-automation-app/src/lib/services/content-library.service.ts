/**
 * Content Library Service
 * Handles content storage, search, filtering, and organization
 */

import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { 
  GeneratedContent, 
  ContentTag, 
  TABLE_NAMES 
} from '../database/schema';
import { createServiceLogger } from '../logging/logger';

const logger = createServiceLogger('content-library-service');

// Search and filter schemas
const ContentSearchSchema = z.object({
  query: z.string().optional(),
  project_id: z.string().uuid().optional(),
  client_name: z.string().optional(),
  campaign_name: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  content_type: z.enum(['article', 'blog', 'product', 'landing']).optional(),
  min_word_count: z.number().optional(),
  max_word_count: z.number().optional(),
  min_seo_score: z.number().optional(),
  max_seo_score: z.number().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  sort_by: z.enum(['created_at', 'updated_at', 'title', 'seo_score', 'word_count']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

const AddContentTagSchema = z.object({
  content_id: z.string().uuid(),
  tag_name: z.string().min(1).max(50),
  tag_color: z.string().regex(/^#[0-9A-F]{6}$/i).default('#3B82F6'),
});

export interface ContentSearchResult {
  content: GeneratedContent[];
  total_count: number;
  has_more: boolean;
  filters_applied: string[];
}

export interface ContentLibraryStats {
  total_content: number;
  published_content: number;
  draft_content: number;
  archived_content: number;
  average_seo_score: number;
  average_word_count: number;
  content_by_type: Record<string, number>;
  content_by_client: Record<string, number>;
  content_by_campaign: Record<string, number>;
  recent_activity: GeneratedContent[];
}

export class ContentLibraryService {
  private supabase;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Search and filter content with advanced capabilities
   */
  async searchContent(userId: string, searchParams: z.infer<typeof ContentSearchSchema>): Promise<ContentSearchResult> {
    try {
      const params = ContentSearchSchema.parse(searchParams);
      
      // Build the query
      let query = this.supabase
        .from(TABLE_NAMES.GENERATED_CONTENT)
        .select(`
          *,
          projects!inner (
            id,
            name,
            client_name,
            campaign_name,
            category,
            user_id
          )
        `, { count: 'exact' });

      // Apply user access filter
      query = query.or(`projects.user_id.eq.${userId},projects.id.in.(${await this.getAccessibleProjectIds(userId)})`);

      const filtersApplied: string[] = [];

      // Apply text search
      if (params.query) {
        query = query.or(`title.ilike.%${params.query}%,content.ilike.%${params.query}%,keywords.cs.{${params.query}}`);
        filtersApplied.push(`text: "${params.query}"`);
      }

      // Apply project filter
      if (params.project_id) {
        query = query.eq('project_id', params.project_id);
        filtersApplied.push('project');
      }

      // Apply client filter
      if (params.client_name) {
        query = query.eq('projects.client_name', params.client_name);
        filtersApplied.push(`client: ${params.client_name}`);
      }

      // Apply campaign filter
      if (params.campaign_name) {
        query = query.eq('projects.campaign_name', params.campaign_name);
        filtersApplied.push(`campaign: ${params.campaign_name}`);
      }

      // Apply category filter
      if (params.category) {
        query = query.eq('projects.category', params.category);
        filtersApplied.push(`category: ${params.category}`);
      }

      // Apply status filter
      if (params.status) {
        query = query.eq('status', params.status);
        filtersApplied.push(`status: ${params.status}`);
      }

      // Apply content type filter
      if (params.content_type) {
        query = query.eq('content_type', params.content_type);
        filtersApplied.push(`type: ${params.content_type}`);
      }

      // Apply word count filters
      if (params.min_word_count) {
        query = query.gte('word_count', params.min_word_count);
        filtersApplied.push(`min words: ${params.min_word_count}`);
      }
      if (params.max_word_count) {
        query = query.lte('word_count', params.max_word_count);
        filtersApplied.push(`max words: ${params.max_word_count}`);
      }

      // Apply SEO score filters
      if (params.min_seo_score) {
        query = query.gte('seo_score', params.min_seo_score);
        filtersApplied.push(`min SEO: ${params.min_seo_score}`);
      }
      if (params.max_seo_score) {
        query = query.lte('seo_score', params.max_seo_score);
        filtersApplied.push(`max SEO: ${params.max_seo_score}`);
      }

      // Apply date filters
      if (params.date_from) {
        query = query.gte('created_at', params.date_from);
        filtersApplied.push(`from: ${params.date_from}`);
      }
      if (params.date_to) {
        query = query.lte('created_at', params.date_to);
        filtersApplied.push(`to: ${params.date_to}`);
      }

      // Apply tag filter if specified
      if (params.tags && params.tags.length > 0) {
        const contentIdsWithTags = await this.getContentIdsByTags(params.tags);
        if (contentIdsWithTags.length > 0) {
          query = query.in('id', contentIdsWithTags);
          filtersApplied.push(`tags: ${params.tags.join(', ')}`);
        } else {
          // No content matches the tags, return empty result
          return {
            content: [],
            total_count: 0,
            has_more: false,
            filters_applied: filtersApplied,
          };
        }
      }

      // Apply sorting
      query = query.order(params.sort_by, { ascending: params.sort_order === 'asc' });

      // Apply pagination
      query = query.range(params.offset, params.offset + params.limit - 1);

      const { data, error, count } = await query;

      if (error) {
        logger.error('Failed to search content:', error);
        throw new Error(`Failed to search content: ${error.message}`);
      }

      const totalCount = count || 0;
      const hasMore = params.offset + params.limit < totalCount;

      logger.info('Content search completed:', { 
        userId, 
        resultsCount: data?.length || 0, 
        totalCount,
        filtersApplied: filtersApplied.length 
      });

      return {
        content: data || [],
        total_count: totalCount,
        has_more: hasMore,
        filters_applied: filtersApplied,
      };
    } catch (error) {
      logger.error('Error searching content:', error);
      throw error;
    }
  }

  /**
   * Get content library statistics
   */
  async getLibraryStats(userId: string): Promise<ContentLibraryStats> {
    try {
      // Get basic content stats
      const { data: contentStats, error: statsError } = await this.supabase
        .from(TABLE_NAMES.GENERATED_CONTENT)
        .select(`
          status,
          content_type,
          seo_score,
          word_count,
          created_at,
          projects!inner (
            client_name,
            campaign_name,
            user_id
          )
        `)
        .or(`projects.user_id.eq.${userId},projects.id.in.(${await this.getAccessibleProjectIds(userId)})`);

      if (statsError) {
        logger.error('Failed to fetch content stats:', statsError);
        throw new Error(`Failed to fetch content stats: ${statsError.message}`);
      }

      // Get recent activity
      const { data: recentContent, error: recentError } = await this.supabase
        .from(TABLE_NAMES.GENERATED_CONTENT)
        .select(`
          *,
          projects!inner (
            name,
            client_name,
            campaign_name,
            user_id
          )
        `)
        .or(`projects.user_id.eq.${userId},projects.id.in.(${await this.getAccessibleProjectIds(userId)})`)
        .order('updated_at', { ascending: false })
        .limit(10);

      if (recentError) {
        logger.error('Failed to fetch recent content:', recentError);
        throw new Error(`Failed to fetch recent content: ${recentError.message}`);
      }

      // Process statistics
      const stats: ContentLibraryStats = {
        total_content: contentStats?.length || 0,
        published_content: contentStats?.filter(c => c.status === 'published').length || 0,
        draft_content: contentStats?.filter(c => c.status === 'draft').length || 0,
        archived_content: contentStats?.filter(c => c.status === 'archived').length || 0,
        average_seo_score: this.calculateAverage(contentStats?.map(c => c.seo_score).filter(Boolean) || []),
        average_word_count: this.calculateAverage(contentStats?.map(c => c.word_count).filter(Boolean) || []),
        content_by_type: this.groupByField(contentStats || [], 'content_type'),
        content_by_client: this.groupByField(contentStats || [], 'projects.client_name'),
        content_by_campaign: this.groupByField(contentStats || [], 'projects.campaign_name'),
        recent_activity: recentContent || [],
      };

      logger.info('Content library stats calculated:', { userId, totalContent: stats.total_content });
      return stats;
    } catch (error) {
      logger.error('Error calculating library stats:', error);
      throw error;
    }
  }

  /**
   * Add tag to content
   */
  async addContentTag(tagData: z.infer<typeof AddContentTagSchema>): Promise<ContentTag> {
    try {
      const validatedData = AddContentTagSchema.parse(tagData);
      
      const { data, error } = await this.supabase
        .from(TABLE_NAMES.CONTENT_TAGS)
        .insert(validatedData)
        .select()
        .single();

      if (error) {
        logger.error('Failed to add content tag:', error);
        throw new Error(`Failed to add content tag: ${error.message}`);
      }

      logger.info('Content tag added successfully:', { contentId: tagData.content_id, tagName: tagData.tag_name });
      return data;
    } catch (error) {
      logger.error('Error adding content tag:', error);
      throw error;
    }
  }

  /**
   * Get content tags
   */
  async getContentTags(contentId: string): Promise<ContentTag[]> {
    try {
      const { data, error } = await this.supabase
        .from(TABLE_NAMES.CONTENT_TAGS)
        .select('*')
        .eq('content_id', contentId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Failed to fetch content tags:', error);
        throw new Error(`Failed to fetch content tags: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      logger.error('Error fetching content tags:', error);
      throw error;
    }
  }

  /**
   * Remove content tag
   */
  async removeContentTag(contentId: string, tagName: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from(TABLE_NAMES.CONTENT_TAGS)
        .delete()
        .eq('content_id', contentId)
        .eq('tag_name', tagName);

      if (error) {
        logger.error('Failed to remove content tag:', error);
        throw new Error(`Failed to remove content tag: ${error.message}`);
      }

      logger.info('Content tag removed successfully:', { contentId, tagName });
    } catch (error) {
      logger.error('Error removing content tag:', error);
      throw error;
    }
  }

  /**
   * Get all unique tags for user's content
   */
  async getAllContentTags(userId: string): Promise<{ tag_name: string; count: number; tag_color: string }[]> {
    try {
      const { data, error } = await this.supabase
        .from(TABLE_NAMES.CONTENT_TAGS)
        .select(`
          tag_name,
          tag_color,
          generated_content!inner (
            projects!inner (
              user_id
            )
          )
        `)
        .eq('generated_content.projects.user_id', userId);

      if (error) {
        logger.error('Failed to fetch all content tags:', error);
        throw new Error(`Failed to fetch all content tags: ${error.message}`);
      }

      // Group and count tags
      const tagCounts: { [key: string]: { count: number; color: string } } = {};
      data?.forEach(item => {
        if (!tagCounts[item.tag_name]) {
          tagCounts[item.tag_name] = { count: 0, color: item.tag_color };
        }
        tagCounts[item.tag_name].count++;
      });

      return Object.entries(tagCounts).map(([tag_name, { count, color }]) => ({
        tag_name,
        count,
        tag_color: color,
      }));
    } catch (error) {
      logger.error('Error fetching all content tags:', error);
      throw error;
    }
  }

  // Private helper methods
  private async getAccessibleProjectIds(userId: string): Promise<string> {
    try {
      const { data, error } = await this.supabase
        .from(TABLE_NAMES.PROJECT_ACCESS_CONTROL)
        .select('project_id')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) {
        logger.error('Failed to fetch accessible project IDs:', error);
        return '';
      }

      return data?.map(item => item.project_id).join(',') || '';
    } catch (error) {
      logger.error('Error fetching accessible project IDs:', error);
      return '';
    }
  }

  private async getContentIdsByTags(tags: string[]): Promise<string[]> {
    try {
      const { data, error } = await this.supabase
        .from(TABLE_NAMES.CONTENT_TAGS)
        .select('content_id')
        .in('tag_name', tags);

      if (error) {
        logger.error('Failed to fetch content IDs by tags:', error);
        return [];
      }

      return data?.map(item => item.content_id) || [];
    } catch (error) {
      logger.error('Error fetching content IDs by tags:', error);
      return [];
    }
  }

  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return Math.round((numbers.reduce((sum, num) => sum + num, 0) / numbers.length) * 100) / 100;
  }

  private groupByField(items: any[], field: string): Record<string, number> {
    const groups: Record<string, number> = {};
    items.forEach(item => {
      const value = this.getNestedValue(item, field) || 'Uncategorized';
      groups[value] = (groups[value] || 0) + 1;
    });
    return groups;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}
