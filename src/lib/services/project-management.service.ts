/**
 * Project Management Service
 * Handles project creation, organization, and management operations
 */

import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { 
  Project, 
  ProjectTag, 
  ProjectAccessControl, 
  ProjectMetrics,
  TABLE_NAMES 
} from '../database/schema';
import { createServiceLogger } from '../logging/logger';

const logger = createServiceLogger('project-management-service');

// Validation schemas
const CreateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Project name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  client_name: z.string().min(1, 'Client name is required').max(100, 'Client name too long'),
  campaign_name: z.string().min(1, 'Campaign name is required').max(100, 'Campaign name too long'),
  category: z.string().min(1, 'Category is required').max(50, 'Category too long'),
  target_keywords: z.array(z.string()).max(50, 'Too many keywords'),
  target_country: z.string().default('US'),
  target_language: z.string().default('en'),
  domain_url: z.string().url().optional(),
  due_date: z.string().optional(),
  settings: z.record(z.any()).default({}),
});

const UpdateProjectSchema = CreateProjectSchema.partial();

const AddProjectTagSchema = z.object({
  project_id: z.string().uuid(),
  tag_name: z.string().min(1).max(50),
  tag_color: z.string().regex(/^#[0-9A-F]{6}$/i).default('#3B82F6'),
});

const ProjectAccessSchema = z.object({
  project_id: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(['owner', 'editor', 'viewer']),
  permissions: z.record(z.any()).default({}),
});

export class ProjectManagementService {
  private supabase;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Create a new project with client/campaign organization
   */
  async createProject(userId: string, projectData: z.infer<typeof CreateProjectSchema>): Promise<Project> {
    try {
      const validatedData = CreateProjectSchema.parse(projectData);
      
      const { data, error } = await this.supabase
        .from(TABLE_NAMES.PROJECTS)
        .insert({
          user_id: userId,
          ...validatedData,
          status: 'active',
          completion_percentage: 0,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to create project:', error);
        throw new Error(`Failed to create project: ${error.message}`);
      }

      logger.info('Project created successfully:', { projectId: data.id, userId });
      return data;
    } catch (error) {
      logger.error('Error creating project:', error);
      throw error;
    }
  }

  /**
   * Get projects organized by client and campaign
   */
  async getProjectsByClientCampaign(userId: string): Promise<{
    [client: string]: {
      [campaign: string]: Project[]
    }
  }> {
    try {
      const { data, error } = await this.supabase
        .from(TABLE_NAMES.PROJECTS)
        .select('*')
        .or(`user_id.eq.${userId},id.in.(${await this.getAccessibleProjectIds(userId)})`)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Failed to fetch projects:', error);
        throw new Error(`Failed to fetch projects: ${error.message}`);
      }

      // Organize projects by client and campaign
      const organized: { [client: string]: { [campaign: string]: Project[] } } = {};
      
      data?.forEach(project => {
        const client = project.client_name || 'Uncategorized';
        const campaign = project.campaign_name || 'Default';
        
        if (!organized[client]) {
          organized[client] = {};
        }
        if (!organized[client][campaign]) {
          organized[client][campaign] = [];
        }
        
        organized[client][campaign].push(project);
      });

      return organized;
    } catch (error) {
      logger.error('Error fetching projects by client/campaign:', error);
      throw error;
    }
  }

  /**
   * Get projects by category
   */
  async getProjectsByCategory(userId: string): Promise<{ [category: string]: Project[] }> {
    try {
      const { data, error } = await this.supabase
        .from(TABLE_NAMES.PROJECTS)
        .select('*')
        .or(`user_id.eq.${userId},id.in.(${await this.getAccessibleProjectIds(userId)})`)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Failed to fetch projects by category:', error);
        throw new Error(`Failed to fetch projects: ${error.message}`);
      }

      // Organize projects by category
      const organized: { [category: string]: Project[] } = {};
      
      data?.forEach(project => {
        const category = project.category || 'Uncategorized';
        if (!organized[category]) {
          organized[category] = [];
        }
        organized[category].push(project);
      });

      return organized;
    } catch (error) {
      logger.error('Error fetching projects by category:', error);
      throw error;
    }
  }

  /**
   * Update project
   */
  async updateProject(projectId: string, userId: string, updates: z.infer<typeof UpdateProjectSchema>): Promise<Project> {
    try {
      const validatedUpdates = UpdateProjectSchema.parse(updates);
      
      const { data, error } = await this.supabase
        .from(TABLE_NAMES.PROJECTS)
        .update({
          ...validatedUpdates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', projectId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        logger.error('Failed to update project:', error);
        throw new Error(`Failed to update project: ${error.message}`);
      }

      logger.info('Project updated successfully:', { projectId, userId });
      return data;
    } catch (error) {
      logger.error('Error updating project:', error);
      throw error;
    }
  }

  /**
   * Add tag to project
   */
  async addProjectTag(tagData: z.infer<typeof AddProjectTagSchema>): Promise<ProjectTag> {
    try {
      const validatedData = AddProjectTagSchema.parse(tagData);
      
      const { data, error } = await this.supabase
        .from(TABLE_NAMES.PROJECT_TAGS)
        .insert(validatedData)
        .select()
        .single();

      if (error) {
        logger.error('Failed to add project tag:', error);
        throw new Error(`Failed to add project tag: ${error.message}`);
      }

      logger.info('Project tag added successfully:', { projectId: tagData.project_id, tagName: tagData.tag_name });
      return data;
    } catch (error) {
      logger.error('Error adding project tag:', error);
      throw error;
    }
  }

  /**
   * Get project tags
   */
  async getProjectTags(projectId: string): Promise<ProjectTag[]> {
    try {
      const { data, error } = await this.supabase
        .from(TABLE_NAMES.PROJECT_TAGS)
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Failed to fetch project tags:', error);
        throw new Error(`Failed to fetch project tags: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      logger.error('Error fetching project tags:', error);
      throw error;
    }
  }

  /**
   * Remove project tag
   */
  async removeProjectTag(projectId: string, tagName: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from(TABLE_NAMES.PROJECT_TAGS)
        .delete()
        .eq('project_id', projectId)
        .eq('tag_name', tagName);

      if (error) {
        logger.error('Failed to remove project tag:', error);
        throw new Error(`Failed to remove project tag: ${error.message}`);
      }

      logger.info('Project tag removed successfully:', { projectId, tagName });
    } catch (error) {
      logger.error('Error removing project tag:', error);
      throw error;
    }
  }

  /**
   * Add user access to project
   */
  async addProjectAccess(accessData: z.infer<typeof ProjectAccessSchema>, invitedBy: string): Promise<ProjectAccessControl> {
    try {
      const validatedData = ProjectAccessSchema.parse(accessData);
      
      const { data, error } = await this.supabase
        .from(TABLE_NAMES.PROJECT_ACCESS_CONTROL)
        .insert({
          ...validatedData,
          invited_by: invitedBy,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to add project access:', error);
        throw new Error(`Failed to add project access: ${error.message}`);
      }

      logger.info('Project access added successfully:', { projectId: accessData.project_id, email: accessData.email });
      return data;
    } catch (error) {
      logger.error('Error adding project access:', error);
      throw error;
    }
  }

  /**
   * Get project access list
   */
  async getProjectAccess(projectId: string): Promise<ProjectAccessControl[]> {
    try {
      const { data, error } = await this.supabase
        .from(TABLE_NAMES.PROJECT_ACCESS_CONTROL)
        .select('*')
        .eq('project_id', projectId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Failed to fetch project access:', error);
        throw new Error(`Failed to fetch project access: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      logger.error('Error fetching project access:', error);
      throw error;
    }
  }

  /**
   * Get project metrics for progress tracking
   */
  async getProjectMetrics(projectId: string): Promise<ProjectMetrics | null> {
    try {
      const { data, error } = await this.supabase
        .from(TABLE_NAMES.PROJECT_METRICS)
        .select('*')
        .eq('project_id', projectId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        logger.error('Failed to fetch project metrics:', error);
        throw new Error(`Failed to fetch project metrics: ${error.message}`);
      }

      return data;
    } catch (error) {
      logger.error('Error fetching project metrics:', error);
      throw error;
    }
  }

  /**
   * Get accessible project IDs for user (including shared projects)
   */
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

  /**
   * Delete project (soft delete)
   */
  async deleteProject(projectId: string, userId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from(TABLE_NAMES.PROJECTS)
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', projectId)
        .eq('user_id', userId);

      if (error) {
        logger.error('Failed to delete project:', error);
        throw new Error(`Failed to delete project: ${error.message}`);
      }

      logger.info('Project deleted successfully:', { projectId, userId });
    } catch (error) {
      logger.error('Error deleting project:', error);
      throw error;
    }
  }
}
