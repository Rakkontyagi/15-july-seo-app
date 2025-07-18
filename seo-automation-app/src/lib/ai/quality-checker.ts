

import { SentimentAnalyzer, WordTokenizer, PorterStemmer, NounPhraseRecognizer } from 'natural';
import { Language } from 'natural';

export interface ContentQualityAnalysisResult {
  grammarScore: number;
  syntaxScore: number;
  readabilityScore: number; // Flesch-Kincaid or similar
  coherenceScore: number;
  styleConsistencyScore: number;
  overallQualityScore: number; // New overall quality score
  issues: string[];
  recommendations: string[];
}

export class ContentQualityChecker {
  private tokenizer: WordTokenizer;
  private sentimentAnalyzer: SentimentAnalyzer;

  constructor() {
    this.tokenizer = new WordTokenizer();
    this.sentimentAnalyzer = new SentimentAnalyzer('English', PorterStemmer, 'afinn');
  }

  async analyze(content: string): Promise<ContentQualityAnalysisResult> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    let grammarScore = 100;
    let syntaxScore = 100;
    let styleConsistencyScore = 100;

    const sentences = content.split(/[.!?\n]/).filter(s => s.trim().length > 0);
    const words = this.tokenizer.tokenize(content);
    const wordCount = words.length;
    const numSentences = sentences.length;
    const lowerContent = content.toLowerCase();

    // 1. Grammar and Syntax Validation (Rule-based, simplified)

    // Check for double spaces
    if (content.includes('  ')) {
      issues.push('Double spaces detected. Remove extra spaces.');
      syntaxScore -= 5;
    }

    // Check for missing end punctuation (simplified)
    sentences.forEach(s => {
      if (s.trim().length > 0 && !s.endsWith('.') && !s.endsWith('!') && !s.endsWith('?')) {
        issues.push(`Sentence might be missing end punctuation: "${s.trim()}".`);
        grammarScore -= 5;
      }
    });

    // Basic Subject-Verb Agreement (very simplified: looks for common singular/plural mismatches)
    if (lowerContent.includes('they is') || lowerContent.includes('we is') || lowerContent.includes('you is')) {
      issues.push('Subject-verb agreement error detected (e.g., "they is").');
      grammarScore -= 10;
    }

    // Basic Pronoun Agreement (very simplified: looks for common mismatches)
    if (lowerContent.includes('everyone their') || lowerContent.includes('each their')) {
      issues.push('Pronoun agreement error detected (e.g., "everyone their").');
      grammarScore -= 10;
    }

    // 2. Readability (using Flesch-Kincaid approximation)
    let numSyllables = 0;
    words.forEach(word => {
      word = word.toLowerCase();
      if (word.length === 0) return;
      let count = 0;
      const vowels = 'aeiouy';
      if (vowels.includes(word[0])) count++;
      for (let i = 1; i < word.length; i++) {
        if (vowels.includes(word[i]) && !vowels.includes(word[i - 1])) count++;
      }
      if (word.endsWith('e')) count--;
      if (word.endsWith('le') && word.length > 2 && !vowels.includes(word[word.length - 3])) count++;
      numSyllables += Math.max(1, count);
    });

    let readabilityScore = 0;
    if (wordCount > 0 && numSentences > 0) {
      readabilityScore = 206.835 - 1.015 * (wordCount / numSentences) - 84.6 * (numSyllables / wordCount);
    }
    readabilityScore = Math.max(0, Math.min(100, readabilityScore));

    if (readabilityScore < 60) {
      issues.push('Content readability is low. Consider using simpler language and shorter sentences.');
      recommendations.push('Simplify vocabulary and reduce sentence complexity.');
    }

    // 3. Coherence and Flow (Placeholder - requires advanced NLP or human review)
    const coherenceScore = 70; // Assume reasonable for now
    if (coherenceScore < 60) {
      issues.push('Content coherence and flow may need improvement.');
      recommendations.push('Ensure smooth transitions between paragraphs and ideas.');
    }

    // 4. Style Consistency (Rule-based, simplified)

    // Check for common writing issues
    if (lowerContent.includes('very very') || lowerContent.includes('really really')) {
      issues.push('Detected repetitive adverbs. Vary your language.');
      recommendations.push('Use stronger verbs and more precise adjectives.');
      styleConsistencyScore -= 5;
    }
    if (sentences.some(sentence => sentence.split(' ').length > 30)) {
      issues.push('Some sentences are very long. Consider breaking them up.');
      recommendations.push('Aim for shorter, more concise sentences.');
      styleConsistencyScore -= 5;
    }

    // Active Voice Preference (simplified)
    if (lowerContent.includes('was done by') || lowerContent.includes('is seen by')) {
      issues.push('Passive voice detected. Consider using active voice for stronger writing.');
      recommendations.push('Rephrase sentences to use active voice.');
      styleConsistencyScore -= 5;
    }

    // Jargon/Wordiness (simplified)
    const jargonWords = ['synergy', 'paradigm', 'leverage', 'optimize', 'holistic'];
    if (words.filter(word => jargonWords.includes(word.toLowerCase())).length > words.length * 0.005) {
      issues.push('High use of jargon or buzzwords. Aim for clearer, simpler language.');
      recommendations.push('Replace jargon with plain language.');
      styleConsistencyScore -= 5;
    }

    // Calculate overall quality score
    const overallQualityScore = (
      Math.max(0, grammarScore) * 0.25 +
      Math.max(0, syntaxScore) * 0.25 +
      Math.max(0, readabilityScore) * 0.2 +
      Math.max(0, coherenceScore) * 0.15 +
      Math.max(0, styleConsistencyScore) * 0.15
    );

    return {
      grammarScore: Math.max(0, grammarScore),
      syntaxScore: Math.max(0, syntaxScore),
      readabilityScore,
      coherenceScore,
      styleConsistencyScore: Math.max(0, styleConsistencyScore),
      overallQualityScore: Math.min(100, overallQualityScore),
      issues,
      recommendations,
    };
  }
}
