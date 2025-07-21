#!/usr/bin/env node

/**
 * Image Optimization Setup Script
 * Initializes image optimization and CDN services with optimal configurations
 */

const { createImageAPI, DefaultImageConfigs } = require('../lib/image-optimization/image-api');
const { CDNProviderConfigs } = require('../lib/image-optimization/cdn-service');

const PROVIDER = process.argv[2] || 'vercel';
const ENVIRONMENT = process.argv[3] || 'development';
const VERBOSE = process.argv.includes('--verbose');

class ImageOptimizationSetup {
  constructor() {
    this.provider = PROVIDER;
    this.environment = ENVIRONMENT;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '📄',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      setup: '🔧'
    }[type] || '📄';
    
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  async setupImageOptimization() {
    this.log('Setting up image optimization and CDN services...', 'setup');
    
    try {
      // Get CDN configuration based on provider
      const cdnConfig = this.getCDNConfig();
      this.log(`Configuring ${this.provider.toUpperCase()} CDN provider`, 'info');

      if (VERBOSE) {
        console.log('CDN Configuration:', JSON.stringify(cdnConfig, null, 2));
      }

      // Initialize image API service
      const imageAPI = createImageAPI(cdnConfig);
      this.log('Image API service initialized successfully', 'success');

      // Test image optimization
      await this.testImageOptimization(imageAPI);

      // Generate configuration files
      await this.generateConfigFiles(cdnConfig);

      // Create example usage files
      await this.createExampleFiles();

      // Display setup summary
      this.displaySetupSummary(cdnConfig);

      this.log('Image optimization setup completed successfully!', 'success');

    } catch (error) {
      this.log(`Setup failed: ${error.message}`, 'error');
      if (VERBOSE) {
        console.error(error);
      }
      process.exit(1);
    }
  }

  getCDNConfig() {
    const baseConfig = CDNProviderConfigs[this.provider];
    
    if (!baseConfig) {
      throw new Error(`Unsupported CDN provider: ${this.provider}. Supported: cloudflare, aws, vercel`);
    }

    // Environment-specific overrides
    const environmentOverrides = this.getEnvironmentOverrides();

    return {
      ...baseConfig,
      ...environmentOverrides
    };
  }

  getEnvironmentOverrides() {
    const overrides = {};

    switch (this.environment) {
      case 'development':
        overrides.maxAge = 3600; // 1 hour cache for development
        overrides.baseUrl = process.env.DEV_CDN_URL || overrides.baseUrl;
        break;
      
      case 'staging':
        overrides.maxAge = 86400; // 1 day cache for staging
        overrides.baseUrl = process.env.STAGING_CDN_URL || overrides.baseUrl;
        break;
      
      case 'production':
        overrides.maxAge = 31536000; // 1 year cache for production
        overrides.baseUrl = process.env.PRODUCTION_CDN_URL || overrides.baseUrl;
        break;
    }

    // Add API keys if available
    if (process.env.CDN_API_KEY) {
      overrides.apiKey = process.env.CDN_API_KEY;
    }

    return overrides;
  }

  async testImageOptimization(imageAPI) {
    this.log('Running image optimization tests...', 'info');

    try {
      // Create a test image buffer (1x1 pixel PNG)
      const testImageBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        'base64'
      );

      // Test upload
      const uploadResult = await imageAPI.uploadImage(testImageBuffer, 'test-image.png', {
        generateResponsive: true,
        generatePlaceholder: true,
        region: 'global',
        tags: ['test', 'setup']
      });

      if (uploadResult.success) {
        this.log('✓ Image upload test passed', 'success');
        
        if (VERBOSE && uploadResult.optimizationStats) {
          const stats = uploadResult.optimizationStats;
          console.log(`  Original size: ${stats.originalSize} bytes`);
          console.log(`  Optimized size: ${stats.optimizedSize} bytes`);
          console.log(`  Compression ratio: ${(stats.compressionRatio * 100).toFixed(1)}%`);
          console.log(`  Format: ${stats.format}`);
        }

        // Test URL generation
        if (uploadResult.asset) {
          const optimizedUrl = imageAPI.getImageUrl(uploadResult.asset.id, {
            width: 300,
            format: 'webp',
            quality: 85
          });
          this.log('✓ URL generation test passed', 'success');
          
          if (VERBOSE) {
            console.log(`  Optimized URL: ${optimizedUrl}`);
          }

          // Test responsive HTML generation
          const responsiveHTML = imageAPI.generateResponsiveImage(
            uploadResult.asset.id,
            'Test image',
            {
              sizes: '(max-width: 640px) 100vw, 640px',
              className: 'test-image',
              loading: 'lazy'
            }
          );
          this.log('✓ Responsive HTML generation test passed', 'success');

          if (VERBOSE) {
            console.log('  Generated HTML:');
            console.log(responsiveHTML);
          }

          // Clean up test image
          await imageAPI.deleteImage(uploadResult.asset.id);
          this.log('✓ Test cleanup completed', 'success');
        }
      } else {
        throw new Error(uploadResult.error || 'Upload test failed');
      }

    } catch (error) {
      this.log(`Image optimization test failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async generateConfigFiles(cdnConfig) {
    this.log('Generating configuration files...', 'info');

    const fs = require('fs').promises;
    const path = require('path');

    // Create config directory
    const configDir = path.join(process.cwd(), 'config');
    await fs.mkdir(configDir, { recursive: true });

    // Generate image optimization config
    const imageConfig = {
      cdn: cdnConfig,
      optimization: {
        defaultQuality: 85,
        enableWebP: true,
        enableAVIF: true,
        generateResponsive: true,
        generatePlaceholder: true,
        responsiveBreakpoints: [320, 640, 768, 1024, 1280, 1920],
        maxFileSize: 10 * 1024 * 1024, // 10MB
        supportedFormats: ['jpeg', 'png', 'webp', 'avif', 'gif']
      },
      delivery: {
        lazyLoading: true,
        progressiveLoading: true,
        preloadCritical: true,
        compressionLevel: 9
      },
      analytics: {
        trackPerformance: true,
        trackUsage: true,
        reportingInterval: 3600000 // 1 hour
      }
    };

    const configPath = path.join(configDir, 'image-optimization.json');
    await fs.writeFile(configPath, JSON.stringify(imageConfig, null, 2));
    this.log(`✓ Configuration saved to ${configPath}`, 'success');

    // Generate environment-specific config
    const envConfigPath = path.join(configDir, `image-optimization.${this.environment}.json`);
    const envConfig = {
      ...imageConfig,
      environment: this.environment,
      debug: this.environment !== 'production',
      monitoring: this.environment === 'production'
    };
    
    await fs.writeFile(envConfigPath, JSON.stringify(envConfig, null, 2));
    this.log(`✓ Environment config saved to ${envConfigPath}`, 'success');
  }

  async createExampleFiles() {
    this.log('Creating example usage files...', 'info');

    const fs = require('fs').promises;
    const path = require('path');

    // Create examples directory
    const examplesDir = path.join(process.cwd(), 'examples', 'image-optimization');
    await fs.mkdir(examplesDir, { recursive: true });

    // Next.js API route example
    const apiRouteExample = `// pages/api/images/upload.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { createImageAPI } from '@/lib/image-optimization/image-api';
import { CDNProviderConfigs } from '@/lib/image-optimization/cdn-service';
import multer from 'multer';

const upload = multer();
const imageAPI = createImageAPI(CDNProviderConfigs.${this.provider});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get uploaded file (assuming multer middleware)
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Upload and optimize image
    const result = await imageAPI.uploadImage(file.buffer, file.originalname, {
      generateResponsive: true,
      generatePlaceholder: true,
      region: 'global'
    });

    if (result.success) {
      res.json({
        success: true,
        asset: result.asset,
        optimizationStats: result.optimizationStats
      });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};`;

    await fs.writeFile(
      path.join(examplesDir, 'api-route-upload.ts'),
      apiRouteExample
    );

    // React component example
    const componentExample = `// components/OptimizedImage.tsx
import React from 'react';
import { createImageAPI } from '@/lib/image-optimization/image-api';
import { CDNProviderConfigs } from '@/lib/image-optimization/cdn-service';

interface OptimizedImageProps {
  assetId: string;
  alt: string;
  width?: number;
  height?: number;
  sizes?: string;
  className?: string;
  priority?: boolean;
}

const imageAPI = createImageAPI(CDNProviderConfigs.${this.provider});

export function OptimizedImage({
  assetId,
  alt,
  width,
  height,
  sizes = '100vw',
  className = '',
  priority = false
}: OptimizedImageProps) {
  // Generate responsive HTML
  const responsiveHTML = imageAPI.generateResponsiveImage(assetId, alt, {
    sizes,
    className,
    loading: priority ? 'eager' : 'lazy'
  });

  return (
    <div 
      dangerouslySetInnerHTML={{ __html: responsiveHTML }}
      style={{ width, height }}
    />
  );
}

// Usage example:
// <OptimizedImage 
//   assetId="abc123" 
//   alt="Product image" 
//   sizes="(max-width: 640px) 100vw, 640px"
//   className="rounded-lg shadow-md"
//   priority={true}
// />`;

    await fs.writeFile(
      path.join(examplesDir, 'react-component.tsx'),
      componentExample
    );

    // Performance optimization example
    const performanceExample = `// lib/image-performance.ts
import { createImageAPI } from '@/lib/image-optimization/image-api';
import { CDNProviderConfigs } from '@/lib/image-optimization/cdn-service';

const imageAPI = createImageAPI(CDNProviderConfigs.${this.provider});

export class ImagePerformanceOptimizer {
  /**
   * Generate critical resource hints for above-the-fold images
   */
  static generateCriticalResourceHints(criticalAssetIds: string[]) {
    const hints = imageAPI.generateResourceHints(criticalAssetIds);
    
    return [
      ...hints.dns,
      ...hints.preload,
      ...hints.prefetch
    ].join('\\n');
  }

  /**
   * Get performance analytics for monitoring
   */
  static async getPerformanceMetrics() {
    const report = await imageAPI.generatePerformanceReport();
    
    return {
      totalSavings: report.summary.totalSavings,
      compressionRatio: report.summary.averageCompressionRatio,
      cacheHitRate: report.summary.cacheHitRate,
      recommendations: report.recommendations
    };
  }

  /**
   * Bulk optimize images for existing content
   */
  static async optimizeExistingImages(imageUrls: string[]) {
    const results = [];
    
    for (const url of imageUrls) {
      try {
        const response = await fetch(url);
        const buffer = Buffer.from(await response.arrayBuffer());
        
        const result = await imageAPI.uploadImage(buffer, url, {
          generateResponsive: true,
          generatePlaceholder: true
        });
        
        results.push(result);
      } catch (error) {
        results.push({ success: false, error: error.message });
      }
    }
    
    return results;
  }
}`;

    await fs.writeFile(
      path.join(examplesDir, 'performance-optimization.ts'),
      performanceExample
    );

    this.log(`✓ Example files created in ${examplesDir}`, 'success');
  }

  displaySetupSummary(cdnConfig) {
    console.log('\n🎉 Image Optimization Setup Complete!');
    console.log('='.repeat(50));
    console.log(`CDN Provider: ${this.provider.toUpperCase()}`);
    console.log(`Environment: ${this.environment}`);
    console.log(`Base URL: ${cdnConfig.baseUrl}`);
    console.log(`Cache TTL: ${cdnConfig.maxAge} seconds`);
    console.log(`WebP Enabled: ${cdnConfig.enableWebP ? 'Yes' : 'No'}`);
    console.log(`AVIF Enabled: ${cdnConfig.enableAVIF ? 'Yes' : 'No'}`);
    console.log('');

    console.log('📁 Generated Files:');
    console.log('  • config/image-optimization.json - Main configuration');
    console.log(`  • config/image-optimization.${this.environment}.json - Environment config`);
    console.log('  • examples/image-optimization/ - Usage examples');
    console.log('');

    console.log('🚀 Next Steps:');
    console.log('  1. Update your environment variables with CDN credentials');
    console.log('  2. Install required dependencies: npm install sharp');
    console.log('  3. Import and use the image API in your application');
    console.log('  4. Test with real images and monitor performance');
    console.log('');

    console.log('📖 Available Scripts:');
    console.log('  • npm run image:optimize - Optimize existing images');
    console.log('  • npm run image:analyze - Analyze image performance');
    console.log('  • npm run image:cleanup - Clean image caches');
    console.log('');

    console.log('🔧 Environment Variables to Set:');
    switch (this.provider) {
      case 'cloudflare':
        console.log('  • CDN_API_KEY - Cloudflare Images API key');
        console.log('  • CLOUDFLARE_ACCOUNT_ID - Your account ID');
        break;
      case 'aws':
        console.log('  • AWS_ACCESS_KEY_ID - AWS access key');
        console.log('  • AWS_SECRET_ACCESS_KEY - AWS secret key');
        console.log('  • AWS_S3_BUCKET - S3 bucket name');
        console.log('  • AWS_CLOUDFRONT_DOMAIN - CloudFront domain');
        break;
      case 'vercel':
        console.log('  • VERCEL_TOKEN - Vercel API token');
        console.log('  • VERCEL_PROJECT_ID - Project ID');
        break;
    }
  }

  showHelp() {
    console.log(`
🖼️ Image Optimization Setup Tool

Usage: node scripts/image-optimization-setup.js [provider] [environment] [options]

Providers:
  cloudflare          Use Cloudflare Images CDN
  aws                 Use AWS S3 + CloudFront
  vercel              Use Vercel Edge Network (default)

Environments:
  development         Development setup (default)
  staging             Staging environment
  production          Production environment

Options:
  --verbose           Show detailed output
  --help              Show this help message

Examples:
  node scripts/image-optimization-setup.js vercel production
  node scripts/image-optimization-setup.js cloudflare staging --verbose
  node scripts/image-optimization-setup.js aws production
`);
  }
}

async function main() {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    new ImageOptimizationSetup().showHelp();
    return;
  }

  console.log('🖼️ Image Optimization Setup Tool');
  console.log('================================\\n');

  const setup = new ImageOptimizationSetup();

  try {
    await setup.setupImageOptimization();
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    if (VERBOSE) {
      console.error(error);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { ImageOptimizationSetup };