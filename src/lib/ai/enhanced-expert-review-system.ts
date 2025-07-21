export interface EnhancedExpertReviewResult {
  requiresExpertReview: boolean;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  reasons: string[];
  suggestedExperts: ExpertProfile[];
  estimatedReviewTime: number; // in minutes
  escalationPath: EscalationStep[];
  reviewCriteria: ReviewCriteria;
  autoApprovalPossible: boolean;
  riskScore: number; // 0-100
  workflowId: string;
}

export interface ExpertProfile {
  id: string;
  name: string;
  specialization: string[];
  trustScore: number; // 0-100
  averageReviewTime: number; // minutes
  availability: 'available' | 'busy' | 'unavailable';
  contactMethod: 'email' | 'slack' | 'urgent_phone';
  workload: number; // current number of pending reviews
  expertise: {
    domain: string;
    yearsExperience: number;
    certifications: string[];
  }[];
}

export interface EscalationStep {
  level: number;
  triggerCondition: string;
  assignedExperts: string[];
  maxWaitTime: number; // minutes
  autoEscalate: boolean;
  notificationMethod: 'email' | 'slack' | 'sms' | 'phone';
}

export interface ReviewCriteria {
  factualAccuracy: boolean;
  legalCompliance: boolean;
  ethicalConsiderations: boolean;
  brandAlignment: boolean;
  technicalAccuracy: boolean;
  sourceVerification: boolean;
  sensitivityCheck: boolean;
  regulatoryCompliance: boolean;
}

export interface ExpertReviewConfig {
  enableAutoEscalation: boolean;
  maxReviewWaitTime: number; // minutes
  riskThresholds: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  expertDatabase: ExpertProfile[];
  sensitiveTopics: string[];
  criticalDomains: string[];
  autoApprovalThreshold: number; // risk score below which auto-approval is possible
  escalationTimeouts: number[]; // minutes for each escalation level
}

export class EnhancedExpertReviewSystem {
  private config: ExpertReviewConfig;
  private expertDatabase: Map<string, ExpertProfile>;
  private activeReviews: Map<string, { startTime: Date; assignedExpert: string; escalationLevel: number }>;

  constructor(config: Partial<ExpertReviewConfig> = {}) {
    this.config = {
      enableAutoEscalation: true,
      maxReviewWaitTime: 120, // 2 hours
      riskThresholds: {
        low: 25,
        medium: 50,
        high: 75,
        critical: 90
      },
      expertDatabase: this.initializeExpertDatabase(),
      sensitiveTopics: [
        'politics', 'religion', 'controversial', 'discrimination',
        'violence', 'adult content', 'illegal activities', 'conspiracy theories'
      ],
      criticalDomains: [
        'medical', 'legal', 'financial', 'health', 'investment',
        'tax', 'insurance', 'pharmaceuticals', 'safety', 'nuclear',
        'aerospace', 'cybersecurity', 'privacy'
      ],
      autoApprovalThreshold: 20,
      escalationTimeouts: [30, 60, 120, 240], // 30min, 1hr, 2hr, 4hr
      ...config
    };

    this.expertDatabase = new Map(
      this.config.expertDatabase.map(expert => [expert.id, expert])
    );
    this.activeReviews = new Map();
  }

  /**
   * Advanced expert review trigger with comprehensive risk assessment
   */
  async triggerReview(
    content: string,
    context: {
      industry?: string;
      keyword?: string;
      sensitiveTopics?: string[];
      factVerificationResults?: any[];
      hallucinationScore?: number;
      confidenceScore?: number;
      contentType?: string;
      targetAudience?: string;
    }
  ): Promise<EnhancedExpertReviewResult> {
    const workflowId = this.generateWorkflowId();
    const reasons: string[] = [];
    const riskFactors: Array<{factor: string; score: number; weight: number}> = [];

    // Comprehensive risk analysis
    await this.analyzeContentRisks(content, context, reasons, riskFactors);

    // Calculate overall risk score
    const riskScore = this.calculateRiskScore(riskFactors);

    // Determine urgency level based on risk score
    const urgencyLevel = this.determineUrgencyLevel(riskScore);

    // Select appropriate experts based on content and risk
    const suggestedExperts = await this.selectOptimalExperts(content, context, urgencyLevel);

    // Create intelligent escalation path
    const escalationPath = this.createEscalationPath(urgencyLevel, suggestedExperts);

    // Define comprehensive review criteria
    const reviewCriteria = this.defineReviewCriteria(content, context, riskScore);

    // Estimate realistic review time
    const estimatedReviewTime = this.estimateReviewTime(content, urgencyLevel, reviewCriteria, suggestedExperts);

    // Determine if expert review is required
    const requiresExpertReview = riskScore > this.config.autoApprovalThreshold;
    const autoApprovalPossible = riskScore <= this.config.autoApprovalThreshold;

    // Start tracking if review is required
    if (requiresExpertReview && suggestedExperts.length > 0) {
      this.activeReviews.set(workflowId, {
        startTime: new Date(),
        assignedExpert: suggestedExperts[0].id,
        escalationLevel: 0
      });
    }

    return {
      requiresExpertReview,
      urgencyLevel,
      reasons,
      suggestedExperts,
      estimatedReviewTime,
      escalationPath,
      reviewCriteria,
      autoApprovalPossible,
      riskScore,
      workflowId
    };
  }

  private initializeExpertDatabase(): ExpertProfile[] {
    return [
      {
        id: 'expert-001',
        name: 'Dr. Sarah Chen',
        specialization: ['medical', 'health', 'pharmaceuticals'],
        trustScore: 98,
        averageReviewTime: 25,
        availability: 'available',
        contactMethod: 'email',
        workload: 2,
        expertise: [
          { domain: 'Medical Content', yearsExperience: 15, certifications: ['MD', 'Board Certified'] }
        ]
      },
      {
        id: 'expert-002',
        name: 'James Rodriguez',
        specialization: ['legal', 'compliance', 'regulatory'],
        trustScore: 96,
        averageReviewTime: 35,
        availability: 'available',
        contactMethod: 'slack',
        workload: 1,
        expertise: [
          { domain: 'Legal Compliance', yearsExperience: 12, certifications: ['JD', 'Bar Certified'] }
        ]
      },
      {
        id: 'expert-003',
        name: 'Maria Gonzalez',
        specialization: ['financial', 'investment', 'tax'],
        trustScore: 94,
        averageReviewTime: 30,
        availability: 'busy',
        contactMethod: 'email',
        workload: 4,
        expertise: [
          { domain: 'Financial Services', yearsExperience: 18, certifications: ['CFA', 'CPA'] }
        ]
      },
      {
        id: 'expert-004',
        name: 'Dr. Alex Kim',
        specialization: ['technology', 'cybersecurity', 'privacy'],
        trustScore: 92,
        averageReviewTime: 20,
        availability: 'available',
        contactMethod: 'slack',
        workload: 3,
        expertise: [
          { domain: 'Technology & Security', yearsExperience: 10, certifications: ['CISSP', 'PhD Computer Science'] }
        ]
      },
      {
        id: 'expert-005',
        name: 'Emma Thompson',
        specialization: ['content ethics', 'brand safety', 'editorial'],
        trustScore: 90,
        averageReviewTime: 15,
        availability: 'available',
        contactMethod: 'slack',
        workload: 1,
        expertise: [
          { domain: 'Content Ethics', yearsExperience: 8, certifications: ['Editorial Certification'] }
        ]
      }
    ];
  }

  private generateWorkflowId(): string {
    return `review-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async analyzeContentRisks(
    content: string,
    context: any,
    reasons: string[],
    riskFactors: Array<{factor: string; score: number; weight: number}>
  ): Promise<void> {
    const contentLower = content.toLowerCase();

    // Risk Factor 1: Sensitive Topics
    for (const topic of this.config.sensitiveTopics) {
      if (contentLower.includes(topic.toLowerCase())) {
        reasons.push(`Contains sensitive topic: ${topic}`);
        riskFactors.push({ factor: 'sensitive_topic', score: 80, weight: 0.3 });
      }
    }

    // Risk Factor 2: Critical Domains
    for (const domain of this.config.criticalDomains) {
      if (contentLower.includes(domain.toLowerCase()) ||
          (context.industry && context.industry.toLowerCase().includes(domain))) {
        reasons.push(`Critical domain content: ${domain}`);
        riskFactors.push({ factor: 'critical_domain', score: 70, weight: 0.25 });
      }
    }

    // Risk Factor 3: Hallucination Score
    if (context.hallucinationScore && context.hallucinationScore > 50) {
      reasons.push(`High hallucination risk: ${context.hallucinationScore}%`);
      riskFactors.push({ factor: 'hallucination_risk', score: context.hallucinationScore, weight: 0.2 });
    }

    // Risk Factor 4: Low Confidence Score
    if (context.confidenceScore && context.confidenceScore < 70) {
      reasons.push(`Low confidence in content accuracy: ${context.confidenceScore}%`);
      riskFactors.push({ factor: 'low_confidence', score: 100 - context.confidenceScore, weight: 0.15 });
    }

    // Risk Factor 5: Unverified Claims
    const claimPatterns = [
      /\d+% of (?:people|users|customers)/gi,
      /studies show that/gi,
      /research proves/gi,
      /experts agree/gi
    ];

    let unverifiedClaims = 0;
    for (const pattern of claimPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        unverifiedClaims += matches.length;
      }
    }

    if (unverifiedClaims > 2) {
      reasons.push(`Multiple unverified claims detected: ${unverifiedClaims}`);
      riskFactors.push({ factor: 'unverified_claims', score: Math.min(90, unverifiedClaims * 15), weight: 0.1 });
    }
  }

  private calculateRiskScore(riskFactors: Array<{factor: string; score: number; weight: number}>): number {
    if (riskFactors.length === 0) return 0;

    const weightedSum = riskFactors.reduce((sum, factor) => sum + (factor.score * factor.weight), 0);
    const totalWeight = riskFactors.reduce((sum, factor) => sum + factor.weight, 0);

    return Math.round(weightedSum / totalWeight);
  }

  private determineUrgencyLevel(riskScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (riskScore >= this.config.riskThresholds.critical) return 'critical';
    if (riskScore >= this.config.riskThresholds.high) return 'high';
    if (riskScore >= this.config.riskThresholds.medium) return 'medium';
    return 'low';
  }

  private async selectOptimalExperts(
    content: string,
    context: any,
    urgencyLevel: string
  ): Promise<ExpertProfile[]> {
    const contentLower = content.toLowerCase();
    const relevantExperts: Array<{expert: ExpertProfile; relevanceScore: number}> = [];

    // Score experts based on relevance
    for (const expert of this.config.expertDatabase) {
      let relevanceScore = 0;

      // Check specialization match
      for (const specialization of expert.specialization) {
        if (contentLower.includes(specialization) ||
            (context.industry && context.industry.toLowerCase().includes(specialization))) {
          relevanceScore += 40;
        }
      }

      // Factor in availability
      if (expert.availability === 'available') relevanceScore += 30;
      else if (expert.availability === 'busy') relevanceScore += 10;

      // Factor in workload (lower is better)
      relevanceScore += Math.max(0, 20 - (expert.workload * 5));

      // Factor in trust score
      relevanceScore += expert.trustScore * 0.1;

      if (relevanceScore > 30) { // Minimum threshold
        relevantExperts.push({ expert, relevanceScore });
      }
    }

    // Sort by relevance score and return top experts
    relevantExperts.sort((a, b) => b.relevanceScore - a.relevanceScore);

    const maxExperts = urgencyLevel === 'critical' ? 3 : urgencyLevel === 'high' ? 2 : 1;
    return relevantExperts.slice(0, maxExperts).map(item => item.expert);
  }

  private createEscalationPath(urgencyLevel: string, experts: ExpertProfile[]): EscalationStep[] {
    const escalationPath: EscalationStep[] = [];

    if (experts.length === 0) return escalationPath;

    // Level 1: Primary expert
    escalationPath.push({
      level: 1,
      triggerCondition: 'Initial assignment',
      assignedExperts: [experts[0].id],
      maxWaitTime: this.config.escalationTimeouts[0],
      autoEscalate: this.config.enableAutoEscalation,
      notificationMethod: experts[0].contactMethod as any
    });

    // Level 2: Secondary expert (if available)
    if (experts.length > 1) {
      escalationPath.push({
        level: 2,
        triggerCondition: `No response after ${this.config.escalationTimeouts[0]} minutes`,
        assignedExperts: [experts[1].id],
        maxWaitTime: this.config.escalationTimeouts[1],
        autoEscalate: this.config.enableAutoEscalation,
        notificationMethod: experts[1].contactMethod as any
      });
    }

    // Level 3: Senior review (critical/high urgency)
    if (urgencyLevel === 'critical' || urgencyLevel === 'high') {
      const seniorExperts = experts.filter(e => e.trustScore > 95);
      if (seniorExperts.length > 0) {
        escalationPath.push({
          level: 3,
          triggerCondition: `No response after ${this.config.escalationTimeouts[1]} minutes`,
          assignedExperts: seniorExperts.map(e => e.id),
          maxWaitTime: this.config.escalationTimeouts[2],
          autoEscalate: true,
          notificationMethod: 'urgent_phone'
        });
      }
    }

    return escalationPath;
  }

  private defineReviewCriteria(content: string, context: any, riskScore: number): ReviewCriteria {
    const contentLower = content.toLowerCase();

    return {
      factualAccuracy: riskScore > 30 || context.hallucinationScore > 40,
      legalCompliance: this.config.criticalDomains.some(domain =>
        contentLower.includes(domain) || (context.industry && context.industry.toLowerCase().includes(domain))
      ),
      ethicalConsiderations: this.config.sensitiveTopics.some(topic =>
        contentLower.includes(topic.toLowerCase())
      ),
      brandAlignment: true, // Always check brand alignment
      technicalAccuracy: contentLower.includes('technical') || contentLower.includes('specification'),
      sourceVerification: /\d+%|studies show|research indicates/.test(content),
      sensitivityCheck: riskScore > 50,
      regulatoryCompliance: ['medical', 'financial', 'legal'].some(domain =>
        contentLower.includes(domain) || (context.industry && context.industry.toLowerCase().includes(domain))
      )
    };
  }

  private estimateReviewTime(
    content: string,
    urgencyLevel: string,
    criteria: ReviewCriteria,
    experts: ExpertProfile[]
  ): number {
    let baseTime = 15; // Base 15 minutes

    // Adjust for content length
    const wordCount = content.split(/\s+/).length;
    baseTime += Math.ceil(wordCount / 100) * 2; // 2 minutes per 100 words

    // Adjust for urgency
    const urgencyMultiplier = {
      'low': 1.0,
      'medium': 1.2,
      'high': 1.5,
      'critical': 2.0
    };
    baseTime *= urgencyMultiplier[urgencyLevel as keyof typeof urgencyMultiplier];

    // Adjust for review criteria complexity
    const criteriaCount = Object.values(criteria).filter(Boolean).length;
    baseTime += criteriaCount * 3; // 3 minutes per criteria

    // Use expert's average review time if available
    if (experts.length > 0) {
      const expertTime = experts[0].averageReviewTime;
      baseTime = Math.max(baseTime, expertTime);
    }

    return Math.round(baseTime);
  }

  /**
   * Check and handle escalations for active reviews
   */
  public async processEscalations(): Promise<void> {
    const now = new Date();

    for (const [workflowId, review] of this.activeReviews) {
      const elapsedMinutes = (now.getTime() - review.startTime.getTime()) / (1000 * 60);
      const currentTimeout = this.config.escalationTimeouts[review.escalationLevel];

      if (elapsedMinutes > currentTimeout && review.escalationLevel < this.config.escalationTimeouts.length - 1) {
        // Escalate to next level
        review.escalationLevel++;
        console.log(`Escalating review ${workflowId} to level ${review.escalationLevel + 1}`);

        // In a real implementation, this would trigger notifications
        // await this.notifyNextLevelExperts(workflowId, review.escalationLevel);
      }
    }
  }

  /**
   * Mark a review as completed
   */
  public completeReview(workflowId: string): void {
    this.activeReviews.delete(workflowId);
  }

  /**
   * Get status of all active reviews
   */
  public getActiveReviewsStatus(): Array<{workflowId: string; elapsedMinutes: number; escalationLevel: number}> {
    const now = new Date();
    const status: Array<{workflowId: string; elapsedMinutes: number; escalationLevel: number}> = [];

    for (const [workflowId, review] of this.activeReviews) {
      const elapsedMinutes = Math.round((now.getTime() - review.startTime.getTime()) / (1000 * 60));
      status.push({
        workflowId,
        elapsedMinutes,
        escalationLevel: review.escalationLevel
      });
    }

    return status;
  }
}
