/**
 * Input Sanitization Utilities for SEO Automation App
 * Provides XSS prevention, SQL injection protection, and general input cleaning
 */

import DOMPurify from 'isomorphic-dompurify';
import { logger } from '../logging/logger';

export interface SanitizationOptions {
  allowHtml?: boolean;
  allowedTags?: string[];
  allowedAttributes?: string[];
  maxLength?: number;
  trimWhitespace?: boolean;
  removeEmptyLines?: boolean;
  preserveLineBreaks?: boolean;
}

const DEFAULT_ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 'i', 'b',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'a', 'blockquote', 'code', 'pre'
];

const DEFAULT_ALLOWED_ATTRIBUTES = [
  'href', 'target', 'rel', 'title', 'alt', 'class'
];

export class InputSanitizer {
  /**
   * Sanitize HTML content to prevent XSS attacks
   */
  public static sanitizeHtml(
    input: string, 
    options: SanitizationOptions = {}
  ): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    const {
      allowedTags = DEFAULT_ALLOWED_TAGS,
      allowedAttributes = DEFAULT_ALLOWED_ATTRIBUTES,
      maxLength,
      trimWhitespace = true
    } = options;

    try {
      // Configure DOMPurify with balanced security and usability
      const config = {
        ALLOWED_TAGS: allowedTags,
        ALLOWED_ATTR: allowedAttributes,
        KEEP_CONTENT: true, // Keep content of forbidden tags but remove the tags
        RETURN_DOM: false,
        RETURN_DOM_FRAGMENT: false,
        RETURN_DOM_IMPORT: false,
        SANITIZE_DOM: true,
        WHOLE_DOCUMENT: false,
        // Remove dangerous tags and event handlers
        FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'iframe', 'frame', 'frameset', 'noframes'],
        FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onsubmit', 'onchange', 'onkeydown', 'onkeyup', 'onkeypress'],
        // Don't force body wrapper for inline content
        FORCE_BODY: false
      };

      let sanitized = DOMPurify.sanitize(input, config);

      // Additional cleaning
      if (trimWhitespace) {
        sanitized = sanitized.trim();
      }

      if (maxLength && sanitized.length > maxLength) {
        sanitized = sanitized.substring(0, maxLength);
        logger.warn('Input truncated due to length limit', { 
          originalLength: input.length, 
          maxLength 
        });
      }

      return sanitized;
    } catch (error) {
      logger.error('HTML sanitization failed', { error, input: input.substring(0, 100) });
      return '';
    }
  }

  /**
   * Sanitize plain text input
   */
  public static sanitizeText(
    input: string, 
    options: SanitizationOptions = {}
  ): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    const {
      maxLength,
      trimWhitespace = true,
      removeEmptyLines = false,
      preserveLineBreaks = true
    } = options;

    try {
      let sanitized = input;

      // Remove potential XSS patterns
      sanitized = sanitized
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/vbscript:/gi, '')
        .replace(/on\w+\s*=/gi, '');

      // Remove HTML tags if not allowed
      if (!options.allowHtml) {
        sanitized = sanitized.replace(/<[^>]*>/g, '');
      }

      // Handle line breaks
      if (!preserveLineBreaks) {
        sanitized = sanitized.replace(/\r?\n/g, ' ');
      }

      if (removeEmptyLines) {
        sanitized = sanitized.replace(/^\s*[\r\n]/gm, '');
      }

      // Normalize whitespace
      if (trimWhitespace) {
        sanitized = sanitized.trim();
        sanitized = sanitized.replace(/\s+/g, ' ');
      }

      // Truncate if necessary
      if (maxLength && sanitized.length > maxLength) {
        sanitized = sanitized.substring(0, maxLength);
      }

      return sanitized;
    } catch (error) {
      logger.error('Text sanitization failed', { error, input: input.substring(0, 100) });
      return '';
    }
  }

  /**
   * Sanitize email address
   */
  public static sanitizeEmail(email: string): string {
    if (!email || typeof email !== 'string') {
      return '';
    }

    return email
      .toLowerCase()
      .trim()
      .replace(/[^\w@.-]/g, '');
  }

  /**
   * Sanitize URL
   */
  public static sanitizeUrl(url: string): string {
    if (!url || typeof url !== 'string') {
      return '';
    }

    try {
      // Remove dangerous protocols
      const sanitized = url
        .trim()
        .replace(/^javascript:/i, '')
        .replace(/^vbscript:/i, '')
        .replace(/^data:/i, '')
        .replace(/^file:/i, '');

      // Validate URL format
      const urlObj = new URL(sanitized);
      
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        logger.warn('Blocked URL with unsafe protocol', { url: sanitized, protocol: urlObj.protocol });
        return '';
      }

      return urlObj.toString();
    } catch (error) {
      logger.warn('Invalid URL provided for sanitization', { url, error });
      return '';
    }
  }

  /**
   * Sanitize filename for safe storage
   */
  public static sanitizeFilename(filename: string): string {
    if (!filename || typeof filename !== 'string') {
      return '';
    }

    // Split filename and extension
    const lastDotIndex = filename.lastIndexOf('.');
    let name = filename;
    let extension = '';

    if (lastDotIndex > 0) {
      name = filename.substring(0, lastDotIndex);
      extension = filename.substring(lastDotIndex);
    }

    // Sanitize name part
    const sanitizedName = name
      .trim()
      .replace(/[^a-zA-Z0-9-]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_+|_+$/g, '');

    // Sanitize extension
    const sanitizedExtension = extension
      .replace(/[^a-zA-Z0-9.]/g, '');

    const result = sanitizedName + sanitizedExtension;
    return result.substring(0, 255);
  }

  /**
   * Sanitize SQL input to prevent injection
   */
  public static sanitizeSqlInput(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    // Remove common SQL injection patterns
    return input
      .replace(/['";\\]/g, '')
      .replace(/--/g, '')
      .replace(/\/\*/g, '')
      .replace(/\*\//g, '')
      .replace(/\bUNION\b/gi, '')
      .replace(/\bSELECT\b/gi, '')
      .replace(/\bFROM\b/gi, '')
      .replace(/\bWHERE\b/gi, '')
      .replace(/\bINSERT\b/gi, '')
      .replace(/\bUPDATE\b/gi, '')
      .replace(/\bDELETE\b/gi, '')
      .replace(/\bDROP\b/gi, '')
      .replace(/\bCREATE\b/gi, '')
      .replace(/\bALTER\b/gi, '')
      .replace(/\bEXEC\b/gi, '')
      .replace(/\bEXECUTE\b/gi, '')
      .trim();
  }

  /**
   * Sanitize search query
   */
  public static sanitizeSearchQuery(query: string): string {
    if (!query || typeof query !== 'string') {
      return '';
    }

    return query
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/[<>]/g, '')
      .replace(/['"]/g, '')
      .replace(/\s+/g, ' ')
      .substring(0, 100);
  }

  /**
   * Sanitize phone number
   */
  public static sanitizePhoneNumber(phone: string): string {
    if (!phone || typeof phone !== 'string') {
      return '';
    }

    return phone
      .replace(/[^\d+\-\s\(\)]/g, '')
      .trim();
  }

  /**
   * Sanitize object recursively with circular reference detection
   */
  public static sanitizeObject(
    obj: Record<string, any>,
    options: SanitizationOptions = {},
    visited: WeakSet<object> = new WeakSet()
  ): Record<string, any> {
    if (!obj || typeof obj !== 'object') {
      return {};
    }

    // Check for circular references
    if (visited.has(obj)) {
      logger.warn('Circular reference detected in object sanitization');
      return {};
    }

    visited.add(obj);
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
      // Sanitize key
      const sanitizedKey = this.sanitizeText(key, { maxLength: 100 });

      if (!sanitizedKey) {
        continue;
      }

      // Sanitize value based on type
      if (typeof value === 'string') {
        sanitized[sanitizedKey] = this.sanitizeText(value, options);
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        sanitized[sanitizedKey] = value;
      } else if (Array.isArray(value)) {
        sanitized[sanitizedKey] = value
          .filter(item => item != null)
          .map(item => typeof item === 'string' ? this.sanitizeText(item, options) : item);
      } else if (value && typeof value === 'object') {
        sanitized[sanitizedKey] = this.sanitizeObject(value, options, visited);
      }
    }

    visited.delete(obj);
    return sanitized;
  }

  /**
   * Sanitize array of strings
   */
  public static sanitizeArray(
    arr: string[], 
    options: SanitizationOptions = {}
  ): string[] {
    if (!Array.isArray(arr)) {
      return [];
    }

    return arr
      .filter(item => typeof item === 'string' && item.trim().length > 0)
      .map(item => this.sanitizeText(item, options))
      .filter(item => item.length > 0);
  }

  /**
   * Validate and sanitize JSON input
   */
  public static sanitizeJson(input: string): any {
    if (!input || typeof input !== 'string') {
      return null;
    }

    try {
      // Remove potential XSS in JSON strings
      const sanitized = input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/vbscript:/gi, '');

      return JSON.parse(sanitized);
    } catch (error) {
      logger.warn('Invalid JSON provided for sanitization', { input: input.substring(0, 100), error });
      return null;
    }
  }

  /**
   * Comprehensive sanitization for user input
   */
  public static sanitizeUserInput(
    input: any, 
    type: 'text' | 'html' | 'email' | 'url' | 'filename' | 'search' | 'phone' = 'text',
    options: SanitizationOptions = {}
  ): string {
    if (input == null) {
      return '';
    }

    const stringInput = String(input);

    switch (type) {
      case 'html':
        return this.sanitizeHtml(stringInput, options);
      case 'email':
        return this.sanitizeEmail(stringInput);
      case 'url':
        return this.sanitizeUrl(stringInput);
      case 'filename':
        return this.sanitizeFilename(stringInput);
      case 'search':
        return this.sanitizeSearchQuery(stringInput);
      case 'phone':
        return this.sanitizePhoneNumber(stringInput);
      case 'text':
      default:
        return this.sanitizeText(stringInput, options);
    }
  }
}

// Export convenience functions
export const sanitizeHtml = InputSanitizer.sanitizeHtml;
export const sanitizeText = InputSanitizer.sanitizeText;
export const sanitizeEmail = InputSanitizer.sanitizeEmail;
export const sanitizeUrl = InputSanitizer.sanitizeUrl;
export const sanitizeFilename = InputSanitizer.sanitizeFilename;
export const sanitizeSearchQuery = InputSanitizer.sanitizeSearchQuery;
export const sanitizeObject = InputSanitizer.sanitizeObject;
export const sanitizeArray = InputSanitizer.sanitizeArray;
export const sanitizeUserInput = InputSanitizer.sanitizeUserInput;
