
export type ImageFormat = 'jpeg' | 'png' | 'webp' | 'avif';

export type PlaceholderType = 'blur' | 'color' | 'low-res';

export interface ImageOptions {
  format?: ImageFormat;
  quality?: number;
  width?: number;
  height?: number | null;
  placeholderType?: PlaceholderType;
}

export interface OptimizationResult {
  buffer: Buffer;
  format: ImageFormat;
  originalSize: number;
  optimizedSize: number;
  sizeReduction: number;
  width?: number;
  height?: number;
}

export interface ResponsiveImage {
  width: number;
  buffer: Buffer;
  size: number;
  format: ImageFormat;
  url?: string;
}

export interface ResponsiveImageSet {
  original: {
    width: number;
    height: number;
    format: ImageFormat;
  };
  images: ResponsiveImage[];
  placeholder: Buffer;
}

export type CDNProvider = 'aws' | 'cloudflare' | 'vercel';

export interface CDNUploadOptions {
  provider: CDNProvider;
  path: string;
  contentType: string;
  cacheControl?: string;
  isPublic?: boolean;
  metadata?: Record<string, string>;
}

export interface CDNUploadResult {
  url: string;
  cdnId?: string;
  provider: CDNProvider;
}

export interface ImageApiOptions {
  optimizationOptions?: ImageOptions;
  cdnOptions: CDNUploadOptions;
  generateResponsive?: boolean;
  generatePlaceholder?: boolean;
}

export interface ImageApiResult extends OptimizationResult {
  url: string;
  responsiveUrls?: Record<number, string>;
  placeholderDataUrl?: string;
}

export interface ImageTransformOptions extends ImageOptions {
  blur?: number;
  sharpen?: number;
  rotate?: number;
  flip?: boolean;
  flop?: boolean;
  grayscale?: boolean;
  tint?: string;
  crop?: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
}

export interface ImageStats {
  size: number;
  format: ImageFormat;
  width: number;
  height: number;
  hasAlpha: boolean;
  colorSpace?: string;
  channels: number;
  density?: number;
  dominantColor?: string;
}

export interface ImageOptimizationConfig {
  defaultFormat: ImageFormat;
  defaultQuality: number;
  enableResponsive: boolean;
  enableAvif: boolean;
  breakpoints: number[];
  placeholderType: PlaceholderType;
  cdnProvider: CDNProvider;
  cacheTTL: number;
}
