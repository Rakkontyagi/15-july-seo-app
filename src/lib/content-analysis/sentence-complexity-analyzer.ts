
import nlp from 'compromise';

export interface ReadabilityAnalysis {
  sentence: string;
  wordCount: number;
  avgWordsPerSentence: number;
  avgSyllablesPerWord: number;
  avgSyllablesPerSentence: number;
  complexWords: number;
  complexWordPercentage: number;
  fleschKincaidGrade: number;
  fleschReadingEase: number;
  gunningFogIndex: number;
  colemanLiauIndex: number;
  automatedReadabilityIndex: number;
  readabilityGrade: 'elementary' | 'middle' | 'high-school' | 'college' | 'graduate';
  isOptimal: boolean;
}

export interface ComplexityOptimization {
  original: string;
  optimized: string;
  reason: string;
  complexityReduction: number;
  authorityImpact: number;
  tonePreservation: number;
}

export interface ComplexityResult {
  originalContent: string;
  optimizedContent: string;
  originalComplexity: number;
  optimizedComplexity: number;
  sentenceAnalysis: ReadabilityAnalysis[];
  optimizations: ComplexityOptimization[];
  overallReadabilityScore: number;
  targetComplexityAchieved: boolean;
  authorityMaintained: boolean;
  tonePreserved: boolean;
}

export class SentenceComplexityAnalyzer {
  private readonly optimalComplexityRange = { min: 12, max: 18 };
  private readonly maxComplexWordsPercentage = 30;
  private readonly authorityWords = [
    'research', 'study', 'analysis', 'evidence', 'data', 'findings', 'results',
    'investigation', 'examination', 'assessment', 'evaluation', 'methodology',
    'systematic', 'comprehensive', 'thorough', 'rigorous', 'scientific',
    'empirical', 'statistical', 'quantitative', 'qualitative', 'objective',
    'validated', 'verified', 'confirmed', 'established', 'documented',
    'published', 'peer-reviewed', 'academic', 'scholarly', 'professional',
    'expert', 'specialist', 'authority', 'credible', 'reliable', 'authoritative'
  ];
  
  private readonly tonePreservers = [
    'professional', 'formal', 'academic', 'technical', 'scientific', 'clinical',
    'business', 'corporate', 'official', 'diplomatic', 'legal', 'medical',
    'educational', 'instructional', 'informational', 'analytical', 'critical',
    'objective', 'neutral', 'factual', 'evidence-based', 'data-driven'
  ];

  analyzeComplexity(content: string): number {
    const sentences = this.splitIntoSentences(content);
    if (sentences.length === 0) return 0;

    const totalWords = sentences.reduce((sum, sentence) => sum + this.countWords(sentence), 0);
    return totalWords / sentences.length;
  }

  analyzeReadability(content: string): ReadabilityAnalysis[] {
    const sentences = this.splitIntoSentences(content);
    const analysis: ReadabilityAnalysis[] = [];

    sentences.forEach(sentence => {
      const wordCount = this.countWords(sentence);
      const syllableCount = this.countSyllables(sentence);
      const complexWords = this.countComplexWords(sentence);
      
      const avgWordsPerSentence = wordCount;
      const avgSyllablesPerWord = syllableCount / wordCount;
      const avgSyllablesPerSentence = syllableCount;
      const complexWordPercentage = (complexWords / wordCount) * 100;
      
      // Readability formulas
      const fleschKincaidGrade = this.calculateFleschKincaidGrade(avgWordsPerSentence, avgSyllablesPerWord);
      const fleschReadingEase = this.calculateFleschReadingEase(avgWordsPerSentence, avgSyllablesPerWord);
      const gunningFogIndex = this.calculateGunningFogIndex(avgWordsPerSentence, complexWordPercentage);
      const colemanLiauIndex = this.calculateColemanLiauIndex(sentence);
      const automatedReadabilityIndex = this.calculateAutomatedReadabilityIndex(sentence);
      
      const readabilityGrade = this.determineReadabilityGrade(fleschKincaidGrade);
      const isOptimal = this.isOptimalComplexity(avgWordsPerSentence, complexWordPercentage);
      
      analysis.push({
        sentence,
        wordCount,
        avgWordsPerSentence,
        avgSyllablesPerWord,
        avgSyllablesPerSentence,
        complexWords,
        complexWordPercentage,
        fleschKincaidGrade,
        fleschReadingEase,
        gunningFogIndex,
        colemanLiauIndex,
        automatedReadabilityIndex,
        readabilityGrade,
        isOptimal
      });
    });

    return analysis;
  }

  optimizeComplexity(content: string, targetComplexity: number): string {
    const result = this.optimizeComplexityWithAnalysis(content, targetComplexity);
    return result.optimizedContent;
  }

  optimizeComplexityWithAnalysis(content: string, targetComplexity: number): ComplexityResult {
    const originalContent = content;
    const originalComplexity = this.analyzeComplexity(content);
    const sentenceAnalysis = this.analyzeReadability(content);
    const optimizations: ComplexityOptimization[] = [];
    
    let optimizedContent = content;
    
    // Process sentences that are too complex
    const sentences = this.splitIntoSentences(content);
    const optimizedSentences: string[] = [];
    
    sentences.forEach(sentence => {
      const wordCount = this.countWords(sentence);
      const complexWords = this.countComplexWords(sentence);
      const complexWordPercentage = (complexWords / wordCount) * 100;
      
      if (wordCount > targetComplexity || complexWordPercentage > this.maxComplexWordsPercentage) {
        const optimization = this.optimizeSentence(sentence, targetComplexity);
        optimizations.push(optimization);
        optimizedSentences.push(optimization.optimized);
      } else {
        optimizedSentences.push(sentence);
      }
    });
    
    optimizedContent = optimizedSentences.join(' ');
    const optimizedComplexity = this.analyzeComplexity(optimizedContent);
    
    const overallReadabilityScore = this.calculateOverallReadabilityScore(sentenceAnalysis);
    const targetComplexityAchieved = Math.abs(optimizedComplexity - targetComplexity) <= 2;
    const authorityMaintained = this.checkAuthorityMaintained(originalContent, optimizedContent);
    const tonePreserved = this.checkTonePreserved(originalContent, optimizedContent);
    
    return {
      originalContent,
      optimizedContent,
      originalComplexity,
      optimizedComplexity,
      sentenceAnalysis,
      optimizations,
      overallReadabilityScore,
      targetComplexityAchieved,
      authorityMaintained,
      tonePreserved
    };
  }

  private optimizeSentence(sentence: string, targetComplexity: number): ComplexityOptimization {
    const originalSentence = sentence;
    let optimizedSentence = sentence;
    const originalComplexity = this.countWords(sentence);
    
    // Strategy 1: Split long sentences
    if (originalComplexity > targetComplexity * 1.5) {
      optimizedSentence = this.splitLongSentence(sentence);
    }
    
    // Strategy 2: Simplify complex words while preserving authority
    optimizedSentence = this.simplifyComplexWords(optimizedSentence);
    
    // Strategy 3: Reduce redundant phrases
    optimizedSentence = this.reduceRedundancy(optimizedSentence);
    
    // Strategy 4: Improve sentence structure
    optimizedSentence = this.improveStructure(optimizedSentence);
    
    const optimizedComplexity = this.countWords(optimizedSentence);
    const complexityReduction = originalComplexity - optimizedComplexity;
    const authorityImpact = this.calculateAuthorityImpact(originalSentence, optimizedSentence);
    const tonePreservation = this.calculateTonePreservation(originalSentence, optimizedSentence);
    
    return {
      original: originalSentence,
      optimized: optimizedSentence,
      reason: this.determineOptimizationReason(originalComplexity, targetComplexity),
      complexityReduction,
      authorityImpact,
      tonePreservation
    };
  }

  private splitLongSentence(sentence: string): string {
    const doc = nlp(sentence);
    const clauses = doc.match('#Clause').out('array');
    
    if (clauses.length > 1) {
      // Split at coordinating conjunctions
      const coordinatingConjunctions = ['and', 'but', 'or', 'nor', 'for', 'so', 'yet'];
      let splitSentence = sentence;
      
      coordinatingConjunctions.forEach(conjunction => {
        const regex = new RegExp(`\\s*,\\s*${conjunction}\\s+`, 'gi');
        splitSentence = splitSentence.replace(regex, `. ${conjunction.charAt(0).toUpperCase() + conjunction.slice(1)} `);
      });
      
      // Split at subordinating conjunctions for very long sentences
      if (this.countWords(splitSentence) > 25) {
        const subordinatingConjunctions = ['because', 'since', 'although', 'though', 'while', 'whereas'];
        subordinatingConjunctions.forEach(conjunction => {
          const regex = new RegExp(`\\s*${conjunction}\\s+`, 'gi');
          splitSentence = splitSentence.replace(regex, `. ${conjunction.charAt(0).toUpperCase() + conjunction.slice(1)} `);
        });
      }
      
      return splitSentence;
    }
    
    return sentence;
  }

  private simplifyComplexWords(sentence: string): string {
    const complexWordReplacements: { [key: string]: string } = {
      'utilize': 'use',
      'facilitate': 'help',
      'demonstrate': 'show',
      'implement': 'put in place',
      'methodology': 'method',
      'subsequently': 'then',
      'consequently': 'so',
      'nevertheless': 'but',
      'furthermore': 'also',
      'additionally': 'also',
      'therefore': 'so',
      'however': 'but',
      'although': 'though',
      'because': 'since',
      'regarding': 'about',
      'concerning': 'about',
      'pertaining': 'about',
      'approximately': 'about',
      'significant': 'important',
      'substantial': 'large',
      'considerable': 'large',
      'numerous': 'many',
      'various': 'many',
      'multiple': 'many',
      'individual': 'person',
      'particular': 'specific',
      'specific': 'exact',
      'general': 'common',
      'typical': 'usual',
      'common': 'usual',
      'frequent': 'common',
      'occasional': 'rare',
      'rare': 'uncommon',
      'unusual': 'rare',
      'extraordinary': 'rare',
      'exceptional': 'rare',
      'remarkable': 'notable',
      'notable': 'important',
      'significant': 'important',
      'crucial': 'key',
      'essential': 'key',
      'fundamental': 'basic',
      'elementary': 'basic',
      'complex': 'hard',
      'complicated': 'hard',
      'difficult': 'hard',
      'challenging': 'hard',
      'simple': 'easy',
      'straightforward': 'easy',
      'obvious': 'clear',
      'apparent': 'clear',
      'evident': 'clear',
      'visible': 'clear',
      'transparent': 'clear'
    };
    
    let simplifiedSentence = sentence;
    
    // Only replace if it doesn't reduce authority significantly
    Object.entries(complexWordReplacements).forEach(([complex, simple]) => {
      const isAuthorityWord = this.authorityWords.includes(complex.toLowerCase());
      if (!isAuthorityWord) {
        const regex = new RegExp(`\\b${complex}\\b`, 'gi');
        simplifiedSentence = simplifiedSentence.replace(regex, simple);
      }
    });
    
    return simplifiedSentence;
  }

  private reduceRedundancy(sentence: string): string {
    const redundantPhrases: { [key: string]: string } = {
      'in order to': 'to',
      'due to the fact that': 'because',
      'in spite of the fact that': 'despite',
      'at this point in time': 'now',
      'in the event that': 'if',
      'for the purpose of': 'to',
      'with regard to': 'about',
      'in relation to': 'about',
      'in connection with': 'about',
      'in the case of': 'for',
      'in terms of': 'for',
      'with respect to': 'about',
      'it is important to note that': '',
      'it should be noted that': '',
      'it should be mentioned that': '',
      'it is worth noting that': '',
      'please note that': '',
      'keep in mind that': '',
      'bear in mind that': '',
      'take into consideration that': 'consider that',
      'take into account that': 'consider that',
      'it is possible that': 'possibly',
      'it is likely that': 'likely',
      'there is a possibility that': 'possibly',
      'there is a chance that': 'possibly'
    };
    
    let reducedSentence = sentence;
    
    Object.entries(redundantPhrases).forEach(([redundant, replacement]) => {
      const regex = new RegExp(redundant.replace(/\s+/g, '\\s+'), 'gi');
      reducedSentence = reducedSentence.replace(regex, replacement);
    });
    
    return reducedSentence.replace(/\s+/g, ' ').trim();
  }

  private improveStructure(sentence: string): string {
    let improvedSentence = sentence;
    
    // Convert passive voice to active voice where appropriate
    improvedSentence = this.convertPassiveToActive(improvedSentence);
    
    // Remove unnecessary qualifiers
    const unnecessaryQualifiers = ['very', 'quite', 'rather', 'somewhat', 'fairly', 'pretty'];
    unnecessaryQualifiers.forEach(qualifier => {
      const regex = new RegExp(`\\b${qualifier}\\s+`, 'gi');
      improvedSentence = improvedSentence.replace(regex, '');
    });
    
    return improvedSentence.replace(/\s+/g, ' ').trim();
  }

  private convertPassiveToActive(sentence: string): string {
    const doc = nlp(sentence);
    const passiveVoice = doc.match('#Passive');
    
    if (passiveVoice.found) {
      // This is a simplified conversion - a full implementation would be more sophisticated
      let activeSentence = sentence;
      
      // Common passive to active conversions
      const passivePatterns = [
        { pattern: /\bis\s+([\w]+ed)\s+by\s+([\w\s]+)/gi, replacement: '$2 $1' },
        { pattern: /\bare\s+([\w]+ed)\s+by\s+([\w\s]+)/gi, replacement: '$2 $1' },
        { pattern: /\bwas\s+([\w]+ed)\s+by\s+([\w\s]+)/gi, replacement: '$2 $1' },
        { pattern: /\bwere\s+([\w]+ed)\s+by\s+([\w\s]+)/gi, replacement: '$2 $1' }
      ];
      
      passivePatterns.forEach(({ pattern, replacement }) => {
        activeSentence = activeSentence.replace(pattern, replacement);
      });
      
      return activeSentence;
    }
    
    return sentence;
  }

  private calculateFleschKincaidGrade(avgWordsPerSentence: number, avgSyllablesPerWord: number): number {
    return (0.39 * avgWordsPerSentence) + (11.8 * avgSyllablesPerWord) - 15.59;
  }

  private calculateFleschReadingEase(avgWordsPerSentence: number, avgSyllablesPerWord: number): number {
    return 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
  }

  private calculateGunningFogIndex(avgWordsPerSentence: number, complexWordPercentage: number): number {
    return 0.4 * (avgWordsPerSentence + complexWordPercentage);
  }

  private calculateColemanLiauIndex(sentence: string): number {
    const characters = sentence.replace(/\s/g, '').length;
    const words = this.countWords(sentence);
    const sentences = 1; // Single sentence
    
    const L = (characters / words) * 100;
    const S = (sentences / words) * 100;
    
    return (0.0588 * L) - (0.296 * S) - 15.8;
  }

  private calculateAutomatedReadabilityIndex(sentence: string): number {
    const characters = sentence.replace(/\s/g, '').length;
    const words = this.countWords(sentence);
    const sentences = 1; // Single sentence
    
    return (4.71 * (characters / words)) + (0.5 * (words / sentences)) - 21.43;
  }

  private determineReadabilityGrade(fleschKincaidGrade: number): 'elementary' | 'middle' | 'high-school' | 'college' | 'graduate' {
    if (fleschKincaidGrade < 6) return 'elementary';
    if (fleschKincaidGrade < 9) return 'middle';
    if (fleschKincaidGrade < 13) return 'high-school';
    if (fleschKincaidGrade < 16) return 'college';
    return 'graduate';
  }

  private isOptimalComplexity(avgWordsPerSentence: number, complexWordPercentage: number): boolean {
    return avgWordsPerSentence >= this.optimalComplexityRange.min &&
           avgWordsPerSentence <= this.optimalComplexityRange.max &&
           complexWordPercentage <= this.maxComplexWordsPercentage;
  }

  private calculateOverallReadabilityScore(sentenceAnalysis: ReadabilityAnalysis[]): number {
    if (sentenceAnalysis.length === 0) return 0;
    
    const avgFleschReadingEase = sentenceAnalysis.reduce((sum, analysis) => sum + analysis.fleschReadingEase, 0) / sentenceAnalysis.length;
    const optimalSentences = sentenceAnalysis.filter(analysis => analysis.isOptimal).length;
    const optimalPercentage = (optimalSentences / sentenceAnalysis.length) * 100;
    
    return (avgFleschReadingEase * 0.6) + (optimalPercentage * 0.4);
  }

  private checkAuthorityMaintained(original: string, optimized: string): boolean {
    const originalAuthorityWords = this.countAuthorityWords(original);
    const optimizedAuthorityWords = this.countAuthorityWords(optimized);
    
    // Authority is maintained if at least 80% of authority words are preserved
    return (optimizedAuthorityWords / originalAuthorityWords) >= 0.8;
  }

  private checkTonePreserved(original: string, optimized: string): boolean {
    const originalToneWords = this.countToneWords(original);
    const optimizedToneWords = this.countToneWords(optimized);
    
    // Tone is preserved if at least 85% of tone words are preserved
    return (optimizedToneWords / originalToneWords) >= 0.85;
  }

  private countAuthorityWords(content: string): number {
    const words = content.toLowerCase().split(/\s+/);
    return words.filter(word => this.authorityWords.includes(word)).length;
  }

  private countToneWords(content: string): number {
    const words = content.toLowerCase().split(/\s+/);
    return words.filter(word => this.tonePreservers.includes(word)).length;
  }

  private calculateAuthorityImpact(original: string, optimized: string): number {
    const originalAuthority = this.countAuthorityWords(original);
    const optimizedAuthority = this.countAuthorityWords(optimized);
    
    if (originalAuthority === 0) return 100;
    return (optimizedAuthority / originalAuthority) * 100;
  }

  private calculateTonePreservation(original: string, optimized: string): number {
    const originalTone = this.countToneWords(original);
    const optimizedTone = this.countToneWords(optimized);
    
    if (originalTone === 0) return 100;
    return (optimizedTone / originalTone) * 100;
  }

  private determineOptimizationReason(originalComplexity: number, targetComplexity: number): string {
    if (originalComplexity > targetComplexity * 1.5) {
      return 'Split long sentence for better readability';
    } else if (originalComplexity > targetComplexity * 1.2) {
      return 'Simplified complex words and reduced redundancy';
    } else {
      return 'Minor structural improvements for clarity';
    }
  }

  private splitIntoSentences(content: string): string[] {
    return content.split(/[.!?]+\s*/).filter(s => s.trim().length > 0);
  }

  private countWords(text: string): number {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  private countSyllables(text: string): number {
    const words = text.split(/\s+/);
    return words.reduce((total, word) => total + this.countSyllablesInWord(word), 0);
  }

  private countSyllablesInWord(word: string): number {
    const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
    if (cleanWord.length === 0) return 0;
    
    const vowels = 'aeiouy';
    let syllableCount = 0;
    let previousWasVowel = false;
    
    for (let i = 0; i < cleanWord.length; i++) {
      const isVowel = vowels.includes(cleanWord[i]);
      if (isVowel && !previousWasVowel) {
        syllableCount++;
      }
      previousWasVowel = isVowel;
    }
    
    // Adjust for silent 'e'
    if (cleanWord.endsWith('e') && syllableCount > 1) {
      syllableCount--;
    }
    
    return Math.max(1, syllableCount);
  }

  private countComplexWords(text: string): number {
    const words = text.split(/\s+/);
    return words.filter(word => this.countSyllablesInWord(word) >= 3).length;
  }

  // Public method to get complexity metrics
  getComplexityMetrics(content: string): {
    averageWordsPerSentence: number;
    averageSyllablesPerWord: number;
    complexWordPercentage: number;
    fleschReadingEase: number;
    fleschKincaidGrade: number;
    gunningFogIndex: number;
    readabilityGrade: string;
    isOptimal: boolean;
    recommendations: string[];
  } {
    const analysis = this.analyzeReadability(content);
    const averageWordsPerSentence = analysis.reduce((sum, a) => sum + a.avgWordsPerSentence, 0) / analysis.length;
    const averageSyllablesPerWord = analysis.reduce((sum, a) => sum + a.avgSyllablesPerWord, 0) / analysis.length;
    const complexWordPercentage = analysis.reduce((sum, a) => sum + a.complexWordPercentage, 0) / analysis.length;
    const fleschReadingEase = analysis.reduce((sum, a) => sum + a.fleschReadingEase, 0) / analysis.length;
    const fleschKincaidGrade = analysis.reduce((sum, a) => sum + a.fleschKincaidGrade, 0) / analysis.length;
    const gunningFogIndex = analysis.reduce((sum, a) => sum + a.gunningFogIndex, 0) / analysis.length;
    const readabilityGrade = this.determineReadabilityGrade(fleschKincaidGrade);
    const isOptimal = averageWordsPerSentence >= this.optimalComplexityRange.min &&
                     averageWordsPerSentence <= this.optimalComplexityRange.max &&
                     complexWordPercentage <= this.maxComplexWordsPercentage;
    const recommendations = this.generateComplexityRecommendations(analysis);
    
    return {
      averageWordsPerSentence: Math.round(averageWordsPerSentence * 100) / 100,
      averageSyllablesPerWord: Math.round(averageSyllablesPerWord * 100) / 100,
      complexWordPercentage: Math.round(complexWordPercentage * 100) / 100,
      fleschReadingEase: Math.round(fleschReadingEase * 100) / 100,
      fleschKincaidGrade: Math.round(fleschKincaidGrade * 100) / 100,
      gunningFogIndex: Math.round(gunningFogIndex * 100) / 100,
      readabilityGrade,
      isOptimal,
      recommendations
    };
  }

  private generateComplexityRecommendations(analysis: ReadabilityAnalysis[]): string[] {
    const recommendations: string[] = [];
    
    const avgWordsPerSentence = analysis.reduce((sum, a) => sum + a.avgWordsPerSentence, 0) / analysis.length;
    const avgComplexWordPercentage = analysis.reduce((sum, a) => sum + a.complexWordPercentage, 0) / analysis.length;
    const avgFleschReadingEase = analysis.reduce((sum, a) => sum + a.fleschReadingEase, 0) / analysis.length;
    
    if (avgWordsPerSentence > this.optimalComplexityRange.max) {
      recommendations.push('Consider breaking long sentences into shorter ones for better readability.');
    }
    
    if (avgWordsPerSentence < this.optimalComplexityRange.min) {
      recommendations.push('Some sentences may be too short. Consider combining related ideas.');
    }
    
    if (avgComplexWordPercentage > this.maxComplexWordsPercentage) {
      recommendations.push('High percentage of complex words detected. Consider simplifying where possible.');
    }
    
    if (avgFleschReadingEase < 60) {
      recommendations.push('Text may be difficult to read. Consider simplifying language and sentence structure.');
    }
    
    if (avgFleschReadingEase > 90) {
      recommendations.push('Text may be too simple. Consider adding more sophisticated vocabulary where appropriate.');
    }
    
    const longSentences = analysis.filter(a => a.avgWordsPerSentence > 25).length;
    if (longSentences > 0) {
      recommendations.push(`${longSentences} sentences are very long and should be split for better comprehension.`);
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Sentence complexity is well-balanced for optimal readability.');
    }
    
    return recommendations;
  }
}
