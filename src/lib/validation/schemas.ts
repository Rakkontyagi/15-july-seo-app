/**
 * Comprehensive Input Validation Schemas for SEO Automation App
 * Uses Zod for type-safe validation and sanitization
 */

import { z } from 'zod';

// Common validation patterns - made more permissive for practical use
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[\d\s\-\(\)]+$/;
const URL_REGEX = /^https?:\/\/.+/;
const KEYWORD_REGEX = /^[a-zA-Z0-9\s\-_.,!?'"&()]+$/; // More permissive for keywords
const SAFE_TEXT_REGEX = /^[a-zA-Z0-9\s\-_.,!?'"()[\]@#$%^&*+=|\\:;/<>~`\u00C0-\u017F]+$/; // Include unicode characters but exclude {}

// Base schemas for reuse
export const baseSchemas = {
  email: z.string().email('Invalid email format'),
  
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
           'Password must contain uppercase, lowercase, number, and special character'),
  
  url: z.string().url('Invalid URL format').refine(
    (url) => {
      try {
        const urlObj = new URL(url);
        return ['http:', 'https:'].includes(urlObj.protocol) &&
               urlObj.hostname.length > 0 &&
               urlObj.hostname !== '.' &&
               !urlObj.hostname.startsWith('.') &&
               !urlObj.hostname.endsWith('.');
      } catch {
        return false;
      }
    },
    'URL must use http or https protocol and have a valid hostname'
  ),
  
  keyword: z.string()
    .min(1, 'Keyword is required')
    .max(100, 'Keyword must be less than 100 characters')
    .regex(KEYWORD_REGEX, 'Keyword contains invalid characters'),
  
  safeText: z.string()
    .max(1000, 'Text must be less than 1000 characters')
    .regex(SAFE_TEXT_REGEX, 'Text contains potentially unsafe characters'),
  
  positiveInteger: z.number().int().positive('Must be a positive integer'),
  
  uuid: z.string().uuid('Invalid UUID format'),
  
  slug: z.string()
    .min(1, 'Slug is required')
    .max(100, 'Slug must be less than 100 characters')
    .regex(/^[a-z0-9]+([a-z0-9-]*[a-z0-9]+)*$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
};

// Authentication schemas
export const authSchemas = {
  login: z.object({
    email: baseSchemas.email,
    password: z.string().min(1, 'Password is required'),
    rememberMe: z.boolean().optional().default(false)
  }),

  register: z.object({
    email: baseSchemas.email,
    password: baseSchemas.password,
    confirmPassword: z.string(),
    firstName: z.string()
      .min(1, 'First name is required')
      .max(50, 'First name must be less than 50 characters')
      .regex(/^[a-zA-Z\s\-']+$/, 'First name contains invalid characters'),
    lastName: z.string()
      .min(1, 'Last name is required')
      .max(50, 'Last name must be less than 50 characters')
      .regex(/^[a-zA-Z\s\-']+$/, 'Last name contains invalid characters'),
    acceptTerms: z.boolean().refine(val => val === true, 'You must accept the terms and conditions')
  }).refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  }),

  forgotPassword: z.object({
    email: baseSchemas.email
  }),

  resetPassword: z.object({
    token: z.string().min(1, 'Reset token is required'),
    password: baseSchemas.password,
    confirmPassword: z.string()
  }).refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  }),

  changePassword: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: baseSchemas.password,
    confirmPassword: z.string()
  }).refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  })
};

// Content generation schemas
export const contentSchemas = {
  generateContent: z.object({
    keyword: baseSchemas.keyword,
    location: z.string()
      .min(2, 'Location must be at least 2 characters')
      .max(50, 'Location must be less than 50 characters')
      .regex(/^[a-zA-Z\s\-,]+$/, 'Location contains invalid characters'),
    wordCount: z.number()
      .int('Word count must be an integer')
      .min(300, 'Minimum word count is 300')
      .max(5000, 'Maximum word count is 5000')
      .optional()
      .default(1000),
    tone: z.enum(['professional', 'casual', 'technical', 'academic'])
      .optional()
      .default('professional'),
    includeImages: z.boolean().optional().default(false),
    targetAudience: z.string()
      .max(200, 'Target audience description must be less than 200 characters')
      .optional(),
    additionalInstructions: z.string()
      .max(500, 'Additional instructions must be less than 500 characters')
      .optional()
  }),

  updateContent: z.object({
    id: baseSchemas.uuid,
    title: z.string()
      .min(1, 'Title is required')
      .max(200, 'Title must be less than 200 characters'),
    content: z.string()
      .min(10, 'Content must be at least 10 characters')
      .max(50000, 'Content must be less than 50,000 characters'),
    metaDescription: z.string()
      .max(160, 'Meta description must be less than 160 characters')
      .optional(),
    tags: z.array(z.string().max(50, 'Tag must be less than 50 characters'))
      .max(10, 'Maximum 10 tags allowed')
      .optional()
  }),

  contentAnalysis: z.object({
    url: baseSchemas.url,
    includeImages: z.boolean().optional().default(false),
    includeLinks: z.boolean().optional().default(true),
    maxDepth: z.number()
      .int()
      .min(1, 'Minimum depth is 1')
      .max(3, 'Maximum depth is 3')
      .optional()
      .default(1)
  })
};

// User profile schemas
export const userSchemas = {
  updateProfile: z.object({
    firstName: z.string()
      .min(1, 'First name is required')
      .max(50, 'First name must be less than 50 characters')
      .regex(/^[a-zA-Z\s\-']+$/, 'First name contains invalid characters'),
    lastName: z.string()
      .min(1, 'Last name is required')
      .max(50, 'Last name must be less than 50 characters')
      .regex(/^[a-zA-Z\s\-']+$/, 'Last name contains invalid characters'),
    company: z.string()
      .max(100, 'Company name must be less than 100 characters')
      .optional(),
    website: baseSchemas.url.optional(),
    bio: z.string()
      .max(500, 'Bio must be less than 500 characters')
      .optional(),
    timezone: z.string()
      .max(50, 'Timezone must be less than 50 characters')
      .optional(),
    notifications: z.object({
      email: z.boolean().default(true),
      push: z.boolean().default(false),
      marketing: z.boolean().default(false)
    }).optional()
  }),

  updateSettings: z.object({
    theme: z.enum(['light', 'dark', 'system']).default('system'),
    language: z.enum(['en', 'es', 'fr', 'de']).default('en'),
    defaultWordCount: z.number()
      .int()
      .min(300, 'Minimum word count is 300')
      .max(5000, 'Maximum word count is 5000')
      .default(1000),
    defaultTone: z.enum(['professional', 'casual', 'technical', 'academic'])
      .default('professional'),
    autoSave: z.boolean().default(true),
    showTutorials: z.boolean().default(true)
  })
};

// API schemas
export const apiSchemas = {
  pagination: z.object({
    page: z.number().int().min(1, 'Page must be at least 1').default(1),
    limit: z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc')
  }),

  search: z.object({
    query: z.string()
      .min(1, 'Search query is required')
      .max(100, 'Search query must be less than 100 characters'),
    filters: z.record(z.string()).optional(),
    page: z.number().int().min(1).optional(),
    limit: z.number().int().min(1).max(100).optional()
  }),

  bulkOperation: z.object({
    ids: z.array(baseSchemas.uuid)
      .min(1, 'At least one ID is required')
      .max(100, 'Maximum 100 items can be processed at once'),
    operation: z.enum(['delete', 'archive', 'publish', 'unpublish']),
    confirm: z.boolean().refine(val => val === true, 'Operation must be confirmed')
  })
};

// File upload schemas
export const fileSchemas = {
  upload: z.object({
    file: z.instanceof(File, 'File is required'),
    type: z.enum(['image', 'document', 'csv']),
    maxSize: z.number().optional().default(10 * 1024 * 1024), // 10MB
    allowedTypes: z.array(z.string()).optional()
  }).refine(data => {
    if (data.file.size > data.maxSize) {
      return false;
    }
    if (data.allowedTypes && !data.allowedTypes.includes(data.file.type)) {
      return false;
    }
    return true;
  }, 'File validation failed'),

  csvImport: z.object({
    file: z.instanceof(File, 'CSV file is required'),
    hasHeaders: z.boolean().default(true),
    delimiter: z.enum([',', ';', '\t']).default(','),
    encoding: z.enum(['utf-8', 'latin1']).default('utf-8'),
    skipRows: z.number().int().min(0).default(0)
  })
};

// Webhook schemas
export const webhookSchemas = {
  stripe: z.object({
    id: z.string(),
    object: z.string(),
    type: z.string(),
    data: z.record(z.any()),
    created: z.number(),
    livemode: z.boolean()
  }),

  supabase: z.object({
    type: z.enum(['INSERT', 'UPDATE', 'DELETE']),
    table: z.string(),
    record: z.record(z.any()).optional(),
    old_record: z.record(z.any()).optional(),
    schema: z.string().default('public')
  })
};

// Export all schemas
export const validationSchemas = {
  auth: authSchemas,
  content: contentSchemas,
  user: userSchemas,
  api: apiSchemas,
  file: fileSchemas,
  webhook: webhookSchemas,
  base: baseSchemas
};

// Type inference helpers
export type LoginSchema = z.infer<typeof authSchemas.login>;
export type RegisterSchema = z.infer<typeof authSchemas.register>;
export type GenerateContentSchema = z.infer<typeof contentSchemas.generateContent>;
export type UpdateContentSchema = z.infer<typeof contentSchemas.updateContent>;
export type UpdateProfileSchema = z.infer<typeof userSchemas.updateProfile>;
export type PaginationSchema = z.infer<typeof apiSchemas.pagination>;
export type SearchSchema = z.infer<typeof apiSchemas.search>;
export type FileUploadSchema = z.infer<typeof fileSchemas.upload>;

// Validation helper function
export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: z.ZodError } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}
