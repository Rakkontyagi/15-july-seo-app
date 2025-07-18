import { stopwords, WordTokenizer, PorterStemmer } from 'natural';

export interface LsiKeyword {
  term: string;
  frequency: number;
  relevance: number;
  clusters?: string[]; // To store related LSI terms
}

export interface LsiExtractionContext {
  mainKeyword?: string;
  headings?: string[];
  firstParagraph?: string;
  region?: string; // Added region for market-specific analysis
}

// Simplified regional LSI preferences (for demonstration)
const REGIONAL_LSI_PREFERENCES: { [region: string]: string[] } = {
  'us': ['digital marketing', 'content strategy', 'search engine optimization'],
  'uk': ['digital marketing', 'content strategy', 'seo', 'web optimisation'],
  'ae': ['digital marketing', 'content strategy', 'seo dubai', 'uae marketing'],
  'au': ['digital marketing', 'content strategy', 'seo australia', 'online marketing'],
};

export function extractLsiKeywords(text: string, context: LsiExtractionContext = {}): LsiKeyword[] {
  if (!text) {
    return [];
  }

  const tokenizer = new WordTokenizer();
  const words = tokenizer.tokenize(text.toLowerCase());

  // Filter out stopwords and short words
  const filteredWords = words.filter(word => 
    word.length > 2 && !stopwords.includes(word)
  );

  // Calculate word frequencies
  const wordFrequencies: { [key: string]: number } = {};
  for (const word of filteredWords) {
    wordFrequencies[word] = (wordFrequencies[word] || 0) + 1;
  }

  const sentences = text.toLowerCase().split(/[.!?\n]/).filter(s => s.trim().length > 0);
  const paragraphs = text.toLowerCase().split(/\n\s*\n/).filter(p => p.trim().length > 0);

  const lsiKeywords: LsiKeyword[] = Object.keys(wordFrequencies).map(term => {
    let relevance = 0.1; // Base relevance

    // Co-occurrence within sentences
    sentences.forEach(sentence => {
      if (sentence.includes(term) && context.mainKeyword && sentence.includes(context.mainKeyword.toLowerCase())) {
        relevance += 0.1; // Boost if co-occurs with main keyword in same sentence
      }
    });

    // Co-occurrence within paragraphs
    paragraphs.forEach(paragraph => {
      if (paragraph.includes(term) && context.mainKeyword && paragraph.includes(context.mainKeyword.toLowerCase())) {
        relevance += 0.1; // Boost if co-occurs with main keyword in same paragraph
      }
    });

    // Appearance in headings
    context.headings?.forEach(heading => {
      if (heading.toLowerCase().includes(term)) {
        relevance += 0.15; // Boost if appears in a heading
      }
    });

    // Appearance in first paragraph
    if (context.firstParagraph && context.firstParagraph.toLowerCase().includes(term)) {
      relevance += 0.2; // Boost if appears in the first paragraph
    }

    // Boost if it's a variation of the main keyword (simple check)
    if (context.mainKeyword && PorterStemmer.stem(term) === PorterStemmer.stem(context.mainKeyword.toLowerCase())) {
      relevance += 0.25;
    }

    // Regional preference boost
    if (context.region) {
      const regionalTerms = REGIONAL_LSI_PREFERENCES[context.region.toLowerCase()];
      if (regionalTerms && regionalTerms.includes(term)) {
        relevance += 0.2; // Boost for regional relevance
      }
    }

    return {
      term,
      frequency: wordFrequencies[term],
      relevance: Math.min(1, relevance),
    };
  });

  // Basic clustering: group terms that frequently appear together
  const clusteredLsiKeywords = lsiKeywords.map(lsi => {
    const relatedTerms: string[] = [];
    sentences.forEach(sentence => {
      if (sentence.includes(lsi.term)) {
        lsiKeywords.forEach(otherLsi => {
          if (otherLsi.term !== lsi.term && sentence.includes(otherLsi.term)) {
            relatedTerms.push(otherLsi.term);
          }
        });
      }
    });
    return { ...lsi, clusters: [...new Set(relatedTerms)] };
  });

  // Sort by frequency and then relevance, take top N
  clusteredLsiKeywords.sort((a, b) => {
    if (b.frequency !== a.frequency) {
      return b.frequency - a.frequency;
    }
    return b.relevance - a.relevance;
  }
  );

  return clusteredLsiKeywords.slice(0, 20); // Return top 20 LSI keywords
}

export function findSemanticConnections(lsiKeywords1: LsiKeyword[], lsiKeywords2: LsiKeyword[]): Array<{ term: string; relevance1: number; relevance2: number }> {
  const connections: Array<{ term: string; relevance1: number; relevance2: number }> = [];
  const lsiMap2 = new Map(lsiKeywords2.map(lsi => [lsi.term, lsi]));

  lsiKeywords1.forEach(lsi1 => {
    if (lsiMap2.has(lsi1.term)) {
      const lsi2 = lsiMap2.get(lsi1.term)!;
      connections.push({
        term: lsi1.term,
        relevance1: lsi1.relevance,
        relevance2: lsi2.relevance,
      });
    }
  });

  return connections.sort((a, b) => (b.relevance1 + b.relevance2) - (a.relevance1 + a.relevance2));
}