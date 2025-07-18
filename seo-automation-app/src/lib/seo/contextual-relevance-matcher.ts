
import { LsiKeyword, extractLsiKeywords } from './lsi-keyword-extractor';

export interface ContextualRelevanceResult {
  isRelevant: boolean;
  relevanceScore: number; // 0-100
  commonTopics: string[];
  missingContextKeywords: string[];
  recommendations: string[];
}

export class ContextualRelevanceMatcher {
  /**
   * Assesses the contextual relevance between content and a potential external link.
   * @param content The main content string.
   * @param linkTargetContent The content of the page the link points to.
   * @param mainKeyword The main keyword of the content.
   * @returns Contextual relevance analysis.
   */
  matchRelevance(content: string, linkTargetContent: string, mainKeyword: string): ContextualRelevanceResult {
    const recommendations: string[] = [];
    const commonTopics: string[] = [];
    const missingContextKeywords: string[] = [];

    let relevanceScore = 0;
    let isRelevant = false;

    // Extract LSI keywords from both content and link target
    const contentLsi = extractLsiKeywords(content, { mainKeyword });
    const targetLsi = extractLsiKeywords(linkTargetContent, { mainKeyword });

    // Find common LSI keywords
    const contentLsiTerms = new Set(contentLsi.map(lsi => lsi.term));
    const targetLsiTerms = new Set(targetLsi.map(lsi => lsi.term));

    targetLsiTerms.forEach(term => {
      if (contentLsiTerms.has(term)) {
        commonTopics.push(term);
      } else {
        missingContextKeywords.push(term);
      }
    });

    // Score based on common LSI keywords
    if (commonTopics.length > 0) {
      relevanceScore += Math.min(50, commonTopics.length * 10); // Up to 50 points for common topics
      isRelevant = true;
    }

    // Boost if main keyword is present in both
    if (content.toLowerCase().includes(mainKeyword.toLowerCase()) && linkTargetContent.toLowerCase().includes(mainKeyword.toLowerCase())) {
      relevanceScore += 30;
    }

    // Penalize if too many missing context keywords
    if (missingContextKeywords.length > commonTopics.length * 2) {
      relevanceScore -= 10;
      recommendations.push('The external link target contains many keywords not present in your content. Consider expanding your content or finding a more relevant link.');
    }

    relevanceScore = Math.max(0, Math.min(100, relevanceScore));

    if (relevanceScore < 60) {
      isRelevant = false;
      recommendations.push('The external link may not be highly contextually relevant. Seek a source that more closely aligns with your content's topics.');
    }

    return {
      isRelevant,
      relevanceScore: Number(relevanceScore.toFixed(2)),
      commonTopics,
      missingContextKeywords,
      recommendations,
    };
  }
}
