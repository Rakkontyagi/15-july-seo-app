import { EntityOptimizer, Entity, EntityUsage } from '../entity-optimizer';

describe('EntityOptimizer', () => {
  let optimizer: EntityOptimizer;

  beforeEach(() => {
    optimizer = new EntityOptimizer();
  });

  const mockEntities: Entity[] = [
    {
      name: 'Google',
      type: 'ORGANIZATION',
      aliases: ['Google Inc', 'Alphabet'],
      relevance_score: 0.9,
      authority_score: 0.95,
      context_associations: ['search', 'algorithm', 'SEO']
    },
    {
      name: 'John Smith',
      type: 'PERSON',
      aliases: ['J. Smith'],
      relevance_score: 0.7,
      authority_score: 0.8,
      context_associations: ['expert', 'consultant']
    }
  ];

  const mockCompetitorUsage: EntityUsage[] = [
    {
      entity: 'Google',
      frequency: 5,
      positions: [10, 25, 40, 55, 70],
      contexts: ['Google search algorithm', 'Google ranking factors'],
      prominence_score: 0.8
    }
  ];

  describe('optimizeEntityUsage', () => {
    it('should integrate entities based on competitor patterns', () => {
      const content = 'SEO strategies are important for search engine optimization success.';
      
      const result = optimizer.optimizeEntityUsage(content, mockEntities, mockCompetitorUsage);
      
      expect(result.entitiesIntegrated).toBeGreaterThan(0);
      expect(result.optimizedContent).toContain('Google');
      expect(result.entityCoverage).toBeGreaterThan(0);
    });

    it('should maintain content naturalness', () => {
      const content = 'Search engine optimization requires understanding of ranking factors.';
      
      const result = optimizer.optimizeEntityUsage(content, mockEntities, mockCompetitorUsage);
      
      expect(result.naturalness_score).toBeGreaterThan(0);
      expect(result.context_preservation).toBeGreaterThan(50);
    });

    it('should enhance authority through entity integration', () => {
      const content = 'SEO best practices help improve website visibility.';
      
      const result = optimizer.optimizeEntityUsage(content, mockEntities, mockCompetitorUsage);
      
      expect(result.authority_enhancement).toBeGreaterThanOrEqual(0);
    });
  });

  describe('extractEntitiesFromContent', () => {
    it('should extract entities from content', () => {
      const content = 'Google is a leading search engine company. John Smith is an SEO expert.';
      
      const entities = optimizer.extractEntitiesFromContent(content);
      
      expect(entities.length).toBeGreaterThan(0);
      expect(entities.some(e => e.name.includes('Google'))).toBe(true);
    });

    it('should filter entities by relevance score', () => {
      const content = 'Brief content with minimal entity mentions.';
      
      const entities = optimizer.extractEntitiesFromContent(content);
      
      // Should only return entities above minimum relevance threshold
      entities.forEach(entity => {
        expect(entity.relevance_score).toBeGreaterThanOrEqual(0.4);
      });
    });
  });

  describe('analyzeCompetitorEntityUsage', () => {
    it('should analyze competitor entity patterns', () => {
      const competitorContents = [
        'Google search algorithm updates affect SEO rankings.',
        'Microsoft Bing also provides search engine services.',
        'Google Analytics helps track website performance.'
      ];
      
      const analysis = optimizer.analyzeCompetitorEntityUsage(competitorContents);
      
      expect(analysis.entities.length).toBeGreaterThan(0);
      expect(analysis.usage_patterns.length).toBeGreaterThan(0);
      expect(analysis.entity_density).toBeGreaterThan(0);
      expect(analysis.authority_signals).toBeGreaterThan(0);
    });

    it('should calculate entity density correctly', () => {
      const competitorContents = [
        'Google SEO optimization',
        'Microsoft search engine'
      ];
      
      const analysis = optimizer.analyzeCompetitorEntityUsage(competitorContents);
      
      expect(analysis.entity_density).toBeGreaterThan(0);
      expect(analysis.entity_density).toBeLessThanOrEqual(100);
    });
  });

  describe('entity types', () => {
    it('should handle PERSON entities correctly', () => {
      const personEntity: Entity = {
        name: 'Matt Cutts',
        type: 'PERSON',
        aliases: ['Matthew Cutts'],
        relevance_score: 0.8,
        authority_score: 0.9,
        context_associations: ['Google', 'SEO', 'webmaster']
      };
      
      const content = 'SEO guidelines are important for website optimization.';
      const result = optimizer.optimizeEntityUsage(content, [personEntity], []);
      
      expect(result.optimizedContent).toContain('Matt Cutts');
    });

    it('should handle ORGANIZATION entities correctly', () => {
      const orgEntity: Entity = {
        name: 'Moz',
        type: 'ORGANIZATION',
        aliases: ['SEOMoz'],
        relevance_score: 0.8,
        authority_score: 0.85,
        context_associations: ['SEO', 'tools', 'research']
      };
      
      const content = 'SEO tools help analyze website performance.';
      const result = optimizer.optimizeEntityUsage(content, [orgEntity], []);
      
      expect(result.optimizedContent).toContain('Moz');
    });

    it('should handle LOCATION entities correctly', () => {
      const locationEntity: Entity = {
        name: 'Silicon Valley',
        type: 'LOCATION',
        aliases: ['SV'],
        relevance_score: 0.7,
        authority_score: 0.8,
        context_associations: ['tech', 'companies', 'innovation']
      };
      
      const content = 'Technology companies focus on innovation and growth.';
      const result = optimizer.optimizeEntityUsage(content, [locationEntity], []);
      
      expect(result.optimizedContent).toContain('Silicon Valley');
    });
  });

  describe('edge cases', () => {
    it('should handle empty content', () => {
      const result = optimizer.optimizeEntityUsage('', mockEntities, mockCompetitorUsage);
      
      expect(result.entitiesIntegrated).toBe(0);
      expect(result.entityCoverage).toBe(0);
    });

    it('should handle empty entities array', () => {
      const content = 'Sample content for testing.';
      
      const result = optimizer.optimizeEntityUsage(content, [], mockCompetitorUsage);
      
      expect(result.entitiesIntegrated).toBe(0);
      expect(result.optimizedContent).toBe(content);
    });

    it('should handle content already containing entities', () => {
      const content = 'Google search algorithm is complex and Google updates it regularly.';
      
      const result = optimizer.optimizeEntityUsage(content, mockEntities, mockCompetitorUsage);
      
      expect(result.entityCoverage).toBeGreaterThan(0);
    });

    it('should handle very long entity names', () => {
      const longNameEntity: Entity = {
        name: 'Very Long Organization Name That Exceeds Normal Length',
        type: 'ORGANIZATION',
        aliases: ['VLONTTENL'],
        relevance_score: 0.6,
        authority_score: 0.7,
        context_associations: ['business', 'enterprise']
      };
      
      const content = 'Business enterprises require proper optimization strategies.';
      const result = optimizer.optimizeEntityUsage(content, [longNameEntity], []);
      
      expect(result.optimizedContent).toBeDefined();
    });
  });

  describe('integration quality', () => {
    it('should maintain high context preservation', () => {
      const content = 'Search engine optimization best practices include keyword research.';
      
      const result = optimizer.optimizeEntityUsage(content, mockEntities, mockCompetitorUsage);
      
      expect(result.context_preservation).toBeGreaterThan(80);
    });

    it('should achieve good entity coverage', () => {
      const content = 'SEO strategies and search engine algorithms are constantly evolving.';
      
      const result = optimizer.optimizeEntityUsage(content, mockEntities, mockCompetitorUsage);
      
      expect(result.entityCoverage).toBeGreaterThan(0);
      expect(result.entityCoverage).toBeLessThanOrEqual(100);
    });
  });
});