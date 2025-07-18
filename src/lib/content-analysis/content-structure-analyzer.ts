
import { SentenceTokenizer, WordTokenizer } from 'natural';
import * as compromise from 'compromise';

export interface TopicNode {
  topic: string;
  level: number;
  position: number;
  keywords: string[];
  semanticWeight: number;
  connections: string[];
  subtopics: TopicNode[];
}

export interface SemanticCluster {
  concept: string;
  keywords: string[];
  strength: number;
  position: number;
  relatedClusters: string[];
}

export interface ContentFlow {
  introduction: FlowSection;
  body: FlowSection[];
  conclusion: FlowSection;
  transitions: TransitionAnalysis[];
}

export interface FlowSection {
  title: string;
  content: string;
  position: number;
  length: number;
  topics: string[];
  keyPoints: string[];
  semanticDensity: number;
}

export interface TransitionAnalysis {
  fromSection: string;
  toSection: string;
  transitionType: 'sequential' | 'causal' | 'comparative' | 'contrasting' | 'explanatory';
  strength: number;
  keywords: string[];
}

export interface StructureMatch {
  overallSimilarity: number;
  topicAlignment: number;
  flowAlignment: number;
  semanticAlignment: number;
  recommendedChanges: string[];
}

export interface CompetitorStructurePattern {
  topicFlow: TopicNode[];
  semanticClusters: SemanticCluster[];
  contentFlow: ContentFlow;
  structureScore: number;
  optimalLength: number;
  sectionDistribution: { [key: string]: number };
}

export class ContentStructureAnalyzer {
  private readonly sentenceTokenizer = new SentenceTokenizer();
  private readonly wordTokenizer = new WordTokenizer();
  private readonly MIN_SEMANTIC_WEIGHT = 0.2;
  private readonly MIN_TOPIC_STRENGTH = 0.3;

  /**
   * Analyze topic flow and hierarchy in content
   */
  analyzeTopicFlow(content: string): TopicNode[] {
    const sections = this.extractSections(content);
    const topics: TopicNode[] = [];

    sections.forEach((section, index) => {
      const sectionTopics = this.extractTopicsFromSection(section, index);
      topics.push(...sectionTopics);
    });

    // Build topic hierarchy
    const hierarchicalTopics = this.buildTopicHierarchy(topics);

    // Calculate semantic connections
    this.calculateSemanticConnections(hierarchicalTopics);

    return hierarchicalTopics;
  }

  /**
   * Analyze semantic organization and clustering
   */
  analyzeSemanticOrganization(content: string): SemanticCluster[] {
    const sentences = this.sentenceTokenizer.tokenize(content);
    const concepts = this.extractConcepts(content);
    const clusters: SemanticCluster[] = [];

    // Group related concepts into clusters
    const conceptGroups = this.groupRelatedConcepts(concepts);

    conceptGroups.forEach((group, index) => {
      const cluster = this.buildSemanticCluster(group, sentences, index);
      if (cluster.strength >= this.MIN_SEMANTIC_WEIGHT) {
        clusters.push(cluster);
      }
    });

    // Calculate inter-cluster relationships
    this.calculateClusterRelationships(clusters);

    return clusters;
  }

  /**
   * Extract content flow structure
   */
  extractContentFlow(content: string): ContentFlow {
    const sections = this.extractSections(content);
    
    const introduction = this.analyzeIntroduction(sections[0] || '');
    const body = this.analyzeBodySections(sections.slice(1, -1));
    const conclusion = this.analyzeConclusion(sections[sections.length - 1] || '');
    const transitions = this.analyzeTransitions(sections);

    return {
      introduction,
      body,
      conclusion,
      transitions
    };
  }

  /**
   * Compare content structure to competitor patterns
   */
  matchCompetitorPatterns(content: string, competitorStructure: CompetitorStructurePattern): StructureMatch {
    const contentTopicFlow = this.analyzeTopicFlow(content);
    const contentSemanticClusters = this.analyzeSemanticOrganization(content);
    const contentFlow = this.extractContentFlow(content);

    // Calculate alignment scores
    const topicAlignment = this.calculateTopicAlignment(contentTopicFlow, competitorStructure.topicFlow);
    const flowAlignment = this.calculateFlowAlignment(contentFlow, competitorStructure.contentFlow);
    const semanticAlignment = this.calculateSemanticAlignment(contentSemanticClusters, competitorStructure.semanticClusters);

    const overallSimilarity = (topicAlignment + flowAlignment + semanticAlignment) / 3;
    const recommendedChanges = this.generateRecommendedChanges(
      contentTopicFlow,
      contentSemanticClusters,
      contentFlow,
      competitorStructure
    );

    return {
      overallSimilarity,
      topicAlignment,
      flowAlignment,
      semanticAlignment,
      recommendedChanges
    };
  }

  /**
   * Analyze competitor structure patterns
   */
  analyzeCompetitorStructure(competitorContents: string[]): CompetitorStructurePattern {
    const allTopicFlows: TopicNode[][] = [];
    const allSemanticClusters: SemanticCluster[][] = [];
    const allContentFlows: ContentFlow[] = [];

    // Analyze each competitor
    competitorContents.forEach(content => {
      const topicFlow = this.analyzeTopicFlow(content);
      const semanticClusters = this.analyzeSemanticOrganization(content);
      const contentFlow = this.extractContentFlow(content);

      allTopicFlows.push(topicFlow);
      allSemanticClusters.push(semanticClusters);
      allContentFlows.push(contentFlow);
    });

    // Calculate optimal patterns
    const optimalTopicFlow = this.calculateOptimalTopicFlow(allTopicFlows);
    const optimalSemanticClusters = this.calculateOptimalSemanticClusters(allSemanticClusters);
    const optimalContentFlow = this.calculateOptimalContentFlow(allContentFlows);

    // Calculate metrics
    const structureScore = this.calculateStructureScore(optimalTopicFlow, optimalSemanticClusters);
    const optimalLength = this.calculateOptimalLength(competitorContents);
    const sectionDistribution = this.calculateSectionDistribution(allContentFlows);

    return {
      topicFlow: optimalTopicFlow,
      semanticClusters: optimalSemanticClusters,
      contentFlow: optimalContentFlow,
      structureScore,
      optimalLength,
      sectionDistribution
    };
  }

  /**
   * Extract sections from content
   */
  private extractSections(content: string): string[] {
    // Split by headings and paragraphs
    const sections = content.split(/\n\n+/).filter(section => section.trim().length > 0);
    
    // Further split by headings
    const detailedSections: string[] = [];
    sections.forEach(section => {
      const headingSplit = section.split(/^#{1,6}\s/m);
      detailedSections.push(...headingSplit.filter(s => s.trim().length > 0));
    });

    return detailedSections;
  }

  /**
   * Extract topics from a section
   */
  private extractTopicsFromSection(section: string, position: number): TopicNode[] {
    const doc = compromise(section);
    const sentences = this.sentenceTokenizer.tokenize(section);
    const topics: TopicNode[] = [];

    // Extract main topics (nouns and noun phrases)
    const mainTopics = doc.match('#Noun+').out('array');
    
    mainTopics.forEach(topic => {
      const keywords = this.extractTopicKeywords(section, topic);
      const semanticWeight = this.calculateTopicWeight(section, topic);
      
      if (semanticWeight >= this.MIN_TOPIC_STRENGTH) {
        topics.push({
          topic: topic.toLowerCase(),
          level: this.determineTopicLevel(topic, section),
          position,
          keywords,
          semanticWeight,
          connections: [],
          subtopics: []
        });
      }
    });

    return topics;
  }

  /**
   * Build topic hierarchy
   */
  private buildTopicHierarchy(topics: TopicNode[]): TopicNode[] {
    const sortedTopics = topics.sort((a, b) => b.semanticWeight - a.semanticWeight);
    const hierarchy: TopicNode[] = [];

    sortedTopics.forEach(topic => {
      const parentTopic = this.findParentTopic(topic, hierarchy);
      
      if (parentTopic) {
        parentTopic.subtopics.push(topic);
        topic.level = parentTopic.level + 1;
      } else {
        hierarchy.push(topic);
      }
    });

    return hierarchy;
  }

  /**
   * Calculate semantic connections between topics
   */
  private calculateSemanticConnections(topics: TopicNode[]): void {
    topics.forEach(topic => {
      topics.forEach(otherTopic => {
        if (topic !== otherTopic) {
          const similarity = this.calculateTopicSimilarity(topic, otherTopic);
          if (similarity > 0.4) {
            topic.connections.push(otherTopic.topic);
          }
        }
      });
    });
  }

  /**
   * Extract concepts from content
   */
  private extractConcepts(content: string): string[] {
    const doc = compromise(content);
    const concepts: string[] = [];

    // Extract various types of concepts
    const people = doc.match('#Person').out('array');
    const places = doc.match('#Place').out('array');
    const organizations = doc.match('#Organization').out('array');
    const nouns = doc.match('#Noun').out('array');
    const adjectives = doc.match('#Adjective').out('array');

    concepts.push(...people, ...places, ...organizations, ...nouns, ...adjectives);

    // Filter and deduplicate
    return [...new Set(concepts.filter(concept => concept.length > 2))];
  }

  /**
   * Group related concepts
   */
  private groupRelatedConcepts(concepts: string[]): string[][] {
    const groups: string[][] = [];
    const used = new Set<string>();

    concepts.forEach(concept => {
      if (!used.has(concept)) {
        const group = [concept];
        used.add(concept);

        concepts.forEach(otherConcept => {
          if (!used.has(otherConcept)) {
            const similarity = this.calculateConceptSimilarity(concept, otherConcept);
            if (similarity > 0.3) {
              group.push(otherConcept);
              used.add(otherConcept);
            }
          }
        });

        if (group.length > 1) {
          groups.push(group);
        }
      }
    });

    return groups;
  }

  /**
   * Build semantic cluster
   */
  private buildSemanticCluster(conceptGroup: string[], sentences: string[], position: number): SemanticCluster {
    const concept = conceptGroup[0];
    const keywords = conceptGroup.slice(1);
    
    // Calculate cluster strength
    let strength = 0;
    sentences.forEach(sentence => {
      conceptGroup.forEach(term => {
        if (sentence.toLowerCase().includes(term.toLowerCase())) {
          strength += 0.1;
        }
      });
    });

    return {
      concept,
      keywords,
      strength: Math.min(1, strength),
      position,
      relatedClusters: []
    };
  }

  /**
   * Calculate cluster relationships
   */
  private calculateClusterRelationships(clusters: SemanticCluster[]): void {
    clusters.forEach(cluster => {
      clusters.forEach(otherCluster => {
        if (cluster !== otherCluster) {
          const similarity = this.calculateClusterSimilarity(cluster, otherCluster);
          if (similarity > 0.3) {
            cluster.relatedClusters.push(otherCluster.concept);
          }
        }
      });
    });
  }

  /**
   * Analyze introduction section
   */
  private analyzeIntroduction(content: string): FlowSection {
    const sentences = this.sentenceTokenizer.tokenize(content);
    const topics = this.extractTopicsFromText(content);
    const keyPoints = this.extractKeyPoints(content);

    return {
      title: 'Introduction',
      content: content.substring(0, 200) + '...',
      position: 0,
      length: content.length,
      topics,
      keyPoints,
      semanticDensity: this.calculateSemanticDensity(content)
    };
  }

  /**
   * Analyze body sections
   */
  private analyzeBodySections(sections: string[]): FlowSection[] {
    return sections.map((section, index) => {
      const topics = this.extractTopicsFromText(section);
      const keyPoints = this.extractKeyPoints(section);

      return {
        title: `Body Section ${index + 1}`,
        content: section.substring(0, 200) + '...',
        position: index + 1,
        length: section.length,
        topics,
        keyPoints,
        semanticDensity: this.calculateSemanticDensity(section)
      };
    });
  }

  /**
   * Analyze conclusion section
   */
  private analyzeConclusion(content: string): FlowSection {
    const topics = this.extractTopicsFromText(content);
    const keyPoints = this.extractKeyPoints(content);

    return {
      title: 'Conclusion',
      content: content.substring(0, 200) + '...',
      position: 999,
      length: content.length,
      topics,
      keyPoints,
      semanticDensity: this.calculateSemanticDensity(content)
    };
  }

  /**
   * Analyze transitions between sections
   */
  private analyzeTransitions(sections: string[]): TransitionAnalysis[] {
    const transitions: TransitionAnalysis[] = [];

    for (let i = 0; i < sections.length - 1; i++) {
      const fromSection = sections[i];
      const toSection = sections[i + 1];
      
      const transitionType = this.determineTransitionType(fromSection, toSection);
      const strength = this.calculateTransitionStrength(fromSection, toSection);
      const keywords = this.extractTransitionKeywords(fromSection, toSection);

      transitions.push({
        fromSection: `Section ${i + 1}`,
        toSection: `Section ${i + 2}`,
        transitionType,
        strength,
        keywords
      });
    }

    return transitions;
  }

  /**
   * Helper methods
   */
  private extractTopicKeywords(section: string, topic: string): string[] {
    const doc = compromise(section);
    const sentences = this.sentenceTokenizer.tokenize(section);
    const keywords: string[] = [];

    sentences.forEach(sentence => {
      if (sentence.toLowerCase().includes(topic.toLowerCase())) {
        const sentenceDoc = compromise(sentence);
        const adjectives = sentenceDoc.match('#Adjective').out('array');
        const verbs = sentenceDoc.match('#Verb').out('array');
        keywords.push(...adjectives, ...verbs);
      }
    });

    return [...new Set(keywords)];
  }

  private calculateTopicWeight(section: string, topic: string): number {
    const words = this.wordTokenizer.tokenize(section);
    const topicOccurrences = words.filter(word => 
      word.toLowerCase().includes(topic.toLowerCase())
    ).length;

    return Math.min(1, topicOccurrences / words.length * 10);
  }

  private determineTopicLevel(topic: string, section: string): number {
    // Simple heuristic: shorter topics are usually higher level
    const topicLength = topic.split(' ').length;
    if (topicLength === 1) return 1;
    if (topicLength === 2) return 2;
    return 3;
  }

  private findParentTopic(topic: TopicNode, hierarchy: TopicNode[]): TopicNode | null {
    for (const parent of hierarchy) {
      if (this.isSubtopic(topic, parent)) {
        return parent;
      }
    }
    return null;
  }

  private isSubtopic(child: TopicNode, parent: TopicNode): boolean {
    // Check if child topic is contained within parent topic
    return parent.topic.toLowerCase().includes(child.topic.toLowerCase()) ||
           child.keywords.some(keyword => parent.keywords.includes(keyword));
  }

  private calculateTopicSimilarity(topic1: TopicNode, topic2: TopicNode): number {
    const commonKeywords = topic1.keywords.filter(k => topic2.keywords.includes(k));
    const totalKeywords = [...new Set([...topic1.keywords, ...topic2.keywords])].length;
    
    return totalKeywords > 0 ? commonKeywords.length / totalKeywords : 0;
  }

  private calculateConceptSimilarity(concept1: string, concept2: string): number {
    const doc1 = compromise(concept1);
    const doc2 = compromise(concept2);
    
    // Simple similarity based on word overlap
    const words1 = concept1.toLowerCase().split(' ');
    const words2 = concept2.toLowerCase().split(' ');
    
    const commonWords = words1.filter(w => words2.includes(w));
    const totalWords = [...new Set([...words1, ...words2])].length;
    
    return totalWords > 0 ? commonWords.length / totalWords : 0;
  }

  private calculateClusterSimilarity(cluster1: SemanticCluster, cluster2: SemanticCluster): number {
    const allKeywords1 = [cluster1.concept, ...cluster1.keywords];
    const allKeywords2 = [cluster2.concept, ...cluster2.keywords];
    
    const commonKeywords = allKeywords1.filter(k => allKeywords2.includes(k));
    const totalKeywords = [...new Set([...allKeywords1, ...allKeywords2])].length;
    
    return totalKeywords > 0 ? commonKeywords.length / totalKeywords : 0;
  }

  private extractTopicsFromText(text: string): string[] {
    const doc = compromise(text);
    return doc.match('#Noun+').out('array').slice(0, 5);
  }

  private extractKeyPoints(text: string): string[] {
    const sentences = this.sentenceTokenizer.tokenize(text);
    return sentences.slice(0, 3).map(s => s.substring(0, 100) + '...');
  }

  private calculateSemanticDensity(text: string): number {
    const doc = compromise(text);
    const words = this.wordTokenizer.tokenize(text);
    const meaningfulWords = doc.match('#Noun|#Verb|#Adjective').out('array');
    
    return words.length > 0 ? meaningfulWords.length / words.length : 0;
  }

  private determineTransitionType(fromSection: string, toSection: string): TransitionAnalysis['transitionType'] {
    // Simple heuristic based on transition words
    const transitionWords = {
      sequential: ['first', 'next', 'then', 'finally', 'after'],
      causal: ['because', 'therefore', 'thus', 'consequently', 'as a result'],
      comparative: ['similarly', 'likewise', 'in the same way', 'compared to'],
      contrasting: ['however', 'but', 'on the other hand', 'conversely'],
      explanatory: ['for example', 'specifically', 'in particular', 'namely']
    };

    const combinedText = (fromSection + ' ' + toSection).toLowerCase();
    
    for (const [type, words] of Object.entries(transitionWords)) {
      if (words.some(word => combinedText.includes(word))) {
        return type as TransitionAnalysis['transitionType'];
      }
    }

    return 'sequential';
  }

  private calculateTransitionStrength(fromSection: string, toSection: string): number {
    const fromDoc = compromise(fromSection);
    const toDoc = compromise(toSection);
    
    const fromTopics = fromDoc.match('#Noun+').out('array');
    const toTopics = toDoc.match('#Noun+').out('array');
    
    const commonTopics = fromTopics.filter(t => toTopics.includes(t));
    const totalTopics = [...new Set([...fromTopics, ...toTopics])].length;
    
    return totalTopics > 0 ? commonTopics.length / totalTopics : 0;
  }

  private extractTransitionKeywords(fromSection: string, toSection: string): string[] {
    const fromDoc = compromise(fromSection);
    const toDoc = compromise(toSection);
    
    const fromKeywords = fromDoc.match('#Noun|#Adjective').out('array');
    const toKeywords = toDoc.match('#Noun|#Adjective').out('array');
    
    return fromKeywords.filter(k => toKeywords.includes(k));
  }

  private calculateTopicAlignment(contentTopics: TopicNode[], competitorTopics: TopicNode[]): number {
    let alignmentScore = 0;
    const totalTopics = Math.max(contentTopics.length, competitorTopics.length);
    
    contentTopics.forEach(topic => {
      const similarTopic = competitorTopics.find(ct => 
        this.calculateTopicSimilarity(topic, ct) > 0.3
      );
      if (similarTopic) {
        alignmentScore += 1;
      }
    });
    
    return totalTopics > 0 ? (alignmentScore / totalTopics) * 100 : 0;
  }

  private calculateFlowAlignment(contentFlow: ContentFlow, competitorFlow: ContentFlow): number {
    let alignmentScore = 0;
    
    // Compare section structure
    const contentSections = [contentFlow.introduction, ...contentFlow.body, contentFlow.conclusion];
    const competitorSections = [competitorFlow.introduction, ...competitorFlow.body, competitorFlow.conclusion];
    
    const minSections = Math.min(contentSections.length, competitorSections.length);
    
    for (let i = 0; i < minSections; i++) {
      const contentSection = contentSections[i];
      const competitorSection = competitorSections[i];
      
      const topicSimilarity = this.calculateSectionSimilarity(contentSection, competitorSection);
      alignmentScore += topicSimilarity;
    }
    
    return minSections > 0 ? (alignmentScore / minSections) * 100 : 0;
  }

  private calculateSemanticAlignment(contentClusters: SemanticCluster[], competitorClusters: SemanticCluster[]): number {
    let alignmentScore = 0;
    const totalClusters = Math.max(contentClusters.length, competitorClusters.length);
    
    contentClusters.forEach(cluster => {
      const similarCluster = competitorClusters.find(cc => 
        this.calculateClusterSimilarity(cluster, cc) > 0.3
      );
      if (similarCluster) {
        alignmentScore += 1;
      }
    });
    
    return totalClusters > 0 ? (alignmentScore / totalClusters) * 100 : 0;
  }

  private calculateSectionSimilarity(section1: FlowSection, section2: FlowSection): number {
    const commonTopics = section1.topics.filter(t => section2.topics.includes(t));
    const totalTopics = [...new Set([...section1.topics, ...section2.topics])].length;
    
    return totalTopics > 0 ? commonTopics.length / totalTopics : 0;
  }

  private generateRecommendedChanges(
    contentTopics: TopicNode[],
    contentClusters: SemanticCluster[],
    contentFlow: ContentFlow,
    competitorStructure: CompetitorStructurePattern
  ): string[] {
    const recommendations: string[] = [];

    // Topic recommendations
    const missingTopics = competitorStructure.topicFlow.filter(ct => 
      !contentTopics.some(topic => this.calculateTopicSimilarity(topic, ct) > 0.3)
    );
    
    if (missingTopics.length > 0) {
      recommendations.push(`Add missing topics: ${missingTopics.map(t => t.topic).join(', ')}`);
    }

    // Structure recommendations
    const contentSections = [contentFlow.introduction, ...contentFlow.body, contentFlow.conclusion];
    const competitorSections = [competitorStructure.contentFlow.introduction, ...competitorStructure.contentFlow.body, competitorStructure.contentFlow.conclusion];
    
    if (contentSections.length < competitorSections.length) {
      recommendations.push(`Consider adding ${competitorSections.length - contentSections.length} more sections`);
    }

    // Semantic recommendations
    const missingClusters = competitorStructure.semanticClusters.filter(cc => 
      !contentClusters.some(cluster => this.calculateClusterSimilarity(cluster, cc) > 0.3)
    );
    
    if (missingClusters.length > 0) {
      recommendations.push(`Strengthen semantic coverage in: ${missingClusters.map(c => c.concept).join(', ')}`);
    }

    return recommendations;
  }

  private calculateOptimalTopicFlow(allTopicFlows: TopicNode[][]): TopicNode[] {
    const topicFrequency = new Map<string, number>();
    const topicDetails = new Map<string, TopicNode>();
    
    // Aggregate topic data
    allTopicFlows.forEach(flow => {
      flow.forEach(topic => {
        const count = topicFrequency.get(topic.topic) || 0;
        topicFrequency.set(topic.topic, count + 1);
        
        if (!topicDetails.has(topic.topic) || topicDetails.get(topic.topic)!.semanticWeight < topic.semanticWeight) {
          topicDetails.set(topic.topic, topic);
        }
      });
    });

    // Return most frequent topics
    return Array.from(topicFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([topic]) => topicDetails.get(topic)!);
  }

  private calculateOptimalSemanticClusters(allSemanticClusters: SemanticCluster[][]): SemanticCluster[] {
    const clusterFrequency = new Map<string, number>();
    const clusterDetails = new Map<string, SemanticCluster>();
    
    // Aggregate cluster data
    allSemanticClusters.forEach(clusters => {
      clusters.forEach(cluster => {
        const count = clusterFrequency.get(cluster.concept) || 0;
        clusterFrequency.set(cluster.concept, count + 1);
        
        if (!clusterDetails.has(cluster.concept) || clusterDetails.get(cluster.concept)!.strength < cluster.strength) {
          clusterDetails.set(cluster.concept, cluster);
        }
      });
    });

    // Return most frequent clusters
    return Array.from(clusterFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([concept]) => clusterDetails.get(concept)!);
  }

  private calculateOptimalContentFlow(allContentFlows: ContentFlow[]): ContentFlow {
    // Calculate average flow structure
    const avgBodySections = Math.round(
      allContentFlows.reduce((sum, flow) => sum + flow.body.length, 0) / allContentFlows.length
    );

    return {
      introduction: allContentFlows[0].introduction,
      body: new Array(avgBodySections).fill(null).map((_, i) => ({
        title: `Optimal Body Section ${i + 1}`,
        content: '',
        position: i + 1,
        length: 0,
        topics: [],
        keyPoints: [],
        semanticDensity: 0
      })),
      conclusion: allContentFlows[0].conclusion,
      transitions: []
    };
  }

  private calculateStructureScore(topicFlow: TopicNode[], semanticClusters: SemanticCluster[]): number {
    const topicScore = topicFlow.reduce((sum, topic) => sum + topic.semanticWeight, 0);
    const clusterScore = semanticClusters.reduce((sum, cluster) => sum + cluster.strength, 0);
    
    return (topicScore + clusterScore) / 2;
  }

  private calculateOptimalLength(contents: string[]): number {
    const lengths = contents.map(content => this.wordTokenizer.tokenize(content).length);
    return Math.round(lengths.reduce((sum, len) => sum + len, 0) / lengths.length);
  }

  private calculateSectionDistribution(allContentFlows: ContentFlow[]): { [key: string]: number } {
    const distribution: { [key: string]: number } = {};
    
    allContentFlows.forEach(flow => {
      const totalLength = flow.introduction.length + 
                         flow.body.reduce((sum, section) => sum + section.length, 0) + 
                         flow.conclusion.length;
      
      distribution.introduction = (distribution.introduction || 0) + (flow.introduction.length / totalLength);
      distribution.body = (distribution.body || 0) + (flow.body.reduce((sum, section) => sum + section.length, 0) / totalLength);
      distribution.conclusion = (distribution.conclusion || 0) + (flow.conclusion.length / totalLength);
    });

    // Average the distributions
    Object.keys(distribution).forEach(key => {
      distribution[key] = distribution[key] / allContentFlows.length;
    });

    return distribution;
  }
}
