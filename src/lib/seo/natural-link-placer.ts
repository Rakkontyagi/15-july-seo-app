
export interface NaturalLinkPlacementResult {
  optimizedContent: string;
  placementRecommendations: Array<{ sentence: string; linkText: string; reason: string }>;
  issues: string[];
}

export class NaturalLinkPlacer {
  /**
   * Integrates external links into content naturally, avoiding manipulative placements.
   * This is a simplified, rule-based approach. Advanced NLP would be needed for true semantic placement.
   * @param content The original content string.
   * @param externalLinks An array of objects with url, anchorText, and relevanceScore.
   * @returns Content with naturally placed links and placement recommendations.
   */
  placeLinksNaturally(content: string, externalLinks: Array<{ url: string; anchorText: string; relevanceScore: number }>): NaturalLinkPlacementResult {
    let optimizedContent = content;
    const placementRecommendations: Array<{ sentence: string; linkText: string; reason: string }> = [];
    const issues: string[] = [];

    const sentences = content.split(/([.!?]\s*)/);

    externalLinks.sort((a, b) => b.relevanceScore - a.relevanceScore); // Prioritize higher relevance

    externalLinks.forEach(link => {
      let placed = false;
      for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i];
        const lowerSentence = sentence.toLowerCase();
        const lowerAnchorText = link.anchorText.toLowerCase();

        // Rule 1: Place link if anchor text is naturally present in a sentence
        if (lowerSentence.includes(lowerAnchorText) && !lowerSentence.includes('click here') && !lowerSentence.includes('read more')) {
          // Avoid placing in very short sentences or headings
          if (sentence.split(' ').length > 5 && !sentence.match(/^#{1,6}\s/)) {
            const replacedSentence = sentence.replace(new RegExp(link.anchorText, 'i'), `<a href="${link.url}" target="_blank" rel="noopener noreferrer">${link.anchorText}</a>`);
            sentences[i] = replacedSentence;
            placementRecommendations.push({
              sentence: sentence.trim(),
              linkText: link.anchorText,
              reason: 'Anchor text naturally found in sentence.',
              targetUrl: link.url,
            });
            placed = true;
            break;
          }
        }
      }

      if (!placed) {
        // Rule 2: If anchor text not found, try to insert it naturally
        // Find a sentence that is topically relevant (simplified: contains main keyword)
        const targetSentenceIndex = sentences.findIndex(s => s.toLowerCase().includes(link.anchorText.toLowerCase()) || s.toLowerCase().includes(link.anchorText.split(' ')[0].toLowerCase()));

        if (targetSentenceIndex !== -1) {
          const originalSentence = sentences[targetSentenceIndex];
          const insertionPoint = originalSentence.indexOf(link.anchorText) !== -1 ? originalSentence.indexOf(link.anchorText) : originalSentence.length / 2; // Simple insertion point
          const newSentence = `${originalSentence.substring(0, insertionPoint)}<a href="${link.url}" target="_blank" rel="noopener noreferrer">${link.anchorText}</a>${originalSentence.substring(insertionPoint)}`;
          sentences[targetSentenceIndex] = newSentence;
          placementRecommendations.push({
            sentence: originalSentence.trim(),
            linkText: link.anchorText,
            reason: 'Anchor text inserted into a relevant sentence.',
            targetUrl: link.url,
          });
          placed = true;
        } else {
          issues.push(`Could not find a natural placement for external link with anchor text "${link.anchorText}" pointing to ${link.url}.`);
        }
      }
    });

    return {
      optimizedContent: sentences.join(''),
      placementRecommendations,
      issues,
    };
  }
}
