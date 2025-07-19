/**
 * Real-time E-E-A-T Scoring System
 * Story 7.3: E-E-A-T Optimization and Trust Signal Integration
 * Advanced feature for continuous content quality monitoring
 */

import { EEATOptimizer, EEATAnalysis } from './eeat-optimizer';
import { TrustSignalScorer, TrustSignalScore } from './trust-signal-scorer';

export interface RealTimeEEATScore {
  timestamp: number;
  overallScore: number;
  eeatBreakdown: {
    experience: number;
    expertise: number;
    authoritativeness: number;
    trustworthiness: number;
  };
  trendAnalysis: {
    direction: 'improving' | 'declining' | 'stable';
    changeRate: number;
    confidenceLevel: number;
  };
  alerts: EEATAlert[];
  recommendations: PriorityRecommendation[];
}

export interface EEATAlert {
  type: 'critical' | 'warning' | 'info';
  category: 'experience' | 'expertise' | 'authoritativeness' | 'trustworthiness';
  message: string;
  threshold: number;
  currentValue: number;
  actionRequired: string;
}

export interface PriorityRecommendation {
  priority: 'high' | 'medium' | 'low';
  category: string;
  action: string;
  expectedImpact: number;
  timeToImplement: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface EEATTrend {
  timeframe: string;
  scores: Array<{
    timestamp: number;
    score: number;
    category: string;
  }>;
  averageScore: number;
  volatility: number;
  trend: 'upward' | 'downward' | 'stable';
}

export class RealTimeEEATScorer {
  private eeatOptimizer: EEATOptimizer;
  private trustSignalScorer: TrustSignalScorer;
  private scoreHistory: Map<string, RealTimeEEATScore[]> = new Map();
  private alertThresholds: Map<string, number> = new Map([
    ['experience', 70],
    ['expertise', 75],
    ['authoritativeness', 80],
    ['trustworthiness', 85],
    ['overall', 78]
  ]);

  constructor() {
    this.eeatOptimizer = new EEATOptimizer();
    this.trustSignalScorer = new TrustSignalScorer();
  }

  /**
   * Performs real-time E-E-A-T scoring with trend analysis
   */
  async scoreContentRealTime(content: string, contentId: string, urls?: string[]): Promise<RealTimeEEATScore> {
    const timestamp = Date.now();
    
    // Get current E-E-A-T analysis
    const eeatAnalysis = this.eeatOptimizer.analyzeEEAT(content);
    const trustSignals = this.trustSignalScorer.scoreTrustSignals(content, urls);
    
    // Calculate overall score
    const overallScore = this.calculateWeightedOverallScore(eeatAnalysis, trustSignals);
    
    // Analyze trends
    const trendAnalysis = this.analyzeTrends(contentId, overallScore);
    
    // Generate alerts
    const alerts = this.generateAlerts(eeatAnalysis, trustSignals);
    
    // Generate priority recommendations
    const recommendations = this.generatePriorityRecommendations(eeatAnalysis, trustSignals, trendAnalysis);
    
    const realTimeScore: RealTimeEEATScore = {
      timestamp,
      overallScore,
      eeatBreakdown: {
        experience: eeatAnalysis.experience,
        expertise: eeatAnalysis.expertise,
        authoritativeness: eeatAnalysis.authoritativeness,
        trustworthiness: eeatAnalysis.trustworthiness
      },
      trendAnalysis,
      alerts,
      recommendations
    };
    
    // Store in history
    this.storeScoreHistory(contentId, realTimeScore);
    
    return realTimeScore;
  }

  /**
   * Analyzes E-E-A-T trends over time
   */
  analyzeTrends(contentId: string, currentScore: number): {
    direction: 'improving' | 'declining' | 'stable';
    changeRate: number;
    confidenceLevel: number;
  } {
    const history = this.scoreHistory.get(contentId) || [];
    
    if (history.length < 2) {
      return {
        direction: 'stable',
        changeRate: 0,
        confidenceLevel: 0.5
      };
    }
    
    // Calculate trend over last 5 scores
    const recentScores = history.slice(-5).map(h => h.overallScore);
    recentScores.push(currentScore);
    
    const trend = this.calculateLinearTrend(recentScores);
    const changeRate = Math.abs(trend.slope);
    
    let direction: 'improving' | 'declining' | 'stable';
    if (trend.slope > 0.5) {
      direction = 'improving';
    } else if (trend.slope < -0.5) {
      direction = 'declining';
    } else {
      direction = 'stable';
    }
    
    return {
      direction,
      changeRate,
      confidenceLevel: Math.min(trend.rSquared, 0.95)
    };
  }

  /**
   * Generates real-time alerts based on thresholds
   */
  private generateAlerts(eeatAnalysis: EEATAnalysis, trustSignals: TrustSignalScore): EEATAlert[] {
    const alerts: EEATAlert[] = [];
    
    // Check experience threshold
    if (eeatAnalysis.experience < this.alertThresholds.get('experience')!) {
      alerts.push({
        type: 'warning',
        category: 'experience',
        message: 'Experience markers below recommended threshold',
        threshold: this.alertThresholds.get('experience')!,
        currentValue: eeatAnalysis.experience,
        actionRequired: 'Add more personal experience indicators and real-world examples'
      });
    }
    
    // Check expertise threshold
    if (eeatAnalysis.expertise < this.alertThresholds.get('expertise')!) {
      alerts.push({
        type: 'warning',
        category: 'expertise',
        message: 'Expertise indicators insufficient',
        threshold: this.alertThresholds.get('expertise')!,
        currentValue: eeatAnalysis.expertise,
        actionRequired: 'Include more technical terminology and specialized knowledge'
      });
    }
    
    // Check authoritativeness threshold
    if (eeatAnalysis.authoritativeness < this.alertThresholds.get('authoritativeness')!) {
      alerts.push({
        type: 'critical',
        category: 'authoritativeness',
        message: 'Authority signals critically low',
        threshold: this.alertThresholds.get('authoritativeness')!,
        currentValue: eeatAnalysis.authoritativeness,
        actionRequired: 'Add citations, references, and credible source links'
      });
    }
    
    // Check trustworthiness threshold
    if (eeatAnalysis.trustworthiness < this.alertThresholds.get('trustworthiness')!) {
      alerts.push({
        type: 'critical',
        category: 'trustworthiness',
        message: 'Trustworthiness signals below critical threshold',
        threshold: this.alertThresholds.get('trustworthiness')!,
        currentValue: eeatAnalysis.trustworthiness,
        actionRequired: 'Increase transparency markers and balanced perspectives'
      });
    }
    
    return alerts;
  }

  /**
   * Generates priority recommendations based on analysis
   */
  private generatePriorityRecommendations(
    eeatAnalysis: EEATAnalysis, 
    trustSignals: TrustSignalScore,
    trendAnalysis: any
  ): PriorityRecommendation[] {
    const recommendations: PriorityRecommendation[] = [];
    
    // Prioritize based on lowest scores and highest impact
    const scores = [
      { category: 'experience', score: eeatAnalysis.experience },
      { category: 'expertise', score: eeatAnalysis.expertise },
      { category: 'authoritativeness', score: eeatAnalysis.authoritativeness },
      { category: 'trustworthiness', score: eeatAnalysis.trustworthiness }
    ].sort((a, b) => a.score - b.score);
    
    // High priority recommendations for lowest scoring areas
    if (scores[0].score < 70) {
      recommendations.push({
        priority: 'high',
        category: scores[0].category,
        action: this.getActionForCategory(scores[0].category),
        expectedImpact: 15,
        timeToImplement: '1-2 hours',
        difficulty: 'medium'
      });
    }
    
    // Medium priority for second lowest
    if (scores[1].score < 80) {
      recommendations.push({
        priority: 'medium',
        category: scores[1].category,
        action: this.getActionForCategory(scores[1].category),
        expectedImpact: 10,
        timeToImplement: '30-60 minutes',
        difficulty: 'easy'
      });
    }
    
    // Trend-based recommendations
    if (trendAnalysis.direction === 'declining') {
      recommendations.push({
        priority: 'high',
        category: 'overall',
        action: 'Immediate content review and optimization required',
        expectedImpact: 20,
        timeToImplement: '2-4 hours',
        difficulty: 'hard'
      });
    }
    
    return recommendations;
  }

  /**
   * Gets specific action recommendations for each E-E-A-T category
   */
  private getActionForCategory(category: string): string {
    const actions = {
      experience: 'Add personal anecdotes, case studies, and "in my experience" statements',
      expertise: 'Include technical terminology, research citations, and specialized knowledge',
      authoritativeness: 'Add credible source links, industry certifications, and expert endorsements',
      trustworthiness: 'Include transparency statements, balanced viewpoints, and limitation acknowledgments'
    };
    
    return actions[category as keyof typeof actions] || 'General content improvement needed';
  }

  /**
   * Calculates weighted overall score
   */
  private calculateWeightedOverallScore(eeatAnalysis: EEATAnalysis, trustSignals: TrustSignalScore): number {
    const weights = {
      experience: 0.25,
      expertise: 0.30,
      authoritativeness: 0.25,
      trustworthiness: 0.20
    };
    
    return Math.round(
      eeatAnalysis.experience * weights.experience +
      eeatAnalysis.expertise * weights.expertise +
      eeatAnalysis.authoritativeness * weights.authoritativeness +
      eeatAnalysis.trustworthiness * weights.trustworthiness
    );
  }

  /**
   * Calculates linear trend from score array
   */
  private calculateLinearTrend(scores: number[]): { slope: number; rSquared: number } {
    const n = scores.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = scores;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    // Calculate R-squared
    const yMean = sumY / n;
    const ssTotal = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const ssResidual = y.reduce((sum, yi, i) => {
      const predicted = slope * x[i] + (sumY - slope * sumX) / n;
      return sum + Math.pow(yi - predicted, 2);
    }, 0);
    
    const rSquared = 1 - (ssResidual / ssTotal);
    
    return { slope, rSquared: Math.max(0, rSquared) };
  }

  /**
   * Stores score in history for trend analysis
   */
  private storeScoreHistory(contentId: string, score: RealTimeEEATScore): void {
    if (!this.scoreHistory.has(contentId)) {
      this.scoreHistory.set(contentId, []);
    }
    
    const history = this.scoreHistory.get(contentId)!;
    history.push(score);
    
    // Keep only last 20 scores for performance
    if (history.length > 20) {
      history.shift();
    }
  }

  /**
   * Gets E-E-A-T trend data for visualization
   */
  getEEATTrends(contentId: string, timeframe: string = '24h'): EEATTrend | null {
    const history = this.scoreHistory.get(contentId);
    if (!history || history.length < 2) {
      return null;
    }
    
    const scores = history.map(h => ({
      timestamp: h.timestamp,
      score: h.overallScore,
      category: 'overall'
    }));
    
    const averageScore = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;
    const volatility = this.calculateVolatility(scores.map(s => s.score));
    const trend = this.determineTrend(scores.map(s => s.score));
    
    return {
      timeframe,
      scores,
      averageScore: Math.round(averageScore),
      volatility: Math.round(volatility * 100) / 100,
      trend
    };
  }

  /**
   * Calculates score volatility
   */
  private calculateVolatility(scores: number[]): number {
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    return Math.sqrt(variance);
  }

  /**
   * Determines overall trend direction
   */
  private determineTrend(scores: number[]): 'upward' | 'downward' | 'stable' {
    if (scores.length < 3) return 'stable';
    
    const firstThird = scores.slice(0, Math.floor(scores.length / 3));
    const lastThird = scores.slice(-Math.floor(scores.length / 3));
    
    const firstAvg = firstThird.reduce((a, b) => a + b, 0) / firstThird.length;
    const lastAvg = lastThird.reduce((a, b) => a + b, 0) / lastThird.length;
    
    const difference = lastAvg - firstAvg;
    
    if (difference > 2) return 'upward';
    if (difference < -2) return 'downward';
    return 'stable';
  }
}
