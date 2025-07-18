/**
 * Image Optimization Service
 * Handles image compression, format conversion, and delivery optimization
 */

import sharp from 'sharp';
import { createHash } from 'crypto';
import { multiTierCache } from '../cache/multi-tier-cache';

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png' | 'avif';
  progressive?: boolean;
  blur?: number;
  grayscale?: boolean;
  crop?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

export interface OptimizedImage {
  buffer: Buffer;
  format: string;
  width: number;
  height: number;
  size: number;
  compressionRatio: number;
  originalSize: number;
}

export interface ImageMetrics {
  totalImages: number;
  totalSavings: number;
  averageCompressionRatio: number;
  formatBreakdown: { [format: string]: number };
  sizeBreakdown: {
    tiny: number;    // < 10KB
    small: number;   // 10-50KB
    medium: number;  // 50-200KB
    large: number;   // > 200KB
  };
}

export class ImageOptimizationService {
  private static instance: ImageOptimizationService;
  private metrics: ImageMetrics = {
    totalImages: 0,
    totalSavings: 0,
    averageCompressionRatio: 0,
    formatBreakdown: {},
    sizeBreakdown: { tiny: 0, small: 0, medium: 0, large: 0 }
  };

  private constructor() {}

  public static getInstance(): ImageOptimizationService {
    if (!ImageOptimizationService.instance) {
      ImageOptimizationService.instance = new ImageOptimizationService();
    }
    return ImageOptimizationService.instance;
  }

  /**
   * Optimize image with comprehensive format and size optimization
   */
  async optimizeImage(
    imageBuffer: Buffer,
    options: ImageOptimizationOptions = {}
  ): Promise<OptimizedImage> {
    const originalSize = imageBuffer.length;
    const imageHash = this.generateImageHash(imageBuffer, options);
    
    // Check cache first
    const cacheKey = `image:optimized:${imageHash}`;
    const cached = await multiTierCache.get(cacheKey, 'image-optimization');
    
    if (cached) {
      return {
        ...cached,
        buffer: Buffer.from(cached.buffer)
      };
    }

    const {
      width,
      height,
      quality = 85,
      format = 'webp',
      progressive = true,
      blur,
      grayscale,
      crop = 'cover'
    } = options;

    let pipeline = sharp(imageBuffer);

    // Apply transformations
    if (width || height) {
      pipeline = pipeline.resize(width, height, {
        fit: crop,
        withoutEnlargement: true
      });
    }

    if (grayscale) {
      pipeline = pipeline.grayscale();
    }

    if (blur && blur > 0) {
      pipeline = pipeline.blur(blur);
    }

    // Format-specific optimizations
    switch (format) {
      case 'webp':
        pipeline = pipeline.webp({
          quality,
          progressive,
          effort: 6 // Maximum compression effort
        });
        break;
      case 'avif':
        pipeline = pipeline.avif({
          quality,
          effort: 9 // Maximum compression effort
        });
        break;
      case 'jpeg':
        pipeline = pipeline.jpeg({
          quality,
          progressive,
          mozjpeg: true // Use mozjpeg for better compression
        });
        break;
      case 'png':
        pipeline = pipeline.png({
          progressive,
          compressionLevel: 9,
          palette: true // Use palette when beneficial
        });
        break;
    }

    const { data: optimizedBuffer, info } = await pipeline.toBuffer({ resolveWithObject: true });
    
    const compressionRatio = (originalSize - optimizedBuffer.length) / originalSize;
    
    const result: OptimizedImage = {
      buffer: optimizedBuffer,
      format: info.format,
      width: info.width,
      height: info.height,
      size: optimizedBuffer.length,
      compressionRatio,
      originalSize
    };

    // Cache the result (store as base64 to avoid Buffer serialization issues)
    const cacheableResult = {
      ...result,
      buffer: optimizedBuffer.toString('base64')
    };
    
    await multiTierCache.set(
      cacheKey,
      cacheableResult,
      {
        ttl: 30 * 24 * 60 * 60, // 30 days
        tier: 'all'
      },
      'image-optimization'
    );

    // Update metrics
    this.updateMetrics(result);

    return result;
  }

  /**
   * Generate responsive image variants
   */
  async generateResponsiveVariants(
    imageBuffer: Buffer,
    breakpoints: number[] = [320, 640, 768, 1024, 1280, 1920]
  ): Promise<{ [key: string]: OptimizedImage }> {
    const variants: { [key: string]: OptimizedImage } = {};
    
    // Get original dimensions
    const metadata = await sharp(imageBuffer).metadata();
    const originalWidth = metadata.width || 1920;

    for (const breakpoint of breakpoints) {
      // Skip if breakpoint is larger than original
      if (breakpoint > originalWidth) continue;

      const variantKey = `w${breakpoint}`;
      
      // Generate WebP variant
      variants[`${variantKey}_webp`] = await this.optimizeImage(imageBuffer, {
        width: breakpoint,
        format: 'webp',
        quality: this.getQualityForSize(breakpoint)
      });

      // Generate fallback JPEG
      variants[`${variantKey}_jpeg`] = await this.optimizeImage(imageBuffer, {
        width: breakpoint,
        format: 'jpeg',
        quality: this.getQualityForSize(breakpoint)
      });

      // Generate AVIF for modern browsers (smaller sizes only)
      if (breakpoint <= 1024) {
        variants[`${variantKey}_avif`] = await this.optimizeImage(imageBuffer, {
          width: breakpoint,
          format: 'avif',
          quality: this.getQualityForSize(breakpoint)
        });
      }
    }

    return variants;
  }

  /**
   * Generate placeholder image for progressive loading
   */
  async generatePlaceholder(
    imageBuffer: Buffer,
    type: 'blur' | 'lowres' | 'color' = 'blur'
  ): Promise<string> {
    const cacheKey = `image:placeholder:${this.generateImageHash(imageBuffer)}:${type}`;
    const cached = await multiTierCache.get(cacheKey, 'image-optimization');
    
    if (cached) return cached;

    let placeholder: string;

    switch (type) {
      case 'blur':
        // Generate tiny blurred version
        const blurred = await sharp(imageBuffer)
          .resize(20, 20, { fit: 'cover' })
          .blur(2)
          .jpeg({ quality: 20 })
          .toBuffer();
        placeholder = `data:image/jpeg;base64,${blurred.toString('base64')}`;
        break;

      case 'lowres':
        // Generate low resolution version
        const lowres = await sharp(imageBuffer)
          .resize(40, 40, { fit: 'cover' })
          .jpeg({ quality: 30 })
          .toBuffer();
        placeholder = `data:image/jpeg;base64,${lowres.toString('base64')}`;
        break;

      case 'color':
        // Extract dominant color
        const { dominant } = await sharp(imageBuffer)
          .resize(1, 1)
          .raw()
          .toBuffer({ resolveWithObject: true });
        const [r, g, b] = Array.from(dominant);
        placeholder = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100%25' height='100%25' fill='rgb(${r},${g},${b})'/%3E%3C/svg%3E`;
        break;
    }

    // Cache placeholder
    await multiTierCache.set(
      cacheKey,
      placeholder,
      { ttl: 90 * 24 * 60 * 60 }, // 90 days
      'image-optimization'
    );

    return placeholder;
  }

  /**
   * Generate image hash for caching
   */
  private generateImageHash(buffer: Buffer, options?: ImageOptimizationOptions): string {
    const optionsStr = options ? JSON.stringify(options) : '';
    return createHash('sha256')
      .update(buffer)
      .update(optionsStr)
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Get optimal quality based on image size
   */
  private getQualityForSize(width: number): number {
    if (width <= 320) return 75;
    if (width <= 640) return 80;
    if (width <= 1024) return 85;
    return 90;
  }

  /**
   * Update optimization metrics
   */
  private updateMetrics(result: OptimizedImage): void {
    this.metrics.totalImages++;
    this.metrics.totalSavings += result.originalSize - result.size;
    
    // Update format breakdown
    this.metrics.formatBreakdown[result.format] = 
      (this.metrics.formatBreakdown[result.format] || 0) + 1;

    // Update size breakdown
    const sizeKB = result.size / 1024;
    if (sizeKB < 10) this.metrics.sizeBreakdown.tiny++;
    else if (sizeKB < 50) this.metrics.sizeBreakdown.small++;
    else if (sizeKB < 200) this.metrics.sizeBreakdown.medium++;
    else this.metrics.sizeBreakdown.large++;

    // Update average compression ratio
    this.metrics.averageCompressionRatio = 
      this.metrics.totalSavings / (this.metrics.totalImages * 100); // Average as percentage
  }

  /**
   * Get optimization metrics
   */
  getMetrics(): ImageMetrics {
    return { ...this.metrics };
  }

  /**
   * Clear optimization cache
   */
  async clearCache(): Promise<void> {
    await multiTierCache.invalidateService('image-optimization');
  }

  /**
   * Validate image format and size
   */
  async validateImage(buffer: Buffer): Promise<{
    isValid: boolean;
    format?: string;
    width?: number;
    height?: number;
    size: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    const size = buffer.length;

    try {
      const metadata = await sharp(buffer).metadata();
      
      // Check file size (max 10MB)
      if (size > 10 * 1024 * 1024) {
        errors.push('Image size exceeds 10MB limit');
      }

      // Check dimensions (max 5000px)
      if (metadata.width && metadata.width > 5000) {
        errors.push('Image width exceeds 5000px limit');
      }
      if (metadata.height && metadata.height > 5000) {
        errors.push('Image height exceeds 5000px limit');
      }

      // Check format
      const supportedFormats = ['jpeg', 'png', 'webp', 'avif', 'gif', 'svg'];
      if (metadata.format && !supportedFormats.includes(metadata.format)) {
        errors.push(`Unsupported format: ${metadata.format}`);
      }

      return {
        isValid: errors.length === 0,
        format: metadata.format,
        width: metadata.width,
        height: metadata.height,
        size,
        errors
      };
    } catch (error) {
      errors.push('Invalid image file');
      return {
        isValid: false,
        size,
        errors
      };
    }
  }
}

// Export singleton instance
export const imageOptimizer = ImageOptimizationService.getInstance();