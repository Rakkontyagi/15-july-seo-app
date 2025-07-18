/**
 * Heading Structure Extraction for SEO Automation App
 * Analyzes and extracts hierarchical heading structure from content
 */

import { JSDOM } from 'jsdom';
import { z } from 'zod';

export interface HeadingElement {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
  id?: string;
  anchor?: string;
  position: number;
  wordCount: number;
  characterCount: number;
  children: HeadingElement[];
  parent?: HeadingElement;
  depth: number;
}

export interface HeadingStructure {
  headings: HeadingElement[];
  hierarchy: HeadingElement[];
  statistics: {
    totalHeadings: number;
    h1Count: number;
    h2Count: number;
    h3Count: number;
    h4Count: number;
    h5Count: number;
    h6Count: number;
    averageWordsPerHeading: number;
    maxDepth: number;
    hasProperHierarchy: boolean;
    missingLevels: number[];
    duplicateH1s: boolean;
  };
  issues: HeadingIssue[];
  recommendations: string[];
}

export interface HeadingIssue {
  type: 'missing_h1' | 'multiple_h1' | 'skipped_level' | 'empty_heading' | 'too_long' | 'too_short' | 'duplicate_text';
  severity: 'error' | 'warning' | 'info';
  heading?: HeadingElement;
  message: string;
  suggestion: string;
}

export interface HeadingExtractionOptions {
  includeEmptyHeadings?: boolean;
  maxHeadingLength?: number;
  minHeadingLength?: number;
  generateAnchors?: boolean;
  validateHierarchy?: boolean;
  extractFromMarkdown?: boolean;
}

const DEFAULT_OPTIONS: Required<HeadingExtractionOptions> = {
  includeEmptyHeadings: false,
  maxHeadingLength: 100,
  minHeadingLength: 3,
  generateAnchors: true,
  validateHierarchy: true,
  extractFromMarkdown: true,
};

export class HeadingExtractor {
  private options: Required<HeadingExtractionOptions>;

  constructor(options: HeadingExtractionOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Extract heading structure from HTML
   */
  extractFromHtml(html: string): HeadingStructure {
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const headings: HeadingElement[] = [];

    headingElements.forEach((element, index) => {
      const level = parseInt(element.tagName.charAt(1)) as 1 | 2 | 3 | 4 | 5 | 6;
      const text = element.textContent?.trim() || '';
      
      // Skip empty headings if not included
      if (!text && !this.options.includeEmptyHeadings) {
        return;
      }

      const heading: HeadingElement = {
        level,
        text,
        id: element.id || undefined,
        anchor: this.options.generateAnchors ? this.generateAnchor(text) : undefined,
        position: index,
        wordCount: this.countWords(text),
        characterCount: text.length,
        children: [],
        depth: 0,
      };

      headings.push(heading);
    });

    return this.buildStructure(headings);
  }

  /**
   * Extract heading structure from Markdown
   */
  extractFromMarkdown(markdown: string): HeadingStructure {
    if (!this.options.extractFromMarkdown) {
      throw new Error('Markdown extraction is disabled');
    }

    const headings: HeadingElement[] = [];
    const lines = markdown.split('\n');

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // ATX-style headers (# ## ### etc.)
      const atxMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/);
      if (atxMatch) {
        const level = atxMatch[1].length as 1 | 2 | 3 | 4 | 5 | 6;
        const text = atxMatch[2].trim();

        if (text || this.options.includeEmptyHeadings) {
          const heading: HeadingElement = {
            level,
            text,
            anchor: this.options.generateAnchors ? this.generateAnchor(text) : undefined,
            position: index,
            wordCount: this.countWords(text),
            characterCount: text.length,
            children: [],
            depth: 0,
          };

          headings.push(heading);
        }
      }

      // Setext-style headers (underlined with = or -)
      if (index < lines.length - 1) {
        const nextLine = lines[index + 1].trim();
        if (nextLine.match(/^=+$/) && trimmedLine) {
          // H1
          const heading: HeadingElement = {
            level: 1,
            text: trimmedLine,
            anchor: this.options.generateAnchors ? this.generateAnchor(trimmedLine) : undefined,
            position: index,
            wordCount: this.countWords(trimmedLine),
            characterCount: trimmedLine.length,
            children: [],
            depth: 0,
          };
          headings.push(heading);
        } else if (nextLine.match(/^-+$/) && trimmedLine) {
          // H2
          const heading: HeadingElement = {
            level: 2,
            text: trimmedLine,
            anchor: this.options.generateAnchors ? this.generateAnchor(trimmedLine) : undefined,
            position: index,
            wordCount: this.countWords(trimmedLine),
            characterCount: trimmedLine.length,
            children: [],
            depth: 0,
          };
          headings.push(heading);
        }
      }
    });

    return this.buildStructure(headings);
  }

  /**
   * Build hierarchical structure from flat heading list
   */
  private buildStructure(headings: HeadingElement[]): HeadingStructure {
    const hierarchy: HeadingElement[] = [];
    const stack: HeadingElement[] = [];

    // Build hierarchy
    headings.forEach(heading => {
      // Find the correct parent
      while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
        stack.pop();
      }

      if (stack.length > 0) {
        const parent = stack[stack.length - 1];
        heading.parent = parent;
        heading.depth = parent.depth + 1;
        parent.children.push(heading);
      } else {
        heading.depth = 0;
        hierarchy.push(heading);
      }

      stack.push(heading);
    });

    // Calculate statistics
    const statistics = this.calculateStatistics(headings);

    // Find issues
    const issues = this.findIssues(headings, statistics);

    // Generate recommendations
    const recommendations = this.generateRecommendations(issues, statistics);

    return {
      headings,
      hierarchy,
      statistics,
      issues,
      recommendations,
    };
  }

  /**
   * Calculate heading statistics
   */
  private calculateStatistics(headings: HeadingElement[]) {
    const counts = { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0 };
    let totalWords = 0;
    let maxDepth = 0;

    headings.forEach(heading => {
      counts[`h${heading.level}` as keyof typeof counts]++;
      totalWords += heading.wordCount;
      maxDepth = Math.max(maxDepth, heading.depth);
    });

    // Check for missing levels
    const missingLevels: number[] = [];
    const presentLevels = headings.map(h => h.level).sort();
    const uniqueLevels = [...new Set(presentLevels)];
    
    if (uniqueLevels.length > 1) {
      for (let i = uniqueLevels[0]; i < uniqueLevels[uniqueLevels.length - 1]; i++) {
        if (!uniqueLevels.includes(i as 1 | 2 | 3 | 4 | 5 | 6)) {
          missingLevels.push(i);
        }
      }
    }

    // Check hierarchy
    let hasProperHierarchy = true;
    for (let i = 1; i < headings.length; i++) {
      const current = headings[i];
      const previous = headings[i - 1];
      
      if (current.level > previous.level + 1) {
        hasProperHierarchy = false;
        break;
      }
    }

    return {
      totalHeadings: headings.length,
      h1Count: counts.h1,
      h2Count: counts.h2,
      h3Count: counts.h3,
      h4Count: counts.h4,
      h5Count: counts.h5,
      h6Count: counts.h6,
      averageWordsPerHeading: headings.length > 0 ? totalWords / headings.length : 0,
      maxDepth,
      hasProperHierarchy,
      missingLevels,
      duplicateH1s: counts.h1 > 1,
    };
  }

  /**
   * Find heading issues
   */
  private findIssues(headings: HeadingElement[], statistics: any): HeadingIssue[] {
    const issues: HeadingIssue[] = [];

    // Check for missing H1
    if (statistics.h1Count === 0) {
      issues.push({
        type: 'missing_h1',
        severity: 'error',
        message: 'No H1 heading found',
        suggestion: 'Add an H1 heading as the main title of the page',
      });
    }

    // Check for multiple H1s
    if (statistics.duplicateH1s) {
      issues.push({
        type: 'multiple_h1',
        severity: 'warning',
        message: `Found ${statistics.h1Count} H1 headings`,
        suggestion: 'Use only one H1 heading per page for better SEO',
      });
    }

    // Check individual headings
    headings.forEach(heading => {
      // Empty headings
      if (!heading.text.trim()) {
        issues.push({
          type: 'empty_heading',
          severity: 'error',
          heading,
          message: `Empty H${heading.level} heading found`,
          suggestion: 'Add descriptive text to the heading or remove it',
        });
      }

      // Too long headings
      if (heading.characterCount > this.options.maxHeadingLength) {
        issues.push({
          type: 'too_long',
          severity: 'warning',
          heading,
          message: `H${heading.level} heading is too long (${heading.characterCount} characters)`,
          suggestion: `Keep headings under ${this.options.maxHeadingLength} characters`,
        });
      }

      // Too short headings
      if (heading.characterCount < this.options.minHeadingLength && heading.text.trim()) {
        issues.push({
          type: 'too_short',
          severity: 'info',
          heading,
          message: `H${heading.level} heading might be too short (${heading.characterCount} characters)`,
          suggestion: `Consider making headings more descriptive (minimum ${this.options.minHeadingLength} characters)`,
        });
      }
    });

    // Check for skipped levels
    if (!statistics.hasProperHierarchy) {
      issues.push({
        type: 'skipped_level',
        severity: 'warning',
        message: 'Heading hierarchy has skipped levels',
        suggestion: 'Use consecutive heading levels (H1 → H2 → H3) for better structure',
      });
    }

    // Check for duplicate heading text
    const textCounts = new Map<string, HeadingElement[]>();
    headings.forEach(heading => {
      const text = heading.text.toLowerCase().trim();
      if (text) {
        if (!textCounts.has(text)) {
          textCounts.set(text, []);
        }
        textCounts.get(text)!.push(heading);
      }
    });

    textCounts.forEach((duplicates, text) => {
      if (duplicates.length > 1) {
        issues.push({
          type: 'duplicate_text',
          severity: 'warning',
          message: `Duplicate heading text found: "${text}" (${duplicates.length} times)`,
          suggestion: 'Make heading text unique for better navigation and SEO',
        });
      }
    });

    return issues;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(issues: HeadingIssue[], statistics: any): string[] {
    const recommendations: string[] = [];

    const errorCount = issues.filter(i => i.severity === 'error').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;

    if (errorCount > 0) {
      recommendations.push(`Fix ${errorCount} critical heading issues for better SEO`);
    }

    if (warningCount > 0) {
      recommendations.push(`Address ${warningCount} heading warnings to improve content structure`);
    }

    if (statistics.totalHeadings === 0) {
      recommendations.push('Add headings to structure your content and improve readability');
    } else if (statistics.totalHeadings < 3) {
      recommendations.push('Consider adding more headings to break up long content sections');
    }

    if (statistics.maxDepth > 4) {
      recommendations.push('Consider simplifying heading hierarchy - very deep nesting can be confusing');
    }

    if (statistics.averageWordsPerHeading < 2) {
      recommendations.push('Make headings more descriptive with 2-8 words for better SEO');
    }

    if (statistics.h2Count === 0 && statistics.totalHeadings > 1) {
      recommendations.push('Add H2 headings to create main content sections');
    }

    return recommendations;
  }

  /**
   * Generate anchor from heading text
   */
  private generateAnchor(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Generate table of contents from heading structure
   */
  generateTableOfContents(structure: HeadingStructure): {
    html: string;
    markdown: string;
    json: any[];
  } {
    const generateTocItems = (headings: HeadingElement[]): any[] => {
      return headings.map(heading => ({
        level: heading.level,
        text: heading.text,
        anchor: heading.anchor,
        children: generateTocItems(heading.children),
      }));
    };

    const json = generateTocItems(structure.hierarchy);

    // Generate HTML TOC
    const generateHtmlToc = (items: any[], level = 0): string => {
      if (items.length === 0) return '';
      
      const listType = level === 0 ? 'ol' : 'ul';
      let html = `<${listType} class="toc-level-${level}">`;
      
      items.forEach(item => {
        html += '<li>';
        if (item.anchor) {
          html += `<a href="#${item.anchor}">${item.text}</a>`;
        } else {
          html += item.text;
        }
        
        if (item.children.length > 0) {
          html += generateHtmlToc(item.children, level + 1);
        }
        
        html += '</li>';
      });
      
      html += `</${listType}>`;
      return html;
    };

    // Generate Markdown TOC
    const generateMarkdownToc = (items: any[], level = 0): string => {
      let markdown = '';
      
      items.forEach(item => {
        const indent = '  '.repeat(level);
        const bullet = level === 0 ? '1.' : '-';
        
        if (item.anchor) {
          markdown += `${indent}${bullet} [${item.text}](#${item.anchor})\n`;
        } else {
          markdown += `${indent}${bullet} ${item.text}\n`;
        }
        
        if (item.children.length > 0) {
          markdown += generateMarkdownToc(item.children, level + 1);
        }
      });
      
      return markdown;
    };

    return {
      html: generateHtmlToc(json),
      markdown: generateMarkdownToc(json),
      json,
    };
  }
}

// Factory function
export const createHeadingExtractor = (options?: HeadingExtractionOptions): HeadingExtractor => {
  return new HeadingExtractor(options);
};

// Default export
export default HeadingExtractor;
