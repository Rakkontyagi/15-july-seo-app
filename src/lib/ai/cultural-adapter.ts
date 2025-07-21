
import { logger } from '../logging/logger';
import { ApplicationError, ErrorType, ErrorSeverity } from '../errors/types';

export interface CulturalAdaptationResult {
  culturalRelevanceScore: number; // 0-100
  appropriatenessIssues: string[];
  localMarketAdaptationSuggestions: string[];
  culturalSensitivityIssues: string[];
  complianceIssues: string[];
  recommendations: string[];
  linguisticAnalysis: LinguisticAnalysis;
  marketContext: MarketContext;
}

export interface LinguisticAnalysis {
  formalityLevel: number; // 0-100
  directnessScore: number; // 0-100
  culturalTerms: string[];
  problematicPhrases: string[];
  suggestedReplacements: { [key: string]: string };
}

export interface MarketContext {
  businessCulture: string;
  communicationStyle: string;
  decisionMakingStyle: string;
  relationshipImportance: string;
  timeOrientation: string;
}

export interface CulturalProfile {
  region: string;
  powerDistance: number; // 0-100
  individualismScore: number; // 0-100
  uncertaintyAvoidance: number; // 0-100
  masculinityScore: number; // 0-100
  longTermOrientation: number; // 0-100
  indulgenceScore: number; // 0-100
  communicationContext: 'high' | 'low';
  businessEtiquette: string[];
  tabooTopics: string[];
  preferredTone: string[];
  complianceRequirements: string[];
}

export class CulturalAdapter {
  private culturalProfiles: Map<string, CulturalProfile> = new Map();
  private linguisticPatterns: Map<string, RegExp[]> = new Map();

  constructor() {
    this.initializeCulturalProfiles();
    this.initializeLinguisticPatterns();
  }

  /**
   * Assesses and provides comprehensive cultural adaptation recommendations.
   * Uses advanced cultural intelligence models and linguistic analysis.
   * @param content The content to adapt.
   * @param region The target geographic region (e.g., "UAE", "UK", "US").
   * @param tone The intended tone of the content.
   * @returns Comprehensive cultural adaptation analysis and recommendations.
   */
  adaptContentCulturally(content: string, region: string, tone: string): CulturalAdaptationResult {
    try {
      // Input validation
      this.validateInputs(content, region, tone);

      const appropriatenessIssues: string[] = [];
      const localMarketAdaptationSuggestions: string[] = [];
      const culturalSensitivityIssues: string[] = [];
      const complianceIssues: string[] = [];
      const recommendations: string[] = [];
      let culturalRelevanceScore = 100;

      const normalizedRegion = region.toLowerCase();
      const culturalProfile = this.getCulturalProfile(normalizedRegion);

      // Perform linguistic analysis
      const linguisticAnalysis = this.analyzeLinguistics(content, culturalProfile);

      // Get market context
      const marketContext = this.getMarketContext(culturalProfile);

      // Analyze cultural appropriateness
      const appropriatenessAnalysis = this.analyzeCulturalAppropriateness(
        content,
        culturalProfile,
        tone
      );

      appropriatenessIssues.push(...appropriatenessAnalysis.issues);
      culturalSensitivityIssues.push(...appropriatenessAnalysis.sensitivityIssues);
      culturalRelevanceScore -= appropriatenessAnalysis.scoreDeduction;

      // Analyze tone appropriateness
      const toneAnalysis = this.analyzeToneAppropriateness(tone, culturalProfile);
      recommendations.push(...toneAnalysis.recommendations);
      culturalRelevanceScore -= toneAnalysis.scoreDeduction;

      // Generate market-specific suggestions
      const marketSuggestions = this.generateMarketSuggestions(culturalProfile);
      localMarketAdaptationSuggestions.push(...marketSuggestions);

      // Add compliance requirements
      complianceIssues.push(...culturalProfile.complianceRequirements);

      // Generate final recommendations
      const finalRecommendations = this.generateFinalRecommendations(
        content,
        culturalProfile,
        linguisticAnalysis
      );
      recommendations.push(...finalRecommendations);

      // Check for global references and reduce score
      if (content.toLowerCase().includes('global') && !culturalProfile.region.toLowerCase().includes('global')) {
        culturalRelevanceScore -= 5;
      }

      return {
        culturalRelevanceScore: Math.max(0, Math.min(100, culturalRelevanceScore)),
        appropriatenessIssues,
        localMarketAdaptationSuggestions,
        culturalSensitivityIssues,
        complianceIssues,
        recommendations,
        linguisticAnalysis,
        marketContext,
      };

    } catch (error) {
      logger.error('Cultural adaptation failed', { error, region, contentLength: content?.length });

      // Return fallback result
      return this.getFallbackResult(content, region, tone);
    }
  }

  /**
   * Initialize cultural profiles for different regions
   */
  private initializeCulturalProfiles(): void {
    // UAE Cultural Profile
    this.culturalProfiles.set('uae', {
      region: 'UAE',
      powerDistance: 90,
      individualismScore: 25,
      uncertaintyAvoidance: 80,
      masculinityScore: 50,
      longTermOrientation: 85,
      indulgenceScore: 45,
      communicationContext: 'high',
      businessEtiquette: [
        'Use formal titles and respectful language',
        'Avoid direct confrontation',
        'Show respect for hierarchy',
        'Be patient with decision-making processes'
      ],
      tabooTopics: ['alcohol', 'pork', 'gambling', 'inappropriate relationships'],
      preferredTone: ['formal', 'respectful', 'professional', 'diplomatic'],
      complianceRequirements: [
        'Adhere to UAE advertising standards',
        'Respect Islamic cultural values',
        'Comply with local content regulations',
        'Follow UAE Data Protection Law'
      ]
    });

    // UK Cultural Profile
    this.culturalProfiles.set('uk', {
      region: 'UK',
      powerDistance: 35,
      individualismScore: 89,
      uncertaintyAvoidance: 35,
      masculinityScore: 66,
      longTermOrientation: 51,
      indulgenceScore: 69,
      communicationContext: 'low',
      businessEtiquette: [
        'Use understated language',
        'Avoid excessive enthusiasm',
        'Value punctuality and preparation',
        'Respect queuing and social order'
      ],
      tabooTopics: ['personal income', 'age', 'weight', 'politics in casual settings'],
      preferredTone: ['professional', 'understated', 'factual', 'polite'],
      complianceRequirements: [
        'Comply with UK advertising codes (ASA)',
        'Follow GDPR data protection rules',
        'Adhere to consumer protection laws',
        'Respect broadcasting standards'
      ]
    });

    // US Cultural Profile
    this.culturalProfiles.set('us', {
      region: 'US',
      powerDistance: 40,
      individualismScore: 91,
      uncertaintyAvoidance: 46,
      masculinityScore: 62,
      longTermOrientation: 26,
      indulgenceScore: 68,
      communicationContext: 'low',
      businessEtiquette: [
        'Be direct and straightforward',
        'Focus on individual achievements',
        'Emphasize efficiency and results',
        'Use confident language'
      ],
      tabooTopics: ['personal finances', 'politics in business', 'religion in workplace'],
      preferredTone: ['direct', 'confident', 'benefit-focused', 'action-oriented'],
      complianceRequirements: [
        'Adhere to FTC advertising guidelines',
        'Follow CCPA privacy regulations',
        'Comply with ADA accessibility standards',
        'Respect trademark and copyright laws'
      ]
    });

    // Australia Cultural Profile
    this.culturalProfiles.set('australia', {
      region: 'Australia',
      powerDistance: 36,
      individualismScore: 90,
      uncertaintyAvoidance: 51,
      masculinityScore: 61,
      longTermOrientation: 21,
      indulgenceScore: 71,
      communicationContext: 'low',
      businessEtiquette: [
        'Use casual but professional tone',
        'Value authenticity and honesty',
        'Avoid pretentious language',
        'Embrace humor when appropriate'
      ],
      tabooTopics: ['personal income', 'immigration politics', 'indigenous issues without sensitivity'],
      preferredTone: ['casual', 'friendly', 'authentic', 'straightforward'],
      complianceRequirements: [
        'Follow Australian Consumer Law',
        'Comply with Privacy Act 1988',
        'Adhere to ACMA broadcasting standards',
        'Respect Australian Competition and Consumer Act'
      ]
    });

    // Add aliases
    this.culturalProfiles.set('united arab emirates', this.culturalProfiles.get('uae')!);
    this.culturalProfiles.set('united kingdom', this.culturalProfiles.get('uk')!);
    this.culturalProfiles.set('united states', this.culturalProfiles.get('us')!);
    this.culturalProfiles.set('au', this.culturalProfiles.get('australia')!);
  }

  /**
   * Initialize linguistic patterns for different regions
   */
  private initializeLinguisticPatterns(): void {
    // Formal language patterns
    this.linguisticPatterns.set('formal', [
      /\b(please|kindly|would you|could you)\b/gi,
      /\b(respectfully|humbly|graciously)\b/gi,
      /\b(we are pleased to|we are honored to)\b/gi
    ]);

    // Casual language patterns
    this.linguisticPatterns.set('casual', [
      /\b(hey|hi there|what's up|awesome|cool)\b/gi,
      /\b(gonna|wanna|gotta|kinda)\b/gi,
      /[!]{2,}/g // Multiple exclamation marks
    ]);

    // Direct language patterns
    this.linguisticPatterns.set('direct', [
      /\b(you should|you must|you need to)\b/gi,
      /\b(buy now|act now|don't wait)\b/gi,
      /\b(guaranteed|promise|definitely)\b/gi
    ]);
  }

  /**
   * Validate inputs for cultural adaptation
   */
  private validateInputs(content: string, region: string, tone: string): void {
    if (content === null || content === undefined) {
      throw new ApplicationError('Content is required for cultural adaptation', {
        type: ErrorType.VALIDATION_ERROR,
        severity: ErrorSeverity.MEDIUM
      });
    }

    if (!region || region.trim().length === 0) {
      throw new ApplicationError('Region is required for cultural adaptation', {
        type: ErrorType.VALIDATION_ERROR,
        severity: ErrorSeverity.MEDIUM
      });
    }

    if (!tone || tone.trim().length === 0) {
      throw new ApplicationError('Tone is required for cultural adaptation', {
        type: ErrorType.VALIDATION_ERROR,
        severity: ErrorSeverity.MEDIUM
      });
    }

    // Check for extremely long content
    if (content.length > 50000) {
      logger.warn('Content is very long for cultural adaptation', { length: content.length });
    }
  }

  /**
   * Get cultural profile for a region
   */
  private getCulturalProfile(region: string): CulturalProfile {
    const profile = this.culturalProfiles.get(region);
    if (profile) {
      return profile;
    }

    // Return default profile for unknown regions
    return {
      region: 'Default',
      powerDistance: 50,
      individualismScore: 50,
      uncertaintyAvoidance: 50,
      masculinityScore: 50,
      longTermOrientation: 50,
      indulgenceScore: 50,
      communicationContext: 'low',
      businessEtiquette: ['Use professional language', 'Be respectful and courteous'],
      tabooTopics: [],
      preferredTone: ['professional', 'neutral'],
      complianceRequirements: ['Follow general business ethics', 'Respect local laws and regulations']
    };
  }

  /**
   * Analyze linguistics of content
   */
  private analyzeLinguistics(content: string, profile: CulturalProfile): LinguisticAnalysis {
    const formalityLevel = this.calculateFormalityLevel(content);
    const directnessScore = this.calculateDirectnessScore(content);
    const culturalTerms = this.extractCulturalTerms(content, profile);
    const problematicPhrases = this.findProblematicPhrases(content, profile);
    const suggestedReplacements = this.generateReplacements(problematicPhrases, profile);

    return {
      formalityLevel,
      directnessScore,
      culturalTerms,
      problematicPhrases,
      suggestedReplacements
    };
  }

  /**
   * Get market context for a cultural profile
   */
  private getMarketContext(profile: CulturalProfile): MarketContext {
    return {
      businessCulture: this.getBusinessCultureDescription(profile),
      communicationStyle: profile.communicationContext === 'high' ? 'Indirect, context-dependent' : 'Direct, explicit',
      decisionMakingStyle: profile.powerDistance > 60 ? 'Hierarchical, top-down' : 'Collaborative, consensus-based',
      relationshipImportance: profile.individualismScore < 50 ? 'High - relationships crucial' : 'Medium - task-focused',
      timeOrientation: profile.longTermOrientation > 60 ? 'Long-term planning focus' : 'Short-term results focus'
    };
  }

  /**
   * Analyze cultural appropriateness
   */
  private analyzeCulturalAppropriateness(content: string, profile: CulturalProfile, tone: string): {
    issues: string[];
    sensitivityIssues: string[];
    scoreDeduction: number;
  } {
    const issues: string[] = [];
    const sensitivityIssues: string[] = [];
    let scoreDeduction = 0;

    const lowerContent = content.toLowerCase();

    // Check for taboo topics
    profile.tabooTopics.forEach(topic => {
      if (lowerContent.includes(topic.toLowerCase())) {
        sensitivityIssues.push(`Content mentions sensitive topic: ${topic}`);
        issues.push(`Content may not be appropriate due to cultural norms regarding ${topic}`);
        scoreDeduction += 15;
      }
    });

    // Check for cultural mismatches
    if (profile.communicationContext === 'high' && this.calculateDirectnessScore(content) > 70) {
      issues.push('Content is too direct for high-context culture');
      scoreDeduction += 10;
    }

    if (profile.powerDistance > 70 && lowerContent.includes('challenge authority')) {
      issues.push('Content may conflict with hierarchical cultural values');
      scoreDeduction += 12;
    }

    return { issues, sensitivityIssues, scoreDeduction };
  }

  /**
   * Analyze tone appropriateness
   */
  private analyzeToneAppropriateness(tone: string, profile: CulturalProfile): {
    recommendations: string[];
    scoreDeduction: number;
  } {
    const recommendations: string[] = [];
    let scoreDeduction = 0;

    const lowerTone = tone.toLowerCase();

    if (!profile.preferredTone.some(preferred => lowerTone.includes(preferred.toLowerCase()))) {
      recommendations.push(`Consider using a ${profile.preferredTone.join(' or ')} tone for ${profile.region} market`);
      scoreDeduction += 8;
    }

    // Specific tone recommendations
    if (profile.region === 'UAE' && (lowerTone.includes('casual') || lowerTone.includes('humorous'))) {
      recommendations.push('Consider a more formal and respectful tone for the Middle Eastern market');
      scoreDeduction += 10;
    }

    if (profile.region === 'UK' && (lowerTone.includes('enthusiastic') || lowerTone.includes('aggressive'))) {
      recommendations.push('Adopt a more understated and pragmatic tone for the UK market');
      scoreDeduction += 8;
    }

    if (profile.region === 'US' && (lowerTone.includes('very formal') || lowerTone.includes('reserved'))) {
      recommendations.push('Consider a more direct and benefit-driven tone for the US market');
      scoreDeduction += 6;
    }

    return { recommendations, scoreDeduction };
  }

  /**
   * Generate market-specific suggestions
   */
  private generateMarketSuggestions(profile: CulturalProfile): string[] {
    const suggestions: string[] = [];

    switch (profile.region) {
      case 'UAE':
        suggestions.push(
          'Inclusion of Arabic keywords alongside English',
          'Emphasis on family values and community benefits',
          'Use of formal titles and respectful language',
          'Consider local business listings and directories',
          'Highlight premium quality and luxury aspects'
        );
        break;
      case 'UK':
        suggestions.push(
          'British English spelling and terminology',
          'Focus on factual information and less on hyperbole',
          'Emphasize value for money and practical benefits',
          'Include testimonials and social proof',
          'Consider seasonal and weather-related context'
        );
        break;
      case 'US':
        suggestions.push(
          'American English spelling and terminology',
          'Emphasize individual benefits and clear calls to action',
          'Use confident and direct language',
          'Highlight competitive advantages',
          'Include urgency and scarcity elements'
        );
        break;
      case 'Australia':
        suggestions.push(
          'Australian English spelling and slang',
          'Maintain a friendly, approachable tone',
          'Emphasize authenticity and genuine value',
          'Use conversational language',
          'Include local references and context'
        );
        break;
      default:
        suggestions.push(
          'Standard SEO optimization techniques',
          'Professional and neutral tone',
          'Clear value propositions',
          'Accessible language for global audience'
        );
    }

    return suggestions;
  }

  /**
   * Generate final recommendations
   */
  private generateFinalRecommendations(
    content: string,
    profile: CulturalProfile,
    linguisticAnalysis: LinguisticAnalysis
  ): string[] {
    const recommendations: string[] = [];

    // Formality recommendations
    if (profile.communicationContext === 'high' && linguisticAnalysis.formalityLevel < 60) {
      recommendations.push('Increase formality level to match cultural expectations');
    }

    // Directness recommendations
    if (profile.communicationContext === 'high' && linguisticAnalysis.directnessScore > 70) {
      recommendations.push('Use more indirect communication style');
    }

    // Global reference localization
    if (content.toLowerCase().includes('global') && !profile.region.toLowerCase().includes('global')) {
      recommendations.push('Localize global references to be more relevant to the target region');
    }

    // Add linguistic replacements
    Object.keys(linguisticAnalysis.suggestedReplacements).forEach(phrase => {
      recommendations.push(`Replace "${phrase}" with "${linguisticAnalysis.suggestedReplacements[phrase]}"`);
    });

    return recommendations;
  }

  /**
   * Calculate formality level of content
   */
  private calculateFormalityLevel(content: string): number {
    let score = 50; // Base score

    const formalPatterns = this.linguisticPatterns.get('formal') || [];
    const casualPatterns = this.linguisticPatterns.get('casual') || [];

    // Count formal patterns
    formalPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        score += matches.length * 5;
      }
    });

    // Subtract for casual patterns
    casualPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        score -= matches.length * 8;
      }
    });

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate directness score of content
   */
  private calculateDirectnessScore(content: string): number {
    let score = 50; // Base score

    const directPatterns = this.linguisticPatterns.get('direct') || [];

    // Count direct patterns
    directPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        score += matches.length * 10;
      }
    });

    // Check for hedging language (reduces directness)
    const hedgingPatterns = [
      /\b(might|could|perhaps|possibly|maybe)\b/gi,
      /\b(we believe|we think|it seems)\b/gi
    ];

    hedgingPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        score -= matches.length * 5;
      }
    });

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Extract cultural terms from content
   */
  private extractCulturalTerms(content: string, profile: CulturalProfile): string[] {
    const terms: string[] = [];
    const lowerContent = content.toLowerCase();

    // Look for region-specific terms
    const regionTerms = {
      'uae': ['dubai', 'abu dhabi', 'emirates', 'gulf', 'middle east', 'arabic'],
      'uk': ['britain', 'british', 'england', 'scotland', 'wales', 'london'],
      'us': ['america', 'american', 'usa', 'states', 'federal'],
      'australia': ['aussie', 'oz', 'australian', 'sydney', 'melbourne']
    };

    const relevantTerms = regionTerms[profile.region.toLowerCase() as keyof typeof regionTerms] || [];

    relevantTerms.forEach(term => {
      if (lowerContent.includes(term)) {
        terms.push(term);
      }
    });

    return terms;
  }

  /**
   * Find problematic phrases in content
   */
  private findProblematicPhrases(content: string, profile: CulturalProfile): string[] {
    const phrases: string[] = [];
    const lowerContent = content.toLowerCase();

    // Check for taboo topics
    profile.tabooTopics.forEach(topic => {
      if (lowerContent.includes(topic.toLowerCase())) {
        phrases.push(topic);
      }
    });

    // Check for culturally inappropriate phrases
    const inappropriatePatterns = {
      'uae': ['cheap', 'bargain', 'discount', 'party'],
      'uk': ['amazing', 'incredible', 'fantastic', 'awesome'],
      'us': ['humble', 'modest', 'perhaps', 'might consider']
    };

    const patterns = inappropriatePatterns[profile.region.toLowerCase() as keyof typeof inappropriatePatterns] || [];

    patterns.forEach(pattern => {
      if (lowerContent.includes(pattern)) {
        phrases.push(pattern);
      }
    });

    return phrases;
  }

  /**
   * Generate replacement suggestions
   */
  private generateReplacements(phrases: string[], profile: CulturalProfile): { [key: string]: string } {
    const replacements: { [key: string]: string } = {};

    const replacementMap = {
      'uae': {
        'cheap': 'affordable',
        'bargain': 'value',
        'discount': 'special offer',
        'party': 'celebration'
      },
      'uk': {
        'amazing': 'excellent',
        'incredible': 'remarkable',
        'fantastic': 'very good',
        'awesome': 'impressive'
      },
      'us': {
        'humble': 'proud',
        'modest': 'confident',
        'perhaps': 'definitely',
        'might consider': 'should choose'
      }
    };

    const regionReplacements = replacementMap[profile.region.toLowerCase() as keyof typeof replacementMap] || {};

    phrases.forEach(phrase => {
      if (regionReplacements[phrase]) {
        replacements[phrase] = regionReplacements[phrase];
      }
    });

    return replacements;
  }

  /**
   * Get business culture description
   */
  private getBusinessCultureDescription(profile: CulturalProfile): string {
    if (profile.powerDistance > 70) {
      return 'Hierarchical with clear authority structures';
    } else if (profile.individualismScore > 70) {
      return 'Individual achievement and personal responsibility focused';
    } else {
      return 'Collaborative with emphasis on group harmony';
    }
  }

  /**
   * Get fallback result when adaptation fails
   */
  private getFallbackResult(content: string, region: string, tone: string): CulturalAdaptationResult {
    return {
      culturalRelevanceScore: 70,
      appropriatenessIssues: [],
      localMarketAdaptationSuggestions: [
        'Follow general SEO best practices and maintain professional tone',
        'Consider local market research for specific cultural adaptations',
        'Use neutral, professional language suitable for global audiences'
      ],
      culturalSensitivityIssues: [],
      complianceIssues: ['Follow local laws and regulations', 'Adhere to general business ethics'],
      recommendations: ['Consider consulting with local cultural experts for specific market insights'],
      linguisticAnalysis: {
        formalityLevel: 50,
        directnessScore: 50,
        culturalTerms: [],
        problematicPhrases: [],
        suggestedReplacements: {}
      },
      marketContext: {
        businessCulture: 'Professional and neutral',
        communicationStyle: 'Direct and clear',
        decisionMakingStyle: 'Collaborative',
        relationshipImportance: 'Medium',
        timeOrientation: 'Balanced'
      }
    };
  }
}
