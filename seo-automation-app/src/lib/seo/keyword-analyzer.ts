import { countWords } from './word-count';
import { PorterStemmer, WordTokenizer } from 'natural';

export interface PrecisionMetrics {
  exactDensity: number;
  variationDensity: number;
  totalDensity: number;
  totalWords: number;
  exactCount: number;
  variationCount: number;
  stemmedCount: number;
  placementAnalysis?: {
    title?: number;
    headings?: number;
    firstParagraph?: number;
    body?: number;
  };
  proximityAnalysis?: Array<{ keyword1: string; keyword2: string; distance: number }>;
  coOccurrenceAnalysis?: Array<{ keyword1: string; keyword2: string; count: number }>;
}

export function calculateKeywordDensity(text: string, keyword: string): number {
  if (!text || !keyword) {
    return 0;
  }

  const words = text.toLowerCase().split(/\s+/);
  const keywordCount = words.filter(word => word.includes(keyword.toLowerCase())).length;

  return (keywordCount / words.length) * 100;
}

export function findKeywordVariations(text: string, keyword: string): string[] {
  if (!text || !keyword) {
    return [];
  }

  const tokenizer = new WordTokenizer();
  const words = tokenizer.tokenize(text.toLowerCase());
  const keywordStem = PorterStemmer.stem(keyword.toLowerCase());

  const variations = words?.filter(word => PorterStemmer.stem(word) === keywordStem);

  return [...new Set(variations)];
}

export function getKeywordDistribution(text: string, keyword: string): number[] {
  if (!text || !keyword) {
    return [];
  }

  const sentences = text.split(/[.!?]/);
  const keywordStem = PorterStemmer.stem(keyword.toLowerCase());

  return sentences.map(sentence => {
    const tokenizer = new WordTokenizer();
    const words = tokenizer.tokenize(sentence.toLowerCase());
    return words?.filter(word => PorterStemmer.stem(word) === keywordStem).length || 0;
  });
}

export function calculateKeywordProminence(text: string, keyword: string, headings: string[]): number {
  if (!text || !keyword) {
    return 0;
  }

  let score = 0;
  const keywordLower = keyword.toLowerCase();

  // Check title
  if (text.toLowerCase().startsWith(keywordLower)) {
    score += 10;
  }

  // Check headings
  headings.forEach(heading => {
    if (heading.toLowerCase().includes(keywordLower)) {
      score += 5;
    }
  });

  // Check first paragraph
  const firstParagraph = text.split('\n')[0];
  if (firstParagraph.toLowerCase().includes(keywordLower)) {
    score += 5;
  }

  return score;
}

export class PrecisionKeywordAnalyzer {
  private cleanContent(content: string): string {
    return content.replace(/[^a-zA-Z0-9\s]/g, '').toLowerCase();
  }

  private findExactMatches(words: string[], keyword: string): number {
    return words.filter(word => word === keyword.toLowerCase()).length;
  }

  private findVariations(words: string[], keyword: string): number {
    const keywordStem = PorterStemmer.stem(keyword.toLowerCase());
    return words.filter(word => PorterStemmer.stem(word) === keywordStem && word !== keyword.toLowerCase()).length;
  }

  private findStemmedMatches(words: string[], keyword: string): number {
    const keywordStem = PorterStemmer.stem(keyword.toLowerCase());
    return words.filter(word => PorterStemmer.stem(word) === keywordStem).length;
  }

  calculateExactDensity(content: string, keyword: string, headings: string[]): PrecisionMetrics {
    const cleanContent = this.cleanContent(content);
    const words = cleanContent.split(/\s+/).filter(word => word.length > 0);
    const totalWords = words.length;

    const exactMatches = this.findExactMatches(words, keyword);
    const variations = this.findVariations(words, keyword);
    const stemmed = this.findStemmedMatches(words, keyword);

    const placementAnalysis = this.analyzeKeywordPlacement(content, keyword, headings);
    const proximityAnalysis = this.analyzeKeywordProximity(content, keyword);
    const coOccurrenceAnalysis = this.analyzeKeywordCoOccurrence(content, keyword);

    return {
      exactDensity: Number(((exactMatches / totalWords) * 100).toFixed(2)),
      variationDensity: Number(((variations / totalWords) * 100).toFixed(2)),
      totalDensity: Number((((exactMatches + variations + stemmed) / totalWords) * 100).toFixed(2)),
      totalWords,
      exactCount: exactMatches,
      variationCount: variations,
      stemmedCount: stemmed,
      placementAnalysis,
      proximityAnalysis,
      coOccurrenceAnalysis,
    };
  }

  private analyzeKeywordPlacement(content: string, keyword: string, headings: string[]) {
    const placement: { [key: string]: number } = {};
    const keywordLower = keyword.toLowerCase();

    // Title (assuming first line of content or a dedicated title field)
    const lines = content.split('\n');
    if (lines[0] && lines[0].toLowerCase().includes(keywordLower)) {
      placement.title = (placement.title || 0) + 1;
    }

    // Headings
    headings.forEach(heading => {
      if (heading.toLowerCase().includes(keywordLower)) {
        placement.headings = (placement.headings || 0) + 1;
      }
    });

    // First paragraph
    const firstParagraph = lines.find(line => line.trim().length > 0 && !line.startsWith('#')); // Find first non-heading, non-empty line
    if (firstParagraph && firstParagraph.toLowerCase().includes(keywordLower)) {
      placement.firstParagraph = (placement.firstParagraph || 0) + 1;
    }

    // Body (rest of the content)
    const bodyContent = lines.slice(1).join('\n');
    const bodyWords = this.cleanContent(bodyContent).split(/\s+/).filter(word => word.length > 0);
    placement.body = bodyWords.filter(word => word.includes(keywordLower)).length;

    return placement;
  }

  private analyzeKeywordProximity(content: string, keyword: string): Array<{ keyword1: string; keyword2: string; distance: number }> {
    const proximity: Array<{ keyword1: string; keyword2: string; distance: number }> = [];
    const words = this.cleanContent(content).split(/\s+/).filter(word => word.length > 0);
    const keywordLower = keyword.toLowerCase();

    const keywordIndices = words.map((word, index) => (word === keywordLower ? index : -1)).filter(index => index !== -1);

    for (let i = 0; i < keywordIndices.length; i++) {
      for (let j = i + 1; j < keywordIndices.length; j++) {
        const distance = keywordIndices[j] - keywordIndices[i] - 1; // Words between them
        proximity.push({
          keyword1: keyword,
          keyword2: keyword,
          distance,
        });
      }
    }
    return proximity;
  }

  private analyzeKeywordCoOccurrence(content: string, keyword: string): Array<{ keyword1: string; keyword2: string; count: number }> {
    const coOccurrence: { [key: string]: { [key: string]: number } } = {};
    const sentences = content.split(/[.!?\n]/).filter(s => s.trim().length > 0);
    const keywordLower = keyword.toLowerCase();

    sentences.forEach(sentence => {
      const wordsInSentence = this.cleanContent(sentence).split(/\s+/).filter(word => word.length > 0);
      if (wordsInSentence.includes(keywordLower)) {
        wordsInSentence.forEach(word => {
          if (word !== keywordLower) {
            if (!coOccurrence[keywordLower]) coOccurrence[keywordLower] = {};
            coOccurrence[keywordLower][word] = (coOccurrence[keywordLower][word] || 0) + 1;
          }
        });
      }
    });

    const result: Array<{ keyword1: string; keyword2: string; count: number }> = [];
    for (const k1 in coOccurrence) {
      for (const k2 in coOccurrence[k1]) {
        result.push({
          keyword1: k1,
          keyword2: k2,
          count: coOccurrence[k1][k2],
        });
      }
    }
    return result;
  }
}