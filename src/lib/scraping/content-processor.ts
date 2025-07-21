import * as cheerio from 'cheerio';
import TurndownService from 'turndown';
import { z } from 'zod';

// Content extraction types
export interface HeadingStructure {
  level: number;
  text: string;
  id?: string;
  position: number;
  children?: HeadingStructure[];
}

export interface LinkInfo {
  url: string;
  text: string;
  title?: string;
  isInternal: boolean;
  isExternal: boolean;
  anchor?: string;
  rel?: string;
  position: number;
}

export interface ImageInfo {
  src: string;
  alt?: string;
  title?: string;
  caption?: string;
  width?: number;
  height?: number;
  isRelevant: boolean;
  position: number;
}

export interface ProcessedContent {
  title?: string;
  description?: string;
  cleanedMarkdown: string;
  cleanedHtml: string;
  headings: HeadingStructure[];
  links: LinkInfo[];
  images: ImageInfo[];
  textContent: string;
  wordCount: number;
  readingTime: number;
  keywordDensity: Record<string, number>;
  contentQuality: {
    score: number;
    factors: {
      length: number;
      readability: number;
      structure: number;
      uniqueness: number;
    };
  };
  metadata: {
    extractedAt: Date;
    contentType: string;
    language?: string;
    author?: string;
    publishedDate?: string;
    modifiedDate?: string;
  };
}

export class ContentProcessor {
  private turndownService: TurndownService;

  constructor() {
    this.turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      bulletListMarker: '-',
      emDelimiter: '*',
      strongDelimiter: '**'
    });

    // Configure turndown rules
    this.turndownService.addRule('removeScript', {
      filter: ['script', 'style', 'noscript'],
      replacement: () => ''
    });

    this.turndownService.addRule('removeNav', {
      filter: (node) => {
        const tagName = node.nodeName.toLowerCase();
        const className = (node as Element).className || '';
        const id = (node as Element).id || '';
        
        return tagName === 'nav' || 
               className.includes('nav') || 
               className.includes('menu') ||
               id.includes('nav') ||
               id.includes('menu');
      },
      replacement: () => ''
    });
  }

  async processContent(html: string, url: string): Promise<ProcessedContent> {
    const $ = cheerio.load(html);
    
    // Clean the content
    const cleanedHtml = this.cleanHtml($, url);
    const cleanedMarkdown = this.turndownService.turndown(cleanedHtml);
    
    // Extract structured data
    const headings = this.extractHeadings($);
    const links = this.extractLinks($, url);
    const images = this.extractImages($, url);
    
    // Extract text content
    const textContent = this.extractTextContent($);
    const wordCount = this.countWords(textContent);
    const readingTime = Math.ceil(wordCount / 200); // Average reading speed
    
    // Calculate keyword density
    const keywordDensity = this.calculateKeywordDensity(textContent);
    
    // Assess content quality
    const contentQuality = this.assessContentQuality({
      textContent,
      headings,
      links,
      images,
      wordCount
    });
    
    // Extract metadata
    const metadata = this.extractMetadata($);

    return {
      title: $('title').text() || $('h1').first().text(),
      description: $('meta[name="description"]').attr('content') || 
                   $('meta[property="og:description"]').attr('content'),
      cleanedMarkdown,
      cleanedHtml,
      headings,
      links,
      images,
      textContent,
      wordCount,
      readingTime,
      keywordDensity,
      contentQuality,
      metadata: {
        ...metadata,
        extractedAt: new Date(),
        contentType: 'article'
      }
    };
  }

  private cleanHtml($: cheerio.CheerioAPI, url: string): string {
    // Remove unwanted elements
    const unwantedSelectors = [
      'script', 'style', 'noscript', 'iframe',
      'nav', 'header', 'footer', 'aside',
      '.navigation', '.nav', '.menu', '.header', '.footer', '.sidebar',
      '.advertisement', '.ad', '.ads', '.banner', '.promo',
      '.social', '.share', '.comment', '.comments',
      '.cookie', '.popup', '.modal', '.overlay',
      '[class*="nav"]', '[class*="menu"]', '[class*="header"]', '[class*="footer"]',
      '[class*="sidebar"]', '[class*="widget"]', '[class*="ad"]',
      '[id*="nav"]', '[id*="menu"]', '[id*="header"]', '[id*="footer"]',
      '[id*="sidebar"]', '[id*="ad"]'
    ];

    unwantedSelectors.forEach(selector => {
      $(selector).remove();
    });

    // Try to find main content area
    const mainContentSelectors = [
      'main',
      'article',
      '[role="main"]',
      '.main-content',
      '.content',
      '.post-content',
      '.article-content',
      '.entry-content',
      '#main-content',
      '#content',
      '#article'
    ];

    let mainContent = '';
    for (const selector of mainContentSelectors) {
      const element = $(selector);
      if (element.length > 0 && element.text().trim().length > 200) {
        mainContent = element.html() || '';
        break;
      }
    }

    // If no main content found, use body but clean it more aggressively
    if (!mainContent) {
      $('body').find('*').each((i, element) => {
        const $el = $(element);
        const text = $el.text().trim();
        
        // Remove elements with very little text
        if (text.length < 10 && !['img', 'br', 'hr'].includes(element.tagName)) {
          $el.remove();
        }
      });
      
      mainContent = $('body').html() || '';
    }

    return mainContent;
  }

  private extractHeadings($: cheerio.CheerioAPI): HeadingStructure[] {
    const headings: HeadingStructure[] = [];
    const headingElements = $('h1, h2, h3, h4, h5, h6').toArray();

    headingElements.forEach((element, index) => {
      const $el = $(element);
      const level = parseInt(element.tagName.charAt(1));
      const text = $el.text().trim();
      
      if (text) {
        headings.push({
          level,
          text,
          id: $el.attr('id'),
          position: index,
          children: []
        });
      }
    });

    // Build hierarchy
    return this.buildHeadingHierarchy(headings);
  }

  private buildHeadingHierarchy(headings: HeadingStructure[]): HeadingStructure[] {
    const result: HeadingStructure[] = [];
    const stack: HeadingStructure[] = [];

    for (const heading of headings) {
      // Remove headings with higher or equal level from stack
      while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
        stack.pop();
      }

      if (stack.length === 0) {
        // Top level heading
        result.push(heading);
      } else {
        // Child heading
        const parent = stack[stack.length - 1];
        if (!parent.children) parent.children = [];
        parent.children.push(heading);
      }

      stack.push(heading);
    }

    return result;
  }

  private extractLinks($: cheerio.CheerioAPI, baseUrl: string): LinkInfo[] {
    const links: LinkInfo[] = [];
    const linkElements = $('a[href]').toArray();

    linkElements.forEach((element, index) => {
      const $el = $(element);
      const href = $el.attr('href');
      const text = $el.text().trim();
      
      if (href && text) {
        try {
          const url = new URL(href, baseUrl);
          const baseUrlObj = new URL(baseUrl);
          
          links.push({
            url: url.href,
            text,
            title: $el.attr('title'),
            isInternal: url.hostname === baseUrlObj.hostname,
            isExternal: url.hostname !== baseUrlObj.hostname,
            anchor: url.hash ? url.hash.substring(1) : undefined,
            rel: $el.attr('rel'),
            position: index
          });
        } catch {
          // Invalid URL, skip
        }
      }
    });

    return links;
  }

  private extractImages($: cheerio.CheerioAPI, baseUrl: string): ImageInfo[] {
    const images: ImageInfo[] = [];
    const imageElements = $('img[src]').toArray();

    imageElements.forEach((element, index) => {
      const $el = $(element);
      const src = $el.attr('src');
      const alt = $el.attr('alt');
      
      if (src) {
        try {
          const imageUrl = new URL(src, baseUrl);
          
          // Check if image is relevant (not decorative)
          const isRelevant = this.isImageRelevant($el, alt);
          
          images.push({
            src: imageUrl.href,
            alt,
            title: $el.attr('title'),
            caption: $el.closest('figure').find('figcaption').text() || undefined,
            width: $el.attr('width') ? parseInt($el.attr('width')!) : undefined,
            height: $el.attr('height') ? parseInt($el.attr('height')!) : undefined,
            isRelevant,
            position: index
          });
        } catch {
          // Invalid URL, skip
        }
      }
    });

    return images;
  }

  private isImageRelevant($el: cheerio.Cheerio<cheerio.Element>, alt?: string): boolean {
    // Check if image has meaningful alt text
    if (alt && alt.length > 3 && !alt.toLowerCase().includes('image')) {
      return true;
    }

    // Check if image is in content area (not decorative)
    const src = $el.attr('src') || '';
    const decorativePatterns = [
      'icon', 'logo', 'avatar', 'profile', 'thumbnail',
      'spacer', 'pixel', 'divider', 'border', 'background'
    ];

    return !decorativePatterns.some(pattern => 
      src.toLowerCase().includes(pattern) || 
      (alt && alt.toLowerCase().includes(pattern))
    );
  }

  private extractTextContent($: cheerio.CheerioAPI): string {
    // Get text content, preserving paragraph breaks
    const textElements = $('p, h1, h2, h3, h4, h5, h6, li').toArray();
    
    return textElements
      .map(element => $(element).text().trim())
      .filter(text => text.length > 0)
      .join('\n\n');
  }

  private countWords(text: string): number {
    return text
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0)
      .length;
  }

  private calculateKeywordDensity(text: string): Record<string, number> {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3); // Only words longer than 3 characters

    const totalWords = words.length;
    const wordCounts: Record<string, number> = {};

    words.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });

    const density: Record<string, number> = {};
    Object.entries(wordCounts).forEach(([word, count]) => {
      density[word] = (count / totalWords) * 100;
    });

    // Return top 20 words by density
    return Object.fromEntries(
      Object.entries(density)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 20)
    );
  }

  private assessContentQuality(content: {
    textContent: string;
    headings: HeadingStructure[];
    links: LinkInfo[];
    images: ImageInfo[];
    wordCount: number;
  }): ProcessedContent['contentQuality'] {
    const { textContent, headings, links, images, wordCount } = content;

    // Length score (0-100)
    const lengthScore = Math.min(100, (wordCount / 1000) * 100);

    // Readability score (simplified)
    const sentences = textContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgWordsPerSentence = wordCount / sentences.length;
    const readabilityScore = Math.max(0, 100 - (avgWordsPerSentence - 15) * 2);

    // Structure score
    const hasH1 = headings.some(h => h.level === 1);
    const hasMultipleHeadings = headings.length > 1;
    const hasHierarchy = headings.some(h => h.children && h.children.length > 0);
    const structureScore = (hasH1 ? 40 : 0) + (hasMultipleHeadings ? 40 : 0) + (hasHierarchy ? 20 : 0);

    // Uniqueness score (basic heuristic)
    const uniqueWords = new Set(textContent.toLowerCase().split(/\s+/)).size;
    const uniquenessScore = Math.min(100, (uniqueWords / wordCount) * 200);

    const factors = {
      length: lengthScore,
      readability: Math.min(100, readabilityScore),
      structure: structureScore,
      uniqueness: uniquenessScore
    };

    const score = (factors.length * 0.3 + factors.readability * 0.2 + factors.structure * 0.3 + factors.uniqueness * 0.2);

    return {
      score: Math.round(score),
      factors: {
        length: Math.round(factors.length),
        readability: Math.round(factors.readability),
        structure: Math.round(factors.structure),
        uniqueness: Math.round(factors.uniqueness)
      }
    };
  }

  private extractMetadata($: cheerio.CheerioAPI): Omit<ProcessedContent['metadata'], 'extractedAt' | 'contentType'> {
    return {
      language: $('html').attr('lang') || $('meta[property="og:locale"]').attr('content'),
      author: $('meta[name="author"]').attr('content') || 
              $('meta[property="article:author"]').attr('content'),
      publishedDate: $('meta[property="article:published_time"]').attr('content') ||
                     $('meta[name="date"]').attr('content') ||
                     $('time[datetime]').attr('datetime'),
      modifiedDate: $('meta[property="article:modified_time"]').attr('content') ||
                    $('meta[name="last-modified"]').attr('content')
    };
  }
}