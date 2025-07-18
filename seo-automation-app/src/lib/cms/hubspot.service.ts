// HubSpot CMS Integration Service

import { 
  CMSContent, 
  CMSCredentials, 
  CMSPublishResult, 
  CMSPublishOptions,
  CMSSyncStatus,
  HubSpotContent,
  CMSIntegrationError
} from '@/types/cms';
import { BaseCMSService } from './base.cms.service';
import { logger } from '@/lib/logging/logger';
import axios, { AxiosInstance } from 'axios';

export class HubSpotService extends BaseCMSService {
  private client: AxiosInstance;
  private hubId: string;

  constructor(credentials: CMSCredentials) {
    super(credentials);
    
    this.hubId = credentials.hubId || this.extractHubId(credentials.endpoint);
    
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

  private extractHubId(endpoint: string): string {
    // Extract hub ID from various HubSpot endpoint formats
    const match = endpoint.match(/hub\.id=(\d+)|hubapi\.com\/(\d+)|portals\/(\d+)/);
    if (match) {
      return match[1] || match[2] || match[3];
    }
    // Default to 'default' if no hub ID found
    return 'default';
  }

  private normalizeEndpoint(endpoint: string): string {
    // Ensure endpoint has the correct HubSpot API format
    if (!endpoint.includes('api.hubapi.com')) {
      return 'https://api.hubapi.com';
    }
    
    return endpoint;
  }

  private buildAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'SEO-Content-Generator/1.0'
    };

    if (this.credentials.apiKey) {
      // Private app access token (recommended)
      headers['Authorization'] = `Bearer ${this.credentials.apiKey}`;
    } else if (this.credentials.accessToken) {
      // OAuth access token
      headers['Authorization'] = `Bearer ${this.credentials.accessToken}`;
    }

    return headers;
  }

  async validateCredentials(): Promise<boolean> {
    try {
      // Test connection by fetching account info
      const response = await this.client.get('/account-info/v3/api-usage/daily');
      logger.info('HubSpot credentials validated successfully');
      return response.status === 200;
    } catch (error: any) {
      logger.error('HubSpot credentials validation failed:', error.message);
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
            platform: 'hubspot',
            error: 'Blog post with this title already exists',
            details: { existingId }
          };
        } else if (existingId && options?.updateIfExists) {
          return this.update(existingId, content, options);
        }
      }

      // Transform content to HubSpot blog post format
      const hubspotPost = this.transformToHubSpotPost(content, options);

      // Create the blog post
      const response = await this.client.post<HubSpotContent>('/cms/v3/blogs/posts', hubspotPost);
      const createdPost = response.data;

      // Handle SEO settings if provided
      if (content.metaTitle || content.metaDescription || content.focusKeyword) {
        await this.updateSEOSettings(createdPost.id!, content);
      }

      // Schedule publication if needed
      if (content.status === 'scheduled' && content.publishDate) {
        await this.schedulePost(createdPost.id!, content.publishDate);
      }

      logger.info(`HubSpot blog post created successfully: ${createdPost.id}`);

      const postUrl = await this.getPostUrl(createdPost.id!);

      return {
        success: true,
        platform: 'hubspot',
        contentId: createdPost.id,
        url: postUrl,
        publishedAt: new Date(createdPost.publishedAt || createdPost.created || Date.now())
      };

    } catch (error) {
      logger.error('HubSpot publish failed:', error);
      return {
        success: false,
        platform: 'hubspot',
        error: error instanceof Error ? error.message : 'Failed to publish to HubSpot',
        details: error
      };
    }
  }

  async update(contentId: string, content: CMSContent, options?: CMSPublishOptions): Promise<CMSPublishResult> {
    try {
      const hubspotPost = this.transformToHubSpotPost(content, options);

      const response = await this.client.patch<HubSpotContent>(`/cms/v3/blogs/posts/${contentId}`, hubspotPost);
      const updatedPost = response.data;

      // Update SEO settings
      if (content.metaTitle || content.metaDescription || content.focusKeyword) {
        await this.updateSEOSettings(updatedPost.id!, content);
      }

      logger.info(`HubSpot blog post updated successfully: ${contentId}`);

      const postUrl = await this.getPostUrl(updatedPost.id!);

      return {
        success: true,
        platform: 'hubspot',
        contentId: contentId,
        url: postUrl,
        publishedAt: new Date(updatedPost.updated || Date.now())
      };

    } catch (error) {
      logger.error('HubSpot update failed:', error);
      return {
        success: false,
        platform: 'hubspot',
        error: error instanceof Error ? error.message : 'Failed to update HubSpot blog post',
        details: error
      };
    }
  }

  async delete(contentId: string): Promise<boolean> {
    try {
      await this.client.delete(`/cms/v3/blogs/posts/${contentId}`);
      logger.info(`HubSpot blog post deleted: ${contentId}`);
      return true;
    } catch (error) {
      logger.error('HubSpot delete failed:', error);
      return false;
    }
  }

  async getContent(contentId: string): Promise<CMSContent | null> {
    try {
      const response = await this.client.get<HubSpotContent>(`/cms/v3/blogs/posts/${contentId}`);
      const post = response.data;
      
      return this.transformFromHubSpotPost(post);
    } catch (error) {
      logger.error('Failed to get HubSpot blog post:', error);
      return null;
    }
  }

  async listContent(filters?: any): Promise<CMSContent[]> {
    try {
      const params: any = {
        limit: filters?.limit || 100,
        offset: filters?.offset || 0,
        state: filters?.state || 'PUBLISHED,DRAFT'
      };

      if (filters?.name) {
        params.name = filters.name;
      }

      if (filters?.authorName) {
        params.authorName = filters.authorName;
      }

      if (filters?.campaignId) {
        params.campaignId = filters.campaignId;
      }

      const response = await this.client.get<{ results: HubSpotContent[] }>('/cms/v3/blogs/posts', { params });
      
      return response.data.results.map(post => this.transformFromHubSpotPost(post));
    } catch (error) {
      logger.error('Failed to list HubSpot blog posts:', error);
      return [];
    }
  }

  async getSyncStatus(contentId: string, localVersion: string): Promise<CMSSyncStatus> {
    try {
      const remoteContent = await this.getContent(contentId);
      
      if (!remoteContent) {
        throw new Error('Blog post not found on HubSpot');
      }

      const remoteVersion = remoteContent.customFields?.updated || 
                          new Date(remoteContent.customFields?.updated || Date.now()).toISOString();

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
        platform: 'hubspot',
        contentId,
        localVersion,
        remoteVersion,
        lastSyncedAt: new Date(),
        syncStatus,
        differences: differences.length > 0 ? differences : undefined
      };

    } catch (error) {
      logger.error('Failed to get HubSpot sync status:', error);
      throw error;
    }
  }

  // Helper methods specific to HubSpot

  private transformToHubSpotPost(content: CMSContent, options?: CMSPublishOptions): Partial<HubSpotContent> {
    const post: Partial<HubSpotContent> = {
      name: content.title,
      content: options?.injectSchema ? this.injectSEOMetadata(content) : content.content,
      state: this.mapStatus(content.status),
      authorName: content.author || 'SEO Content Generator'
    };

    // Handle categories (HubSpot uses categoryId)
    if (content.categories?.length) {
      // In a real implementation, you'd map category names to HubSpot category IDs
      post.categoryId = 1; // Default category
    }

    // Handle tags (HubSpot uses tagIds array)
    if (content.tags?.length) {
      // In a real implementation, you'd map tag names to HubSpot tag IDs
      post.tagIds = []; // Would contain actual tag IDs
    }

    // Handle campaign assignment
    if (content.customFields?.campaignId) {
      post.campaignId = content.customFields.campaignId;
    }

    // Handle scheduling
    if (content.publishDate && content.status === 'scheduled') {
      post.publishDate = content.publishDate.getTime();
    }

    // Handle SEO metadata
    if (content.metaDescription) {
      post.metaDescription = content.metaDescription;
    }

    return post;
  }

  private transformFromHubSpotPost(post: HubSpotContent): CMSContent {
    return {
      id: post.id,
      title: post.name,
      content: post.content,
      excerpt: this.extractExcerpt(post.content),
      slug: this.generateSlug(post.name),
      status: this.mapHubSpotStatus(post.state),
      publishDate: post.publishDate ? new Date(post.publishDate) : undefined,
      categories: [], // Would need to fetch category names from categoryId
      tags: [], // Would need to fetch tag names from tagIds
      author: post.authorName,
      metaDescription: post.metaDescription,
      canonicalUrl: post.url,
      customFields: {
        hubspotId: post.id,
        campaignId: post.campaignId,
        created: post.created,
        updated: post.updated,
        publishedAt: post.publishedAt,
        archivedAt: post.archivedAt,
        domain: post.domain
      }
    };
  }

  private mapStatus(status: CMSContent['status']): HubSpotContent['state'] {
    const statusMap: Record<CMSContent['status'], HubSpotContent['state']> = {
      'draft': 'DRAFT',
      'published': 'PUBLISHED',
      'scheduled': 'SCHEDULED',
      'private': 'DRAFT'
    };
    return statusMap[status] || 'DRAFT';
  }

  private mapHubSpotStatus(state: HubSpotContent['state']): CMSContent['status'] {
    const statusMap: Record<HubSpotContent['state'], CMSContent['status']> = {
      'DRAFT': 'draft',
      'PUBLISHED': 'published',
      'SCHEDULED': 'scheduled'
    };
    return statusMap[state] || 'draft';
  }

  private extractExcerpt(content: string): string {
    // Strip HTML and get first 160 characters
    const textContent = content.replace(/<[^>]*>/g, '');
    return textContent.substring(0, 160) + (textContent.length > 160 ? '...' : '');
  }

  private async updateSEOSettings(postId: string, content: CMSContent): Promise<void> {
    try {
      const seoData: any = {};

      if (content.metaTitle) {
        seoData.htmlTitle = content.metaTitle;
      }

      if (content.metaDescription) {
        seoData.metaDescription = content.metaDescription;
      }

      if (content.focusKeyword) {
        // HubSpot doesn't have a direct focus keyword field, but we can add it to the head HTML
        seoData.headHtml = `<!-- Focus Keyword: ${content.focusKeyword} -->`;
      }

      if (content.canonicalUrl) {
        seoData.canonicalUrl = content.canonicalUrl;
      }

      // Update the post with SEO data
      await this.client.patch(`/cms/v3/blogs/posts/${postId}`, seoData);

    } catch (error) {
      logger.warn('Failed to update HubSpot SEO settings:', error);
    }
  }

  private async schedulePost(postId: string, publishDate: Date): Promise<void> {
    try {
      await this.client.patch(`/cms/v3/blogs/posts/${postId}`, {
        publishDate: publishDate.getTime(),
        state: 'SCHEDULED'
      });
    } catch (error) {
      logger.warn('Failed to schedule HubSpot post:', error);
    }
  }

  private async getPostUrl(postId: string): Promise<string> {
    try {
      const response = await this.client.get<HubSpotContent>(`/cms/v3/blogs/posts/${postId}`);
      return response.data.url || `https://www.hubspot.com/blog/${postId}`;
    } catch (error) {
      logger.warn('Failed to get HubSpot post URL:', error);
      return `https://www.hubspot.com/blog/${postId}`;
    }
  }

  // HubSpot-specific methods for lead generation and marketing automation

  async createLandingPage(content: CMSContent, options?: any): Promise<CMSPublishResult> {
    try {
      const landingPageData = {
        name: content.title,
        content: content.content,
        state: 'PUBLISHED',
        domainId: options?.domainId || 'default'
      };

      const response = await this.client.post('/cms/v3/pages/landing-pages', landingPageData);
      const landingPage = response.data;

      return {
        success: true,
        platform: 'hubspot',
        contentId: landingPage.id,
        url: landingPage.url,
        publishedAt: new Date()
      };

    } catch (error) {
      logger.error('Failed to create HubSpot landing page:', error);
      return {
        success: false,
        platform: 'hubspot',
        error: 'Failed to create landing page',
        details: error
      };
    }
  }

  async createEmailTemplate(content: CMSContent): Promise<CMSPublishResult> {
    try {
      const emailData = {
        name: content.title,
        subject: content.metaTitle || content.title,
        htmlContent: content.content
      };

      const response = await this.client.post('/marketing/v3/transactional/single-send/sharedTemplates', emailData);
      const emailTemplate = response.data;

      return {
        success: true,
        platform: 'hubspot',
        contentId: emailTemplate.id,
        publishedAt: new Date()
      };

    } catch (error) {
      logger.error('Failed to create HubSpot email template:', error);
      return {
        success: false,
        platform: 'hubspot',
        error: 'Failed to create email template',
        details: error
      };
    }
  }

  async attachToContact(contentId: string, contactId: string): Promise<boolean> {
    try {
      // Create an engagement (note) linking the content to a contact
      const engagementData = {
        engagement: {
          type: 'NOTE',
          timestamp: Date.now()
        },
        associations: {
          contactIds: [parseInt(contactId)]
        },
        metadata: {
          body: `Content published: ${contentId}`
        }
      };

      await this.client.post('/engagements/v1/engagements', engagementData);
      return true;

    } catch (error) {
      logger.error('Failed to attach content to HubSpot contact:', error);
      return false;
    }
  }
}