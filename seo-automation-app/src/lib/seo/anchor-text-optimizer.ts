import { findKeywordVariations } from './keyword-analyzer';
import { LsiKeyword } from './lsi-keyword-extractor';

export interface AnchorTextSuggestion {
  text: string;
  relevanceScore: number; // 0-100
  type: 'exact' | 'phrase' | 'lsi' | 'natural' | 'branded' | 'navigational';
}

export class AnchorTextOptimizer {
  /**
   * Generates varied and optimized anchor text suggestions.
   * @param mainKeyword The primary keyword for the content.
   * @param contentText The full text of the content where the link will be placed.
   * @param lsiKeywords Related LSI keywords with their relevance scores.
   * @returns An array of anchor text suggestions.
   */
  generateAnchorTextSuggestions(mainKeyword: string, contentText: string, lsiKeywords: LsiKeyword[]): AnchorTextSuggestion[] {
    const suggestions: AnchorTextSuggestion[] = [];
    const keywordLower = mainKeyword.toLowerCase();
    const lowerContentText = contentText.toLowerCase();

    // 1. Exact Match
    suggestions.push({
      text: mainKeyword,
      relevanceScore: 100,
      type: 'exact',
    });

    // 2. Phrase Match (simple variations)
    const phraseVariations = [
      `learn more about ${keywordLower}`,
      `read about ${keywordLower}`,
      `discover ${keywordLower} strategies`,
    ];
    phraseVariations.forEach(phrase => {
      if (lowerContentText.includes(phrase)) {
        suggestions.push({
          text: phrase,
          relevanceScore: 90,
          type: 'phrase',
        });
      }
    });

    // 3. LSI Keywords as Anchor Text
    lsiKeywords.forEach(lsi => {
      if (lowerContentText.includes(lsi.term.toLowerCase())) {
        suggestions.push({
          text: lsi.term,
          relevanceScore: 80 + (lsi.relevance * 20), // Scale LSI relevance to 80-100
          type: 'lsi',
        });
      }
    });

    // 4. Natural Language Anchor Text (contextual phrases)
    const naturalPhrases = this.extractNaturalPhrases(contentText, keywordLower, 5); // Extract phrases around keyword
    naturalPhrases.forEach(phrase => {
      suggestions.push({
        text: phrase,
        relevanceScore: 70,
        type: 'natural',
      });
    });

    // 5. Branded Anchor Text (placeholder)
    // This would typically come from a brand name associated with the content/website
    suggestions.push({
      text: 'Your Brand Name',
      relevanceScore: 60,
      type: 'branded',
    });

    // 6. Navigational Anchor Text (placeholder)
    // This would typically be generic calls to action or page names
    suggestions.push({
      text: 'click here',
      relevanceScore: 50,
      type: 'navigational',
    });
    suggestions.push({
      text: 'read more',
      relevanceScore: 50,
      type: 'navigational',
    });

    // Deduplicate and sort by relevance
    const uniqueSuggestions = Array.from(new Map(suggestions.map(item => [item.text.toLowerCase(), item])).values());
    return uniqueSuggestions.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  private extractNaturalPhrases(text: string, keyword: string, windowSize: number): string[] {
    const phrases: string[] = [];
    const words = text.toLowerCase().split(/\s+/);
    const keywordIndex = words.indexOf(keyword);

    if (keywordIndex !== -1) {
      const start = Math.max(0, keywordIndex - windowSize);
      const end = Math.min(words.length, keywordIndex + windowSize + 1);
      const phraseWords = words.slice(start, end);
      phrases.push(phraseWords.join(' '));
    }
    return phrases;
  }
}