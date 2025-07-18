/**
 * Input validation and sanitization utilities
 * Provides comprehensive input validation for all API operations
 */

import { z } from 'zod';

/**
 * Common validation schemas
 */
export const commonSchemas = {
  // UUID validation
  uuid: z.string().uuid('Invalid UUID format'),
  
  // Email validation
  email: z.string().email('Invalid email format'),
  
  // Safe string validation (no HTML, XSS prevention)
  safeString: z.string()
    .min(1, 'String cannot be empty')
    .max(1000, 'String too long')
    .refine(
      (value) => !/<[^>]*>/.test(value),
      'HTML tags are not allowed'
    ),
  
  // URL validation
  url: z.string().url('Invalid URL format'),
  
  // Keyword validation
  keyword: z.string()
    .min(1, 'Keyword cannot be empty')
    .max(100, 'Keyword too long')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Keyword contains invalid characters'),
  
  // Country code validation
  countryCode: z.string()
    .length(2, 'Country code must be 2 characters')
    .regex(/^[A-Z]{2}$/, 'Invalid country code format'),
  
  // Language code validation
  languageCode: z.string()
    .min(2, 'Language code must be at least 2 characters')
    .max(5, 'Language code too long')
    .regex(/^[a-z]{2}(-[A-Z]{2})?$/, 'Invalid language code format'),
  
  // Pagination validation
  page: z.coerce.number().int().min(1, 'Page must be a positive integer'),
  limit: z.coerce.number().int().min(1).max(100, 'Limit must be between 1 and 100'),
  
  // Content validation
  content: z.string()
    .min(1, 'Content cannot be empty')
    .max(50000, 'Content too long'),
  
  // Metadata validation
  metadata: z.record(z.any()).optional(),
};

/**
 * User validation schemas
 */
export const userSchemas = {
  // User profile update
  updateProfile: z.object({
    full_name: z.string().min(1).max(100).optional(),
    email: commonSchemas.email.optional(),
  }),
  
  // User registration
  register: z.object({
    email: commonSchemas.email,
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .max(100, 'Password too long')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
    full_name: z.string().min(1).max(100).optional(),
  }),
  
  // User login
  login: z.object({
    email: commonSchemas.email,
    password: z.string().min(1, 'Password is required'),
  }),
};

/**
 * Project validation schemas
 */
export const projectSchemas = {
  // Create project
  create: z.object({
    name: z.string().min(1, 'Project name is required').max(100, 'Project name too long'),
    description: z.string().max(500, 'Description too long').optional(),
    target_keywords: z.array(commonSchemas.keyword).max(50, 'Too many keywords'),
    target_country: commonSchemas.countryCode.default('US'),
    target_language: commonSchemas.languageCode.default('en'),
    domain_url: commonSchemas.url.optional(),
    settings: commonSchemas.metadata.default({}),
  }),
  
  // Update project
  update: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    target_keywords: z.array(commonSchemas.keyword).max(50).optional(),
    target_country: commonSchemas.countryCode.optional(),
    target_language: commonSchemas.languageCode.optional(),
    domain_url: commonSchemas.url.optional(),
    settings: commonSchemas.metadata.optional(),
    is_active: z.boolean().optional(),
  }),
  
  // Get projects
  list: z.object({
    page: commonSchemas.page.default(1),
    limit: commonSchemas.limit.default(10),
    is_active: z.boolean().optional(),
  }),
};

/**
 * Content validation schemas
 */
export const contentSchemas = {
  // Create content
  create: z.object({
    project_id: commonSchemas.uuid,
    title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
    content: commonSchemas.content,
    meta_description: z.string().max(300, 'Meta description too long').optional(),
    keywords: z.array(commonSchemas.keyword).max(100, 'Too many keywords'),
    content_type: z.enum(['article', 'blog', 'product', 'landing']).default('article'),
    status: z.enum(['draft', 'published', 'archived']).default('draft'),
    metadata: commonSchemas.metadata.default({}),
  }),
  
  // Update content
  update: z.object({
    title: z.string().min(1).max(200).optional(),
    content: commonSchemas.content.optional(),
    meta_description: z.string().max(300).optional(),
    keywords: z.array(commonSchemas.keyword).max(100).optional(),
    content_type: z.enum(['article', 'blog', 'product', 'landing']).optional(),
    status: z.enum(['draft', 'published', 'archived']).optional(),
    metadata: commonSchemas.metadata.optional(),
  }),
  
  // Get content
  list: z.object({
    project_id: commonSchemas.uuid.optional(),
    page: commonSchemas.page.default(1),
    limit: commonSchemas.limit.default(10),
    status: z.enum(['draft', 'published', 'archived']).optional(),
    content_type: z.enum(['article', 'blog', 'product', 'landing']).optional(),
  }),
};

/**
 * SERP analysis validation schemas
 */
export const serpSchemas = {
  // Analyze SERP
  analyze: z.object({
    keyword: commonSchemas.keyword,
    country: commonSchemas.countryCode,
    language: commonSchemas.languageCode.default('en'),
    search_engine: z.enum(['google', 'bing', 'yahoo']).default('google'),
  }),
  
  // Get cached SERP
  getCached: z.object({
    keyword: commonSchemas.keyword,
    country: commonSchemas.countryCode,
    language: commonSchemas.languageCode.default('en'),
  }),
};

/**
 * Competitor analysis validation schemas
 */
export const competitorSchemas = {
  // Analyze competitor
  analyze: z.object({
    url: commonSchemas.url,
    keyword: commonSchemas.keyword,
  }),
  
  // Get competitor data
  get: z.object({
    keyword: commonSchemas.keyword,
    page: commonSchemas.page.default(1),
    limit: commonSchemas.limit.default(10),
  }),
};

/**
 * Analytics validation schemas
 */
export const analyticsSchemas = {
  // Log usage
  logUsage: z.object({
    action_type: z.enum(['content_generation', 'serp_analysis', 'competitor_analysis', 'export']),
    resource_id: commonSchemas.uuid.optional(),
    metadata: commonSchemas.metadata.default({}),
    tokens_used: z.number().int().min(0).default(0),
    processing_time_ms: z.number().int().min(0).optional(),
    success: z.boolean().default(true),
    error_message: z.string().max(500).optional(),
  }),
  
  // Get analytics
  getAnalytics: z.object({
    page: commonSchemas.page.default(1),
    limit: commonSchemas.limit.default(100),
    action_type: z.enum(['content_generation', 'serp_analysis', 'competitor_analysis', 'export']).optional(),
    success: z.boolean().optional(),
  }),
};

/**
 * Input sanitization utilities
 */
export const sanitizers = {
  /**
   * Sanitize string by removing HTML tags and trimming
   */
  sanitizeString: (input: string): string => {
    return input
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&[^;]+;/g, '') // Remove HTML entities
      .trim();
  },
  
  /**
   * Sanitize object by recursively sanitizing all string values
   */
  sanitizeObject: (obj: any): any => {
    if (typeof obj === 'string') {
      return sanitizers.sanitizeString(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => sanitizers.sanitizeObject(item));
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizers.sanitizeObject(value);
      }
      return sanitized;
    }
    
    return obj;
  },
  
  /**
   * Sanitize SQL injection attempts
   */
  sanitizeSql: (input: string): string => {
    return input
      .replace(/['";\\]/g, '') // Remove potential SQL injection characters
      .replace(/--/g, '') // Remove SQL comments
      .replace(/\/\*/g, '') // Remove block comments
      .replace(/\*\//g, '');
  },
  
  /**
   * Sanitize for safe URL usage
   */
  sanitizeUrl: (input: string): string => {
    return input
      .replace(/[<>"]/g, '') // Remove dangerous characters
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/data:/gi, '') // Remove data: protocol
      .trim();
  },
};

/**
 * Validation middleware factory
 */
export function createValidator<T>(schema: z.ZodSchema<T>) {
  return {
    validate: (input: unknown): { success: true; data: T } | { success: false; error: string } => {
      try {
        const result = schema.parse(input);
        return { success: true, data: result };
      } catch (error) {
        if (error instanceof z.ZodError) {
          const errorMessage = error.errors
            .map(err => `${err.path.join('.')}: ${err.message}`)
            .join(', ');
          return { success: false, error: errorMessage };
        }
        return { success: false, error: 'Validation failed' };
      }
    },
    
    validateAsync: async (input: unknown): Promise<{ success: true; data: T } | { success: false; error: string }> => {
      try {
        const result = await schema.parseAsync(input);
        return { success: true, data: result };
      } catch (error) {
        if (error instanceof z.ZodError) {
          const errorMessage = error.errors
            .map(err => `${err.path.join('.')}: ${err.message}`)
            .join(', ');
          return { success: false, error: errorMessage };
        }
        return { success: false, error: 'Validation failed' };
      }
    },
  };
}

/**
 * Pre-built validators
 */
export const validators = {
  user: {
    updateProfile: createValidator(userSchemas.updateProfile),
    register: createValidator(userSchemas.register),
    login: createValidator(userSchemas.login),
  },
  
  project: {
    create: createValidator(projectSchemas.create),
    update: createValidator(projectSchemas.update),
    list: createValidator(projectSchemas.list),
  },
  
  content: {
    create: createValidator(contentSchemas.create),
    update: createValidator(contentSchemas.update),
    list: createValidator(contentSchemas.list),
  },
  
  serp: {
    analyze: createValidator(serpSchemas.analyze),
    getCached: createValidator(serpSchemas.getCached),
  },
  
  competitor: {
    analyze: createValidator(competitorSchemas.analyze),
    get: createValidator(competitorSchemas.get),
  },
  
  analytics: {
    logUsage: createValidator(analyticsSchemas.logUsage),
    getAnalytics: createValidator(analyticsSchemas.getAnalytics),
  },
};