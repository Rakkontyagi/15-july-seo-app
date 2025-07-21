// WordPress Sync Status API Endpoint

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceLogger } from '@/lib/logging/logger';
import { WordPressService } from '@/lib/cms/wordpress.service';
import { authenticateRequest } from '@/lib/auth/middleware';
import { CMSCredentials } from '@/types/cms';

const logger = createServiceLogger('wordpress-sync-api');

// Request validation schema
const syncStatusRequestSchema = z.object({
  credentials: z.object({
    endpoint: z.string().url('Invalid WordPress URL'),
    apiKey: z.string().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
  }).refine(
    (creds) => (creds.apiKey) || (creds.username && creds.password),
    'Either API key or username/password must be provided'
  ),
  contentId: z.string().min(1, 'Content ID is required'),
  localVersion: z.string().min(1, 'Local version is required')
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate request
    const { user } = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = syncStatusRequestSchema.parse(body);

    logger.info('WordPress sync status check', {
      userId: user.id,
      contentId: validatedData.contentId,
      endpoint: validatedData.credentials.endpoint
    });

    // Prepare credentials
    const credentials: CMSCredentials = {
      platform: 'wordpress',
      endpoint: validatedData.credentials.endpoint,
      apiKey: validatedData.credentials.apiKey,
      username: validatedData.credentials.username,
      password: validatedData.credentials.password,
    };

    // Initialize WordPress service
    const wpService = new WordPressService(credentials);

    // Validate credentials
    const isValid = await wpService.validateCredentials();
    if (!isValid) {
      logger.warn('Invalid WordPress credentials', { userId: user.id });
      return NextResponse.json(
        { error: 'Invalid WordPress credentials' },
        { status: 401 }
      );
    }

    // Get sync status
    const syncStatus = await wpService.getSyncStatus(
      validatedData.contentId,
      validatedData.localVersion
    );

    logger.info('WordPress sync status retrieved', {
      userId: user.id,
      contentId: validatedData.contentId,
      syncStatus: syncStatus.syncStatus
    });

    return NextResponse.json({
      success: true,
      data: syncStatus
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('WordPress sync status validation error', {
        errors: error.errors
      });
      
      return NextResponse.json(
        { 
          error: 'Validation error',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    logger.error('WordPress sync status error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json(
      { error: 'Failed to check sync status' },
      { status: 500 }
    );
  }
}