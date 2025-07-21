import nlp from 'compromise';
import { countWords } from './word-count';
import { extractLsiKeywords, LsiKeyword } from './lsi-keyword-extractor';

export interface PageContentAnalysisResult {
  url: string;
  topicalRelevanceScore: number; // 0-100
  mainTopics: string[];
  lsiKeywords: LsiKeyword[]; // Added LSI keywords
  contentQualityScore: number; // 0-100
  wordCount: number;
  readabilityScore: number; // Flesch-Kincaid or similar
  pageAuthorityScore: number; // Placeholder, would come from external data
  pageValueScore: number; // Placeholder, based on internal metrics
}

export class PageContentAnalyzer {
  async analyze(url: string, content: string, keyword?: string, headings?: string[]): Promise<PageContentAnalysisResult> {
    const doc = nlp(content);

    // Topical Relevance (simplified: check keyword presence and noun phrases)
    let topicalRelevanceScore = 0;
    const mainTopics: string[] = [];
    if (keyword && content.toLowerCase().includes(keyword.toLowerCase())) {
      topicalRelevanceScore += 50;
    }
    const nounPhrases = doc.match('#NounPhrase').out('array');
    if (nounPhrases.length > 0) {
      mainTopics.push(...nounPhrases.slice(0, 5));
      topicalRelevanceScore += Math.min(50, nounPhrases.length * 5);
    }
    topicalRelevanceScore = Math.min(100, topicalRelevanceScore);

    // LSI Keyword Extraction
    const lsiKeywords = extractLsiKeywords(content, { mainKeyword: keyword, headings: headings });

    // Content Quality (simplified: based on word count and readability)
    const wordCount = countWords(content);
    const sentences = doc.sentences().out('array');
    const numSentences = sentences.length;
    const numSyllables = doc.syllables().length; // Compromise doesn't have direct syllable count, this is a rough estimate

    // Flesch-Kincaid Readability (simplified)
    let readabilityScore = 0;
    if (wordCount > 0 && numSentences > 0) {
      readabilityScore = 206.835 - 1.015 * (wordCount / numSentences) - 84.6 * (numSyllables / wordCount);
    }
    readabilityScore = Math.max(0, Math.min(100, readabilityScore));

    let contentQualityScore = 0;
    if (wordCount >= 500) contentQualityScore += 40;
    if (readabilityScore >= 60) contentQualityScore += 30;
    if (mainTopics.length >= 3) contentQualityScore += 30;
    contentQualityScore = Math.min(100, contentQualityScore);

    // Page Authority and Value (placeholders)
    const pageAuthorityScore = 0; // Needs external data (e.g., Moz, Ahrefs)
    const pageValueScore = 0; // Needs internal analytics data

    return {
      url,
      topicalRelevanceScore,
      mainTopics,
      lsiKeywords,
      contentQualityScore,
      wordCount,
      readabilityScore,
      pageAuthorityScore,
      pageValueScore,
    };
  }

  // Placeholder for content similarity detection
  async detectContentSimilarity(content1: string, content2: string): Promise<number> {
    // A real implementation would use vector embeddings or advanced text comparison algorithms
    const words1 = nlp(content1).normalize().out('array');
    const words2 = nlp(content2).normalize().out('array');

    const intersection = new Set(words1.filter(word => words2.includes(word)));
    const union = new Set([...words1, ...words2]);

    if (union.size === 0) return 0;
    return (intersection.size / union.size) * 100;
  }

  // Placeholder for page categorization and clustering
  async categorizePage(content: string): Promise<string[]> {
    // A real implementation would use machine learning models
    const topics = nlp(content).topics().out('array');
    return topics.slice(0, 3);
  }
}