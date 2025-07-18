
import { SentenceTokenizer, WordTokenizer } from 'natural';
import * as compromise from 'compromise';

export interface HeadingStructure {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
  position: number;
  hasKeyword: boolean;
  keywordDensity: number;
  semanticRelevance: number;
  readabilityScore: number;
}

export interface HeadingCounts {
  h1: number;
  h2: number;
  h3: number;
  h4: number;
  h5: number;
  h6: number;
}

export interface KeywordHeadingCounts {
  h1: number;
  h2: number;
  h3: number;
  h4: number;
  h5: number;
  h6: number;
}

export interface HeadingOptimizationResult {
  originalContent: string;
  optimizedContent: string;
  headingsOptimized: number;
  keywordIntegration: number;
  structureScore: number;
  readabilityScore: number;
  seoScore: number;
}

export interface CompetitorHeadingAnalysis {
  averageHeadingCounts: HeadingCounts;
  keywordHeadingCounts: KeywordHeadingCounts;
  headingStructures: HeadingStructure[];
  optimalDistribution: HeadingCounts;
  keywordIntegrationRate: number;
}

export class HeadingOptimizer {
  private readonly sentenceTokenizer = new SentenceTokenizer();
  private readonly wordTokenizer = new WordTokenizer();
  private readonly MIN_SEMANTIC_RELEVANCE = 0.3;
  private readonly OPTIMAL_HEADING_DENSITY = 0.05; // 5% of content should be headings

  /**
   * Count all headings in content (supports both HTML and Markdown)
   */
  countHeadings(content: string): HeadingCounts {
    const counts: HeadingCounts = { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0 };
    
    // HTML heading patterns
    const htmlPatterns = {
      h1: /<h1[^>]*>(.*?)<\/h1>/gi,
      h2: /<h2[^>]*>(.*?)<\/h2>/gi,
      h3: /<h3[^>]*>(.*?)<\/h3>/gi,
      h4: /<h4[^>]*>(.*?)<\/h4>/gi,
      h5: /<h5[^>]*>(.*?)<\/h5>/gi,
      h6: /<h6[^>]*>(.*?)<\/h6>/gi
    };

    // Markdown heading patterns
    const markdownPatterns = {
      h1: /^# .+$/gm,
      h2: /^## .+$/gm,
      h3: /^### .+$/gm,
      h4: /^#### .+$/gm,
      h5: /^##### .+$/gm,
      h6: /^###### .+$/gm
    };

    // Count HTML headings
    Object.keys(htmlPatterns).forEach(level => {
      const matches = content.match(htmlPatterns[level as keyof typeof htmlPatterns]);
      counts[level as keyof HeadingCounts] += matches ? matches.length : 0;
    });

    // Count Markdown headings
    Object.keys(markdownPatterns).forEach(level => {
      const matches = content.match(markdownPatterns[level as keyof typeof markdownPatterns]);
      counts[level as keyof HeadingCounts] += matches ? matches.length : 0;
    });

    return counts;
  }

  /**
   * Count headings that contain specific keywords
   */
  countKeywordHeadings(content: string, keyword: string): KeywordHeadingCounts {
    const keywordCounts: KeywordHeadingCounts = { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0 };
    const headings = this.extractHeadings(content);
    
    headings.forEach(heading => {
      if (heading.hasKeyword && heading.text.toLowerCase().includes(keyword.toLowerCase())) {
        keywordCounts[`h${heading.level}` as keyof KeywordHeadingCounts]++;
      }
    });

    return keywordCounts;
  }

  /**
   * Extract all headings with their details
   */
  extractHeadings(content: string): HeadingStructure[] {
    const headings: HeadingStructure[] = [];
    
    // Extract HTML headings
    const htmlHeadings = this.extractHTMLHeadings(content);
    headings.push(...htmlHeadings);

    // Extract Markdown headings
    const markdownHeadings = this.extractMarkdownHeadings(content);
    headings.push(...markdownHeadings);

    // Sort by position
    return headings.sort((a, b) => a.position - b.position);
  }

  /**
   * Analyze competitor heading patterns
   */
  analyzeCompetitorHeadings(competitorContents: string[], keyword: string): CompetitorHeadingAnalysis {
    const allHeadingCounts: HeadingCounts[] = [];
    const allKeywordHeadingCounts: KeywordHeadingCounts[] = [];
    const allHeadingStructures: HeadingStructure[] = [];

    // Analyze each competitor
    competitorContents.forEach(content => {
      const headingCounts = this.countHeadings(content);
      const keywordHeadingCounts = this.countKeywordHeadings(content, keyword);
      const headingStructures = this.extractHeadings(content);

      allHeadingCounts.push(headingCounts);
      allKeywordHeadingCounts.push(keywordHeadingCounts);
      allHeadingStructures.push(...headingStructures);
    });

    // Calculate averages
    const averageHeadingCounts = this.calculateAverageHeadingCounts(allHeadingCounts);
    const averageKeywordHeadingCounts = this.calculateAverageKeywordHeadingCounts(allKeywordHeadingCounts);

    // Calculate optimal distribution
    const optimalDistribution = this.calculateOptimalDistribution(averageHeadingCounts);

    // Calculate keyword integration rate
    const keywordIntegrationRate = this.calculateKeywordIntegrationRate(
      averageKeywordHeadingCounts,
      averageHeadingCounts
    );

    return {
      averageHeadingCounts,
      keywordHeadingCounts: averageKeywordHeadingCounts,
      headingStructures: allHeadingStructures,
      optimalDistribution,
      keywordIntegrationRate
    };
  }

  /**
   * Optimize headings based on competitor analysis
   */
  optimizeHeadings(
    content: string,
    keyword: string,
    targetCounts: HeadingCounts,
    targetKeywordCounts: KeywordHeadingCounts
  ): HeadingOptimizationResult {
    const originalContent = content;
    let optimizedContent = content;

    // Extract current headings
    const currentHeadings = this.extractHeadings(content);
    const currentCounts = this.countHeadings(content);
    const currentKeywordCounts = this.countKeywordHeadings(content, keyword);

    // Optimize heading structure
    const structureOptimization = this.optimizeHeadingStructure(
      optimizedContent,
      currentHeadings,
      targetCounts
    );
    optimizedContent = structureOptimization.content;

    // Optimize keyword integration
    const keywordOptimization = this.optimizeKeywordIntegration(
      optimizedContent,
      keyword,
      targetKeywordCounts,
      currentKeywordCounts
    );
    optimizedContent = keywordOptimization.content;

    // Calculate final scores
    const finalHeadings = this.extractHeadings(optimizedContent);
    const structureScore = this.calculateStructureScore(finalHeadings);
    const readabilityScore = this.calculateReadabilityScore(finalHeadings);
    const seoScore = this.calculateSEOScore(finalHeadings, keyword);

    return {
      originalContent,
      optimizedContent,
      headingsOptimized: structureOptimization.optimizedCount + keywordOptimization.optimizedCount,
      keywordIntegration: keywordOptimization.keywordIntegration,
      structureScore,
      readabilityScore,
      seoScore
    };
  }

  /**
   * Extract HTML headings
   */
  private extractHTMLHeadings(content: string): HeadingStructure[] {
    const headings: HeadingStructure[] = [];
    const htmlPattern = /<h([1-6])[^>]*>(.*?)<\/h[1-6]>/gi;
    let match;

    while ((match = htmlPattern.exec(content)) !== null) {
      const level = parseInt(match[1]) as 1 | 2 | 3 | 4 | 5 | 6;
      const text = match[2].replace(/<[^>]*>/g, '').trim();
      const position = match.index;

      headings.push({
        level,
        text,
        position,
        hasKeyword: false, // Will be set later
        keywordDensity: 0,
        semanticRelevance: this.calculateSemanticRelevance(text),
        readabilityScore: this.calculateHeadingReadability(text)
      });
    }

    return headings;
  }

  /**
   * Extract Markdown headings
   */
  private extractMarkdownHeadings(content: string): HeadingStructure[] {
    const headings: HeadingStructure[] = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const level = match[1].length as 1 | 2 | 3 | 4 | 5 | 6;
        const text = match[2].trim();
        const position = content.indexOf(line);

        headings.push({
          level,
          text,
          position,
          hasKeyword: false, // Will be set later
          keywordDensity: 0,
          semanticRelevance: this.calculateSemanticRelevance(text),
          readabilityScore: this.calculateHeadingReadability(text)
        });
      }
    });

    return headings;
  }

  /**
   * Optimize heading structure
   */
  private optimizeHeadingStructure(
    content: string,
    currentHeadings: HeadingStructure[],
    targetCounts: HeadingCounts
  ): { content: string; optimizedCount: number } {
    let optimizedContent = content;
    let optimizedCount = 0;

    // Calculate needed adjustments
    const currentCounts = this.countHeadings(content);
    const adjustments = this.calculateHeadingAdjustments(currentCounts, targetCounts);

    // Apply adjustments
    Object.entries(adjustments).forEach(([level, adjustment]) => {
      const headingLevel = parseInt(level.replace('h', '')) as 1 | 2 | 3 | 4 | 5 | 6;
      
      if (adjustment > 0) {
        // Need to add headings
        const addResult = this.addHeadings(optimizedContent, headingLevel, adjustment);
        optimizedContent = addResult.content;
        optimizedCount += addResult.addedCount;
      } else if (adjustment < 0) {
        // Need to remove headings
        const removeResult = this.removeHeadings(optimizedContent, headingLevel, Math.abs(adjustment));
        optimizedContent = removeResult.content;
        optimizedCount += removeResult.removedCount;
      }
    });

    return { content: optimizedContent, optimizedCount };
  }

  /**
   * Optimize keyword integration in headings
   */
  private optimizeKeywordIntegration(
    content: string,
    keyword: string,
    targetKeywordCounts: KeywordHeadingCounts,
    currentKeywordCounts: KeywordHeadingCounts
  ): { content: string; optimizedCount: number; keywordIntegration: number } {
    let optimizedContent = content;
    let optimizedCount = 0;
    let keywordIntegration = 0;

    // Calculate needed keyword integrations
    const keywordAdjustments = this.calculateKeywordAdjustments(currentKeywordCounts, targetKeywordCounts);

    // Apply keyword integrations
    Object.entries(keywordAdjustments).forEach(([level, adjustment]) => {
      const headingLevel = parseInt(level.replace('h', '')) as 1 | 2 | 3 | 4 | 5 | 6;
      
      if (adjustment > 0) {
        // Need to add keyword to headings
        const integrationResult = this.integrateKeywordInHeadings(
          optimizedContent,
          keyword,
          headingLevel,
          adjustment
        );
        optimizedContent = integrationResult.content;
        optimizedCount += integrationResult.integratedCount;
        keywordIntegration += integrationResult.keywordIntegration;
      }
    });

    return { content: optimizedContent, optimizedCount, keywordIntegration };
  }

  /**
   * Add headings to content
   */
  private addHeadings(content: string, level: number, count: number): { content: string; addedCount: number } {
    let optimizedContent = content;
    let addedCount = 0;

    // Find suitable locations for new headings
    const paragraphs = content.split('\n\n');
    const suitableLocations = this.findSuitableHeadingLocations(paragraphs, level);

    for (let i = 0; i < Math.min(count, suitableLocations.length); i++) {
      const location = suitableLocations[i];
      const headingText = this.generateHeadingText(location.paragraph, level);
      const headingMarkdown = '#'.repeat(level) + ' ' + headingText;
      
      optimizedContent = optimizedContent.replace(
        location.paragraph,
        headingMarkdown + '\n\n' + location.paragraph
      );
      addedCount++;
    }

    return { content: optimizedContent, addedCount };
  }

  /**
   * Remove headings from content
   */
  private removeHeadings(content: string, level: number, count: number): { content: string; removedCount: number } {
    let optimizedContent = content;
    let removedCount = 0;

    // Find headings to remove (prioritize lower quality ones)
    const headings = this.extractHeadings(content);
    const headingsToRemove = headings
      .filter(h => h.level === level)
      .sort((a, b) => a.semanticRelevance - b.semanticRelevance) // Remove lowest quality first
      .slice(0, count);

    headingsToRemove.forEach(heading => {
      // Remove heading but keep content
      const headingPattern = new RegExp(`^#{${heading.level}}\\s+${heading.text}$`, 'gm');
      optimizedContent = optimizedContent.replace(headingPattern, '');
      removedCount++;
    });

    return { content: optimizedContent, removedCount };
  }

  /**
   * Integrate keyword into headings
   */
  private integrateKeywordInHeadings(
    content: string,
    keyword: string,
    level: number,
    count: number
  ): { content: string; integratedCount: number; keywordIntegration: number } {
    let optimizedContent = content;
    let integratedCount = 0;
    let keywordIntegration = 0;

    // Find headings that don't contain the keyword
    const headings = this.extractHeadings(content);
    const candidateHeadings = headings
      .filter(h => h.level === level && !h.text.toLowerCase().includes(keyword.toLowerCase()))
      .sort((a, b) => b.semanticRelevance - a.semanticRelevance); // Integrate into highest quality first

    for (let i = 0; i < Math.min(count, candidateHeadings.length); i++) {
      const heading = candidateHeadings[i];
      const optimizedHeadingText = this.integrateKeywordInHeadingText(heading.text, keyword);
      
      // Replace the heading
      const originalPattern = new RegExp(`^#{${heading.level}}\\s+${this.escapeRegExp(heading.text)}$`, 'gm');
      const newHeading = '#'.repeat(heading.level) + ' ' + optimizedHeadingText;
      
      optimizedContent = optimizedContent.replace(originalPattern, newHeading);
      integratedCount++;
      keywordIntegration += this.calculateKeywordIntegrationScore(heading.text, optimizedHeadingText);
    }

    return { content: optimizedContent, integratedCount, keywordIntegration };
  }

  /**
   * Helper methods
   */
  private calculateAverageHeadingCounts(allCounts: HeadingCounts[]): HeadingCounts {
    const totals: HeadingCounts = { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0 };
    
    allCounts.forEach(counts => {
      Object.keys(totals).forEach(level => {
        totals[level as keyof HeadingCounts] += counts[level as keyof HeadingCounts];
      });
    });

    Object.keys(totals).forEach(level => {
      totals[level as keyof HeadingCounts] = Math.round(totals[level as keyof HeadingCounts] / allCounts.length);
    });

    return totals;
  }

  private calculateAverageKeywordHeadingCounts(allCounts: KeywordHeadingCounts[]): KeywordHeadingCounts {
    const totals: KeywordHeadingCounts = { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0 };
    
    allCounts.forEach(counts => {
      Object.keys(totals).forEach(level => {
        totals[level as keyof KeywordHeadingCounts] += counts[level as keyof KeywordHeadingCounts];
      });
    });

    Object.keys(totals).forEach(level => {
      totals[level as keyof KeywordHeadingCounts] = Math.round(totals[level as keyof KeywordHeadingCounts] / allCounts.length);
    });

    return totals;
  }

  private calculateOptimalDistribution(averageCounts: HeadingCounts): HeadingCounts {
    // Apply SEO best practices for heading distribution
    const total = Object.values(averageCounts).reduce((sum, count) => sum + count, 0);
    
    return {
      h1: Math.max(1, Math.round(total * 0.1)), // 10% should be H1
      h2: Math.max(1, Math.round(total * 0.3)), // 30% should be H2
      h3: Math.max(1, Math.round(total * 0.4)), // 40% should be H3
      h4: Math.max(0, Math.round(total * 0.15)), // 15% should be H4
      h5: Math.max(0, Math.round(total * 0.05)), // 5% should be H5
      h6: Math.max(0, Math.round(total * 0.0))   // 0% should be H6
    };
  }

  private calculateKeywordIntegrationRate(
    keywordCounts: KeywordHeadingCounts,
    totalCounts: HeadingCounts
  ): number {
    const totalKeywordHeadings = Object.values(keywordCounts).reduce((sum, count) => sum + count, 0);
    const totalHeadings = Object.values(totalCounts).reduce((sum, count) => sum + count, 0);
    
    return totalHeadings > 0 ? (totalKeywordHeadings / totalHeadings) * 100 : 0;
  }

  private calculateHeadingAdjustments(current: HeadingCounts, target: HeadingCounts): HeadingCounts {
    const adjustments: HeadingCounts = { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0 };
    
    Object.keys(adjustments).forEach(level => {
      adjustments[level as keyof HeadingCounts] = 
        target[level as keyof HeadingCounts] - current[level as keyof HeadingCounts];
    });

    return adjustments;
  }

  private calculateKeywordAdjustments(
    current: KeywordHeadingCounts,
    target: KeywordHeadingCounts
  ): KeywordHeadingCounts {
    const adjustments: KeywordHeadingCounts = { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0 };
    
    Object.keys(adjustments).forEach(level => {
      adjustments[level as keyof KeywordHeadingCounts] = 
        target[level as keyof KeywordHeadingCounts] - current[level as keyof KeywordHeadingCounts];
    });

    return adjustments;
  }

  private calculateSemanticRelevance(text: string): number {
    const doc = compromise(text);
    const words = this.wordTokenizer.tokenize(text);
    
    // Calculate based on meaningful words
    const meaningfulWords = words.filter(word => word.length > 3);
    const meaningfulRatio = meaningfulWords.length / words.length;
    
    // Check for action words and descriptive terms
    const actionWords = doc.match('#Verb').length;
    const descriptiveWords = doc.match('#Adjective').length;
    const actionDescriptiveRatio = (actionWords + descriptiveWords) / words.length;
    
    return Math.min(1, (meaningfulRatio + actionDescriptiveRatio) / 2);
  }

  private calculateHeadingReadability(text: string): number {
    const words = this.wordTokenizer.tokenize(text);
    const averageWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    
    // Optimal heading length is 6-8 words with average word length of 5-7 characters
    const lengthScore = Math.max(0, 1 - Math.abs(words.length - 7) / 7);
    const wordLengthScore = Math.max(0, 1 - Math.abs(averageWordLength - 6) / 6);
    
    return (lengthScore + wordLengthScore) / 2;
  }

  private findSuitableHeadingLocations(paragraphs: string[], level: number): Array<{ paragraph: string; score: number }> {
    const locations = paragraphs
      .filter(p => p.length > 100) // Only consider substantial paragraphs
      .map(paragraph => ({
        paragraph,
        score: this.calculateLocationScore(paragraph, level)
      }))
      .filter(location => location.score >= this.MIN_SEMANTIC_RELEVANCE)
      .sort((a, b) => b.score - a.score);

    return locations;
  }

  private calculateLocationScore(paragraph: string, level: number): number {
    const sentences = this.sentenceTokenizer.tokenize(paragraph);
    const firstSentence = sentences[0] || '';
    
    // Score based on first sentence quality and paragraph structure
    const firstSentenceScore = this.calculateSemanticRelevance(firstSentence);
    const paragraphLengthScore = Math.min(1, paragraph.length / 500);
    
    return (firstSentenceScore + paragraphLengthScore) / 2;
  }

  private generateHeadingText(paragraph: string, level: number): string {
    const sentences = this.sentenceTokenizer.tokenize(paragraph);
    const firstSentence = sentences[0] || '';
    
    // Extract key phrases from first sentence
    const doc = compromise(firstSentence);
    const keyPhrases = doc.match('#Noun+ #Adjective*').out('array');
    
    if (keyPhrases.length > 0) {
      return keyPhrases[0].substring(0, 60); // Limit to 60 characters
    }
    
    // Fallback to first few words
    const words = this.wordTokenizer.tokenize(firstSentence);
    return words.slice(0, 8).join(' ');
  }

  private integrateKeywordInHeadingText(headingText: string, keyword: string): string {
    const words = headingText.split(' ');
    
    // Try to integrate keyword naturally
    if (words.length >= 4) {
      const insertIndex = Math.floor(words.length / 2);
      words.splice(insertIndex, 0, keyword);
      return words.join(' ');
    }
    
    // Fallback: prepend keyword
    return `${keyword} ${headingText}`;
  }

  private calculateKeywordIntegrationScore(original: string, optimized: string): number {
    const originalWords = this.wordTokenizer.tokenize(original);
    const optimizedWords = this.wordTokenizer.tokenize(optimized);
    
    // Score based on natural integration (minimal word count increase)
    const wordIncrease = optimizedWords.length - originalWords.length;
    const integrationScore = Math.max(0, 1 - wordIncrease / originalWords.length);
    
    return integrationScore;
  }

  private calculateStructureScore(headings: HeadingStructure[]): number {
    if (headings.length === 0) return 0;
    
    // Check heading hierarchy
    let hierarchyScore = 0;
    let previousLevel = 0;
    
    headings.forEach(heading => {
      if (heading.level <= previousLevel + 1) {
        hierarchyScore += 1;
      }
      previousLevel = heading.level;
    });
    
    return (hierarchyScore / headings.length) * 100;
  }

  private calculateReadabilityScore(headings: HeadingStructure[]): number {
    if (headings.length === 0) return 0;
    
    const totalReadabilityScore = headings.reduce((sum, heading) => sum + heading.readabilityScore, 0);
    return (totalReadabilityScore / headings.length) * 100;
  }

  private calculateSEOScore(headings: HeadingStructure[], keyword: string): number {
    if (headings.length === 0) return 0;
    
    let keywordHeadings = 0;
    let totalScore = 0;
    
    headings.forEach(heading => {
      if (heading.text.toLowerCase().includes(keyword.toLowerCase())) {
        keywordHeadings += 1;
      }
      totalScore += heading.semanticRelevance;
    });
    
    const keywordIntegrationScore = (keywordHeadings / headings.length) * 100;
    const semanticScore = (totalScore / headings.length) * 100;
    
    return (keywordIntegrationScore + semanticScore) / 2;
  }

  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
