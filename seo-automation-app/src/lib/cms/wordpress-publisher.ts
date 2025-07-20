/**
 * WordPress Direct Publishing Integration
 * Implements NFR10: Direct CMS publishing for WordPress
 * Provides seamless content publishing with SEO optimization
 */

import { logger } from '../logging/logger';

export interface WordPressConfig {
  siteUrl: string;
  username: string;
  applicationPassword: string; // WordPress Application Password
  defaultAuthor?: number;
  defaultStatus?: 'draft' | 'publish' | 'pending' | 'private';
  defaultCategory?: number[];
  defaultTags?: number[];
}

export interface WordPressPost {
  title: string;
  content: string;
  excerpt?: string;
  status?: 'draft' | 'publish' | 'pending' | 'private';
  author?: number;
  categories?: number[];
  tags?: number[];
  meta?: Record<string, any>;
  featured_media?: number;
  slug?: string;
  date?: string;
}

export interface WordPressPublishResult {
  success: boolean;
  postId?: number;
  postUrl?: string;
  editUrl?: string;
  error?: string;
  warnings?: string[];
}

export interface SEOMetaData {
  metaTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  schema?: Record<string, any>;
}

export class WordPressPublisher {
  private config: WordPressConfig;
  private baseUrl: string;
  private authHeader: string;

  constructor(config: WordPressConfig) {
    this.config = config;
    this.baseUrl = `${config.siteUrl.replace(/\/$/, '')}/wp-json/wp/v2`;
    this.authHeader = `Basic ${Buffer.from(`${config.username}:${config.applicationPassword}`).toString('base64')}`;
  }

  /**
   * Publish content directly to WordPress with SEO optimization
   */
  async publishContent(
    post: WordPressPost,
    seoMeta?: SEOMetaData
  ): Promise<WordPressPublishResult> {
    try {
      logger.info('Publishing content to WordPress', { 
        title: post.title,
        siteUrl: this.config.siteUrl 
      });

      // Validate configuration
      await this.validateConnection();

      // Prepare post data with defaults
      const postData = this.preparePostData(post);

      // Create the post
      const response = await fetch(`${this.baseUrl}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.authHeader,
        },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`WordPress API error: ${errorData.message || response.statusText}`);
      }

      const createdPost = await response.json();

      // Add SEO metadata if provided
      if (seoMeta) {
        await this.addSEOMetadata(createdPost.id, seoMeta);
      }

      const result: WordPressPublishResult = {
        success: true,
        postId: createdPost.id,
        postUrl: createdPost.link,
        editUrl: `${this.config.siteUrl}/wp-admin/post.php?post=${createdPost.id}&action=edit`,
      };

      logger.info('Content published successfully to WordPress', result);
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to publish content to WordPress', { error: errorMessage });
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Update existing WordPress post
   */
  async updateContent(
    postId: number,
    post: Partial<WordPressPost>,
    seoMeta?: SEOMetaData
  ): Promise<WordPressPublishResult> {
    try {
      logger.info('Updating WordPress post', { postId });

      const response = await fetch(`${this.baseUrl}/posts/${postId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.authHeader,
        },
        body: JSON.stringify(post),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`WordPress API error: ${errorData.message || response.statusText}`);
      }

      const updatedPost = await response.json();

      // Update SEO metadata if provided
      if (seoMeta) {
        await this.addSEOMetadata(postId, seoMeta);
      }

      return {
        success: true,
        postId: updatedPost.id,
        postUrl: updatedPost.link,
        editUrl: `${this.config.siteUrl}/wp-admin/post.php?post=${postId}&action=edit`,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to update WordPress post', { error: errorMessage, postId });
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Validate WordPress connection and permissions
   */
  async validateConnection(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/posts?per_page=1`, {
        headers: {
          'Authorization': this.authHeader,
        },
      });

      if (!response.ok) {
        throw new Error(`WordPress connection failed: ${response.statusText}`);
      }

      // Test if we can create posts
      const userResponse = await fetch(`${this.baseUrl}/users/me`, {
        headers: {
          'Authorization': this.authHeader,
        },
      });

      if (!userResponse.ok) {
        throw new Error('WordPress authentication failed');
      }

      const user = await userResponse.json();
      if (!user.capabilities?.edit_posts) {
        throw new Error('WordPress user lacks post creation permissions');
      }

    } catch (error) {
      throw new Error(`WordPress validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Prepare post data with defaults and validation
   */
  private preparePostData(post: WordPressPost): any {
    return {
      title: post.title,
      content: post.content,
      excerpt: post.excerpt || '',
      status: post.status || this.config.defaultStatus || 'draft',
      author: post.author || this.config.defaultAuthor,
      categories: post.categories || this.config.defaultCategory || [],
      tags: post.tags || this.config.defaultTags || [],
      slug: post.slug || this.generateSlug(post.title),
      date: post.date || new Date().toISOString(),
      meta: post.meta || {},
    };
  }

  /**
   * Add SEO metadata using Yoast SEO or RankMath
   */
  private async addSEOMetadata(postId: number, seoMeta: SEOMetaData): Promise<void> {
    try {
      // Prepare SEO meta fields (Yoast SEO format)
      const metaFields: Record<string, any> = {};

      if (seoMeta.metaTitle) metaFields._yoast_wpseo_title = seoMeta.metaTitle;
      if (seoMeta.metaDescription) metaFields._yoast_wpseo_metadesc = seoMeta.metaDescription;
      if (seoMeta.focusKeyword) metaFields._yoast_wpseo_focuskw = seoMeta.focusKeyword;
      if (seoMeta.canonicalUrl) metaFields._yoast_wpseo_canonical = seoMeta.canonicalUrl;
      if (seoMeta.ogTitle) metaFields._yoast_wpseo_opengraph_title = seoMeta.ogTitle;
      if (seoMeta.ogDescription) metaFields._yoast_wpseo_opengraph_description = seoMeta.ogDescription;
      if (seoMeta.ogImage) metaFields._yoast_wpseo_opengraph_image = seoMeta.ogImage;
      if (seoMeta.twitterTitle) metaFields._yoast_wpseo_twitter_title = seoMeta.twitterTitle;
      if (seoMeta.twitterDescription) metaFields._yoast_wpseo_twitter_description = seoMeta.twitterDescription;
      if (seoMeta.twitterImage) metaFields._yoast_wpseo_twitter_image = seoMeta.twitterImage;

      // Update post meta
      if (Object.keys(metaFields).length > 0) {
        const response = await fetch(`${this.baseUrl}/posts/${postId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': this.authHeader,
          },
          body: JSON.stringify({ meta: metaFields }),
        });

        if (!response.ok) {
          logger.warn('Failed to add SEO metadata', { postId, error: response.statusText });
        }
      }

    } catch (error) {
      logger.warn('Failed to add SEO metadata', { postId, error });
    }
  }

  /**
   * Generate URL-friendly slug from title
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  /**
   * Get WordPress categories
   */
  async getCategories(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/categories?per_page=100`, {
        headers: {
          'Authorization': this.authHeader,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Failed to fetch WordPress categories', { error });
      return [];
    }
  }

  /**
   * Get WordPress tags
   */
  async getTags(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/tags?per_page=100`, {
        headers: {
          'Authorization': this.authHeader,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tags: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Failed to fetch WordPress tags', { error });
      return [];
    }
  }
}
