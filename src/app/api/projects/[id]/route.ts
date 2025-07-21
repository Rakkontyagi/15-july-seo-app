/**
 * Individual Project API Routes
 * Handles single project operations, tags, access control, and metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceLogger } from '@/lib/logging/logger';
import { ProjectManagementService } from '@/lib/services/project-management.service';
import { TagManagementService } from '@/lib/services/tag-management.service';
import { authenticateRequest } from '@/lib/auth/middleware';

const logger = createServiceLogger('project-detail-api');

const projectService = new ProjectManagementService();
const tagService = new TagManagementService();

// Request validation schemas
const UpdateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  client_name: z.string().min(1).max(100).optional(),
  campaign_name: z.string().min(1).max(100).optional(),
  category: z.string().min(1).max(50).optional(),
  status: z.enum(['active', 'completed', 'on_hold', 'archived']).optional(),
  completion_percentage: z.number().min(0).max(100).optional(),
  due_date: z.string().optional(),
  target_keywords: z.array(z.string()).max(50).optional(),
  target_country: z.string().optional(),
  target_language: z.string().optional(),
  domain_url: z.string().url().optional(),
  settings: z.record(z.any()).optional(),
});

/**
 * GET /api/projects/[id]
 * Get project details with tags, access control, and metrics
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Unauthorized', message: authResult.error },
        { status: 401 }
      );
    }

    const projectId = params.id;
    
    // Validate UUID format
    const uuidSchema = z.string().uuid();
    uuidSchema.parse(projectId);

    // Get project details (this will check access permissions)
    const projects = await projectService.getProjectsByClientCampaign(authResult.user.id);
    
    // Find the project in the organized structure
    let project = null;
    for (const client of Object.values(projects)) {
      for (const campaign of Object.values(client)) {
        const found = campaign.find(p => p.id === projectId);
        if (found) {
          project = found;
          break;
        }
      }
      if (project) break;
    }

    if (!project) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    // Get additional project data
    const [tags, accessControl, metrics] = await Promise.all([
      projectService.getProjectTags(projectId),
      projectService.getProjectAccess(projectId),
      projectService.getProjectMetrics(projectId),
    ]);

    const projectDetails = {
      ...project,
      tags,
      access_control: accessControl,
      metrics,
    };

    logger.info('Project details fetched successfully', {
      userId: authResult.user.id,
      projectId,
      tagCount: tags.length,
      accessCount: accessControl.length,
    });

    return NextResponse.json({
      success: true,
      data: projectDetails,
    });

  } catch (error) {
    logger.error('Error fetching project details:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation Error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to fetch project details' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/projects/[id]
 * Update project details
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Unauthorized', message: authResult.error },
        { status: 401 }
      );
    }

    const projectId = params.id;
    
    // Validate UUID format
    const uuidSchema = z.string().uuid();
    uuidSchema.parse(projectId);

    const body = await request.json();
    const updates = UpdateProjectSchema.parse(body);

    const updatedProject = await projectService.updateProject(
      projectId,
      authResult.user.id,
      updates
    );

    logger.info('Project updated successfully', {
      userId: authResult.user.id,
      projectId,
      updatedFields: Object.keys(updates),
    });

    return NextResponse.json({
      success: true,
      data: updatedProject,
      message: 'Project updated successfully',
    });

  } catch (error) {
    logger.error('Error updating project:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation Error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to update project' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projects/[id]
 * Delete project (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Unauthorized', message: authResult.error },
        { status: 401 }
      );
    }

    const projectId = params.id;
    
    // Validate UUID format
    const uuidSchema = z.string().uuid();
    uuidSchema.parse(projectId);

    await projectService.deleteProject(projectId, authResult.user.id);

    logger.info('Project deleted successfully', {
      userId: authResult.user.id,
      projectId,
    });

    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully',
    });

  } catch (error) {
    logger.error('Error deleting project:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation Error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
