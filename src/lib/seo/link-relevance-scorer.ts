
export interface LinkRelevanceScore {
  score: number; // 0-100
  breakdown: {
    topicalRelevance: number;
    pageAuthorityTransfer: number;
    userExperienceImpact: number;
    linkValue: number;
    competitiveAdvantage: number;
  };
  recommendations: string[];
}

export interface PageContext {
  url: string;
  topics: string[]; // Main topics of the page
  authorityScore: number; // Placeholder for external authority score (e.g., Domain Authority)
  contentQualityScore: number; // From PageContentAnalysisResult
}

export class LinkRelevanceScorer {
  /**
   * Calculates a relevance score for a potential internal link.
   * @param sourcePageContext Context of the page where the link will originate.
   * @param targetPageContext Context of the page the link will point to.
   * @param anchorText The proposed anchor text.
   * @returns A LinkRelevanceScore object.
   */
  calculateRelevance(
    sourcePageContext: PageContext,
    targetPageContext: PageContext,
    anchorText: string
  ): LinkRelevanceScore {
    let score = 0;
    const breakdown = {
      topicalRelevance: 0,
      pageAuthorityTransfer: 0,
      userExperienceImpact: 0,
      linkValue: 0,
      competitiveAdvantage: 0,
    };
    const recommendations: string[] = [];

    // 1. Topical Relevance (how well do source and target topics align?)
    const commonTopics = sourcePageContext.topics.filter(topic => targetPageContext.topics.includes(topic));
    if (commonTopics.length > 0) {
      breakdown.topicalRelevance = Math.min(100, commonTopics.length * 20); // 20 points per common topic
      score += breakdown.topicalRelevance * 0.3; // 30% weight
    } else {
      recommendations.push('Consider linking pages with more closely related topics.');
    }

    // 2. Page Authority Transfer (simplified: higher target authority is better)
    breakdown.pageAuthorityTransfer = Math.min(100, targetPageContext.authorityScore); // Direct mapping
    score += breakdown.pageAuthorityTransfer * 0.2; // 20% weight
    if (targetPageContext.authorityScore < 30) {
      recommendations.push('Linking to pages with higher authority can improve link value.');
    }

    // 3. User Experience Impact (simplified: good content quality, relevant anchor text)
    let uxImpact = 0;
    if (targetPageContext.contentQualityScore >= 70) uxImpact += 50;
    if (anchorText.toLowerCase().includes(targetPageContext.topics[0]?.toLowerCase() || '')) uxImpact += 50; // Anchor text relevance
    breakdown.userExperienceImpact = uxImpact;
    score += breakdown.userExperienceImpact * 0.2; // 20% weight
    if (uxImpact < 70) {
      recommendations.push('Ensure target page has high-quality content and anchor text is highly relevant.');
    }

    // 4. Link Value Assessment (combines topical relevance and authority)
    breakdown.linkValue = (breakdown.topicalRelevance * 0.5) + (breakdown.pageAuthorityTransfer * 0.5);
    score += breakdown.linkValue * 0.15; // 15% weight

    // 5. Competitive Advantage Scoring (placeholder - would compare against competitor linking)
    breakdown.competitiveAdvantage = 70; // Assume average for now
    score += breakdown.competitiveAdvantage * 0.15; // 15% weight

    score = Math.min(100, Math.max(0, score));

    return {
      score: Number(score.toFixed(2)),
      breakdown,
      recommendations,
    };
  }
}
