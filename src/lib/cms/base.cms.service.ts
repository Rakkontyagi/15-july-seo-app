// Base CMS Service - Abstract class for all CMS integrations

import { 
  CMSContent, 
  CMSCredentials, 
  CMSPublishResult, 
  CMSPublishOptions,
  CMSSyncStatus,
  CMSIntegrationError,
  CMSPlatform
} from '@/types/cms';
import { logger } from '@/lib/logging/logger';

export abstract class BaseCMSService {
  protected credentials: CMSCredentials;
  protected platform: CMSPlatform;

  constructor(credentials: CMSCredentials) {
    this.credentials = credentials;
    this.platform = credentials.platform;
  }

  // Abstract methods that each CMS must implement
  abstract validateCredentials(): Promise<boolean>;
  abstract publish(content: CMSContent, options?: CMSPublishOptions): Promise<CMSPublishResult>;
  abstract update(contentId: string, content: CMSContent, options?: CMSPublishOptions): Promise<CMSPublishResult>;
  abstract delete(contentId: string): Promise<boolean>;
  abstract getContent(contentId: string): Promise<CMSContent | null>;
  abstract listContent(filters?: any): Promise<CMSContent[]>;
  abstract getSyncStatus(contentId: string, localVersion: string): Promise<CMSSyncStatus>;

  // Common helper methods
  protected async handleApiError(error: any): Promise<never> {
    logger.error(`CMS API Error [${this.platform}]:`, error);
    
    const cmsError = new Error(error.message || 'CMS API Error') as CMSIntegrationError;
    cmsError.platform = this.platform;
    cmsError.code = error.code || 'UNKNOWN_ERROR';
    cmsError.statusCode = error.response?.status || error.statusCode;
    cmsError.details = error.response?.data || error.details;
    
    throw cmsError;
  }

  protected sanitizeContent(content: CMSContent): CMSContent {
    // Remove any potential XSS or malicious content
    return {
      ...content,
      title: this.sanitizeString(content.title),
      excerpt: content.excerpt ? this.sanitizeString(content.excerpt) : undefined,
      metaTitle: content.metaTitle ? this.sanitizeString(content.metaTitle) : undefined,
      metaDescription: content.metaDescription ? this.sanitizeString(content.metaDescription) : undefined,
      // Content HTML is preserved as CMS platforms handle their own sanitization
      content: content.content
    };
  }

  protected sanitizeString(str: string): string {
    // Basic sanitization - remove script tags and other potentially harmful content
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }

  protected generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .substring(0, 200); // Limit length
  }

  protected async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: any;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (i < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, i); // Exponential backoff
          logger.warn(`Retry ${i + 1}/${maxRetries} after ${delay}ms for ${this.platform}`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }

  protected buildHeaders(additionalHeaders?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'SEO-Content-Generator/1.0',
      ...this.credentials.customHeaders,
      ...additionalHeaders
    };

    if (this.credentials.apiKey) {
      headers['Authorization'] = `Bearer ${this.credentials.apiKey}`;
    }

    return headers;
  }

  // Rate limiting helper
  private lastRequestTime: number = 0;
  private minRequestInterval: number = 100; // Minimum 100ms between requests

  protected async rateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  // Common method to check if content already exists
  protected async checkDuplicateContent(title: string): Promise<string | null> {
    try {
      const existingContent = await this.listContent({ title });
      
      if (existingContent && existingContent.length > 0) {
        // Return the ID of the first matching content
        return existingContent[0].id || null;
      }
      
      return null;
    } catch (error) {
      logger.warn(`Failed to check for duplicate content on ${this.platform}:`, error);
      return null;
    }
  }

  // Method to transform content based on platform requirements
  protected transformContent(content: CMSContent, options?: CMSPublishOptions): any {
    // Base transformation - can be overridden by specific CMS implementations
    const transformed: any = {
      title: content.title,
      content: content.content,
      status: content.status,
      excerpt: content.excerpt
    };

    if (options?.autoGenerateSlug && !content.slug) {
      transformed.slug = this.generateSlug(content.title);
    } else if (content.slug) {
      transformed.slug = content.slug;
    }

    if (options?.customTransformations) {
      Object.assign(transformed, options.customTransformations);
    }

    return transformed;
  }

  // Common method to inject SEO metadata
  protected injectSEOMetadata(content: CMSContent): string {
    if (!content.metaTitle && !content.metaDescription && !content.focusKeyword) {
      return content.content;
    }

    let seoContent = content.content;

    // Add focus keyword to content if not already present enough times
    if (content.focusKeyword) {
      const keywordCount = (seoContent.match(new RegExp(content.focusKeyword, 'gi')) || []).length;
      const targetDensity = 0.01; // 1% keyword density
      const wordCount = seoContent.split(/\s+/).length;
      const targetCount = Math.floor(wordCount * targetDensity);

      if (keywordCount < targetCount) {
        // Add keyword strategically (this is a simple implementation)
        // In production, this should be more sophisticated
        logger.info(`Adding focus keyword "${content.focusKeyword}" to content for better SEO`);
      }
    }

    return seoContent;
  }
}