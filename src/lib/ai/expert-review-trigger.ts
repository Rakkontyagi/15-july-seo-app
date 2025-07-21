
export interface ExpertReviewTriggerResult {
  requiresReview: boolean;
  reason: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
}

export class ExpertReviewTrigger {
  /**
   * Determines if content requires expert human review based on predefined triggers.
   * @param content The generated content.
   * @param context Additional context like industry, keywords, etc.
   * @returns Expert review trigger results.
   */
  triggerReview(content: string, context: { industry: string; keyword: string; sensitiveTopics?: string[] }): ExpertReviewTriggerResult {
    const reason: string[] = [];
    const recommendations: string[] = [];
    let requiresReview = false;
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';

    const lowerContent = content.toLowerCase();
    const lowerIndustry = context.industry.toLowerCase();
    const lowerKeyword = context.keyword.toLowerCase();

    // Trigger 1: Sensitive Topics
    const sensitiveTopics = context.sensitiveTopics || [
      'politics', 'religion', 'health claims', 'financial advice', 'legal advice', 'controversial',
    ];
    sensitiveTopics.forEach(topic => {
      if (lowerContent.includes(topic.toLowerCase())) {
        requiresReview = true;
        reason.push(`Content discusses sensitive topic: "${topic}".`);
        severity = 'critical';
        recommendations.push('Ensure all claims on sensitive topics are fact-checked and unbiased.');
      }
    });

    // Trigger 2: High Hallucination Score (from previous analysis)
    // Assuming hallucinationDetectionResult is passed or accessible
    // For this example, we'll simulate it.
    const simulatedHallucinationScore = Math.random() * 100; // Simulate a score
    if (simulatedHallucinationScore > 70) {
      requiresReview = true;
      reason.push(`High potential for AI hallucination detected (score: ${simulatedHallucinationScore.toFixed(2)}%).`);
      severity = 'high';
      recommendations.push('Manually verify all facts and figures in the content.');
    }

    // Trigger 3: Complex Industry-Specific Claims
    if (lowerIndustry.includes('medical') || lowerIndustry.includes('legal') || lowerIndustry.includes('finance')) {
      if (lowerContent.includes('new treatment') || lowerContent.includes('legal precedent') || lowerContent.includes('investment strategy')) {
        requiresReview = true;
        reason.push(`Content makes complex, industry-specific claims in a regulated field (${context.industry}).`);
        severity = 'high';
        recommendations.push('Consult with a subject matter expert for accuracy and compliance.');
      }
    }

    // Trigger 4: Low Quality Score (from previous analysis)
    // Assuming overallQualityScore is passed or accessible
    const simulatedOverallQualityScore = Math.random() * 100; // Simulate a score
    if (simulatedOverallQualityScore < 60) {
      requiresReview = true;
      reason.push(`Overall content quality score is low (${simulatedOverallQualityScore.toFixed(2)}%).`);
      severity = 'medium';
      recommendations.push('Review content for grammar, readability, and coherence issues.');
    }

    // Trigger 5: Unverified Sources (from previous analysis)
    // Assuming sourceValidationResults are passed or accessible
    const simulatedUnverifiedSources = Math.random() > 0.7; // Simulate unverified sources
    if (simulatedUnverifiedSources) {
      requiresReview = true;
      reason.push('Content contains unverified or poorly cited sources.');
      severity = 'medium';
      recommendations.push('Verify all sources and ensure proper citation.');
    }

    return {
      requiresReview,
      reason,
      severity,
      recommendations,
    };
  }
}
