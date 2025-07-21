/**
 * Tags API Routes
 * Handles tag management for projects and content
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceLogger } from '@/lib/logging/logger';
import { TagManagementService } from '@/lib/services/tag-management.service';
import { ProjectManagementService } from '@/lib/services/project-management.service';
import { ContentLibraryService } from '@/lib/services/content-library.service';
import { authenticateRequest } from '@/lib/auth/middleware';

const logger = createServiceLogger('tags-api');

const tagService = new TagManagementService();
const projectService = new ProjectManagementService();
const contentService = new ContentLibraryService();

// Request validation schemas
const CreateTagSchema = z.object({
  tag_name: z.string().min(1).max(50),
  tag_color: z.string().regex(/^#[0-9A-F]{6}$/i).default('#3B82F6'),
  target_type: z.enum(['project', 'content']),
  target_id: z.string().uuid(),
});

const BulkCreateTagSchema = z.object({
  tag_names: z.array(z.string().min(1).max(50)).min(1).max(10),
  tag_color: z.string().regex(/^#[0-9A-F]{6}$/i).default('#3B82F6'),
  target_type: z.enum(['project', 'content']),
  target_id: z.string().uuid(),
});

const UpdateTagSchema = z.object({
  tag_name: z.string().min(1).max(50),
  new_color: z.string().regex(/^#[0-9A-F]{6}$/i),
});

/**
 * GET /api/tags
 * Get user's tags with statistics and suggestions
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
    const includeStats = searchParams.get('include_stats') === 'true';
    const includeSuggestions = searchParams.get('include_suggestions') === 'true';
    const includePopular = searchParams.get('include_popular') === 'true';
    const content = searchParams.get('content') || undefined;

    const results: any = {};

    // Get user's tags with statistics
    if (includeStats) {
      results.user_tags = await tagService.getUserTags(authResult.user.id);
    }

    // Get tag suggestions
    if (includeSuggestions) {
      results.suggestions = await tagService.getTagSuggestions(
        authResult.user.id,
        content,
        10
      );
    }

    // Get popular tags
    if (includePopular) {
      results.popular_tags = await tagService.getPopularTags(20);
    }

    // If no specific data requested, return user tags by default
    if (!includeStats && !includeSuggestions && !includePopular) {
      results.user_tags = await tagService.getUserTags(authResult.user.id);
    }

    logger.info('Tags data fetched successfully', {
      userId: authResult.user.id,
      includeStats,
      includeSuggestions,
      includePopular,
      userTagsCount: results.user_tags?.length || 0,
    });

    return NextResponse.json({
      success: true,
      data: results,
    });

  } catch (error) {
    logger.error('Error fetching tags data:', error);

    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to fetch tags data' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tags
 * Create a new tag for project or content
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
    const tagData = CreateTagSchema.parse(body);

    let createdTag;

    if (tagData.target_type === 'project') {
      createdTag = await tagService.createProjectTag(tagData.target_id, {
        tag_name: tagData.tag_name,
        tag_color: tagData.tag_color,
      });
    } else {
      createdTag = await tagService.createContentTag(tagData.target_id, {
        tag_name: tagData.tag_name,
        tag_color: tagData.tag_color,
      });
    }

    logger.info('Tag created successfully', {
      userId: authResult.user.id,
      targetType: tagData.target_type,
      targetId: tagData.target_id,
      tagName: tagData.tag_name,
    });

    return NextResponse.json({
      success: true,
      data: createdTag,
      message: 'Tag created successfully',
    }, { status: 201 });

  } catch (error) {
    logger.error('Error creating tag:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation Error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to create tag' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/tags
 * Update tag color across all instances
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
    const updateData = UpdateTagSchema.parse(body);

    await tagService.updateTagColor(
      authResult.user.id,
      updateData.tag_name,
      updateData.new_color
    );

    logger.info('Tag color updated successfully', {
      userId: authResult.user.id,
      tagName: updateData.tag_name,
      newColor: updateData.new_color,
    });

    return NextResponse.json({
      success: true,
      message: 'Tag color updated successfully',
    });

  } catch (error) {
    logger.error('Error updating tag color:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation Error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to update tag color' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tags
 * Delete tag from all instances
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

    const { searchParams } = new URL(request.url);
    const tagName = searchParams.get('tag_name');

    if (!tagName) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'tag_name parameter is required' },
        { status: 400 }
      );
    }

    await tagService.deleteTag(authResult.user.id, tagName);

    logger.info('Tag deleted successfully', {
      userId: authResult.user.id,
      tagName,
    });

    return NextResponse.json({
      success: true,
      message: 'Tag deleted successfully',
    });

  } catch (error) {
    logger.error('Error deleting tag:', error);

    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to delete tag' },
      { status: 500 }
    );
  }
}
