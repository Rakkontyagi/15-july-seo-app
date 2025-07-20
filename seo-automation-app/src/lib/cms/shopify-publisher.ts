/**
 * Shopify Direct Publishing Integration
 * Implements NFR10: Direct CMS publishing for Shopify
 * Provides seamless product description and content publishing
 */

import { logger } from '../logging/logger';

export interface ShopifyConfig {
  shopDomain: string; // e.g., 'mystore.myshopify.com'
  accessToken: string; // Private app access token
  apiVersion?: string; // Default: '2024-01'
}

export interface ShopifyProduct {
  title: string;
  body_html: string;
  vendor?: string;
  product_type?: string;
  tags?: string;
  status?: 'active' | 'archived' | 'draft';
  published_scope?: 'web' | 'global';
  handle?: string;
  template_suffix?: string;
  metafields?: ShopifyMetafield[];
  seo?: {
    title?: string;
    description?: string;
  };
  variants?: ShopifyVariant[];
  images?: ShopifyImage[];
}

export interface ShopifyVariant {
  title?: string;
  price: string;
  sku?: string;
  inventory_quantity?: number;
  weight?: number;
  weight_unit?: 'g' | 'kg' | 'oz' | 'lb';
  requires_shipping?: boolean;
  taxable?: boolean;
  compare_at_price?: string;
}

export interface ShopifyImage {
  src: string;
  alt?: string;
  position?: number;
}

export interface ShopifyMetafield {
  namespace: string;
  key: string;
  value: string;
  type: 'single_line_text_field' | 'multi_line_text_field' | 'rich_text_field' | 'url' | 'json' | 'number_integer' | 'number_decimal' | 'date' | 'date_time' | 'boolean';
}

export interface ShopifyPublishResult {
  success: boolean;
  productId?: number;
  productUrl?: string;
  adminUrl?: string;
  handle?: string;
  error?: string;
  warnings?: string[];
}

export interface ShopifyPage {
  title: string;
  body_html: string;
  handle?: string;
  published?: boolean;
  template_suffix?: string;
  metafields?: ShopifyMetafield[];
  seo?: {
    title?: string;
    description?: string;
  };
}

export class ShopifyPublisher {
  private config: ShopifyConfig;
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(config: ShopifyConfig) {
    this.config = config;
    this.baseUrl = `https://${config.shopDomain}/admin/api/${config.apiVersion || '2024-01'}`;
    this.headers = {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': config.accessToken,
    };
  }

  /**
   * Publish product with SEO-optimized content to Shopify
   */
  async publishProduct(product: ShopifyProduct): Promise<ShopifyPublishResult> {
    try {
      logger.info('Publishing product to Shopify', { 
        title: product.title,
        shopDomain: this.config.shopDomain 
      });

      // Validate configuration
      await this.validateConnection();

      // Prepare product data
      const productData = this.prepareProductData(product);

      // Create the product
      const response = await fetch(`${this.baseUrl}/products.json`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ product: productData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Shopify API error: ${errorData.errors || response.statusText}`);
      }

      const result = await response.json();
      const createdProduct = result.product;

      // Add metafields if provided
      if (product.metafields && product.metafields.length > 0) {
        await this.addMetafields('product', createdProduct.id, product.metafields);
      }

      const publishResult: ShopifyPublishResult = {
        success: true,
        productId: createdProduct.id,
        productUrl: `https://${this.config.shopDomain}/products/${createdProduct.handle}`,
        adminUrl: `https://${this.config.shopDomain}/admin/products/${createdProduct.id}`,
        handle: createdProduct.handle,
      };

      logger.info('Product published successfully to Shopify', publishResult);
      return publishResult;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to publish product to Shopify', { error: errorMessage });
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Update existing Shopify product
   */
  async updateProduct(
    productId: number,
    product: Partial<ShopifyProduct>
  ): Promise<ShopifyPublishResult> {
    try {
      logger.info('Updating Shopify product', { productId });

      const response = await fetch(`${this.baseUrl}/products/${productId}.json`, {
        method: 'PUT',
        headers: this.headers,
        body: JSON.stringify({ product }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Shopify API error: ${errorData.errors || response.statusText}`);
      }

      const result = await response.json();
      const updatedProduct = result.product;

      // Update metafields if provided
      if (product.metafields && product.metafields.length > 0) {
        await this.addMetafields('product', productId, product.metafields);
      }

      return {
        success: true,
        productId: updatedProduct.id,
        productUrl: `https://${this.config.shopDomain}/products/${updatedProduct.handle}`,
        adminUrl: `https://${this.config.shopDomain}/admin/products/${productId}`,
        handle: updatedProduct.handle,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to update Shopify product', { error: errorMessage, productId });
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Publish page content to Shopify
   */
  async publishPage(page: ShopifyPage): Promise<ShopifyPublishResult> {
    try {
      logger.info('Publishing page to Shopify', { title: page.title });

      const pageData = this.preparePageData(page);

      const response = await fetch(`${this.baseUrl}/pages.json`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ page: pageData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Shopify API error: ${errorData.errors || response.statusText}`);
      }

      const result = await response.json();
      const createdPage = result.page;

      // Add metafields if provided
      if (page.metafields && page.metafields.length > 0) {
        await this.addMetafields('page', createdPage.id, page.metafields);
      }

      return {
        success: true,
        productId: createdPage.id,
        productUrl: `https://${this.config.shopDomain}/pages/${createdPage.handle}`,
        adminUrl: `https://${this.config.shopDomain}/admin/pages/${createdPage.id}`,
        handle: createdPage.handle,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to publish page to Shopify', { error: errorMessage });
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Validate Shopify connection and permissions
   */
  async validateConnection(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/shop.json`, {
        headers: this.headers,
      });

      if (!response.ok) {
        throw new Error(`Shopify connection failed: ${response.statusText}`);
      }

      const shop = await response.json();
      if (!shop.shop) {
        throw new Error('Invalid Shopify response');
      }

    } catch (error) {
      throw new Error(`Shopify validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Prepare product data with defaults and validation
   */
  private prepareProductData(product: ShopifyProduct): any {
    const productData: any = {
      title: product.title,
      body_html: product.body_html,
      vendor: product.vendor || '',
      product_type: product.product_type || '',
      tags: product.tags || '',
      status: product.status || 'draft',
      published_scope: product.published_scope || 'web',
      handle: product.handle || this.generateHandle(product.title),
      template_suffix: product.template_suffix || null,
    };

    // Add SEO data
    if (product.seo) {
      productData.seo_title = product.seo.title;
      productData.seo_description = product.seo.description;
    }

    // Add variants
    if (product.variants && product.variants.length > 0) {
      productData.variants = product.variants;
    } else {
      // Default variant required
      productData.variants = [{
        title: 'Default Title',
        price: '0.00',
        inventory_quantity: 0,
      }];
    }

    // Add images
    if (product.images && product.images.length > 0) {
      productData.images = product.images;
    }

    return productData;
  }

  /**
   * Prepare page data with defaults
   */
  private preparePageData(page: ShopifyPage): any {
    return {
      title: page.title,
      body_html: page.body_html,
      handle: page.handle || this.generateHandle(page.title),
      published: page.published !== false,
      template_suffix: page.template_suffix || null,
      seo_title: page.seo?.title,
      seo_description: page.seo?.description,
    };
  }

  /**
   * Add metafields to resource
   */
  private async addMetafields(
    resourceType: 'product' | 'page',
    resourceId: number,
    metafields: ShopifyMetafield[]
  ): Promise<void> {
    try {
      for (const metafield of metafields) {
        const metafieldData = {
          metafield: {
            namespace: metafield.namespace,
            key: metafield.key,
            value: metafield.value,
            type: metafield.type,
            owner_resource: resourceType,
            owner_id: resourceId,
          },
        };

        const response = await fetch(`${this.baseUrl}/metafields.json`, {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify(metafieldData),
        });

        if (!response.ok) {
          logger.warn('Failed to add metafield', { 
            resourceType, 
            resourceId, 
            metafield: metafield.key 
          });
        }
      }
    } catch (error) {
      logger.warn('Failed to add metafields', { resourceType, resourceId, error });
    }
  }

  /**
   * Generate URL-friendly handle from title
   */
  private generateHandle(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  /**
   * Get shop information
   */
  async getShopInfo(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/shop.json`, {
        headers: this.headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch shop info: ${response.statusText}`);
      }

      const result = await response.json();
      return result.shop;
    } catch (error) {
      logger.error('Failed to fetch Shopify shop info', { error });
      return null;
    }
  }
}
