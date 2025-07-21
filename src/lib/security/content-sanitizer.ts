import DOMPurify from 'dompurify';

/**
 * Configuration for different sanitization levels
 */
export interface SanitizationConfig {
  allowedTags?: string[];
  allowedAttributes?: { [key: string]: string[] };
  allowedSchemes?: string[];
  stripIgnoreTag?: boolean;
  stripIgnoreTagBody?: string[];
}

/**
 * Predefined sanitization configurations
 */
export const SANITIZATION_CONFIGS = {
  // Strict: Only basic formatting, no links or media
  STRICT: {
    allowedTags: [
      'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'code', 'pre'
    ],
    allowedAttributes: {
      '*': ['class']
    },
    allowedSchemes: [],
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style']
  } as SanitizationConfig,

  // Standard: Basic formatting + safe links
  STANDARD: {
    allowedTags: [
      'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img'
    ],
    allowedAttributes: {
      '*': ['class'],
      'a': ['href', 'title', 'target', 'rel'],
      'img': ['src', 'alt', 'title', 'width', 'height']
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style']
  } as SanitizationConfig,

  // Rich: Full rich text editing capabilities
  RICH: {
    allowedTags: [
      'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'sub', 'sup',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'code', 'pre',
      'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'div', 'span', 'hr'
    ],
    allowedAttributes: {
      '*': ['class', 'style'],
      'a': ['href', 'title', 'target', 'rel'],
      'img': ['src', 'alt', 'title', 'width', 'height'],
      'table': ['border', 'cellpadding', 'cellspacing'],
      'th': ['colspan', 'rowspan'],
      'td': ['colspan', 'rowspan']
    },
    allowedSchemes: ['http', 'https', 'mailto', 'data'],
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style']
  } as SanitizationConfig
};

/**
 * Content sanitizer class for XSS protection
 */
export class ContentSanitizer {
  private static instance: ContentSanitizer;
  private purify: typeof DOMPurify;

  private constructor() {
    // Initialize DOMPurify
    if (typeof window !== 'undefined') {
      this.purify = DOMPurify;
    } else {
      // For server-side rendering, we need to create a DOM environment
      const { JSDOM } = require('jsdom');
      const window = new JSDOM('').window;
      this.purify = DOMPurify(window as any);
    }

    // Configure DOMPurify hooks
    this.setupHooks();
  }

  public static getInstance(): ContentSanitizer {
    if (!ContentSanitizer.instance) {
      ContentSanitizer.instance = new ContentSanitizer();
    }
    return ContentSanitizer.instance;
  }

  /**
   * Setup DOMPurify hooks for additional security
   */
  private setupHooks(): void {
    // Hook to remove data URIs that might be malicious
    this.purify.addHook('beforeSanitizeAttributes', (node) => {
      if (node.hasAttribute('src')) {
        const src = node.getAttribute('src');
        if (src && src.startsWith('data:') && !src.startsWith('data:image/')) {
          node.removeAttribute('src');
        }
      }
    });

    // Hook to ensure external links open in new tab with security attributes
    this.purify.addHook('afterSanitizeAttributes', (node) => {
      if (node.tagName === 'A' && node.hasAttribute('href')) {
        const href = node.getAttribute('href');
        if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
          node.setAttribute('target', '_blank');
          node.setAttribute('rel', 'noopener noreferrer');
        }
      }
    });
  }

  /**
   * Sanitize HTML content with specified configuration
   */
  public sanitize(
    content: string,
    config: SanitizationConfig = SANITIZATION_CONFIGS.STANDARD
  ): string {
    if (!content || typeof content !== 'string') {
      return '';
    }

    try {
      const sanitized = this.purify.sanitize(content, {
        ALLOWED_TAGS: config.allowedTags,
        ALLOWED_ATTR: this.flattenAttributes(config.allowedAttributes || {}),
        ALLOWED_URI_REGEXP: this.createSchemeRegex(config.allowedSchemes || []),
        STRIP_IGNORE_TAG: config.stripIgnoreTag,
        STRIP_IGNORE_TAG_BODY: config.stripIgnoreTagBody,
        KEEP_CONTENT: true,
        RETURN_DOM: false,
        RETURN_DOM_FRAGMENT: false,
        RETURN_DOM_IMPORT: false
      });

      return sanitized;
    } catch (error) {
      console.error('Content sanitization failed:', error);
      // Return empty string on error for security
      return '';
    }
  }

  /**
   * Sanitize content for rich text editor
   */
  public sanitizeRichText(content: string): string {
    return this.sanitize(content, SANITIZATION_CONFIGS.RICH);
  }

  /**
   * Sanitize content for standard display
   */
  public sanitizeStandard(content: string): string {
    return this.sanitize(content, SANITIZATION_CONFIGS.STANDARD);
  }

  /**
   * Sanitize content with strict rules
   */
  public sanitizeStrict(content: string): string {
    return this.sanitize(content, SANITIZATION_CONFIGS.STRICT);
  }

  /**
   * Strip all HTML tags and return plain text
   */
  public stripHtml(content: string): string {
    if (!content || typeof content !== 'string') {
      return '';
    }

    try {
      const stripped = this.purify.sanitize(content, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
        KEEP_CONTENT: true
      });

      // Clean up extra whitespace
      return stripped.replace(/\s+/g, ' ').trim();
    } catch (error) {
      console.error('HTML stripping failed:', error);
      return '';
    }
  }

  /**
   * Validate if content is safe (returns true if no changes after sanitization)
   */
  public isSafe(content: string, config?: SanitizationConfig): boolean {
    if (!content) return true;
    
    const sanitized = this.sanitize(content, config);
    return content === sanitized;
  }

  /**
   * Get sanitization report showing what was removed
   */
  public getSanitizationReport(content: string, config?: SanitizationConfig): {
    original: string;
    sanitized: string;
    isModified: boolean;
    removedElements: string[];
  } {
    const sanitized = this.sanitize(content, config);
    const isModified = content !== sanitized;
    
    // Simple detection of removed elements (could be enhanced)
    const removedElements: string[] = [];
    if (isModified) {
      const originalTags = (content.match(/<[^>]+>/g) || []).length;
      const sanitizedTags = (sanitized.match(/<[^>]+>/g) || []).length;
      
      if (originalTags > sanitizedTags) {
        removedElements.push(`${originalTags - sanitizedTags} HTML elements removed`);
      }
    }

    return {
      original: content,
      sanitized,
      isModified,
      removedElements
    };
  }

  /**
   * Helper to flatten allowed attributes object
   */
  private flattenAttributes(allowedAttributes: { [key: string]: string[] }): string[] {
    const flattened: string[] = [];
    
    Object.entries(allowedAttributes).forEach(([tag, attrs]) => {
      if (tag === '*') {
        flattened.push(...attrs);
      } else {
        attrs.forEach(attr => {
          flattened.push(`${tag}:${attr}`);
        });
      }
    });

    return flattened;
  }

  /**
   * Helper to create regex for allowed URI schemes
   */
  private createSchemeRegex(schemes: string[]): RegExp {
    if (schemes.length === 0) {
      return /^$/; // No schemes allowed
    }
    
    const schemePattern = schemes.join('|');
    return new RegExp(`^(${schemePattern}):`);
  }
}

// Export singleton instance
export const contentSanitizer = ContentSanitizer.getInstance();

// Export convenience functions
export const sanitizeRichText = (content: string) => contentSanitizer.sanitizeRichText(content);
export const sanitizeStandard = (content: string) => contentSanitizer.sanitizeStandard(content);
export const sanitizeStrict = (content: string) => contentSanitizer.sanitizeStrict(content);
export const stripHtml = (content: string) => contentSanitizer.stripHtml(content);
