import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from './useDebounce';

interface SeoAnalysisResult {
  keywordDensity: number;
  readabilityScore: number;
  overallSeoScore: number;
  suggestions: string[];
  wordCount: number;
  sentenceCount: number;
  avgWordsPerSentence: number;
}

interface UseDebouncedSeoAnalysisOptions {
  debounceDelay?: number;
  targetKeywords?: string[];
  minWordCount?: number;
  enabled?: boolean;
}

/**
 * Custom hook for debounced SEO analysis
 * Prevents excessive API calls while typing by debouncing content changes
 */
export function useDebouncedSeoAnalysis(
  content: string,
  options: UseDebouncedSeoAnalysisOptions = {}
) {
  const {
    debounceDelay = 500,
    targetKeywords = [],
    minWordCount = 50,
    enabled = true
  } = options;

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<SeoAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Debounce the content to prevent excessive analysis
  const debouncedContent = useDebounce(content, debounceDelay);

  // Analyze content function
  const analyzeContent = useCallback(async (contentToAnalyze: string): Promise<SeoAnalysisResult> => {
    if (!contentToAnalyze.trim()) {
      return {
        keywordDensity: 0,
        readabilityScore: 0,
        overallSeoScore: 0,
        suggestions: ['Start writing content to see SEO analysis'],
        wordCount: 0,
        sentenceCount: 0,
        avgWordsPerSentence: 0
      };
    }

    // Basic text analysis
    const words = contentToAnalyze.toLowerCase().split(/\s+/).filter(word => word.length > 0);
    const sentences = contentToAnalyze.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const wordCount = words.length;
    const sentenceCount = sentences.length;
    const avgWordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : 0;

    // Calculate keyword density
    let keywordDensity = 0;
    if (targetKeywords.length > 0 && wordCount > 0) {
      const keywordMatches = targetKeywords.reduce((total, keyword) => {
        const keywordWords = keyword.toLowerCase().split(/\s+/);
        let matches = 0;
        
        // Count exact phrase matches
        const contentLower = contentToAnalyze.toLowerCase();
        const keywordLower = keyword.toLowerCase();
        const regex = new RegExp(`\\b${keywordLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
        const phraseMatches = (contentLower.match(regex) || []).length;
        
        // Count individual word matches
        keywordWords.forEach(keywordWord => {
          matches += words.filter(word => word.includes(keywordWord)).length;
        });
        
        return total + phraseMatches * 2 + matches; // Weight phrase matches higher
      }, 0);
      
      keywordDensity = (keywordMatches / wordCount) * 100;
    }

    // Calculate readability score (simplified Flesch Reading Ease)
    let readabilityScore = 0;
    if (sentenceCount > 0 && wordCount > 0) {
      const avgSentenceLength = wordCount / sentenceCount;
      const avgSyllablesPerWord = calculateAvgSyllables(words);
      
      // Simplified Flesch formula
      readabilityScore = Math.max(0, Math.min(100, 
        206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord)
      ));
    }

    // Calculate overall SEO score
    let overallScore = 0;
    
    // Word count scoring (0-30 points)
    if (wordCount >= 300) overallScore += 30;
    else if (wordCount >= 150) overallScore += 20;
    else if (wordCount >= 50) overallScore += 10;
    
    // Keyword density scoring (0-25 points)
    if (keywordDensity >= 0.5 && keywordDensity <= 2.5) overallScore += 25;
    else if (keywordDensity >= 0.1 && keywordDensity <= 4) overallScore += 15;
    else if (keywordDensity > 0) overallScore += 5;
    
    // Readability scoring (0-25 points)
    if (readabilityScore >= 60) overallScore += 25;
    else if (readabilityScore >= 30) overallScore += 15;
    else if (readabilityScore >= 0) overallScore += 5;
    
    // Structure scoring (0-20 points)
    const hasHeadings = /^#{1,6}\s+.+$/m.test(contentToAnalyze);
    const hasList = /^[\s]*[-*+]\s+.+$/m.test(contentToAnalyze);
    const hasShortParagraphs = sentences.length > 3;
    
    if (hasHeadings) overallScore += 8;
    if (hasList) overallScore += 6;
    if (hasShortParagraphs) overallScore += 6;

    // Generate suggestions
    const suggestions: string[] = [];
    
    if (wordCount < 300) {
      suggestions.push(`Add more content. Current: ${wordCount} words, recommended: 300+ words`);
    }
    
    if (keywordDensity < 0.5 && targetKeywords.length > 0) {
      suggestions.push(`Increase keyword density. Current: ${keywordDensity.toFixed(2)}%, recommended: 0.5-2.5%`);
    } else if (keywordDensity > 3) {
      suggestions.push(`Reduce keyword density to avoid keyword stuffing. Current: ${keywordDensity.toFixed(2)}%`);
    }
    
    if (readabilityScore < 60) {
      suggestions.push('Improve readability by using shorter sentences and simpler words');
    }
    
    if (!hasHeadings) {
      suggestions.push('Add headings (H2, H3) to improve content structure');
    }
    
    if (avgWordsPerSentence > 20) {
      suggestions.push(`Break up long sentences. Average: ${avgWordsPerSentence.toFixed(1)} words per sentence`);
    }

    return {
      keywordDensity,
      readabilityScore,
      overallSeoScore: Math.round(overallScore),
      suggestions,
      wordCount,
      sentenceCount,
      avgWordsPerSentence
    };
  }, [targetKeywords]);

  // Effect to run analysis when debounced content changes
  useEffect(() => {
    if (!enabled || debouncedContent.length < minWordCount) {
      setAnalysisResult(null);
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    analyzeContent(debouncedContent)
      .then(result => {
        setAnalysisResult(result);
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Analysis failed');
      })
      .finally(() => {
        setIsAnalyzing(false);
      });
  }, [debouncedContent, enabled, minWordCount, analyzeContent]);

  return {
    analysisResult,
    isAnalyzing,
    error,
    refresh: () => analyzeContent(content)
  };
}

// Helper function to calculate average syllables per word
function calculateAvgSyllables(words: string[]): number {
  if (words.length === 0) return 0;
  
  const totalSyllables = words.reduce((total, word) => {
    return total + countSyllables(word);
  }, 0);
  
  return totalSyllables / words.length;
}

// Helper function to count syllables in a word
function countSyllables(word: string): number {
  word = word.toLowerCase();
  if (word.length <= 3) return 1;
  
  // Remove common endings that don't add syllables
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  
  // Count vowel groups
  const matches = word.match(/[aeiouy]{1,2}/g);
  const syllables = matches ? matches.length : 1;
  
  return Math.max(1, syllables);
}
