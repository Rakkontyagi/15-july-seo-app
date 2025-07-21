/**
 * Projects API Routes
 * Handles project CRUD operations and organization
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceLogger } from '@/lib/logging/logger';
import { ProjectManagementService } from '@/lib/services/project-management.service';
import { authenticateRequest } from '@/lib/auth/middleware';
import { sanitizeText, sanitizeUrl, sanitizeArray } from '@/lib/validation/sanitizer';

const logger = createServiceLogger('projects-api');

const projectService = new ProjectManagementService();

// Request validation schemas
const CreateProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  client_name: z.string().min(1).max(100),
  campaign_name: z.string().min(1).max(100),
  category: z.string().min(1).max(50),
  target_keywords: z.array(z.string()).max(50),
  target_country: z.string().default('US'),
  target_language: z.string().default('en'),
  domain_url: z.string().url().optional(),
  due_date: z.string().optional(),
  settings: z.record(z.any()).default({}),
});

const QueryParamsSchema = z.object({
  organization: z.enum(['client-campaign', 'category']).default('client-campaign'),
  client: z.string().optional(),
  campaign: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(['active', 'completed', 'on_hold', 'archived']).optional(),
});

/**
 * GET /api/projects
 * Fetch projects organized by client/campaign or category
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Unauthorized', message: authResult.error },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Sanitize query parameters
    const rawParams = {
      organization: searchParams.get('organization') || 'client-campaign',
      client: searchParams.get('client') ? sanitizeText(searchParams.get('client')!, { maxLength: 100 }) : undefined,
      campaign: searchParams.get('campaign') ? sanitizeText(searchParams.get('campaign')!, { maxLength: 100 }) : undefined,
      category: searchParams.get('category') ? sanitizeText(searchParams.get('category')!, { maxLength: 50 }) : undefined,
      status: searchParams.get('status') || undefined,
    };
    
    const queryParams = QueryParamsSchema.parse(rawParams);

    let projects;
    
    if (queryParams.organization === 'client-campaign') {
      projects = await projectService.getProjectsByClientCampaign(authResult.user.id);
    } else {
      projects = await projectService.getProjectsByCategory(authResult.user.id);
    }

    logger.info('Projects fetched successfully', {
      userId: authResult.user.id,
      organization: queryParams.organization,
      projectCount: Array.isArray(projects) ? projects.length : Object.keys(projects).length,
    });

    return NextResponse.json({
      success: true,
      data: projects,
      organization: queryParams.organization,
    });

  } catch (error) {
    logger.error('Error fetching projects:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation Error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects
 * Create a new project
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Unauthorized', message: authResult.error },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Sanitize project data
    const sanitizedBody = {
      ...body,
      name: sanitizeText(body.name, { maxLength: 100 }),
      description: body.description ? sanitizeText(body.description, { maxLength: 500 }) : undefined,
      client_name: sanitizeText(body.client_name, { maxLength: 100 }),
      campaign_name: sanitizeText(body.campaign_name, { maxLength: 100 }),
      category: sanitizeText(body.category, { maxLength: 50 }),
      target_keywords: body.target_keywords ? sanitizeArray(body.target_keywords, { maxLength: 100 }) : [],
      domain_url: body.domain_url ? sanitizeUrl(body.domain_url) : undefined,
    };
    
    const projectData = CreateProjectSchema.parse(sanitizedBody);

    const project = await projectService.createProject(authResult.user.id, projectData);

    logger.info('Project created successfully', {
      userId: authResult.user.id,
      projectId: project.id,
      clientName: project.client_name,
      campaignName: project.campaign_name,
    });

    return NextResponse.json({
      success: true,
      data: project,
      message: 'Project created successfully',
    }, { status: 201 });

  } catch (error) {
    logger.error('Error creating project:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation Error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to create project' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/projects
 * Bulk update multiple projects
 */
export async function PUT(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Unauthorized', message: authResult.error },
        { status: 401 }
      );
    }

    const body = await request.json();
    const BulkUpdateSchema = z.object({
      project_ids: z.array(z.string().uuid()).min(1).max(50),
      updates: z.object({
        status: z.enum(['active', 'completed', 'on_hold', 'archived']).optional(),
        category: z.string().max(50).optional(),
        completion_percentage: z.number().min(0).max(100).optional(),
        due_date: z.string().optional(),
      }),
    });

    // Sanitize bulk update data
    const sanitizedBody = {
      ...body,
      updates: {
        ...body.updates,
        category: body.updates?.category ? sanitizeText(body.updates.category, { maxLength: 50 }) : undefined,
      }
    };

    const { project_ids, updates } = BulkUpdateSchema.parse(sanitizedBody);

    const updatedProjects = [];
    for (const projectId of project_ids) {
      try {
        const project = await projectService.updateProject(projectId, authResult.user.id, updates);
        updatedProjects.push(project);
      } catch (error) {
        logger.warn('Failed to update project in bulk operation:', { projectId, error });
      }
    }

    logger.info('Bulk project update completed', {
      userId: authResult.user.id,
      requestedCount: project_ids.length,
      successCount: updatedProjects.length,
    });

    return NextResponse.json({
      success: true,
      data: updatedProjects,
      message: `Updated ${updatedProjects.length} of ${project_ids.length} projects`,
    });

  } catch (error) {
    logger.error('Error in bulk project update:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation Error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to update projects' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projects
 * Bulk delete multiple projects
 */
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Unauthorized', message: authResult.error },
        { status: 401 }
      );
    }

    const body = await request.json();
    const BulkDeleteSchema = z.object({
      project_ids: z.array(z.string().uuid()).min(1).max(50),
    });

    const { project_ids } = BulkDeleteSchema.parse(body);

    let deletedCount = 0;
    for (const projectId of project_ids) {
      try {
        await projectService.deleteProject(projectId, authResult.user.id);
        deletedCount++;
      } catch (error) {
        logger.warn('Failed to delete project in bulk operation:', { projectId, error });
      }
    }

    logger.info('Bulk project deletion completed', {
      userId: authResult.user.id,
      requestedCount: project_ids.length,
      deletedCount,
    });

    return NextResponse.json({
      success: true,
      message: `Deleted ${deletedCount} of ${project_ids.length} projects`,
      deleted_count: deletedCount,
    });

  } catch (error) {
    logger.error('Error in bulk project deletion:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation Error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to delete projects' },
      { status: 500 }
    );
  }
}
