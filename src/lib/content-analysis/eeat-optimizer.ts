
export interface EEATAnalysis {
  experience: number;
  expertise: number;
  authoritativeness: number;
  trustworthiness: number;
  overallScore: number;
  details: {
    experienceMarkers: string[];
    expertiseIndicators: string[];
    authoritySignals: string[];
    trustElements: string[];
  };
  recommendations: string[];
}

export interface EEATSignal {
  type: 'experience' | 'expertise' | 'authoritativeness' | 'trustworthiness';
  text: string;
  confidence: number;
}

export class EEATOptimizer {
  private readonly experienceMarkers = [
    'In my experience',
    'I have personally',
    'Over the years',
    'From my work with',
    'Having worked on',
    'In practice',
    'Real-world application',
    'Case study',
    'Lessons learned',
    'Practical example'
  ];

  private readonly expertiseIndicators = [
    'research shows',
    'studies indicate',
    'according to experts',
    'industry standard',
    'best practice',
    'technical analysis',
    'specialized knowledge',
    'advanced technique',
    'professional methodology',
    'expert consensus'
  ];

  private readonly authorityPhrases = [
    'According to',
    'As stated by',
    'Referenced in',
    'Published by',
    'Certified by',
    'Recognized by',
    'Industry leader',
    'Authoritative source',
    'Peer-reviewed',
    'Established methodology'
  ];

  private readonly trustMarkers = [
    'It\'s important to note',
    'In full transparency',
    'To be honest',
    'Limitations include',
    'Consider that',
    'While effective',
    'Evidence suggests',
    'Verified information',
    'Factual accuracy',
    'Balanced perspective'
  ];

  analyzeEEAT(content: string): EEATAnalysis {
    const contentLower = content.toLowerCase();
    
    const experienceScore = this.assessExperienceMarkers(contentLower);
    const expertiseScore = this.evaluateExpertiseLevel(contentLower);
    const authorityScore = this.measureAuthoritySignals(contentLower);
    const trustScore = this.analyzeTrustElements(contentLower);
    
    const overallScore = this.calculateEEATScore(
      experienceScore.score,
      expertiseScore.score,
      authorityScore.score,
      trustScore.score
    );

    const recommendations = this.generateRecommendations(
      experienceScore.score,
      expertiseScore.score,
      authorityScore.score,
      trustScore.score
    );

    return {
      experience: experienceScore.score,
      expertise: expertiseScore.score,
      authoritativeness: authorityScore.score,
      trustworthiness: trustScore.score,
      overallScore,
      details: {
        experienceMarkers: experienceScore.markers,
        expertiseIndicators: expertiseScore.indicators,
        authoritySignals: authorityScore.signals,
        trustElements: trustScore.elements
      },
      recommendations
    };
  }
  
  optimizeEEAT(content: string, targetScore: number = 88): string {
    let optimizedContent = content;
    const analysis = this.analyzeEEAT(content);
    
    if (analysis.overallScore >= targetScore) {
      return optimizedContent;
    }

    // Enhance each E-E-A-T component based on current scores
    if (analysis.experience < 85) {
      optimizedContent = this.addExperienceMarkers(optimizedContent);
    }
    
    if (analysis.expertise < 90) {
      optimizedContent = this.enhanceExpertise(optimizedContent);
    }
    
    if (analysis.authoritativeness < 80) {
      optimizedContent = this.addAuthoritySignals(optimizedContent);
    }
    
    if (analysis.trustworthiness < 95) {
      optimizedContent = this.integrateTrustElements(optimizedContent);
    }
    
    return optimizedContent;
  }

  private assessExperienceMarkers(content: string): { score: number; markers: string[] } {
    const foundMarkers: string[] = [];
    let totalWeight = 0;

    // Enhanced experience markers with weighted scoring and categories
    const enhancedMarkers = [
      { phrase: 'in my experience', weight: 15, category: 'direct' },
      { phrase: 'i have personally', weight: 18, category: 'direct' },
      { phrase: 'from my work with', weight: 16, category: 'professional' },
      { phrase: 'having worked', weight: 14, category: 'professional' },
      { phrase: 'through my years of', weight: 17, category: 'temporal' },
      { phrase: 'in my practice', weight: 15, category: 'professional' },
      { phrase: 'from my time', weight: 12, category: 'temporal' },
      { phrase: 'based on my experience', weight: 16, category: 'direct' },
      { phrase: 'i have found', weight: 13, category: 'discovery' },
      { phrase: 'in my professional experience', weight: 19, category: 'professional' },
      { phrase: 'during my career', weight: 14, category: 'temporal' },
      { phrase: 'in my role as', weight: 15, category: 'professional' },
      { phrase: 'working directly with', weight: 16, category: 'hands-on' },
      { phrase: 'i have observed', weight: 12, category: 'observational' },
      { phrase: 'from my background in', weight: 14, category: 'professional' },
      { phrase: 'having implemented', weight: 17, category: 'hands-on' },
      { phrase: 'through practical application', weight: 18, category: 'hands-on' },
      { phrase: 'real-world experience shows', weight: 19, category: 'practical' },
      { phrase: 'case studies from my work', weight: 20, category: 'evidence' },
      { phrase: 'lessons learned from', weight: 15, category: 'learning' }
    ];

    // Check for enhanced experience phrases with contextual analysis
    enhancedMarkers.forEach(marker => {
      const regex = new RegExp(`\\b${marker.phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const matches = content.match(regex);
      if (matches) {
        foundMarkers.push(marker.phrase);
        totalWeight += marker.weight * matches.length;
      }
    });

    // Advanced contextual analysis
    const experienceDepthIndicators = [
      { pattern: /\b(\d+)\s+years?\s+of\s+experience\b/gi, multiplier: 2 },
      { pattern: /\bover\s+(\d+)\s+years?\b/gi, multiplier: 1.8 },
      { pattern: /\bmore\s+than\s+(\d+)\s+years?\b/gi, multiplier: 1.8 },
      { pattern: /\bdecade[s]?\s+of\s+experience\b/gi, multiplier: 2.5 },
      { pattern: /\bextensive\s+experience\b/gi, multiplier: 1.5 },
      { pattern: /\bdeep\s+experience\b/gi, multiplier: 1.6 },
      { pattern: /\bhands-on\s+experience\b/gi, multiplier: 1.7 },
      { pattern: /\bfirst-hand\s+experience\b/gi, multiplier: 1.8 }
    ];

    experienceDepthIndicators.forEach(indicator => {
      const matches = content.match(indicator.pattern);
      if (matches) {
        totalWeight += matches.length * 10 * indicator.multiplier;
        foundMarkers.push(`Experience depth indicator: ${indicator.pattern.source}`);
      }
    });

    // Check for specific experience evidence
    const evidencePatterns = [
      /\bcase\s+study\b/gi,
      /\breal\s+example\b/gi,
      /\bactual\s+results\b/gi,
      /\bmeasurable\s+outcomes\b/gi,
      /\bproven\s+track\s+record\b/gi,
      /\bsuccessful\s+implementation\b/gi
    ];

    evidencePatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        totalWeight += matches.length * 8;
        foundMarkers.push(`Evidence pattern: ${pattern.source}`);
      }
    });

    // Personal pronouns with context (more sophisticated than simple counting)
    const personalContextPatterns = [
      /\bi\s+(have|had|was|am|will)\s+\w+/gi,
      /\bmy\s+(experience|work|role|background|time)\b/gi,
      /\bwe\s+(implemented|developed|discovered|found)\b/gi
    ];

    personalContextPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        totalWeight += matches.length * 5;
      }
    });

    // Category diversity bonus
    const categories = new Set(enhancedMarkers.filter(m => foundMarkers.includes(m.phrase)).map(m => m.category));
    const diversityBonus = categories.size * 3;

    // Calculate final score with normalization
    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
    const normalizedScore = wordCount > 0 ? (totalWeight / wordCount) * 100 : 0;
    const finalScore = Math.min(100, normalizedScore + diversityBonus);

    // Penalty for overuse (appears spammy)
    const markerDensity = foundMarkers.length / wordCount;
    const penaltyFactor = markerDensity > 0.05 ? 0.8 : 1.0;

    return {
      score: Math.round(finalScore * penaltyFactor),
      markers: [...new Set(foundMarkers)] // Remove duplicates
    };
  }

  private evaluateExpertiseLevel(content: string): { score: number; indicators: string[] } {
    const foundIndicators: string[] = [];
    let totalWeight = 0;

    // Enhanced expertise indicators with weighted scoring
    const enhancedIndicators = [
      { phrase: 'research shows', weight: 16, category: 'research' },
      { phrase: 'studies indicate', weight: 17, category: 'research' },
      { phrase: 'according to experts', weight: 15, category: 'authority' },
      { phrase: 'technical analysis', weight: 18, category: 'technical' },
      { phrase: 'specialized knowledge', weight: 19, category: 'specialization' },
      { phrase: 'advanced techniques', weight: 17, category: 'technical' },
      { phrase: 'systematic approach', weight: 16, category: 'methodology' },
      { phrase: 'proven methodology', weight: 18, category: 'methodology' },
      { phrase: 'industry standards', weight: 15, category: 'standards' },
      { phrase: 'best practices', weight: 14, category: 'standards' },
      { phrase: 'comprehensive analysis', weight: 17, category: 'analysis' },
      { phrase: 'detailed examination', weight: 16, category: 'analysis' },
      { phrase: 'in-depth study', weight: 18, category: 'research' },
      { phrase: 'peer-reviewed', weight: 20, category: 'academic' },
      { phrase: 'empirical evidence', weight: 19, category: 'evidence' },
      { phrase: 'quantitative analysis', weight: 18, category: 'analysis' },
      { phrase: 'qualitative assessment', weight: 17, category: 'analysis' },
      { phrase: 'statistical significance', weight: 19, category: 'statistics' },
      { phrase: 'meta-analysis', weight: 20, category: 'research' },
      { phrase: 'longitudinal study', weight: 19, category: 'research' }
    ];

    // Check for enhanced expertise indicators
    enhancedIndicators.forEach(indicator => {
      const regex = new RegExp(`\\b${indicator.phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const matches = content.match(regex);
      if (matches) {
        foundIndicators.push(indicator.phrase);
        totalWeight += indicator.weight * matches.length;
      }
    });

    // Advanced technical terminology analysis
    const technicalComplexityPatterns = [
      { pattern: /\b[A-Z]{2,}(?:\s+[A-Z]{2,})*\b/g, weight: 5, name: 'Acronyms' }, // API, SEO, etc.
      { pattern: /\b\w{10,}\b/g, weight: 3, name: 'Complex terms' }, // Long technical words
      { pattern: /\b\w+(?:tion|sion|ment|ness|ity|ism)\b/gi, weight: 2, name: 'Abstract concepts' },
      { pattern: /\b(?:algorithm|methodology|framework|architecture|implementation)\b/gi, weight: 8, name: 'Technical concepts' }
    ];

    technicalComplexityPatterns.forEach(pattern => {
      const matches = content.match(pattern.pattern) || [];
      if (matches.length > 0) {
        totalWeight += Math.min(matches.length * pattern.weight, 30);
        foundIndicators.push(`${pattern.name}: ${matches.length} instances`);
      }
    });

    // Academic and professional credentials
    const credentialPatterns = [
      { pattern: /\b(?:PhD|Dr\.|Professor|M\.D\.|M\.S\.|B\.S\.|MBA)\b/gi, weight: 15, name: 'Academic credentials' },
      { pattern: /\b(?:certified|accredited|licensed|chartered)\b/gi, weight: 12, name: 'Professional certifications' },
      { pattern: /\b(?:fellow|member|associate)\s+(?:of|at)\b/gi, weight: 10, name: 'Professional memberships' }
    ];

    credentialPatterns.forEach(pattern => {
      const matches = content.match(pattern.pattern) || [];
      if (matches.length > 0) {
        totalWeight += matches.length * pattern.weight;
        foundIndicators.push(`${pattern.name}: ${matches.length} instances`);
      }
    });

    // Citations and references analysis
    const citationPatterns = [
      { pattern: /\[\d+\]/g, weight: 12, name: 'Numbered citations' },
      { pattern: /\(\d{4}\)/g, weight: 10, name: 'Year citations' },
      { pattern: /\bet\s+al\./gi, weight: 15, name: 'Academic citations' },
      { pattern: /\b(?:according to|as stated by|referenced in|published by)\b/gi, weight: 8, name: 'Source attributions' },
      { pattern: /\b(?:journal|study|research|paper|article)\s+(?:shows|indicates|demonstrates|reveals)\b/gi, weight: 12, name: 'Research references' }
    ];

    citationPatterns.forEach(pattern => {
      const matches = content.match(pattern.pattern) || [];
      if (matches.length > 0) {
        totalWeight += matches.length * pattern.weight;
        foundIndicators.push(`${pattern.name}: ${matches.length} instances`);
      }
    });

    // Quantitative evidence patterns
    const quantitativePatterns = [
      { pattern: /\b\d+%\b/g, weight: 6, name: 'Percentage data' },
      { pattern: /\b\d+(?:,\d{3})*(?:\.\d+)?\s*(?:million|billion|thousand)\b/gi, weight: 8, name: 'Large numbers' },
      { pattern: /\bp\s*[<>=]\s*0\.\d+/gi, weight: 12, name: 'Statistical significance' },
      { pattern: /\b(?:correlation|regression|variance|deviation|coefficient)\b/gi, weight: 10, name: 'Statistical terms' }
    ];

    quantitativePatterns.forEach(pattern => {
      const matches = content.match(pattern.pattern) || [];
      if (matches.length > 0) {
        totalWeight += matches.length * pattern.weight;
        foundIndicators.push(`${pattern.name}: ${matches.length} instances`);
      }
    });

    // Category diversity bonus
    const categories = new Set(enhancedIndicators.filter(i => foundIndicators.includes(i.phrase)).map(i => i.category));
    const diversityBonus = categories.size * 4;

    // Calculate final score with normalization
    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
    const normalizedScore = wordCount > 0 ? (totalWeight / wordCount) * 100 : 0;
    const finalScore = Math.min(100, normalizedScore + diversityBonus);

    return {
      score: Math.round(finalScore),
      indicators: [...new Set(foundIndicators)]
    };
  }

  private measureAuthoritySignals(content: string): { score: number; signals: string[] } {
    const foundSignals: string[] = [];
    let signalCount = 0;
    
    // Check for authority phrases
    this.authorityPhrases.forEach(phrase => {
      if (content.includes(phrase.toLowerCase())) {
        signalCount++;
        foundSignals.push(phrase);
      }
    });

    // Check for credible source mentions
    const credibleSources = [
      'university', 'institute', 'journal', 'research',
      'government', 'official', 'certified', 'accredited'
    ];
    
    let sourceCount = 0;
    credibleSources.forEach(source => {
      if (content.includes(source)) {
        sourceCount++;
      }
    });

    // Check for external links (simple pattern)
    const linkCount = (content.match(/https?:\/\/[^\s]+/gi) || []).length;
    
    // Calculate score
    const baseScore = signalCount * 12;
    const sourceBonus = Math.min(sourceCount * 10, 30);
    const linkBonus = Math.min(linkCount * 8, 24);
    
    const score = Math.min(100, baseScore + sourceBonus + linkBonus);
    
    return { score, signals: foundSignals };
  }

  private analyzeTrustElements(content: string): { score: number; elements: string[] } {
    const foundElements: string[] = [];
    let elementCount = 0;
    
    // Check for trust markers
    this.trustMarkers.forEach(marker => {
      if (content.includes(marker.toLowerCase())) {
        elementCount++;
        foundElements.push(marker);
      }
    });

    // Check for balanced language
    const balancedWords = [
      'however', 'although', 'while', 'consider',
      'alternatively', 'on the other hand', 'it depends'
    ];
    
    let balanceCount = 0;
    balancedWords.forEach(word => {
      if (content.includes(word)) {
        balanceCount++;
      }
    });

    // Check for transparency indicators
    const transparencyWords = (content.match(/\b(honest|transparent|clear|accurate|factual|verified)\b/gi) || []).length;
    
    // Calculate score
    const baseScore = elementCount * 15;
    const balanceBonus = Math.min(balanceCount * 12, 36);
    const transparencyBonus = Math.min(transparencyWords * 8, 24);
    
    const score = Math.min(100, baseScore + balanceBonus + transparencyBonus);
    
    return { score, elements: foundElements };
  }

  private calculateEEATScore(
    experience: number,
    expertise: number,
    authoritativeness: number,
    trustworthiness: number
  ): number {
    // Weighted average with trust being most important
    const weights = {
      experience: 0.20,
      expertise: 0.25,
      authoritativeness: 0.25,
      trustworthiness: 0.30
    };
    
    return Math.round(
      experience * weights.experience +
      expertise * weights.expertise +
      authoritativeness * weights.authoritativeness +
      trustworthiness * weights.trustworthiness
    );
  }

  private generateRecommendations(
    experience: number,
    expertise: number,
    authoritativeness: number,
    trustworthiness: number
  ): string[] {
    const recommendations: string[] = [];
    
    if (experience < 85) {
      recommendations.push('Add more personal insights and practical examples');
      recommendations.push('Include case studies or real-world applications');
    }
    
    if (expertise < 90) {
      recommendations.push('Incorporate more technical terminology and specialized knowledge');
      recommendations.push('Add citations to research or industry standards');
    }
    
    if (authoritativeness < 80) {
      recommendations.push('Reference more credible sources and authoritative publications');
      recommendations.push('Include quotes from industry experts or leaders');
    }
    
    if (trustworthiness < 95) {
      recommendations.push('Add balanced perspectives and acknowledge limitations');
      recommendations.push('Include transparency markers and factual verification');
    }
    
    return recommendations;
  }

  private addExperienceMarkers(content: string): string {
    const sentences = content.split(/(?<=[.!?])\s+/);
    const enhancedSentences = [...sentences];
    
    // Add experience markers at strategic positions
    const positions = [2, Math.floor(sentences.length / 3), Math.floor(sentences.length * 2 / 3)];
    
    positions.forEach((pos, index) => {
      if (pos < sentences.length) {
        const marker = this.experienceMarkers[index % this.experienceMarkers.length];
        enhancedSentences[pos] = `${marker}, ${enhancedSentences[pos].toLowerCase()}`;
      }
    });
    
    return enhancedSentences.join(' ');
  }

  private enhanceExpertise(content: string): string {
    const sentences = content.split(/(?<=[.!?])\s+/);
    const enhancedSentences = [...sentences];
    
    // Add expertise indicators where appropriate
    for (let i = 0; i < sentences.length; i++) {
      if (i % 4 === 0 && i > 0) {
        const indicator = this.expertiseIndicators[i % this.expertiseIndicators.length];
        enhancedSentences[i] = enhancedSentences[i].replace(
          /^([A-Z])/,
          `According to ${indicator}, $1`
        );
      }
    }
    
    return enhancedSentences.join(' ');
  }

  private addAuthoritySignals(content: string): string {
    const sentences = content.split(/(?<=[.!?])\s+/);
    const enhancedSentences = [...sentences];
    
    // Add authority references
    const authorityPositions = [1, Math.floor(sentences.length / 2), sentences.length - 2];
    
    authorityPositions.forEach((pos, index) => {
      if (pos >= 0 && pos < sentences.length) {
        const signal = this.authorityPhrases[index % this.authorityPhrases.length];
        enhancedSentences[pos] = `${signal} leading industry experts, ${enhancedSentences[pos].toLowerCase()}`;
      }
    });
    
    return enhancedSentences.join(' ');
  }

  private integrateTrustElements(content: string): string {
    const sentences = content.split(/(?<=[.!?])\s+/);
    const enhancedSentences = [...sentences];
    
    // Add trust markers throughout
    for (let i = 0; i < sentences.length; i++) {
      if (i % 5 === 0 && i > 0) {
        const marker = this.trustMarkers[i % this.trustMarkers.length];
        enhancedSentences[i] = `${marker}, ${enhancedSentences[i].toLowerCase()}`;
      }
    }
    
    // Add a balanced perspective at the end if not present
    if (!content.toLowerCase().includes('however') && sentences.length > 3) {
      enhancedSentences.push('However, it\'s important to consider individual circumstances and requirements when applying these principles.');
    }
    
    return enhancedSentences.join(' ');
  }
}
