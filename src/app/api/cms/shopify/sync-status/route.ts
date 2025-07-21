// Shopify Sync Status API Endpoint

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceLogger } from '@/lib/logging/logger';
import { ShopifyService } from '@/lib/cms/shopify.service';
import { authenticateRequest } from '@/lib/auth/middleware';
import { CMSCredentials } from '@/types/cms';

const logger = createServiceLogger('shopify-sync-api');

// Request validation schema
const syncStatusRequestSchema = z.object({
  credentials: z.object({
    endpoint: z.string().url('Invalid Shopify URL'),
    apiKey: z.string().min(1, 'API access token is required'),
    storeId: z.string().optional(),
  }),
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

    logger.info('Shopify sync status check', {
      userId: user.id,
      contentId: validatedData.contentId,
      endpoint: validatedData.credentials.endpoint
    });

    // Prepare credentials
    const credentials: CMSCredentials = {
      platform: 'shopify',
      endpoint: validatedData.credentials.endpoint,
      apiKey: validatedData.credentials.apiKey,
      storeId: validatedData.credentials.storeId,
    };

    // Initialize Shopify service
    const shopifyService = new ShopifyService(credentials);

    // Validate credentials
    const isValid = await shopifyService.validateCredentials();
    if (!isValid) {
      logger.warn('Invalid Shopify credentials', { userId: user.id });
      return NextResponse.json(
        { error: 'Invalid Shopify credentials' },
        { status: 401 }
      );
    }

    // Get sync status
    const syncStatus = await shopifyService.getSyncStatus(
      validatedData.contentId,
      validatedData.localVersion
    );

    logger.info('Shopify sync status retrieved', {
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
      logger.warn('Shopify sync status validation error', {
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

    logger.error('Shopify sync status error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json(
      { error: 'Failed to check sync status' },
      { status: 500 }
    );
  }
}