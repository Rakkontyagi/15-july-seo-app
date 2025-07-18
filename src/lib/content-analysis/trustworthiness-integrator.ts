
export interface TrustworthinessResult {
  enhancedContent: string;
  trustScore: number;
  elements: {
    transparencyMarkers: number;
    balancedPerspectives: number;
    limitations: number;
    honestyIndicators: number;
  };
  improvements: string[];
}

export interface Perspective {
  viewpoint: string;
  reasoning: string;
  weight: 'primary' | 'alternative' | 'contrarian';
}

export interface Limitation {
  aspect: string;
  description: string;
  impact: 'minor' | 'moderate' | 'significant';
}

export class TrustworthinessIntegrator {
  private readonly transparencyPhrases = [
    'To be transparent',
    'In full disclosure',
    'It\'s important to note',
    'For complete clarity',
    'To provide full context',
    'In the interest of transparency',
    'Full disclosure',
    'To be completely honest'
  ];

  private readonly balancePhrases = [
    'On the other hand',
    'However, it\'s worth considering',
    'Alternative perspectives suggest',
    'Another viewpoint is',
    'Conversely',
    'From a different angle',
    'It\'s also important to consider',
    'Different schools of thought'
  ];

  private readonly limitationPhrases = [
    'It\'s important to acknowledge',
    'One limitation is',
    'Keep in mind that',
    'This approach may not',
    'Potential constraints include',
    'It should be noted that',
    'Consider the following limitations',
    'Areas for consideration include'
  ];

  private readonly honestyMarkers = [
    'honestly', 'truthfully', 'genuinely', 'sincerely',
    'frankly', 'candidly', 'openly', 'authentically'
  ];

  integrateTrustworthiness(
    content: string,
    transparencyStatements?: string[],
    perspectives?: Perspective[],
    limitations?: Limitation[]
  ): TrustworthinessResult {
    let enhancedContent = content;
    const elements = {
      transparencyMarkers: 0,
      balancedPerspectives: 0,
      limitations: 0,
      honestyIndicators: 0
    };

    // Add transparency statements
    if (transparencyStatements && transparencyStatements.length > 0) {
      const result = this.addTransparency(enhancedContent, transparencyStatements);
      enhancedContent = result.content;
      elements.transparencyMarkers = result.count;
    }

    // Add balanced perspectives
    if (perspectives && perspectives.length > 0) {
      const result = this.addBalancedPerspectives(enhancedContent, perspectives);
      enhancedContent = result.content;
      elements.balancedPerspectives = result.count;
    }

    // Acknowledge limitations
    if (limitations && limitations.length > 0) {
      const result = this.acknowledgeLimitations(enhancedContent, limitations);
      enhancedContent = result.content;
      elements.limitations = result.count;
    }

    // Add honesty indicators
    const honestyResult = this.addHonestyIndicators(enhancedContent);
    enhancedContent = honestyResult.content;
    elements.honestyIndicators = honestyResult.count;

    // Calculate trust score
    const trustScore = this.calculateTrustScore(enhancedContent, elements);

    // Generate improvement suggestions
    const improvements = this.generateTrustImprovements(content, elements);

    return {
      enhancedContent,
      trustScore,
      elements,
      improvements
    };
  }

  addTransparency(content: string, transparencyStatements: string[]): { content: string; count: number } {
    const paragraphs = content.split(/\n\n/);
    let count = 0;
    const enhancedParagraphs = [...paragraphs];

    // Add transparency statements at key positions
    transparencyStatements.forEach((statement, index) => {
      const position = this.getTransparencyPosition(paragraphs.length, index);
      
      if (position < paragraphs.length) {
        const phrase = this.transparencyPhrases[index % this.transparencyPhrases.length];
        const transparentStatement = `${phrase}, ${statement.toLowerCase()}.`;
        
        // Insert as a new sentence at the beginning of the paragraph
        enhancedParagraphs[position] = `${transparentStatement} ${enhancedParagraphs[position]}`;
        count++;
      }
    });

    return { content: enhancedParagraphs.join('\n\n'), count };
  }

  addBalancedPerspectives(content: string, perspectives: Perspective[]): { content: string; count: number } {
    const sentences = content.split(/(?<=[.!?])\s+/);
    let count = 0;
    const enhancedSentences = [...sentences];

    // Sort perspectives by weight
    const sortedPerspectives = perspectives.sort((a, b) => {
      const weightOrder = { primary: 0, alternative: 1, contrarian: 2 };
      return weightOrder[a.weight] - weightOrder[b.weight];
    });

    // Insert perspectives throughout the content
    sortedPerspectives.forEach((perspective, index) => {
      const position = this.getBalancedPosition(sentences.length, index, perspectives.length);
      
      if (position < sentences.length) {
        const phrase = this.balancePhrases[index % this.balancePhrases.length];
        const perspectiveStatement = `${phrase}, ${perspective.viewpoint.toLowerCase()}. ${perspective.reasoning}`;
        
        // Insert after the target sentence
        enhancedSentences.splice(position + 1 + count, 0, perspectiveStatement);
        count++;
      }
    });

    return { content: enhancedSentences.join(' '), count };
  }

  acknowledgeLimitations(content: string, limitations: Limitation[]): { content: string; count: number } {
    let enhancedContent = content;
    let count = 0;

    // Group limitations by impact
    const significantLimitations = limitations.filter(l => l.impact === 'significant');
    const moderateLimitations = limitations.filter(l => l.impact === 'moderate');
    const minorLimitations = limitations.filter(l => l.impact === 'minor');

    // Add limitations section if there are significant ones
    if (significantLimitations.length > 0 || moderateLimitations.length > 1) {
      const limitationsSection = this.createLimitationsSection([
        ...significantLimitations,
        ...moderateLimitations
      ]);
      
      // Add before conclusion or at 80% mark
      const sentences = enhancedContent.split(/(?<=[.!?])\s+/);
      const insertPosition = Math.floor(sentences.length * 0.8);
      
      sentences.splice(insertPosition, 0, limitationsSection);
      enhancedContent = sentences.join(' ');
      count = significantLimitations.length + moderateLimitations.length;
    } else if (limitations.length > 0) {
      // Sprinkle minor limitations throughout
      const sentences = enhancedContent.split(/(?<=[.!?])\s+/);
      
      limitations.slice(0, 2).forEach((limitation, index) => {
        const position = Math.floor((index + 1) * sentences.length / 3);
        const phrase = this.limitationPhrases[index % this.limitationPhrases.length];
        const limitStatement = `${phrase} ${limitation.description.toLowerCase()}.`;
        
        sentences.splice(position + index, 0, limitStatement);
        count++;
      });
      
      enhancedContent = sentences.join(' ');
    }

    return { content: enhancedContent, count };
  }

  private addHonestyIndicators(content: string): { content: string; count: number } {
    const sentences = content.split(/(?<=[.!?])\s+/);
    let count = 0;
    const processedSentences = [...sentences];

    // Add honesty markers to key statements
    const keyPositions = [
      Math.floor(sentences.length * 0.15),
      Math.floor(sentences.length * 0.45),
      Math.floor(sentences.length * 0.75)
    ];

    keyPositions.forEach((pos, index) => {
      if (pos < sentences.length && !sentences[pos].toLowerCase().includes(this.honestyMarkers[0])) {
        const marker = this.honestyMarkers[index % this.honestyMarkers.length];
        
        // Add honesty marker at the beginning of the sentence
        processedSentences[pos] = processedSentences[pos].replace(
          /^([A-Z])/,
          `To be ${marker}, $1`
        );
        count++;
      }
    });

    return { content: processedSentences.join(' '), count };
  }

  private createLimitationsSection(limitations: Limitation[]): string {
    const intro = this.limitationPhrases[0];
    let section = `\n\n${intro} that while this approach is effective, there are some considerations:`;
    
    limitations.forEach((limitation, index) => {
      const impact = limitation.impact === 'significant' ? ' (significant)' : '';
      section += `\n• ${limitation.aspect}: ${limitation.description}${impact}`;
    });
    
    section += '\n\nDespite these considerations, the core principles remain valid and applicable with appropriate adjustments.';
    
    return section;
  }

  private getTransparencyPosition(totalParagraphs: number, index: number): number {
    // Place transparency statements early and mid-content
    const positions = [
      0, // Very beginning
      Math.floor(totalParagraphs * 0.3),
      Math.floor(totalParagraphs * 0.6)
    ];
    
    return positions[index % positions.length];
  }

  private getBalancedPosition(totalSentences: number, index: number, totalPerspectives: number): number {
    // Distribute perspectives evenly throughout content
    const segment = totalSentences / (totalPerspectives + 1);
    return Math.floor((index + 1) * segment);
  }

  private calculateTrustScore(
    content: string,
    elements: { transparencyMarkers: number; balancedPerspectives: number; limitations: number; honestyIndicators: number }
  ): number {
    const contentLower = content.toLowerCase();
    let score = 60; // Base score

    // Points for trust elements
    score += Math.min(elements.transparencyMarkers * 8, 16);
    score += Math.min(elements.balancedPerspectives * 10, 20);
    score += Math.min(elements.limitations * 6, 12);
    score += Math.min(elements.honestyIndicators * 5, 10);

    // Check for additional trust signals
    const trustWords = [
      'transparent', 'honest', 'accurate', 'verified',
      'balanced', 'objective', 'fair', 'unbiased'
    ];
    
    let trustWordCount = 0;
    trustWords.forEach(word => {
      if (contentLower.includes(word)) {
        trustWordCount++;
      }
    });
    score += Math.min(trustWordCount * 2, 12);

    // Check for evidence of consideration
    const considerationPhrases = [
      'it depends', 'in some cases', 'generally', 'typically',
      'may vary', 'could be', 'might be', 'tends to'
    ];
    
    let considerationCount = 0;
    considerationPhrases.forEach(phrase => {
      if (contentLower.includes(phrase)) {
        considerationCount++;
      }
    });
    score += Math.min(considerationCount * 2, 10);

    return Math.min(score, 100);
  }

  private generateTrustImprovements(originalContent: string, elements: any): string[] {
    const improvements: string[] = [];
    const contentLower = originalContent.toLowerCase();

    if (elements.transparencyMarkers < 2) {
      improvements.push('Add more transparency statements to build reader trust');
    }

    if (elements.balancedPerspectives < 2) {
      improvements.push('Include alternative viewpoints for a more balanced presentation');
    }

    if (elements.limitations === 0) {
      improvements.push('Acknowledge potential limitations or considerations');
    }

    if (!contentLower.includes('however') && !contentLower.includes('although')) {
      improvements.push('Add contrasting viewpoints using words like "however" or "although"');
    }

    if (!contentLower.includes('evidence') && !contentLower.includes('data')) {
      improvements.push('Reference evidence or data to support claims');
    }

    if (elements.honestyIndicators < 2) {
      improvements.push('Use more honesty markers like "frankly" or "candidly"');
    }

    return improvements;
  }

  analyzeTrustworthiness(content: string): {
    score: number;
    strengths: string[];
    weaknesses: string[];
  } {
    const contentLower = content.toLowerCase();
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    let score = 50;

    // Check for transparency
    if (contentLower.includes('transparent') || contentLower.includes('disclosure')) {
      strengths.push('Contains transparency language');
      score += 10;
    } else {
      weaknesses.push('Lacks transparency indicators');
    }

    // Check for balance
    if (contentLower.includes('however') || contentLower.includes('on the other hand')) {
      strengths.push('Presents balanced perspectives');
      score += 15;
    } else {
      weaknesses.push('Missing alternative viewpoints');
    }

    // Check for limitations
    if (contentLower.includes('limitation') || contentLower.includes('consider')) {
      strengths.push('Acknowledges limitations');
      score += 15;
    } else {
      weaknesses.push('No limitations mentioned');
    }

    // Check for evidence
    if (contentLower.includes('research') || contentLower.includes('study') || contentLower.includes('data')) {
      strengths.push('References evidence or research');
      score += 10;
    } else {
      weaknesses.push('Lacks evidence-based support');
    }

    return { score: Math.min(score, 100), strengths, weaknesses };
  }
}
