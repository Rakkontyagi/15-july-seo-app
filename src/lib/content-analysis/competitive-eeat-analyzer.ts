/**
 * Competitive E-E-A-T Analysis System
 * Story 7.3: E-E-A-T Optimization and Trust Signal Integration
 * Advanced feature for competitive content analysis and benchmarking
 */

import { EEATOptimizer, EEATAnalysis } from './eeat-optimizer';
import { TrustSignalScorer } from './trust-signal-scorer';

export interface CompetitiveAnalysis {
  yourContent: ContentAnalysis;
  competitors: CompetitorAnalysis[];
  benchmarks: IndustryBenchmarks;
  gapAnalysis: GapAnalysis;
  recommendations: CompetitiveRecommendation[];
  marketPosition: MarketPosition;
}

export interface ContentAnalysis {
  url?: string;
  title: string;
  eeatScore: EEATAnalysis;
  trustScore: number;
  contentLength: number;
  readabilityScore: number;
  technicalDepth: number;
  authoritySignals: number;
}

export interface CompetitorAnalysis extends ContentAnalysis {
  domain: string;
  domainAuthority: number;
  backlinks: number;
  socialShares: number;
  estimatedTraffic: number;
  contentQualityScore: number;
  strengthAreas: string[];
  weaknessAreas: string[];
}

export interface IndustryBenchmarks {
  averageEEATScore: number;
  topPerformerScore: number;
  industryStandards: {
    experience: number;
    expertise: number;
    authoritativeness: number;
    trustworthiness: number;
  };
  contentLengthBenchmark: number;
  authoritySignalsBenchmark: number;
}

export interface GapAnalysis {
  experienceGap: number;
  expertiseGap: number;
  authoritativenessGap: number;
  trustworthinessGap: number;
  overallGap: number;
  priorityAreas: Array<{
    area: string;
    gap: number;
    impact: 'high' | 'medium' | 'low';
    difficulty: 'easy' | 'medium' | 'hard';
  }>;
}

export interface CompetitiveRecommendation {
  category: 'content' | 'authority' | 'technical' | 'trust';
  priority: 'critical' | 'high' | 'medium' | 'low';
  action: string;
  competitorExample: string;
  expectedImpact: number;
  timeToImplement: string;
  resources: string[];
}

export interface MarketPosition {
  rank: number;
  totalCompetitors: number;
  percentile: number;
  category: 'leader' | 'challenger' | 'follower' | 'niche';
  strengthAreas: string[];
  improvementAreas: string[];
}

export class CompetitiveEEATAnalyzer {
  private eeatOptimizer: EEATOptimizer;
  private trustSignalScorer: TrustSignalScorer;
  
  // Industry benchmarks database
  private industryBenchmarks: Map<string, IndustryBenchmarks> = new Map([
    ['seo', {
      averageEEATScore: 72,
      topPerformerScore: 89,
      industryStandards: { experience: 75, expertise: 82, authoritativeness: 78, trustworthiness: 85 },
      contentLengthBenchmark: 2500,
      authoritySignalsBenchmark: 8
    }],
    ['technology', {
      averageEEATScore: 76,
      topPerformerScore: 92,
      industryStandards: { experience: 70, expertise: 88, authoritativeness: 75, trustworthiness: 82 },
      contentLengthBenchmark: 3200,
      authoritySignalsBenchmark: 12
    }],
    ['marketing', {
      averageEEATScore: 69,
      topPerformerScore: 86,
      industryStandards: { experience: 78, expertise: 74, authoritativeness: 72, trustworthiness: 80 },
      contentLengthBenchmark: 2800,
      authoritySignalsBenchmark: 6
    }],
    ['finance', {
      averageEEATScore: 81,
      topPerformerScore: 94,
      industryStandards: { experience: 82, expertise: 89, authoritativeness: 85, trustworthiness: 92 },
      contentLengthBenchmark: 3500,
      authoritySignalsBenchmark: 15
    }],
    ['healthcare', {
      averageEEATScore: 84,
      topPerformerScore: 96,
      industryStandards: { experience: 85, expertise: 91, authoritativeness: 88, trustworthiness: 95 },
      contentLengthBenchmark: 4000,
      authoritySignalsBenchmark: 18
    }]
  ]);

  constructor() {
    this.eeatOptimizer = new EEATOptimizer();
    this.trustSignalScorer = new TrustSignalScorer();
  }

  /**
   * Performs comprehensive competitive E-E-A-T analysis
   */
  async analyzeCompetitive(
    yourContent: string,
    competitorContents: Array<{ content: string; domain: string; url?: string }>,
    industry: string = 'seo'
  ): Promise<CompetitiveAnalysis> {
    
    // Analyze your content
    const yourAnalysis = await this.analyzeContent(yourContent, 'Your Content');
    
    // Analyze competitor contents
    const competitorAnalyses = await Promise.all(
      competitorContents.map(comp => this.analyzeCompetitorContent(comp.content, comp.domain, comp.url))
    );
    
    // Get industry benchmarks
    const benchmarks = this.industryBenchmarks.get(industry) || this.industryBenchmarks.get('seo')!;
    
    // Perform gap analysis
    const gapAnalysis = this.performGapAnalysis(yourAnalysis, competitorAnalyses, benchmarks);
    
    // Generate competitive recommendations
    const recommendations = this.generateCompetitiveRecommendations(yourAnalysis, competitorAnalyses, gapAnalysis);
    
    // Determine market position
    const marketPosition = this.determineMarketPosition(yourAnalysis, competitorAnalyses);
    
    return {
      yourContent: yourAnalysis,
      competitors: competitorAnalyses,
      benchmarks,
      gapAnalysis,
      recommendations,
      marketPosition
    };
  }

  /**
   * Analyzes content for E-E-A-T signals
   */
  private async analyzeContent(content: string, title: string): Promise<ContentAnalysis> {
    const eeatScore = this.eeatOptimizer.analyzeEEAT(content);
    const trustSignals = this.trustSignalScorer.scoreTrustSignals(content);
    
    return {
      title,
      eeatScore,
      trustScore: trustSignals.overallScore,
      contentLength: content.split(/\s+/).length,
      readabilityScore: this.calculateReadabilityScore(content),
      technicalDepth: this.calculateTechnicalDepth(content),
      authoritySignals: eeatScore.details.authoritySignals.length
    };
  }

  /**
   * Analyzes competitor content with additional metrics
   */
  private async analyzeCompetitorContent(content: string, domain: string, url?: string): Promise<CompetitorAnalysis> {
    const baseAnalysis = await this.analyzeContent(content, domain);
    
    // Simulate additional competitor metrics (in real implementation, these would come from APIs)
    const domainAuthority = this.estimateDomainAuthority(domain);
    const backlinks = this.estimateBacklinks(domain);
    const socialShares = this.estimateSocialShares(content);
    const estimatedTraffic = this.estimateTraffic(domain);
    
    const strengthAreas = this.identifyStrengthAreas(baseAnalysis.eeatScore);
    const weaknessAreas = this.identifyWeaknessAreas(baseAnalysis.eeatScore);
    
    return {
      ...baseAnalysis,
      url,
      domain,
      domainAuthority,
      backlinks,
      socialShares,
      estimatedTraffic,
      contentQualityScore: this.calculateContentQualityScore(baseAnalysis),
      strengthAreas,
      weaknessAreas
    };
  }

  /**
   * Performs gap analysis against competitors and benchmarks
   */
  private performGapAnalysis(
    yourContent: ContentAnalysis,
    competitors: CompetitorAnalysis[],
    benchmarks: IndustryBenchmarks
  ): GapAnalysis {
    // Handle empty competitors array
    if (competitors.length === 0) {
      return {
        experienceGap: 0,
        expertiseGap: 0,
        authoritativenessGap: 0,
        trustworthinessGap: 0,
        overallGap: 0,
        strengths: ['No competitors to compare against'],
        weaknesses: ['Unable to perform competitive analysis'],
        opportunities: ['Establish market leadership'],
        threats: ['Unknown competitive landscape']
      };
    }

    const topCompetitor = competitors.reduce((top, comp) =>
      comp.eeatScore.overallScore > top.eeatScore.overallScore ? comp : top
    );
    
    const experienceGap = Math.max(0, topCompetitor.eeatScore.experience - yourContent.eeatScore.experience);
    const expertiseGap = Math.max(0, topCompetitor.eeatScore.expertise - yourContent.eeatScore.expertise);
    const authoritativenessGap = Math.max(0, topCompetitor.eeatScore.authoritativeness - yourContent.eeatScore.authoritativeness);
    const trustworthinessGap = Math.max(0, topCompetitor.eeatScore.trustworthiness - yourContent.eeatScore.trustworthiness);
    const overallGap = Math.max(0, topCompetitor.eeatScore.overallScore - yourContent.eeatScore.overallScore);
    
    const priorityAreas = [
      { area: 'experience', gap: experienceGap, impact: this.getImpactLevel(experienceGap), difficulty: 'medium' as const },
      { area: 'expertise', gap: expertiseGap, impact: this.getImpactLevel(expertiseGap), difficulty: 'hard' as const },
      { area: 'authoritativeness', gap: authoritativenessGap, impact: this.getImpactLevel(authoritativenessGap), difficulty: 'medium' as const },
      { area: 'trustworthiness', gap: trustworthinessGap, impact: this.getImpactLevel(trustworthinessGap), difficulty: 'easy' as const }
    ].filter(area => area.gap > 5).sort((a, b) => b.gap - a.gap);
    
    return {
      experienceGap,
      expertiseGap,
      authoritativenessGap,
      trustworthinessGap,
      overallGap,
      priorityAreas
    };
  }

  /**
   * Generates competitive recommendations
   */
  private generateCompetitiveRecommendations(
    yourContent: ContentAnalysis,
    competitors: CompetitorAnalysis[],
    gapAnalysis: GapAnalysis
  ): CompetitiveRecommendation[] {
    const recommendations: CompetitiveRecommendation[] = [];

    // Handle empty competitors array
    if (competitors.length === 0) {
      return recommendations;
    }

    // Find best performing competitor for each area
    const bestExperience = competitors.reduce((best, comp) =>
      comp.eeatScore.experience > best.eeatScore.experience ? comp : best
    );

    const bestExpertise = competitors.reduce((best, comp) =>
      comp.eeatScore.expertise > best.eeatScore.expertise ? comp : best
    );
    
    const bestAuthority = competitors.reduce((best, comp) =>
      comp.eeatScore.authoritativeness > best.eeatScore.authoritativeness ? comp : best
    );

    const bestTrust = competitors.reduce((best, comp) =>
      comp.eeatScore.trustworthiness > best.eeatScore.trustworthiness ? comp : best
    );
    
    // Generate recommendations based on gaps
    if (gapAnalysis.experienceGap > 10) {
      recommendations.push({
        category: 'content',
        priority: 'high',
        action: 'Add more personal experience markers and real-world examples',
        competitorExample: `${bestExperience.domain} uses ${bestExperience.eeatScore.details.experienceMarkers.length} experience markers`,
        expectedImpact: Math.min(gapAnalysis.experienceGap * 0.8, 15),
        timeToImplement: '2-4 hours',
        resources: ['Content writer', 'Subject matter expert']
      });
    }
    
    if (gapAnalysis.expertiseGap > 10) {
      recommendations.push({
        category: 'content',
        priority: 'critical',
        action: 'Increase technical depth and specialized terminology',
        competitorExample: `${bestExpertise.domain} demonstrates higher expertise with ${bestExpertise.technicalDepth} technical depth score`,
        expectedImpact: Math.min(gapAnalysis.expertiseGap * 0.7, 20),
        timeToImplement: '4-8 hours',
        resources: ['Technical expert', 'Research analyst']
      });
    }
    
    if (gapAnalysis.authoritativenessGap > 10) {
      recommendations.push({
        category: 'authority',
        priority: 'high',
        action: 'Add more citations and authoritative source references',
        competitorExample: `${bestAuthority.domain} has ${bestAuthority.authoritySignals} authority signals vs your ${yourContent.authoritySignals}`,
        expectedImpact: Math.min(gapAnalysis.authoritativenessGap * 0.9, 18),
        timeToImplement: '1-3 hours',
        resources: ['Research analyst', 'Content editor']
      });
    }

    if (gapAnalysis.trustworthinessGap > 10) {
      recommendations.push({
        category: 'trust',
        priority: 'medium',
        action: 'Improve transparency and add trust signals',
        competitorExample: `${bestTrust.domain} demonstrates higher trustworthiness with better transparency`,
        expectedImpact: Math.min(gapAnalysis.trustworthinessGap * 0.6, 12),
        timeToImplement: '2-4 hours',
        resources: ['Content editor', 'Legal reviewer']
      });
    }
    
    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Determines market position relative to competitors
   */
  private determineMarketPosition(yourContent: ContentAnalysis, competitors: CompetitorAnalysis[]): MarketPosition {
    const allContents = [yourContent, ...competitors];
    const sortedByScore = allContents.sort((a, b) => b.eeatScore.overallScore - a.eeatScore.overallScore);
    
    const yourRank = sortedByScore.findIndex(content => content === yourContent) + 1;
    const totalCompetitors = allContents.length;
    const percentile = Math.round(((totalCompetitors - yourRank) / (totalCompetitors - 1)) * 100);
    
    let category: 'leader' | 'challenger' | 'follower' | 'niche';
    if (percentile >= 80) category = 'leader';
    else if (percentile >= 60) category = 'challenger';
    else if (percentile >= 40) category = 'follower';
    else category = 'niche';
    
    const strengthAreas = this.identifyStrengthAreas(yourContent.eeatScore);
    const improvementAreas = this.identifyWeaknessAreas(yourContent.eeatScore);
    
    return {
      rank: yourRank,
      totalCompetitors,
      percentile,
      category,
      strengthAreas,
      improvementAreas
    };
  }

  // Helper methods
  private calculateReadabilityScore(content: string): number {
    // Simplified readability calculation
    const sentences = content.split(/[.!?]+/).length;
    const words = content.split(/\s+/).length;
    const avgWordsPerSentence = words / sentences;
    
    // Flesch Reading Ease approximation
    return Math.max(0, Math.min(100, 206.835 - (1.015 * avgWordsPerSentence)));
  }

  private calculateTechnicalDepth(content: string): number {
    const technicalIndicators = [
      /\b[A-Z]{2,}\b/g, // Acronyms
      /\b\w{10,}\b/g, // Long technical words
      /\d+%|\d+\.\d+/g, // Statistics
      /\b(algorithm|methodology|framework|implementation|optimization)\b/gi
    ];
    
    let score = 0;
    technicalIndicators.forEach(indicator => {
      const matches = content.match(indicator) || [];
      score += matches.length;
    });
    
    return Math.min(100, (score / content.split(/\s+/).length) * 1000);
  }

  private calculateContentQualityScore(analysis: ContentAnalysis): number {
    return Math.round(
      (analysis.eeatScore.overallScore * 0.4) +
      (analysis.trustScore * 0.3) +
      (analysis.readabilityScore * 0.15) +
      (analysis.technicalDepth * 0.15)
    );
  }

  private identifyStrengthAreas(eeatScore: EEATAnalysis): string[] {
    const areas: string[] = [];
    if (eeatScore.experience >= 80) areas.push('Experience');
    if (eeatScore.expertise >= 80) areas.push('Expertise');
    if (eeatScore.authoritativeness >= 80) areas.push('Authoritativeness');
    if (eeatScore.trustworthiness >= 80) areas.push('Trustworthiness');
    return areas;
  }

  private identifyWeaknessAreas(eeatScore: EEATAnalysis): string[] {
    const areas: string[] = [];
    if (eeatScore.experience < 70) areas.push('Experience');
    if (eeatScore.expertise < 70) areas.push('Expertise');
    if (eeatScore.authoritativeness < 70) areas.push('Authoritativeness');
    if (eeatScore.trustworthiness < 70) areas.push('Trustworthiness');
    return areas;
  }

  private getImpactLevel(gap: number): 'high' | 'medium' | 'low' {
    if (gap >= 15) return 'high';
    if (gap >= 8) return 'medium';
    return 'low';
  }

  // Simulation methods (in real implementation, these would use actual APIs)
  private estimateDomainAuthority(domain: string): number {
    return Math.floor(Math.random() * 40) + 40; // 40-80 range
  }

  private estimateBacklinks(domain: string): number {
    return Math.floor(Math.random() * 50000) + 1000;
  }

  private estimateSocialShares(content: string): number {
    return Math.floor(Math.random() * 1000) + 50;
  }

  private estimateTraffic(domain: string): number {
    return Math.floor(Math.random() * 100000) + 5000;
  }
}
