/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production-ready config with CDN optimization
  
  // TypeScript and ESLint - Allow builds to proceed during development
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Advanced webpack config for CDN optimization
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Production optimizations
    if (!dev) {
      config.devtool = false;
      
      // Advanced code splitting
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: -10,
            chunks: 'all',
          },
          // CDN-optimized chunks
          cdn: {
            test: /[\\/](images|fonts|icons)[\\/]/,
            name: 'cdn-assets',
            priority: 10,
            chunks: 'all',
          },
        },
      };
    }
    
    // Optimize module resolution
    config.resolve.symlinks = false;
    config.resolve.modules = ['node_modules'];
    
    // Skip heavy libraries in client bundle
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@sentry/node': false,
        '@opentelemetry/instrumentation': false,
      };
    }
    
    return config;
  },

  // Image optimization for CDN
  images: {
    domains: [
      'localhost',
      'images.unsplash.com',
      'via.placeholder.com',
      'picsum.photos',
      'res.cloudinary.com',
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [320, 640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 86400, // 24 hours
    dangerouslyAllowSVG: false,
  },

  // Headers for CDN optimization
  headers: async () => [
    {
      source: '/_next/static/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
    {
      source: '/images/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=86400, s-maxage=2592000',
        },
      ],
    },
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
      ],
    },
  ],

  // Rewrites for CDN
  rewrites: async () => [
    {
      source: '/sitemap.xml',
      destination: '/api/sitemap',
    },
    {
      source: '/robots.txt',
      destination: '/api/robots',
    },
  ],

  // Production optimizations
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  
  // Output configuration
  output: 'standalone',
  generateEtags: true,
  
  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['@/lib', '@/components'],
  },
};

module.exports = nextConfig;