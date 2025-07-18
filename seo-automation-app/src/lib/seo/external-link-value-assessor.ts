
export interface ExternalLinkValueResult {
  url: string;
  valueScore: number; // 0-100
  breakdown: {
    domainAuthority: number; // Placeholder
    topicalRelevance: number; // From ContextualRelevanceMatcher
    sourceCredibility: number; // From SourceValidator
  };
  recommendations: string[];
}

export class ExternalLinkValueAssessor {
  /**
   * Assesses the value of a potential external link.
   * This is a simplified, rule-based approach. A comprehensive solution would require
   * integration with external Domain Authority APIs (e.g., Moz, Ahrefs) and more advanced NLP.
   * @param linkUrl The URL of the external link.
   * @param linkTargetContent The content of the page the link points to.
   * @param contentMainKeyword The main keyword of your content.
   * @param sourceCredibilityScore The credibility score of the source (from SourceValidator).
   * @returns External link value assessment.
   */
  assessLinkValue(
    linkUrl: string,
    linkTargetContent: string,
    contentMainKeyword: string,
    sourceCredibilityScore: number
  ): ExternalLinkValueResult {
    const recommendations: string[] = [];

    // 1. Domain Authority (Placeholder)
    // In a real scenario, this would be an API call to a DA/DR provider.
    let domainAuthority = 0;
    if (linkUrl.includes('wikipedia.org')) domainAuthority = 90;
    else if (linkUrl.includes('.gov')) domainAuthority = 95;
    else if (linkUrl.includes('.edu')) domainAuthority = 85;
    else if (linkUrl.includes('nytimes.com')) domainAuthority = 80;
    else domainAuthority = 50; // Default for unknown

    // 2. Topical Relevance (simplified, based on keyword presence)
    let topicalRelevance = 0;
    if (linkTargetContent.toLowerCase().includes(contentMainKeyword.toLowerCase())) {
      topicalRelevance = 80;
    } else {
      topicalRelevance = 40;
      recommendations.push('Ensure the external link's content is highly relevant to your main topic.');
    }

    // 3. Source Credibility (from input)
    const credibility = sourceCredibilityScore;

    // Calculate overall value score
    let valueScore = (
      domainAuthority * 0.4 + // 40% weight
      topicalRelevance * 0.3 + // 30% weight
      credibility * 0.3 // 30% weight
    );
    valueScore = Math.min(100, Math.max(0, valueScore));

    if (valueScore < 60) {
      recommendations.push('Consider finding a higher authority or more topically relevant external source.');
    }

    return {
      url: linkUrl,
      valueScore: Number(valueScore.toFixed(2)),
      breakdown: {
        domainAuthority,
        topicalRelevance,
        sourceCredibility: credibility,
      },
      recommendations,
    };
  }
}
