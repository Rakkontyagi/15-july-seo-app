/**
 * Tag Management Service
 * Handles tag creation, organization, and management for projects and content
 */

import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { 
  ProjectTag, 
  ContentTag, 
  TABLE_NAMES 
} from '../database/schema';
import { createServiceLogger } from '../logging/logger';

const logger = createServiceLogger('tag-management-service');

// Validation schemas
const CreateTagSchema = z.object({
  tag_name: z.string().min(1, 'Tag name is required').max(50, 'Tag name too long'),
  tag_color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').default('#3B82F6'),
});

const BulkTagSchema = z.object({
  tag_names: z.array(z.string().min(1).max(50)).min(1, 'At least one tag required').max(10, 'Too many tags'),
  tag_color: z.string().regex(/^#[0-9A-F]{6}$/i).default('#3B82F6'),
});

export interface TagStats {
  tag_name: string;
  tag_color: string;
  project_count: number;
  content_count: number;
  last_used: string;
  created_at: string;
}

export interface TagSuggestion {
  tag_name: string;
  relevance_score: number;
  usage_count: number;
  suggested_color: string;
}

export class TagManagementService {
  private supabase;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Get all tags for a user with usage statistics
   */
  async getUserTags(userId: string): Promise<TagStats[]> {
    try {
      // Get project tags with stats
      const { data: projectTags, error: projectError } = await this.supabase
        .from(TABLE_NAMES.PROJECT_TAGS)
        .select(`
          tag_name,
          tag_color,
          created_at,
          projects!inner (
            user_id
          )
        `)
        .eq('projects.user_id', userId);

      if (projectError) {
        logger.error('Failed to fetch project tags:', projectError);
        throw new Error(`Failed to fetch project tags: ${projectError.message}`);
      }

      // Get content tags with stats
      const { data: contentTags, error: contentError } = await this.supabase
        .from(TABLE_NAMES.CONTENT_TAGS)
        .select(`
          tag_name,
          tag_color,
          created_at,
          generated_content!inner (
            projects!inner (
              user_id
            )
          )
        `)
        .eq('generated_content.projects.user_id', userId);

      if (contentError) {
        logger.error('Failed to fetch content tags:', contentError);
        throw new Error(`Failed to fetch content tags: ${contentError.message}`);
      }

      // Combine and aggregate tag statistics
      const tagMap = new Map<string, TagStats>();

      // Process project tags
      projectTags?.forEach(tag => {
        const key = tag.tag_name;
        if (!tagMap.has(key)) {
          tagMap.set(key, {
            tag_name: tag.tag_name,
            tag_color: tag.tag_color,
            project_count: 0,
            content_count: 0,
            last_used: tag.created_at,
            created_at: tag.created_at,
          });
        }
        const stats = tagMap.get(key)!;
        stats.project_count++;
        if (tag.created_at > stats.last_used) {
          stats.last_used = tag.created_at;
        }
      });

      // Process content tags
      contentTags?.forEach(tag => {
        const key = tag.tag_name;
        if (!tagMap.has(key)) {
          tagMap.set(key, {
            tag_name: tag.tag_name,
            tag_color: tag.tag_color,
            project_count: 0,
            content_count: 0,
            last_used: tag.created_at,
            created_at: tag.created_at,
          });
        }
        const stats = tagMap.get(key)!;
        stats.content_count++;
        if (tag.created_at > stats.last_used) {
          stats.last_used = tag.created_at;
        }
      });

      const result = Array.from(tagMap.values()).sort((a, b) => 
        new Date(b.last_used).getTime() - new Date(a.last_used).getTime()
      );

      logger.info('User tags fetched successfully:', { userId, tagCount: result.length });
      return result;
    } catch (error) {
      logger.error('Error fetching user tags:', error);
      throw error;
    }
  }

  /**
   * Create project tag
   */
  async createProjectTag(projectId: string, tagData: z.infer<typeof CreateTagSchema>): Promise<ProjectTag> {
    try {
      const validatedData = CreateTagSchema.parse(tagData);
      
      const { data, error } = await this.supabase
        .from(TABLE_NAMES.PROJECT_TAGS)
        .insert({
          project_id: projectId,
          ...validatedData,
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to create project tag:', error);
        throw new Error(`Failed to create project tag: ${error.message}`);
      }

      logger.info('Project tag created successfully:', { projectId, tagName: tagData.tag_name });
      return data;
    } catch (error) {
      logger.error('Error creating project tag:', error);
      throw error;
    }
  }

  /**
   * Create content tag
   */
  async createContentTag(contentId: string, tagData: z.infer<typeof CreateTagSchema>): Promise<ContentTag> {
    try {
      const validatedData = CreateTagSchema.parse(tagData);
      
      const { data, error } = await this.supabase
        .from(TABLE_NAMES.CONTENT_TAGS)
        .insert({
          content_id: contentId,
          ...validatedData,
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to create content tag:', error);
        throw new Error(`Failed to create content tag: ${error.message}`);
      }

      logger.info('Content tag created successfully:', { contentId, tagName: tagData.tag_name });
      return data;
    } catch (error) {
      logger.error('Error creating content tag:', error);
      throw error;
    }
  }

  /**
   * Bulk add tags to project
   */
  async bulkAddProjectTags(projectId: string, tagData: z.infer<typeof BulkTagSchema>): Promise<ProjectTag[]> {
    try {
      const validatedData = BulkTagSchema.parse(tagData);
      
      const tagsToInsert = validatedData.tag_names.map(tag_name => ({
        project_id: projectId,
        tag_name,
        tag_color: validatedData.tag_color,
      }));

      const { data, error } = await this.supabase
        .from(TABLE_NAMES.PROJECT_TAGS)
        .insert(tagsToInsert)
        .select();

      if (error) {
        logger.error('Failed to bulk add project tags:', error);
        throw new Error(`Failed to bulk add project tags: ${error.message}`);
      }

      logger.info('Project tags bulk added successfully:', { 
        projectId, 
        tagCount: validatedData.tag_names.length 
      });
      return data || [];
    } catch (error) {
      logger.error('Error bulk adding project tags:', error);
      throw error;
    }
  }

  /**
   * Bulk add tags to content
   */
  async bulkAddContentTags(contentId: string, tagData: z.infer<typeof BulkTagSchema>): Promise<ContentTag[]> {
    try {
      const validatedData = BulkTagSchema.parse(tagData);
      
      const tagsToInsert = validatedData.tag_names.map(tag_name => ({
        content_id: contentId,
        tag_name,
        tag_color: validatedData.tag_color,
      }));

      const { data, error } = await this.supabase
        .from(TABLE_NAMES.CONTENT_TAGS)
        .insert(tagsToInsert)
        .select();

      if (error) {
        logger.error('Failed to bulk add content tags:', error);
        throw new Error(`Failed to bulk add content tags: ${error.message}`);
      }

      logger.info('Content tags bulk added successfully:', { 
        contentId, 
        tagCount: validatedData.tag_names.length 
      });
      return data || [];
    } catch (error) {
      logger.error('Error bulk adding content tags:', error);
      throw error;
    }
  }

  /**
   * Update tag color across all instances
   */
  async updateTagColor(userId: string, tagName: string, newColor: string): Promise<void> {
    try {
      const colorValidation = z.string().regex(/^#[0-9A-F]{6}$/i).parse(newColor);

      // Update project tags
      const { error: projectError } = await this.supabase
        .from(TABLE_NAMES.PROJECT_TAGS)
        .update({ tag_color: colorValidation })
        .eq('tag_name', tagName)
        .in('project_id', await this.getUserProjectIds(userId));

      if (projectError) {
        logger.error('Failed to update project tag color:', projectError);
        throw new Error(`Failed to update project tag color: ${projectError.message}`);
      }

      // Update content tags
      const { error: contentError } = await this.supabase
        .from(TABLE_NAMES.CONTENT_TAGS)
        .update({ tag_color: colorValidation })
        .eq('tag_name', tagName)
        .in('content_id', await this.getUserContentIds(userId));

      if (contentError) {
        logger.error('Failed to update content tag color:', contentError);
        throw new Error(`Failed to update content tag color: ${contentError.message}`);
      }

      logger.info('Tag color updated successfully:', { userId, tagName, newColor });
    } catch (error) {
      logger.error('Error updating tag color:', error);
      throw error;
    }
  }

  /**
   * Delete tag from all instances
   */
  async deleteTag(userId: string, tagName: string): Promise<void> {
    try {
      // Delete from project tags
      const { error: projectError } = await this.supabase
        .from(TABLE_NAMES.PROJECT_TAGS)
        .delete()
        .eq('tag_name', tagName)
        .in('project_id', await this.getUserProjectIds(userId));

      if (projectError) {
        logger.error('Failed to delete project tags:', projectError);
        throw new Error(`Failed to delete project tags: ${projectError.message}`);
      }

      // Delete from content tags
      const { error: contentError } = await this.supabase
        .from(TABLE_NAMES.CONTENT_TAGS)
        .delete()
        .eq('tag_name', tagName)
        .in('content_id', await this.getUserContentIds(userId));

      if (contentError) {
        logger.error('Failed to delete content tags:', contentError);
        throw new Error(`Failed to delete content tags: ${contentError.message}`);
      }

      logger.info('Tag deleted successfully:', { userId, tagName });
    } catch (error) {
      logger.error('Error deleting tag:', error);
      throw error;
    }
  }

  /**
   * Get tag suggestions based on content and existing tags
   */
  async getTagSuggestions(userId: string, content?: string, limit: number = 10): Promise<TagSuggestion[]> {
    try {
      // Get existing user tags for frequency analysis
      const existingTags = await this.getUserTags(userId);
      
      // Simple keyword-based suggestions (in a real implementation, you'd use NLP)
      const suggestions: TagSuggestion[] = [];
      
      if (content) {
        const keywords = this.extractKeywords(content);
        keywords.forEach(keyword => {
          const existingTag = existingTags.find(tag => 
            tag.tag_name.toLowerCase().includes(keyword.toLowerCase()) ||
            keyword.toLowerCase().includes(tag.tag_name.toLowerCase())
          );
          
          if (existingTag) {
            suggestions.push({
              tag_name: existingTag.tag_name,
              relevance_score: 0.8,
              usage_count: existingTag.project_count + existingTag.content_count,
              suggested_color: existingTag.tag_color,
            });
          } else {
            suggestions.push({
              tag_name: keyword,
              relevance_score: 0.6,
              usage_count: 0,
              suggested_color: this.generateTagColor(keyword),
            });
          }
        });
      }

      // Add popular existing tags
      existingTags
        .sort((a, b) => (b.project_count + b.content_count) - (a.project_count + a.content_count))
        .slice(0, 5)
        .forEach(tag => {
          if (!suggestions.find(s => s.tag_name === tag.tag_name)) {
            suggestions.push({
              tag_name: tag.tag_name,
              relevance_score: 0.7,
              usage_count: tag.project_count + tag.content_count,
              suggested_color: tag.tag_color,
            });
          }
        });

      return suggestions
        .sort((a, b) => b.relevance_score - a.relevance_score)
        .slice(0, limit);
    } catch (error) {
      logger.error('Error getting tag suggestions:', error);
      throw error;
    }
  }

  /**
   * Get popular tags across the platform (for inspiration)
   */
  async getPopularTags(limit: number = 20): Promise<{ tag_name: string; usage_count: number; tag_color: string }[]> {
    try {
      // Get most used project tags
      const { data: projectTags, error: projectError } = await this.supabase
        .from(TABLE_NAMES.PROJECT_TAGS)
        .select('tag_name, tag_color')
        .order('created_at', { ascending: false })
        .limit(1000); // Get recent tags for analysis

      if (projectError) {
        logger.error('Failed to fetch popular project tags:', projectError);
        throw new Error(`Failed to fetch popular project tags: ${projectError.message}`);
      }

      // Get most used content tags
      const { data: contentTags, error: contentError } = await this.supabase
        .from(TABLE_NAMES.CONTENT_TAGS)
        .select('tag_name, tag_color')
        .order('created_at', { ascending: false })
        .limit(1000); // Get recent tags for analysis

      if (contentError) {
        logger.error('Failed to fetch popular content tags:', contentError);
        throw new Error(`Failed to fetch popular content tags: ${contentError.message}`);
      }

      // Combine and count tag usage
      const tagCounts = new Map<string, { count: number; color: string }>();
      
      [...(projectTags || []), ...(contentTags || [])].forEach(tag => {
        const existing = tagCounts.get(tag.tag_name);
        if (existing) {
          existing.count++;
        } else {
          tagCounts.set(tag.tag_name, { count: 1, color: tag.tag_color });
        }
      });

      return Array.from(tagCounts.entries())
        .map(([tag_name, { count, color }]) => ({
          tag_name,
          usage_count: count,
          tag_color: color,
        }))
        .sort((a, b) => b.usage_count - a.usage_count)
        .slice(0, limit);
    } catch (error) {
      logger.error('Error fetching popular tags:', error);
      throw error;
    }
  }

  // Private helper methods
  private async getUserProjectIds(userId: string): Promise<string[]> {
    try {
      const { data, error } = await this.supabase
        .from(TABLE_NAMES.PROJECTS)
        .select('id')
        .eq('user_id', userId);

      if (error) {
        logger.error('Failed to fetch user project IDs:', error);
        return [];
      }

      return data?.map(p => p.id) || [];
    } catch (error) {
      logger.error('Error fetching user project IDs:', error);
      return [];
    }
  }

  private async getUserContentIds(userId: string): Promise<string[]> {
    try {
      const { data, error } = await this.supabase
        .from(TABLE_NAMES.GENERATED_CONTENT)
        .select(`
          id,
          projects!inner (
            user_id
          )
        `)
        .eq('projects.user_id', userId);

      if (error) {
        logger.error('Failed to fetch user content IDs:', error);
        return [];
      }

      return data?.map(c => c.id) || [];
    } catch (error) {
      logger.error('Error fetching user content IDs:', error);
      return [];
    }
  }

  private extractKeywords(content: string): string[] {
    // Simple keyword extraction (in production, use proper NLP)
    const words = content
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && word.length < 20)
      .filter(word => !this.isStopWord(word));

    // Get word frequency
    const frequency = new Map<string, number>();
    words.forEach(word => {
      frequency.set(word, (frequency.get(word) || 0) + 1);
    });

    // Return top keywords
    return Array.from(frequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'this', 'that', 'these', 'those', 'is', 'are', 'was', 'were', 'be', 'been',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
      'may', 'might', 'must', 'can', 'shall', 'from', 'into', 'onto', 'upon'
    ]);
    return stopWords.has(word);
  }

  private generateTagColor(tagName: string): string {
    // Generate consistent color based on tag name
    const colors = [
      '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
      '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
    ];
    
    let hash = 0;
    for (let i = 0; i < tagName.length; i++) {
      hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  }
}
