import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { EnhancedContentValidationPipeline } from '../enhanced-content-validation-pipeline';
import { FactVerifier } from '../fact-verifier';
import { HallucinationDetector } from '../hallucination-detector';
import { EnhancedExpertReviewSystem } from '../enhanced-expert-review-system';

// Mock the dependencies
jest.mock('../fact-verifier');
jest.mock('../hallucination-detector');
jest.mock('../enhanced-expert-review-system');

describe('Enhanced Content Validation Pipeline', () => {
  let validationPipeline: EnhancedContentValidationPipeline;
  let mockFactVerifier: jest.Mocked<FactVerifier>;
  let mockHallucinationDetector: jest.Mocked<HallucinationDetector>;
  let mockExpertReviewSystem: jest.Mocked<EnhancedExpertReviewSystem>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create pipeline with test configuration
    validationPipeline = new EnhancedContentValidationPipeline({
      performanceMode: 'comprehensive',
      cacheResults: false, // Disable cache for testing
      circuitBreakerConfig: {
        enabled: false // Disable circuit breaker for testing
      }
    });

    // Setup mock implementations
    mockFactVerifier = FactVerifier as jest.MockedClass<typeof FactVerifier>;
    mockHallucinationDetector = HallucinationDetector as jest.MockedClass<typeof HallucinationDetector>;
    mockExpertReviewSystem = EnhancedExpertReviewSystem as jest.MockedClass<typeof EnhancedExpertReviewSystem>;
  });

  describe('Content Validation - High Quality Content', () => {
    it('should validate high-quality content successfully', async () => {
      // Arrange
      const highQualityContent = `
        According to the World Health Organization (WHO), regular exercise can reduce the risk of heart disease by up to 30%. 
        This finding is supported by multiple peer-reviewed studies published in the Journal of the American Medical Association.
        The recommended amount of exercise is 150 minutes of moderate-intensity aerobic activity per week.
        Source: https://www.who.int/news-room/fact-sheets/detail/physical-activity
      `;

      // Mock successful fact verification
      mockFactVerifier.prototype.verifyFact = jest.fn().mockResolvedValue({
        fact: highQualityContent,
        isVerified: true,
        confidenceScore: 95,
        sources: [{ name: 'WHO', type: 'government', trustScore: 98 }],
        issues: [],
        recommendations: [],
        verificationMethod: 'api',
        processingTimeMs: 1200
      });

      // Mock low hallucination detection
      mockHallucinationDetector.prototype.detectHallucinations = jest.fn().mockReturnValue({
        hallucinationsDetected: false,
        hallucinationScore: 5,
        flaggedSentences: [],
        recommendations: [],
        riskLevel: 'low',
        processingTimeMs: 800
      });

      // Mock expert review not required
      mockExpertReviewSystem.prototype.triggerReview = jest.fn().mockResolvedValue({
        requiresExpertReview: false,
        urgencyLevel: 'low',
        reasons: [],
        suggestedExperts: [],
        autoApprovalPossible: true,
        riskScore: 15,
        workflowId: 'test-workflow-1'
      });

      // Act
      const result = await validationPipeline.validateContent(highQualityContent, {
        industry: 'health',
        contentType: 'article',
        urgency: 'medium'
      });

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.overallScore).toBeGreaterThan(80);
      expect(result.riskLevel).toBe('low');
      expect(result.expertReviewRequired).toBe(false);
      expect(result.validationSteps).toHaveLength(4); // fact, hallucination, source, accuracy
      expect(result.auditTrail).toBeDefined();
      expect(result.validationId).toBeDefined();
    });
  });

  describe('Content Validation - Problematic Content', () => {
    it('should flag content with hallucinations and require expert review', async () => {
      // Arrange
      const problematicContent = `
        Studies show that 99% of people who drink water will die within 100 years.
        This groundbreaking research proves that water is extremely dangerous.
        Scientists have discovered that water contains deadly dihydrogen monoxide.
        The government doesn't want you to know this secret truth.
      `;

      // Mock failed fact verification
      mockFactVerifier.prototype.verifyFact = jest.fn().mockResolvedValue({
        fact: problematicContent,
        isVerified: false,
        confidenceScore: 20,
        sources: [],
        issues: ['Misleading correlation presented as causation'],
        recommendations: ['Verify claims with authoritative sources'],
        verificationMethod: 'api',
        processingTimeMs: 1500
      });

      // Mock high hallucination detection
      mockHallucinationDetector.prototype.detectHallucinations = jest.fn().mockReturnValue({
        hallucinationsDetected: true,
        hallucinationScore: 85,
        flaggedSentences: [
          {
            sentence: 'Studies show that 99% of people who drink water will die within 100 years.',
            reason: 'Misleading statistical correlation',
            confidence: 90,
            detectionMethod: 'pattern_recognition',
            severity: 'high'
          },
          {
            sentence: 'The government doesn\'t want you to know this secret truth.',
            reason: 'Conspiracy theory language detected',
            confidence: 95,
            detectionMethod: 'pattern_recognition',
            severity: 'critical'
          }
        ],
        recommendations: ['Remove misleading claims', 'Provide proper context for statistics'],
        riskLevel: 'critical',
        processingTimeMs: 900
      });

      // Mock expert review required
      mockExpertReviewSystem.prototype.triggerReview = jest.fn().mockResolvedValue({
        requiresExpertReview: true,
        urgencyLevel: 'critical',
        reasons: ['High hallucination score detected', 'Misleading health claims'],
        suggestedExperts: [
          {
            id: 'expert-001',
            name: 'Dr. Sarah Chen',
            specialization: ['medical', 'health'],
            trustScore: 98,
            averageReviewTime: 25,
            availability: 'available',
            contactMethod: 'email',
            workload: 2,
            expertise: [{ domain: 'Medical Content', yearsExperience: 15, certifications: ['MD'] }]
          }
        ],
        autoApprovalPossible: false,
        riskScore: 85,
        workflowId: 'test-workflow-2'
      });

      // Act
      const result = await validationPipeline.validateContent(problematicContent, {
        industry: 'health',
        contentType: 'article',
        urgency: 'high'
      });

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.overallScore).toBeLessThan(50);
      expect(result.riskLevel).toBe('critical');
      expect(result.expertReviewRequired).toBe(true);
      expect(result.recommendations).toContain('Remove misleading claims');
      expect(result.validationSteps.some(step => step.status === 'failed')).toBe(true);
    });
  });

  describe('Performance and Caching', () => {
    it('should handle caching correctly when enabled', async () => {
      // Arrange
      const pipelineWithCache = new EnhancedContentValidationPipeline({
        cacheResults: true,
        cacheTTLHours: 1
      });

      const content = 'Test content for caching';

      // Mock responses
      mockFactVerifier.prototype.verifyFact = jest.fn().mockResolvedValue({
        fact: content,
        isVerified: true,
        confidenceScore: 80,
        sources: [],
        issues: [],
        recommendations: [],
        verificationMethod: 'api',
        processingTimeMs: 1000
      });

      mockHallucinationDetector.prototype.detectHallucinations = jest.fn().mockReturnValue({
        hallucinationsDetected: false,
        hallucinationScore: 10,
        flaggedSentences: [],
        recommendations: [],
        riskLevel: 'low',
        processingTimeMs: 500
      });

      mockExpertReviewSystem.prototype.triggerReview = jest.fn().mockResolvedValue({
        requiresExpertReview: false,
        urgencyLevel: 'low',
        reasons: [],
        suggestedExperts: [],
        autoApprovalPossible: true,
        riskScore: 20,
        workflowId: 'test-workflow-3'
      });

      // Act - First call
      const result1 = await pipelineWithCache.validateContent(content);
      
      // Act - Second call (should use cache)
      const result2 = await pipelineWithCache.validateContent(content);

      // Assert
      expect(result1.validationId).toBeDefined();
      expect(result2.validationId).toBeDefined();
      expect(result1.processingTimeMs).toBeGreaterThan(0);
      // Cache should be faster or at least not significantly slower
      expect(result2.processingTimeMs).toBeLessThanOrEqual(result1.processingTimeMs * 1.1);
    });

    it('should handle circuit breaker pattern correctly', async () => {
      // Arrange
      const pipelineWithCircuitBreaker = new EnhancedContentValidationPipeline({
        circuitBreakerConfig: {
          enabled: true,
          failureThreshold: 2,
          timeoutMs: 1000,
          resetTimeoutMs: 5000
        }
      });

      const content = 'Test content for circuit breaker';

      // Mock fact verifier to fail
      mockFactVerifier.prototype.verifyFact = jest.fn().mockRejectedValue(new Error('Service unavailable'));

      // Act & Assert
      try {
        await pipelineWithCircuitBreaker.validateContent(content);
        await pipelineWithCircuitBreaker.validateContent(content);
        await pipelineWithCircuitBreaker.validateContent(content); // This should trigger circuit breaker
        
        // Circuit breaker should be open now
        const result = await pipelineWithCircuitBreaker.validateContent(content);
        expect(result.isValid).toBe(false);
        expect(result.riskLevel).toBe('critical');
      } catch (error) {
        // Circuit breaker should prevent further calls
        expect(error).toBeDefined();
      }
    });
  });

  describe('Integration with Expert Review System', () => {
    it('should properly escalate high-risk content to expert review', async () => {
      // Arrange
      const medicalContent = `
        This new supplement can cure cancer in 30 days guaranteed.
        Clinical trials show 100% success rate with no side effects.
        Doctors don't want you to know about this miracle cure.
      `;

      // Mock high-risk responses
      mockFactVerifier.prototype.verifyFact = jest.fn().mockResolvedValue({
        fact: medicalContent,
        isVerified: false,
        confidenceScore: 10,
        sources: [],
        issues: ['Unsubstantiated medical claims'],
        recommendations: ['Require clinical evidence'],
        verificationMethod: 'api',
        processingTimeMs: 1200
      });

      mockHallucinationDetector.prototype.detectHallucinations = jest.fn().mockReturnValue({
        hallucinationsDetected: true,
        hallucinationScore: 95,
        flaggedSentences: [
          {
            sentence: 'This new supplement can cure cancer in 30 days guaranteed.',
            reason: 'Unsubstantiated medical claim',
            confidence: 98,
            detectionMethod: 'pattern_recognition',
            severity: 'critical'
          }
        ],
        recommendations: ['Remove unsubstantiated medical claims'],
        riskLevel: 'critical',
        processingTimeMs: 800
      });

      mockExpertReviewSystem.prototype.triggerReview = jest.fn().mockResolvedValue({
        requiresExpertReview: true,
        urgencyLevel: 'critical',
        reasons: ['Unsubstantiated medical claims', 'High hallucination score'],
        suggestedExperts: [
          {
            id: 'expert-001',
            name: 'Dr. Sarah Chen',
            specialization: ['medical', 'health'],
            trustScore: 98,
            averageReviewTime: 25,
            availability: 'available',
            contactMethod: 'urgent_phone',
            workload: 2,
            expertise: [{ domain: 'Medical Content', yearsExperience: 15, certifications: ['MD'] }]
          }
        ],
        escalationPath: [
          {
            level: 1,
            triggerCondition: 'Critical medical claims detected',
            assignedExperts: ['expert-001'],
            maxWaitTime: 30,
            autoEscalate: true,
            notificationMethod: 'urgent_phone'
          }
        ],
        autoApprovalPossible: false,
        riskScore: 95,
        workflowId: 'test-workflow-4'
      });

      // Act
      const result = await validationPipeline.validateContent(medicalContent, {
        industry: 'health',
        contentType: 'supplement_marketing',
        urgency: 'critical'
      });

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.riskLevel).toBe('critical');
      expect(result.expertReviewRequired).toBe(true);
      expect(result.expertReviewResult?.urgencyLevel).toBe('critical');
      expect(result.expertReviewResult?.suggestedExperts).toHaveLength(1);
      expect(result.expertReviewResult?.escalationPath).toBeDefined();
      expect(mockExpertReviewSystem.prototype.triggerReview).toHaveBeenCalledWith(
        medicalContent,
        expect.objectContaining({
          industry: 'health',
          hallucinationScore: 95,
          confidenceScore: expect.any(Number)
        })
      );
    });
  });

  describe('Audit Trail and Compliance', () => {
    it('should maintain comprehensive audit trail', async () => {
      // Arrange
      const content = 'Test content for audit trail';
      const userId = 'test-user-123';

      // Mock responses
      mockFactVerifier.prototype.verifyFact = jest.fn().mockResolvedValue({
        fact: content,
        isVerified: true,
        confidenceScore: 85,
        sources: [],
        issues: [],
        recommendations: [],
        verificationMethod: 'api',
        processingTimeMs: 1000
      });

      mockHallucinationDetector.prototype.detectHallucinations = jest.fn().mockReturnValue({
        hallucinationsDetected: false,
        hallucinationScore: 15,
        flaggedSentences: [],
        recommendations: [],
        riskLevel: 'low',
        processingTimeMs: 500
      });

      mockExpertReviewSystem.prototype.triggerReview = jest.fn().mockResolvedValue({
        requiresExpertReview: false,
        urgencyLevel: 'low',
        reasons: [],
        suggestedExperts: [],
        autoApprovalPossible: true,
        riskScore: 25,
        workflowId: 'test-workflow-5'
      });

      // Act
      const result = await validationPipeline.validateContent(content, {
        userId,
        industry: 'technology',
        contentType: 'blog_post'
      });

      // Assert
      expect(result.auditTrail).toBeDefined();
      expect(result.auditTrail.length).toBeGreaterThan(0);
      
      // Check for required audit entries
      const startEntry = result.auditTrail.find(entry => entry.action === 'validation_started');
      const endEntry = result.auditTrail.find(entry => entry.action === 'validation_completed');
      
      expect(startEntry).toBeDefined();
      expect(startEntry?.userId).toBe(userId);
      expect(startEntry?.details).toMatchObject({
        contentLength: content.length,
        context: expect.objectContaining({ userId, industry: 'technology' })
      });
      
      expect(endEntry).toBeDefined();
      expect(endEntry?.details).toMatchObject({
        isValid: true,
        overallScore: expect.any(Number),
        riskLevel: 'low'
      });
    });
  });
});
