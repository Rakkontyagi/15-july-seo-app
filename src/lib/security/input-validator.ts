/**
 * Input Validation and Sanitization Module
 * Comprehensive input validation for all user inputs
 */

import DOMPurify from 'isomorphic-dompurify';
import { z } from 'zod';

// Common validation patterns
const patterns = {
  // Safe alphanumeric with common punctuation
  safeText: /^[\w\s\-,.!?'"()[\]{}:;/@#$%&*+=]*$/,
  
  // URL validation
  url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  
  // Email validation
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  
  // Phone validation (international)
  phone: /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{4,6}$/,
  
  // No SQL injection patterns
  noSqlInjection: /^(?!.*(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b|--|\/\*|\*\/|xp_|sp_)).*$/i,
  
  // No script injection
  noScriptInjection: /^(?!.*(<script|<iframe|javascript:|on\w+\s*=)).*$/i,
  
  // Alphanumeric with dashes and underscores (for IDs, slugs)
  slug: /^[a-zA-Z0-9-_]+$/,
  
  // Numbers only
  numeric: /^\d+$/,
  
  // Decimal numbers
  decimal: /^\d+(\.\d{1,2})?$/,
};

// Validation schemas
export const schemas = {
  // User input schemas
  userRegistration: z.object({
    email: z.string().email().max(255),
    password: z.string().min(8).max(128)
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    name: z.string().min(2).max(100).regex(patterns.safeText),
    company: z.string().max(100).regex(patterns.safeText).optional(),
  }),

  userLogin: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),

  // SEO content schemas
  keywordAnalysis: z.object({
    keyword: z.string()
      .min(1, 'Keyword is required')
      .max(200, 'Keyword too long')
      .regex(patterns.safeText, 'Invalid characters in keyword')
      .regex(patterns.noSqlInjection, 'Invalid keyword')
      .regex(patterns.noScriptInjection, 'Invalid keyword'),
    country: z.string().length(2).regex(/^[A-Z]{2}$/),
    language: z.string().regex(/^[a-z]{2}(-[A-Z]{2})?$/),
    location: z.string().max(100).regex(patterns.safeText).optional(),
  }),

  contentGeneration: z.object({
    title: z.string()
      .min(10, 'Title too short')
      .max(100, 'Title too long')
      .regex(patterns.safeText)
      .regex(patterns.noSqlInjection)
      .regex(patterns.noScriptInjection),
    description: z.string()
      .min(50, 'Description too short')
      .max(300, 'Description too long'),
    keywords: z.array(z.string().regex(patterns.safeText)).max(50),
    targetWordCount: z.number().min(300).max(10000),
    tone: z.enum(['professional', 'casual', 'academic', 'conversational', 'technical']),
    targetAudience: z.string().max(200).regex(patterns.safeText),
  }),

  // API request schemas
  apiRequest: z.object({
    endpoint: z.string().regex(/^\/api\/[\w\-\/]+$/),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
    headers: z.record(z.string(), z.string()).optional(),
    body: z.any().optional(),
  }),

  // CMS integration schemas
  cmsCredentials: z.object({
    platform: z.enum(['wordpress', 'shopify', 'hubspot', 'webflow', 'contentful']),
    apiUrl: z.string().url(),
    apiKey: z.string().min(10).max(500),
    apiSecret: z.string().min(10).max(500).optional(),
  }),

  // Project schemas
  projectCreate: z.object({
    name: z.string()
      .min(3, 'Project name too short')
      .max(100, 'Project name too long')
      .regex(patterns.safeText),
    description: z.string().max(500).optional(),
    website: z.string().url().optional(),
    targetKeywords: z.array(z.string().regex(patterns.safeText)).max(100),
    competitors: z.array(z.string().url()).max(20),
  }),

  // Settings schemas
  userSettings: z.object({
    displayName: z.string().max(100).regex(patterns.safeText),
    timezone: z.string().regex(/^[A-Za-z_]+\/[A-Za-z_]+$/),
    language: z.string().regex(/^[a-z]{2}(-[A-Z]{2})?$/),
    emailNotifications: z.boolean(),
    apiWebhook: z.string().url().optional(),
  }),

  // Search and filter schemas
  searchQuery: z.object({
    q: z.string()
      .max(200)
      .regex(patterns.safeText)
      .regex(patterns.noSqlInjection)
      .regex(patterns.noScriptInjection),
    page: z.number().int().min(1).max(1000).default(1),
    limit: z.number().int().min(1).max(100).default(20),
    sort: z.enum(['date', 'relevance', 'title', 'score']).default('relevance'),
    order: z.enum(['asc', 'desc']).default('desc'),
  }),

  // File upload schemas
  fileUpload: z.object({
    filename: z.string()
      .max(255)
      .regex(/^[\w\-. ]+$/)
      .regex(/\.(jpg|jpeg|png|gif|webp|pdf|doc|docx|txt|csv)$/i),
    mimetype: z.enum([
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/csv',
    ]),
    size: z.number().max(10 * 1024 * 1024), // 10MB max
  }),
};

/**
 * Input sanitization functions
 */
export const sanitize = {
  /**
   * Sanitize HTML content
   */
  html: (input: string): string => {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre'],
      ALLOWED_ATTR: ['href', 'target', 'rel'],
      ALLOW_DATA_ATTR: false,
    });
  },

  /**
   * Sanitize plain text
   */
  text: (input: string): string => {
    return input
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  },

  /**
   * Sanitize for SQL
   */
  sql: (input: string): string => {
    return input
      .replace(/['";\\]/g, '') // Remove quotes and backslashes
      .replace(/--/g, '') // Remove SQL comments
      .replace(/\/\*/g, '') // Remove multi-line comments
      .replace(/\*\//g, '')
      .replace(/\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b/gi, '') // Remove SQL keywords
      .trim();
  },

  /**
   * Sanitize filename
   */
  filename: (input: string): string => {
    return input
      .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace invalid chars with underscore
      .replace(/\.{2,}/g, '.') // Remove multiple dots
      .replace(/^\./, '') // Remove leading dot
      .slice(0, 255); // Limit length
  },

  /**
   * Sanitize URL
   */
  url: (input: string): string => {
    try {
      const url = new URL(input);
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('Invalid protocol');
      }
      return url.toString();
    } catch {
      return '';
    }
  },

  /**
   * Sanitize JSON
   */
  json: (input: any): any => {
    try {
      // Convert to string and parse to remove any functions or undefined values
      return JSON.parse(JSON.stringify(input));
    } catch {
      return null;
    }
  },
};

/**
 * Validation helpers
 */
export const validate = {
  /**
   * Validate against a schema
   */
  schema: <T>(schema: z.ZodSchema<T>, data: unknown): { success: boolean; data?: T; errors?: z.ZodError } => {
    try {
      const validated = schema.parse(data);
      return { success: true, data: validated };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { success: false, errors: error };
      }
      throw error;
    }
  },

  /**
   * Check if input contains SQL injection patterns
   */
  noSqlInjection: (input: string): boolean => {
    return patterns.noSqlInjection.test(input);
  },

  /**
   * Check if input contains script injection patterns
   */
  noScriptInjection: (input: string): boolean => {
    return patterns.noScriptInjection.test(input);
  },

  /**
   * Validate email format
   */
  email: (input: string): boolean => {
    return patterns.email.test(input);
  },

  /**
   * Validate URL format
   */
  url: (input: string): boolean => {
    return patterns.url.test(input);
  },

  /**
   * Validate phone number
   */
  phone: (input: string): boolean => {
    return patterns.phone.test(input);
  },

  /**
   * Check password strength
   */
  passwordStrength: (password: string): {
    score: number;
    feedback: string[];
  } => {
    let score = 0;
    const feedback: string[] = [];

    if (password.length >= 8) score++;
    else feedback.push('Password should be at least 8 characters');

    if (password.length >= 12) score++;
    
    if (/[a-z]/.test(password)) score++;
    else feedback.push('Add lowercase letters');

    if (/[A-Z]/.test(password)) score++;
    else feedback.push('Add uppercase letters');

    if (/[0-9]/.test(password)) score++;
    else feedback.push('Add numbers');

    if (/[^A-Za-z0-9]/.test(password)) score++;
    else feedback.push('Add special characters');

    // Check for common patterns
    if (!/(.)\1{2,}/.test(password)) score++; // No repeated characters
    if (!/^(?:abc|123|password|qwerty)/i.test(password)) score++; // No common patterns

    return {
      score: Math.min(score, 5), // Max score of 5
      feedback,
    };
  },
};

/**
 * Input validation middleware
 */
export function validateInput<T>(schema: z.ZodSchema<T>) {
  return (data: unknown): T => {
    const result = validate.schema(schema, data);
    if (!result.success) {
      throw new ValidationError('Validation failed', result.errors);
    }
    return result.data!;
  };
}

/**
 * Custom validation error
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public errors?: z.ZodError
  ) {
    super(message);
    this.name = 'ValidationError';
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      errors: this.errors?.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      })),
    };
  }
}

/**
 * Rate limiting for input validation
 */
const validationAttempts = new Map<string, { count: number; resetTime: number }>();

export function checkValidationRateLimit(identifier: string, maxAttempts: number = 10): boolean {
  const now = Date.now();
  const attempt = validationAttempts.get(identifier);

  if (!attempt || now > attempt.resetTime) {
    validationAttempts.set(identifier, {
      count: 1,
      resetTime: now + 60 * 1000, // 1 minute window
    });
    return true;
  }

  if (attempt.count >= maxAttempts) {
    return false;
  }

  attempt.count++;
  return true;
}

// Cleanup old validation attempts periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of validationAttempts.entries()) {
    if (now > value.resetTime) {
      validationAttempts.delete(key);
    }
  }
}, 5 * 60 * 1000); // Every 5 minutes