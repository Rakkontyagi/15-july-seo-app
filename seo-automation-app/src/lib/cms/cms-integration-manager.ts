/**
 * CMS Integration Manager
 * Implements NFR10: Universal CMS Integration
 * Enhanced with direct WordPress and Shopify publishing
 */

import { WordPressPublisher, WordPressConfig, WordPressPost, SEOMetaData } from './wordpress-publisher';
import { ShopifyPublisher, ShopifyConfig, ShopifyProduct, ShopifyPage } from './shopify-publisher';
import { logger } from '../logging/logger';

export interface CMSConfig {
  type: 'WORDPRESS' | 'DRUPAL' | 'JOOMLA' | 'SHOPIFY' | 'WEBFLOW' | 'CUSTOM';
  apiEndpoint: string;
  apiKey: string;
  username?: string;
  password?: string;
  customHeaders?: Record<string, string>;
  version?: string;
  // Enhanced configurations
  wordpress?: WordPressConfig;
  shopify?: ShopifyConfig;
}

export interface ContentPublishRequest {
  title: string;
  content: string;
  excerpt?: string;
  tags?: string[];
  categories?: string[];
  featuredImage?: string;
  metaTitle?: string;
  metaDescription?: string;
  slug?: string;
  status: 'draft' | 'published' | 'scheduled';
  publishDate?: string;
  customFields?: Record<string, any>;
}

export interface PublishResult {
  success: boolean;
  postId?: string | number;
  url?: string;
  message: string;
  errors?: string[];
  warnings?: string[];
}

export interface CMSCapabilities {
  supportsScheduling: boolean;
  supportsCategories: boolean;
  supportsTags: boolean;
  supportsCustomFields: boolean;
  supportsFeaturedImages: boolean;
  supportsMetaData: boolean;
  supportsRevisions: boolean;
  maxContentLength?: number;
}

export class CMSIntegrationManager {
  private cmsAdapters: Map<string, CMSAdapter> = new Map();
  private directPublishers: Map<string, WordPressPublisher | ShopifyPublisher> = new Map();

  constructor() {
    this.initializeAdapters();
  }

  /**
   * ENHANCED: Configure direct WordPress publishing
   */
  configureWordPress(id: string, config: WordPressConfig): void {
    const publisher = new WordPressPublisher(config);
    this.directPublishers.set(id, publisher);
    logger.info(`Configured WordPress direct publishing: ${id}`);
  }

  /**
   * ENHANCED: Configure direct Shopify publishing
   */
  configureShopify(id: string, config: ShopifyConfig): void {
    const publisher = new ShopifyPublisher(config);
    this.directPublishers.set(id, publisher);
    logger.info(`Configured Shopify direct publishing: ${id}`);
  }

  /**
   * ENHANCED: Direct publish to WordPress
   */
  async publishToWordPress(
    id: string,
    post: WordPressPost,
    seoMeta?: SEOMetaData
  ): Promise<PublishResult> {
    try {
      const publisher = this.directPublishers.get(id) as WordPressPublisher;
      if (!publisher || !(publisher instanceof WordPressPublisher)) {
        return {
          success: false,
          message: `WordPress publisher not configured: ${id}`,
          errors: ['Publisher not found'],
        };
      }

      const result = await publisher.publishContent(post, seoMeta);

      return {
        success: result.success,
        postId: result.postId,
        url: result.postUrl,
        message: result.success ? 'Published successfully to WordPress' : result.error || 'Unknown error',
        errors: result.error ? [result.error] : undefined,
        warnings: result.warnings,
      };
    } catch (error) {
      return {
        success: false,
        message: `WordPress publishing failed: ${(error as Error).message}`,
        errors: [(error as Error).message],
      };
    }
  }

  /**
   * ENHANCED: Direct publish to Shopify
   */
  async publishToShopify(
    id: string,
    product: ShopifyProduct
  ): Promise<PublishResult> {
    try {
      const publisher = this.directPublishers.get(id) as ShopifyPublisher;
      if (!publisher || !(publisher instanceof ShopifyPublisher)) {
        return {
          success: false,
          message: `Shopify publisher not configured: ${id}`,
          errors: ['Publisher not found'],
        };
      }

      const result = await publisher.publishProduct(product);

      return {
        success: result.success,
        postId: result.productId,
        url: result.productUrl,
        message: result.success ? 'Published successfully to Shopify' : result.error || 'Unknown error',
        errors: result.error ? [result.error] : undefined,
        warnings: result.warnings,
      };
    } catch (error) {
      return {
        success: false,
        message: `Shopify publishing failed: ${(error as Error).message}`,
        errors: [(error as Error).message],
      };
    }
  }

  /**
   * Register a CMS configuration
   */
  async registerCMS(id: string, config: CMSConfig): Promise<void> {
    const adapter = this.createAdapter(config);
    await adapter.authenticate();
    this.cmsAdapters.set(id, adapter);
  }

  /**
   * Publish content to specified CMS
   */
  async publishContent(cmsId: string, request: ContentPublishRequest): Promise<PublishResult> {
    const adapter = this.cmsAdapters.get(cmsId);
    if (!adapter) {
      return {
        success: false,
        message: `CMS adapter not found: ${cmsId}`,
        errors: ['CMS not registered'],
      };
    }

    try {
      // Validate content before publishing
      const validation = await this.validateContent(request, adapter);
      if (!validation.isValid) {
        return {
          success: false,
          message: 'Content validation failed',
          errors: validation.errors,
          warnings: validation.warnings,
        };
      }

      // Transform content for CMS-specific format
      const transformedRequest = await adapter.transformContent(request);

      // Publish to CMS
      const result = await adapter.publishContent(transformedRequest);

      // Include warnings in successful results
      if (validation.warnings.length > 0) {
        result.warnings = validation.warnings;
      }

      return result;
    } catch (error) {
      return {
        success: false,
        message: `Publishing failed: ${(error as Error).message}`,
        errors: [(error as Error).message],
      };
    }
  }

  /**
   * Publish to multiple CMS platforms
   */
  async publishToMultipleCMS(
    cmsIds: string[],
    request: ContentPublishRequest
  ): Promise<Record<string, PublishResult>> {
    const results: Record<string, PublishResult> = {};

    const publishPromises = cmsIds.map(async (cmsId) => {
      const result = await this.publishContent(cmsId, request);
      results[cmsId] = result;
    });

    await Promise.all(publishPromises);
    return results;
  }

  /**
   * Get CMS capabilities
   */
  getCMSCapabilities(cmsId: string): CMSCapabilities | null {
    const adapter = this.cmsAdapters.get(cmsId);
    return adapter ? adapter.getCapabilities() : null;
  }

  /**
   * Test CMS connection
   */
  async testConnection(cmsId: string): Promise<{ connected: boolean; message: string }> {
    const adapter = this.cmsAdapters.get(cmsId);
    if (!adapter) {
      return { connected: false, message: 'CMS adapter not found' };
    }

    try {
      const isConnected = await adapter.testConnection();
      return {
        connected: isConnected,
        message: isConnected ? 'Connection successful' : 'Connection failed',
      };
    } catch (error) {
      return {
        connected: false,
        message: `Connection error: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Get all registered CMS platforms
   */
  getRegisteredCMS(): Array<{ id: string; type: string; status: 'connected' | 'disconnected' }> {
    return Array.from(this.cmsAdapters.entries()).map(([id, adapter]) => ({
      id,
      type: adapter.getType(),
      status: adapter.isConnected() ? 'connected' : 'disconnected',
    }));
  }

  // Private methods
  private initializeAdapters(): void {
    // Initialize built-in adapters
  }

  private createAdapter(config: CMSConfig): CMSAdapter {
    switch (config.type) {
      case 'WORDPRESS':
        return new WordPressAdapter(config);
      case 'DRUPAL':
        return new DrupalAdapter(config);
      case 'JOOMLA':
        return new JoomlaAdapter(config);
      case 'SHOPIFY':
        return new ShopifyAdapter(config);
      case 'WEBFLOW':
        return new WebflowAdapter(config);
      default:
        return new CustomCMSAdapter(config);
    }
  }

  private async validateContent(
    request: ContentPublishRequest,
    adapter: CMSAdapter
  ): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const capabilities = adapter.getCapabilities();

    // Validate required fields
    if (!request.title?.trim()) {
      errors.push('Title is required');
    }

    if (!request.content?.trim()) {
      errors.push('Content is required');
    }

    // Validate content length
    if (capabilities.maxContentLength && request.content.length > capabilities.maxContentLength) {
      errors.push(`Content exceeds maximum length of ${capabilities.maxContentLength} characters`);
    }

    // Validate CMS-specific features
    if (request.categories && !capabilities.supportsCategories) {
      warnings.push('Categories not supported by this CMS - will be ignored');
    }

    if (request.tags && !capabilities.supportsTags) {
      warnings.push('Tags not supported by this CMS - will be ignored');
    }

    if (request.customFields && !capabilities.supportsCustomFields) {
      warnings.push('Custom fields not supported by this CMS - will be ignored');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

// Abstract base class for CMS adapters
export abstract class CMSAdapter {
  protected config: CMSConfig;
  protected authenticated: boolean = false;

  constructor(config: CMSConfig) {
    this.config = config;
  }

  abstract authenticate(): Promise<void>;
  abstract publishContent(request: ContentPublishRequest): Promise<PublishResult>;
  abstract transformContent(request: ContentPublishRequest): Promise<ContentPublishRequest>;
  abstract getCapabilities(): CMSCapabilities;
  abstract testConnection(): Promise<boolean>;
  abstract getType(): string;

  isConnected(): boolean {
    return this.authenticated;
  }
}

// WordPress adapter implementation
export class WordPressAdapter extends CMSAdapter {
  async authenticate(): Promise<void> {
    // WordPress REST API authentication
    try {
      // Validate API endpoint URL
      new URL(this.config.apiEndpoint);

      // Validate API key
      if (!this.config.apiKey || this.config.apiKey.trim() === '') {
        throw new Error('API key is required');
      }

      const response = await fetch(`${this.config.apiEndpoint}/wp-json/wp/v2/users/me`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        this.authenticated = true;
      } else {
        throw new Error('WordPress authentication failed');
      }
    } catch (error) {
      throw new Error(`WordPress authentication error: ${(error as Error).message}`);
    }
  }

  async publishContent(request: ContentPublishRequest): Promise<PublishResult> {
    try {
      const wpPost = {
        title: request.title,
        content: request.content,
        excerpt: request.excerpt,
        status: request.status === 'published' ? 'publish' : request.status,
        slug: request.slug,
        meta: {
          _yoast_wpseo_title: request.metaTitle,
          _yoast_wpseo_metadesc: request.metaDescription,
        },
      };

      const response = await fetch(`${this.config.apiEndpoint}/wp-json/wp/v2/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(wpPost),
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          postId: result.id,
          url: result.link,
          message: 'Content published successfully to WordPress',
        };
      } else {
        const error = await response.json();
        return {
          success: false,
          message: 'WordPress publishing failed',
          errors: [error.message || 'Unknown error'],
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'WordPress publishing error',
        errors: [(error as Error).message],
      };
    }
  }

  async transformContent(request: ContentPublishRequest): Promise<ContentPublishRequest> {
    // Transform content for WordPress-specific format
    return {
      ...request,
      content: this.convertToWordPressFormat(request.content),
    };
  }

  getCapabilities(): CMSCapabilities {
    return {
      supportsScheduling: true,
      supportsCategories: true,
      supportsTags: true,
      supportsCustomFields: true,
      supportsFeaturedImages: true,
      supportsMetaData: true,
      supportsRevisions: true,
      maxContentLength: 65535,
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.apiEndpoint}/wp-json/wp/v2/posts?per_page=1`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  getType(): string {
    return 'WORDPRESS';
  }

  private convertToWordPressFormat(content: string): string {
    // Convert markdown to WordPress blocks or HTML
    return content
      .replace(/^# (.*$)/gm, '<!-- wp:heading {"level":1} --><h1>$1</h1><!-- /wp:heading -->')
      .replace(/^## (.*$)/gm, '<!-- wp:heading {"level":2} --><h2>$1</h2><!-- /wp:heading -->')
      .replace(/^### (.*$)/gm, '<!-- wp:heading {"level":3} --><h3>$1</h3><!-- /wp:heading -->');
  }
}

// Simplified implementations for other CMS adapters
export class DrupalAdapter extends CMSAdapter {
  async authenticate(): Promise<void> {
    this.authenticated = true; // Simplified
  }

  async publishContent(request: ContentPublishRequest): Promise<PublishResult> {
    return {
      success: true,
      message: 'Published to Drupal (simulated)',
      postId: Math.random().toString(),
    };
  }

  async transformContent(request: ContentPublishRequest): Promise<ContentPublishRequest> {
    return request;
  }

  getCapabilities(): CMSCapabilities {
    return {
      supportsScheduling: true,
      supportsCategories: true,
      supportsTags: true,
      supportsCustomFields: true,
      supportsFeaturedImages: true,
      supportsMetaData: true,
      supportsRevisions: true,
    };
  }

  async testConnection(): Promise<boolean> {
    return true;
  }

  getType(): string {
    return 'DRUPAL';
  }
}

export class JoomlaAdapter extends CMSAdapter {
  async authenticate(): Promise<void> {
    this.authenticated = true;
  }

  async publishContent(request: ContentPublishRequest): Promise<PublishResult> {
    return {
      success: true,
      message: 'Published to Joomla (simulated)',
      postId: Math.random().toString(),
    };
  }

  async transformContent(request: ContentPublishRequest): Promise<ContentPublishRequest> {
    return request;
  }

  getCapabilities(): CMSCapabilities {
    return {
      supportsScheduling: false,
      supportsCategories: true,
      supportsTags: false,
      supportsCustomFields: true,
      supportsFeaturedImages: true,
      supportsMetaData: true,
      supportsRevisions: false,
    };
  }

  async testConnection(): Promise<boolean> {
    return true;
  }

  getType(): string {
    return 'JOOMLA';
  }
}

export class ShopifyAdapter extends CMSAdapter {
  async authenticate(): Promise<void> {
    this.authenticated = true;
  }

  async publishContent(request: ContentPublishRequest): Promise<PublishResult> {
    return {
      success: true,
      message: 'Published to Shopify (simulated)',
      postId: Math.random().toString(),
    };
  }

  async transformContent(request: ContentPublishRequest): Promise<ContentPublishRequest> {
    return request;
  }

  getCapabilities(): CMSCapabilities {
    return {
      supportsScheduling: true,
      supportsCategories: false,
      supportsTags: true,
      supportsCustomFields: true,
      supportsFeaturedImages: true,
      supportsMetaData: true,
      supportsRevisions: false,
    };
  }

  async testConnection(): Promise<boolean> {
    return true;
  }

  getType(): string {
    return 'SHOPIFY';
  }
}

export class WebflowAdapter extends CMSAdapter {
  async authenticate(): Promise<void> {
    this.authenticated = true;
  }

  async publishContent(request: ContentPublishRequest): Promise<PublishResult> {
    return {
      success: true,
      message: 'Published to Webflow (simulated)',
      postId: Math.random().toString(),
    };
  }

  async transformContent(request: ContentPublishRequest): Promise<ContentPublishRequest> {
    return request;
  }

  getCapabilities(): CMSCapabilities {
    return {
      supportsScheduling: true,
      supportsCategories: true,
      supportsTags: true,
      supportsCustomFields: true,
      supportsFeaturedImages: true,
      supportsMetaData: true,
      supportsRevisions: true,
    };
  }

  async testConnection(): Promise<boolean> {
    return true;
  }

  getType(): string {
    return 'WEBFLOW';
  }
}

export class CustomCMSAdapter extends CMSAdapter {
  async authenticate(): Promise<void> {
    this.authenticated = true;
  }

  async publishContent(request: ContentPublishRequest): Promise<PublishResult> {
    return {
      success: true,
      message: 'Published to Custom CMS (simulated)',
      postId: Math.random().toString(),
    };
  }

  async transformContent(request: ContentPublishRequest): Promise<ContentPublishRequest> {
    return request;
  }

  getCapabilities(): CMSCapabilities {
    return {
      supportsScheduling: true,
      supportsCategories: true,
      supportsTags: true,
      supportsCustomFields: true,
      supportsFeaturedImages: true,
      supportsMetaData: true,
      supportsRevisions: true,
    };
  }

  async testConnection(): Promise<boolean> {
    return true;
  }

  getType(): string {
    return 'CUSTOM';
  }
}
