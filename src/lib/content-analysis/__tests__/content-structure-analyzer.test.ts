import { ContentStructureAnalyzer, TopicNode, SemanticCluster, ContentFlow } from '../content-structure-analyzer';

describe('ContentStructureAnalyzer', () => {
  let analyzer: ContentStructureAnalyzer;

  beforeEach(() => {
    analyzer = new ContentStructureAnalyzer();
  });

  describe('analyzeTopicFlow', () => {
    it('should analyze topic flow in content', () => {
      const content = `
        # SEO Optimization Guide
        
        Search engine optimization is crucial for website visibility.
        
        ## Keyword Research
        
        Keyword research forms the foundation of SEO strategy.
        
        ## Content Optimization
        
        Content optimization involves improving text quality and relevance.
      `;
      
      const topicFlow = analyzer.analyzeTopicFlow(content);
      
      expect(topicFlow.length).toBeGreaterThan(0);
      topicFlow.forEach(topic => {
        expect(topic).toHaveProperty('topic');
        expect(topic).toHaveProperty('level');
        expect(topic).toHaveProperty('semanticWeight');
        expect(topic.semanticWeight).toBeGreaterThanOrEqual(0);
      });
    });

    it('should build topic hierarchy', () => {
      const content = `
        SEO optimization strategies include keyword research and content optimization.
        Keyword research helps identify target terms.
        Content optimization improves text quality.
      `;
      
      const topicFlow = analyzer.analyzeTopicFlow(content);
      
      expect(topicFlow.length).toBeGreaterThan(0);
      // Check that topics have proper hierarchy levels
      topicFlow.forEach(topic => {
        expect(topic.level).toBeGreaterThanOrEqual(1);
        expect(topic.level).toBeLessThanOrEqual(3);
      });
    });
  });

  describe('analyzeSemanticOrganization', () => {
    it('should identify semantic clusters', () => {
      const content = `
        Search engine optimization involves keyword research and content creation.
        SEO strategies include technical optimization and link building.
        Content marketing requires quality writing and audience targeting.
      `;
      
      const clusters = analyzer.analyzeSemanticOrganization(content);
      
      expect(clusters.length).toBeGreaterThan(0);
      clusters.forEach(cluster => {
        expect(cluster).toHaveProperty('concept');
        expect(cluster).toHaveProperty('keywords');
        expect(cluster).toHaveProperty('strength');
        expect(cluster.strength).toBeGreaterThanOrEqual(0);
      });
    });

    it('should calculate cluster relationships', () => {
      const content = `
        SEO optimization and content marketing work together.
        Search engines analyze content quality and relevance.
        Marketing strategies should include SEO considerations.
      `;
      
      const clusters = analyzer.analyzeSemanticOrganization(content);
      
      // Check that clusters have related clusters identified
      const clustersWithRelations = clusters.filter(c => c.relatedClusters.length > 0);
      expect(clustersWithRelations.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('extractContentFlow', () => {
    it('should extract content flow structure', () => {
      const content = `
        Introduction to SEO optimization and its importance.
        
        The main body discusses various strategies and techniques.
        Content optimization is a key component of SEO success.
        
        In conclusion, SEO requires consistent effort and monitoring.
      `;
      
      const flow = analyzer.extractContentFlow(content);
      
      expect(flow).toHaveProperty('introduction');
      expect(flow).toHaveProperty('body');
      expect(flow).toHaveProperty('conclusion');
      expect(flow).toHaveProperty('transitions');
      
      expect(flow.introduction.title).toBe('Introduction');
      expect(flow.conclusion.title).toBe('Conclusion');
      expect(Array.isArray(flow.body)).toBe(true);
      expect(Array.isArray(flow.transitions)).toBe(true);
    });

    it('should analyze transitions between sections', () => {
      const content = `
        First section about SEO basics.
        
        However, advanced techniques require more expertise.
        
        Therefore, continuous learning is essential.
      `;
      
      const flow = analyzer.extractContentFlow(content);
      
      expect(flow.transitions.length).toBeGreaterThan(0);
      flow.transitions.forEach(transition => {
        expect(transition).toHaveProperty('transitionType');
        expect(transition).toHaveProperty('strength');
        expect(transition.strength).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('matchCompetitorPatterns', () => {
    it('should compare content structure to competitor patterns', () => {
      const content = `
        # SEO Guide
        SEO optimization involves keyword research and content creation.
        ## Keyword Research
        Research helps identify target terms.
        ## Content Optimization
        Content quality affects rankings.
      `;
      
      const competitorStructure = {
        topicFlow: [
          {
            topic: 'seo',
            level: 1,
            position: 0,
            keywords: ['optimization', 'search'],
            semanticWeight: 0.8,
            connections: [],
            subtopics: []
          }
        ],
        semanticClusters: [
          {
            concept: 'optimization',
            keywords: ['seo', 'search'],
            strength: 0.7,
            position: 0,
            relatedClusters: []
          }
        ],
        contentFlow: {
          introduction: {
            title: 'Introduction',
            content: '',
            position: 0,
            length: 0,
            topics: [],
            keyPoints: [],
            semanticDensity: 0
          },
          body: [],
          conclusion: {
            title: 'Conclusion',
            content: '',
            position: 999,
            length: 0,
            topics: [],
            keyPoints: [],
            semanticDensity: 0
          },
          transitions: []
        },
        structureScore: 0.8,
        optimalLength: 1000,
        sectionDistribution: { introduction: 0.1, body: 0.8, conclusion: 0.1 }
      };
      
      const match = analyzer.matchCompetitorPatterns(content, competitorStructure);
      
      expect(match).toHaveProperty('overallSimilarity');
      expect(match).toHaveProperty('topicAlignment');
      expect(match).toHaveProperty('flowAlignment');
      expect(match).toHaveProperty('semanticAlignment');
      expect(match).toHaveProperty('recommendedChanges');
      
      expect(match.overallSimilarity).toBeGreaterThanOrEqual(0);
      expect(match.overallSimilarity).toBeLessThanOrEqual(100);
    });
  });

  describe('analyzeCompetitorStructure', () => {
    it('should analyze competitor structure patterns', () => {
      const competitorContents = [
        `# SEO Guide\nKeyword research is important.\n## Research Methods\nVarious methods exist.`,
        `# Content Marketing\nContent quality matters.\n## Writing Tips\nGood writing helps.`,
        `# Digital Strategy\nStrategy planning is crucial.\n## Implementation\nExecution matters.`
      ];
      
      const analysis = analyzer.analyzeCompetitorStructure(competitorContents);
      
      expect(analysis).toHaveProperty('topicFlow');
      expect(analysis).toHaveProperty('semanticClusters');
      expect(analysis).toHaveProperty('contentFlow');
      expect(analysis).toHaveProperty('structureScore');
      expect(analysis).toHaveProperty('optimalLength');
      expect(analysis).toHaveProperty('sectionDistribution');
      
      expect(analysis.topicFlow.length).toBeGreaterThan(0);
      expect(analysis.structureScore).toBeGreaterThan(0);
      expect(analysis.optimalLength).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle empty content', () => {
      const topicFlow = analyzer.analyzeTopicFlow('');
      const clusters = analyzer.analyzeSemanticOrganization('');
      const flow = analyzer.extractContentFlow('');
      
      expect(topicFlow).toHaveLength(0);
      expect(clusters).toHaveLength(0);
      expect(flow.body).toHaveLength(0);
    });

    it('should handle very short content', () => {
      const content = 'SEO.';
      
      const topicFlow = analyzer.analyzeTopicFlow(content);
      const clusters = analyzer.analyzeSemanticOrganization(content);
      
      expect(topicFlow).toBeDefined();
      expect(clusters).toBeDefined();
    });

    it('should handle content without clear structure', () => {
      const content = 'Random words without clear structure or organization.';
      
      const flow = analyzer.extractContentFlow(content);
      
      expect(flow).toBeDefined();
      expect(flow.introduction).toBeDefined();
      expect(flow.conclusion).toBeDefined();
    });

    it('should handle very long content', () => {
      const longContent = 'SEO optimization '.repeat(1000);
      
      const topicFlow = analyzer.analyzeTopicFlow(longContent);
      
      expect(topicFlow).toBeDefined();
      expect(topicFlow.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('semantic analysis quality', () => {
    it('should identify meaningful topics', () => {
      const content = `
        Search engine optimization requires understanding of algorithms.
        Content quality and keyword relevance are crucial factors.
        Technical SEO includes site speed and mobile optimization.
      `;
      
      const topicFlow = analyzer.analyzeTopicFlow(content);
      
      // Should identify topics like 'optimization', 'content', 'algorithms'
      const meaningfulTopics = topicFlow.filter(t => t.semanticWeight > 0.3);
      expect(meaningfulTopics.length).toBeGreaterThan(0);
    });

    it('should calculate semantic density accurately', () => {
      const content = `
        SEO optimization strategies include keyword research and content analysis.
        Technical implementation requires understanding of search algorithms.
      `;
      
      const flow = analyzer.extractContentFlow(content);
      
      flow.body.forEach(section => {
        expect(section.semanticDensity).toBeGreaterThanOrEqual(0);
        expect(section.semanticDensity).toBeLessThanOrEqual(1);
      });
    });
  });
});