
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
    let markerCount = 0;
    
    // Check for experience phrases
    this.experienceMarkers.forEach(marker => {
      if (content.includes(marker.toLowerCase())) {
        markerCount++;
        foundMarkers.push(marker);
      }
    });

    // Check for personal pronouns indicating experience
    const personalPronouns = (content.match(/\b(i|me|my|we|our)\b/gi) || []).length;
    const experienceWords = (content.match(/\b(experience|experienced|learned|discovered|found|realized)\b/gi) || []).length;
    
    // Calculate score based on density and variety
    const wordCount = content.split(/\s+/).length;
    const density = (markerCount + experienceWords) / wordCount * 100;
    const varietyBonus = Math.min(foundMarkers.length * 5, 20);
    
    const score = Math.min(100, density * 10 + varietyBonus + (personalPronouns > 0 ? 10 : 0));
    
    return { score, markers: foundMarkers };
  }

  private evaluateExpertiseLevel(content: string): { score: number; indicators: string[] } {
    const foundIndicators: string[] = [];
    let indicatorCount = 0;
    
    // Check for expertise phrases
    this.expertiseIndicators.forEach(indicator => {
      if (content.includes(indicator.toLowerCase())) {
        indicatorCount++;
        foundIndicators.push(indicator);
      }
    });

    // Check for technical terminology (simple heuristic)
    const technicalWords = content.match(/\b\w{8,}\b/g) || [];
    const technicalDensity = technicalWords.length / content.split(/\s+/).length * 100;
    
    // Check for citations or references
    const citations = (content.match(/\[\d+\]|\(\d{4}\)|et al\.|PhD|Dr\.|Professor/gi) || []).length;
    
    // Calculate score
    const baseScore = indicatorCount * 15;
    const techBonus = Math.min(technicalDensity * 5, 25);
    const citationBonus = Math.min(citations * 10, 30);
    
    const score = Math.min(100, baseScore + techBonus + citationBonus);
    
    return { score, indicators: foundIndicators };
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
