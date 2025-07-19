
import nlp from 'compromise';

export interface SemanticAnalysisResult {
  topics: TopicAnalysis[];
  entities: EntityAnalysis[];
  concepts: ConceptAnalysis[];
  relationships: RelationshipAnalysis[];
  semanticDensity: number;
  topicalCoherence: number;
  contentThemes: string[];
}

export interface TopicAnalysis {
  topic: string;
  frequency: number;
  importance: number;
  context: string[];
  relatedTerms: string[];
}

export interface EntityAnalysis {
  entity: string;
  type: 'person' | 'place' | 'organization' | 'product' | 'concept' | 'other';
  frequency: number;
  confidence: number;
  mentions: EntityMention[];
}

export interface EntityMention {
  text: string;
  position: number;
  context: string;
}

export interface ConceptAnalysis {
  concept: string;
  abstractionLevel: 'concrete' | 'abstract' | 'technical';
  semanticWeight: number;
  associatedTerms: string[];
}

export interface RelationshipAnalysis {
  sourceEntity: string;
  targetEntity: string;
  relationshipType: 'causal' | 'hierarchical' | 'associative' | 'temporal' | 'spatial';
  strength: number;
  evidence: string[];
}

export interface TopicalRelationshipResult {
  similarityScore: number;
  commonTopics: string[];
  uniqueTopics1: string[];
  uniqueTopics2: string[];
  semanticOverlap: number;
  conceptualDistance: number;
  linkingOpportunities: LinkingOpportunity[];
}

export interface LinkingOpportunity {
  sourceContext: string;
  targetContext: string;
  sharedConcepts: string[];
  relevanceScore: number;
  suggestedAnchorText: string[];
}

export interface SemanticAnalysisOptions {
  includeEntities?: boolean;
  analyzeConcepts?: boolean;
  findRelationships?: boolean;
  extractThemes?: boolean;
  minTopicFrequency?: number;
  maxTopics?: number;
}

/**
 * Advanced semantic analyzer that identifies topical relationships between
 * existing pages for intelligent internal linking opportunities using NLP,
 * entity recognition, and conceptual analysis
 */
export class SemanticAnalyzer {
  private readonly defaultOptions: Required<SemanticAnalysisOptions> = {
    includeEntities: true,
    analyzeConcepts: true,
    findRelationships: true,
    extractThemes: true,
    minTopicFrequency: 2,
    maxTopics: 50
  };

  /**
   * Perform comprehensive semantic analysis of content
   */
  analyzeContent(content: string, options: SemanticAnalysisOptions = {}): SemanticAnalysisResult {
    const opts = { ...this.defaultOptions, ...options };
    const doc = nlp(content);

    const topics = this.analyzeTopics(doc, content, opts);
    const entities = opts.includeEntities ? this.analyzeEntities(doc, content) : [];
    const concepts = opts.analyzeConcepts ? this.analyzeConcepts(doc, content) : [];
    const relationships = opts.findRelationships ? this.analyzeRelationships(doc, entities) : [];
    const semanticDensity = this.calculateSemanticDensity(topics, entities, concepts);
    const topicalCoherence = this.calculateTopicalCoherence(topics, concepts);
    const contentThemes = opts.extractThemes ? this.extractContentThemes(topics, concepts) : [];

    return {
      topics,
      entities,
      concepts,
      relationships,
      semanticDensity,
      topicalCoherence,
      contentThemes
    };
  }

  /**
   * Identify topical relationships between two pieces of content
   */
  identifyTopicalRelationships(
    content1: string,
    content2: string,
    options: SemanticAnalysisOptions = {}
  ): TopicalRelationshipResult {
    const analysis1 = this.analyzeContent(content1, options);
    const analysis2 = this.analyzeContent(content2, options);

    const similarityScore = this.calculateSimilarityScore(analysis1, analysis2);
    const topicComparison = this.compareTopics(analysis1.topics, analysis2.topics);
    const semanticOverlap = this.calculateSemanticOverlap(analysis1, analysis2);
    const conceptualDistance = this.calculateConceptualDistance(analysis1.concepts, analysis2.concepts);
    const linkingOpportunities = this.findLinkingOpportunities(analysis1, analysis2, content1, content2);

    return {
      similarityScore,
      commonTopics: topicComparison.common,
      uniqueTopics1: topicComparison.unique1,
      uniqueTopics2: topicComparison.unique2,
      semanticOverlap,
      conceptualDistance,
      linkingOpportunities
    };
  }

  /**
   * Find content clusters based on semantic similarity
   */
  findContentClusters(
    contentItems: Array<{ id: string; content: string; title?: string }>,
    options: SemanticAnalysisOptions = {}
  ): Array<{ clusterId: string; items: string[]; commonThemes: string[]; coherenceScore: number }> {
    const analyses = contentItems.map(item => ({
      id: item.id,
      analysis: this.analyzeContent(item.content, options),
      title: item.title
    }));

    const clusters: Array<{ clusterId: string; items: string[]; commonThemes: string[]; coherenceScore: number }> = [];
    const processed = new Set<string>();

    analyses.forEach((item, index) => {
      if (processed.has(item.id)) return;

      const cluster = {
        clusterId: `cluster_${index}`,
        items: [item.id],
        commonThemes: item.analysis.contentThemes,
        coherenceScore: item.analysis.topicalCoherence
      };

      // Find similar content
      analyses.forEach(otherItem => {
        if (otherItem.id === item.id || processed.has(otherItem.id)) return;

        const relationship = this.identifyTopicalRelationships(
          item.analysis.topics.map(t => t.topic).join(' '),
          otherItem.analysis.topics.map(t => t.topic).join(' ')
        );

        if (relationship.similarityScore > 0.6) {
          cluster.items.push(otherItem.id);
          processed.add(otherItem.id);

          // Update common themes
          cluster.commonThemes = this.findCommonThemes(
            cluster.commonThemes,
            otherItem.analysis.contentThemes
          );
        }
      });

      if (cluster.items.length > 1) {
        clusters.push(cluster);
      }
      processed.add(item.id);
    });

    return clusters.sort((a, b) => b.coherenceScore - a.coherenceScore);
  }

  /**
   * Analyze topics in content
   */
  private analyzeTopics(doc: any, content: string, options: Required<SemanticAnalysisOptions>): TopicAnalysis[] {
    const topics = doc.topics().json();
    const sentences = doc.sentences().json();

    return topics
      .filter((topic: any) => topic.count >= options.minTopicFrequency)
      .slice(0, options.maxTopics)
      .map((topic: any) => {
        const relatedTerms = this.findRelatedTerms(topic.text, content);
        const context = this.extractTopicContext(topic.text, sentences);
        const importance = this.calculateTopicImportance(topic, content);

        return {
          topic: topic.text,
          frequency: topic.count,
          importance,
          context,
          relatedTerms
        };
      })
      .sort((a, b) => b.importance - a.importance);
  }

  /**
   * Analyze entities in content
   */
  private analyzeEntities(doc: any, content: string): EntityAnalysis[] {
    const entities = doc.entities().json();

    return entities.map((entity: any) => {
      const mentions = this.extractEntityMentions(entity.text, content);
      const entityType = this.classifyEntity(entity.text, content);
      const confidence = this.calculateEntityConfidence(entity, mentions);

      return {
        entity: entity.text,
        type: entityType,
        frequency: mentions.length,
        confidence,
        mentions
      };
    }).sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Analyze concepts in content
   */
  private analyzeConcepts(doc: any, content: string): ConceptAnalysis[] {
    const nouns = doc.nouns().json();
    const concepts: ConceptAnalysis[] = [];

    nouns.forEach((noun: any) => {
      if (noun.text.length > 3) { // Filter out very short words
        const abstractionLevel = this.determineAbstractionLevel(noun.text, content);
        const semanticWeight = this.calculateSemanticWeight(noun.text, content);
        const associatedTerms = this.findAssociatedTerms(noun.text, content);

        concepts.push({
          concept: noun.text,
          abstractionLevel,
          semanticWeight,
          associatedTerms
        });
      }
    });

    return concepts
      .sort((a, b) => b.semanticWeight - a.semanticWeight)
      .slice(0, 30); // Limit to top 30 concepts
  }

  /**
   * Analyze relationships between entities
   */
  private analyzeRelationships(doc: any, entities: EntityAnalysis[]): RelationshipAnalysis[] {
    const relationships: RelationshipAnalysis[] = [];
    const sentences = doc.sentences().json();

    entities.forEach(entity1 => {
      entities.forEach(entity2 => {
        if (entity1.entity === entity2.entity) return;

        const relationship = this.findRelationshipBetweenEntities(
          entity1.entity,
          entity2.entity,
          sentences
        );

        if (relationship) {
          relationships.push(relationship);
        }
      });
    });

    return relationships.sort((a, b) => b.strength - a.strength);
  }

  /**
   * Calculate semantic density of content
   */
  private calculateSemanticDensity(
    topics: TopicAnalysis[],
    entities: EntityAnalysis[],
    concepts: ConceptAnalysis[]
  ): number {
    const totalSemanticElements = topics.length + entities.length + concepts.length;
    const weightedScore = (
      topics.reduce((sum, t) => sum + t.importance, 0) +
      entities.reduce((sum, e) => sum + e.confidence, 0) +
      concepts.reduce((sum, c) => sum + c.semanticWeight, 0)
    ) / 3;

    return Math.min(1, (totalSemanticElements / 50) * weightedScore);
  }

  /**
   * Calculate topical coherence
   */
  private calculateTopicalCoherence(topics: TopicAnalysis[], concepts: ConceptAnalysis[]): number {
    if (topics.length === 0) return 0;

    // Calculate how well topics relate to each other
    let coherenceSum = 0;
    let comparisons = 0;

    topics.forEach(topic1 => {
      topics.forEach(topic2 => {
        if (topic1.topic === topic2.topic) return;

        const relatedness = this.calculateTopicRelatedness(topic1, topic2, concepts);
        coherenceSum += relatedness;
        comparisons++;
      });
    });

    return comparisons > 0 ? coherenceSum / comparisons : 0;
  }

  /**
   * Extract main content themes
   */
  private extractContentThemes(topics: TopicAnalysis[], concepts: ConceptAnalysis[]): string[] {
    const themes: string[] = [];

    // Add top topics as themes
    themes.push(...topics.slice(0, 5).map(t => t.topic));

    // Add high-weight abstract concepts as themes
    const abstractConcepts = concepts
      .filter(c => c.abstractionLevel === 'abstract' && c.semanticWeight > 0.5)
      .slice(0, 3)
      .map(c => c.concept);

    themes.push(...abstractConcepts);

    return [...new Set(themes)]; // Remove duplicates
  }

  /**
   * Calculate similarity score between two analyses
   */
  private calculateSimilarityScore(analysis1: SemanticAnalysisResult, analysis2: SemanticAnalysisResult): number {
    const topicSimilarity = this.calculateTopicSimilarity(analysis1.topics, analysis2.topics);
    const entitySimilarity = this.calculateEntitySimilarity(analysis1.entities, analysis2.entities);
    const conceptSimilarity = this.calculateConceptSimilarity(analysis1.concepts, analysis2.concepts);
    const themeSimilarity = this.calculateThemeSimilarity(analysis1.contentThemes, analysis2.contentThemes);

    return (topicSimilarity * 0.3 + entitySimilarity * 0.25 + conceptSimilarity * 0.25 + themeSimilarity * 0.2);
  }

  /**
   * Compare topics between two analyses
   */
  private compareTopics(topics1: TopicAnalysis[], topics2: TopicAnalysis[]): {
    common: string[];
    unique1: string[];
    unique2: string[];
  } {
    const topicSet1 = new Set(topics1.map(t => t.topic.toLowerCase()));
    const topicSet2 = new Set(topics2.map(t => t.topic.toLowerCase()));

    const common = [...topicSet1].filter(topic => topicSet2.has(topic));
    const unique1 = [...topicSet1].filter(topic => !topicSet2.has(topic));
    const unique2 = [...topicSet2].filter(topic => !topicSet1.has(topic));

    return { common, unique1, unique2 };
  }

  /**
   * Calculate semantic overlap between two analyses
   */
  private calculateSemanticOverlap(analysis1: SemanticAnalysisResult, analysis2: SemanticAnalysisResult): number {
    const allTerms1 = new Set([
      ...analysis1.topics.map(t => t.topic),
      ...analysis1.entities.map(e => e.entity),
      ...analysis1.concepts.map(c => c.concept)
    ].map(term => term.toLowerCase()));

    const allTerms2 = new Set([
      ...analysis2.topics.map(t => t.topic),
      ...analysis2.entities.map(e => e.entity),
      ...analysis2.concepts.map(c => c.concept)
    ].map(term => term.toLowerCase()));

    const intersection = new Set([...allTerms1].filter(term => allTerms2.has(term)));
    const union = new Set([...allTerms1, ...allTerms2]);

    return intersection.size / union.size;
  }

  // Additional helper methods would be implemented here...
  private findRelatedTerms(topic: string, content: string): string[] {
    // Simplified implementation - would use more sophisticated semantic analysis
    const words = content.toLowerCase().split(/\s+/);
    const topicWords = topic.toLowerCase().split(/\s+/);

    return words.filter(word =>
      word.length > 3 &&
      !topicWords.includes(word) &&
      this.calculateWordSimilarity(word, topic) > 0.3
    ).slice(0, 5);
  }

  private extractTopicContext(topic: string, sentences: any[]): string[] {
    return sentences
      .filter((sentence: any) => sentence.text.toLowerCase().includes(topic.toLowerCase()))
      .map((sentence: any) => sentence.text)
      .slice(0, 3);
  }

  private calculateTopicImportance(topic: any, content: string): number {
    const frequency = topic.count;
    const position = content.toLowerCase().indexOf(topic.text.toLowerCase());
    const positionScore = position < content.length * 0.1 ? 1.2 : 1.0; // Bonus for early appearance

    return Math.min(1, (frequency / 10) * positionScore);
  }

  private extractEntityMentions(entity: string, content: string): EntityMention[] {
    const mentions: EntityMention[] = [];
    const regex = new RegExp(`\\b${entity.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    let match;

    while ((match = regex.exec(content)) !== null) {
      const position = match.index;
      const context = this.extractContext(content, position, 100);

      mentions.push({
        text: match[0],
        position,
        context
      });
    }

    return mentions;
  }

  private classifyEntity(entity: string, content: string): EntityAnalysis['type'] {
    // Simplified entity classification - would use more sophisticated NER in production
    const patterns = {
      person: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/,
      place: /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+(?:City|State|Country|Street|Avenue|Road))\b/i,
      organization: /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+(?:Inc|Corp|LLC|Ltd|Company|Organization))\b/i,
    };

    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(entity)) {
        return type as EntityAnalysis['type'];
      }
    }

    return 'other';
  }

  private calculateEntityConfidence(entity: any, mentions: EntityMention[]): number {
    const frequencyScore = Math.min(1, mentions.length / 5);
    const contextScore = mentions.reduce((sum, mention) => {
      return sum + (mention.context.split(/\s+/).length > 10 ? 1 : 0.5);
    }, 0) / mentions.length;

    return (frequencyScore * 0.6 + contextScore * 0.4);
  }

  private determineAbstractionLevel(concept: string, content: string): ConceptAnalysis['abstractionLevel'] {
    // Simplified abstraction level determination
    const technicalTerms = ['algorithm', 'system', 'process', 'method', 'technique', 'strategy'];
    const abstractTerms = ['concept', 'idea', 'principle', 'theory', 'philosophy', 'approach'];

    const conceptLower = concept.toLowerCase();

    if (technicalTerms.some(term => conceptLower.includes(term))) return 'technical';
    if (abstractTerms.some(term => conceptLower.includes(term))) return 'abstract';
    return 'concrete';
  }

  private calculateSemanticWeight(concept: string, content: string): number {
    const frequency = (content.toLowerCase().match(new RegExp(`\\b${concept.toLowerCase()}\\b`, 'g')) || []).length;
    const position = content.toLowerCase().indexOf(concept.toLowerCase());
    const positionScore = position < content.length * 0.2 ? 1.2 : 1.0;

    return Math.min(1, (frequency / 8) * positionScore);
  }

  private findAssociatedTerms(concept: string, content: string): string[] {
    // Find terms that frequently appear near this concept
    const sentences = content.split(/[.!?]+/);
    const associatedTerms: string[] = [];

    sentences.forEach(sentence => {
      if (sentence.toLowerCase().includes(concept.toLowerCase())) {
        const words = sentence.split(/\s+/).filter(word =>
          word.length > 3 &&
          word.toLowerCase() !== concept.toLowerCase()
        );
        associatedTerms.push(...words);
      }
    });

    // Count frequency and return top associated terms
    const termCounts = associatedTerms.reduce((counts, term) => {
      counts[term] = (counts[term] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    return Object.entries(termCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([term]) => term);
  }

  private findRelationshipBetweenEntities(
    entity1: string,
    entity2: string,
    sentences: any[]
  ): RelationshipAnalysis | null {
    const cooccurringSentences = sentences.filter((sentence: any) =>
      sentence.text.includes(entity1) && sentence.text.includes(entity2)
    );

    if (cooccurringSentences.length === 0) return null;

    const relationshipType = this.determineRelationshipType(entity1, entity2, cooccurringSentences);
    const strength = Math.min(1, cooccurringSentences.length / 3);
    const evidence = cooccurringSentences.map((s: any) => s.text).slice(0, 2);

    return {
      sourceEntity: entity1,
      targetEntity: entity2,
      relationshipType,
      strength,
      evidence
    };
  }

  private determineRelationshipType(
    entity1: string,
    entity2: string,
    sentences: any[]
  ): RelationshipAnalysis['relationshipType'] {
    // Simplified relationship type determination
    const sentenceText = sentences.map((s: any) => s.text).join(' ').toLowerCase();

    if (/\b(cause|lead|result|because|due to)\b/.test(sentenceText)) return 'causal';
    if (/\b(part of|belongs to|under|within)\b/.test(sentenceText)) return 'hierarchical';
    if (/\b(before|after|during|while|when)\b/.test(sentenceText)) return 'temporal';
    if (/\b(in|at|near|above|below)\b/.test(sentenceText)) return 'spatial';

    return 'associative';
  }

  private calculateTopicRelatedness(
    topic1: TopicAnalysis,
    topic2: TopicAnalysis,
    concepts: ConceptAnalysis[]
  ): number {
    // Calculate relatedness based on shared related terms and concepts
    const sharedTerms = topic1.relatedTerms.filter(term =>
      topic2.relatedTerms.includes(term)
    ).length;

    const maxTerms = Math.max(topic1.relatedTerms.length, topic2.relatedTerms.length);
    return maxTerms > 0 ? sharedTerms / maxTerms : 0;
  }

  private calculateTopicSimilarity(topics1: TopicAnalysis[], topics2: TopicAnalysis[]): number {
    const topicNames1 = topics1.map(t => t.topic.toLowerCase());
    const topicNames2 = topics2.map(t => t.topic.toLowerCase());

    const intersection = topicNames1.filter(topic => topicNames2.includes(topic));
    const union = [...new Set([...topicNames1, ...topicNames2])];

    return intersection.length / union.length;
  }

  private calculateEntitySimilarity(entities1: EntityAnalysis[], entities2: EntityAnalysis[]): number {
    const entityNames1 = entities1.map(e => e.entity.toLowerCase());
    const entityNames2 = entities2.map(e => e.entity.toLowerCase());

    const intersection = entityNames1.filter(entity => entityNames2.includes(entity));
    const union = [...new Set([...entityNames1, ...entityNames2])];

    return union.length > 0 ? intersection.length / union.length : 0;
  }

  private calculateConceptSimilarity(concepts1: ConceptAnalysis[], concepts2: ConceptAnalysis[]): number {
    const conceptNames1 = concepts1.map(c => c.concept.toLowerCase());
    const conceptNames2 = concepts2.map(c => c.concept.toLowerCase());

    const intersection = conceptNames1.filter(concept => conceptNames2.includes(concept));
    const union = [...new Set([...conceptNames1, ...conceptNames2])];

    return union.length > 0 ? intersection.length / union.length : 0;
  }

  private calculateThemeSimilarity(themes1: string[], themes2: string[]): number {
    const themeSet1 = new Set(themes1.map(t => t.toLowerCase()));
    const themeSet2 = new Set(themes2.map(t => t.toLowerCase()));

    const intersection = new Set([...themeSet1].filter(theme => themeSet2.has(theme)));
    const union = new Set([...themeSet1, ...themeSet2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private calculateConceptualDistance(concepts1: ConceptAnalysis[], concepts2: ConceptAnalysis[]): number {
    // Simplified conceptual distance calculation
    const avgAbstraction1 = this.calculateAverageAbstraction(concepts1);
    const avgAbstraction2 = this.calculateAverageAbstraction(concepts2);

    return Math.abs(avgAbstraction1 - avgAbstraction2);
  }

  private calculateAverageAbstraction(concepts: ConceptAnalysis[]): number {
    if (concepts.length === 0) return 0;

    const abstractionValues = concepts.map(c => {
      switch (c.abstractionLevel) {
        case 'concrete': return 1;
        case 'technical': return 2;
        case 'abstract': return 3;
        default: return 1;
      }
    });

    return abstractionValues.reduce((sum, val) => sum + val, 0) / abstractionValues.length;
  }

  private findLinkingOpportunities(
    analysis1: SemanticAnalysisResult,
    analysis2: SemanticAnalysisResult,
    content1: string,
    content2: string
  ): LinkingOpportunity[] {
    const opportunities: LinkingOpportunity[] = [];

    // Find shared concepts that could be linking opportunities
    const sharedTopics = analysis1.topics.filter(topic1 =>
      analysis2.topics.some(topic2 => topic2.topic.toLowerCase() === topic1.topic.toLowerCase())
    );

    sharedTopics.forEach(topic => {
      const sourceContext = this.extractContext(content1, content1.toLowerCase().indexOf(topic.topic.toLowerCase()), 200);
      const targetContext = this.extractContext(content2, content2.toLowerCase().indexOf(topic.topic.toLowerCase()), 200);

      const sharedConcepts = [topic.topic, ...topic.relatedTerms];
      const relevanceScore = topic.importance;
      const suggestedAnchorText = [topic.topic, ...topic.relatedTerms.slice(0, 2)];

      opportunities.push({
        sourceContext,
        targetContext,
        sharedConcepts,
        relevanceScore,
        suggestedAnchorText
      });
    });

    return opportunities.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  private findCommonThemes(themes1: string[], themes2: string[]): string[] {
    const themeSet1 = new Set(themes1.map(t => t.toLowerCase()));
    const themeSet2 = new Set(themes2.map(t => t.toLowerCase()));

    return [...themeSet1].filter(theme => themeSet2.has(theme));
  }

  private extractContext(content: string, position: number, contextLength: number): string {
    const start = Math.max(0, position - contextLength / 2);
    const end = Math.min(content.length, position + contextLength / 2);
    return content.substring(start, end);
  }

  private calculateWordSimilarity(word1: string, word2: string): number {
    // Simplified word similarity - would use more sophisticated methods in production
    const longer = word1.length > word2.length ? word1 : word2;
    const shorter = word1.length > word2.length ? word2 : word1;

    if (longer.includes(shorter)) return 0.8;

    // Simple character overlap
    const chars1 = new Set(word1.toLowerCase());
    const chars2 = new Set(word2.toLowerCase());
    const intersection = new Set([...chars1].filter(char => chars2.has(char)));
    const union = new Set([...chars1, ...chars2]);

    return intersection.size / union.size;
  }
}
