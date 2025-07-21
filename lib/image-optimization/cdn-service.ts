/**
 * CDN Service for Global Image Delivery
 * Handles CDN integration, geographic optimization, and delivery strategies
 */

import { createHash } from 'crypto';
import { multiTierCache } from '../cache/multi-tier-cache';
import { imageOptimizer, OptimizedImage } from './image-processor';

export interface CDNConfig {
  provider: 'cloudflare' | 'aws' | 'vercel' | 'custom';
  baseUrl: string;
  apiKey?: string;
  zones?: string[];
  customDomain?: string;
  enableCompression: boolean;
  enableWebP: boolean;
  enableAVIF: boolean;
  maxAge: number; // Cache TTL in seconds
}

export interface CDNAsset {
  id: string;
  originalUrl: string;
  cdnUrl: string;
  variants: {
    [key: string]: string; // breakpoint_format -> CDN URL
  };
  placeholder: string;
  uploadedAt: Date;
  lastAccessed: Date;
  accessCount: number;
  region: string;
  size: number;
  format: string;
}

export interface DeliveryMetrics {
  totalAssets: number;
  totalSize: number;
  bandwidthSaved: number;
  averageLoadTime: number;
  hitRate: number;
  regionBreakdown: { [region: string]: number };
  formatBreakdown: { [format: string]: number };
}

export class CDNService {
  private static instance: CDNService;
  private config: CDNConfig;
  private assets: Map<string, CDNAsset> = new Map();
  private metrics: DeliveryMetrics = {
    totalAssets: 0,
    totalSize: 0,
    bandwidthSaved: 0,
    averageLoadTime: 0,
    hitRate: 0,
    regionBreakdown: {},
    formatBreakdown: {}
  };

  private constructor(config: CDNConfig) {
    this.config = config;
  }

  public static getInstance(config?: CDNConfig): CDNService {
    if (!CDNService.instance && config) {
      CDNService.instance = new CDNService(config);
    }
    return CDNService.instance;
  }

  /**
   * Upload image to CDN with optimization
   */
  async uploadImage(
    imageBuffer: Buffer,
    filename: string,
    options: {
      generateResponsive?: boolean;
      generatePlaceholder?: boolean;
      region?: string;
      tags?: string[];
    } = {}
  ): Promise<CDNAsset> {
    const assetId = this.generateAssetId(filename, imageBuffer);
    const { generateResponsive = true, generatePlaceholder = true, region = 'global' } = options;

    // Check if asset already exists
    const existing = this.assets.get(assetId);
    if (existing) {
      existing.lastAccessed = new Date();
      existing.accessCount++;
      return existing;
    }

    // Optimize main image
    const optimizedImage = await imageOptimizer.optimizeImage(imageBuffer, {
      format: 'webp',
      quality: 85
    });

    // Upload to CDN
    const cdnUrl = await this.uploadToCDN(optimizedImage.buffer, `${assetId}.webp`, region);
    
    // Generate variants if requested
    const variants: { [key: string]: string } = {};
    if (generateResponsive) {
      const responsiveVariants = await imageOptimizer.generateResponsiveVariants(imageBuffer);
      
      for (const [variantKey, variantData] of Object.entries(responsiveVariants)) {
        const variantFilename = `${assetId}_${variantKey}.${variantData.format}`;
        variants[variantKey] = await this.uploadToCDN(variantData.buffer, variantFilename, region);
      }
    }

    // Generate placeholder
    let placeholder = '';
    if (generatePlaceholder) {
      placeholder = await imageOptimizer.generatePlaceholder(imageBuffer, 'blur');
    }

    // Create asset record
    const asset: CDNAsset = {
      id: assetId,
      originalUrl: filename,
      cdnUrl,
      variants,
      placeholder,
      uploadedAt: new Date(),
      lastAccessed: new Date(),
      accessCount: 1,
      region,
      size: optimizedImage.size,
      format: optimizedImage.format
    };

    // Store asset record
    this.assets.set(assetId, asset);
    
    // Update metrics
    this.updateMetrics(asset);

    // Cache asset metadata
    await this.cacheAssetMetadata(asset);

    return asset;
  }

  /**
   * Get optimized image URL with automatic format selection
   */
  getOptimizedUrl(
    assetId: string,
    options: {
      width?: number;
      format?: 'auto' | 'webp' | 'avif' | 'jpeg';
      quality?: number;
      userAgent?: string;
    } = {}
  ): string {
    const asset = this.assets.get(assetId);
    if (!asset) return '';

    const { width, format = 'auto', userAgent } = options;

    // Auto-detect best format based on user agent
    let selectedFormat = format;
    if (format === 'auto' && userAgent) {
      selectedFormat = this.detectBestFormat(userAgent);
    }

    // Find best variant based on width and format
    if (width && asset.variants) {
      const variantKey = this.findBestVariant(asset.variants, width, selectedFormat);
      if (variantKey && asset.variants[variantKey]) {
        return asset.variants[variantKey];
      }
    }

    // Return main CDN URL with query parameters for on-the-fly optimization
    return this.buildOptimizedUrl(asset.cdnUrl, {
      width,
      format: selectedFormat,
      quality: options.quality
    });
  }

  /**
   * Generate picture element with responsive sources
   */
  generatePictureElement(
    assetId: string,
    alt: string,
    options: {
      sizes?: string;
      loading?: 'lazy' | 'eager';
      className?: string;
      showPlaceholder?: boolean;
    } = {}
  ): string {
    const asset = this.assets.get(assetId);
    if (!asset) return '';

    const { sizes = '100vw', loading = 'lazy', className = '', showPlaceholder = true } = options;

    // Generate source elements for different formats
    const sources: string[] = [];

    // AVIF sources (best compression, modern browsers)
    const avifSources = this.generateSourceSet(asset, 'avif');
    if (avifSources) {
      sources.push(`<source srcset="${avifSources}" type="image/avif" sizes="${sizes}">`);
    }

    // WebP sources (good compression, wide support)
    const webpSources = this.generateSourceSet(asset, 'webp');
    if (webpSources) {
      sources.push(`<source srcset="${webpSources}" type="image/webp" sizes="${sizes}">`);
    }

    // JPEG fallback
    const jpegSources = this.generateSourceSet(asset, 'jpeg');
    const fallbackSrc = this.getOptimizedUrl(assetId, { format: 'jpeg' });

    const placeholderAttr = showPlaceholder && asset.placeholder 
      ? ` style="background-image: url('${asset.placeholder}'); background-size: cover;"` 
      : '';

    return `
<picture>
  ${sources.join('\n  ')}
  <img 
    src="${fallbackSrc}" 
    srcset="${jpegSources}"
    sizes="${sizes}"
    alt="${alt}"
    loading="${loading}"
    class="${className}"
    decoding="async"${placeholderAttr}
  >
</picture>`.trim();
  }

  /**
   * Preload critical images
   */
  generatePreloadLinks(assetIds: string[]): string[] {
    const preloadLinks: string[] = [];

    for (const assetId of assetIds) {
      const asset = this.assets.get(assetId);
      if (!asset) continue;

      // Preload WebP version for modern browsers
      const webpUrl = this.getOptimizedUrl(assetId, { format: 'webp' });
      preloadLinks.push(
        `<link rel="preload" as="image" href="${webpUrl}" type="image/webp">`
      );

      // Preload JPEG fallback
      const jpegUrl = this.getOptimizedUrl(assetId, { format: 'jpeg' });
      preloadLinks.push(
        `<link rel="preload" as="image" href="${jpegUrl}" type="image/jpeg">`
      );
    }

    return preloadLinks;
  }

  /**
   * Upload buffer to CDN (provider-specific implementation)
   */
  private async uploadToCDN(buffer: Buffer, filename: string, region: string): Promise<string> {
    // This is a simplified implementation
    // In production, this would integrate with actual CDN providers
    
    switch (this.config.provider) {
      case 'cloudflare':
        return await this.uploadToCloudflare(buffer, filename, region);
      case 'aws':
        return await this.uploadToAWS(buffer, filename, region);
      case 'vercel':
        return await this.uploadToVercel(buffer, filename, region);
      default:
        return await this.uploadToCustomCDN(buffer, filename, region);
    }
  }

  /**
   * Cloudflare Images integration
   */
  private async uploadToCloudflare(buffer: Buffer, filename: string, region: string): Promise<string> {
    // Simulated Cloudflare upload
    const baseUrl = this.config.baseUrl;
    const hash = createHash('sha256').update(buffer).digest('hex').substring(0, 12);
    return `${baseUrl}/${hash}/${filename}`;
  }

  /**
   * AWS S3 + CloudFront integration
   */
  private async uploadToAWS(buffer: Buffer, filename: string, region: string): Promise<string> {
    // Simulated AWS upload
    const baseUrl = this.config.baseUrl;
    const hash = createHash('sha256').update(buffer).digest('hex').substring(0, 12);
    return `${baseUrl}/${region}/${hash}/${filename}`;
  }

  /**
   * Vercel Edge Network integration
   */
  private async uploadToVercel(buffer: Buffer, filename: string, region: string): Promise<string> {
    // Simulated Vercel upload
    const baseUrl = this.config.baseUrl;
    const hash = createHash('sha256').update(buffer).digest('hex').substring(0, 12);
    return `${baseUrl}/_vercel/image?url=${encodeURIComponent(`/${hash}/${filename}`)}`;
  }

  /**
   * Custom CDN integration
   */
  private async uploadToCustomCDN(buffer: Buffer, filename: string, region: string): Promise<string> {
    // Simulated custom CDN upload
    const baseUrl = this.config.baseUrl;
    const hash = createHash('sha256').update(buffer).digest('hex').substring(0, 12);
    return `${baseUrl}/images/${hash}/${filename}`;
  }

  /**
   * Generate asset ID
   */
  private generateAssetId(filename: string, buffer: Buffer): string {
    const hash = createHash('sha256')
      .update(filename)
      .update(buffer)
      .digest('hex')
      .substring(0, 16);
    
    const ext = filename.split('.').pop()?.toLowerCase() || 'img';
    return `${hash}_${Date.now().toString(36)}.${ext}`;
  }

  /**
   * Detect best image format based on user agent
   */
  private detectBestFormat(userAgent: string): 'webp' | 'avif' | 'jpeg' {
    // Check for AVIF support (Chrome 85+, Firefox 93+)
    if (userAgent.includes('Chrome/') && this.extractChromeVersion(userAgent) >= 85) {
      return 'avif';
    }
    
    // Check for WebP support (most modern browsers)
    if (userAgent.includes('Chrome/') || userAgent.includes('Firefox/') || userAgent.includes('Edge/')) {
      return 'webp';
    }
    
    // Fallback to JPEG
    return 'jpeg';
  }

  /**
   * Extract Chrome version from user agent
   */
  private extractChromeVersion(userAgent: string): number {
    const match = userAgent.match(/Chrome\/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  /**
   * Find best variant for given width and format
   */
  private findBestVariant(variants: { [key: string]: string }, width: number, format: string): string | null {
    const formatVariants = Object.keys(variants).filter(key => key.includes(format));
    
    if (formatVariants.length === 0) return null;

    // Find closest width match
    let bestMatch = formatVariants[0];
    let smallestDiff = Infinity;

    for (const variant of formatVariants) {
      const variantWidth = this.extractWidthFromVariant(variant);
      const diff = Math.abs(variantWidth - width);
      
      if (diff < smallestDiff || (diff === smallestDiff && variantWidth >= width)) {
        smallestDiff = diff;
        bestMatch = variant;
      }
    }

    return bestMatch;
  }

  /**
   * Extract width from variant key (e.g., "w640_webp" -> 640)
   */
  private extractWidthFromVariant(variant: string): number {
    const match = variant.match(/w(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  /**
   * Generate srcset for specific format
   */
  private generateSourceSet(asset: CDNAsset, format: string): string {
    const formatVariants = Object.entries(asset.variants)
      .filter(([key]) => key.includes(format))
      .sort(([a], [b]) => this.extractWidthFromVariant(a) - this.extractWidthFromVariant(b));

    return formatVariants
      .map(([key, url]) => `${url} ${this.extractWidthFromVariant(key)}w`)
      .join(', ');
  }

  /**
   * Build optimized URL with query parameters
   */
  private buildOptimizedUrl(baseUrl: string, options: {
    width?: number;
    format?: string;
    quality?: number;
  }): string {
    const params = new URLSearchParams();
    
    if (options.width) params.set('w', options.width.toString());
    if (options.format && options.format !== 'auto') params.set('f', options.format);
    if (options.quality) params.set('q', options.quality.toString());

    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }

  /**
   * Update delivery metrics
   */
  private updateMetrics(asset: CDNAsset): void {
    this.metrics.totalAssets++;
    this.metrics.totalSize += asset.size;
    
    // Update region breakdown
    this.metrics.regionBreakdown[asset.region] = 
      (this.metrics.regionBreakdown[asset.region] || 0) + 1;
    
    // Update format breakdown
    this.metrics.formatBreakdown[asset.format] = 
      (this.metrics.formatBreakdown[asset.format] || 0) + 1;
  }

  /**
   * Cache asset metadata
   */
  private async cacheAssetMetadata(asset: CDNAsset): Promise<void> {
    const cacheKey = `cdn:asset:${asset.id}`;
    await multiTierCache.set(
      cacheKey,
      asset,
      {
        ttl: 7 * 24 * 60 * 60, // 7 days
        keyStrategy: 'hash',
        invalidation: 'time-based'
      },
      'cdn-service'
    );
  }

  /**
   * Get delivery metrics
   */
  getMetrics(): DeliveryMetrics {
    return { ...this.metrics };
  }

  /**
   * Get asset by ID
   */
  getAsset(assetId: string): CDNAsset | undefined {
    return this.assets.get(assetId);
  }

  /**
   * List all assets
   */
  listAssets(): CDNAsset[] {
    return Array.from(this.assets.values());
  }

  /**
   * Delete asset from CDN
   */
  async deleteAsset(assetId: string): Promise<boolean> {
    const asset = this.assets.get(assetId);
    if (!asset) return false;

    // In production, this would delete from actual CDN
    this.assets.delete(assetId);
    
    // Clear cache
    const cacheKey = `cdn:asset:${assetId}`;
    await multiTierCache.delete(cacheKey);

    return true;
  }

  /**
   * Clear all cached assets
   */
  async clearCache(): Promise<void> {
    await multiTierCache.invalidateService('cdn-service');
  }

  /**
   * Get CDN configuration
   */
  getConfig(): CDNConfig {
    return { ...this.config };
  }

  /**
   * Update CDN configuration
   */
  updateConfig(config: Partial<CDNConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Export factory function
export function createCDNService(config: CDNConfig): CDNService {
  return CDNService.getInstance(config);
}

// Default configuration for common CDN providers
export const CDNProviderConfigs = {
  cloudflare: {
    provider: 'cloudflare' as const,
    baseUrl: 'https://imagedelivery.net',
    enableCompression: true,
    enableWebP: true,
    enableAVIF: true,
    maxAge: 31536000 // 1 year
  },
  aws: {
    provider: 'aws' as const,
    baseUrl: 'https://d1234567890.cloudfront.net',
    enableCompression: true,
    enableWebP: true,
    enableAVIF: false,
    maxAge: 31536000 // 1 year
  },
  vercel: {
    provider: 'vercel' as const,
    baseUrl: 'https://yourdomain.vercel.app',
    enableCompression: true,
    enableWebP: true,
    enableAVIF: true,
    maxAge: 31536000 // 1 year
  }
};