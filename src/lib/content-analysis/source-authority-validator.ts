
export interface SourceValidationResult {
  isValid: boolean;
  authorityScore: number;
  domain: string;
  domainType: 'government' | 'educational' | 'organization' | 'commercial' | 'unknown';
  trustIndicators: {
    isHttps: boolean;
    hasAuthorityTLD: boolean;
    isWellKnown: boolean;
    hasPeerReview: boolean;
    hasEditorialProcess: boolean;
  };
  warnings: string[];
}

export interface SourceAnalysis {
  url: string;
  validation: SourceValidationResult;
  category: string;
  relevance: number;
  citations: number;
}

export interface DomainAuthority {
  domain: string;
  score: number;
  type: string;
  trustLevel: 'high' | 'medium' | 'low';
}

export class SourceAuthorityValidator {
  private readonly highAuthorityDomains: Map<string, DomainAuthority> = new Map([
    // Government domains
    ['.gov', { domain: '.gov', score: 95, type: 'government', trustLevel: 'high' }],
    ['.mil', { domain: '.mil', score: 95, type: 'government', trustLevel: 'high' }],
    
    // Educational domains
    ['.edu', { domain: '.edu', score: 90, type: 'educational', trustLevel: 'high' }],
    ['.ac.uk', { domain: '.ac.uk', score: 90, type: 'educational', trustLevel: 'high' }],
    
    // International organizations
    ['.org', { domain: '.org', score: 75, type: 'organization', trustLevel: 'medium' }],
    ['.int', { domain: '.int', score: 85, type: 'organization', trustLevel: 'high' }],
  ]);

  private readonly trustedSources: Map<string, number> = new Map([
    // Academic and research
    ['harvard.edu', 95],
    ['stanford.edu', 95],
    ['mit.edu', 95],
    ['oxford.ac.uk', 95],
    ['cambridge.org', 95],
    ['nature.com', 90],
    ['science.org', 90],
    ['sciencedirect.com', 85],
    ['springer.com', 85],
    ['wiley.com', 85],
    ['pubmed.ncbi.nlm.nih.gov', 95],
    ['scholar.google.com', 85],
    
    // News and media
    ['reuters.com', 85],
    ['apnews.com', 85],
    ['bbc.com', 85],
    ['npr.org', 85],
    ['wsj.com', 80],
    ['nytimes.com', 80],
    ['ft.com', 80],
    ['economist.com', 80],
    
    // Government and NGO
    ['who.int', 95],
    ['cdc.gov', 95],
    ['nih.gov', 95],
    ['fda.gov', 95],
    ['europa.eu', 90],
    ['un.org', 90],
    ['worldbank.org', 90],
    
    // Professional organizations
    ['ieee.org', 90],
    ['acm.org', 90],
    ['ama-assn.org', 90],
    ['apa.org', 90],
    
    // Reference sites
    ['britannica.com', 85],
    ['wikipedia.org', 75], // Lower due to open editing
    ['statista.com', 80],
    ['pewresearch.org', 85]
  ]);

  private readonly lowTrustIndicators = [
    'blogspot.com',
    'wordpress.com',
    'medium.com',
    'tumblr.com',
    'wix.com',
    'weebly.com',
    'free.fr',
    'tripod.com'
  ];

  validateSource(url: string): SourceValidationResult {
    const domain = this.extractDomain(url);
    const domainType = this.identifyDomainType(domain);
    const trustIndicators = this.analyzeTrustIndicators(url, domain);
    const authorityScore = this.calculateAuthorityScore(domain, trustIndicators);
    const warnings = this.generateWarnings(url, domain, trustIndicators);

    return {
      isValid: authorityScore >= 50 && warnings.length === 0,
      authorityScore,
      domain,
      domainType,
      trustIndicators,
      warnings
    };
  }

  validateMultipleSources(urls: string[]): {
    validSources: SourceAnalysis[];
    invalidSources: SourceAnalysis[];
    overallScore: number;
    recommendations: string[];
  } {
    const validSources: SourceAnalysis[] = [];
    const invalidSources: SourceAnalysis[] = [];
    
    urls.forEach(url => {
      const validation = this.validateSource(url);
      const analysis: SourceAnalysis = {
        url,
        validation,
        category: this.categorizeSource(validation.domain),
        relevance: this.assessRelevance(url),
        citations: this.estimateCitations(validation.domain)
      };
      
      if (validation.isValid) {
        validSources.push(analysis);
      } else {
        invalidSources.push(analysis);
      }
    });

    const overallScore = this.calculateOverallSourceQuality(validSources, invalidSources);
    const recommendations = this.generateSourceRecommendations(validSources, invalidSources);

    return {
      validSources,
      invalidSources,
      overallScore,
      recommendations
    };
  }

  scoreSourceReliability(url: string): number {
    const validation = this.validateSource(url);
    return validation.authorityScore;
  }

  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.toLowerCase();
    } catch {
      // If URL parsing fails, try to extract domain manually
      const match = url.match(/(?:https?:\/\/)?(?:www\.)?([^\/:]+)/i);
      return match ? match[1].toLowerCase() : '';
    }
  }

  private identifyDomainType(domain: string): 'government' | 'educational' | 'organization' | 'commercial' | 'unknown' {
    if (domain.endsWith('.gov') || domain.endsWith('.mil')) {
      return 'government';
    }
    if (domain.endsWith('.edu') || domain.endsWith('.ac.uk') || domain.includes('.edu.')) {
      return 'educational';
    }
    if (domain.endsWith('.org') || domain.endsWith('.int')) {
      return 'organization';
    }
    if (domain.endsWith('.com') || domain.endsWith('.net') || domain.endsWith('.biz')) {
      return 'commercial';
    }
    return 'unknown';
  }

  private analyzeTrustIndicators(url: string, domain: string): {
    isHttps: boolean;
    hasAuthorityTLD: boolean;
    isWellKnown: boolean;
    hasPeerReview: boolean;
    hasEditorialProcess: boolean;
  } {
    return {
      isHttps: url.toLowerCase().startsWith('https://'),
      hasAuthorityTLD: this.hasAuthorityTLD(domain),
      isWellKnown: this.trustedSources.has(domain),
      hasPeerReview: this.checkPeerReview(domain),
      hasEditorialProcess: this.checkEditorialProcess(domain)
    };
  }

  private hasAuthorityTLD(domain: string): boolean {
    return Array.from(this.highAuthorityDomains.keys()).some(tld => 
      domain.endsWith(tld)
    );
  }

  private checkPeerReview(domain: string): boolean {
    const peerReviewDomains = [
      'nature.com', 'science.org', 'sciencedirect.com',
      'springer.com', 'wiley.com', 'pubmed', 'arxiv.org',
      'plos.org', 'frontiersin.org', 'mdpi.com'
    ];
    
    return peerReviewDomains.some(prDomain => domain.includes(prDomain));
  }

  private checkEditorialProcess(domain: string): boolean {
    const editorialDomains = [
      'reuters.com', 'apnews.com', 'bbc.com', 'npr.org',
      'wsj.com', 'nytimes.com', 'ft.com', 'economist.com',
      'britannica.com', 'harvard.edu', 'stanford.edu'
    ];
    
    return editorialDomains.some(edDomain => domain.includes(edDomain));
  }

  private calculateAuthorityScore(
    domain: string,
    trustIndicators: any
  ): number {
    let score = 30; // Base score

    // Check if it's a known trusted source
    const trustedScore = this.trustedSources.get(domain);
    if (trustedScore) {
      return trustedScore;
    }

    // TLD authority
    if (trustIndicators.hasAuthorityTLD) {
      const tldAuthority = Array.from(this.highAuthorityDomains.entries())
        .find(([tld]) => domain.endsWith(tld));
      if (tldAuthority) {
        score = tldAuthority[1].score;
      }
    }

    // Adjust based on trust indicators
    if (!trustIndicators.isHttps) score -= 10;
    if (trustIndicators.hasPeerReview) score += 15;
    if (trustIndicators.hasEditorialProcess) score += 10;

    // Check for low trust indicators
    if (this.lowTrustIndicators.some(indicator => domain.includes(indicator))) {
      score = Math.min(score, 40);
    }

    return Math.max(0, Math.min(100, score));
  }

  private generateWarnings(url: string, domain: string, trustIndicators: any): string[] {
    const warnings: string[] = [];

    if (!trustIndicators.isHttps) {
      warnings.push('Source uses insecure HTTP connection');
    }

    if (this.lowTrustIndicators.some(indicator => domain.includes(indicator))) {
      warnings.push('Source is from a free hosting platform with limited editorial oversight');
    }

    if (domain.includes('blogspot') || domain.includes('wordpress.com')) {
      warnings.push('Personal blog - verify author credentials independently');
    }

    if (!trustIndicators.hasAuthorityTLD && !trustIndicators.isWellKnown) {
      warnings.push('Unknown source - additional verification recommended');
    }

    if (url.includes('opinion') || url.includes('blog') || url.includes('editorial')) {
      warnings.push('Opinion piece - may contain subjective views');
    }

    return warnings;
  }

  private categorizeSource(domain: string): string {
    if (this.checkPeerReview(domain)) return 'Academic/Research';
    if (domain.endsWith('.gov') || domain.endsWith('.mil')) return 'Government';
    if (domain.endsWith('.edu')) return 'Educational';
    if (this.checkEditorialProcess(domain)) return 'News/Media';
    if (domain.endsWith('.org')) return 'Organization/NGO';
    if (domain.includes('wikipedia')) return 'Reference/Wiki';
    return 'General';
  }

  private assessRelevance(url: string): number {
    // Simple relevance scoring based on URL structure
    let relevance = 50;
    
    if (url.includes('/research/') || url.includes('/study/')) relevance += 20;
    if (url.includes('/data/') || url.includes('/statistics/')) relevance += 15;
    if (url.includes('/report/') || url.includes('/analysis/')) relevance += 15;
    if (url.includes('/blog/') || url.includes('/opinion/')) relevance -= 10;
    if (url.includes('/press-release/') || url.includes('/pr/')) relevance -= 5;
    
    return Math.max(0, Math.min(100, relevance));
  }

  private estimateCitations(domain: string): number {
    // Estimate likely citation count based on domain authority
    const knownCitationRanges: Map<string, number> = new Map([
      ['nature.com', 1000],
      ['science.org', 1000],
      ['pubmed', 800],
      ['harvard.edu', 600],
      ['stanford.edu', 600],
      ['mit.edu', 600],
      ['.gov', 400],
      ['.edu', 300],
      ['wikipedia.org', 200],
      ['.org', 100]
    ]);

    for (const [key, citations] of knownCitationRanges) {
      if (domain.includes(key)) {
        return citations;
      }
    }
    
    return 50; // Default for unknown sources
  }

  private calculateOverallSourceQuality(
    validSources: SourceAnalysis[],
    invalidSources: SourceAnalysis[]
  ): number {
    if (validSources.length === 0) return 0;
    
    const totalSources = validSources.length + invalidSources.length;
    const validRatio = validSources.length / totalSources;
    
    const avgAuthorityScore = validSources.reduce((sum, source) => 
      sum + source.validation.authorityScore, 0
    ) / validSources.length;
    
    const diversityBonus = this.calculateSourceDiversity(validSources);
    
    return Math.round(validRatio * 40 + avgAuthorityScore * 0.5 + diversityBonus);
  }

  private calculateSourceDiversity(sources: SourceAnalysis[]): number {
    const categories = new Set(sources.map(s => s.category));
    const domainTypes = new Set(sources.map(s => s.validation.domainType));
    
    const categoryDiversity = Math.min(categories.size * 3, 12);
    const typeDiversity = Math.min(domainTypes.size * 2, 8);
    
    return categoryDiversity + typeDiversity;
  }

  private generateSourceRecommendations(
    validSources: SourceAnalysis[],
    invalidSources: SourceAnalysis[]
  ): string[] {
    const recommendations: string[] = [];
    
    if (validSources.length < 3) {
      recommendations.push('Add more high-authority sources to strengthen credibility');
    }
    
    const hasAcademic = validSources.some(s => s.category === 'Academic/Research');
    if (!hasAcademic) {
      recommendations.push('Include peer-reviewed academic sources for stronger authority');
    }
    
    const hasGovernment = validSources.some(s => s.validation.domainType === 'government');
    if (!hasGovernment) {
      recommendations.push('Consider adding government sources for official data');
    }
    
    if (invalidSources.length > validSources.length) {
      recommendations.push('Replace low-authority sources with more credible alternatives');
    }
    
    const avgRelevance = validSources.reduce((sum, s) => sum + s.relevance, 0) / validSources.length;
    if (avgRelevance < 70) {
      recommendations.push('Focus on sources with more relevant, specific content');
    }
    
    return recommendations;
  }
}
