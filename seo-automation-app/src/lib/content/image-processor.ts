/**
 * Image Processing and Analysis for SEO Automation App
 * Extracts, analyzes, and optimizes images from scraped content
 */

import { JSDOM } from 'jsdom';
import { z } from 'zod';

export interface ImageInfo {
  src: string;
  alt?: string;
  title?: string;
  width?: number;
  height?: number;
  fileSize?: number;
  format?: string;
  aspectRatio?: number;
  isLazy?: boolean;
  isResponsive?: boolean;
  srcset?: string;
  sizes?: string;
  loading?: 'lazy' | 'eager';
  decoding?: 'async' | 'sync' | 'auto';
  fetchpriority?: 'high' | 'low' | 'auto';
}

export interface ProcessedImage extends ImageInfo {
  id: string;
  originalUrl: string;
  processedUrl?: string;
  thumbnailUrl?: string;
  optimizedUrl?: string;
  metadata: {
    dominantColors?: string[];
    hasText?: boolean;
    isDecorative?: boolean;
    contentType?: string;
    lastModified?: string;
    cacheControl?: string;
  };
  seo: {
    hasAltText: boolean;
    altTextQuality: 'poor' | 'fair' | 'good' | 'excellent';
    isOptimized: boolean;
    recommendations: string[];
  };
  accessibility: {
    isAccessible: boolean;
    issues: string[];
    suggestions: string[];
  };
  performance: {
    isOptimized: boolean;
    estimatedLoadTime: number;
    compressionRatio?: number;
    recommendations: string[];
  };
}

export interface ImageProcessingResult {
  images: ProcessedImage[];
  statistics: {
    totalImages: number;
    imagesWithAlt: number;
    imagesWithoutAlt: number;
    averageFileSize: number;
    totalFileSize: number;
    formatDistribution: Record<string, number>;
    seoScore: number;
    accessibilityScore: number;
    performanceScore: number;
  };
  issues: Array<{
    type: 'seo' | 'accessibility' | 'performance';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    imageId?: string;
    recommendation: string;
  }>;
  recommendations: string[];
}

export interface ImageProcessingOptions {
  extractMetadata?: boolean;
  analyzeSEO?: boolean;
  checkAccessibility?: boolean;
  assessPerformance?: boolean;
  generateThumbnails?: boolean;
  optimizeImages?: boolean;
  maxImageSize?: number;
  supportedFormats?: string[];
  qualityThreshold?: number;
}

const DEFAULT_OPTIONS: Required<ImageProcessingOptions> = {
  extractMetadata: true,
  analyzeSEO: true,
  checkAccessibility: true,
  assessPerformance: true,
  generateThumbnails: false,
  optimizeImages: false,
  maxImageSize: 2 * 1024 * 1024, // 2MB
  supportedFormats: ['jpg', 'jpeg', 'png', 'webp', 'avif', 'svg'],
  qualityThreshold: 0.8,
};

export class ImageProcessor {
  private options: Required<ImageProcessingOptions>;

  constructor(options: ImageProcessingOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Process images from HTML content
   */
  async processImagesFromHtml(html: string, baseUrl?: string): Promise<ImageProcessingResult> {
    const dom = new JSDOM(html);
    const document = dom.window.document;
    const imageElements = document.querySelectorAll('img');

    const images: ProcessedImage[] = [];
    const issues: ImageProcessingResult['issues'] = [];

    for (let i = 0; i < imageElements.length; i++) {
      const imgElement = imageElements[i];
      try {
        const processedImage = await this.processImage(imgElement, baseUrl, i);
        images.push(processedImage);

        // Collect issues from processed image
        this.collectImageIssues(processedImage, issues);
      } catch (error) {
        issues.push({
          type: 'performance',
          severity: 'medium',
          message: `Failed to process image: ${(error as Error).message}`,
          recommendation: 'Check image URL and accessibility',
        });
      }
    }

    const statistics = this.calculateStatistics(images);
    const recommendations = this.generateRecommendations(images, issues, statistics);

    return {
      images,
      statistics,
      issues,
      recommendations,
    };
  }

  /**
   * Process images from markdown content
   */
  async processImagesFromMarkdown(markdown: string, baseUrl?: string): Promise<ImageProcessingResult> {
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    const images: ProcessedImage[] = [];
    const issues: ImageProcessingResult['issues'] = [];
    let match;
    let index = 0;

    while ((match = imageRegex.exec(markdown)) !== null) {
      const [, alt, src] = match;
      
      try {
        const imageInfo: ImageInfo = {
          src: this.resolveUrl(src, baseUrl),
          alt: alt || undefined,
        };

        const processedImage = await this.processImageInfo(imageInfo, index);
        images.push(processedImage);

        this.collectImageIssues(processedImage, issues);
        index++;
      } catch (error) {
        issues.push({
          type: 'performance',
          severity: 'medium',
          message: `Failed to process markdown image: ${(error as Error).message}`,
          recommendation: 'Check image URL and format',
        });
      }
    }

    const statistics = this.calculateStatistics(images);
    const recommendations = this.generateRecommendations(images, issues, statistics);

    return {
      images,
      statistics,
      issues,
      recommendations,
    };
  }

  /**
   * Process individual image element
   */
  private async processImage(imgElement: HTMLImageElement, baseUrl?: string, index: number): Promise<ProcessedImage> {
    const imageInfo: ImageInfo = {
      src: this.resolveUrl(imgElement.src, baseUrl),
      alt: imgElement.alt || undefined,
      title: imgElement.title || undefined,
      width: imgElement.width || undefined,
      height: imgElement.height || undefined,
      srcset: imgElement.srcset || undefined,
      sizes: imgElement.sizes || undefined,
      loading: (imgElement.loading as any) || undefined,
      decoding: (imgElement.decoding as any) || undefined,
      fetchpriority: (imgElement as any).fetchpriority || undefined,
    };

    return this.processImageInfo(imageInfo, index);
  }

  /**
   * Process image information
   */
  private async processImageInfo(imageInfo: ImageInfo, index: number): Promise<ProcessedImage> {
    const id = `img_${index}_${Date.now()}`;
    
    const processedImage: ProcessedImage = {
      ...imageInfo,
      id,
      originalUrl: imageInfo.src,
      metadata: {},
      seo: {
        hasAltText: Boolean(imageInfo.alt),
        altTextQuality: this.assessAltTextQuality(imageInfo.alt),
        isOptimized: false,
        recommendations: [],
      },
      accessibility: {
        isAccessible: Boolean(imageInfo.alt),
        issues: [],
        suggestions: [],
      },
      performance: {
        isOptimized: false,
        estimatedLoadTime: 0,
        recommendations: [],
      },
    };

    // Extract metadata if enabled
    if (this.options.extractMetadata) {
      await this.extractImageMetadata(processedImage);
    }

    // Analyze SEO if enabled
    if (this.options.analyzeSEO) {
      this.analyzeSEO(processedImage);
    }

    // Check accessibility if enabled
    if (this.options.checkAccessibility) {
      this.checkAccessibility(processedImage);
    }

    // Assess performance if enabled
    if (this.options.assessPerformance) {
      await this.assessPerformance(processedImage);
    }

    return processedImage;
  }

  /**
   * Extract image metadata
   */
  private async extractImageMetadata(image: ProcessedImage): Promise<void> {
    try {
      // In a real implementation, you would fetch the image and analyze it
      // For now, we'll simulate metadata extraction
      
      const url = new URL(image.src);
      const extension = url.pathname.split('.').pop()?.toLowerCase();
      
      image.format = extension;
      image.metadata.contentType = this.getContentType(extension);
      
      // Simulate file size estimation based on format and dimensions
      if (image.width && image.height) {
        image.fileSize = this.estimateFileSize(image.width, image.height, extension);
        image.aspectRatio = image.width / image.height;
      }

      // Check if image is responsive
      image.isResponsive = Boolean(image.srcset || image.sizes);
      
      // Check if image is lazy loaded
      image.isLazy = image.loading === 'lazy';

    } catch (error) {
      console.warn(`Failed to extract metadata for image ${image.src}:`, error);
    }
  }

  /**
   * Analyze SEO aspects of image
   */
  private analyzeSEO(image: ProcessedImage): void {
    const seo = image.seo;
    
    // Check alt text
    if (!image.alt) {
      seo.recommendations.push('Add descriptive alt text for better SEO and accessibility');
    } else {
      // Analyze alt text quality
      const altText = image.alt.toLowerCase();
      
      if (altText.includes('image') || altText.includes('picture') || altText.includes('photo')) {
        seo.recommendations.push('Remove redundant words like "image" or "picture" from alt text');
      }
      
      if (image.alt.length > 125) {
        seo.recommendations.push('Shorten alt text to under 125 characters for better screen reader experience');
      }
      
      if (image.alt.length < 10) {
        seo.recommendations.push('Make alt text more descriptive (aim for 10-125 characters)');
      }
    }

    // Check file naming
    const filename = image.src.split('/').pop() || '';
    if (filename.match(/^(img|image|photo|picture)\d*\.(jpg|jpeg|png|webp)$/i)) {
      seo.recommendations.push('Use descriptive filenames instead of generic names like "img1.jpg"');
    }

    // Check image format optimization
    const format = image.format?.toLowerCase();
    if (format === 'png' && !this.isPngAppropriate(image)) {
      seo.recommendations.push('Consider using JPEG or WebP format for better compression');
    }

    if (!['webp', 'avif'].includes(format || '')) {
      seo.recommendations.push('Consider using modern formats like WebP or AVIF for better performance');
    }

    // Update optimization status
    seo.isOptimized = seo.recommendations.length === 0;
  }

  /**
   * Check accessibility of image
   */
  private checkAccessibility(image: ProcessedImage): void {
    const accessibility = image.accessibility;
    
    if (!image.alt) {
      accessibility.isAccessible = false;
      accessibility.issues.push('Missing alt text');
      accessibility.suggestions.push('Add descriptive alt text that explains the image content');
    } else {
      // Check alt text quality
      if (image.alt.length === 0) {
        accessibility.issues.push('Empty alt text');
        accessibility.suggestions.push('Provide meaningful alt text or use alt="" for decorative images');
      }
      
      if (image.alt.length > 125) {
        accessibility.issues.push('Alt text too long');
        accessibility.suggestions.push('Keep alt text under 125 characters for better screen reader experience');
      }
    }

    // Check for decorative images
    if (this.isDecorativeImage(image)) {
      image.metadata.isDecorative = true;
      if (image.alt && image.alt.length > 0) {
        accessibility.suggestions.push('Consider using empty alt="" for decorative images');
      }
    }

    // Check title attribute usage
    if (image.title && image.alt && image.title === image.alt) {
      accessibility.issues.push('Title attribute duplicates alt text');
      accessibility.suggestions.push('Remove title attribute or provide additional context');
    }

    accessibility.isAccessible = accessibility.issues.length === 0;
  }

  /**
   * Assess image performance
   */
  private async assessPerformance(image: ProcessedImage): Promise<void> {
    const performance = image.performance;
    
    // Estimate load time based on file size and format
    const fileSize = image.fileSize || this.estimateFileSize(
      image.width || 800, 
      image.height || 600, 
      image.format
    );
    
    // Assume average connection speed of 1.5 Mbps
    const connectionSpeed = 1.5 * 1024 * 1024 / 8; // bytes per second
    performance.estimatedLoadTime = fileSize / connectionSpeed;

    // Check file size
    if (fileSize > this.options.maxImageSize) {
      performance.recommendations.push(`Image too large (${this.formatFileSize(fileSize)}). Optimize or compress.`);
    }

    // Check format efficiency
    const format = image.format?.toLowerCase();
    if (format === 'png' && fileSize > 500 * 1024) {
      performance.recommendations.push('Large PNG detected. Consider JPEG or WebP for better compression.');
    }

    // Check responsive images
    if (!image.isResponsive && (image.width || 0) > 800) {
      performance.recommendations.push('Add responsive images (srcset) for better mobile performance');
    }

    // Check lazy loading
    if (!image.isLazy && image.src.includes('fold')) {
      performance.recommendations.push('Add lazy loading for below-the-fold images');
    }

    // Check modern format usage
    if (!['webp', 'avif'].includes(format || '')) {
      performance.recommendations.push('Use modern image formats (WebP, AVIF) for better compression');
    }

    performance.isOptimized = performance.recommendations.length === 0;
  }

  /**
   * Assess alt text quality
   */
  private assessAltTextQuality(alt?: string): ProcessedImage['seo']['altTextQuality'] {
    if (!alt) return 'poor';
    
    const length = alt.length;
    const hasKeywords = /\b(button|link|image|picture|photo)\b/i.test(alt);
    const isDescriptive = length >= 10 && length <= 125;
    const hasContext = alt.split(' ').length >= 3;

    if (isDescriptive && hasContext && !hasKeywords) return 'excellent';
    if (isDescriptive && !hasKeywords) return 'good';
    if (length > 5 && !hasKeywords) return 'fair';
    return 'poor';
  }

  /**
   * Check if PNG format is appropriate
   */
  private isPngAppropriate(image: ProcessedImage): boolean {
    // PNG is appropriate for images with transparency, text, or few colors
    const filename = image.src.toLowerCase();
    return filename.includes('logo') || 
           filename.includes('icon') || 
           filename.includes('transparent') ||
           Boolean(image.metadata.hasText);
  }

  /**
   * Check if image is decorative
   */
  private isDecorativeImage(image: ProcessedImage): boolean {
    const src = image.src.toLowerCase();
    return src.includes('decoration') || 
           src.includes('border') || 
           src.includes('spacer') ||
           src.includes('divider');
  }

  /**
   * Estimate file size based on dimensions and format
   */
  private estimateFileSize(width: number, height: number, format?: string): number {
    const pixels = width * height;
    const baseSize = pixels * 3; // 3 bytes per pixel (RGB)
    
    switch (format?.toLowerCase()) {
      case 'jpg':
      case 'jpeg':
        return Math.round(baseSize * 0.1); // ~10% of raw size
      case 'png':
        return Math.round(baseSize * 0.3); // ~30% of raw size
      case 'webp':
        return Math.round(baseSize * 0.08); // ~8% of raw size
      case 'avif':
        return Math.round(baseSize * 0.05); // ~5% of raw size
      default:
        return Math.round(baseSize * 0.15); // Default estimate
    }
  }

  /**
   * Get content type from file extension
   */
  private getContentType(extension?: string): string {
    const types: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'webp': 'image/webp',
      'avif': 'image/avif',
      'svg': 'image/svg+xml',
      'gif': 'image/gif',
    };
    
    return types[extension?.toLowerCase() || ''] || 'image/unknown';
  }

  /**
   * Resolve relative URLs
   */
  private resolveUrl(url: string, baseUrl?: string): string {
    if (!baseUrl || url.startsWith('http')) {
      return url;
    }
    
    try {
      return new URL(url, baseUrl).href;
    } catch {
      return url;
    }
  }

  /**
   * Format file size for display
   */
  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  /**
   * Calculate statistics
   */
  private calculateStatistics(images: ProcessedImage[]): ImageProcessingResult['statistics'] {
    const totalImages = images.length;
    const imagesWithAlt = images.filter(img => img.alt).length;
    const imagesWithoutAlt = totalImages - imagesWithAlt;
    
    const fileSizes = images.map(img => img.fileSize || 0);
    const totalFileSize = fileSizes.reduce((sum, size) => sum + size, 0);
    const averageFileSize = totalImages > 0 ? totalFileSize / totalImages : 0;
    
    const formatDistribution: Record<string, number> = {};
    images.forEach(img => {
      const format = img.format || 'unknown';
      formatDistribution[format] = (formatDistribution[format] || 0) + 1;
    });

    // Calculate scores
    const seoScore = totalImages > 0 ? (imagesWithAlt / totalImages) * 100 : 100;
    const accessibilityScore = totalImages > 0 ? 
      (images.filter(img => img.accessibility.isAccessible).length / totalImages) * 100 : 100;
    const performanceScore = totalImages > 0 ? 
      (images.filter(img => img.performance.isOptimized).length / totalImages) * 100 : 100;

    return {
      totalImages,
      imagesWithAlt,
      imagesWithoutAlt,
      averageFileSize: Math.round(averageFileSize),
      totalFileSize,
      formatDistribution,
      seoScore: Math.round(seoScore),
      accessibilityScore: Math.round(accessibilityScore),
      performanceScore: Math.round(performanceScore),
    };
  }

  /**
   * Collect issues from processed image
   */
  private collectImageIssues(image: ProcessedImage, issues: ImageProcessingResult['issues']): void {
    // SEO issues
    if (!image.seo.hasAltText) {
      issues.push({
        type: 'seo',
        severity: 'high',
        message: 'Image missing alt text',
        imageId: image.id,
        recommendation: 'Add descriptive alt text for better SEO and accessibility',
      });
    }

    // Accessibility issues
    image.accessibility.issues.forEach(issue => {
      issues.push({
        type: 'accessibility',
        severity: 'high',
        message: issue,
        imageId: image.id,
        recommendation: image.accessibility.suggestions[0] || 'Fix accessibility issue',
      });
    });

    // Performance issues
    if (image.fileSize && image.fileSize > this.options.maxImageSize) {
      issues.push({
        type: 'performance',
        severity: 'medium',
        message: `Large image file (${this.formatFileSize(image.fileSize)})`,
        imageId: image.id,
        recommendation: 'Optimize or compress image to reduce file size',
      });
    }
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    images: ProcessedImage[], 
    issues: ImageProcessingResult['issues'], 
    statistics: ImageProcessingResult['statistics']
  ): string[] {
    const recommendations: string[] = [];

    if (statistics.imagesWithoutAlt > 0) {
      recommendations.push(`Add alt text to ${statistics.imagesWithoutAlt} images for better SEO and accessibility`);
    }

    if (statistics.seoScore < 80) {
      recommendations.push('Improve image SEO by adding descriptive alt text and optimizing filenames');
    }

    if (statistics.accessibilityScore < 90) {
      recommendations.push('Fix accessibility issues to make images usable by screen readers');
    }

    if (statistics.performanceScore < 70) {
      recommendations.push('Optimize image performance by compressing files and using modern formats');
    }

    const largeImages = images.filter(img => (img.fileSize || 0) > 1024 * 1024);
    if (largeImages.length > 0) {
      recommendations.push(`Compress ${largeImages.length} large images to improve page load speed`);
    }

    const oldFormatImages = images.filter(img => 
      img.format && !['webp', 'avif'].includes(img.format.toLowerCase())
    );
    if (oldFormatImages.length > 0) {
      recommendations.push('Consider using modern image formats (WebP, AVIF) for better compression');
    }

    const nonResponsiveImages = images.filter(img => !img.isResponsive);
    if (nonResponsiveImages.length > 0) {
      recommendations.push('Add responsive images (srcset) for better mobile experience');
    }

    return recommendations;
  }
}

// Factory function
export const createImageProcessor = (options?: ImageProcessingOptions): ImageProcessor => {
  return new ImageProcessor(options);
};

// Default export
export default ImageProcessor;
