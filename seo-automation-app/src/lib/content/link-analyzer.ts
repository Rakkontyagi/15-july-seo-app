/**
 * Link Analysis System for SEO Automation App
 * Analyzes internal and external links for SEO optimization and quality assessment
 */

import { JSDOM } from 'jsdom';
import { z } from 'zod';

export interface LinkInfo {
  href: string;
  text: string;
  title?: string;
  target?: string;
  rel?: string;
  type: 'internal' | 'external' | 'anchor' | 'mailto' | 'tel' | 'file';
  domain?: string;
  isNoFollow?: boolean;
  isNoOpener?: boolean;
  isNoReferrer?: boolean;
  position: number;
  context?: string;
}

export interface ProcessedLink extends LinkInfo {
  id: string;
  status: 'unknown' | 'active' | 'broken' | 'redirect' | 'slow';
  statusCode?: number;
  responseTime?: number;
  finalUrl?: string;
  seo: {
    hasAnchorText: boolean;
    anchorTextQuality: 'poor' | 'fair' | 'good' | 'excellent';
    isKeywordRich: boolean;
    isOptimized: boolean;
    recommendations: string[];
  };
  accessibility: {
    isAccessible: boolean;
    issues: string[];
    suggestions: string[];
  };
  security: {
    isSecure: boolean;
    protocol: 'http' | 'https' | 'other';
    issues: string[];
    recommendations: string[];
  };
  metadata?: {
    title?: string;
    description?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    favicon?: string;
  };
}

export interface LinkAnalysisResult {
  links: ProcessedLink[];
  statistics: {
    totalLinks: number;
    internalLinks: number;
    externalLinks: number;
    anchorLinks: number;
    brokenLinks: number;
    noFollowLinks: number;
    secureLinks: number;
    averageResponseTime: number;
    uniqueDomains: number;
    linkDensity: number;
    seoScore: number;
    accessibilityScore: number;
    securityScore: number;
  };
  domains: Array<{
    domain: string;
    linkCount: number;
    type: 'internal' | 'external';
    trustScore: number;
  }>;
  issues: Array<{
    type: 'seo' | 'accessibility' | 'security' | 'performance';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    linkId?: string;
    recommendation: string;
  }>;
  recommendations: string[];
}

export interface LinkAnalysisOptions {
  checkStatus?: boolean;
  extractMetadata?: boolean;
  analyzeSEO?: boolean;
  checkAccessibility?: boolean;
  assessSecurity?: boolean;
  followRedirects?: boolean;
  timeout?: number;
  maxConcurrent?: number;
  targetKeywords?: string[];
  trustedDomains?: string[];
  blockedDomains?: string[];
}

const DEFAULT_OPTIONS: Required<LinkAnalysisOptions> = {
  checkStatus: true,
  extractMetadata: false,
  analyzeSEO: true,
  checkAccessibility: true,
  assessSecurity: true,
  followRedirects: true,
  timeout: 10000,
  maxConcurrent: 5,
  targetKeywords: [],
  trustedDomains: [],
  blockedDomains: [],
};

export class LinkAnalyzer {
  private options: Required<LinkAnalysisOptions>;

  constructor(options: LinkAnalysisOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Analyze links from HTML content
   */
  async analyzeLinksFromHtml(html: string, baseUrl?: string, contentText?: string): Promise<LinkAnalysisResult> {
    const dom = new JSDOM(html);
    const document = dom.window.document;
    const linkElements = document.querySelectorAll('a[href]');

    const links: ProcessedLink[] = [];
    const issues: LinkAnalysisResult['issues'] = [];

    for (let i = 0; i < linkElements.length; i++) {
      const linkElement = linkElements[i] as HTMLAnchorElement;
      try {
        const processedLink = await this.processLink(linkElement, baseUrl, i, contentText);
        links.push(processedLink);

        // Collect issues from processed link
        this.collectLinkIssues(processedLink, issues);
      } catch (error) {
        issues.push({
          type: 'performance',
          severity: 'medium',
          message: `Failed to process link: ${(error as Error).message}`,
          recommendation: 'Check link URL and accessibility',
        });
      }
    }

    const statistics = this.calculateStatistics(links, contentText);
    const domains = this.analyzeDomains(links);
    const recommendations = this.generateRecommendations(links, issues, statistics);

    return {
      links,
      statistics,
      domains,
      issues,
      recommendations,
    };
  }

  /**
   * Analyze links from markdown content
   */
  async analyzeLinksFromMarkdown(markdown: string, baseUrl?: string): Promise<LinkAnalysisResult> {
    const linkRegex = /\[([^\]]*)\]\(([^)]+)\)/g;
    const links: ProcessedLink[] = [];
    const issues: LinkAnalysisResult['issues'] = [];
    let match;
    let index = 0;

    while ((match = linkRegex.exec(markdown)) !== null) {
      const [, text, href] = match;
      
      try {
        const linkInfo: LinkInfo = {
          href: this.resolveUrl(href, baseUrl),
          text: text || '',
          type: this.classifyLinkType(href, baseUrl),
          position: index,
        };

        const processedLink = await this.processLinkInfo(linkInfo, index);
        links.push(processedLink);

        this.collectLinkIssues(processedLink, issues);
        index++;
      } catch (error) {
        issues.push({
          type: 'performance',
          severity: 'medium',
          message: `Failed to process markdown link: ${(error as Error).message}`,
          recommendation: 'Check link URL and format',
        });
      }
    }

    const statistics = this.calculateStatistics(links, markdown);
    const domains = this.analyzeDomains(links);
    const recommendations = this.generateRecommendations(links, issues, statistics);

    return {
      links,
      statistics,
      domains,
      issues,
      recommendations,
    };
  }

  /**
   * Process individual link element
   */
  private async processLink(linkElement: HTMLAnchorElement, baseUrl?: string, index: number, contentText?: string): Promise<ProcessedLink> {
    const linkInfo: LinkInfo = {
      href: this.resolveUrl(linkElement.href, baseUrl),
      text: linkElement.textContent?.trim() || '',
      title: linkElement.title || undefined,
      target: linkElement.target || undefined,
      rel: linkElement.rel || undefined,
      type: this.classifyLinkType(linkElement.href, baseUrl),
      position: index,
      context: this.extractContext(linkElement, contentText),
    };

    // Parse rel attribute
    if (linkInfo.rel) {
      linkInfo.isNoFollow = linkInfo.rel.includes('nofollow');
      linkInfo.isNoOpener = linkInfo.rel.includes('noopener');
      linkInfo.isNoReferrer = linkInfo.rel.includes('noreferrer');
    }

    // Extract domain
    try {
      const url = new URL(linkInfo.href);
      linkInfo.domain = url.hostname;
    } catch {
      // Invalid URL
    }

    return this.processLinkInfo(linkInfo, index);
  }

  /**
   * Process link information
   */
  private async processLinkInfo(linkInfo: LinkInfo, index: number): Promise<ProcessedLink> {
    const id = `link_${index}_${Date.now()}`;
    
    const processedLink: ProcessedLink = {
      ...linkInfo,
      id,
      status: 'unknown',
      seo: {
        hasAnchorText: Boolean(linkInfo.text),
        anchorTextQuality: this.assessAnchorTextQuality(linkInfo.text),
        isKeywordRich: this.isKeywordRich(linkInfo.text),
        isOptimized: false,
        recommendations: [],
      },
      accessibility: {
        isAccessible: true,
        issues: [],
        suggestions: [],
      },
      security: {
        isSecure: linkInfo.href.startsWith('https://'),
        protocol: this.getProtocol(linkInfo.href),
        issues: [],
        recommendations: [],
      },
    };

    // Check link status if enabled
    if (this.options.checkStatus && linkInfo.type !== 'anchor') {
      await this.checkLinkStatus(processedLink);
    }

    // Extract metadata if enabled
    if (this.options.extractMetadata && linkInfo.type === 'external') {
      await this.extractLinkMetadata(processedLink);
    }

    // Analyze SEO if enabled
    if (this.options.analyzeSEO) {
      this.analyzeLinkSEO(processedLink);
    }

    // Check accessibility if enabled
    if (this.options.checkAccessibility) {
      this.checkLinkAccessibility(processedLink);
    }

    // Assess security if enabled
    if (this.options.assessSecurity) {
      this.assessLinkSecurity(processedLink);
    }

    return processedLink;
  }

  /**
   * Check link status
   */
  private async checkLinkStatus(link: ProcessedLink): Promise<void> {
    try {
      const startTime = Date.now();
      
      // Simulate HTTP request (in real implementation, use fetch or axios)
      // For now, we'll simulate based on URL patterns
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
      
      const responseTime = Date.now() - startTime;
      link.responseTime = responseTime;

      // Simulate status based on URL patterns
      if (link.href.includes('404') || link.href.includes('broken')) {
        link.status = 'broken';
        link.statusCode = 404;
      } else if (link.href.includes('redirect')) {
        link.status = 'redirect';
        link.statusCode = 301;
        link.finalUrl = link.href.replace('redirect', 'final');
      } else if (responseTime > 5000) {
        link.status = 'slow';
        link.statusCode = 200;
      } else {
        link.status = 'active';
        link.statusCode = 200;
      }

    } catch (error) {
      link.status = 'broken';
      link.statusCode = 0;
    }
  }

  /**
   * Extract link metadata
   */
  private async extractLinkMetadata(link: ProcessedLink): Promise<void> {
    try {
      // In real implementation, fetch and parse the target page
      // For now, simulate metadata extraction
      link.metadata = {
        title: `Page Title for ${link.domain}`,
        description: `Description for ${link.href}`,
        ogTitle: `OG Title for ${link.domain}`,
        ogDescription: `OG Description for ${link.href}`,
      };
    } catch (error) {
      console.warn(`Failed to extract metadata for ${link.href}:`, error);
    }
  }

  /**
   * Analyze link SEO
   */
  private analyzeLinkSEO(link: ProcessedLink): void {
    const seo = link.seo;

    // Check anchor text
    if (!link.text) {
      seo.recommendations.push('Add descriptive anchor text for better SEO');
    } else {
      // Check for generic anchor text
      const genericTexts = ['click here', 'read more', 'learn more', 'here', 'this', 'link'];
      if (genericTexts.some(generic => link.text.toLowerCase().includes(generic))) {
        seo.recommendations.push('Use more descriptive anchor text instead of generic phrases');
      }

      // Check anchor text length
      if (link.text.length > 100) {
        seo.recommendations.push('Shorten anchor text for better user experience');
      }

      if (link.text.length < 3) {
        seo.recommendations.push('Use more descriptive anchor text (minimum 3 characters)');
      }
    }

    // Check external link attributes
    if (link.type === 'external') {
      if (!link.isNoOpener && !link.isNoReferrer) {
        seo.recommendations.push('Add rel="noopener noreferrer" to external links for security');
      }

      // Check if external link should be nofollow
      if (!link.isNoFollow && !this.isTrustedDomain(link.domain)) {
        seo.recommendations.push('Consider adding rel="nofollow" to untrusted external links');
      }
    }

    // Check internal link optimization
    if (link.type === 'internal') {
      if (link.href.includes('#') && !link.href.startsWith('#')) {
        seo.recommendations.push('Consider using separate pages instead of anchor links for better SEO');
      }
    }

    seo.isOptimized = seo.recommendations.length === 0;
  }

  /**
   * Check link accessibility
   */
  private checkLinkAccessibility(link: ProcessedLink): void {
    const accessibility = link.accessibility;

    // Check for empty anchor text
    if (!link.text || link.text.trim().length === 0) {
      accessibility.isAccessible = false;
      accessibility.issues.push('Empty anchor text');
      accessibility.suggestions.push('Add descriptive text that explains where the link goes');
    }

    // Check for ambiguous anchor text
    const ambiguousTexts = ['click here', 'here', 'this', 'more'];
    if (ambiguousTexts.includes(link.text.toLowerCase())) {
      accessibility.issues.push('Ambiguous anchor text');
      accessibility.suggestions.push('Use descriptive text that makes sense out of context');
    }

    // Check title attribute
    if (link.title && link.title === link.text) {
      accessibility.issues.push('Title attribute duplicates anchor text');
      accessibility.suggestions.push('Remove title attribute or provide additional context');
    }

    // Check target="_blank" without warning
    if (link.target === '_blank' && !link.title?.includes('opens in new')) {
      accessibility.issues.push('Link opens in new window without warning');
      accessibility.suggestions.push('Add indication that link opens in new window/tab');
    }

    accessibility.isAccessible = accessibility.issues.length === 0;
  }

  /**
   * Assess link security
   */
  private assessLinkSecurity(link: ProcessedLink): void {
    const security = link.security;

    // Check protocol
    if (link.href.startsWith('http://')) {
      security.isSecure = false;
      security.issues.push('Insecure HTTP protocol');
      security.recommendations.push('Use HTTPS for better security');
    }

    // Check for suspicious domains
    if (this.isSuspiciousDomain(link.domain)) {
      security.issues.push('Potentially suspicious domain');
      security.recommendations.push('Verify domain trustworthiness before linking');
    }

    // Check blocked domains
    if (this.isBlockedDomain(link.domain)) {
      security.issues.push('Link to blocked domain');
      security.recommendations.push('Remove or replace link to blocked domain');
    }

    // Check external link security attributes
    if (link.type === 'external') {
      if (!link.isNoOpener) {
        security.issues.push('Missing rel="noopener" attribute');
        security.recommendations.push('Add rel="noopener" to prevent window.opener access');
      }

      if (!link.isNoReferrer && security.isSecure) {
        security.recommendations.push('Consider adding rel="noreferrer" to prevent referrer leakage');
      }
    }
  }

  /**
   * Classify link type
   */
  private classifyLinkType(href: string, baseUrl?: string): LinkInfo['type'] {
    if (href.startsWith('#')) return 'anchor';
    if (href.startsWith('mailto:')) return 'mailto';
    if (href.startsWith('tel:')) return 'tel';
    if (href.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar)$/i)) return 'file';

    if (baseUrl) {
      try {
        const linkUrl = new URL(href, baseUrl);
        const baseUrlObj = new URL(baseUrl);
        return linkUrl.hostname === baseUrlObj.hostname ? 'internal' : 'external';
      } catch {
        return 'external';
      }
    }

    return href.startsWith('http') ? 'external' : 'internal';
  }

  /**
   * Assess anchor text quality
   */
  private assessAnchorTextQuality(text: string): ProcessedLink['seo']['anchorTextQuality'] {
    if (!text || text.trim().length === 0) return 'poor';

    const length = text.length;
    const genericTexts = ['click here', 'read more', 'learn more', 'here', 'this', 'link'];
    const isGeneric = genericTexts.some(generic => text.toLowerCase().includes(generic));
    const isDescriptive = length >= 10 && length <= 60;
    const hasKeywords = this.options.targetKeywords.some(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    );

    if (isDescriptive && hasKeywords && !isGeneric) return 'excellent';
    if (isDescriptive && !isGeneric) return 'good';
    if (length > 5 && !isGeneric) return 'fair';
    return 'poor';
  }

  /**
   * Check if anchor text is keyword rich
   */
  private isKeywordRich(text: string): boolean {
    return this.options.targetKeywords.some(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  /**
   * Get protocol from URL
   */
  private getProtocol(href: string): ProcessedLink['security']['protocol'] {
    if (href.startsWith('https://')) return 'https';
    if (href.startsWith('http://')) return 'http';
    return 'other';
  }

  /**
   * Check if domain is trusted
   */
  private isTrustedDomain(domain?: string): boolean {
    if (!domain) return false;
    return this.options.trustedDomains.some(trusted => 
      domain.includes(trusted) || trusted.includes(domain)
    );
  }

  /**
   * Check if domain is suspicious
   */
  private isSuspiciousDomain(domain?: string): boolean {
    if (!domain) return false;
    
    const suspiciousPatterns = [
      /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/, // IP addresses
      /[0-9]{5,}/, // Long numbers in domain
      /bit\.ly|tinyurl|t\.co/, // URL shorteners
    ];

    return suspiciousPatterns.some(pattern => pattern.test(domain));
  }

  /**
   * Check if domain is blocked
   */
  private isBlockedDomain(domain?: string): boolean {
    if (!domain) return false;
    return this.options.blockedDomains.some(blocked => 
      domain.includes(blocked) || blocked.includes(domain)
    );
  }

  /**
   * Extract context around link
   */
  private extractContext(linkElement: HTMLAnchorElement, contentText?: string): string {
    const parent = linkElement.parentElement;
    if (parent) {
      return parent.textContent?.trim().substring(0, 200) || '';
    }
    return '';
  }

  /**
   * Resolve relative URLs
   */
  private resolveUrl(url: string, baseUrl?: string): string {
    if (!baseUrl || url.startsWith('http') || url.startsWith('mailto:') || url.startsWith('tel:')) {
      return url;
    }
    
    try {
      return new URL(url, baseUrl).href;
    } catch {
      return url;
    }
  }

  /**
   * Calculate statistics
   */
  private calculateStatistics(links: ProcessedLink[], contentText?: string): LinkAnalysisResult['statistics'] {
    const totalLinks = links.length;
    const internalLinks = links.filter(link => link.type === 'internal').length;
    const externalLinks = links.filter(link => link.type === 'external').length;
    const anchorLinks = links.filter(link => link.type === 'anchor').length;
    const brokenLinks = links.filter(link => link.status === 'broken').length;
    const noFollowLinks = links.filter(link => link.isNoFollow).length;
    const secureLinks = links.filter(link => link.security.isSecure).length;

    const responseTimes = links
      .filter(link => link.responseTime)
      .map(link => link.responseTime!);
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;

    const uniqueDomains = new Set(links.map(link => link.domain).filter(Boolean)).size;

    // Calculate link density (links per 100 words)
    const wordCount = contentText ? contentText.split(/\s+/).length : 1000;
    const linkDensity = (totalLinks / wordCount) * 100;

    // Calculate scores
    const seoScore = totalLinks > 0 ? 
      (links.filter(link => link.seo.isOptimized).length / totalLinks) * 100 : 100;
    const accessibilityScore = totalLinks > 0 ? 
      (links.filter(link => link.accessibility.isAccessible).length / totalLinks) * 100 : 100;
    const securityScore = totalLinks > 0 ? 
      (secureLinks / totalLinks) * 100 : 100;

    return {
      totalLinks,
      internalLinks,
      externalLinks,
      anchorLinks,
      brokenLinks,
      noFollowLinks,
      secureLinks,
      averageResponseTime: Math.round(averageResponseTime),
      uniqueDomains,
      linkDensity: Math.round(linkDensity * 10) / 10,
      seoScore: Math.round(seoScore),
      accessibilityScore: Math.round(accessibilityScore),
      securityScore: Math.round(securityScore),
    };
  }

  /**
   * Analyze domains
   */
  private analyzeDomains(links: ProcessedLink[]): LinkAnalysisResult['domains'] {
    const domainMap = new Map<string, { count: number; type: 'internal' | 'external' }>();

    links.forEach(link => {
      if (link.domain) {
        const existing = domainMap.get(link.domain);
        if (existing) {
          existing.count++;
        } else {
          domainMap.set(link.domain, {
            count: 1,
            type: link.type === 'internal' ? 'internal' : 'external',
          });
        }
      }
    });

    return Array.from(domainMap.entries())
      .map(([domain, data]) => ({
        domain,
        linkCount: data.count,
        type: data.type,
        trustScore: this.calculateTrustScore(domain, data.count),
      }))
      .sort((a, b) => b.linkCount - a.linkCount);
  }

  /**
   * Calculate trust score for domain
   */
  private calculateTrustScore(domain: string, linkCount: number): number {
    let score = 50; // Base score

    // Trusted domains get higher scores
    if (this.isTrustedDomain(domain)) {
      score += 30;
    }

    // Suspicious domains get lower scores
    if (this.isSuspiciousDomain(domain)) {
      score -= 40;
    }

    // Blocked domains get zero score
    if (this.isBlockedDomain(domain)) {
      score = 0;
    }

    // More links from same domain can indicate trust or spam
    if (linkCount > 5) {
      score -= 10; // Potential spam
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Collect issues from processed link
   */
  private collectLinkIssues(link: ProcessedLink, issues: LinkAnalysisResult['issues']): void {
    // SEO issues
    if (!link.seo.hasAnchorText) {
      issues.push({
        type: 'seo',
        severity: 'medium',
        message: 'Link missing anchor text',
        linkId: link.id,
        recommendation: 'Add descriptive anchor text for better SEO',
      });
    }

    // Accessibility issues
    link.accessibility.issues.forEach(issue => {
      issues.push({
        type: 'accessibility',
        severity: 'high',
        message: issue,
        linkId: link.id,
        recommendation: link.accessibility.suggestions[0] || 'Fix accessibility issue',
      });
    });

    // Security issues
    link.security.issues.forEach(issue => {
      issues.push({
        type: 'security',
        severity: issue.includes('HTTP') ? 'medium' : 'low',
        message: issue,
        linkId: link.id,
        recommendation: link.security.recommendations[0] || 'Fix security issue',
      });
    });

    // Performance issues
    if (link.status === 'broken') {
      issues.push({
        type: 'performance',
        severity: 'high',
        message: 'Broken link detected',
        linkId: link.id,
        recommendation: 'Fix or remove broken link',
      });
    }

    if (link.status === 'slow') {
      issues.push({
        type: 'performance',
        severity: 'medium',
        message: 'Slow loading link',
        linkId: link.id,
        recommendation: 'Check target site performance or consider alternative',
      });
    }
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    links: ProcessedLink[], 
    issues: LinkAnalysisResult['issues'], 
    statistics: LinkAnalysisResult['statistics']
  ): string[] {
    const recommendations: string[] = [];

    if (statistics.brokenLinks > 0) {
      recommendations.push(`Fix ${statistics.brokenLinks} broken links to improve user experience`);
    }

    if (statistics.seoScore < 80) {
      recommendations.push('Improve link SEO by using descriptive anchor text and optimizing link attributes');
    }

    if (statistics.accessibilityScore < 90) {
      recommendations.push('Fix link accessibility issues for better screen reader support');
    }

    if (statistics.securityScore < 80) {
      recommendations.push('Improve link security by using HTTPS and proper rel attributes');
    }

    if (statistics.linkDensity > 5) {
      recommendations.push('Consider reducing link density for better user experience');
    }

    const externalWithoutNofollow = links.filter(link => 
      link.type === 'external' && !link.isNoFollow && !this.isTrustedDomain(link.domain)
    );
    if (externalWithoutNofollow.length > 0) {
      recommendations.push('Consider adding rel="nofollow" to untrusted external links');
    }

    const insecureLinks = links.filter(link => !link.security.isSecure);
    if (insecureLinks.length > 0) {
      recommendations.push(`Update ${insecureLinks.length} HTTP links to HTTPS for better security`);
    }

    return recommendations;
  }
}

// Factory function
export const createLinkAnalyzer = (options?: LinkAnalysisOptions): LinkAnalyzer => {
  return new LinkAnalyzer(options);
};

// Default export
export default LinkAnalyzer;
