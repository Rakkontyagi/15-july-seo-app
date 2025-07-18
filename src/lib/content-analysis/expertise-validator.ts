
export interface ExpertiseValidationResult {
  isValid: boolean;
  score: number;
  details: {
    technicalAccuracy: number;
    specializedKnowledge: number;
    industryTerminology: number;
    conceptDepth: number;
  };
  issues: string[];
  recommendations: string[];
}

export interface TechnicalTerm {
  term: string;
  complexity: 'basic' | 'intermediate' | 'advanced';
  category: string;
}

export class ExpertiseValidator {
  private readonly technicalTermDatabase: Map<string, TechnicalTerm[]> = new Map([
    ['seo', [
      { term: 'serp', complexity: 'basic', category: 'seo' },
      { term: 'backlink', complexity: 'basic', category: 'seo' },
      { term: 'pagerank', complexity: 'intermediate', category: 'seo' },
      { term: 'crawl budget', complexity: 'intermediate', category: 'seo' },
      { term: 'topical authority', complexity: 'advanced', category: 'seo' },
      { term: 'entity optimization', complexity: 'advanced', category: 'seo' },
      { term: 'schema markup', complexity: 'intermediate', category: 'seo' },
      { term: 'canonical url', complexity: 'intermediate', category: 'seo' },
      { term: 'hreflang', complexity: 'advanced', category: 'seo' },
      { term: 'core web vitals', complexity: 'intermediate', category: 'seo' }
    ]],
    ['technology', [
      { term: 'api', complexity: 'basic', category: 'technology' },
      { term: 'algorithm', complexity: 'basic', category: 'technology' },
      { term: 'machine learning', complexity: 'intermediate', category: 'technology' },
      { term: 'neural network', complexity: 'advanced', category: 'technology' },
      { term: 'microservices', complexity: 'intermediate', category: 'technology' },
      { term: 'containerization', complexity: 'intermediate', category: 'technology' },
      { term: 'distributed systems', complexity: 'advanced', category: 'technology' },
      { term: 'quantum computing', complexity: 'advanced', category: 'technology' }
    ]],
    ['marketing', [
      { term: 'roi', complexity: 'basic', category: 'marketing' },
      { term: 'conversion rate', complexity: 'basic', category: 'marketing' },
      { term: 'attribution modeling', complexity: 'intermediate', category: 'marketing' },
      { term: 'customer lifetime value', complexity: 'intermediate', category: 'marketing' },
      { term: 'predictive analytics', complexity: 'advanced', category: 'marketing' },
      { term: 'cohort analysis', complexity: 'advanced', category: 'marketing' }
    ]]
  ]);

  private readonly conceptDepthIndicators = [
    'fundamentally', 'essentially', 'specifically', 'technically',
    'architecturally', 'systematically', 'holistically', 'comprehensively'
  ];

  private readonly accuracyIndicators = [
    'precisely', 'accurately', 'correctly', 'definitively',
    'scientifically', 'empirically', 'statistically', 'demonstrably'
  ];

  validateExpertise(content: string, industry?: string): ExpertiseValidationResult {
    const technicalAccuracy = this.validateTechnicalAccuracy(content);
    const specializedKnowledge = this.validateSpecializedKnowledge(content, industry);
    const industryTerminology = this.validateIndustryTerminology(content, industry);
    const conceptDepth = this.assessConceptDepth(content);

    const averageScore = (technicalAccuracy + specializedKnowledge + industryTerminology + conceptDepth) / 4;
    const isValid = averageScore >= 70; // 70% threshold for expertise validation

    const issues = this.identifyExpertiseIssues({
      technicalAccuracy,
      specializedKnowledge,
      industryTerminology,
      conceptDepth
    });

    const recommendations = this.generateExpertiseRecommendations({
      technicalAccuracy,
      specializedKnowledge,
      industryTerminology,
      conceptDepth
    });

    return {
      isValid,
      score: averageScore,
      details: {
        technicalAccuracy,
        specializedKnowledge,
        industryTerminology,
        conceptDepth
      },
      issues,
      recommendations
    };
  }

  validateTechnicalAccuracy(content: string): number {
    const contentLower = content.toLowerCase();
    let score = 50; // Base score

    // Check for accuracy indicators
    let accuracyCount = 0;
    this.accuracyIndicators.forEach(indicator => {
      if (contentLower.includes(indicator)) {
        accuracyCount++;
      }
    });
    score += Math.min(accuracyCount * 5, 20);

    // Check for data/statistics mentions
    const hasStatistics = /\d+%|\d+\s*(percent|studies|research|data)/gi.test(content);
    if (hasStatistics) score += 10;

    // Check for source citations
    const hasCitations = /according to|research by|study by|\(\d{4}\)|\[\d+\]/gi.test(content);
    if (hasCitations) score += 10;

    // Check for methodological mentions
    const hasMethodology = /methodology|framework|process|system|approach/gi.test(content);
    if (hasMethodology) score += 10;

    return Math.min(score, 100);
  }

  validateSpecializedKnowledge(content: string, industry?: string): number {
    const contentLower = content.toLowerCase();
    let score = 40; // Base score

    // Count specialized terms based on industry
    const relevantTerms = industry ? this.technicalTermDatabase.get(industry.toLowerCase()) || [] : 
                         Array.from(this.technicalTermDatabase.values()).flat();

    let basicTerms = 0;
    let intermediateTerms = 0;
    let advancedTerms = 0;

    relevantTerms.forEach(termObj => {
      if (contentLower.includes(termObj.term.toLowerCase())) {
        switch (termObj.complexity) {
          case 'basic':
            basicTerms++;
            break;
          case 'intermediate':
            intermediateTerms++;
            break;
          case 'advanced':
            advancedTerms++;
            break;
        }
      }
    });

    // Score based on term complexity
    score += Math.min(basicTerms * 3, 15);
    score += Math.min(intermediateTerms * 5, 25);
    score += Math.min(advancedTerms * 8, 20);

    return Math.min(score, 100);
  }

  validateIndustryTerminology(content: string, industry?: string): number {
    const contentLower = content.toLowerCase();
    const words = contentLower.split(/\s+/);
    let score = 50; // Base score

    // Industry-specific terminology density
    const relevantTerms = industry ? this.technicalTermDatabase.get(industry.toLowerCase()) || [] : 
                         Array.from(this.technicalTermDatabase.values()).flat();

    const termCount = relevantTerms.filter(termObj => 
      contentLower.includes(termObj.term.toLowerCase())
    ).length;

    const termDensity = (termCount / words.length) * 100;
    score += Math.min(termDensity * 10, 30);

    // Check for jargon consistency
    const hasConsistentTerminology = this.checkTerminologyConsistency(content);
    if (hasConsistentTerminology) score += 20;

    return Math.min(score, 100);
  }

  private assessConceptDepth(content: string): number {
    const contentLower = content.toLowerCase();
    let score = 40; // Base score

    // Check for concept depth indicators
    let depthCount = 0;
    this.conceptDepthIndicators.forEach(indicator => {
      if (contentLower.includes(indicator)) {
        depthCount++;
      }
    });
    score += Math.min(depthCount * 8, 32);

    // Check for explanatory patterns
    const hasExplanations = /this means|in other words|essentially|fundamentally|the reason/gi.test(content);
    if (hasExplanations) score += 15;

    // Check for cause-effect relationships
    const hasCauseEffect = /because|therefore|consequently|as a result|this leads to/gi.test(content);
    if (hasCauseEffect) score += 13;

    return Math.min(score, 100);
  }

  private checkTerminologyConsistency(content: string): boolean {
    // Simple check for consistent use of terms
    // In a real implementation, this would be more sophisticated
    const sentences = content.split(/[.!?]/);
    const termUsage = new Map<string, number>();

    sentences.forEach(sentence => {
      const words = sentence.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.length > 6) { // Consider longer words as potential terms
          termUsage.set(word, (termUsage.get(word) || 0) + 1);
        }
      });
    });

    // If important terms are used multiple times, consider it consistent
    const consistentTerms = Array.from(termUsage.values()).filter(count => count >= 2).length;
    return consistentTerms >= 3;
  }

  private identifyExpertiseIssues(scores: {
    technicalAccuracy: number;
    specializedKnowledge: number;
    industryTerminology: number;
    conceptDepth: number;
  }): string[] {
    const issues: string[] = [];

    if (scores.technicalAccuracy < 70) {
      issues.push('Insufficient technical accuracy - needs more precise language and citations');
    }
    if (scores.specializedKnowledge < 70) {
      issues.push('Limited specialized knowledge demonstrated - add more advanced concepts');
    }
    if (scores.industryTerminology < 70) {
      issues.push('Weak industry terminology usage - incorporate more professional terms');
    }
    if (scores.conceptDepth < 70) {
      issues.push('Shallow concept exploration - provide deeper analysis and explanations');
    }

    return issues;
  }

  private generateExpertiseRecommendations(scores: {
    technicalAccuracy: number;
    specializedKnowledge: number;
    industryTerminology: number;
    conceptDepth: number;
  }): string[] {
    const recommendations: string[] = [];

    if (scores.technicalAccuracy < 90) {
      recommendations.push('Add statistical data and research citations to support claims');
      recommendations.push('Use more precise technical language and accuracy indicators');
    }
    if (scores.specializedKnowledge < 90) {
      recommendations.push('Incorporate advanced industry concepts and methodologies');
      recommendations.push('Demonstrate deeper understanding through technical examples');
    }
    if (scores.industryTerminology < 90) {
      recommendations.push('Increase usage of industry-specific terminology');
      recommendations.push('Ensure consistent application of professional vocabulary');
    }
    if (scores.conceptDepth < 90) {
      recommendations.push('Provide more comprehensive explanations of complex topics');
      recommendations.push('Include cause-effect relationships and systematic analysis');
    }

    return recommendations;
  }
}
