export interface CoherenceOptimizationResult {
  content: string;
  changes: Array<{
    type: 'coherence';
    original: string;
    optimized: string;
    reason: string;
  }>;
  coherenceScore: number;
  topicProgression: Array<{
    topic: string;
    sentences: number;
    coherenceScore: number;
  }>;
}

export class SemanticCoherenceOptimizer {
  private transitionWords = {
    addition: ['furthermore', 'moreover', 'additionally', 'also', 'besides', 'in addition'],
    contrast: ['however', 'nevertheless', 'nonetheless', 'conversely', 'on the other hand', 'in contrast'],
    cause: ['therefore', 'consequently', 'as a result', 'thus', 'hence', 'accordingly'],
    sequence: ['first', 'second', 'third', 'next', 'then', 'finally', 'subsequently'],
    example: ['for example', 'for instance', 'specifically', 'namely', 'such as'],
    emphasis: ['indeed', 'in fact', 'certainly', 'undoubtedly', 'clearly'],
    conclusion: ['in conclusion', 'to summarize', 'in summary', 'ultimately', 'overall']
  };

  private topicKeywords = {
    technology: ['system', 'software', 'algorithm', 'data', 'digital', 'computer', 'technology', 'platform', 'application'],
    business: ['strategy', 'market', 'customer', 'revenue', 'growth', 'business', 'company', 'organization', 'management'],
    process: ['method', 'procedure', 'process', 'approach', 'technique', 'system', 'framework', 'methodology'],
    analysis: ['analysis', 'research', 'study', 'data', 'findings', 'results', 'evidence', 'statistics', 'metrics'],
    optimization: ['optimization', 'improvement', 'enhancement', 'efficiency', 'performance', 'quality', 'effectiveness'],
    content: ['content', 'text', 'writing', 'article', 'document', 'information', 'material', 'copy']
  };

  optimizeCoherence(content: string): CoherenceOptimizationResult {
    const changes: CoherenceOptimizationResult['changes'] = [];
    let optimizedContent = content;

    // Analyze topic progression
    const topicProgression = this.analyzeTopicProgression(content);

    // Improve logical flow
    const flowResult = this.improveLogicalFlow(optimizedContent);
    optimizedContent = flowResult.content;
    changes.push(...flowResult.changes);

    // Optimize transitions
    const transitionResult = this.optimizeTransitions(optimizedContent);
    optimizedContent = transitionResult.content;
    changes.push(...transitionResult.changes);

    // Enhance topic coherence
    const coherenceResult = this.enhanceTopicCoherence(optimizedContent);
    optimizedContent = coherenceResult.content;
    changes.push(...coherenceResult.changes);

    // Calculate final coherence score
    const coherenceScore = this.calculateCoherenceScore(optimizedContent);

    return {
      content: optimizedContent,
      changes,
      coherenceScore,
      topicProgression
    };
  }

  private analyzeTopicProgression(content: string): Array<{
    topic: string;
    sentences: number;
    coherenceScore: number;
  }> {
    const sentences = this.splitIntoSentences(content);
    const topicProgression: Array<{ topic: string; sentences: number; coherenceScore: number }> = [];

    // Group sentences by topic
    const topicGroups: Record<string, string[]> = {};

    sentences.forEach(sentence => {
      const dominantTopic = this.identifyDominantTopic(sentence);
      if (!topicGroups[dominantTopic]) {
        topicGroups[dominantTopic] = [];
      }
      topicGroups[dominantTopic].push(sentence);
    });

    // Calculate coherence for each topic group
    Object.entries(topicGroups).forEach(([topic, topicSentences]) => {
      const coherenceScore = this.calculateTopicCoherence(topicSentences);
      topicProgression.push({
        topic,
        sentences: topicSentences.length,
        coherenceScore
      });
    });

    return topicProgression.sort((a, b) => b.sentences - a.sentences);
  }

  private identifyDominantTopic(sentence: string): string {
    const sentenceLower = sentence.toLowerCase();
    let maxScore = 0;
    let dominantTopic = 'general';

    Object.entries(this.topicKeywords).forEach(([topic, keywords]) => {
      const score = keywords.reduce((count, keyword) => {
        return count + (sentenceLower.includes(keyword) ? 1 : 0);
      }, 0);

      if (score > maxScore) {
        maxScore = score;
        dominantTopic = topic;
      }
    });

    return dominantTopic;
  }

  private calculateTopicCoherence(sentences: string[]): number {
    if (sentences.length <= 1) return 100;

    let coherenceScore = 0;
    const totalComparisons = sentences.length - 1;

    for (let i = 0; i < sentences.length - 1; i++) {
      const similarity = this.calculateSentenceSimilarity(sentences[i], sentences[i + 1]);
      coherenceScore += similarity;
    }

    return totalComparisons > 0 ? (coherenceScore / totalComparisons) * 100 : 0;
  }

  private calculateSentenceSimilarity(sentence1: string, sentence2: string): number {
    const words1 = this.extractKeywords(sentence1);
    const words2 = this.extractKeywords(sentence2);

    if (words1.length === 0 || words2.length === 0) return 0;

    const commonWords = words1.filter(word => words2.includes(word));
    const totalUniqueWords = new Set([...words1, ...words2]).size;

    return totalUniqueWords > 0 ? commonWords.length / totalUniqueWords : 0;
  }

  private extractKeywords(sentence: string): string[] {
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those'];
    
    return sentence
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word));
  }

  private improveLogicalFlow(content: string): {
    content: string;
    changes: CoherenceOptimizationResult['changes'];
  } {
    const changes: CoherenceOptimizationResult['changes'] = [];
    const sentences = this.splitIntoSentences(content);
    
    // Analyze sentence relationships and reorder if necessary
    const reorderedSentences = this.reorderSentencesForFlow(sentences);
    
    if (JSON.stringify(sentences) !== JSON.stringify(reorderedSentences)) {
      changes.push({
        type: 'coherence',
        original: 'Original sentence order',
        optimized: 'Reordered for logical flow',
        reason: 'Improved logical progression of ideas'
      });
    }

    return {
      content: reorderedSentences.join(' '),
      changes
    };
  }

  private reorderSentencesForFlow(sentences: string[]): string[] {
    // Simple reordering based on topic similarity
    if (sentences.length <= 2) return sentences;

    const reordered = [sentences[0]]; // Keep first sentence
    const remaining = sentences.slice(1);

    while (remaining.length > 0) {
      const lastSentence = reordered[reordered.length - 1];
      let bestMatch = 0;
      let bestScore = 0;

      // Find the most similar remaining sentence
      remaining.forEach((sentence, index) => {
        const similarity = this.calculateSentenceSimilarity(lastSentence, sentence);
        if (similarity > bestScore) {
          bestScore = similarity;
          bestMatch = index;
        }
      });

      // Add the best match and remove from remaining
      reordered.push(remaining[bestMatch]);
      remaining.splice(bestMatch, 1);
    }

    return reordered;
  }

  private optimizeTransitions(content: string): {
    content: string;
    changes: CoherenceOptimizationResult['changes'];
  } {
    const changes: CoherenceOptimizationResult['changes'] = [];
    const sentences = this.splitIntoSentences(content);
    
    const optimizedSentences = sentences.map((sentence, index) => {
      if (index === 0) return sentence; // Skip first sentence

      const previousSentence = sentences[index - 1];
      const relationship = this.analyzeRelationship(previousSentence, sentence);
      
      // Check if sentence needs a transition
      if (relationship.needsTransition && !this.hasTransition(sentence)) {
        const transition = this.selectAppropriateTransition(relationship.type);
        const optimizedSentence = `${transition} ${sentence.toLowerCase()}`;
        
        changes.push({
          type: 'coherence',
          original: sentence,
          optimized: optimizedSentence,
          reason: `Added ${relationship.type} transition for better flow`
        });
        
        return optimizedSentence;
      }

      return sentence;
    });

    return {
      content: optimizedSentences.join(' '),
      changes
    };
  }

  private analyzeRelationship(sentence1: string, sentence2: string): {
    type: keyof typeof this.transitionWords;
    needsTransition: boolean;
    confidence: number;
  } {
    const similarity = this.calculateSentenceSimilarity(sentence1, sentence2);
    
    // Analyze content for relationship indicators
    const s1Lower = sentence1.toLowerCase();
    const s2Lower = sentence2.toLowerCase();

    // Check for contrast indicators
    if (this.hasContrastIndicators(s1Lower, s2Lower)) {
      return { type: 'contrast', needsTransition: similarity < 0.3, confidence: 0.8 };
    }

    // Check for cause-effect relationship
    if (this.hasCauseEffectIndicators(s1Lower, s2Lower)) {
      return { type: 'cause', needsTransition: similarity < 0.4, confidence: 0.7 };
    }

    // Check for example relationship
    if (this.hasExampleIndicators(s1Lower, s2Lower)) {
      return { type: 'example', needsTransition: similarity < 0.5, confidence: 0.6 };
    }

    // Default to addition if sentences are related but need connection
    return { 
      type: 'addition', 
      needsTransition: similarity > 0.2 && similarity < 0.6, 
      confidence: 0.5 
    };
  }

  private hasContrastIndicators(sentence1: string, sentence2: string): boolean {
    const contrastWords = ['but', 'however', 'although', 'despite', 'while', 'whereas', 'different', 'opposite', 'unlike'];
    return contrastWords.some(word => sentence2.includes(word)) ||
           (sentence1.includes('positive') && sentence2.includes('negative')) ||
           (sentence1.includes('advantage') && sentence2.includes('disadvantage'));
  }

  private hasCauseEffectIndicators(sentence1: string, sentence2: string): boolean {
    const causeWords = ['because', 'since', 'due to', 'as a result', 'therefore', 'consequently'];
    const effectWords = ['result', 'outcome', 'consequence', 'effect', 'impact'];
    
    return causeWords.some(word => sentence2.includes(word)) ||
           effectWords.some(word => sentence2.includes(word));
  }

  private hasExampleIndicators(sentence1: string, sentence2: string): boolean {
    const exampleWords = ['example', 'instance', 'such as', 'including', 'like', 'specifically'];
    return exampleWords.some(word => sentence2.includes(word));
  }

  private hasTransition(sentence: string): boolean {
    const allTransitions = Object.values(this.transitionWords).flat();
    const sentenceLower = sentence.toLowerCase();
    
    return allTransitions.some(transition => 
      sentenceLower.startsWith(transition.toLowerCase())
    );
  }

  private selectAppropriateTransition(type: keyof typeof this.transitionWords): string {
    const transitions = this.transitionWords[type];
    return transitions[Math.floor(Math.random() * transitions.length)];
  }

  private enhanceTopicCoherence(content: string): {
    content: string;
    changes: CoherenceOptimizationResult['changes'];
  } {
    const changes: CoherenceOptimizationResult['changes'] = [];
    const sentences = this.splitIntoSentences(content);
    
    // Group sentences by topic and ensure coherent grouping
    const topicGroups = this.groupSentencesByTopic(sentences);
    const reorderedSentences = this.reorderByTopicCoherence(topicGroups);
    
    if (JSON.stringify(sentences) !== JSON.stringify(reorderedSentences)) {
      changes.push({
        type: 'coherence',
        original: 'Original topic organization',
        optimized: 'Reorganized by topic coherence',
        reason: 'Grouped related topics together for better coherence'
      });
    }

    return {
      content: reorderedSentences.join(' '),
      changes
    };
  }

  private groupSentencesByTopic(sentences: string[]): Record<string, string[]> {
    const groups: Record<string, string[]> = {};
    
    sentences.forEach(sentence => {
      const topic = this.identifyDominantTopic(sentence);
      if (!groups[topic]) {
        groups[topic] = [];
      }
      groups[topic].push(sentence);
    });

    return groups;
  }

  private reorderByTopicCoherence(topicGroups: Record<string, string[]>): string[] {
    const reordered: string[] = [];
    
    // Order topics by importance (number of sentences)
    const orderedTopics = Object.entries(topicGroups)
      .sort(([, a], [, b]) => b.length - a.length)
      .map(([topic]) => topic);

    // Add sentences from each topic group
    orderedTopics.forEach(topic => {
      reordered.push(...topicGroups[topic]);
    });

    return reordered;
  }

  private calculateCoherenceScore(content: string): number {
    const sentences = this.splitIntoSentences(content);
    if (sentences.length <= 1) return 100;

    let totalCoherence = 0;
    let comparisons = 0;

    // Calculate coherence between adjacent sentences
    for (let i = 0; i < sentences.length - 1; i++) {
      const similarity = this.calculateSentenceSimilarity(sentences[i], sentences[i + 1]);
      const hasTransition = this.hasTransition(sentences[i + 1]);
      
      // Boost score if there's an appropriate transition
      const coherenceScore = similarity + (hasTransition ? 0.2 : 0);
      totalCoherence += Math.min(1, coherenceScore);
      comparisons++;
    }

    // Calculate topic consistency bonus
    const topicProgression = this.analyzeTopicProgression(content);
    const topicConsistency = topicProgression.reduce((sum, topic) => sum + topic.coherenceScore, 0) / topicProgression.length;

    const baseScore = comparisons > 0 ? (totalCoherence / comparisons) * 100 : 0;
    const finalScore = (baseScore * 0.7) + (topicConsistency * 0.3);

    return Math.round(finalScore * 100) / 100;
  }

  private splitIntoSentences(content: string): string[] {
    return content
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .map(s => s.charAt(0).toUpperCase() + s.slice(1));
  }

  analyzeCoherence(content: string): {
    overallScore: number;
    topicProgression: Array<{ topic: string; sentences: number; coherenceScore: number }>;
    transitionQuality: number;
    logicalFlow: number;
    recommendations: string[];
  } {
    const sentences = this.splitIntoSentences(content);
    const topicProgression = this.analyzeTopicProgression(content);
    
    // Calculate transition quality
    let transitionCount = 0;
    let appropriateTransitions = 0;
    
    sentences.forEach((sentence, index) => {
      if (index > 0) {
        const hasTransition = this.hasTransition(sentence);
        const previousSentence = sentences[index - 1];
        const relationship = this.analyzeRelationship(previousSentence, sentence);
        
        if (hasTransition) {
          transitionCount++;
          if (relationship.confidence > 0.6) {
            appropriateTransitions++;
          }
        }
      }
    });

    const transitionQuality = transitionCount > 0 ? (appropriateTransitions / transitionCount) * 100 : 0;

    // Calculate logical flow
    let flowScore = 0;
    for (let i = 0; i < sentences.length - 1; i++) {
      const similarity = this.calculateSentenceSimilarity(sentences[i], sentences[i + 1]);
      flowScore += similarity;
    }
    const logicalFlow = sentences.length > 1 ? (flowScore / (sentences.length - 1)) * 100 : 100;

    const overallScore = this.calculateCoherenceScore(content);

    // Generate recommendations
    const recommendations: string[] = [];
    if (overallScore < 70) {
      recommendations.push('Improve overall coherence by strengthening connections between sentences');
    }
    if (transitionQuality < 60) {
      recommendations.push('Add appropriate transition words to improve flow');
    }
    if (logicalFlow < 50) {
      recommendations.push('Reorder sentences for better logical progression');
    }
    if (topicProgression.some(topic => topic.coherenceScore < 60)) {
      recommendations.push('Group related sentences together by topic');
    }

    return {
      overallScore,
      topicProgression,
      transitionQuality,
      logicalFlow,
      recommendations
    };
  }
}