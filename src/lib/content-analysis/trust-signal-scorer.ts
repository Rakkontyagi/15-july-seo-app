
import { EEATOptimizer, EEATAnalysis } from './eeat-optimizer';
import { ExpertiseValidator, ExpertiseValidationResult } from './expertise-validator';
import { AuthoritativenessEnhancer } from './authoritativeness-enhancer';
import { TrustworthinessIntegrator } from './trustworthiness-integrator';
import { CredibilityMarkerInjector } from './credibility-marker-injector';
import { SourceAuthorityValidator } from './source-authority-validator';

export interface TrustSignalScore {
  overallScore: number;
  eeatCompliance: {
    experience: number;
    expertise: number;
    authoritativeness: number;
    trustworthiness: number;
  };
  signalStrength: {
    credibilityMarkers: number;
    sourceAuthority: number;
    transparencyLevel: number;
    balancedPerspective: number;
  };
  qualityMetrics: {
    contentDepth: number;
    factualAccuracy: number;
    professionalTone: number;
    userValue: number;
  };
  opportunities: EnhancementOpportunity[];
  recommendations: string[];
}

export interface EnhancementOpportunity {
  category: 'experience' | 'expertise' | 'authoritativeness' | 'trustworthiness';
  priority: 'high' | 'medium' | 'low';
  description: string;
  expectedImpact: number;
  implementation: string;
}

export interface ContentTrustAnalysis {
  score: TrustSignalScore;
  strengths: string[];
  weaknesses: string[];
  competitiveComparison?: {
    industryAverage: number;
    topPerformer: number;
    yourScore: number;
  };
}

export class TrustSignalScorer {
  private eeatOptimizer: EEATOptimizer;
  private expertiseValidator: ExpertiseValidator;
  private authoritativenessEnhancer: AuthoritativenessEnhancer;
  private trustworthinessIntegrator: TrustworthinessIntegrator;
  private credibilityInjector: CredibilityMarkerInjector;
  private sourceValidator: SourceAuthorityValidator;

  constructor() {
    this.eeatOptimizer = new EEATOptimizer();
    this.expertiseValidator = new ExpertiseValidator();
    this.authoritativenessEnhancer = new AuthoritativenessEnhancer();
    this.trustworthinessIntegrator = new TrustworthinessIntegrator();
    this.credibilityInjector = new CredibilityMarkerInjector();
    this.sourceValidator = new SourceAuthorityValidator();
  }

  calculateEEATCompliance(content: string, urls?: string[]): number {
    const eeatAnalysis = this.eeatOptimizer.analyzeEEAT(content);
    const expertiseValidation = this.expertiseValidator.validateExpertise(content);
    const trustAnalysis = this.trustworthinessIntegrator.analyzeTrustworthiness(content);
    const credibilityAnalysis = this.credibilityInjector.analyzeCredibility(content);
    
    let sourceScore = 70; // Default if no URLs provided
    if (urls && urls.length > 0) {
      const sourceAnalysis = this.sourceValidator.validateMultipleSources(urls);
      sourceScore = sourceAnalysis.overallScore;
    }

    // Weighted calculation
    const weights = {
      eeat: 0.35,
      expertise: 0.20,
      trust: 0.20,
      credibility: 0.15,
      sources: 0.10
    };

    const complianceScore = 
      eeatAnalysis.overallScore * weights.eeat +
      expertiseValidation.score * weights.expertise +
      trustAnalysis.score * weights.trust +
      credibilityAnalysis.score * weights.credibility +
      sourceScore * weights.sources;

    return Math.round(complianceScore);
  }

  scoreTrustSignals(content: string, urls?: string[]): TrustSignalScore {
    // Handle empty content
    if (!content || content.trim().length === 0) {
      return {
        overallScore: 0,
        eeatCompliance: {
          experience: 0,
          expertise: 0,
          authoritativeness: 0,
          trustworthiness: 0
        },
        signalStrength: {
          credibilityMarkers: 0,
          sourceAuthority: 0,
          transparencyLevel: 0,
          professionalIndicators: 0
        },
        qualityMetrics: {
          factualAccuracy: 0,
          sourceReliability: 0,
          contentDepth: 0,
          professionalPresentation: 0
        },
        opportunities: [
          'Add substantial content to enable trust signal analysis',
          'Include credibility markers and professional indicators',
          'Add authoritative sources and citations',
          'Demonstrate expertise through detailed explanations'
        ],
        recommendations: [
          'Create comprehensive content with clear expertise demonstration',
          'Include professional credentials and experience markers',
          'Add citations from authoritative sources',
          'Implement transparency and trust-building elements'
        ]
      };
    }

    // Analyze all E-E-A-T components
    const eeatAnalysis = this.eeatOptimizer.analyzeEEAT(content);
    const expertiseValidation = this.expertiseValidator.validateExpertise(content);
    const trustAnalysis = this.trustworthinessIntegrator.analyzeTrustworthiness(content);
    const credibilityAnalysis = this.credibilityInjector.analyzeCredibility(content);
    
    // Analyze source authority if URLs provided
    let sourceAuthority = 75;
    if (urls && urls.length > 0) {
      const sourceAnalysis = this.sourceValidator.validateMultipleSources(urls);
      sourceAuthority = sourceAnalysis.overallScore;
    }

    // Calculate signal strength
    const signalStrength = this.calculateSignalStrength(content, {
      credibility: credibilityAnalysis.score,
      sourceAuthority,
      trust: trustAnalysis.score
    });

    // Calculate quality metrics
    const qualityMetrics = this.assessQualityMetrics(content);

    // Identify enhancement opportunities
    const opportunities = this.identifyEnhancementOpportunities({
      eeat: eeatAnalysis,
      expertise: expertiseValidation,
      trust: trustAnalysis,
      credibility: credibilityAnalysis.score,
      sourceAuthority
    });

    // Generate recommendations
    const recommendations = this.generateComprehensiveRecommendations(
      eeatAnalysis,
      expertiseValidation,
      opportunities
    );

    // Calculate overall score
    const overallScore = this.calculateOverallTrustScore({
      eeat: eeatAnalysis,
      signalStrength,
      qualityMetrics
    });

    return {
      overallScore,
      eeatCompliance: {
        experience: eeatAnalysis.experience,
        expertise: eeatAnalysis.expertise,
        authoritativeness: eeatAnalysis.authoritativeness,
        trustworthiness: eeatAnalysis.trustworthiness
      },
      signalStrength,
      qualityMetrics,
      opportunities,
      recommendations
    };
  }

  analyzeContentTrust(content: string, urls?: string[]): ContentTrustAnalysis {
    const score = this.scoreTrustSignals(content, urls);
    const strengths = this.identifyStrengths(score);
    const weaknesses = this.identifyWeaknesses(score);
    
    // Optional competitive comparison
    const competitiveComparison = {
      industryAverage: 72,
      topPerformer: 92,
      yourScore: score.overallScore
    };

    return {
      score,
      strengths,
      weaknesses,
      competitiveComparison
    };
  }

  identifyEnhancementOpportunities(analysis: any): EnhancementOpportunity[] {
    const opportunities: EnhancementOpportunity[] = [];

    // Experience opportunities
    if (analysis.eeat.experience < 85) {
      opportunities.push({
        category: 'experience',
        priority: 'high',
        description: 'Add personal insights and practical examples',
        expectedImpact: 15,
        implementation: 'Include case studies, lessons learned, and real-world applications throughout the content'
      });
    }

    // Expertise opportunities
    if (analysis.expertise.score < 90) {
      opportunities.push({
        category: 'expertise',
        priority: analysis.expertise.score < 70 ? 'high' : 'medium',
        description: 'Enhance technical depth and specialized knowledge',
        expectedImpact: 12,
        implementation: 'Add industry-specific terminology, cite research, and explain complex concepts'
      });
    }

    // Authoritativeness opportunities
    if (analysis.eeat.authoritativeness < 80) {
      opportunities.push({
        category: 'authoritativeness',
        priority: 'high',
        description: 'Strengthen authority signals with citations and credentials',
        expectedImpact: 18,
        implementation: 'Reference authoritative sources, add professional credentials, and include industry standards'
      });
    }

    // Trustworthiness opportunities
    if (analysis.eeat.trustworthiness < 95) {
      opportunities.push({
        category: 'trustworthiness',
        priority: analysis.eeat.trustworthiness < 80 ? 'high' : 'medium',
        description: 'Improve transparency and balanced perspective',
        expectedImpact: 10,
        implementation: 'Add disclaimers, acknowledge limitations, present multiple viewpoints'
      });
    }

    // Source authority opportunities
    if (analysis.sourceAuthority < 80) {
      opportunities.push({
        category: 'authoritativeness',
        priority: 'medium',
        description: 'Upgrade to higher-authority sources',
        expectedImpact: 8,
        implementation: 'Replace low-authority sources with academic, government, or industry-leading publications'
      });
    }

    // Sort by priority and expected impact
    return opportunities.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.expectedImpact - a.expectedImpact;
    });
  }

  private calculateSignalStrength(content: string, scores: any): any {
    const contentLower = content.toLowerCase();
    
    // Calculate transparency level
    const transparencyIndicators = [
      'transparent', 'disclosure', 'honest', 'acknowledge',
      'limitation', 'consider', 'important to note'
    ];
    let transparencyCount = 0;
    transparencyIndicators.forEach(indicator => {
      if (contentLower.includes(indicator)) transparencyCount++;
    });
    const transparencyLevel = Math.min(100, 50 + transparencyCount * 10);

    // Calculate balanced perspective
    const balanceIndicators = [
      'however', 'although', 'on the other hand', 'alternatively',
      'different perspective', 'various viewpoints', 'both sides'
    ];
    let balanceCount = 0;
    balanceIndicators.forEach(indicator => {
      if (contentLower.includes(indicator)) balanceCount++;
    });
    const balancedPerspective = Math.min(100, 40 + balanceCount * 12);

    return {
      credibilityMarkers: scores.credibility,
      sourceAuthority: scores.sourceAuthority,
      transparencyLevel,
      balancedPerspective
    };
  }

  private assessQualityMetrics(content: string): any {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = content.split(/\s+/);
    const paragraphs = content.split(/\n\n+/);

    // Content depth (based on length and structure)
    const avgSentenceLength = words.length / sentences.length;
    const paragraphCount = paragraphs.length;
    const contentDepth = Math.min(100, 
      30 + 
      Math.min(avgSentenceLength * 2, 40) + 
      Math.min(paragraphCount * 5, 30)
    );

    // Factual accuracy indicators
    const factualIndicators = [
      /\d+%/, /\d+ (studies|research|report)/, /according to/i,
      /data shows/i, /evidence suggests/i, /research indicates/i
    ];
    let factualCount = 0;
    factualIndicators.forEach(pattern => {
      if (pattern.test(content)) factualCount++;
    });
    const factualAccuracy = Math.min(100, 60 + factualCount * 8);

    // Professional tone
    const informalWords = /gonna|wanna|gotta|kinda|sorta|basically|literally|actually/gi;
    const informalCount = (content.match(informalWords) || []).length;
    const professionalTone = Math.max(0, 100 - informalCount * 5);

    // User value (actionable insights, clear explanations)
    const valueIndicators = [
      /how to/i, /step by step/i, /guide/i, /tips/i,
      /best practice/i, /recommendation/i, /solution/i
    ];
    let valueCount = 0;
    valueIndicators.forEach(pattern => {
      if (pattern.test(content)) valueCount++;
    });
    const userValue = Math.min(100, 50 + valueCount * 10);

    return {
      contentDepth,
      factualAccuracy,
      professionalTone,
      userValue
    };
  }

  private calculateOverallTrustScore(components: any): number {
    const weights = {
      eeat: 0.40,
      signalStrength: 0.30,
      qualityMetrics: 0.30
    };

    const eeatScore = components.eeat.overallScore;
    const signalScore = Object.values(components.signalStrength)
      .reduce((sum: number, val: any) => sum + val, 0) / 4;
    const qualityScore = Object.values(components.qualityMetrics)
      .reduce((sum: number, val: any) => sum + val, 0) / 4;

    return Math.round(
      eeatScore * weights.eeat +
      signalScore * weights.signalStrength +
      qualityScore * weights.qualityMetrics
    );
  }

  private generateComprehensiveRecommendations(
    eeatAnalysis: EEATAnalysis,
    expertiseValidation: ExpertiseValidationResult,
    opportunities: EnhancementOpportunity[]
  ): string[] {
    const recommendations: string[] = [];

    // High-priority recommendations from opportunities
    const highPriorityOps = opportunities.filter(o => o.priority === 'high');
    highPriorityOps.forEach(op => {
      recommendations.push(`${op.description}: ${op.implementation}`);
    });

    // E-E-A-T specific recommendations
    if (eeatAnalysis.recommendations) {
      recommendations.push(...eeatAnalysis.recommendations.slice(0, 2));
    }

    // Expertise recommendations
    if (expertiseValidation.recommendations) {
      recommendations.push(...expertiseValidation.recommendations.slice(0, 2));
    }

    // Limit to top 5 most impactful recommendations
    return recommendations.slice(0, 5);
  }

  private identifyStrengths(score: TrustSignalScore): string[] {
    const strengths: string[] = [];

    if (score.eeatCompliance.experience >= 85) {
      strengths.push('Strong personal experience and practical insights');
    }
    if (score.eeatCompliance.expertise >= 90) {
      strengths.push('Excellent technical expertise and specialized knowledge');
    }
    if (score.eeatCompliance.authoritativeness >= 80) {
      strengths.push('Well-supported with authoritative sources and citations');
    }
    if (score.eeatCompliance.trustworthiness >= 95) {
      strengths.push('Highly transparent with balanced perspectives');
    }
    if (score.signalStrength.sourceAuthority >= 85) {
      strengths.push('Backed by high-authority, credible sources');
    }
    if (score.qualityMetrics.professionalTone >= 90) {
      strengths.push('Maintains professional, authoritative tone throughout');
    }
    if (score.qualityMetrics.userValue >= 80) {
      strengths.push('Provides high user value with actionable insights');
    }

    return strengths;
  }

  private identifyWeaknesses(score: TrustSignalScore): string[] {
    const weaknesses: string[] = [];

    if (score.eeatCompliance.experience < 70) {
      weaknesses.push('Lacks personal experience and practical examples');
    }
    if (score.eeatCompliance.expertise < 70) {
      weaknesses.push('Limited demonstration of technical expertise');
    }
    if (score.eeatCompliance.authoritativeness < 60) {
      weaknesses.push('Insufficient authoritative sources and citations');
    }
    if (score.eeatCompliance.trustworthiness < 80) {
      weaknesses.push('Needs more transparency and balanced viewpoints');
    }
    if (score.signalStrength.credibilityMarkers < 60) {
      weaknesses.push('Missing credibility markers and professional indicators');
    }
    if (score.qualityMetrics.factualAccuracy < 70) {
      weaknesses.push('Could benefit from more data and evidence');
    }
    if (score.overallScore < 70) {
      weaknesses.push('Overall trust signals need significant improvement');
    }

    return weaknesses;
  }
}
