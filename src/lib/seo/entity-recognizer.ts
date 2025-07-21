/**
 * Entity Recognition System for SEO Automation App
 * Identifies and categorizes named entities for enhanced SEO analysis
 */

import { z } from 'zod';

export interface Entity {
  text: string;
  type: 'PERSON' | 'ORGANIZATION' | 'LOCATION' | 'PRODUCT' | 'EVENT' | 'DATE' | 'MONEY' | 'PERCENT' | 'MISC';
  confidence: number; // 0-100
  frequency: number;
  positions: number[];
  context: Array<{
    sentence: string;
    surrounding: string;
  }>;
  seoValue: number; // 0-100
  variations: string[];
}

export interface EntityRecognitionResult {
  entities: Entity[];
  entityTypes: {
    PERSON: Entity[];
    ORGANIZATION: Entity[];
    LOCATION: Entity[];
    PRODUCT: Entity[];
    EVENT: Entity[];
    DATE: Entity[];
    MONEY: Entity[];
    PERCENT: Entity[];
    MISC: Entity[];
  };
  statistics: {
    totalEntities: number;
    uniqueEntities: number;
    entityDensity: number; // entities per 100 words
    averageConfidence: number;
    topEntityTypes: Array<{ type: string; count: number }>;
  };
  seoAnalysis: {
    brandMentions: Entity[];
    competitorMentions: Entity[];
    locationRelevance: Entity[];
    authorityEntities: Entity[];
    recommendations: string[];
  };
}

export interface EntityRecognitionOptions {
  language?: string;
  minConfidence?: number;
  includeVariations?: boolean;
  contextWindow?: number;
  brandNames?: string[];
  competitorNames?: string[];
  industryTerms?: string[];
  customPatterns?: Array<{
    pattern: RegExp;
    type: Entity['type'];
    confidence: number;
  }>;
}

const DEFAULT_OPTIONS: Required<EntityRecognitionOptions> = {
  language: 'en',
  minConfidence: 60,
  includeVariations: true,
  contextWindow: 10,
  brandNames: [],
  competitorNames: [],
  industryTerms: [],
  customPatterns: [],
};

export class EntityRecognizer {
  private options: Required<EntityRecognitionOptions>;
  private patterns: Map<Entity['type'], RegExp[]>;

  constructor(options: EntityRecognitionOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.patterns = this.buildPatterns();
  }

  /**
   * Recognize entities in content
   */
  recognizeEntities(content: string): EntityRecognitionResult {
    const cleanContent = this.cleanContent(content);
    const words = cleanContent.split(/\s+/);
    const sentences = this.extractSentences(content);

    // Extract entities using different methods
    const patternEntities = this.extractPatternEntities(cleanContent, words);
    const namedEntities = this.extractNamedEntities(cleanContent, words);
    const customEntities = this.extractCustomEntities(cleanContent, words);

    // Combine and deduplicate entities
    const allEntities = [...patternEntities, ...namedEntities, ...customEntities];
    const entities = this.deduplicateEntities(allEntities);

    // Filter by confidence
    const filteredEntities = entities.filter(entity => 
      entity.confidence >= this.options.minConfidence
    );

    // Add context and variations
    const enrichedEntities = filteredEntities.map(entity => 
      this.enrichEntity(entity, content, sentences)
    );

    // Group by type
    const entityTypes = this.groupEntitiesByType(enrichedEntities);

    // Calculate statistics
    const statistics = this.calculateStatistics(enrichedEntities, words.length);

    // Perform SEO analysis
    const seoAnalysis = this.performSEOAnalysis(enrichedEntities);

    return {
      entities: enrichedEntities,
      entityTypes,
      statistics,
      seoAnalysis,
    };
  }

  /**
   * Clean content for processing
   */
  private cleanContent(content: string): string {
    return content
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Extract sentences from content
   */
  private extractSentences(content: string): string[] {
    return content
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  /**
   * Extract entities using pattern matching
   */
  private extractPatternEntities(content: string, words: string[]): Entity[] {
    const entities: Entity[] = [];

    this.patterns.forEach((patterns, type) => {
      patterns.forEach(pattern => {
        const matches = content.match(new RegExp(pattern.source, 'gi'));
        
        if (matches) {
          matches.forEach(match => {
            const positions = this.findTextPositions(match, words);
            
            entities.push({
              text: match,
              type,
              confidence: this.calculatePatternConfidence(match, type),
              frequency: positions.length,
              positions,
              context: [],
              seoValue: this.calculateSEOValue(match, type),
              variations: [],
            });
          });
        }
      });
    });

    return entities;
  }

  /**
   * Extract named entities using capitalization and context
   */
  private extractNamedEntities(content: string, words: string[]): Entity[] {
    const entities: Entity[] = [];
    const capitalizedWords = content.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];

    capitalizedWords.forEach(entity => {
      const type = this.classifyNamedEntity(entity, content);
      const confidence = this.calculateNamedEntityConfidence(entity, content);
      const positions = this.findTextPositions(entity, words);

      if (confidence >= this.options.minConfidence) {
        entities.push({
          text: entity,
          type,
          confidence,
          frequency: positions.length,
          positions,
          context: [],
          seoValue: this.calculateSEOValue(entity, type),
          variations: [],
        });
      }
    });

    return entities;
  }

  /**
   * Extract custom entities based on user-defined patterns
   */
  private extractCustomEntities(content: string, words: string[]): Entity[] {
    const entities: Entity[] = [];

    this.options.customPatterns.forEach(({ pattern, type, confidence }) => {
      const matches = content.match(new RegExp(pattern.source, 'gi'));
      
      if (matches) {
        matches.forEach(match => {
          const positions = this.findTextPositions(match, words);
          
          entities.push({
            text: match,
            type,
            confidence,
            frequency: positions.length,
            positions,
            context: [],
            seoValue: this.calculateSEOValue(match, type),
            variations: [],
          });
        });
      }
    });

    return entities;
  }

  /**
   * Deduplicate entities
   */
  private deduplicateEntities(entities: Entity[]): Entity[] {
    const entityMap = new Map<string, Entity>();

    entities.forEach(entity => {
      const key = entity.text.toLowerCase();
      const existing = entityMap.get(key);

      if (existing) {
        // Merge entities
        existing.frequency += entity.frequency;
        existing.positions.push(...entity.positions);
        existing.confidence = Math.max(existing.confidence, entity.confidence);
        existing.seoValue = Math.max(existing.seoValue, entity.seoValue);
      } else {
        entityMap.set(key, { ...entity });
      }
    });

    return Array.from(entityMap.values());
  }

  /**
   * Enrich entity with context and variations
   */
  private enrichEntity(entity: Entity, content: string, sentences: string[]): Entity {
    // Add context
    const context = this.extractEntityContext(entity.text, sentences);
    
    // Add variations if enabled
    const variations = this.options.includeVariations 
      ? this.generateEntityVariations(entity.text)
      : [];

    return {
      ...entity,
      context: context.slice(0, 3), // Limit to 3 contexts
      variations,
    };
  }

  /**
   * Extract context around entity occurrences
   */
  private extractEntityContext(entityText: string, sentences: string[]): Array<{ sentence: string; surrounding: string }> {
    const contexts: Array<{ sentence: string; surrounding: string }> = [];

    sentences.forEach(sentence => {
      if (sentence.toLowerCase().includes(entityText.toLowerCase())) {
        const words = sentence.split(' ');
        const entityIndex = words.findIndex(word => 
          sentence.toLowerCase().includes(entityText.toLowerCase())
        );

        if (entityIndex !== -1) {
          const start = Math.max(0, entityIndex - this.options.contextWindow);
          const end = Math.min(words.length, entityIndex + this.options.contextWindow);
          const surrounding = words.slice(start, end).join(' ');

          contexts.push({
            sentence: sentence.substring(0, 200) + (sentence.length > 200 ? '...' : ''),
            surrounding,
          });
        }
      }
    });

    return contexts;
  }

  /**
   * Generate entity variations
   */
  private generateEntityVariations(entityText: string): string[] {
    const variations: string[] = [];
    
    // Add acronym if multi-word
    const words = entityText.split(' ');
    if (words.length > 1) {
      const acronym = words.map(word => word.charAt(0).toUpperCase()).join('');
      if (acronym.length >= 2) {
        variations.push(acronym);
      }
    }

    // Add common variations
    variations.push(entityText.toLowerCase());
    variations.push(entityText.toUpperCase());
    
    // Add possessive forms
    variations.push(entityText + "'s");
    variations.push(entityText + "s");

    return [...new Set(variations)];
  }

  /**
   * Group entities by type
   */
  private groupEntitiesByType(entities: Entity[]): EntityRecognitionResult['entityTypes'] {
    const grouped: EntityRecognitionResult['entityTypes'] = {
      PERSON: [],
      ORGANIZATION: [],
      LOCATION: [],
      PRODUCT: [],
      EVENT: [],
      DATE: [],
      MONEY: [],
      PERCENT: [],
      MISC: [],
    };

    entities.forEach(entity => {
      grouped[entity.type].push(entity);
    });

    // Sort each group by SEO value
    Object.keys(grouped).forEach(type => {
      grouped[type as keyof typeof grouped].sort((a, b) => b.seoValue - a.seoValue);
    });

    return grouped;
  }

  /**
   * Calculate statistics
   */
  private calculateStatistics(entities: Entity[], wordCount: number) {
    const totalEntities = entities.reduce((sum, entity) => sum + entity.frequency, 0);
    const uniqueEntities = entities.length;
    const entityDensity = wordCount > 0 ? (totalEntities / wordCount) * 100 : 0;
    const averageConfidence = entities.length > 0 
      ? entities.reduce((sum, entity) => sum + entity.confidence, 0) / entities.length
      : 0;

    // Count by type
    const typeCounts = new Map<string, number>();
    entities.forEach(entity => {
      typeCounts.set(entity.type, (typeCounts.get(entity.type) || 0) + entity.frequency);
    });

    const topEntityTypes = Array.from(typeCounts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalEntities,
      uniqueEntities,
      entityDensity: Math.round(entityDensity * 100) / 100,
      averageConfidence: Math.round(averageConfidence),
      topEntityTypes,
    };
  }

  /**
   * Perform SEO analysis
   */
  private performSEOAnalysis(entities: Entity[]): EntityRecognitionResult['seoAnalysis'] {
    const brandMentions = entities.filter(entity => 
      this.options.brandNames.some(brand => 
        entity.text.toLowerCase().includes(brand.toLowerCase())
      )
    );

    const competitorMentions = entities.filter(entity => 
      this.options.competitorNames.some(competitor => 
        entity.text.toLowerCase().includes(competitor.toLowerCase())
      )
    );

    const locationRelevance = entities.filter(entity => entity.type === 'LOCATION');

    const authorityEntities = entities.filter(entity => 
      entity.seoValue >= 80 && 
      (entity.type === 'ORGANIZATION' || entity.type === 'PERSON')
    );

    const recommendations = this.generateSEORecommendations(
      entities,
      brandMentions,
      competitorMentions,
      locationRelevance,
      authorityEntities
    );

    return {
      brandMentions,
      competitorMentions,
      locationRelevance,
      authorityEntities,
      recommendations,
    };
  }

  /**
   * Generate SEO recommendations
   */
  private generateSEORecommendations(
    entities: Entity[],
    brandMentions: Entity[],
    competitorMentions: Entity[],
    locationRelevance: Entity[],
    authorityEntities: Entity[]
  ): string[] {
    const recommendations: string[] = [];

    if (brandMentions.length === 0) {
      recommendations.push('Consider mentioning your brand name for better brand recognition');
    }

    if (authorityEntities.length < 3) {
      recommendations.push('Include more authoritative entities (organizations, experts) to boost credibility');
    }

    if (locationRelevance.length === 0 && this.options.brandNames.length > 0) {
      recommendations.push('Add location-specific entities for local SEO benefits');
    }

    if (competitorMentions.length > brandMentions.length) {
      recommendations.push('Balance competitor mentions with your own brand mentions');
    }

    const highValueEntities = entities.filter(e => e.seoValue >= 70).length;
    if (highValueEntities < entities.length * 0.3) {
      recommendations.push('Focus on including more high-value entities relevant to your industry');
    }

    if (entities.length < 10) {
      recommendations.push('Increase entity diversity by mentioning more relevant people, organizations, and locations');
    }

    return recommendations;
  }

  /**
   * Find positions of text in word array
   */
  private findTextPositions(text: string, words: string[]): number[] {
    const positions: number[] = [];
    const textWords = text.toLowerCase().split(/\s+/);
    
    for (let i = 0; i <= words.length - textWords.length; i++) {
      const slice = words.slice(i, i + textWords.length).map(w => w.toLowerCase());
      if (slice.join(' ') === textWords.join(' ')) {
        positions.push(i);
      }
    }
    
    return positions;
  }

  /**
   * Classify named entity type
   */
  private classifyNamedEntity(entity: string, content: string): Entity['type'] {
    const lowerEntity = entity.toLowerCase();
    const context = content.toLowerCase();

    // Check against known lists
    if (this.options.brandNames.some(brand => lowerEntity.includes(brand.toLowerCase()))) {
      return 'ORGANIZATION';
    }

    if (this.options.competitorNames.some(comp => lowerEntity.includes(comp.toLowerCase()))) {
      return 'ORGANIZATION';
    }

    // Pattern-based classification
    if (this.isPersonName(entity, context)) return 'PERSON';
    if (this.isOrganization(entity, context)) return 'ORGANIZATION';
    if (this.isLocation(entity, context)) return 'LOCATION';
    if (this.isProduct(entity, context)) return 'PRODUCT';
    if (this.isEvent(entity, context)) return 'EVENT';

    return 'MISC';
  }

  /**
   * Check if entity is a person name
   */
  private isPersonName(entity: string, context: string): boolean {
    const personIndicators = ['mr', 'mrs', 'ms', 'dr', 'prof', 'ceo', 'founder', 'author', 'expert'];
    const words = entity.split(' ');
    
    // Check for title indicators
    const hasTitle = personIndicators.some(indicator => 
      context.includes(indicator + ' ' + entity.toLowerCase())
    );
    
    // Check for typical name patterns
    const isTypicalName = words.length >= 2 && words.length <= 4 && 
                         words.every(word => /^[A-Z][a-z]+$/.test(word));
    
    return hasTitle || isTypicalName;
  }

  /**
   * Check if entity is an organization
   */
  private isOrganization(entity: string, context: string): boolean {
    const orgSuffixes = ['inc', 'corp', 'ltd', 'llc', 'company', 'corporation', 'limited'];
    const orgIndicators = ['company', 'organization', 'business', 'firm', 'agency'];
    
    const hasOrgSuffix = orgSuffixes.some(suffix => 
      entity.toLowerCase().includes(suffix)
    );
    
    const hasOrgIndicator = orgIndicators.some(indicator => 
      context.includes(entity.toLowerCase() + ' ' + indicator) ||
      context.includes(indicator + ' ' + entity.toLowerCase())
    );
    
    return hasOrgSuffix || hasOrgIndicator;
  }

  /**
   * Check if entity is a location
   */
  private isLocation(entity: string, context: string): boolean {
    const locationIndicators = ['city', 'state', 'country', 'region', 'area', 'district', 'county'];
    const locationPrepositions = ['in', 'at', 'from', 'to', 'near'];
    
    const hasLocationIndicator = locationIndicators.some(indicator => 
      context.includes(entity.toLowerCase() + ' ' + indicator) ||
      context.includes(indicator + ' ' + entity.toLowerCase())
    );
    
    const hasLocationPreposition = locationPrepositions.some(prep => 
      context.includes(prep + ' ' + entity.toLowerCase())
    );
    
    return hasLocationIndicator || hasLocationPreposition;
  }

  /**
   * Check if entity is a product
   */
  private isProduct(entity: string, context: string): boolean {
    const productIndicators = ['product', 'software', 'app', 'tool', 'service', 'platform', 'system'];
    
    return productIndicators.some(indicator => 
      context.includes(entity.toLowerCase() + ' ' + indicator) ||
      context.includes(indicator + ' ' + entity.toLowerCase())
    );
  }

  /**
   * Check if entity is an event
   */
  private isEvent(entity: string, context: string): boolean {
    const eventIndicators = ['conference', 'summit', 'meeting', 'event', 'workshop', 'seminar'];
    
    return eventIndicators.some(indicator => 
      context.includes(entity.toLowerCase() + ' ' + indicator) ||
      context.includes(indicator + ' ' + entity.toLowerCase())
    );
  }

  /**
   * Calculate pattern confidence
   */
  private calculatePatternConfidence(match: string, type: Entity['type']): number {
    // Base confidence varies by type
    const baseConfidence = {
      'DATE': 90,
      'MONEY': 85,
      'PERCENT': 85,
      'PERSON': 70,
      'ORGANIZATION': 75,
      'LOCATION': 70,
      'PRODUCT': 65,
      'EVENT': 65,
      'MISC': 60,
    };

    return baseConfidence[type] || 60;
  }

  /**
   * Calculate named entity confidence
   */
  private calculateNamedEntityConfidence(entity: string, content: string): number {
    let confidence = 50; // Base confidence

    // Boost for capitalization pattern
    if (/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*$/.test(entity)) {
      confidence += 20;
    }

    // Boost for multiple occurrences
    const occurrences = (content.match(new RegExp(entity, 'gi')) || []).length;
    confidence += Math.min(20, occurrences * 5);

    // Boost for context indicators
    const contextBoost = this.calculateContextBoost(entity, content);
    confidence += contextBoost;

    return Math.min(100, confidence);
  }

  /**
   * Calculate context boost for entity confidence
   */
  private calculateContextBoost(entity: string, content: string): number {
    const indicators = [
      'according to', 'says', 'stated', 'announced', 'reported',
      'founded', 'created', 'developed', 'launched', 'based in'
    ];

    let boost = 0;
    indicators.forEach(indicator => {
      if (content.toLowerCase().includes(indicator + ' ' + entity.toLowerCase()) ||
          content.toLowerCase().includes(entity.toLowerCase() + ' ' + indicator)) {
        boost += 10;
      }
    });

    return Math.min(30, boost);
  }

  /**
   * Calculate SEO value of entity
   */
  private calculateSEOValue(entity: string, type: Entity['type']): number {
    let value = 50; // Base value

    // Type-based scoring
    const typeValues = {
      'ORGANIZATION': 80,
      'PERSON': 70,
      'LOCATION': 75,
      'PRODUCT': 85,
      'EVENT': 65,
      'DATE': 40,
      'MONEY': 50,
      'PERCENT': 45,
      'MISC': 40,
    };

    value = typeValues[type] || 40;

    // Boost for brand/competitor mentions
    if (this.options.brandNames.some(brand => 
        entity.toLowerCase().includes(brand.toLowerCase()))) {
      value += 20;
    }

    if (this.options.industryTerms.some(term => 
        entity.toLowerCase().includes(term.toLowerCase()))) {
      value += 15;
    }

    return Math.min(100, value);
  }

  /**
   * Build pattern map for entity recognition
   */
  private buildPatterns(): Map<Entity['type'], RegExp[]> {
    const patterns = new Map<Entity['type'], RegExp[]>();

    // Date patterns
    patterns.set('DATE', [
      /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,
      /\b\d{1,2}-\d{1,2}-\d{4}\b/g,
      /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/g,
      /\b\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/g,
    ]);

    // Money patterns
    patterns.set('MONEY', [
      /\$\d{1,3}(?:,\d{3})*(?:\.\d{2})?\b/g,
      /\b\d{1,3}(?:,\d{3})*(?:\.\d{2})?\s*(?:dollars?|USD|usd)\b/g,
      /\b(?:dollars?|USD|usd)\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?\b/g,
    ]);

    // Percentage patterns
    patterns.set('PERCENT', [
      /\b\d+(?:\.\d+)?%\b/g,
      /\b\d+(?:\.\d+)?\s*percent\b/g,
    ]);

    return patterns;
  }
}

// Factory function
export const createEntityRecognizer = (options?: EntityRecognitionOptions): EntityRecognizer => {
  return new EntityRecognizer(options);
};

// Default export
export default EntityRecognizer;
