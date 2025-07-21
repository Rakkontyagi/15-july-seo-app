/**
 * Content Cleaning and Sanitization for SEO Automation App
 * Removes unwanted elements, normalizes text, and prepares content for analysis
 */

import { JSDOM } from 'jsdom';
import DOMPurify from 'isomorphic-dompurify';
import { z } from 'zod';

export interface ContentCleaningOptions {
  removeNavigation?: boolean;
  removeFooters?: boolean;
  removeSidebars?: boolean;
  removeAds?: boolean;
  removeComments?: boolean;
  removeForms?: boolean;
  removeScripts?: boolean;
  removeStyles?: boolean;
  preserveImages?: boolean;
  preserveLinks?: boolean;
  preserveHeadings?: boolean;
  preserveLists?: boolean;
  preserveTables?: boolean;
  minTextLength?: number;
  maxTextLength?: number;
  normalizeWhitespace?: boolean;
  removeEmptyElements?: boolean;
  customSelectors?: {
    remove?: string[];
    preserve?: string[];
  };
}

export interface CleanedContent {
  originalHtml: string;
  cleanedHtml: string;
  plainText: string;
  wordCount: number;
  characterCount: number;
  removedElements: string[];
  preservedElements: string[];
  warnings: string[];
  metadata: {
    title?: string;
    description?: string;
    language?: string;
    author?: string;
    publishDate?: string;
    modifiedDate?: string;
  };
}

const DEFAULT_CLEANING_OPTIONS: Required<ContentCleaningOptions> = {
  removeNavigation: true,
  removeFooters: true,
  removeSidebars: true,
  removeAds: true,
  removeComments: true,
  removeForms: false,
  removeScripts: true,
  removeStyles: true,
  preserveImages: true,
  preserveLinks: true,
  preserveHeadings: true,
  preserveLists: true,
  preserveTables: true,
  minTextLength: 10,
  maxTextLength: 1000000,
  normalizeWhitespace: true,
  removeEmptyElements: true,
  customSelectors: {
    remove: [],
    preserve: [],
  },
};

export class ContentCleaner {
  private options: Required<ContentCleaningOptions>;

  constructor(options: ContentCleaningOptions = {}) {
    this.options = { ...DEFAULT_CLEANING_OPTIONS, ...options };
  }

  /**
   * Clean HTML content
   */
  async cleanHtml(html: string): Promise<CleanedContent> {
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    const result: CleanedContent = {
      originalHtml: html,
      cleanedHtml: '',
      plainText: '',
      wordCount: 0,
      characterCount: 0,
      removedElements: [],
      preservedElements: [],
      warnings: [],
      metadata: {},
    };

    try {
      // Extract metadata first
      result.metadata = this.extractMetadata(document);

      // Remove unwanted elements
      this.removeUnwantedElements(document, result);

      // Preserve important elements
      this.preserveImportantElements(document, result);

      // Clean and normalize content
      this.normalizeContent(document, result);

      // Generate cleaned HTML
      result.cleanedHtml = DOMPurify.sanitize(document.body.innerHTML, {
        ALLOWED_TAGS: this.getAllowedTags(),
        ALLOWED_ATTR: this.getAllowedAttributes(),
        KEEP_CONTENT: true,
        RETURN_DOM: false,
      });

      // Generate plain text
      result.plainText = this.extractPlainText(document);

      // Calculate statistics
      result.wordCount = this.countWords(result.plainText);
      result.characterCount = result.plainText.length;

      // Validate content length
      this.validateContentLength(result);

    } catch (error) {
      result.warnings.push(`Content cleaning error: ${(error as Error).message}`);
    }

    return result;
  }

  /**
   * Extract metadata from document
   */
  private extractMetadata(document: Document): CleanedContent['metadata'] {
    const metadata: CleanedContent['metadata'] = {};

    // Title
    const titleElement = document.querySelector('title');
    if (titleElement) {
      metadata.title = titleElement.textContent?.trim();
    }

    // Meta description
    const descriptionMeta = document.querySelector('meta[name="description"]');
    if (descriptionMeta) {
      metadata.description = descriptionMeta.getAttribute('content')?.trim();
    }

    // Language
    const htmlLang = document.documentElement.getAttribute('lang');
    const langMeta = document.querySelector('meta[http-equiv="content-language"]');
    metadata.language = htmlLang || langMeta?.getAttribute('content')?.trim();

    // Author
    const authorMeta = document.querySelector('meta[name="author"]');
    if (authorMeta) {
      metadata.author = authorMeta.getAttribute('content')?.trim();
    }

    // Publish date
    const publishMeta = document.querySelector('meta[property="article:published_time"], meta[name="date"]');
    if (publishMeta) {
      metadata.publishDate = publishMeta.getAttribute('content')?.trim();
    }

    // Modified date
    const modifiedMeta = document.querySelector('meta[property="article:modified_time"], meta[name="last-modified"]');
    if (modifiedMeta) {
      metadata.modifiedDate = modifiedMeta.getAttribute('content')?.trim();
    }

    return metadata;
  }

  /**
   * Remove unwanted elements
   */
  private removeUnwantedElements(document: Document, result: CleanedContent): void {
    const selectorsToRemove: string[] = [];

    // Standard unwanted elements
    if (this.options.removeScripts) {
      selectorsToRemove.push('script', 'noscript');
    }

    if (this.options.removeStyles) {
      selectorsToRemove.push('style', 'link[rel="stylesheet"]');
    }

    if (this.options.removeNavigation) {
      selectorsToRemove.push('nav', '[role="navigation"]', '.navigation', '.nav', '.menu');
    }

    if (this.options.removeFooters) {
      selectorsToRemove.push('footer', '[role="contentinfo"]', '.footer');
    }

    if (this.options.removeSidebars) {
      selectorsToRemove.push('aside', '[role="complementary"]', '.sidebar', '.aside');
    }

    if (this.options.removeAds) {
      selectorsToRemove.push(
        '.ad', '.ads', '.advertisement', '.banner',
        '[class*="ad-"]', '[id*="ad-"]',
        '[class*="google-ad"]', '[class*="adsense"]'
      );
    }

    if (this.options.removeComments) {
      selectorsToRemove.push('.comments', '.comment-section', '[class*="comment"]');
    }

    if (this.options.removeForms) {
      selectorsToRemove.push('form');
    }

    // Custom selectors
    if (this.options.customSelectors.remove) {
      selectorsToRemove.push(...this.options.customSelectors.remove);
    }

    // Remove elements
    selectorsToRemove.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        result.removedElements.push(element.tagName.toLowerCase());
        element.remove();
      });
    });
  }

  /**
   * Preserve important elements
   */
  private preserveImportantElements(document: Document, result: CleanedContent): void {
    const selectorsToPreserve: string[] = [];

    if (this.options.preserveHeadings) {
      selectorsToPreserve.push('h1', 'h2', 'h3', 'h4', 'h5', 'h6');
    }

    if (this.options.preserveLinks) {
      selectorsToPreserve.push('a[href]');
    }

    if (this.options.preserveImages) {
      selectorsToPreserve.push('img[src]');
    }

    if (this.options.preserveLists) {
      selectorsToPreserve.push('ul', 'ol', 'li');
    }

    if (this.options.preserveTables) {
      selectorsToPreserve.push('table', 'thead', 'tbody', 'tr', 'th', 'td');
    }

    // Custom preserve selectors
    if (this.options.customSelectors.preserve) {
      selectorsToPreserve.push(...this.options.customSelectors.preserve);
    }

    // Mark preserved elements
    selectorsToPreserve.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        result.preservedElements.push(element.tagName.toLowerCase());
        element.setAttribute('data-preserved', 'true');
      });
    });
  }

  /**
   * Normalize content
   */
  private normalizeContent(document: Document, result: CleanedContent): void {
    // Remove empty elements
    if (this.options.removeEmptyElements) {
      this.removeEmptyElements(document);
    }

    // Normalize whitespace
    if (this.options.normalizeWhitespace) {
      this.normalizeWhitespace(document);
    }

    // Clean up attributes
    this.cleanAttributes(document);
  }

  /**
   * Remove empty elements
   */
  private removeEmptyElements(document: Document): void {
    const emptyElements = document.querySelectorAll('*');
    emptyElements.forEach(element => {
      if (
        !element.hasAttribute('data-preserved') &&
        !element.textContent?.trim() &&
        !element.querySelector('img, video, audio, iframe, canvas, svg') &&
        element.children.length === 0
      ) {
        element.remove();
      }
    });
  }

  /**
   * Normalize whitespace
   */
  private normalizeWhitespace(document: Document): void {
    const walker = document.createTreeWalker(
      document.body,
      document.defaultView!.NodeFilter.SHOW_TEXT
    );

    const textNodes: Text[] = [];
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node as Text);
    }

    textNodes.forEach(textNode => {
      if (textNode.textContent) {
        textNode.textContent = textNode.textContent
          .replace(/\s+/g, ' ')
          .replace(/^\s+|\s+$/g, '');
      }
    });
  }

  /**
   * Clean attributes
   */
  private cleanAttributes(document: Document): void {
    const elements = document.querySelectorAll('*');
    elements.forEach(element => {
      // Remove style attributes
      element.removeAttribute('style');
      
      // Remove event handlers
      Array.from(element.attributes).forEach(attr => {
        if (attr.name.startsWith('on')) {
          element.removeAttribute(attr.name);
        }
      });

      // Clean class names
      const className = element.getAttribute('class');
      if (className) {
        const cleanedClasses = className
          .split(' ')
          .filter(cls => !cls.match(/^(ad|ads|advertisement|banner|popup|modal|overlay)$/i))
          .join(' ');
        
        if (cleanedClasses) {
          element.setAttribute('class', cleanedClasses);
        } else {
          element.removeAttribute('class');
        }
      }
    });
  }

  /**
   * Extract plain text
   */
  private extractPlainText(document: Document): string {
    const textContent = document.body.textContent || '';
    
    return textContent
      .replace(/\s+/g, ' ')
      .replace(/^\s+|\s+$/g, '')
      .trim();
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Validate content length
   */
  private validateContentLength(result: CleanedContent): void {
    if (result.plainText.length < this.options.minTextLength) {
      result.warnings.push(`Content too short: ${result.plainText.length} characters (minimum: ${this.options.minTextLength})`);
    }

    if (result.plainText.length > this.options.maxTextLength) {
      result.warnings.push(`Content too long: ${result.plainText.length} characters (maximum: ${this.options.maxTextLength})`);
      result.plainText = result.plainText.substring(0, this.options.maxTextLength);
      result.characterCount = this.options.maxTextLength;
      result.wordCount = this.countWords(result.plainText);
    }
  }

  /**
   * Get allowed HTML tags for sanitization
   */
  private getAllowedTags(): string[] {
    const tags = ['p', 'br', 'strong', 'em', 'b', 'i', 'u', 'span', 'div'];

    if (this.options.preserveHeadings) {
      tags.push('h1', 'h2', 'h3', 'h4', 'h5', 'h6');
    }

    if (this.options.preserveLinks) {
      tags.push('a');
    }

    if (this.options.preserveImages) {
      tags.push('img');
    }

    if (this.options.preserveLists) {
      tags.push('ul', 'ol', 'li');
    }

    if (this.options.preserveTables) {
      tags.push('table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td');
    }

    return tags;
  }

  /**
   * Get allowed HTML attributes for sanitization
   */
  private getAllowedAttributes(): string[] {
    const attributes = ['class', 'id', 'data-preserved'];

    if (this.options.preserveLinks) {
      attributes.push('href', 'target', 'rel');
    }

    if (this.options.preserveImages) {
      attributes.push('src', 'alt', 'width', 'height');
    }

    return attributes;
  }

  /**
   * Clean markdown content
   */
  async cleanMarkdown(markdown: string): Promise<{
    cleanedMarkdown: string;
    plainText: string;
    wordCount: number;
    characterCount: number;
  }> {
    // Remove markdown syntax for plain text
    const plainText = markdown
      .replace(/#{1,6}\s+/g, '') // Remove headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/`(.*?)`/g, '$1') // Remove inline code
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1') // Remove images, keep alt text
      .replace(/^\s*[-*+]\s+/gm, '') // Remove list markers
      .replace(/^\s*\d+\.\s+/gm, '') // Remove numbered list markers
      .replace(/^\s*>\s+/gm, '') // Remove blockquotes
      .replace(/\n{3,}/g, '\n\n') // Normalize line breaks
      .trim();

    return {
      cleanedMarkdown: markdown,
      plainText,
      wordCount: this.countWords(plainText),
      characterCount: plainText.length,
    };
  }
}

// Factory function
export const createContentCleaner = (options?: ContentCleaningOptions): ContentCleaner => {
  return new ContentCleaner(options);
};

// Default export
export default ContentCleaner;
