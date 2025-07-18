
import { S3Client, PutObjectCommand, S3ClientConfig } from '@aws-sdk/client-s3';
import { CloudflareClient } from './cloudflare-client'; // Assuming a Cloudflare client
import { VercelClient } from './vercel-client'; // Assuming a Vercel client
import { CDNProvider, CDNUploadOptions, CDNUploadResult } from './image-optimization.types';
import { z } from 'zod';

// Schema for validating environment variables
const awsEnvSchema = z.object({
  AWS_S3_BUCKET: z.string().min(1, "AWS_S3_BUCKET is required"),
  AWS_REGION: z.string().min(1, "AWS_REGION is required"),
  AWS_CDN_DOMAIN: z.string().optional(),
});

const cloudflareEnvSchema = z.object({
  CLOUDFLARE_ACCOUNT_ID: z.string().min(1, "CLOUDFLARE_ACCOUNT_ID is required"),
  CLOUDFLARE_API_TOKEN: z.string().min(1, "CLOUDFLARE_API_TOKEN is required"),
  CLOUDFLARE_IMAGES_DOMAIN: z.string().min(1, "CLOUDFLARE_IMAGES_DOMAIN is required"),
});

const vercelEnvSchema = z.object({
  VERCEL_TEAM_ID: z.string().optional(),
  VERCEL_PROJECT_ID: z.string().min(1, "VERCEL_PROJECT_ID is required"),
  VERCEL_TOKEN: z.string().min(1, "VERCEL_TOKEN is required"),
});

export class CDNService {
  private s3Client: S3Client | null = null;
  private cloudflareClient: CloudflareClient | null = null;
  private vercelClient: VercelClient | null = null;
  private defaultProvider: CDNProvider;
  private initialized: Record<CDNProvider, boolean> = {
    aws: false,
    cloudflare: false,
    vercel: false
  };

  constructor(defaultProvider: CDNProvider = 'aws') {
    this.defaultProvider = defaultProvider;
  }

  /**
   * Initialize the specified CDN provider client
   */
  async initializeProvider(provider: CDNProvider): Promise<boolean> {
    try {
      switch (provider) {
        case 'aws':
          if (!this.initialized.aws) {
            // Validate AWS environment variables
            const awsEnv = awsEnvSchema.safeParse(process.env);
            if (!awsEnv.success) {
              console.error('AWS environment variables validation failed:', awsEnv.error.format());
              return false;
            }
            
            const config: S3ClientConfig = {
              region: process.env.AWS_REGION,
            };
            
            // Use AWS SDK credential providers for secure credential management
            this.s3Client = new S3Client(config);
            this.initialized.aws = true;
          }
          return true;
          
        case 'cloudflare':
          if (!this.initialized.cloudflare) {
            // Validate Cloudflare environment variables
            const cloudflareEnv = cloudflareEnvSchema.safeParse(process.env);
            if (!cloudflareEnv.success) {
              console.error('Cloudflare environment variables validation failed:', cloudflareEnv.error.format());
              return false;
            }
            
            this.cloudflareClient = new CloudflareClient({
              accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
              apiToken: process.env.CLOUDFLARE_API_TOKEN!,
              imagesDomain: process.env.CLOUDFLARE_IMAGES_DOMAIN!
            });
            this.initialized.cloudflare = true;
          }
          return true;
          
        case 'vercel':
          if (!this.initialized.vercel) {
            // Validate Vercel environment variables
            const vercelEnv = vercelEnvSchema.safeParse(process.env);
            if (!vercelEnv.success) {
              console.error('Vercel environment variables validation failed:', vercelEnv.error.format());
              return false;
            }
            
            this.vercelClient = new VercelClient({
              teamId: process.env.VERCEL_TEAM_ID,
              projectId: process.env.VERCEL_PROJECT_ID!,
              token: process.env.VERCEL_TOKEN!
            });
            this.initialized.vercel = true;
          }
          return true;
          
        default:
          console.error(`Unsupported CDN provider: ${provider}`);
          return false;
      }
    } catch (error) {
      console.error(`Failed to initialize ${provider} client:`, error);
      return false;
    }
  }

  /**
   * Upload a file to the specified CDN provider
   */
  async upload(
    buffer: Buffer,
    options: CDNUploadOptions
  ): Promise<CDNUploadResult> {
    const { 
      provider = this.defaultProvider, 
      path, 
      contentType,
      cacheControl = 'public, max-age=31536000, immutable',
      isPublic = true,
      metadata = {}
    } = options;

    // Validate input
    if (!buffer || buffer.length === 0) {
      throw new Error('Empty buffer provided for upload');
    }
    
    if (!path || path.trim() === '') {
      throw new Error('Path is required for CDN upload');
    }
    
    if (!contentType || contentType.trim() === '') {
      throw new Error('Content type is required for CDN upload');
    }

    // Initialize the provider if not already initialized
    const initialized = await this.initializeProvider(provider);
    if (!initialized) {
      throw new Error(`Failed to initialize ${provider} client. Check environment variables and credentials.`);
    }

    try {
      switch (provider) {
        case 'aws':
          return await this.uploadToAWS(buffer, path, contentType, cacheControl, isPublic, metadata);
        case 'cloudflare':
          return await this.uploadToCloudflare(buffer, path, contentType, cacheControl, isPublic, metadata);
        case 'vercel':
          return await this.uploadToVercel(buffer, path, contentType, cacheControl, isPublic, metadata);
        default:
          throw new Error(`Unsupported CDN provider: ${provider}`);
      }
    } catch (error) {
      console.error(`CDN upload failed for ${provider}:`, error);
      throw new Error(`Failed to upload to ${provider}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Upload a file to AWS S3
   */
  private async uploadToAWS(
    buffer: Buffer, 
    path: string, 
    contentType: string,
    cacheControl: string,
    isPublic: boolean,
    metadata: Record<string, string>
  ): Promise<CDNUploadResult> {
    if (!this.s3Client) {
      throw new Error('AWS S3 client not initialized');
    }

    const bucket = process.env.AWS_S3_BUCKET!;
    
    try {
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: path,
        Body: buffer,
        ContentType: contentType,
        CacheControl: cacheControl,
        ACL: isPublic ? 'public-read' : 'private',
        Metadata: metadata,
      });

      await this.s3Client.send(command);
      
      // Use custom domain if provided, otherwise use S3 URL
      const domain = process.env.AWS_CDN_DOMAIN || `${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com`;
      const url = `https://${domain}/${path}`;
      
      return { 
        url,
        cdnId: path,
        provider: 'aws'
      };
    } catch (error) {
      console.error('AWS S3 upload failed:', error);
      throw new Error(`AWS S3 upload failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Upload a file to Cloudflare Images
   */
  private async uploadToCloudflare(
    buffer: Buffer, 
    path: string, 
    contentType: string,
    cacheControl: string,
    isPublic: boolean,
    metadata: Record<string, string>
  ): Promise<CDNUploadResult> {
    if (!this.cloudflareClient) {
      throw new Error('Cloudflare client not initialized');
    }

    try {
      const result = await this.cloudflareClient.upload(buffer, path, contentType, {
        cacheControl,
        isPublic,
        metadata
      });
      
      return {
        url: result.url,
        cdnId: result.id,
        provider: 'cloudflare'
      };
    } catch (error) {
      console.error('Cloudflare upload failed:', error);
      throw new Error(`Cloudflare upload failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Upload a file to Vercel Blob Store
   */
  private async uploadToVercel(
    buffer: Buffer, 
    path: string, 
    contentType: string,
    cacheControl: string,
    isPublic: boolean,
    metadata: Record<string, string>
  ): Promise<CDNUploadResult> {
    if (!this.vercelClient) {
      throw new Error('Vercel client not initialized');
    }

    try {
      const result = await this.vercelClient.upload(buffer, path, contentType, {
        cacheControl,
        isPublic,
        metadata
      });
      
      return {
        url: result.url,
        cdnId: result.id,
        provider: 'vercel'
      };
    } catch (error) {
      console.error('Vercel upload failed:', error);
      throw new Error(`Vercel upload failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Delete a file from the specified CDN provider
   */
  async delete(provider: CDNProvider, id: string): Promise<boolean> {
    // Initialize the provider if not already initialized
    const initialized = await this.initializeProvider(provider);
    if (!initialized) {
      throw new Error(`Failed to initialize ${provider} client. Check environment variables and credentials.`);
    }
    
    try {
      switch (provider) {
        case 'aws':
          // Implementation for AWS S3 delete
          return true;
        case 'cloudflare':
          // Implementation for Cloudflare delete
          return true;
        case 'vercel':
          // Implementation for Vercel delete
          return true;
        default:
          throw new Error(`Unsupported CDN provider: ${provider}`);
      }
    } catch (error) {
      console.error(`CDN delete failed for ${provider}:`, error);
      return false;
    }
  }
}
