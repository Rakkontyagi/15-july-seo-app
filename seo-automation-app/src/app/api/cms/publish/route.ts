/**
 * CMS Publishing API Route
 * Implements Story 5.4: CMS Integration (NFR10)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { CMSIntegrationManager, type ContentPublishRequest, type CMSConfig } from '@/lib/cms/cms-integration-manager';

// Request validation schemas
const cmsConfigSchema = z.object({
  type: z.enum(['WORDPRESS', 'DRUPAL', 'JOOMLA', 'SHOPIFY', 'WEBFLOW', 'CUSTOM']),
  apiEndpoint: z.string().url(),
  apiKey: z.string().min(1),
  username: z.string().optional(),
  password: z.string().optional(),
  customHeaders: z.record(z.string()).optional(),
  version: z.string().optional(),
});

const publishRequestSchema = z.object({
  cmsId: z.string().min(1),
  content: z.object({
    title: z.string().min(1),
    content: z.string().min(1),
    excerpt: z.string().optional(),
    tags: z.array(z.string()).optional(),
    categories: z.array(z.string()).optional(),
    featuredImage: z.string().url().optional(),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    slug: z.string().optional(),
    status: z.enum(['draft', 'published', 'scheduled']),
    publishDate: z.string().optional(),
    customFields: z.record(z.any()).optional(),
  }),
});

const multiPublishRequestSchema = z.object({
  cmsIds: z.array(z.string()).min(1),
  content: publishRequestSchema.shape.content,
});

const registerCMSSchema = z.object({
  id: z.string().min(1),
  config: cmsConfigSchema,
});

type PublishRequest = z.infer<typeof publishRequestSchema>;
type MultiPublishRequest = z.infer<typeof multiPublishRequestSchema>;
type RegisterCMSRequest = z.infer<typeof registerCMSSchema>;

// Global CMS manager instance
const cmsManager = new CMSIntegrationManager();

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'register':
        return await handleRegisterCMS(request);
      case 'publish':
        return await handlePublishContent(request);
      case 'multi-publish':
        return await handleMultiPublish(request);
      case 'test-connection':
        return await handleTestConnection(request);
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Use: register, publish, multi-publish, or test-connection' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('CMS API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const cmsId = url.searchParams.get('cmsId');

    switch (action) {
      case 'list':
        return await handleListCMS();
      case 'capabilities':
        if (!cmsId) {
          return NextResponse.json(
            { success: false, error: 'cmsId parameter required for capabilities' },
            { status: 400 }
          );
        }
        return await handleGetCapabilities(cmsId);
      case 'status':
        return await handleGetStatus();
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Use: list, capabilities, or status' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('CMS API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

// Handler functions
async function handleRegisterCMS(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = registerCMSSchema.parse(body);

    await cmsManager.registerCMS(validatedData.id, validatedData.config);

    return NextResponse.json({
      success: true,
      message: `CMS ${validatedData.id} registered successfully`,
      cmsId: validatedData.id,
      type: validatedData.config.type,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'CMS registration failed',
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

async function handlePublishContent(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = publishRequestSchema.parse(body);

    const result = await cmsManager.publishContent(validatedData.cmsId, validatedData.content);

    return NextResponse.json({
      success: result.success,
      data: result,
    }, { status: result.success ? 200 : 400 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Publishing failed',
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

async function handleMultiPublish(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = multiPublishRequestSchema.parse(body);

    const results = await cmsManager.publishToMultipleCMS(validatedData.cmsIds, validatedData.content);

    const successCount = Object.values(results).filter(r => r.success).length;
    const totalCount = Object.keys(results).length;

    return NextResponse.json({
      success: successCount > 0,
      data: {
        results,
        summary: {
          total: totalCount,
          successful: successCount,
          failed: totalCount - successCount,
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Multi-publishing failed',
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

async function handleTestConnection(request: NextRequest) {
  try {
    const body = await request.json();
    const { cmsId } = body;

    if (!cmsId) {
      return NextResponse.json(
        { success: false, error: 'cmsId is required' },
        { status: 400 }
      );
    }

    const result = await cmsManager.testConnection(cmsId);

    return NextResponse.json({
      success: result.connected,
      data: result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Connection test failed',
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

async function handleListCMS() {
  try {
    const cmsList = cmsManager.getRegisteredCMS();

    return NextResponse.json({
      success: true,
      data: {
        cms: cmsList,
        total: cmsList.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to list CMS platforms',
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

async function handleGetCapabilities(cmsId: string) {
  try {
    const capabilities = cmsManager.getCMSCapabilities(cmsId);

    if (!capabilities) {
      return NextResponse.json(
        { success: false, error: `CMS ${cmsId} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        cmsId,
        capabilities,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get CMS capabilities',
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

async function handleGetStatus() {
  try {
    const cmsList = cmsManager.getRegisteredCMS();
    const connectedCount = cmsList.filter(cms => cms.status === 'connected').length;

    return NextResponse.json({
      success: true,
      data: {
        totalCMS: cmsList.length,
        connectedCMS: connectedCount,
        disconnectedCMS: cmsList.length - connectedCount,
        cms: cmsList,
        systemStatus: 'operational',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get system status',
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

// OPTIONS handler for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
