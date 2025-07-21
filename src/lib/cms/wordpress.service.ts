// WordPress CMS Integration Service

import { 
  CMSContent, 
  CMSCredentials, 
  CMSPublishResult, 
  CMSPublishOptions,
  CMSSyncStatus,
  WordPressPost,
  CMSIntegrationError
} from '@/types/cms';
import { BaseCMSService } from './base.cms.service';
import { logger } from '@/lib/logging/logger';
import axios, { AxiosInstance } from 'axios';

export class WordPressService extends BaseCMSService {
  private client: AxiosInstance;
  private isApplicationPassword: boolean = false;

  constructor(credentials: CMSCredentials) {
    super(credentials);
    
    // Determine authentication method
    this.isApplicationPassword = !!(credentials.username && credentials.password);
    
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

  private normalizeEndpoint(endpoint: string): string {
    // Ensure endpoint has /wp-json/wp/v2 suffix
    endpoint = endpoint.replace(/\/$/, ''); // Remove trailing slash
    
    if (!endpoint.includes('/wp-json/wp/v2')) {
      endpoint += '/wp-json/wp/v2';
    }
    
    return endpoint;
  }

  private buildAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'SEO-Content-Generator/1.0'
    };

    if (this.isApplicationPassword && this.credentials.username && this.credentials.password) {
      // WordPress Application Password authentication
      const auth = Buffer.from(`${this.credentials.username}:${this.credentials.password}`).toString('base64');
      headers['Authorization'] = `Basic ${auth}`;
    } else if (this.credentials.apiKey) {
      // JWT or custom token authentication
      headers['Authorization'] = `Bearer ${this.credentials.apiKey}`;
    }

    return headers;
  }

  async validateCredentials(): Promise<boolean> {
    try {
      // Test connection by fetching user info
      const response = await this.client.get('/users/me');
      logger.info('WordPress credentials validated successfully');
      return response.status === 200;
    } catch (error: any) {
      logger.error('WordPress credentials validation failed:', error.message);
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
            platform: 'wordpress',
            error: 'Content with this title already exists',
            details: { existingId }
          };
        } else if (existingId && options?.updateIfExists) {
          return this.update(existingId, content, options);
        }
      }

      // Transform content to WordPress format
      const wpPost = this.transformToWordPressPost(content, options);

      // Handle categories and tags
      if (content.categories?.length) {
        wpPost.categories = await this.getCategoryIds(content.categories);
      }
      if (content.tags?.length) {
        wpPost.tags = await this.getTagIds(content.tags);
      }

      // Handle featured image if provided
      if (content.featuredImage) {
        const mediaId = await this.uploadMedia(content.featuredImage, content.title);
        if (mediaId) {
          wpPost.featured_media = mediaId;
        }
      }

      // Inject Yoast SEO metadata if available
      if (content.metaTitle || content.metaDescription || content.focusKeyword) {
        wpPost.meta = this.buildYoastMeta(content);
      }

      // Publish the post
      const response = await this.client.post<WordPressPost>('/posts', wpPost);
      const publishedPost = response.data;

      logger.info(`WordPress post published successfully: ${publishedPost.id}`);

      return {
        success: true,
        platform: 'wordpress',
        contentId: publishedPost.id?.toString(),
        url: publishedPost.link,
        publishedAt: new Date(publishedPost.date || Date.now())
      };

    } catch (error) {
      logger.error('WordPress publish failed:', error);
      return {
        success: false,
        platform: 'wordpress',
        error: error instanceof Error ? error.message : 'Failed to publish to WordPress',
        details: error
      };
    }
  }

  async update(contentId: string, content: CMSContent, options?: CMSPublishOptions): Promise<CMSPublishResult> {
    try {
      const wpPost = this.transformToWordPressPost(content, options);

      // Handle categories and tags
      if (content.categories?.length) {
        wpPost.categories = await this.getCategoryIds(content.categories);
      }
      if (content.tags?.length) {
        wpPost.tags = await this.getTagIds(content.tags);
      }

      // Update Yoast SEO metadata
      if (content.metaTitle || content.metaDescription || content.focusKeyword) {
        wpPost.meta = this.buildYoastMeta(content);
      }

      const response = await this.client.patch<WordPressPost>(`/posts/${contentId}`, wpPost);
      const updatedPost = response.data;

      logger.info(`WordPress post updated successfully: ${contentId}`);

      return {
        success: true,
        platform: 'wordpress',
        contentId: contentId,
        url: updatedPost.link,
        publishedAt: new Date(updatedPost.modified || Date.now())
      };

    } catch (error) {
      logger.error('WordPress update failed:', error);
      return {
        success: false,
        platform: 'wordpress',
        error: error instanceof Error ? error.message : 'Failed to update WordPress post',
        details: error
      };
    }
  }

  async delete(contentId: string): Promise<boolean> {
    try {
      await this.client.delete(`/posts/${contentId}`, {
        params: { force: true }
      });
      logger.info(`WordPress post deleted: ${contentId}`);
      return true;
    } catch (error) {
      logger.error('WordPress delete failed:', error);
      return false;
    }
  }

  async getContent(contentId: string): Promise<CMSContent | null> {
    try {
      const response = await this.client.get<WordPressPost>(`/posts/${contentId}`);
      const post = response.data;
      
      return this.transformFromWordPressPost(post);
    } catch (error) {
      logger.error('Failed to get WordPress content:', error);
      return null;
    }
  }

  async listContent(filters?: any): Promise<CMSContent[]> {
    try {
      const params: any = {
        per_page: filters?.limit || 100,
        page: filters?.page || 1,
        status: filters?.status || 'publish,draft,pending,private',
        orderby: filters?.orderby || 'date',
        order: filters?.order || 'desc'
      };

      if (filters?.title) {
        params.search = filters.title;
      }

      if (filters?.author) {
        params.author = filters.author;
      }

      const response = await this.client.get<WordPressPost[]>('/posts', { params });
      
      return response.data.map(post => this.transformFromWordPressPost(post));
    } catch (error) {
      logger.error('Failed to list WordPress content:', error);
      return [];
    }
  }

  async getSyncStatus(contentId: string, localVersion: string): Promise<CMSSyncStatus> {
    try {
      const remoteContent = await this.getContent(contentId);
      
      if (!remoteContent) {
        throw new Error('Content not found on WordPress');
      }

      const remoteVersion = remoteContent.customFields?.version || 
                          new Date(remoteContent.customFields?.modified || Date.now()).toISOString();

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
        platform: 'wordpress',
        contentId,
        localVersion,
        remoteVersion,
        lastSyncedAt: new Date(),
        syncStatus,
        differences: differences.length > 0 ? differences : undefined
      };

    } catch (error) {
      logger.error('Failed to get WordPress sync status:', error);
      throw error;
    }
  }

  // Helper methods specific to WordPress

  private transformToWordPressPost(content: CMSContent, options?: CMSPublishOptions): Partial<WordPressPost> {
    const post: Partial<WordPressPost> = {
      title: { rendered: content.title },
      content: { rendered: options?.injectSchema ? this.injectSEOMetadata(content) : content.content },
      excerpt: { rendered: content.excerpt || '' },
      status: this.mapStatus(content.status),
      slug: content.slug || this.generateSlug(content.title),
      comment_status: 'closed',
      ping_status: 'closed'
    };

    if (content.publishDate) {
      post.date = content.publishDate.toISOString();
      post.date_gmt = content.publishDate.toISOString();
    }

    return post;
  }

  private transformFromWordPressPost(post: WordPressPost): CMSContent {
    return {
      id: post.id?.toString(),
      title: post.title.rendered,
      content: post.content.rendered,
      excerpt: post.excerpt?.rendered,
      slug: post.slug,
      status: this.mapWordPressStatus(post.status),
      publishDate: post.date ? new Date(post.date) : undefined,
      categories: [], // Would need to fetch category names
      tags: [], // Would need to fetch tag names
      featuredImage: undefined, // Would need to fetch media URL
      author: post.author?.toString(),
      metaTitle: post.yoast_head_json?.title,
      metaDescription: post.yoast_head_json?.description,
      canonicalUrl: post.link,
      customFields: {
        modified: post.modified,
        wpId: post.id,
        guid: post.guid?.rendered
      }
    };
  }

  private mapStatus(status: CMSContent['status']): WordPressPost['status'] {
    const statusMap: Record<CMSContent['status'], WordPressPost['status']> = {
      'draft': 'draft',
      'published': 'publish',
      'scheduled': 'future',
      'private': 'private'
    };
    return statusMap[status] || 'draft';
  }

  private mapWordPressStatus(status: WordPressPost['status']): CMSContent['status'] {
    const statusMap: Record<WordPressPost['status'], CMSContent['status']> = {
      'draft': 'draft',
      'pending': 'draft',
      'publish': 'published',
      'future': 'scheduled',
      'private': 'private'
    };
    return statusMap[status] || 'draft';
  }

  private async getCategoryIds(categoryNames: string[]): Promise<number[]> {
    const ids: number[] = [];
    
    for (const name of categoryNames) {
      try {
        // First, try to find existing category
        const response = await this.client.get('/categories', {
          params: { search: name }
        });
        
        if (response.data.length > 0) {
          ids.push(response.data[0].id);
        } else {
          // Create new category if not found
          const newCategory = await this.client.post('/categories', {
            name: name,
            slug: this.generateSlug(name)
          });
          ids.push(newCategory.data.id);
        }
      } catch (error) {
        logger.warn(`Failed to get/create category "${name}":`, error);
      }
    }
    
    return ids;
  }

  private async getTagIds(tagNames: string[]): Promise<number[]> {
    const ids: number[] = [];
    
    for (const name of tagNames) {
      try {
        // First, try to find existing tag
        const response = await this.client.get('/tags', {
          params: { search: name }
        });
        
        if (response.data.length > 0) {
          ids.push(response.data[0].id);
        } else {
          // Create new tag if not found
          const newTag = await this.client.post('/tags', {
            name: name,
            slug: this.generateSlug(name)
          });
          ids.push(newTag.data.id);
        }
      } catch (error) {
        logger.warn(`Failed to get/create tag "${name}":`, error);
      }
    }
    
    return ids;
  }

  private async uploadMedia(imageUrl: string, altText: string): Promise<number | null> {
    try {
      // This is a simplified version - in production, you'd want to:
      // 1. Download the image
      // 2. Upload it to WordPress media library
      // 3. Return the media ID
      
      logger.warn('Media upload not implemented - featured image will not be set');
      return null;
    } catch (error) {
      logger.error('Failed to upload media:', error);
      return null;
    }
  }

  private buildYoastMeta(content: CMSContent): Record<string, any> {
    const meta: Record<string, any> = {};
    
    if (content.metaTitle) {
      meta._yoast_wpseo_title = content.metaTitle;
    }
    
    if (content.metaDescription) {
      meta._yoast_wpseo_metadesc = content.metaDescription;
    }
    
    if (content.focusKeyword) {
      meta._yoast_wpseo_focuskw = content.focusKeyword;
    }
    
    if (content.canonicalUrl) {
      meta._yoast_wpseo_canonical = content.canonicalUrl;
    }
    
    return meta;
  }
}