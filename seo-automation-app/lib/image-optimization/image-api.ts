/**
 * Image API Service
 * High-level API for image operations with automatic optimization and CDN delivery
 */

import { imageOptimizer, ImageOptimizationOptions } from './image-processor';
import { CDNService, CDNConfig, CDNAsset } from './cdn-service';
import { multiTierCache } from '../cache/multi-tier-cache';

export interface ImageUploadResult {
  success: boolean;
  asset?: CDNAsset;
  error?: string;
  optimizationStats?: {
    originalSize: number;
    optimizedSize: number;
    compressionRatio: number;
    format: string;
  };
}

export interface ImageDeliveryOptions {
  width?: number;
  height?: number;
  format?: 'auto' | 'webp' | 'avif' | 'jpeg' | 'png';
  quality?: number;
  crop?: 'cover' | 'contain' | 'fill';
  blur?: number;
  userAgent?: string;
  responsive?: boolean;
  placeholder?: boolean;
}

export interface ImageAnalytics {
  totalUploads: number;
  totalDeliveries: number;
  bandwidthSaved: number;
  storageUsed: number;
  averageOptimization: number;
  popularFormats: { [format: string]: number };
  deliveryRegions: { [region: string]: number };
  performanceMetrics: {
    averageUploadTime: number;
    averageDeliveryTime: number;
    cacheHitRate: number;
  };
}

export class ImageAPIService {
  private static instance: ImageAPIService;
  private cdnService: CDNService;
  private analytics: ImageAnalytics = {
    totalUploads: 0,
    totalDeliveries: 0,
    bandwidthSaved: 0,
    storageUsed: 0,
    averageOptimization: 0,
    popularFormats: {},
    deliveryRegions: {},
    performanceMetrics: {
      averageUploadTime: 0,
      averageDeliveryTime: 0,
      cacheHitRate: 0
    }
  };

  private constructor(cdnConfig: CDNConfig) {
    this.cdnService = CDNService.getInstance(cdnConfig);
  }

  public static getInstance(cdnConfig?: CDNConfig): ImageAPIService {
    if (!ImageAPIService.instance && cdnConfig) {
      ImageAPIService.instance = new ImageAPIService(cdnConfig);
    }
    return ImageAPIService.instance;
  }

  /**
   * Upload and optimize image with automatic CDN delivery
   */
  async uploadImage(
    imageBuffer: Buffer,
    filename: string,
    options: {
      optimization?: ImageOptimizationOptions;
      generateResponsive?: boolean;
      generatePlaceholder?: boolean;
      region?: string;
      tags?: string[];
    } = {}
  ): Promise<ImageUploadResult> {
    const startTime = Date.now();

    try {
      // Validate image
      const validation = await imageOptimizer.validateImage(imageBuffer);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Invalid image: ${validation.errors.join(', ')}`
        };
      }

      // Get original size for comparison
      const originalSize = imageBuffer.length;

      // Upload to CDN with optimization
      const asset = await this.cdnService.uploadImage(imageBuffer, filename, {
        generateResponsive: options.generateResponsive !== false,
        generatePlaceholder: options.generatePlaceholder !== false,
        region: options.region || 'global',
        tags: options.tags
      });

      // Calculate optimization stats
      const optimizationStats = {
        originalSize,
        optimizedSize: asset.size,
        compressionRatio: (originalSize - asset.size) / originalSize,
        format: asset.format
      };

      // Update analytics
      this.updateUploadAnalytics(startTime, optimizationStats);

      return {
        success: true,
        asset,
        optimizationStats
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get optimized image URL with automatic format selection
   */
  getImageUrl(
    assetId: string,
    options: ImageDeliveryOptions = {}
  ): string {
    const startTime = Date.now();

    // Get URL from CDN service
    const url = this.cdnService.getOptimizedUrl(assetId, {
      width: options.width,
      format: options.format || 'auto',
      quality: options.quality,
      userAgent: options.userAgent
    });

    // Update delivery analytics
    this.updateDeliveryAnalytics(startTime, options.format || 'auto');

    return url;
  }

  /**
   * Generate responsive image HTML with automatic optimization
   */
  generateResponsiveImage(
    assetId: string,
    alt: string,
    options: {
      sizes?: string;
      className?: string;
      loading?: 'lazy' | 'eager';
      showPlaceholder?: boolean;
      fallbackWidth?: number;
    } = {}
  ): string {
    return this.cdnService.generatePictureElement(assetId, alt, {
      sizes: options.sizes || '100vw',
      loading: options.loading || 'lazy',
      className: options.className || '',
      showPlaceholder: options.showPlaceholder !== false
    });
  }

  /**
   * Generate critical resource hints for performance
   */
  generateResourceHints(assetIds: string[]): {
    preload: string[];
    prefetch: string[];
    dns: string[];
  } {
    const preload = this.cdnService.generatePreloadLinks(assetIds);
    const cdnConfig = this.cdnService.getConfig();
    
    // Generate DNS prefetch for CDN domain
    const cdnDomain = new URL(cdnConfig.baseUrl).hostname;
    const dns = [`<link rel="dns-prefetch" href="//${cdnDomain}">`];

    return {
      preload,
      prefetch: [], // Could be expanded to prefetch likely-to-be-viewed images
      dns
    };
  }

  /**
   * Bulk upload multiple images
   */
  async uploadImages(
    images: Array<{
      buffer: Buffer;
      filename: string;
      options?: {
        optimization?: ImageOptimizationOptions;
        region?: string;
        tags?: string[];
      };
    }>
  ): Promise<ImageUploadResult[]> {
    const results: ImageUploadResult[] = [];

    // Process images in parallel (with concurrency limit)
    const concurrencyLimit = 5;
    const chunks = this.chunkArray(images, concurrencyLimit);

    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map(({ buffer, filename, options = {} }) =>
          this.uploadImage(buffer, filename, options)
        )
      );
      results.push(...chunkResults);
    }

    return results;
  }

  /**
   * Get image metadata and analytics
   */
  async getImageInfo(assetId: string): Promise<{
    asset?: CDNAsset;
    analytics: {
      accessCount: number;
      lastAccessed: Date;
      totalSize: number;
      variants: number;
      estimatedBandwidthSaved: number;
    };
  } | null> {
    const asset = this.cdnService.getAsset(assetId);
    if (!asset) return null;

    const variantCount = Object.keys(asset.variants).length;
    const estimatedOriginalSize = asset.size * 2; // Estimate original was 2x larger
    const estimatedBandwidthSaved = (estimatedOriginalSize - asset.size) * asset.accessCount;

    return {
      asset,
      analytics: {
        accessCount: asset.accessCount,
        lastAccessed: asset.lastAccessed,
        totalSize: asset.size,
        variants: variantCount,
        estimatedBandwidthSaved
      }
    };
  }

  /**
   * Search and filter images
   */
  searchImages(filters: {
    format?: string;
    sizeRange?: { min: number; max: number };
    dateRange?: { start: Date; end: Date };
    region?: string;
    tags?: string[];
  } = {}): CDNAsset[] {
    const allAssets = this.cdnService.listAssets();

    return allAssets.filter(asset => {
      // Format filter
      if (filters.format && asset.format !== filters.format) return false;

      // Size filter
      if (filters.sizeRange) {
        const { min, max } = filters.sizeRange;
        if (asset.size < min || asset.size > max) return false;
      }

      // Date filter
      if (filters.dateRange) {
        const { start, end } = filters.dateRange;
        if (asset.uploadedAt < start || asset.uploadedAt > end) return false;
      }

      // Region filter
      if (filters.region && asset.region !== filters.region) return false;

      return true;
    });
  }

  /**
   * Delete image and all variants
   */
  async deleteImage(assetId: string): Promise<boolean> {
    return await this.cdnService.deleteAsset(assetId);
  }

  /**
   * Get comprehensive analytics
   */
  getAnalytics(): ImageAnalytics {
    const cdnMetrics = this.cdnService.getMetrics();
    const optimizerMetrics = imageOptimizer.getMetrics();

    return {
      ...this.analytics,
      totalUploads: optimizerMetrics.totalImages,
      storageUsed: cdnMetrics.totalSize,
      bandwidthSaved: optimizerMetrics.totalSavings,
      averageOptimization: optimizerMetrics.averageCompressionRatio,
      popularFormats: { ...cdnMetrics.formatBreakdown },
      deliveryRegions: { ...cdnMetrics.regionBreakdown }
    };
  }

  /**
   * Generate performance report
   */
  async generatePerformanceReport(): Promise<{
    summary: {
      totalAssets: number;
      totalSavings: number;
      averageCompressionRatio: number;
      cacheHitRate: number;
    };
    optimization: {
      formatBreakdown: { [format: string]: number };
      sizeDistribution: { [range: string]: number };
      compressionEfficiency: number;
    };
    delivery: {
      regionBreakdown: { [region: string]: number };
      averageLoadTime: number;
      bandwidthOptimization: number;
    };
    recommendations: Array<{
      type: 'optimization' | 'delivery' | 'caching';
      priority: 'high' | 'medium' | 'low';
      description: string;
      impact: string;
    }>;
  }> {
    const analytics = this.getAnalytics();
    const cdnMetrics = this.cdnService.getMetrics();
    const optimizerMetrics = imageOptimizer.getMetrics();

    const recommendations: Array<{
      type: 'optimization' | 'delivery' | 'caching';
      priority: 'high' | 'medium' | 'low';
      description: string;
      impact: string;
    }> = [];

    // Generate recommendations based on metrics
    if (analytics.averageOptimization < 0.5) {
      recommendations.push({
        type: 'optimization',
        priority: 'high',
        description: 'Average compression ratio is below 50%. Consider using more aggressive optimization settings.',
        impact: 'Could save additional 20-30% bandwidth'
      });
    }

    if (analytics.performanceMetrics.cacheHitRate < 0.8) {
      recommendations.push({
        type: 'caching',
        priority: 'medium',
        description: 'Cache hit rate is below 80%. Consider increasing cache TTL or implementing better cache warming.',
        impact: 'Improved delivery performance and reduced origin load'
      });
    }

    const webpUsage = (analytics.popularFormats.webp || 0) / analytics.totalUploads;
    if (webpUsage < 0.7) {
      recommendations.push({
        type: 'optimization',
        priority: 'medium',
        description: 'Less than 70% of images are using WebP format. Consider enabling automatic WebP conversion.',
        impact: 'Additional 15-25% size reduction'
      });
    }

    return {
      summary: {
        totalAssets: analytics.totalUploads,
        totalSavings: analytics.bandwidthSaved,
        averageCompressionRatio: analytics.averageOptimization,
        cacheHitRate: analytics.performanceMetrics.cacheHitRate
      },
      optimization: {
        formatBreakdown: analytics.popularFormats,
        sizeDistribution: this.calculateSizeDistribution(),
        compressionEfficiency: analytics.averageOptimization
      },
      delivery: {
        regionBreakdown: analytics.deliveryRegions,
        averageLoadTime: analytics.performanceMetrics.averageDeliveryTime,
        bandwidthOptimization: (analytics.bandwidthSaved / (analytics.storageUsed + analytics.bandwidthSaved)) * 100
      },
      recommendations
    };
  }

  /**
   * Clear all caches and reset metrics
   */
  async clearAllCaches(): Promise<void> {
    await Promise.all([
      imageOptimizer.clearCache(),
      this.cdnService.clearCache()
    ]);
    
    // Reset analytics
    this.analytics = {
      totalUploads: 0,
      totalDeliveries: 0,
      bandwidthSaved: 0,
      storageUsed: 0,
      averageOptimization: 0,
      popularFormats: {},
      deliveryRegions: {},
      performanceMetrics: {
        averageUploadTime: 0,
        averageDeliveryTime: 0,
        cacheHitRate: 0
      }
    };
  }

  /**
   * Update upload analytics
   */
  private updateUploadAnalytics(
    startTime: number,
    optimizationStats: {
      originalSize: number;
      optimizedSize: number;
      compressionRatio: number;
      format: string;
    }
  ): void {
    const uploadTime = Date.now() - startTime;
    
    this.analytics.totalUploads++;
    this.analytics.bandwidthSaved += optimizationStats.originalSize - optimizationStats.optimizedSize;
    this.analytics.storageUsed += optimizationStats.optimizedSize;
    
    // Update average upload time
    this.analytics.performanceMetrics.averageUploadTime = 
      (this.analytics.performanceMetrics.averageUploadTime * (this.analytics.totalUploads - 1) + uploadTime) 
      / this.analytics.totalUploads;

    // Update format popularity
    this.analytics.popularFormats[optimizationStats.format] = 
      (this.analytics.popularFormats[optimizationStats.format] || 0) + 1;
  }

  /**
   * Update delivery analytics
   */
  private updateDeliveryAnalytics(startTime: number, format: string): void {
    const deliveryTime = Date.now() - startTime;
    
    this.analytics.totalDeliveries++;
    
    // Update average delivery time
    this.analytics.performanceMetrics.averageDeliveryTime = 
      (this.analytics.performanceMetrics.averageDeliveryTime * (this.analytics.totalDeliveries - 1) + deliveryTime) 
      / this.analytics.totalDeliveries;
  }

  /**
   * Calculate size distribution for analytics
   */
  private calculateSizeDistribution(): { [range: string]: number } {
    const assets = this.cdnService.listAssets();
    const distribution = {
      'tiny (< 10KB)': 0,
      'small (10-50KB)': 0,
      'medium (50-200KB)': 0,
      'large (> 200KB)': 0
    };

    for (const asset of assets) {
      const sizeKB = asset.size / 1024;
      if (sizeKB < 10) distribution['tiny (< 10KB)']++;
      else if (sizeKB < 50) distribution['small (10-50KB)']++;
      else if (sizeKB < 200) distribution['medium (50-200KB)']++;
      else distribution['large (> 200KB)']++;
    }

    return distribution;
  }

  /**
   * Split array into chunks for parallel processing
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}

// Export factory function
export function createImageAPI(cdnConfig: CDNConfig): ImageAPIService {
  return ImageAPIService.getInstance(cdnConfig);
}

// Export default configurations
export const DefaultImageConfigs = {
  highQuality: {
    optimization: {
      quality: 90,
      format: 'webp' as const,
      progressive: true
    },
    generateResponsive: true,
    generatePlaceholder: true
  },
  balanced: {
    optimization: {
      quality: 85,
      format: 'webp' as const,
      progressive: true
    },
    generateResponsive: true,
    generatePlaceholder: true
  },
  aggressive: {
    optimization: {
      quality: 75,
      format: 'webp' as const,
      progressive: true
    },
    generateResponsive: true,
    generatePlaceholder: true
  }
};