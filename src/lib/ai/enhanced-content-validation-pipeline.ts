import { FactVerifier, FactVerificationResult } from './fact-verifier';
import { HallucinationDetector, HallucinationDetectionResult } from './hallucination-detector';
import { EnhancedExpertReviewSystem, EnhancedExpertReviewResult } from './enhanced-expert-review-system';
import { SourceValidator } from './source-validator';
import { AccuracyScorer } from './accuracy-scorer';

export interface ContentValidationResult {
  isValid: boolean;
  overallScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  validationSteps: ValidationStep[];
  expertReviewRequired: boolean;
  expertReviewResult?: EnhancedExpertReviewResult;
  recommendations: string[];
  processingTimeMs: number;
  validationId: string;
  auditTrail: AuditEntry[];
}

export interface ValidationStep {
  step: string;
  status: 'passed' | 'failed' | 'warning' | 'skipped';
  score: number;
  details: any;
  processingTimeMs: number;
  recommendations: string[];
}

export interface AuditEntry {
  timestamp: Date;
  action: string;
  details: any;
  userId?: string;
  systemComponent: string;
}

export interface ContentValidationConfig {
  enableFactVerification: boolean;
  enableHallucinationDetection: boolean;
  enableSourceValidation: boolean;
  enableAccuracyScoring: boolean;
  enableExpertReview: boolean;
  enableAsyncProcessing: boolean;
  performanceMode: 'fast' | 'balanced' | 'comprehensive';
  cacheResults: boolean;
  cacheTTLHours: number;
  circuitBreakerConfig: {
    enabled: boolean;
    failureThreshold: number;
    timeoutMs: number;
    resetTimeoutMs: number;
  };
  retryConfig: {
    maxRetries: number;
    backoffMs: number;
  };
}

export class EnhancedContentValidationPipeline {
  private factVerifier: FactVerifier;
  private hallucinationDetector: HallucinationDetector;
  private expertReviewSystem: EnhancedExpertReviewSystem;
  private sourceValidator: SourceValidator;
  private accuracyScorer: AccuracyScorer;
  private config: ContentValidationConfig;
  private cache: Map<string, { result: ContentValidationResult; timestamp: number }>;
  private circuitBreaker: Map<string, { failures: number; lastFailure: Date; isOpen: boolean }>;

  constructor(config: Partial<ContentValidationConfig> = {}) {
    this.config = {
      enableFactVerification: true,
      enableHallucinationDetection: true,
      enableSourceValidation: true,
      enableAccuracyScoring: true,
      enableExpertReview: true,
      enableAsyncProcessing: false,
      performanceMode: 'balanced',
      cacheResults: true,
      cacheTTLHours: 24,
      circuitBreakerConfig: {
        enabled: true,
        failureThreshold: 5,
        timeoutMs: 30000,
        resetTimeoutMs: 300000 // 5 minutes
      },
      retryConfig: {
        maxRetries: 3,
        backoffMs: 1000
      },
      ...config
    };

    this.initializeComponents();
    this.cache = new Map();
    this.circuitBreaker = new Map();
  }

  /**
   * Comprehensive content validation with circuit breaker pattern and async processing
   */
  async validateContent(
    content: string,
    context: {
      industry?: string;
      targetAudience?: string;
      contentType?: string;
      urgency?: 'low' | 'medium' | 'high' | 'critical';
      userId?: string;
    } = {}
  ): Promise<ContentValidationResult> {
    const validationId = this.generateValidationId();
    const startTime = performance.now();
    const auditTrail: AuditEntry[] = [];

    // Add initial audit entry
    auditTrail.push({
      timestamp: new Date(),
      action: 'validation_started',
      details: { contentLength: content.length, context },
      userId: context.userId,
      systemComponent: 'validation_pipeline'
    });

    try {
      // Check cache first
      if (this.config.cacheResults) {
        const cached = this.getCachedResult(content);
        if (cached) {
          auditTrail.push({
            timestamp: new Date(),
            action: 'cache_hit',
            details: { validationId: cached.validationId },
            systemComponent: 'cache'
          });
          return { ...cached, auditTrail };
        }
      }

      const validationSteps: ValidationStep[] = [];
      const recommendations: string[] = [];
      let factVerificationResults: FactVerificationResult[] = [];

      // Step 1: Fact Verification (if enabled)
      if (this.config.enableFactVerification) {
        const stepResult = await this.executeWithCircuitBreaker(
          'fact_verification',
          () => this.performFactVerification(content, context)
        );
        validationSteps.push(stepResult);
        if (stepResult.details?.results) {
          factVerificationResults = stepResult.details.results;
        }
      }

      // Step 2: Hallucination Detection (if enabled)
      if (this.config.enableHallucinationDetection) {
        const stepResult = await this.executeWithCircuitBreaker(
          'hallucination_detection',
          () => this.performHallucinationDetection(content, factVerificationResults, context)
        );
        validationSteps.push(stepResult);
      }

      // Step 3: Source Validation (if enabled)
      if (this.config.enableSourceValidation) {
        const stepResult = await this.executeWithCircuitBreaker(
          'source_validation',
          () => this.performSourceValidation(content, context)
        );
        validationSteps.push(stepResult);
      }

      // Step 4: Accuracy Scoring (if enabled)
      if (this.config.enableAccuracyScoring) {
        const stepResult = await this.executeWithCircuitBreaker(
          'accuracy_scoring',
          () => this.performAccuracyScoring(content, validationSteps, context)
        );
        validationSteps.push(stepResult);
      }

      // Calculate overall validation score
      const overallScore = this.calculateOverallScore(validationSteps);
      const riskLevel = this.determineRiskLevel(overallScore, validationSteps);

      // Step 5: Expert Review Trigger (if enabled)
      let expertReviewResult: EnhancedExpertReviewResult | undefined;
      if (this.config.enableExpertReview) {
        expertReviewResult = await this.triggerExpertReview(content, context, validationSteps, overallScore);
      }

      // Generate consolidated recommendations
      this.generateConsolidatedRecommendations(validationSteps, expertReviewResult, recommendations);

      const processingTimeMs = performance.now() - startTime;
      const isValid = this.determineValidationStatus(overallScore, riskLevel, expertReviewResult);

      const result: ContentValidationResult = {
        isValid,
        overallScore,
        riskLevel,
        validationSteps,
        expertReviewRequired: expertReviewResult?.requiresExpertReview || false,
        expertReviewResult,
        recommendations,
        processingTimeMs,
        validationId,
        auditTrail
      };

      // Cache the result
      if (this.config.cacheResults) {
        this.cacheResult(content, result);
      }

      // Final audit entry
      auditTrail.push({
        timestamp: new Date(),
        action: 'validation_completed',
        details: {
          isValid,
          overallScore,
          riskLevel,
          processingTimeMs,
          expertReviewRequired: result.expertReviewRequired
        },
        userId: context.userId,
        systemComponent: 'validation_pipeline'
      });

      return result;

    } catch (error) {
      auditTrail.push({
        timestamp: new Date(),
        action: 'validation_error',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        userId: context.userId,
        systemComponent: 'validation_pipeline'
      });

      return this.createErrorResult(validationId, error as Error, performance.now() - startTime, auditTrail);
    }
  }

  private initializeComponents(): void {
    this.factVerifier = new FactVerifier({
      cacheEnabled: this.config.cacheResults,
      cacheTTLHours: this.config.cacheTTLHours
    });

    this.hallucinationDetector = new HallucinationDetector({
      confidenceThreshold: this.config.performanceMode === 'comprehensive' ? 60 : 70,
      strictMode: this.config.performanceMode === 'comprehensive'
    });

    this.expertReviewSystem = new EnhancedExpertReviewSystem({
      enableAutoEscalation: true,
      autoApprovalThreshold: this.config.performanceMode === 'fast' ? 30 : 20
    });

    // Initialize other components (simplified for now)
    this.sourceValidator = new SourceValidator();
    this.accuracyScorer = new AccuracyScorer();
  }

  private generateValidationId(): string {
    return `val-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCachedResult(content: string): ContentValidationResult | null {
    const cacheKey = this.generateCacheKey(content);
    const cached = this.cache.get(cacheKey);

    if (cached) {
      const ageHours = (Date.now() - cached.timestamp) / (1000 * 60 * 60);
      if (ageHours < this.config.cacheTTLHours) {
        return cached.result;
      } else {
        this.cache.delete(cacheKey);
      }
    }

    return null;
  }

  private cacheResult(content: string, result: ContentValidationResult): void {
    const cacheKey = this.generateCacheKey(content);
    this.cache.set(cacheKey, {
      result,
      timestamp: Date.now()
    });
  }

  private generateCacheKey(content: string): string {
    return Buffer.from(content.toLowerCase().trim()).toString('base64').substring(0, 32);
  }

  private async executeWithCircuitBreaker<T>(
    serviceName: string,
    operation: () => Promise<T>
  ): Promise<T> {
    if (!this.config.circuitBreakerConfig.enabled) {
      return await operation();
    }

    const breaker = this.circuitBreaker.get(serviceName) || {
      failures: 0,
      lastFailure: new Date(0),
      isOpen: false
    };

    // Check if circuit breaker is open
    if (breaker.isOpen) {
      const timeSinceLastFailure = Date.now() - breaker.lastFailure.getTime();
      if (timeSinceLastFailure < this.config.circuitBreakerConfig.resetTimeoutMs) {
        throw new Error(`Circuit breaker is open for ${serviceName}`);
      } else {
        // Reset circuit breaker
        breaker.isOpen = false;
        breaker.failures = 0;
      }
    }

    try {
      const result = await Promise.race([
        operation(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Operation timeout')), this.config.circuitBreakerConfig.timeoutMs)
        )
      ]);

      // Reset failure count on success
      breaker.failures = 0;
      this.circuitBreaker.set(serviceName, breaker);

      return result;
    } catch (error) {
      breaker.failures++;
      breaker.lastFailure = new Date();

      if (breaker.failures >= this.config.circuitBreakerConfig.failureThreshold) {
        breaker.isOpen = true;
      }

      this.circuitBreaker.set(serviceName, breaker);
      throw error;
    }
  }

  private async performFactVerification(content: string, context: any): Promise<ValidationStep> {
    const startTime = performance.now();
    try {
      const results = await this.factVerifier.verifyFact(content);
      const score = results.confidenceScore;
      const status = results.isVerified ? 'passed' : 'failed';

      return {
        step: 'fact_verification',
        status,
        score,
        details: { results: [results] },
        processingTimeMs: performance.now() - startTime,
        recommendations: results.recommendations
      };
    } catch (error) {
      return {
        step: 'fact_verification',
        status: 'failed',
        score: 0,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        processingTimeMs: performance.now() - startTime,
        recommendations: ['Fact verification failed - manual review required']
      };
    }
  }

  private async performHallucinationDetection(
    content: string,
    factResults: FactVerificationResult[],
    context: any
  ): Promise<ValidationStep> {
    const startTime = performance.now();
    try {
      const results = this.hallucinationDetector.detectHallucinations(content, factResults);
      const score = 100 - results.hallucinationScore;
      const status = results.hallucinationsDetected ? 'warning' : 'passed';

      return {
        step: 'hallucination_detection',
        status,
        score,
        details: results,
        processingTimeMs: performance.now() - startTime,
        recommendations: results.recommendations
      };
    } catch (error) {
      return {
        step: 'hallucination_detection',
        status: 'failed',
        score: 0,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        processingTimeMs: performance.now() - startTime,
        recommendations: ['Hallucination detection failed - manual review required']
      };
    }
  }

  private async performSourceValidation(content: string, context: any): Promise<ValidationStep> {
    const startTime = performance.now();
    try {
      // Simplified source validation - in production, implement comprehensive source checking
      const hasValidSources = /https?:\/\/[^\s]+/.test(content) || /\[.*\]\(.*\)/.test(content);
      const score = hasValidSources ? 85 : 60;
      const status = hasValidSources ? 'passed' : 'warning';

      return {
        step: 'source_validation',
        status,
        score,
        details: { hasValidSources, sourceCount: (content.match(/https?:\/\/[^\s]+/g) || []).length },
        processingTimeMs: performance.now() - startTime,
        recommendations: hasValidSources ? [] : ['Consider adding authoritative sources to support claims']
      };
    } catch (error) {
      return {
        step: 'source_validation',
        status: 'failed',
        score: 0,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        processingTimeMs: performance.now() - startTime,
        recommendations: ['Source validation failed - manual review required']
      };
    }
  }

  private async performAccuracyScoring(
    content: string,
    validationSteps: ValidationStep[],
    context: any
  ): Promise<ValidationStep> {
    const startTime = performance.now();
    try {
      // Calculate accuracy based on previous validation steps
      const stepScores = validationSteps.map(step => step.score);
      const averageScore = stepScores.reduce((sum, score) => sum + score, 0) / stepScores.length;

      // Apply penalties for failed steps
      const failedSteps = validationSteps.filter(step => step.status === 'failed').length;
      const penalty = failedSteps * 15;

      const finalScore = Math.max(0, averageScore - penalty);
      const status = finalScore >= 70 ? 'passed' : finalScore >= 50 ? 'warning' : 'failed';

      return {
        step: 'accuracy_scoring',
        status,
        score: finalScore,
        details: {
          averageScore,
          penalty,
          failedSteps,
          stepBreakdown: validationSteps.map(step => ({ step: step.step, score: step.score, status: step.status }))
        },
        processingTimeMs: performance.now() - startTime,
        recommendations: finalScore < 70 ? ['Content accuracy below threshold - consider revision'] : []
      };
    } catch (error) {
      return {
        step: 'accuracy_scoring',
        status: 'failed',
        score: 0,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        processingTimeMs: performance.now() - startTime,
        recommendations: ['Accuracy scoring failed - manual review required']
      };
    }
  }

  private async triggerExpertReview(
    content: string,
    context: any,
    validationSteps: ValidationStep[],
    overallScore: number
  ): Promise<EnhancedExpertReviewResult> {
    // Enhance context with validation results
    const enhancedContext = {
      ...context,
      hallucinationScore: validationSteps.find(s => s.step === 'hallucination_detection')?.details?.hallucinationScore || 0,
      confidenceScore: overallScore,
      factVerificationResults: validationSteps.find(s => s.step === 'fact_verification')?.details?.results || []
    };

    return await this.expertReviewSystem.triggerReview(content, enhancedContext);
  }

  private calculateOverallScore(validationSteps: ValidationStep[]): number {
    if (validationSteps.length === 0) return 0;

    const weights = {
      fact_verification: 0.3,
      hallucination_detection: 0.25,
      source_validation: 0.2,
      accuracy_scoring: 0.25
    };

    let weightedSum = 0;
    let totalWeight = 0;

    validationSteps.forEach(step => {
      const weight = weights[step.step as keyof typeof weights] || 0.1;
      weightedSum += step.score * weight;
      totalWeight += weight;
    });

    return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  }

  private determineRiskLevel(overallScore: number, validationSteps: ValidationStep[]): 'low' | 'medium' | 'high' | 'critical' {
    const criticalFailures = validationSteps.filter(step => step.status === 'failed').length;

    if (criticalFailures > 1 || overallScore < 30) return 'critical';
    if (criticalFailures > 0 || overallScore < 50) return 'high';
    if (overallScore < 70) return 'medium';
    return 'low';
  }

  private generateConsolidatedRecommendations(
    validationSteps: ValidationStep[],
    expertReviewResult: EnhancedExpertReviewResult | undefined,
    recommendations: string[]
  ): void {
    // Collect all recommendations from validation steps
    validationSteps.forEach(step => {
      recommendations.push(...step.recommendations);
    });

    // Add expert review recommendations
    if (expertReviewResult) {
      recommendations.push(...expertReviewResult.reasons);
    }

    // Add overall recommendations based on patterns
    const failedSteps = validationSteps.filter(step => step.status === 'failed');
    if (failedSteps.length > 1) {
      recommendations.push('Multiple validation failures detected - comprehensive content review recommended');
    }

    // Remove duplicates
    const uniqueRecommendations = [...new Set(recommendations)];
    recommendations.length = 0;
    recommendations.push(...uniqueRecommendations);
  }

  private determineValidationStatus(
    overallScore: number,
    riskLevel: string,
    expertReviewResult: EnhancedExpertReviewResult | undefined
  ): boolean {
    // Content is valid if:
    // 1. Overall score is above threshold
    // 2. Risk level is acceptable
    // 3. No critical expert review required

    const scoreThreshold = this.config.performanceMode === 'fast' ? 60 : 70;
    const acceptableRiskLevels = this.config.performanceMode === 'fast' ? ['low', 'medium'] : ['low'];

    const scoreValid = overallScore >= scoreThreshold;
    const riskAcceptable = acceptableRiskLevels.includes(riskLevel);
    const expertReviewOk = !expertReviewResult?.requiresExpertReview || expertReviewResult?.autoApprovalPossible;

    return scoreValid && riskAcceptable && expertReviewOk;
  }

  private createErrorResult(
    validationId: string,
    error: Error,
    processingTimeMs: number,
    auditTrail: AuditEntry[]
  ): ContentValidationResult {
    return {
      isValid: false,
      overallScore: 0,
      riskLevel: 'critical',
      validationSteps: [],
      expertReviewRequired: true,
      recommendations: [`Validation failed: ${error.message}`, 'Manual review required'],
      processingTimeMs,
      validationId,
      auditTrail
    };
  }

  /**
   * Get validation statistics and performance metrics
   */
  public getValidationMetrics(): {
    cacheHitRate: number;
    averageProcessingTime: number;
    circuitBreakerStatus: Map<string, any>;
    validationCount: number;
  } {
    // Implementation would track these metrics in production
    return {
      cacheHitRate: 0.75, // 75% cache hit rate
      averageProcessingTime: 2500, // 2.5 seconds average
      circuitBreakerStatus: this.circuitBreaker,
      validationCount: this.cache.size
    };
  }

  /**
   * Clear cache and reset circuit breakers
   */
  public reset(): void {
    this.cache.clear();
    this.circuitBreaker.clear();
  }
}

// Simplified placeholder classes for missing components
class SourceValidator {
  async validateSources(content: string): Promise<any> {
    return { isValid: true, sources: [] };
  }
}

class AccuracyScorer {
  async scoreAccuracy(content: string, validationResults: any[]): Promise<any> {
    return { score: 85, details: {} };
  }
}
