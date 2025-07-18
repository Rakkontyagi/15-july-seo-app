
import { SentenceTokenizer, WordTokenizer } from 'natural';
import * as compromise from 'compromise';

export interface Entity {
  name: string;
  type: 'PERSON' | 'ORGANIZATION' | 'LOCATION' | 'EVENT' | 'PRODUCT' | 'WORK_OF_ART' | 'OTHER';
  aliases: string[];
  relevance_score: number;
  authority_score: number;
  context_associations: string[];
}

export interface EntityUsage {
  entity: string;
  frequency: number;
  positions: number[];
  contexts: string[];
  prominence_score: number;
}

export interface EntityContext {
  sentence: string;
  position: number;
  contextual_relevance: number;
  integration_type: 'attribution' | 'reference' | 'citation' | 'mention';
}

export interface EntityIntegrationResult {
  originalContent: string;
  optimizedContent: string;
  entitiesIntegrated: number;
  entityCoverage: number;
  authority_enhancement: number;
  context_preservation: number;
  naturalness_score: number;
}

export interface CompetitorEntityAnalysis {
  entities: Entity[];
  usage_patterns: EntityUsage[];
  entity_density: number;
  authority_signals: number;
  context_strength: number;
}

export class EntityOptimizer {
  private readonly sentenceTokenizer = new SentenceTokenizer();
  private readonly wordTokenizer = new WordTokenizer();
  private readonly MIN_RELEVANCE_SCORE = 0.4;
  private readonly OPTIMAL_ENTITY_DENSITY = 0.02; // 2% of content

  /**
   * Optimize entity usage based on competitor patterns
   */
  optimizeEntityUsage(
    content: string, 
    entities: Entity[], 
    competitorUsage: EntityUsage[]
  ): EntityIntegrationResult {
    const originalContent = content;
    let optimizedContent = content;
    let integratedCount = 0;

    // Filter entities by relevance
    const relevantEntities = entities.filter(entity => 
      entity.relevance_score >= this.MIN_RELEVANCE_SCORE
    );

    // Sort by authority and relevance
    const sortedEntities = relevantEntities.sort((a, b) => 
      (b.authority_score * b.relevance_score) - (a.authority_score * a.relevance_score)
    );

    // Analyze current entity usage
    const currentUsage = this.analyzeCurrentEntityUsage(content, sortedEntities);

    // Integrate entities based on competitor patterns
    for (const entity of sortedEntities) {
      const optimalFrequency = this.calculateOptimalFrequency(entity, competitorUsage);
      const currentFrequency = currentUsage.get(entity.name) || 0;
      
      if (currentFrequency < optimalFrequency) {
        const integrationResult = this.integrateEntityNaturally(
          optimizedContent, 
          entity, 
          optimalFrequency - currentFrequency
        );
        
        optimizedContent = integrationResult.content;
        integratedCount += integrationResult.integratedCount;
      }
    }

    // Calculate metrics
    const entityCoverage = this.calculateEntityCoverage(optimizedContent, sortedEntities);
    const authorityEnhancement = this.calculateAuthorityEnhancement(originalContent, optimizedContent);
    const contextPreservation = this.calculateContextPreservation(originalContent, optimizedContent);
    const naturalnessScore = this.calculateNaturalnessScore(optimizedContent);

    return {
      originalContent,
      optimizedContent,
      entitiesIntegrated: integratedCount,
      entityCoverage,
      authority_enhancement: authorityEnhancement,
      context_preservation: contextPreservation,
      naturalness_score: naturalnessScore
    };
  }

  /**
   * Extract entities from competitor content
   */
  extractEntitiesFromContent(content: string): Entity[] {
    const doc = compromise(content);
    const entities: Entity[] = [];

    // Extract people
    const people = doc.match('#Person').out('array');
    people.forEach(person => {
      entities.push({
        name: person,
        type: 'PERSON',
        aliases: this.generateAliases(person),
        relevance_score: this.calculateRelevanceScore(content, person),
        authority_score: this.calculateAuthorityScore(content, person),
        context_associations: this.extractContextAssociations(content, person)
      });
    });

    // Extract organizations
    const organizations = doc.match('#Organization').out('array');
    organizations.forEach(org => {
      entities.push({
        name: org,
        type: 'ORGANIZATION',
        aliases: this.generateAliases(org),
        relevance_score: this.calculateRelevanceScore(content, org),
        authority_score: this.calculateAuthorityScore(content, org),
        context_associations: this.extractContextAssociations(content, org)
      });
    });

    // Extract locations
    const locations = doc.match('#Place').out('array');
    locations.forEach(location => {
      entities.push({
        name: location,
        type: 'LOCATION',
        aliases: this.generateAliases(location),
        relevance_score: this.calculateRelevanceScore(content, location),
        authority_score: this.calculateAuthorityScore(content, location),
        context_associations: this.extractContextAssociations(content, location)
      });
    });

    return entities.filter(entity => entity.relevance_score >= this.MIN_RELEVANCE_SCORE);
  }

  /**
   * Analyze competitor entity usage patterns
   */
  analyzeCompetitorEntityUsage(competitorContents: string[]): CompetitorEntityAnalysis {
    const allEntities: Map<string, Entity> = new Map();
    const allUsagePatterns: Map<string, EntityUsage> = new Map();

    for (const content of competitorContents) {
      const entities = this.extractEntitiesFromContent(content);
      const usagePatterns = this.analyzeEntityUsagePatterns(content, entities);

      // Aggregate entities
      entities.forEach(entity => {
        const existing = allEntities.get(entity.name);
        if (existing) {
          existing.relevance_score = Math.max(existing.relevance_score, entity.relevance_score);
          existing.authority_score = Math.max(existing.authority_score, entity.authority_score);
        } else {
          allEntities.set(entity.name, { ...entity });
        }
      });

      // Aggregate usage patterns
      usagePatterns.forEach(pattern => {
        const existing = allUsagePatterns.get(pattern.entity);
        if (existing) {
          existing.frequency += pattern.frequency;
          existing.positions.push(...pattern.positions);
          existing.contexts.push(...pattern.contexts);
          existing.prominence_score = Math.max(existing.prominence_score, pattern.prominence_score);
        } else {
          allUsagePatterns.set(pattern.entity, { ...pattern });
        }
      });
    }

    // Calculate aggregate metrics
    const totalWords = competitorContents.reduce((sum, content) => 
      sum + this.wordTokenizer.tokenize(content).length, 0
    );
    const totalEntities = Array.from(allUsagePatterns.values()).reduce((sum, pattern) => 
      sum + pattern.frequency, 0
    );
    const entityDensity = (totalEntities / totalWords) * 100;

    const authoritySignals = Array.from(allEntities.values()).reduce((sum, entity) => 
      sum + entity.authority_score, 0
    );

    const contextStrength = Array.from(allUsagePatterns.values()).reduce((sum, pattern) => 
      sum + pattern.prominence_score, 0
    ) / allUsagePatterns.size;

    return {
      entities: Array.from(allEntities.values()),
      usage_patterns: Array.from(allUsagePatterns.values()),
      entity_density: entityDensity,
      authority_signals: authoritySignals,
      context_strength: contextStrength
    };
  }

  /**
   * Calculate optimal frequency for entity based on competitor usage
   */
  private calculateOptimalFrequency(entity: Entity, competitorUsage: EntityUsage[]): number {
    const competitorEntity = competitorUsage.find(e => e.entity === entity.name);
    
    if (!competitorEntity) {
      // Base frequency on entity type and authority
      const baseFrequency = this.getBaseFrequencyForEntityType(entity.type);
      return Math.max(1, Math.round(baseFrequency * entity.authority_score));
    }

    // Adjust competitor frequency based on entity authority
    const adjustedFrequency = competitorEntity.frequency * (1 + entity.authority_score * 0.5);
    return Math.max(1, Math.round(adjustedFrequency));
  }

  /**
   * Get base frequency for entity type
   */
  private getBaseFrequencyForEntityType(type: Entity['type']): number {
    const baseFrequencies = {
      PERSON: 3,
      ORGANIZATION: 4,
      LOCATION: 2,
      EVENT: 2,
      PRODUCT: 3,
      WORK_OF_ART: 1,
      OTHER: 1
    };

    return baseFrequencies[type] || 1;
  }

  /**
   * Integrate entity naturally into content
   */
  private integrateEntityNaturally(
    content: string, 
    entity: Entity, 
    targetIntegrations: number
  ): { content: string; integratedCount: number } {
    let optimizedContent = content;
    let integratedCount = 0;

    // Find suitable integration contexts
    const integrationContexts = this.findIntegrationContexts(content, entity);

    // Integrate entity at the best contexts
    for (let i = 0; i < Math.min(targetIntegrations, integrationContexts.length); i++) {
      const context = integrationContexts[i];
      const integratedSentence = this.integrateEntityInContext(context, entity);
      
      optimizedContent = optimizedContent.replace(context.sentence, integratedSentence);
      integratedCount++;
    }

    return { content: optimizedContent, integratedCount };
  }

  /**
   * Find suitable integration contexts for entity
   */
  private findIntegrationContexts(content: string, entity: Entity): EntityContext[] {
    const sentences = this.sentenceTokenizer.tokenize(content);
    const contexts: EntityContext[] = [];

    sentences.forEach((sentence, index) => {
      // Skip sentences that already mention the entity
      if (this.containsEntity(sentence, entity)) {
        return;
      }

      // Calculate contextual relevance
      const contextualRelevance = this.calculateContextualRelevance(sentence, entity);
      
      if (contextualRelevance >= this.MIN_RELEVANCE_SCORE) {
        contexts.push({
          sentence,
          position: index,
          contextual_relevance: contextualRelevance,
          integration_type: this.determineIntegrationType(sentence, entity)
        });
      }
    });

    return contexts.sort((a, b) => b.contextual_relevance - a.contextual_relevance);
  }

  /**
   * Integrate entity into specific context
   */
  private integrateEntityInContext(context: EntityContext, entity: Entity): string {
    switch (context.integration_type) {
      case 'attribution':
        return this.integrateAsAttribution(context.sentence, entity);
      case 'reference':
        return this.integrateAsReference(context.sentence, entity);
      case 'citation':
        return this.integrateAsCitation(context.sentence, entity);
      case 'mention':
        return this.integrateAsMention(context.sentence, entity);
      default:
        return this.integrateAsMention(context.sentence, entity);
    }
  }

  /**
   * Integration methods for different types
   */
  private integrateAsAttribution(sentence: string, entity: Entity): string {
    switch (entity.type) {
      case 'PERSON':
        return sentence.replace(/\.$/, `, according to ${entity.name}.`);
      case 'ORGANIZATION':
        return sentence.replace(/\.$/, `, as reported by ${entity.name}.`);
      default:
        return sentence.replace(/\.$/, `, as noted by ${entity.name}.`);
    }
  }

  private integrateAsReference(sentence: string, entity: Entity): string {
    const words = sentence.split(' ');
    const insertIndex = Math.floor(words.length * 0.6);
    
    const before = words.slice(0, insertIndex).join(' ');
    const after = words.slice(insertIndex).join(' ');
    
    return `${before}, similar to ${entity.name}'s approach, ${after}`;
  }

  private integrateAsCitation(sentence: string, entity: Entity): string {
    return sentence.replace(/\.$/, ` (${entity.name}).`);
  }

  private integrateAsMention(sentence: string, entity: Entity): string {
    const words = sentence.split(' ');
    const insertIndex = Math.floor(words.length * 0.4);
    
    const before = words.slice(0, insertIndex).join(' ');
    const after = words.slice(insertIndex).join(' ');
    
    return `${before} ${entity.name} ${after}`;
  }

  /**
   * Helper methods
   */
  private analyzeCurrentEntityUsage(content: string, entities: Entity[]): Map<string, number> {
    const usage = new Map<string, number>();
    
    entities.forEach(entity => {
      const count = this.countEntityMentions(content, entity);
      usage.set(entity.name, count);
    });

    return usage;
  }

  private countEntityMentions(content: string, entity: Entity): number {
    let count = 0;
    const lowerContent = content.toLowerCase();
    
    // Count main name
    const mainNameRegex = new RegExp(`\\b${entity.name.toLowerCase()}\\b`, 'g');
    count += (lowerContent.match(mainNameRegex) || []).length;
    
    // Count aliases
    entity.aliases.forEach(alias => {
      const aliasRegex = new RegExp(`\\b${alias.toLowerCase()}\\b`, 'g');
      count += (lowerContent.match(aliasRegex) || []).length;
    });

    return count;
  }

  private containsEntity(sentence: string, entity: Entity): boolean {
    const lowerSentence = sentence.toLowerCase();
    
    if (lowerSentence.includes(entity.name.toLowerCase())) {
      return true;
    }
    
    return entity.aliases.some(alias => 
      lowerSentence.includes(alias.toLowerCase())
    );
  }

  private calculateContextualRelevance(sentence: string, entity: Entity): number {
    let relevance = 0;
    
    // Check for context associations
    entity.context_associations.forEach(association => {
      if (sentence.toLowerCase().includes(association.toLowerCase())) {
        relevance += 0.3;
      }
    });

    // Check sentence length and complexity
    const words = this.wordTokenizer.tokenize(sentence);
    const lengthScore = Math.min(1, words.length / 20);
    
    return Math.min(1, relevance + lengthScore * 0.4);
  }

  private determineIntegrationType(sentence: string, entity: Entity): EntityContext['integration_type'] {
    const lowerSentence = sentence.toLowerCase();
    
    if (lowerSentence.includes('according to') || lowerSentence.includes('reports')) {
      return 'attribution';
    }
    
    if (lowerSentence.includes('research') || lowerSentence.includes('study')) {
      return 'citation';
    }
    
    if (lowerSentence.includes('like') || lowerSentence.includes('similar')) {
      return 'reference';
    }
    
    return 'mention';
  }

  private generateAliases(entityName: string): string[] {
    const aliases: string[] = [];
    
    // Common alias patterns
    if (entityName.includes(' ')) {
      const words = entityName.split(' ');
      
      // Acronym
      const acronym = words.map(word => word.charAt(0).toUpperCase()).join('');
      if (acronym.length > 1) {
        aliases.push(acronym);
      }
      
      // First name only (for persons)
      if (words.length === 2) {
        aliases.push(words[0]);
      }
      
      // Last name only (for persons)
      if (words.length === 2) {
        aliases.push(words[1]);
      }
    }
    
    return aliases;
  }

  private calculateRelevanceScore(content: string, entityName: string): number {
    const mentions = this.countEntityMentions(content, { 
      name: entityName, 
      aliases: [], 
      type: 'OTHER' as const,
      relevance_score: 0,
      authority_score: 0,
      context_associations: []
    });
    
    const words = this.wordTokenizer.tokenize(content);
    const frequency = mentions / words.length;
    
    return Math.min(1, frequency * 100);
  }

  private calculateAuthorityScore(content: string, entityName: string): number {
    const lowerContent = content.toLowerCase();
    
    // Authority indicators
    const authorityKeywords = [
      'expert', 'authority', 'leader', 'pioneer', 'founder',
      'research', 'study', 'report', 'analysis', 'data'
    ];
    
    let score = 0.5; // Base score
    
    authorityKeywords.forEach(keyword => {
      if (lowerContent.includes(keyword)) {
        score += 0.1;
      }
    });
    
    return Math.min(1, score);
  }

  private extractContextAssociations(content: string, entityName: string): string[] {
    const associations: string[] = [];
    const sentences = this.sentenceTokenizer.tokenize(content);
    
    sentences.forEach(sentence => {
      if (sentence.toLowerCase().includes(entityName.toLowerCase())) {
        const words = this.wordTokenizer.tokenize(sentence);
        const importantWords = words.filter(word => 
          word.length > 3 && 
          !['the', 'and', 'or', 'but', 'with', 'for', 'from'].includes(word.toLowerCase())
        );
        
        associations.push(...importantWords);
      }
    });
    
    return [...new Set(associations)];
  }

  private analyzeEntityUsagePatterns(content: string, entities: Entity[]): EntityUsage[] {
    const patterns: EntityUsage[] = [];
    
    entities.forEach(entity => {
      const frequency = this.countEntityMentions(content, entity);
      
      if (frequency > 0) {
        patterns.push({
          entity: entity.name,
          frequency,
          positions: this.findEntityPositions(content, entity),
          contexts: this.extractEntityContexts(content, entity),
          prominence_score: this.calculateProminenceScore(content, entity)
        });
      }
    });
    
    return patterns;
  }

  private findEntityPositions(content: string, entity: Entity): number[] {
    const positions: number[] = [];
    const words = this.wordTokenizer.tokenize(content);
    
    words.forEach((word, index) => {
      if (word.toLowerCase() === entity.name.toLowerCase()) {
        positions.push(index);
      }
    });
    
    return positions;
  }

  private extractEntityContexts(content: string, entity: Entity): string[] {
    const contexts: string[] = [];
    const sentences = this.sentenceTokenizer.tokenize(content);
    
    sentences.forEach(sentence => {
      if (this.containsEntity(sentence, entity)) {
        contexts.push(sentence);
      }
    });
    
    return contexts;
  }

  private calculateProminenceScore(content: string, entity: Entity): number {
    const sentences = this.sentenceTokenizer.tokenize(content);
    let prominenceScore = 0;
    
    sentences.forEach((sentence, index) => {
      if (this.containsEntity(sentence, entity)) {
        // Earlier sentences have higher prominence
        const positionScore = (sentences.length - index) / sentences.length;
        prominenceScore += positionScore;
      }
    });
    
    return prominenceScore;
  }

  private calculateEntityCoverage(content: string, entities: Entity[]): number {
    let coveredEntities = 0;
    
    entities.forEach(entity => {
      if (this.containsEntity(content, entity)) {
        coveredEntities++;
      }
    });
    
    return (coveredEntities / entities.length) * 100;
  }

  private calculateAuthorityEnhancement(original: string, optimized: string): number {
    const originalAuthorityScore = this.calculateContentAuthorityScore(original);
    const optimizedAuthorityScore = this.calculateContentAuthorityScore(optimized);
    
    return ((optimizedAuthorityScore - originalAuthorityScore) / originalAuthorityScore) * 100;
  }

  private calculateContentAuthorityScore(content: string): number {
    const authorityKeywords = [
      'expert', 'authority', 'research', 'study', 'analysis',
      'data', 'report', 'findings', 'evidence', 'proven'
    ];
    
    let score = 0;
    const lowerContent = content.toLowerCase();
    
    authorityKeywords.forEach(keyword => {
      const matches = (lowerContent.match(new RegExp(`\\b${keyword}\\b`, 'g')) || []).length;
      score += matches;
    });
    
    return score;
  }

  private calculateContextPreservation(original: string, optimized: string): number {
    const originalWords = this.wordTokenizer.tokenize(original);
    const optimizedWords = this.wordTokenizer.tokenize(optimized);
    
    const originalSet = new Set(originalWords.map(w => w.toLowerCase()));
    const optimizedSet = new Set(optimizedWords.map(w => w.toLowerCase()));
    
    const intersection = new Set([...originalSet].filter(w => optimizedSet.has(w)));
    
    return (intersection.size / originalSet.size) * 100;
  }

  private calculateNaturalnessScore(content: string): number {
    const sentences = this.sentenceTokenizer.tokenize(content);
    const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(' ').length, 0) / sentences.length;
    
    const words = this.wordTokenizer.tokenize(content);
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    const lexicalDiversity = uniqueWords.size / words.length;
    
    // Combine factors
    const sentenceVariety = Math.min(1, avgSentenceLength / 20);
    const wordVariety = Math.min(1, lexicalDiversity * 2);
    
    return (sentenceVariety + wordVariety) * 50;
  }
}
