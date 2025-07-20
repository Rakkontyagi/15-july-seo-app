
import nlp from 'compromise';
import { SentenceStructurePattern } from '../../../types/content-analysis';

/**
 * Analyzes sentence structure patterns that may indicate AI generation
 * Looks for repetitive structures, predictable patterns, and lack of variation
 */
export function analyzeSentenceStructure(content: string): SentenceStructurePattern[] {
  const doc = nlp(content);
  const sentences = doc.sentences().json();

  if (sentences.length === 0) return [];

  const patterns: SentenceStructurePattern[] = [];

  // Analyze sentence beginnings
  const beginningPatterns = analyzeSentenceBeginnings(sentences);
  patterns.push(...beginningPatterns);

  // Analyze sentence structures
  const structurePatterns = analyzeSentenceStructures(sentences);
  patterns.push(...structurePatterns);

  // Analyze length patterns
  const lengthPatterns = analyzeLengthPatterns(sentences);
  patterns.push(...lengthPatterns);

  // Analyze complexity patterns
  const complexityPatterns = analyzeComplexityPatterns(sentences);
  patterns.push(...complexityPatterns);

  return patterns.filter(pattern => pattern.riskLevel > 0.3);
}

function analyzeSentenceBeginnings(sentences: any[]): SentenceStructurePattern[] {
  const beginnings = new Map<string, string[]>();

  sentences.forEach((sentence: any) => {
    if (sentence.terms && sentence.terms.length > 0) {
      const firstWord = sentence.terms[0].text.toLowerCase();
      const firstTwoWords = sentence.terms.slice(0, 2).map((t: any) => t.text).join(' ').toLowerCase();

      // Track first word patterns
      if (!beginnings.has(firstWord)) {
        beginnings.set(firstWord, []);
      }
      beginnings.get(firstWord)!.push(sentence.text);

      // Track first two words patterns
      if (sentence.terms.length > 1) {
        if (!beginnings.has(firstTwoWords)) {
          beginnings.set(firstTwoWords, []);
        }
        beginnings.get(firstTwoWords)!.push(sentence.text);
      }
    }
  });

  const patterns: SentenceStructurePattern[] = [];
  const totalSentences = sentences.length;

  for (const [pattern, examples] of beginnings.entries()) {
    const frequency = examples.length;
    const percentage = frequency / totalSentences;

    if (frequency > 1 && percentage > 0.2) { // More than 20% of sentences
      patterns.push({
        pattern: `Repetitive beginning: "${pattern}"`,
        frequency,
        examples: examples.slice(0, 3), // Show first 3 examples
        riskLevel: Math.min(percentage * 2, 1) // Cap at 1.0
      });
    }
  }

  return patterns;
}

function analyzeSentenceStructures(sentences: any[]): SentenceStructurePattern[] {
  const structures = new Map<string, string[]>();

  sentences.forEach((sentence: any) => {
    if (sentence.terms && sentence.terms.length > 0) {
      // Create a simplified structure pattern based on POS tags
      const structure = sentence.terms
        .map((term: any) => {
          const tags = term.tags || [];
          if (tags.includes('Noun')) return 'N';
          if (tags.includes('Verb')) return 'V';
          if (tags.includes('Adjective')) return 'A';
          if (tags.includes('Adverb')) return 'R';
          if (tags.includes('Preposition')) return 'P';
          if (tags.includes('Determiner')) return 'D';
          if (tags.includes('Conjunction')) return 'C';
          return 'O'; // Other
        })
        .join('');

      // Group similar structures
      const generalizedStructure = generalizeStructure(structure);

      if (!structures.has(generalizedStructure)) {
        structures.set(generalizedStructure, []);
      }
      structures.get(generalizedStructure)!.push(sentence.text);
    }
  });

  const patterns: SentenceStructurePattern[] = [];
  const totalSentences = sentences.length;

  for (const [structure, examples] of structures.entries()) {
    const frequency = examples.length;
    const percentage = frequency / totalSentences;

    if (frequency > 2 && percentage > 0.25) { // More than 25% of sentences
      patterns.push({
        pattern: `Repetitive structure: ${structure}`,
        frequency,
        examples: examples.slice(0, 3),
        riskLevel: Math.min(percentage * 1.5, 1)
      });
    }
  }

  return patterns;
}

function generalizeStructure(structure: string): string {
  // Simplify structure patterns to catch similar constructions
  return structure
    .replace(/N+/g, 'N') // Multiple nouns become single N
    .replace(/V+/g, 'V') // Multiple verbs become single V
    .replace(/A+/g, 'A') // Multiple adjectives become single A
    .replace(/R+/g, 'R') // Multiple adverbs become single R
    .replace(/O+/g, 'O'); // Multiple others become single O
}

function analyzeLengthPatterns(sentences: any[]): SentenceStructurePattern[] {
  const lengths = sentences.map(s => s.terms ? s.terms.length : 0);
  const patterns: SentenceStructurePattern[] = [];

  if (lengths.length === 0) return patterns;

  // Check for very uniform length distribution
  const avgLength = lengths.reduce((sum, len) => sum + len, 0) / lengths.length;
  const variance = lengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / lengths.length;
  const stdDev = Math.sqrt(variance);

  // Low variance indicates uniform, potentially AI-generated sentences
  // Adjusted threshold to be more sensitive for shorter content
  const threshold = sentences.length > 5 ? 3 : 1.5;
  const minSentences = sentences.length > 5 ? 5 : 3;

  if (stdDev < threshold && sentences.length >= minSentences) {
    patterns.push({
      pattern: `Uniform sentence length (avg: ${avgLength.toFixed(1)}, std: ${stdDev.toFixed(1)})`,
      frequency: sentences.length,
      examples: sentences.slice(0, 3).map((s: any) => s.text || ''),
      riskLevel: Math.max(0, (threshold - stdDev) / threshold) // Higher risk for lower std dev
    });
  }

  return patterns;
}

function analyzeComplexityPatterns(sentences: any[]): SentenceStructurePattern[] {
  const patterns: SentenceStructurePattern[] = [];

  // Analyze clause complexity
  const complexities = sentences.map(sentence => {
    if (!sentence.terms) return 0;

    let complexity = 0;
    const text = sentence.text.toLowerCase();

    // Count subordinating conjunctions
    const subordinatingConjunctions = ['because', 'since', 'although', 'while', 'if', 'when', 'where', 'that', 'which'];
    subordinatingConjunctions.forEach(conj => {
      complexity += (text.match(new RegExp(`\\b${conj}\\b`, 'g')) || []).length;
    });

    // Count commas (rough indicator of clause complexity)
    complexity += (text.match(/,/g) || []).length * 0.5;

    return complexity;
  });

  const avgComplexity = complexities.reduce((sum, comp) => sum + comp, 0) / complexities.length;
  const variance = complexities.reduce((sum, comp) => sum + Math.pow(comp - avgComplexity, 2), 0) / complexities.length;

  // Very low complexity variation might indicate AI generation
  if (variance < 0.5 && sentences.length > 5) {
    patterns.push({
      pattern: `Uniform complexity (avg: ${avgComplexity.toFixed(1)})`,
      frequency: sentences.length,
      examples: sentences.slice(0, 3).map((s: any) => s.text),
      riskLevel: Math.max(0, (1 - variance) * 0.8)
    });
  }

  return patterns;
}
