/**
 * Anti-Hallucination Prevention Engine
 * Implements NFR19: Multi-layer hallucination detection and prevention
 */

export interface HallucinationCheckResult {
  hallucinationRisk: number;
  flaggedSections: FlaggedSection[];
  recommendations: string[];
  approvalStatus: 'APPROVED' | 'NEEDS_REVIEW' | 'REJECTED';
  detectionResults: {
    factualAccuracy: FactualAccuracyResult;
    sourceValidation: SourceValidationResult;
    consistencyCheck: ConsistencyCheckResult;
  };
}

export interface FlaggedSection {
  text: string;
  position: { start: number; end: number };
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reason: string;
  suggestedFix: string;
  confidence: number;
}

export interface FactualAccuracyResult {
  score: number;
  flaggedClaims: string[];
  verificationStatus: 'VERIFIED' | 'UNVERIFIED' | 'CONTRADICTED';
  sourcesChecked: number;
}

export interface SourceValidationResult {
  score: number;
  missingCitations: string[];
  invalidSources: string[];
  citationQuality: number;
}

export interface ConsistencyCheckResult {
  score: number;
  contradictions: string[];
  logicalFlaws: string[];
  coherenceScore: number;
}

export class AntiHallucinationEngine {
  private readonly RISK_THRESHOLD_HIGH = 0.7;
  private readonly RISK_THRESHOLD_MEDIUM = 0.4;
  private readonly APPROVAL_THRESHOLD = 0.3;

  /**
   * Comprehensive hallucination prevention and detection
   */
  async preventHallucinations(generatedContent: string): Promise<HallucinationCheckResult> {
    // Multi-layer hallucination detection
    const factualAccuracy = await this.checkFactualAccuracy(generatedContent);
    const sourceValidation = await this.validateSourceClaims(generatedContent);
    const consistencyCheck = await this.checkInternalConsistency(generatedContent);

    // Calculate overall risk score
    const hallucinationRisk = this.calculateRiskScore(factualAccuracy, sourceValidation, consistencyCheck);
    
    // Identify problematic sections
    const flaggedSections = this.identifyProblematicSections(generatedContent, {
      factualAccuracy,
      sourceValidation,
      consistencyCheck,
    });

    // Generate recommendations
    const recommendations = this.generateCorrectionRecommendations(generatedContent, flaggedSections);
    
    // Determine approval status
    const approvalStatus = this.determineApprovalStatus(hallucinationRisk, flaggedSections);

    return {
      hallucinationRisk,
      flaggedSections,
      recommendations,
      approvalStatus,
      detectionResults: {
        factualAccuracy,
        sourceValidation,
        consistencyCheck,
      },
    };
  }

  /**
   * Check factual accuracy of content claims
   */
  private async checkFactualAccuracy(content: string): Promise<FactualAccuracyResult> {
    const factualClaims = this.extractFactualClaims(content);
    const flaggedClaims: string[] = [];
    let verifiedCount = 0;
    let contradictedCount = 0;

    for (const claim of factualClaims) {
      const verification = await this.verifyFactualClaim(claim);
      
      if (verification.status === 'CONTRADICTED') {
        flaggedClaims.push(claim);
        contradictedCount++;
      } else if (verification.status === 'VERIFIED') {
        verifiedCount++;
      }
    }

    const totalClaims = factualClaims.length;
    const score = totalClaims > 0 ? (verifiedCount / totalClaims) : 1.0;
    
    let verificationStatus: 'VERIFIED' | 'UNVERIFIED' | 'CONTRADICTED' = 'UNVERIFIED';
    if (contradictedCount > 0) {
      verificationStatus = 'CONTRADICTED';
    } else if (verifiedCount / totalClaims > 0.8) {
      verificationStatus = 'VERIFIED';
    }

    return {
      score,
      flaggedClaims,
      verificationStatus,
      sourcesChecked: totalClaims,
    };
  }

  /**
   * Validate source claims and citations
   */
  private async validateSourceClaims(content: string): Promise<SourceValidationResult> {
    const sourceClaims = this.extractSourceClaims(content);
    const citations = this.extractCitations(content);
    
    const missingCitations: string[] = [];
    const invalidSources: string[] = [];

    // Check for claims that need citations
    for (const claim of sourceClaims) {
      if (!this.hasCitation(claim, citations)) {
        missingCitations.push(claim);
      }
    }

    // Validate existing citations
    for (const citation of citations) {
      const isValid = await this.validateCitation(citation);
      if (!isValid) {
        invalidSources.push(citation);
      }
    }

    const citationQuality = this.calculateCitationQuality(citations);
    const score = this.calculateSourceValidationScore(sourceClaims, citations, missingCitations, invalidSources);

    return {
      score,
      missingCitations,
      invalidSources,
      citationQuality,
    };
  }

  /**
   * Check internal consistency and logical coherence
   */
  private async checkInternalConsistency(content: string): Promise<ConsistencyCheckResult> {
    const contradictions = this.detectContradictions(content);
    const logicalFlaws = this.detectLogicalFlaws(content);
    const coherenceScore = this.calculateCoherenceScore(content);

    const score = this.calculateConsistencyScore(contradictions, logicalFlaws, coherenceScore);

    return {
      score,
      contradictions,
      logicalFlaws,
      coherenceScore,
    };
  }

  /**
   * Calculate overall hallucination risk score
   */
  private calculateRiskScore(
    factualAccuracy: FactualAccuracyResult,
    sourceValidation: SourceValidationResult,
    consistencyCheck: ConsistencyCheckResult
  ): number {
    // Weighted combination of risk factors
    const factualWeight = 0.4;
    const sourceWeight = 0.3;
    const consistencyWeight = 0.3;

    const factualRisk = 1 - factualAccuracy.score;
    const sourceRisk = 1 - sourceValidation.score;
    const consistencyRisk = 1 - consistencyCheck.score;

    const overallRisk = (factualRisk * factualWeight) + 
                       (sourceRisk * sourceWeight) + 
                       (consistencyRisk * consistencyWeight);

    return Number(overallRisk.toFixed(3));
  }

  /**
   * Identify problematic sections in content
   */
  private identifyProblematicSections(
    content: string,
    detectionResults: {
      factualAccuracy: FactualAccuracyResult;
      sourceValidation: SourceValidationResult;
      consistencyCheck: ConsistencyCheckResult;
    }
  ): FlaggedSection[] {
    const flaggedSections: FlaggedSection[] = [];

    // Flag factually inaccurate claims
    for (const claim of detectionResults.factualAccuracy.flaggedClaims) {
      const position = this.findTextPosition(content, claim);
      flaggedSections.push({
        text: claim,
        position,
        riskLevel: 'HIGH',
        reason: 'Factual claim contradicted by authoritative sources',
        suggestedFix: 'Verify claim against current authoritative sources and update or remove',
        confidence: 0.9,
      });
    }

    // Flag missing citations
    for (const claim of detectionResults.sourceValidation.missingCitations) {
      const position = this.findTextPosition(content, claim);
      flaggedSections.push({
        text: claim,
        position,
        riskLevel: 'MEDIUM',
        reason: 'Statistical or factual claim lacks proper citation',
        suggestedFix: 'Add authoritative source citation for this claim',
        confidence: 0.8,
      });
    }

    // Flag contradictions
    for (const contradiction of detectionResults.consistencyCheck.contradictions) {
      const position = this.findTextPosition(content, contradiction);
      flaggedSections.push({
        text: contradiction,
        position,
        riskLevel: 'HIGH',
        reason: 'Internal contradiction detected',
        suggestedFix: 'Resolve contradiction by clarifying or removing conflicting information',
        confidence: 0.85,
      });
    }

    return flaggedSections.sort((a, b) => this.getRiskLevelValue(b.riskLevel) - this.getRiskLevelValue(a.riskLevel));
  }

  /**
   * Generate correction recommendations
   */
  private generateCorrectionRecommendations(content: string, flaggedSections: FlaggedSection[]): string[] {
    const recommendations: string[] = [];

    const criticalIssues = flaggedSections.filter(s => s.riskLevel === 'CRITICAL').length;
    const highIssues = flaggedSections.filter(s => s.riskLevel === 'HIGH').length;
    const mediumIssues = flaggedSections.filter(s => s.riskLevel === 'MEDIUM').length;

    if (criticalIssues > 0) {
      recommendations.push(`CRITICAL: Address ${criticalIssues} critical hallucination risks before publication`);
    }

    if (highIssues > 0) {
      recommendations.push(`CRITICAL: Resolve ${highIssues} high-risk factual inaccuracies`);
    }

    if (mediumIssues > 0) {
      recommendations.push(`MEDIUM PRIORITY: Add citations for ${mediumIssues} unsupported claims`);
    }

    // Specific recommendations based on content analysis
    if (flaggedSections.some(s => s.reason.includes('contradiction'))) {
      recommendations.push('Review content for internal consistency and resolve contradictions');
    }

    if (flaggedSections.some(s => s.reason.includes('citation'))) {
      recommendations.push('Add authoritative source citations for statistical and factual claims');
    }

    if (flaggedSections.length === 0) {
      recommendations.push('Content passed hallucination detection - ready for publication');
    }

    return recommendations;
  }

  /**
   * Determine approval status based on risk assessment
   */
  private determineApprovalStatus(
    hallucinationRisk: number,
    flaggedSections: FlaggedSection[]
  ): 'APPROVED' | 'NEEDS_REVIEW' | 'REJECTED' {
    const criticalIssues = flaggedSections.filter(s => s.riskLevel === 'CRITICAL').length;
    const highIssues = flaggedSections.filter(s => s.riskLevel === 'HIGH').length;

    if (criticalIssues > 0 || hallucinationRisk > this.RISK_THRESHOLD_HIGH) {
      return 'REJECTED';
    }

    if (highIssues > 0 || hallucinationRisk > this.RISK_THRESHOLD_MEDIUM) {
      return 'NEEDS_REVIEW';
    }

    if (hallucinationRisk <= this.APPROVAL_THRESHOLD) {
      return 'APPROVED';
    }

    return 'NEEDS_REVIEW';
  }

  // Helper methods
  private extractFactualClaims(content: string): string[] {
    // Extract sentences with factual claims
    const factualPatterns = [
      /\d+(?:\.\d+)?%/g, // Percentages
      /\$\d+(?:,\d{3})*(?:\.\d{2})?/g, // Currency
      /\d{4}/g, // Years
      /(?:is|are|was|were)\s+(?:the|a)\s+(?:first|largest|most|best|top)/gi, // Superlatives
    ];

    const claims: string[] = [];
    const sentences = content.split(/[.!?]+/);

    for (const sentence of sentences) {
      for (const pattern of factualPatterns) {
        if (pattern.test(sentence)) {
          claims.push(sentence.trim());
          break;
        }
      }
    }

    return [...new Set(claims)]; // Remove duplicates
  }

  private async verifyFactualClaim(claim: string): Promise<{ status: 'VERIFIED' | 'UNVERIFIED' | 'CONTRADICTED' }> {
    // Simplified verification - in real implementation, integrate with fact-checking APIs
    const suspiciousPatterns = [
      /100%/g, // Absolute claims are often suspicious
      /never|always|all|none/gi, // Absolute language
      /revolutionary|groundbreaking|unprecedented/gi, // Hyperbolic language
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(claim)) {
        return { status: 'CONTRADICTED' };
      }
    }

    return { status: 'VERIFIED' };
  }

  private extractSourceClaims(content: string): string[] {
    // Extract claims that should have sources
    const sourcePatterns = [
      /according to/gi,
      /studies show/gi,
      /research indicates/gi,
      /\d+(?:\.\d+)?%/g,
      /\$\d+/g,
    ];

    const claims: string[] = [];
    const sentences = content.split(/[.!?]+/);

    for (const sentence of sentences) {
      for (const pattern of sourcePatterns) {
        if (pattern.test(sentence)) {
          claims.push(sentence.trim());
          break;
        }
      }
    }

    return [...new Set(claims)];
  }

  private extractCitations(content: string): string[] {
    // Extract existing citations
    const citationPatterns = [
      /\[.*?\]/g, // [Source]
      /\(.*?\)/g, // (Source)
      /https?:\/\/[^\s]+/g, // URLs
    ];

    const citations: string[] = [];

    for (const pattern of citationPatterns) {
      const matches = content.match(pattern) || [];
      citations.push(...matches);
    }

    return citations;
  }

  private hasCitation(claim: string, citations: string[]): boolean {
    // Check if claim has nearby citation
    return citations.some(citation => 
      Math.abs(claim.indexOf(citation) - claim.length) < 100
    );
  }

  private async validateCitation(citation: string): Promise<boolean> {
    // Simplified validation - in real implementation, check URL validity, source credibility
    if (citation.startsWith('http')) {
      return citation.includes('.edu') || citation.includes('.gov') || citation.includes('.org');
    }
    return citation.length > 5; // Basic validation
  }

  private calculateCitationQuality(citations: string[]): number {
    if (citations.length === 0) return 0;

    let qualityScore = 0;
    for (const citation of citations) {
      if (citation.includes('.edu') || citation.includes('.gov')) {
        qualityScore += 1.0;
      } else if (citation.includes('.org')) {
        qualityScore += 0.8;
      } else if (citation.startsWith('http')) {
        qualityScore += 0.6;
      } else {
        qualityScore += 0.3;
      }
    }

    return qualityScore / citations.length;
  }

  private calculateSourceValidationScore(
    sourceClaims: string[],
    citations: string[],
    missingCitations: string[],
    invalidSources: string[]
  ): number {
    if (sourceClaims.length === 0) return 1.0;

    const citationRate = (sourceClaims.length - missingCitations.length) / sourceClaims.length;
    const validityRate = citations.length > 0 ? (citations.length - invalidSources.length) / citations.length : 0;

    return (citationRate + validityRate) / 2;
  }

  private detectContradictions(content: string): string[] {
    // Simplified contradiction detection
    const contradictions: string[] = [];
    const sentences = content.split(/[.!?]+/);

    for (let i = 0; i < sentences.length; i++) {
      for (let j = i + 1; j < sentences.length; j++) {
        if (this.areContradictory(sentences[i], sentences[j])) {
          contradictions.push(`"${sentences[i].trim()}" contradicts "${sentences[j].trim()}"`);
        }
      }
    }

    return contradictions;
  }

  private areContradictory(sentence1: string, sentence2: string): boolean {
    // Simplified contradiction detection
    const contradictoryPairs = [
      ['increase', 'decrease'],
      ['more', 'less'],
      ['better', 'worse'],
      ['always', 'never'],
      ['all', 'none'],
    ];

    const s1Lower = sentence1.toLowerCase();
    const s2Lower = sentence2.toLowerCase();

    for (const [word1, word2] of contradictoryPairs) {
      if (s1Lower.includes(word1) && s2Lower.includes(word2)) {
        return true;
      }
    }

    return false;
  }

  private detectLogicalFlaws(content: string): string[] {
    // Simplified logical flaw detection
    const flaws: string[] = [];
    const logicalFlawPatterns = [
      /because.*because/gi, // Circular reasoning
      /obviously|clearly|of course/gi, // Unsupported assertions
      /everyone knows/gi, // Appeal to common knowledge
    ];

    for (const pattern of logicalFlawPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        flaws.push(...matches);
      }
    }

    return flaws;
  }

  private calculateCoherenceScore(content: string): number {
    // Simplified coherence calculation
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length < 2) return 1.0;

    let coherenceSum = 0;
    for (let i = 1; i < sentences.length; i++) {
      coherenceSum += this.calculateSentenceCoherence(sentences[i - 1], sentences[i]);
    }

    return coherenceSum / (sentences.length - 1);
  }

  private calculateSentenceCoherence(sentence1: string, sentence2: string): number {
    // Simplified coherence calculation based on word overlap
    const words1 = sentence1.toLowerCase().split(/\s+/);
    const words2 = sentence2.toLowerCase().split(/\s+/);
    
    const commonWords = words1.filter(word => words2.includes(word)).length;
    const totalWords = Math.max(words1.length, words2.length);
    
    return totalWords > 0 ? commonWords / totalWords : 0;
  }

  private calculateConsistencyScore(
    contradictions: string[],
    logicalFlaws: string[],
    coherenceScore: number
  ): number {
    const contradictionPenalty = contradictions.length * 0.2;
    const logicalFlawPenalty = logicalFlaws.length * 0.1;
    
    const score = Math.max(0, coherenceScore - contradictionPenalty - logicalFlawPenalty);
    return Math.min(1, score);
  }

  private findTextPosition(content: string, text: string): { start: number; end: number } {
    const start = content.indexOf(text);
    return {
      start: start >= 0 ? start : 0,
      end: start >= 0 ? start + text.length : 0,
    };
  }

  private getRiskLevelValue(riskLevel: string): number {
    const values = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
    return values[riskLevel as keyof typeof values] || 0;
  }
}
