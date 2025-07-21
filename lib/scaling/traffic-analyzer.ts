/**
 * Traffic Analyzer
 * Advanced traffic pattern analysis and spike prediction
 */

import { EventEmitter } from 'events';

export interface TrafficPattern {
  timestamp: Date;
  requestsPerSecond: number;
  uniqueUsers: number;
  averageResponseTime: number;
  errorRate: number;
  geographicDistribution: { [region: string]: number };
  userAgents: { [agent: string]: number };
  endpoints: { [endpoint: string]: number };
  statusCodes: { [code: string]: number };
}

export interface TrafficSpike {
  id: string;
  startTime: Date;
  endTime?: Date;
  peakRPS: number;
  baselineRPS: number;
  magnitude: number; // multiplier from baseline
  duration: number; // ms
  source: 'organic' | 'bot' | 'ddos' | 'viral' | 'scheduled';
  confidence: number; // 0-1
  characteristics: {
    suddenOnset: boolean;
    sustainedLoad: boolean;
    geographicSpread: boolean;
    userAgentDiversity: boolean;
  };
  predictedEndTime?: Date;
  mitigationActions: string[];
}

export interface TrafficPrediction {
  timestamp: Date;
  predictedRPS: number;
  confidence: number;
  timeframe: number; // minutes ahead
  basis: 'historical' | 'trend' | 'anomaly' | 'external';
  factors: string[];
  recommendations: string[];
}

export interface AnalyzerConfig {
  baselineWindow: number; // ms
  spikeThreshold: number; // multiplier
  minSpikeDuration: number; // ms
  predictionWindow: number; // ms
  anomalyDetectionSensitivity: number; // 0-1
  geoAnalysisEnabled: boolean;
  botDetectionEnabled: boolean;
  historicalDataRetention: number; // days
}

export class TrafficAnalyzer extends EventEmitter {
  private static instance: TrafficAnalyzer;
  private config: AnalyzerConfig;
  private patterns: TrafficPattern[] = [];
  private spikes: TrafficSpike[] = [];
  private predictions: TrafficPrediction[] = [];
  private isAnalyzing = false;
  private intervals: NodeJS.Timeout[] = [];
  private baseline: { rps: number; confidence: number } = { rps: 0, confidence: 0 };

  private constructor(config: AnalyzerConfig) {
    super();
    this.config = config;
  }

  public static getInstance(config?: AnalyzerConfig): TrafficAnalyzer {
    if (!TrafficAnalyzer.instance && config) {
      TrafficAnalyzer.instance = new TrafficAnalyzer(config);
    }
    return TrafficAnalyzer.instance;
  }

  /**
   * Start traffic analysis
   */
  start(): void {
    if (this.isAnalyzing) return;

    this.isAnalyzing = true;
    this.emit('analyzer_started');

    // Collect traffic patterns every 30 seconds
    const patternInterval = setInterval(() => {
      this.collectTrafficPattern();
    }, 30000);

    // Analyze for spikes every minute
    const spikeInterval = setInterval(() => {
      this.analyzeForSpikes();
    }, 60000);

    // Generate predictions every 5 minutes
    const predictionInterval = setInterval(() => {
      this.generatePredictions();
    }, 5 * 60 * 1000);

    // Update baseline every 10 minutes
    const baselineInterval = setInterval(() => {
      this.updateBaseline();
    }, 10 * 60 * 1000);

    this.intervals.push(patternInterval, spikeInterval, predictionInterval, baselineInterval);

    // Initial data collection
    this.collectTrafficPattern();
    this.updateBaseline();
  }

  /**
   * Stop traffic analysis
   */
  stop(): void {
    if (!this.isAnalyzing) return;

    this.isAnalyzing = false;
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];

    this.emit('analyzer_stopped');
  }

  /**
   * Record incoming request for analysis
   */
  recordRequest(request: {
    timestamp: Date;
    ip: string;
    userAgent: string;
    endpoint: string;
    responseTime: number;
    statusCode: number;
    region?: string;
  }): void {
    // This would integrate with actual request logging
    this.emit('request_recorded', request);
  }

  /**
   * Detect if current traffic is a spike
   */
  detectSpike(currentRPS: number): TrafficSpike | null {
    if (this.baseline.rps === 0 || this.baseline.confidence < 0.5) {
      return null; // Insufficient baseline data
    }

    const magnitude = currentRPS / this.baseline.rps;
    
    if (magnitude >= this.config.spikeThreshold) {
      // Analyze spike characteristics
      const characteristics = this.analyzeSpike(currentRPS);
      
      const spike: TrafficSpike = {
        id: `spike_${Date.now()}`,
        startTime: new Date(),
        peakRPS: currentRPS,
        baselineRPS: this.baseline.rps,
        magnitude,
        duration: 0,
        source: this.classifyTrafficSource(characteristics),
        confidence: this.calculateSpikeConfidence(magnitude, characteristics),
        characteristics,
        mitigationActions: this.generateMitigationActions(magnitude, characteristics)
      };

      this.spikes.push(spike);
      this.emit('spike_detected', spike);

      return spike;
    }

    return null;
  }

  /**
   * Get traffic analysis report
   */
  getAnalysisReport(): {
    currentBaseline: { rps: number; confidence: number };
    activeSpikes: TrafficSpike[];
    recentPredictions: TrafficPrediction[];
    patterns: {
      hourly: { [hour: string]: number };
      daily: { [day: string]: number };
      geographic: { [region: string]: number };
    };
    recommendations: string[];
  } {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const activeSpikes = this.spikes.filter(spike => 
      !spike.endTime && spike.startTime > oneHourAgo
    );

    const recentPredictions = this.predictions
      .filter(pred => pred.timestamp > oneHourAgo)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);

    const patterns = this.analyzeTrafficPatterns();
    const recommendations = this.generateRecommendations(activeSpikes, recentPredictions);

    return {
      currentBaseline: this.baseline,
      activeSpikes,
      recentPredictions,
      patterns,
      recommendations
    };
  }

  /**
   * Predict traffic for next period
   */
  predictTraffic(minutesAhead: number): TrafficPrediction {
    const now = new Date();
    const predictionTime = new Date(now.getTime() + minutesAhead * 60 * 1000);

    // Historical pattern analysis
    const historicalPrediction = this.predictFromHistoricalData(predictionTime);
    
    // Trend analysis
    const trendPrediction = this.predictFromTrend(minutesAhead);
    
    // Anomaly detection
    const anomalyPrediction = this.predictFromAnomalies(minutesAhead);

    // Combine predictions with weighted average
    const weightedRPS = (
      historicalPrediction.predictedRPS * 0.5 +
      trendPrediction.predictedRPS * 0.3 +
      anomalyPrediction.predictedRPS * 0.2
    );

    const combinedConfidence = Math.min(
      historicalPrediction.confidence,
      trendPrediction.confidence,
      anomalyPrediction.confidence
    );

    const prediction: TrafficPrediction = {
      timestamp: now,
      predictedRPS: weightedRPS,
      confidence: combinedConfidence,
      timeframe: minutesAhead,
      basis: 'historical',
      factors: [
        ...historicalPrediction.factors,
        ...trendPrediction.factors,
        ...anomalyPrediction.factors
      ],
      recommendations: this.generatePredictionRecommendations(weightedRPS, combinedConfidence)
    };

    this.predictions.push(prediction);
    this.emit('prediction_generated', prediction);

    return prediction;
  }

  /**
   * Check if traffic spike is ending
   */
  checkSpikeEnd(spikeId: string, currentRPS: number): boolean {
    const spike = this.spikes.find(s => s.id === spikeId);
    if (!spike || spike.endTime) return false;

    // Spike ends when traffic returns to within 150% of baseline for 5 minutes
    const endThreshold = this.baseline.rps * 1.5;
    
    if (currentRPS <= endThreshold) {
      const sustainedPeriod = 5 * 60 * 1000; // 5 minutes
      const recentPatterns = this.patterns.filter(p => 
        p.timestamp.getTime() > Date.now() - sustainedPeriod
      );

      const allBelowThreshold = recentPatterns.every(p => 
        p.requestsPerSecond <= endThreshold
      );

      if (allBelowThreshold && recentPatterns.length >= 10) { // At least 10 data points
        spike.endTime = new Date();
        spike.duration = spike.endTime.getTime() - spike.startTime.getTime();
        
        this.emit('spike_ended', spike);
        return true;
      }
    }

    return false;
  }

  /**
   * Collect current traffic pattern
   */
  private collectTrafficPattern(): void {
    // Mock implementation - would collect from actual traffic logs
    const pattern: TrafficPattern = {
      timestamp: new Date(),
      requestsPerSecond: this.getCurrentRPS(),
      uniqueUsers: this.getUniqueUsers(),
      averageResponseTime: this.getAverageResponseTime(),
      errorRate: this.getErrorRate(),
      geographicDistribution: this.getGeographicDistribution(),
      userAgents: this.getUserAgents(),
      endpoints: this.getEndpointDistribution(),
      statusCodes: this.getStatusCodes()
    };

    this.patterns.push(pattern);

    // Limit stored patterns
    const retentionPeriod = this.config.historicalDataRetention * 24 * 60 * 60 * 1000;
    const cutoff = new Date(Date.now() - retentionPeriod);
    this.patterns = this.patterns.filter(p => p.timestamp > cutoff);

    this.emit('pattern_collected', pattern);
  }

  /**
   * Analyze for traffic spikes
   */
  private analyzeForSpikes(): void {
    if (this.patterns.length === 0) return;

    const currentPattern = this.patterns[this.patterns.length - 1];
    const spike = this.detectSpike(currentPattern.requestsPerSecond);

    if (spike) {
      // Additional spike analysis
      this.analyzeSpkeImpact(spike);
    }

    // Check for ending spikes
    this.spikes.forEach(spike => {
      if (!spike.endTime) {
        this.checkSpikeEnd(spike.id, currentPattern.requestsPerSecond);
      }
    });
  }

  /**
   * Generate traffic predictions
   */
  private generatePredictions(): void {
    // Generate predictions for next 30 minutes, 1 hour, and 4 hours
    const timeframes = [30, 60, 240];

    timeframes.forEach(minutes => {
      const prediction = this.predictTraffic(minutes);
      
      if (prediction.confidence > 0.7 && prediction.predictedRPS > this.baseline.rps * 2) {
        this.emit('high_traffic_predicted', prediction);
      }
    });
  }

  /**
   * Update baseline traffic
   */
  private updateBaseline(): void {
    if (this.patterns.length < 50) return; // Need sufficient data

    const window = new Date(Date.now() - this.config.baselineWindow);
    const recentPatterns = this.patterns.filter(p => p.timestamp > window);

    if (recentPatterns.length === 0) return;

    // Filter out spike periods for baseline calculation
    const normalPatterns = recentPatterns.filter(p => {
      const isSpikePeriod = this.spikes.some(spike => 
        p.timestamp >= spike.startTime && 
        (!spike.endTime || p.timestamp <= spike.endTime)
      );
      return !isSpikePeriod;
    });

    if (normalPatterns.length === 0) return;

    const avgRPS = normalPatterns.reduce((sum, p) => sum + p.requestsPerSecond, 0) / normalPatterns.length;
    const variance = normalPatterns.reduce((sum, p) => 
      sum + Math.pow(p.requestsPerSecond - avgRPS, 2), 0
    ) / normalPatterns.length;
    
    const confidence = Math.max(0, Math.min(1, 1 - (Math.sqrt(variance) / avgRPS)));

    this.baseline = { rps: avgRPS, confidence };
    this.emit('baseline_updated', this.baseline);
  }

  /**
   * Analyze spike characteristics
   */
  private analyzeSpike(currentRPS: number): TrafficSpike['characteristics'] {
    const recentPatterns = this.patterns.slice(-10); // Last 10 patterns
    
    if (recentPatterns.length < 2) {
      return {
        suddenOnset: false,
        sustainedLoad: false,
        geographicSpread: false,
        userAgentDiversity: false
      };
    }

    // Sudden onset: RPS increased by >200% in last 2 minutes
    const twoMinutesAgo = recentPatterns[recentPatterns.length - 4]?.requestsPerSecond || 0;
    const suddenOnset = (currentRPS / twoMinutesAgo) > 2;

    // Sustained load: High RPS for at least 5 minutes
    const sustainedLoad = recentPatterns.slice(-10).every(p => 
      p.requestsPerSecond > this.baseline.rps * 1.5
    );

    // Geographic spread: Traffic from multiple regions
    const latestPattern = recentPatterns[recentPatterns.length - 1];
    const regions = Object.keys(latestPattern.geographicDistribution || {});
    const geographicSpread = regions.length > 3;

    // User agent diversity: Multiple different user agents
    const userAgents = Object.keys(latestPattern.userAgents || {});
    const userAgentDiversity = userAgents.length > 10;

    return {
      suddenOnset,
      sustainedLoad,
      geographicSpread,
      userAgentDiversity
    };
  }

  /**
   * Classify traffic source
   */
  private classifyTrafficSource(characteristics: TrafficSpike['characteristics']): TrafficSpike['source'] {
    if (!characteristics.geographicSpread && !characteristics.userAgentDiversity) {
      return 'bot';
    }
    
    if (characteristics.suddenOnset && !characteristics.sustainedLoad) {
      return 'ddos';
    }
    
    if (characteristics.geographicSpread && characteristics.userAgentDiversity && characteristics.sustainedLoad) {
      return 'viral';
    }
    
    return 'organic';
  }

  /**
   * Calculate spike confidence
   */
  private calculateSpikeConfidence(magnitude: number, characteristics: TrafficSpike['characteristics']): number {
    let confidence = 0.5; // Base confidence

    // Higher magnitude = higher confidence
    confidence += Math.min(0.3, magnitude * 0.1);

    // Characteristics that increase confidence
    if (characteristics.suddenOnset) confidence += 0.1;
    if (characteristics.sustainedLoad) confidence += 0.1;
    if (characteristics.geographicSpread) confidence += 0.05;
    if (characteristics.userAgentDiversity) confidence += 0.05;

    return Math.min(1, Math.max(0, confidence));
  }

  /**
   * Generate mitigation actions
   */
  private generateMitigationActions(magnitude: number, characteristics: TrafficSpike['characteristics']): string[] {
    const actions: string[] = [];

    if (magnitude > 5) {
      actions.push('Enable circuit breaker');
      actions.push('Scale up instances immediately');
    } else if (magnitude > 2) {
      actions.push('Scale up instances');
    }

    if (!characteristics.geographicSpread && !characteristics.userAgentDiversity) {
      actions.push('Enable bot protection');
      actions.push('Implement rate limiting');
    }

    if (characteristics.suddenOnset) {
      actions.push('Monitor for DDoS patterns');
      actions.push('Prepare emergency scaling');
    }

    if (magnitude > 10) {
      actions.push('Consider enabling maintenance mode');
      actions.push('Alert emergency response team');
    }

    return actions;
  }

  /**
   * Prediction methods
   */
  private predictFromHistoricalData(predictionTime: Date): TrafficPrediction {
    // Simple implementation - would use more sophisticated ML models
    const dayOfWeek = predictionTime.getDay();
    const hour = predictionTime.getHours();
    
    const historicalData = this.patterns.filter(p => 
      p.timestamp.getDay() === dayOfWeek && 
      p.timestamp.getHours() === hour
    );

    const avgRPS = historicalData.length > 0 
      ? historicalData.reduce((sum, p) => sum + p.requestsPerSecond, 0) / historicalData.length
      : this.baseline.rps;

    return {
      timestamp: new Date(),
      predictedRPS: avgRPS,
      confidence: Math.min(1, historicalData.length / 10),
      timeframe: 0,
      basis: 'historical',
      factors: [`Historical data for ${dayOfWeek}:${hour}`],
      recommendations: []
    };
  }

  private predictFromTrend(minutesAhead: number): TrafficPrediction {
    const recentPatterns = this.patterns.slice(-20);
    
    if (recentPatterns.length < 2) {
      return {
        timestamp: new Date(),
        predictedRPS: this.baseline.rps,
        confidence: 0.5,
        timeframe: minutesAhead,
        basis: 'trend',
        factors: ['Insufficient data for trend analysis'],
        recommendations: []
      };
    }

    // Calculate trend
    const x = recentPatterns.map((_, i) => i);
    const y = recentPatterns.map(p => p.requestsPerSecond);
    const trend = this.calculateLinearTrend(x, y);

    const predictedRPS = Math.max(0, y[y.length - 1] + trend.slope * (minutesAhead / 2)); // Approximate

    return {
      timestamp: new Date(),
      predictedRPS,
      confidence: Math.min(1, trend.r2),
      timeframe: minutesAhead,
      basis: 'trend',
      factors: [`Trend slope: ${trend.slope.toFixed(2)}`],
      recommendations: []
    };
  }

  private predictFromAnomalies(minutesAhead: number): TrafficPrediction {
    // Simple anomaly detection
    const recentPatterns = this.patterns.slice(-50);
    const anomalies = recentPatterns.filter(p => 
      Math.abs(p.requestsPerSecond - this.baseline.rps) > this.baseline.rps * 0.5
    );

    const hasRecentAnomalies = anomalies.some(a => 
      Date.now() - a.timestamp.getTime() < 30 * 60 * 1000 // Last 30 minutes
    );

    const predictedRPS = hasRecentAnomalies 
      ? this.baseline.rps * 1.5 
      : this.baseline.rps;

    return {
      timestamp: new Date(),
      predictedRPS,
      confidence: hasRecentAnomalies ? 0.7 : 0.8,
      timeframe: minutesAhead,
      basis: 'anomaly',
      factors: hasRecentAnomalies ? ['Recent anomalies detected'] : ['No recent anomalies'],
      recommendations: []
    };
  }

  /**
   * Helper methods for data collection (mock implementations)
   */
  private getCurrentRPS(): number {
    return Math.random() * 100 + 50; // 50-150 RPS
  }

  private getUniqueUsers(): number {
    return Math.floor(Math.random() * 1000) + 100;
  }

  private getAverageResponseTime(): number {
    return Math.random() * 500 + 100; // 100-600ms
  }

  private getErrorRate(): number {
    return Math.random() * 0.05; // 0-5%
  }

  private getGeographicDistribution(): { [region: string]: number } {
    return {
      'us-east': Math.random() * 0.4,
      'us-west': Math.random() * 0.3,
      'europe': Math.random() * 0.2,
      'asia': Math.random() * 0.1
    };
  }

  private getUserAgents(): { [agent: string]: number } {
    return {
      'chrome': Math.random() * 0.6,
      'firefox': Math.random() * 0.2,
      'safari': Math.random() * 0.15,
      'edge': Math.random() * 0.05
    };
  }

  private getEndpointDistribution(): { [endpoint: string]: number } {
    return {
      '/api/content': Math.random() * 0.4,
      '/api/seo': Math.random() * 0.3,
      '/api/analysis': Math.random() * 0.2,
      '/health': Math.random() * 0.1
    };
  }

  private getStatusCodes(): { [code: string]: number } {
    return {
      '200': Math.random() * 0.9 + 0.05, // 85-95%
      '404': Math.random() * 0.03,
      '500': Math.random() * 0.02,
      '429': Math.random() * 0.05
    };
  }

  private analyzeTrafficPatterns(): any {
    // Simplified pattern analysis
    const hourly: { [hour: string]: number } = {};
    const daily: { [day: string]: number } = {};
    const geographic: { [region: string]: number } = {};

    // This would analyze historical patterns
    for (let i = 0; i < 24; i++) {
      hourly[i.toString()] = Math.random() * 100;
    }

    for (let i = 0; i < 7; i++) {
      daily[i.toString()] = Math.random() * 1000;
    }

    geographic['us'] = Math.random() * 0.6;
    geographic['eu'] = Math.random() * 0.3;
    geographic['asia'] = Math.random() * 0.1;

    return { hourly, daily, geographic };
  }

  private generateRecommendations(activeSpikes: TrafficSpike[], predictions: TrafficPrediction[]): string[] {
    const recommendations: string[] = [];

    if (activeSpikes.length > 0) {
      recommendations.push(`${activeSpikes.length} active traffic spike(s) detected`);
      
      const highMagnitudeSpikes = activeSpikes.filter(s => s.magnitude > 5);
      if (highMagnitudeSpikes.length > 0) {
        recommendations.push('High magnitude spikes detected - consider emergency scaling');
      }
    }

    const highTrafficPredictions = predictions.filter(p => 
      p.predictedRPS > this.baseline.rps * 2 && p.confidence > 0.7
    );
    
    if (highTrafficPredictions.length > 0) {
      recommendations.push('High traffic predicted - prepare for scaling');
    }

    if (this.baseline.confidence < 0.5) {
      recommendations.push('Baseline confidence is low - collect more data');
    }

    return recommendations;
  }

  private generatePredictionRecommendations(predictedRPS: number, confidence: number): string[] {
    const recommendations: string[] = [];

    if (predictedRPS > this.baseline.rps * 3) {
      recommendations.push('Prepare for high traffic - consider pre-scaling');
    }

    if (confidence < 0.5) {
      recommendations.push('Low prediction confidence - monitor closely');
    }

    if (predictedRPS > this.baseline.rps * 5) {
      recommendations.push('Extreme traffic predicted - activate emergency protocols');
    }

    return recommendations;
  }

  private analyzeSpkeImpact(spike: TrafficSpike): void {
    // Analyze the impact of the spike on system performance
    // This would integrate with performance monitoring
    this.emit('spike_impact_analyzed', {
      spikeId: spike.id,
      impact: 'moderate', // This would be calculated
      affectedServices: ['api', 'database'],
      userExperience: 'degraded'
    });
  }

  private calculateLinearTrend(x: number[], y: number[]): { slope: number; r2: number } {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared
    const yMean = sumY / n;
    const ssRes = y.reduce((sum, yi, i) => {
      const predicted = slope * x[i] + intercept;
      return sum + Math.pow(yi - predicted, 2);
    }, 0);
    const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const r2 = 1 - (ssRes / ssTot);

    return { slope, r2 };
  }
}

// Export factory function with default configuration
export function createTrafficAnalyzer(config?: Partial<AnalyzerConfig>): TrafficAnalyzer {
  const defaultConfig: AnalyzerConfig = {
    baselineWindow: 24 * 60 * 60 * 1000, // 24 hours
    spikeThreshold: 2, // 2x baseline
    minSpikeDuration: 2 * 60 * 1000, // 2 minutes
    predictionWindow: 4 * 60 * 60 * 1000, // 4 hours
    anomalyDetectionSensitivity: 0.7,
    geoAnalysisEnabled: true,
    botDetectionEnabled: true,
    historicalDataRetention: 30 // 30 days
  };

  return TrafficAnalyzer.getInstance({ ...defaultConfig, ...config });
}

// Export singleton instance
export const trafficAnalyzer = createTrafficAnalyzer();