/**
 * CMS Connection Testing API Endpoint
 * Tests WordPress and Shopify connections before publishing
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { WordPressPublisher, WordPressConfig } from '@/lib/cms/wordpress-publisher';
import { ShopifyPublisher, ShopifyConfig } from '@/lib/cms/shopify-publisher';
import { logger } from '@/lib/logging/logger';

const testWordPressSchema = z.object({
  platform: z.literal('wordpress'),
  config: z.object({
    siteUrl: z.string().url(),
    username: z.string(),
    applicationPassword: z.string(),
  }),
});

const testShopifySchema = z.object({
  platform: z.literal('shopify'),
  config: z.object({
    shopDomain: z.string(),
    accessToken: z.string(),
    apiVersion: z.string().optional(),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { platform } = body;

    logger.info('CMS connection test requested', { platform });

    let result;

    switch (platform?.toLowerCase()) {
      case 'wordpress':
        const wpData = testWordPressSchema.parse(body);
        result = await testWordPressConnection(wpData.config);
        break;
      case 'shopify':
        const shopifyData = testShopifySchema.parse(body);
        result = await testShopifyConnection(shopifyData.config);
        break;
      default:
        return NextResponse.json(
          { error: `Unsupported platform: ${platform}` },
          { status: 400 }
        );
    }

    return NextResponse.json(result);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('CMS test API error', { error: errorMessage });

    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * Test WordPress connection
 */
async function testWordPressConnection(config: WordPressConfig) {
  try {
    const publisher = new WordPressPublisher(config);
    await publisher.validateConnection();

    // Get additional info
    const [categories, tags] = await Promise.all([
      publisher.getCategories().catch(() => []),
      publisher.getTags().catch(() => []),
    ]);

    return {
      success: true,
      platform: 'wordpress',
      message: 'WordPress connection successful',
      details: {
        siteUrl: config.siteUrl,
        categoriesCount: categories.length,
        tagsCount: tags.length,
        capabilities: [
          'Posts',
          'Pages',
          'Categories',
          'Tags',
          'SEO Meta',
          'Custom Fields',
        ],
      },
    };
  } catch (error) {
    return {
      success: false,
      platform: 'wordpress',
      message: 'WordPress connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Test Shopify connection
 */
async function testShopifyConnection(config: ShopifyConfig) {
  try {
    const publisher = new ShopifyPublisher(config);
    await publisher.validateConnection();

    // Get shop info
    const shopInfo = await publisher.getShopInfo().catch(() => null);

    return {
      success: true,
      platform: 'shopify',
      message: 'Shopify connection successful',
      details: {
        shopDomain: config.shopDomain,
        shopName: shopInfo?.name || 'Unknown',
        currency: shopInfo?.currency || 'Unknown',
        timezone: shopInfo?.timezone || 'Unknown',
        capabilities: [
          'Products',
          'Pages',
          'Collections',
          'Metafields',
          'SEO Meta',
          'Images',
        ],
      },
    };
  } catch (error) {
    return {
      success: false,
      platform: 'shopify',
      message: 'Shopify connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * GET endpoint for platform information
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');

    const supportedPlatforms = {
      wordpress: {
        name: 'WordPress',
        description: 'Direct publishing to WordPress sites via REST API',
        requirements: [
          'WordPress site URL',
          'Username with publishing permissions',
          'Application password (not regular password)',
        ],
        capabilities: [
          'Posts and pages',
          'Categories and tags',
          'SEO metadata (Yoast/RankMath)',
          'Custom fields',
          'Featured images',
          'Scheduling',
        ],
      },
      shopify: {
        name: 'Shopify',
        description: 'Direct publishing to Shopify stores via Admin API',
        requirements: [
          'Shopify store domain (e.g., mystore.myshopify.com)',
          'Private app access token',
          'Admin API permissions',
        ],
        capabilities: [
          'Products and variants',
          'Pages and blogs',
          'Metafields',
          'SEO metadata',
          'Images and media',
          'Collections',
        ],
      },
    };

    if (platform && platform in supportedPlatforms) {
      return NextResponse.json({
        platform,
        ...supportedPlatforms[platform as keyof typeof supportedPlatforms],
      });
    }

    return NextResponse.json({
      supportedPlatforms: Object.keys(supportedPlatforms),
      platforms: supportedPlatforms,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('CMS info API error', { error: errorMessage });

    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}
