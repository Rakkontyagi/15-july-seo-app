
export interface ContextualLinkRecommendation {
  sentence: string; // The sentence where the link should be placed
  anchorText: string; // The recommended anchor text
  targetUrl: string; // The URL to link to
  relevanceScore: number; // How relevant this placement is (0-100)
  reason: string; // Explanation for the recommendation
}

export interface ContentBlock {
  text: string;
  type: 'paragraph' | 'heading' | 'list_item';
  position: number;
}

export class ContextualPlacementRecommender {
  /**
   * Recommends optimal locations for internal links within content.
   * @param contentBlocks Parsed content blocks (paragraphs, headings, etc.)
   * @param targetPageUrl The URL of the page to link to.
   * @param targetPageKeywords Keywords/topics of the target page.
   * @param anchorTextSuggestions Pre-generated anchor text suggestions.
   * @returns An array of contextual link recommendations.
   */
  recommendPlacements(
    contentBlocks: ContentBlock[],
    targetPageUrl: string,
    targetPageKeywords: string[],
    anchorTextSuggestions: Array<{ text: string; relevanceScore: number; type: string }>
  ): ContextualLinkRecommendation[] {
    const recommendations: ContextualLinkRecommendation[] = [];

    contentBlocks.forEach((block, blockIndex) => {
      if (block.type === 'paragraph') {
        const sentences = block.text.split(/[.!?]/).filter(s => s.trim().length > 0);

        sentences.forEach(sentence => {
          // Find the best anchor text for this sentence context
          const bestAnchor = this.findBestAnchorTextForSentence(
            sentence,
            targetPageKeywords,
            anchorTextSuggestions
          );

          if (bestAnchor) {
            // Simple relevance scoring based on anchor text relevance and keyword presence
            let relevanceScore = bestAnchor.relevanceScore * 0.8; // Anchor text relevance is primary
            if (targetPageKeywords.some(kw => sentence.toLowerCase().includes(kw.toLowerCase()))) {
              relevanceScore += 20; // Boost if target page keywords are in the sentence
            }
            relevanceScore = Math.min(100, relevanceScore);

            recommendations.push({
              sentence: sentence.trim(),
              anchorText: bestAnchor.text,
              targetUrl: targetPageUrl,
              relevanceScore: Number(relevanceScore.toFixed(2)),
              reason: `Relevant keywords and anchor text found in this paragraph. Optimal for ${bestAnchor.type} anchor.`, 
            });
          }
        });
      }
    });

    // Sort recommendations by relevance score
    return recommendations.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  private findBestAnchorTextForSentence(
    sentence: string,
    targetPageKeywords: string[],
    anchorTextSuggestions: Array<{ text: string; relevanceScore: number; type: string }>
  ): { text: string; relevanceScore: number; type: string } | null {
    let bestAnchor: { text: string; relevanceScore: number; type: string } | null = null;
    let highestScore = -1;

    anchorTextSuggestions.forEach(suggestion => {
      const anchorLower = suggestion.text.toLowerCase();
      const sentenceLower = sentence.toLowerCase();

      if (sentenceLower.includes(anchorLower)) {
        // Score based on suggestion's relevance and how well it fits the sentence
        let currentScore = suggestion.relevanceScore;

        // Prioritize exact matches or strong contextual matches
        if (sentenceLower.includes(` ${anchorLower} `) || sentenceLower.startsWith(`${anchorLower} `) || sentenceLower.endsWith(` ${anchorLower}`)) {
          currentScore += 10; // Boost for clear boundaries
        }

        // Further boost if sentence contains target page keywords
        if (targetPageKeywords.some(kw => sentenceLower.includes(kw.toLowerCase()))) {
          currentScore += 5;
        }

        if (currentScore > highestScore) {
          highestScore = currentScore;
          bestAnchor = suggestion;
        }
      }
    });

    return bestAnchor;
  }

  // Placeholder for user flow optimization and conversion impact assessment
  // These would typically involve integrating with analytics data and user behavior models.
  assessUserFlowOptimization(): string {
    return "User flow optimization assessment requires integration with analytics data.";
  }

  assessConversionImpact(): string {
    return "Conversion impact assessment requires integration with conversion tracking data.";
  }
}
