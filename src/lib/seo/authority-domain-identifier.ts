
import { URL } from 'url';

export interface AuthorityDomain {
  domain: string;
  type: 'wikipedia' | 'government' | 'industry' | 'academic' | 'news' | 'research' | 'medical' | 'legal' | 'financial' | 'technology' | 'other';
  credibilityScore: number; // 0-100
  reasoning: string[];
  subtype?: string;
  verificationDate?: Date;
  metrics?: AuthorityMetrics;
}

export interface AuthorityMetrics {
  domainAge?: number; // Years since domain registration
  backlinks?: number; // Number of referring domains
  organicTraffic?: number; // Estimated monthly organic traffic
  trustFlow?: number; // Majestic Trust Flow score
  citationFlow?: number; // Majestic Citation Flow score
  expertiseIndicators?: string[]; // Indicators of domain expertise
}

export interface AuthorityIdentificationOptions {
  includeSubdomains?: boolean;
  verifyDomainStatus?: boolean;
  checkDomainAge?: boolean;
  analyzeContent?: boolean;
  industryContext?: string;
  minimumCredibilityScore?: number;
}

export interface AuthorityIdentificationResult {
  identifiedDomains: AuthorityDomain[];
  totalDomainsFound: number;
  highAuthorityCount: number;
  mediumAuthorityCount: number;
  lowAuthorityCount: number;
  recommendations: string[];
  industrySpecificAuthorities: AuthorityDomain[];
}

/**
 * Advanced authority domain identification system that automatically discovers
 * Wikipedia, government, academic, and industry authority sources with
 * comprehensive credibility scoring and verification
 */
export class AuthorityDomainIdentifier {
  private predefinedAuthorityDomains: AuthorityDomain[] = [
    // Wikipedia and Wikimedia
    {
      domain: 'wikipedia.org',
      type: 'wikipedia',
      credibilityScore: 90,
      reasoning: ['Crowd-sourced encyclopedia with editorial oversight', 'Widely cited and referenced', 'Transparent editing process'],
      subtype: 'encyclopedia'
    },
    {
      domain: 'wikimedia.org',
      type: 'wikipedia',
      credibilityScore: 85,
      reasoning: ['Wikimedia Foundation projects', 'Open knowledge initiatives'],
      subtype: 'foundation'
    },

    // Government domains
    {
      domain: 'gov',
      type: 'government',
      credibilityScore: 95,
      reasoning: ['Official government information', 'Authoritative policy sources', 'Regulated content'],
      subtype: 'federal'
    },
    {
      domain: '.mil',
      type: 'government',
      credibilityScore: 93,
      reasoning: ['Military and defense information', 'Official military sources'],
      subtype: 'military'
    },

    // Academic institutions
    {
      domain: 'edu',
      type: 'academic',
      credibilityScore: 88,
      reasoning: ['Educational institutions', 'Research-based content', 'Peer-reviewed sources'],
      subtype: 'university'
    },
    {
      domain: 'harvard.edu',
      type: 'academic',
      credibilityScore: 95,
      reasoning: ['Ivy League institution', 'World-renowned research', 'Academic excellence'],
      subtype: 'ivy_league'
    },
    {
      domain: 'mit.edu',
      type: 'academic',
      credibilityScore: 95,
      reasoning: ['Leading technology institute', 'Cutting-edge research', 'Innovation hub'],
      subtype: 'technology_institute'
    },

    // Research and Scientific Organizations
    {
      domain: 'nature.com',
      type: 'research',
      credibilityScore: 95,
      reasoning: ['Premier scientific journal', 'Peer-reviewed research', 'High impact factor'],
      subtype: 'scientific_journal'
    },
    {
      domain: 'pubmed.ncbi.nlm.nih.gov',
      type: 'medical',
      credibilityScore: 98,
      reasoning: ['National Library of Medicine', 'Peer-reviewed medical literature', 'Government health authority'],
      subtype: 'medical_database'
    },

    // News Organizations
    {
      domain: 'nytimes.com',
      type: 'news',
      credibilityScore: 80,
      reasoning: ['Established newspaper', 'Pulitzer Prize winner', 'Investigative journalism'],
      subtype: 'newspaper'
    },
    {
      domain: 'wsj.com',
      type: 'news',
      credibilityScore: 85,
      reasoning: ['Leading financial publication', 'Business authority', 'Market analysis'],
      subtype: 'financial_news'
    },

    // Technology and Industry
    {
      domain: 'ieee.org',
      type: 'technology',
      credibilityScore: 92,
      reasoning: ['Institute of Electrical and Electronics Engineers', 'Technical standards', 'Professional organization'],
      subtype: 'professional_organization'
    }
  ];

  private readonly defaultOptions: Required<AuthorityIdentificationOptions> = {
    includeSubdomains: true,
    verifyDomainStatus: false,
    checkDomainAge: false,
    analyzeContent: false,
    industryContext: '',
    minimumCredibilityScore: 60
  };

  /**
   * Identifies authority domains from a given URL or text with comprehensive analysis
   */
  identify(
    urlOrText: string,
    options: AuthorityIdentificationOptions = {}
  ): AuthorityIdentificationResult {
    const opts = { ...this.defaultOptions, ...options };
    const identifiedDomains: AuthorityDomain[] = [];
    const lowerUrlOrText = urlOrText.toLowerCase();

    // Extract all potential domains from text
    const extractedDomains = this.extractDomainsFromText(urlOrText, opts);

    // Check against predefined authority domains
    const predefinedMatches = this.matchPredefinedDomains(lowerUrlOrText, opts);
    identifiedDomains.push(...predefinedMatches);

    // Analyze extracted domains
    for (const domain of extractedDomains) {
      const existingMatch = identifiedDomains.find(ad =>
        this.domainsMatch(ad.domain, domain, opts.includeSubdomains)
      );

      if (!existingMatch) {
        const authorityDomain = this.analyzeDomain(domain, opts);
        if (authorityDomain.credibilityScore >= opts.minimumCredibilityScore) {
          identifiedDomains.push(authorityDomain);
        }
      }
    }

    // Filter by industry context if provided
    const industrySpecificAuthorities = opts.industryContext
      ? this.filterByIndustryContext(identifiedDomains, opts.industryContext)
      : [];

    // Calculate statistics
    const highAuthorityCount = identifiedDomains.filter(d => d.credibilityScore >= 85).length;
    const mediumAuthorityCount = identifiedDomains.filter(d => d.credibilityScore >= 70 && d.credibilityScore < 85).length;
    const lowAuthorityCount = identifiedDomains.filter(d => d.credibilityScore < 70).length;

    // Generate recommendations
    const recommendations = this.generateRecommendations(identifiedDomains, opts);

    return {
      identifiedDomains: identifiedDomains.sort((a, b) => b.credibilityScore - a.credibilityScore),
      totalDomainsFound: identifiedDomains.length,
      highAuthorityCount,
      mediumAuthorityCount,
      lowAuthorityCount,
      recommendations,
      industrySpecificAuthorities
    };
  }

  /**
   * Simple identification method (backward compatibility)
   */
  identifySimple(urlOrText: string): AuthorityDomain[] {
    const result = this.identify(urlOrText);
    return result.identifiedDomains;
  }

  /**
   * Find authority domains for specific industry context
   */
  findIndustryAuthorities(industry: string): AuthorityDomain[] {
    const industryKeywords = this.getIndustryKeywords(industry);

    return this.predefinedAuthorityDomains.filter(domain => {
      const domainText = `${domain.domain} ${domain.reasoning.join(' ')} ${domain.subtype || ''}`.toLowerCase();
      return industryKeywords.some(keyword => domainText.includes(keyword));
    });
  }

  /**
   * Verify domain authority status
   */
  async verifyDomainAuthority(domain: string): Promise<AuthorityDomain | null> {
    try {
      // In a real implementation, this would call external APIs
      // For now, we'll do basic verification
      const url = domain.startsWith('http') ? domain : `https://${domain}`;
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.replace('www.', '');

      // Check against predefined domains
      const predefined = this.predefinedAuthorityDomains.find(ad =>
        hostname.includes(ad.domain) || ad.domain.includes(hostname)
      );

      if (predefined) {
        return {
          ...predefined,
          verificationDate: new Date()
        };
      }

      // Analyze unknown domain
      return this.analyzeDomain(hostname, this.defaultOptions);

    } catch (error) {
      console.error(`Error verifying domain authority for ${domain}:`, error);
      return null;
    }
  }

  // Helper methods will be added in the next chunk...
  private extractDomainsFromText(text: string, options: Required<AuthorityIdentificationOptions>): string[] {
    const domains: string[] = [];

    // Comprehensive domain regex patterns
    const patterns = [
      // Standard URLs
      /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}/g,
      // Domain mentions in text
      /\b([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+(?:com|org|net|gov|edu|mil|int|co\.uk|co\.jp|com\.au|ca|de|fr|it|es|br|in|cn|ru|jp|kr)\b/g
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const domain = match[1] || match[0];
        const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').toLowerCase();

        if (this.isValidDomain(cleanDomain) && !domains.includes(cleanDomain)) {
          domains.push(cleanDomain);
        }
      }
    });

    return domains;
  }

  private matchPredefinedDomains(text: string, options: Required<AuthorityIdentificationOptions>): AuthorityDomain[] {
    const matches: AuthorityDomain[] = [];

    this.predefinedAuthorityDomains.forEach(authDomain => {
      const domainPattern = authDomain.domain.startsWith('.')
        ? authDomain.domain.substring(1)
        : authDomain.domain;

      if (text.includes(domainPattern)) {
        matches.push({
          ...authDomain,
          verificationDate: new Date()
        });
      }
    });

    return matches;
  }

  private analyzeDomain(domain: string, options: Required<AuthorityIdentificationOptions>): AuthorityDomain {
    let type: AuthorityDomain['type'] = 'other';
    let credibilityScore = 50;
    const reasoning: string[] = ['Extracted from text/URL'];

    // TLD-based analysis
    if (domain.endsWith('.gov')) {
      type = 'government';
      credibilityScore = 95;
      reasoning.push('Government domain (.gov)');
    } else if (domain.endsWith('.edu')) {
      type = 'academic';
      credibilityScore = 85;
      reasoning.push('Educational domain (.edu)');
    } else if (domain.endsWith('.org')) {
      type = 'other';
      credibilityScore = 70;
      reasoning.push('Organization domain (.org)');
    }

    return {
      domain,
      type,
      credibilityScore,
      reasoning,
      verificationDate: new Date()
    };
  }

  private domainsMatch(domain1: string, domain2: string, includeSubdomains: boolean): boolean {
    if (domain1 === domain2) return true;
    if (includeSubdomains) {
      return domain1.includes(domain2) || domain2.includes(domain1);
    }
    return false;
  }

  private filterByIndustryContext(domains: AuthorityDomain[], industryContext: string): AuthorityDomain[] {
    const industryKeywords = this.getIndustryKeywords(industryContext);
    return domains.filter(domain => {
      const domainText = `${domain.domain} ${domain.reasoning.join(' ')}`.toLowerCase();
      return industryKeywords.some(keyword => domainText.includes(keyword));
    });
  }

  private getIndustryKeywords(industry: string): string[] {
    const industryKeywords: Record<string, string[]> = {
      'healthcare': ['health', 'medical', 'medicine', 'hospital'],
      'technology': ['tech', 'software', 'computer', 'digital'],
      'finance': ['financial', 'bank', 'investment', 'money'],
      'education': ['education', 'academic', 'university', 'school']
    };
    return industryKeywords[industry.toLowerCase()] || [];
  }

  private generateRecommendations(domains: AuthorityDomain[], options: Required<AuthorityIdentificationOptions>): string[] {
    const recommendations: string[] = [];
    if (domains.length === 0) {
      recommendations.push('No authority domains found. Consider adding references to reputable sources.');
    }
    return recommendations;
  }

  private isValidDomain(domain: string): boolean {
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return domainRegex.test(domain) && domain.length <= 253;
  }
}
