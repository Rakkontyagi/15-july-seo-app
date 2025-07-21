// Shopify CMS Integration Service

import { 
  CMSContent, 
  CMSCredentials, 
  CMSPublishResult, 
  CMSPublishOptions,
  CMSSyncStatus,
  ShopifyProduct,
  CMSIntegrationError
} from '@/types/cms';
import { BaseCMSService } from './base.cms.service';
import { logger } from '@/lib/logging/logger';
import axios, { AxiosInstance } from 'axios';

export class ShopifyService extends BaseCMSService {
  private client: AxiosInstance;
  private storeId: string;

  constructor(credentials: CMSCredentials) {
    super(credentials);
    
    this.storeId = credentials.storeId || this.extractStoreId(credentials.endpoint);
    
    // Create axios instance with base configuration
    this.client = axios.create({
      baseURL: this.normalizeEndpoint(credentials.endpoint),
      timeout: 30000,
      headers: this.buildAuthHeaders()
    });

    // Add request interceptor for rate limiting
    this.client.interceptors.request.use(async (config) => {
      await this.rateLimit();
      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      error => this.handleApiError(error)
    );
  }

  private extractStoreId(endpoint: string): string {
    const match = endpoint.match(/https:\/\/([^.]+)\.myshopify\.com/);
    if (!match) {
      throw new Error('Invalid Shopify endpoint format. Expected: https://store.myshopify.com');
    }
    return match[1];
  }

  private normalizeEndpoint(endpoint: string): string {
    // Ensure endpoint has the correct Shopify API format
    if (!endpoint.includes('/admin/api/')) {
      const apiVersion = '2024-01'; // Use latest stable API version
      endpoint = endpoint.replace(/\/$/, '') + `/admin/api/${apiVersion}`;
    }
    
    return endpoint;
  }

  private buildAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'SEO-Content-Generator/1.0'
    };

    if (this.credentials.apiKey) {
      // Private app access token
      headers['X-Shopify-Access-Token'] = this.credentials.apiKey;
    } else if (this.credentials.username && this.credentials.password) {
      // Basic auth for some use cases
      const auth = Buffer.from(`${this.credentials.username}:${this.credentials.password}`).toString('base64');
      headers['Authorization'] = `Basic ${auth}`;
    }

    return headers;
  }

  async validateCredentials(): Promise<boolean> {
    try {
      // Test connection by fetching shop info
      const response = await this.client.get('/shop.json');
      logger.info('Shopify credentials validated successfully');
      return response.status === 200;
    } catch (error: any) {
      logger.error('Shopify credentials validation failed:', error.message);
      return false;
    }
  }

  async publish(content: CMSContent, options?: CMSPublishOptions): Promise<CMSPublishResult> {
    try {
      // Check for duplicate content if needed
      if (!options?.skipDuplicateCheck) {
        const existingId = await this.checkDuplicateContent(content.title);
        if (existingId && !options?.updateIfExists) {
          return {
            success: false,
            platform: 'shopify',
            error: 'Product with this title already exists',
            details: { existingId }
          };
        } else if (existingId && options?.updateIfExists) {
          return this.update(existingId, content, options);
        }
      }

      // Transform content to Shopify product format
      const shopifyProduct = this.transformToShopifyProduct(content, options);

      // Create the product
      const response = await this.client.post<{ product: ShopifyProduct }>('/products.json', {
        product: shopifyProduct
      });
      
      const createdProduct = response.data.product;

      // Add metafields for SEO if provided
      if (content.metaTitle || content.metaDescription || content.focusKeyword) {
        await this.addSEOMetafields(createdProduct.id!, content);
      }

      // Inject schema markup if requested
      if (options?.injectSchema && content.schemaMarkup) {
        await this.addSchemaMetafield(createdProduct.id!, content.schemaMarkup);
      }

      logger.info(`Shopify product created successfully: ${createdProduct.id}`);

      return {
        success: true,
        platform: 'shopify',
        contentId: createdProduct.id?.toString(),
        url: `https://${this.storeId}.myshopify.com/products/${createdProduct.handle}`,
        publishedAt: new Date(createdProduct.created_at || Date.now())
      };

    } catch (error) {
      logger.error('Shopify publish failed:', error);
      return {
        success: false,
        platform: 'shopify',
        error: error instanceof Error ? error.message : 'Failed to publish to Shopify',
        details: error
      };
    }
  }

  async update(contentId: string, content: CMSContent, options?: CMSPublishOptions): Promise<CMSPublishResult> {
    try {
      const shopifyProduct = this.transformToShopifyProduct(content, options);

      const response = await this.client.put<{ product: ShopifyProduct }>(`/products/${contentId}.json`, {
        product: shopifyProduct
      });
      
      const updatedProduct = response.data.product;

      // Update SEO metafields
      if (content.metaTitle || content.metaDescription || content.focusKeyword) {
        await this.addSEOMetafields(updatedProduct.id!, content);
      }

      logger.info(`Shopify product updated successfully: ${contentId}`);

      return {
        success: true,
        platform: 'shopify',
        contentId: contentId,
        url: `https://${this.storeId}.myshopify.com/products/${updatedProduct.handle}`,
        publishedAt: new Date(updatedProduct.updated_at || Date.now())
      };

    } catch (error) {
      logger.error('Shopify update failed:', error);
      return {
        success: false,
        platform: 'shopify',
        error: error instanceof Error ? error.message : 'Failed to update Shopify product',
        details: error
      };
    }
  }

  async delete(contentId: string): Promise<boolean> {
    try {
      await this.client.delete(`/products/${contentId}.json`);
      logger.info(`Shopify product deleted: ${contentId}`);
      return true;
    } catch (error) {
      logger.error('Shopify delete failed:', error);
      return false;
    }
  }

  async getContent(contentId: string): Promise<CMSContent | null> {
    try {
      const response = await this.client.get<{ product: ShopifyProduct }>(`/products/${contentId}.json`);
      const product = response.data.product;
      
      // Get SEO metafields
      const seoData = await this.getSEOMetafields(product.id!);
      
      return this.transformFromShopifyProduct(product, seoData);
    } catch (error) {
      logger.error('Failed to get Shopify product:', error);
      return null;
    }
  }

  async listContent(filters?: any): Promise<CMSContent[]> {
    try {
      const params: any = {
        limit: filters?.limit || 50, // Shopify max is 250
        page: filters?.page || 1,
        status: filters?.status || 'any',
        fields: 'id,title,body_html,handle,status,created_at,updated_at,tags,product_type'
      };

      if (filters?.title) {
        params.title = filters.title;
      }

      if (filters?.handle) {
        params.handle = filters.handle;
      }

      const response = await this.client.get<{ products: ShopifyProduct[] }>('/products.json', { params });
      
      // Transform products to CMS content format
      const transformPromises = response.data.products.map(async (product) => {
        const seoData = await this.getSEOMetafields(product.id!);
        return this.transformFromShopifyProduct(product, seoData);
      });

      return await Promise.all(transformPromises);
    } catch (error) {
      logger.error('Failed to list Shopify products:', error);
      return [];
    }
  }

  async getSyncStatus(contentId: string, localVersion: string): Promise<CMSSyncStatus> {
    try {
      const remoteContent = await this.getContent(contentId);
      
      if (!remoteContent) {
        throw new Error('Product not found on Shopify');
      }

      const remoteVersion = remoteContent.customFields?.updated_at || 
                          new Date(remoteContent.customFields?.updated_at || Date.now()).toISOString();

      let syncStatus: CMSSyncStatus['syncStatus'] = 'synced';
      const differences: string[] = [];

      // Compare versions
      if (localVersion !== remoteVersion) {
        const localDate = new Date(localVersion);
        const remoteDate = new Date(remoteVersion);
        
        if (localDate > remoteDate) {
          syncStatus = 'local_ahead';
        } else if (remoteDate > localDate) {
          syncStatus = 'remote_ahead';
        } else {
          syncStatus = 'conflict';
        }
        
        differences.push('Version mismatch');
      }

      return {
        platform: 'shopify',
        contentId,
        localVersion,
        remoteVersion,
        lastSyncedAt: new Date(),
        syncStatus,
        differences: differences.length > 0 ? differences : undefined
      };

    } catch (error) {
      logger.error('Failed to get Shopify sync status:', error);
      throw error;
    }
  }

  // Helper methods specific to Shopify

  private transformToShopifyProduct(content: CMSContent, options?: CMSPublishOptions): Partial<ShopifyProduct> {
    const product: Partial<ShopifyProduct> = {
      title: content.title,
      body_html: options?.injectSchema ? this.injectSEOMetadata(content) : content.content,
      vendor: content.author || 'SEO Content Generator',
      product_type: 'Content',
      status: this.mapStatus(content.status),
      tags: content.tags?.join(', ') || ''
    };

    if (content.slug) {
      product.handle = content.slug;
    } else if (options?.autoGenerateSlug) {
      product.handle = this.generateSlug(content.title);
    }

    // Set publish date if scheduled
    if (content.publishDate && content.status === 'scheduled') {
      product.published_at = content.publishDate.toISOString();
    }

    return product;
  }

  private transformFromShopifyProduct(product: ShopifyProduct, seoData?: any): CMSContent {
    return {
      id: product.id?.toString(),
      title: product.title,
      content: product.body_html,
      excerpt: this.extractExcerpt(product.body_html),
      slug: product.handle,
      status: this.mapShopifyStatus(product.status),
      publishDate: product.published_at ? new Date(product.published_at) : undefined,
      categories: [product.product_type || 'Uncategorized'],
      tags: product.tags ? product.tags.split(', ').filter(Boolean) : [],
      author: product.vendor,
      metaTitle: seoData?.title,
      metaDescription: seoData?.description,
      focusKeyword: seoData?.focusKeyword,
      customFields: {
        shopifyId: product.id,
        handle: product.handle,
        vendor: product.vendor,
        created_at: product.created_at,
        updated_at: product.updated_at,
        admin_graphql_api_id: product.admin_graphql_api_id
      }
    };
  }

  private mapStatus(status: CMSContent['status']): ShopifyProduct['status'] {
    const statusMap: Record<CMSContent['status'], ShopifyProduct['status']> = {
      'draft': 'draft',
      'published': 'active',
      'scheduled': 'active', // Shopify doesn't have scheduled, use published_at instead
      'private': 'draft'
    };
    return statusMap[status] || 'draft';
  }

  private mapShopifyStatus(status: ShopifyProduct['status']): CMSContent['status'] {
    const statusMap: Record<ShopifyProduct['status'], CMSContent['status']> = {
      'active': 'published',
      'draft': 'draft',
      'archived': 'private'
    };
    return statusMap[status] || 'draft';
  }

  private extractExcerpt(bodyHtml: string): string {
    // Strip HTML and get first 160 characters
    const textContent = bodyHtml.replace(/<[^>]*>/g, '');
    return textContent.substring(0, 160) + (textContent.length > 160 ? '...' : '');
  }

  private async addSEOMetafields(productId: number, content: CMSContent): Promise<void> {
    try {
      const metafields = [];

      if (content.metaTitle) {
        metafields.push({
          namespace: 'seo',
          key: 'title',
          value: content.metaTitle,
          type: 'single_line_text_field'
        });
      }

      if (content.metaDescription) {
        metafields.push({
          namespace: 'seo',
          key: 'description',
          value: content.metaDescription,
          type: 'multi_line_text_field'
        });
      }

      if (content.focusKeyword) {
        metafields.push({
          namespace: 'seo',
          key: 'focus_keyword',
          value: content.focusKeyword,
          type: 'single_line_text_field'
        });
      }

      // Add metafields in batch
      for (const metafield of metafields) {
        await this.client.post(`/products/${productId}/metafields.json`, {
          metafield
        });
      }

    } catch (error) {
      logger.warn('Failed to add SEO metafields:', error);
    }
  }

  private async addSchemaMetafield(productId: number, schemaMarkup: string): Promise<void> {
    try {
      await this.client.post(`/products/${productId}/metafields.json`, {
        metafield: {
          namespace: 'seo',
          key: 'schema_markup',
          value: schemaMarkup,
          type: 'multi_line_text_field'
        }
      });
    } catch (error) {
      logger.warn('Failed to add schema metafield:', error);
    }
  }

  private async getSEOMetafields(productId: number): Promise<any> {
    try {
      const response = await this.client.get(`/products/${productId}/metafields.json`, {
        params: { namespace: 'seo' }
      });

      const metafields = response.data.metafields || [];
      const seoData: any = {};

      metafields.forEach((metafield: any) => {
        switch (metafield.key) {
          case 'title':
            seoData.title = metafield.value;
            break;
          case 'description':
            seoData.description = metafield.value;
            break;
          case 'focus_keyword':
            seoData.focusKeyword = metafield.value;
            break;
          case 'schema_markup':
            seoData.schemaMarkup = metafield.value;
            break;
        }
      });

      return seoData;
    } catch (error) {
      logger.warn('Failed to get SEO metafields:', error);
      return {};
    }
  }
}