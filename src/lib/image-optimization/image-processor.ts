
import sharp from 'sharp';
import { 
  ImageFormat, 
  ImageOptions, 
  OptimizationResult, 
  ResponsiveImageSet,
  PlaceholderType
} from './image-optimization.types';

export class ImageProcessor {
  // Standard breakpoints for responsive images
  private readonly breakpoints = [320, 640, 768, 1024, 1280, 1536, 1920];
  
  /**
   * Optimize a single image with the specified options
   */
  async optimize(
    buffer: Buffer,
    options: ImageOptions = {}
  ): Promise<OptimizationResult> {
    const {
      format = 'webp',
      quality = 80,
      width = 1920,
      height = null,
    } = options;

    try {
      const image = sharp(buffer);
      const metadata = await image.metadata();

      // Resize image
      image.resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true,
      });

      // Apply format-specific optimizations
      switch (format) {
        case 'jpeg':
          image.jpeg({ 
            quality, 
            progressive: true, 
            optimizeCoding: true,
            trellisQuantisation: true,
            overshootDeringing: true
          });
          break;
        case 'png':
          image.png({ 
            quality, 
            progressive: true,
            compressionLevel: 9,
            adaptiveFiltering: true
          });
          break;
        case 'webp':
          image.webp({ 
            quality, 
            alphaQuality: 100,
            lossless: quality >= 95,
            nearLossless: quality >= 90,
            smartSubsample: true
          });
          break;
        case 'avif':
          image.avif({ 
            quality, 
            lossless: quality >= 95,
            speed: 5 // Balance between speed and compression
          });
          break;
      }

      const optimizedBuffer = await image.toBuffer();
      const originalSize = buffer.length;
      const optimizedSize = optimizedBuffer.length;
      const sizeReduction = ((originalSize - optimizedSize) / originalSize) * 100;

      return {
        buffer: optimizedBuffer,
        format,
        originalSize,
        optimizedSize,
        sizeReduction,
        width: width || metadata.width || 0,
        height: height || metadata.height || 0
      };
    } catch (error) {
      console.error('Image optimization failed:', error);
      throw new Error(`Image optimization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generate a set of responsive images at different breakpoints
   */
  async generateResponsiveSet(
    buffer: Buffer,
    options: ImageOptions = {}
  ): Promise<ResponsiveImageSet> {
    const { format = 'webp', quality = 80 } = options;
    const metadata = await sharp(buffer).metadata();
    const originalWidth = metadata.width || 1920;
    
    // Determine which breakpoints to use based on original image size
    const breakpointsToUse = this.breakpoints.filter(bp => bp <= originalWidth);
    if (breakpointsToUse.length === 0) {
      breakpointsToUse.push(originalWidth);
    }
    
    // Add original width if it's not already in the breakpoints
    if (!breakpointsToUse.includes(originalWidth)) {
      breakpointsToUse.push(originalWidth);
    }
    
    // Sort breakpoints
    breakpointsToUse.sort((a, b) => a - b);
    
    // Generate an image for each breakpoint
    const images = await Promise.all(
      breakpointsToUse.map(async (width) => {
        const result = await this.optimize(buffer, {
          ...options,
          width,
          height: null, // Maintain aspect ratio
        });
        
        return {
          width,
          buffer: result.buffer,
          size: result.optimizedSize,
          format
        };
      })
    );
    
    // Generate placeholder
    const placeholder = await this.generatePlaceholder(buffer, options.placeholderType || 'blur');
    
    return {
      original: {
        width: originalWidth,
        height: metadata.height || 0,
        format: metadata.format as ImageFormat || format
      },
      images,
      placeholder
    };
  }

  /**
   * Generate a placeholder for progressive loading
   */
  async generatePlaceholder(
    buffer: Buffer,
    type: PlaceholderType = 'blur'
  ): Promise<Buffer> {
    const image = sharp(buffer);
    
    switch (type) {
      case 'blur':
        return image
          .resize(20) // Tiny size
          .blur(5)
          .toBuffer();
      
      case 'color':
        const { dominant } = await image
          .stats();
        
        // Create a 1x1 pixel of the dominant color
        return await sharp({
          create: {
            width: 1,
            height: 1,
            channels: 3,
            background: {
              r: dominant.r,
              g: dominant.g,
              b: dominant.b
            }
          }
        }).png().toBuffer();
      
      case 'low-res':
      default:
        return image
          .resize(40)
          .toBuffer();
    }
  }

  /**
   * Determine the best format based on browser support
   */
  getBestFormat(userAgent: string): ImageFormat {
    const ua = userAgent.toLowerCase();
    
    // Check for AVIF support
    if (ua.includes('chrome') && !ua.includes('edge')) {
      const chromeVersion = this.extractVersion(ua, 'chrome');
      if (chromeVersion >= 85) return 'avif';
    }
    
    // Check for WebP support (most modern browsers)
    if (
      (ua.includes('chrome') && !ua.includes('edge')) ||
      (ua.includes('firefox') && this.extractVersion(ua, 'firefox') >= 65) ||
      (ua.includes('safari') && this.extractVersion(ua, 'safari') >= 14) ||
      (ua.includes('edge') && this.extractVersion(ua, 'edge') >= 18)
    ) {
      return 'webp';
    }
    
    // Fallback to JPEG
    return 'jpeg';
  }
  
  /**
   * Extract browser version from user agent string
   */
  private extractVersion(ua: string, browser: string): number {
    const regex = new RegExp(`${browser}\\/(\\d+)`);
    const match = ua.match(regex);
    return match ? parseInt(match[1], 10) : 0;
  }
  
  /**
   * Generate HTML for a responsive image
   */
  generatePictureElement(
    responsiveSet: ResponsiveImageSet,
    alt: string,
    className?: string
  ): string {
    const { images, placeholder } = responsiveSet;
    
    // Group images by format
    const formatGroups: Record<ImageFormat, typeof images> = {
      avif: [],
      webp: [],
      jpeg: [],
      png: []
    };
    
    images.forEach(img => {
      if (formatGroups[img.format]) {
        formatGroups[img.format].push(img);
      }
    });
    
    // Create srcset for each format
    let html = '<picture>\n';
    
    // Add source elements for each format in order of preference
    ['avif', 'webp', 'jpeg', 'png'].forEach(format => {
      const formatImages = formatGroups[format as ImageFormat];
      if (formatImages && formatImages.length > 0) {
        const srcset = formatImages
          .map(img => `${img.width}w`)
          .join(', ');
        
        const mimeType = `image/${format === 'jpeg' ? 'jpeg' : format}`;
        html += `  <source type="${mimeType}" srcset="${srcset}" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw">\n`;
      }
    });
    
    // Get the default image (last format, largest size)
    const defaultFormat = ['jpeg', 'webp', 'png', 'avif'].find(
      format => formatGroups[format as ImageFormat]?.length > 0
    ) as ImageFormat;
    
    const defaultImage = formatGroups[defaultFormat]?.slice(-1)[0];
    
    // Add placeholder for blur-up loading
    const placeholderDataUrl = `data:image/${defaultFormat};base64,${placeholder.toString('base64')}`;
    
    // Add img element with placeholder and class
    html += `  <img 
    src="${placeholderDataUrl}" 
    data-src="${defaultImage ? defaultImage.url : ''}" 
    alt="${alt}" 
    ${className ? `class="${className}"` : ''}
    loading="lazy"
    style="background-size: cover; background-position: center; transition: opacity 0.5s ease-in-out;"
    onload="this.style.opacity = 1"
  >
</picture>`;
    
    return html;
  }
}
