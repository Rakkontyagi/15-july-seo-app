
export interface AuthorityEnhancementResult {
  enhancedContent: string;
  addedSignals: {
    citations: number;
    standards: number;
    bestPractices: number;
    credentials: number;
  };
  authorityScore: number;
}

export interface Citation {
  text: string;
  source: string;
  year?: number;
  url?: string;
  authority: 'high' | 'medium' | 'low';
}

export interface IndustryStandard {
  name: string;
  organization: string;
  description: string;
  relevance: 'primary' | 'secondary';
}

export class AuthoritativenessEnhancer {
  private readonly authorityPhrases = [
    'According to {source}',
    'As reported by {source}',
    '{source} states that',
    'Research from {source} indicates',
    'Industry leader {source} confirms',
    'As documented by {source}',
    '{source} research shows',
    'Leading experts at {source} found'
  ];

  private readonly standardsPhrases = [
    'Following {standard} guidelines',
    'In accordance with {standard}',
    'As per {standard} standards',
    'Compliant with {standard}',
    'Based on {standard} framework',
    'Aligned with {standard} methodology'
  ];

  private readonly bestPracticePhrases = [
    'Industry best practice suggests',
    'Professional standards recommend',
    'Established methodology includes',
    'Proven approaches involve',
    'Expert consensus indicates',
    'Leading practitioners advise'
  ];

  private readonly highAuthorityDomains = [
    '.gov', '.edu', '.org',
    'harvard.edu', 'stanford.edu', 'mit.edu',
    'nature.com', 'science.org', 'pubmed',
    'ieee.org', 'acm.org', 'springer.com'
  ];

  enhanceAuthoritativeness(
    content: string,
    citations?: Citation[],
    standards?: IndustryStandard[],
    bestPractices?: string[]
  ): AuthorityEnhancementResult {
    let enhancedContent = content;
    const addedSignals = {
      citations: 0,
      standards: 0,
      bestPractices: 0,
      credentials: 0
    };

    // Add citations if provided
    if (citations && citations.length > 0) {
      const result = this.addCitations(enhancedContent, citations);
      enhancedContent = result.content;
      addedSignals.citations = result.count;
    }

    // Add industry standards
    if (standards && standards.length > 0) {
      const result = this.addIndustryStandards(enhancedContent, standards);
      enhancedContent = result.content;
      addedSignals.standards = result.count;
    }

    // Add best practices
    if (bestPractices && bestPractices.length > 0) {
      const result = this.addBestPractices(enhancedContent, bestPractices);
      enhancedContent = result.content;
      addedSignals.bestPractices = result.count;
    }

    // Add professional credentials
    const credResult = this.addProfessionalCredentials(enhancedContent);
    enhancedContent = credResult.content;
    addedSignals.credentials = credResult.count;

    // Calculate authority score
    const authorityScore = this.calculateAuthorityScore(enhancedContent, addedSignals);

    return {
      enhancedContent,
      addedSignals,
      authorityScore
    };
  }

  addCitations(content: string, citations: Citation[]): { content: string; count: number } {
    const sentences = content.split(/(?<=[.!?])\s+/);
    let citationCount = 0;
    const enhancedSentences = [...sentences];

    // Strategic positions for citations
    const positions = this.getStrategicPositions(sentences.length);

    positions.forEach((pos, index) => {
      if (pos < sentences.length && index < citations.length) {
        const citation = citations[index];
        const phraseTemplate = this.authorityPhrases[index % this.authorityPhrases.length];
        const citationPhrase = this.formatCitation(phraseTemplate, citation);
        
        // Insert citation before the sentence
        enhancedSentences[pos] = `${citationPhrase}, ${enhancedSentences[pos].toLowerCase()}`;
        citationCount++;
      }
    });

    // Add reference list at the end if substantial citations
    if (citations.length > 2) {
      const referenceSection = this.createReferenceSection(citations);
      enhancedSentences.push(referenceSection);
    }

    return { content: enhancedSentences.join(' '), count: citationCount };
  }

  addIndustryStandards(content: string, standards: IndustryStandard[]): { content: string; count: number } {
    const paragraphs = content.split(/\n\n/);
    let standardCount = 0;
    const enhancedParagraphs = [...paragraphs];

    // Add standards references throughout content
    standards.forEach((standard, index) => {
      const targetParagraph = Math.floor((index + 1) * paragraphs.length / (standards.length + 1));
      
      if (targetParagraph < paragraphs.length) {
        const phraseTemplate = this.standardsPhrases[index % this.standardsPhrases.length];
        const standardPhrase = phraseTemplate.replace('{standard}', `${standard.organization} ${standard.name}`);
        
        // Add standard reference to beginning of paragraph
        enhancedParagraphs[targetParagraph] = `${standardPhrase}, ${enhancedParagraphs[targetParagraph]}`;
        standardCount++;
      }
    });

    return { content: enhancedParagraphs.join('\n\n'), count: standardCount };
  }

  addBestPractices(content: string, practices: string[]): { content: string; count: number } {
    const sentences = content.split(/(?<=[.!?])\s+/);
    let practiceCount = 0;
    const enhancedSentences = [...sentences];

    // Insert best practices at regular intervals
    const interval = Math.floor(sentences.length / (practices.length + 1));
    
    practices.forEach((practice, index) => {
      const position = (index + 1) * interval;
      
      if (position < sentences.length) {
        const phrasePrefix = this.bestPracticePhrases[index % this.bestPracticePhrases.length];
        const practiceStatement = `${phrasePrefix} ${practice.toLowerCase()}.`;
        
        // Insert as a new sentence
        enhancedSentences.splice(position + practiceCount, 0, practiceStatement);
        practiceCount++;
      }
    });

    return { content: enhancedSentences.join(' '), count: practiceCount };
  }

  private addProfessionalCredentials(content: string): { content: string; count: number } {
    const credentialPhrases = [
      'certified professionals',
      'accredited experts',
      'licensed practitioners',
      'industry-certified specialists',
      'qualified professionals',
      'credentialed authorities'
    ];

    let enhancedContent = content;
    let count = 0;

    // Add credential references where appropriate
    const sentences = content.split(/(?<=[.!?])\s+/);
    const positions = [Math.floor(sentences.length * 0.2), Math.floor(sentences.length * 0.7)];

    positions.forEach((pos, index) => {
      if (pos < sentences.length && !sentences[pos].toLowerCase().includes('certif')) {
        const credential = credentialPhrases[index % credentialPhrases.length];
        sentences[pos] = sentences[pos].replace(
          /experts|professionals|practitioners/i,
          credential
        );
        if (sentences[pos] !== content.split(/(?<=[.!?])\s+/)[pos]) {
          count++;
        }
      }
    });

    return { content: sentences.join(' '), count };
  }

  private formatCitation(template: string, citation: Citation): string {
    let formatted = template.replace('{source}', citation.source);
    
    if (citation.year) {
      formatted += ` (${citation.year})`;
    }
    
    return formatted;
  }

  private createReferenceSection(citations: Citation[]): string {
    const highAuthorityCitations = citations.filter(c => c.authority === 'high');
    
    if (highAuthorityCitations.length === 0) return '';
    
    let references = '\n\nReferences: ';
    references += highAuthorityCitations
      .map(c => `${c.source}${c.year ? ` (${c.year})` : ''}`)
      .join('; ');
    
    return references;
  }

  private getStrategicPositions(totalSentences: number): number[] {
    // Place citations at strategic positions for maximum impact
    const positions: number[] = [];
    
    // Early credibility (20% mark)
    positions.push(Math.floor(totalSentences * 0.2));
    
    // Mid-content support (50% mark)
    positions.push(Math.floor(totalSentences * 0.5));
    
    // Late reinforcement (80% mark)
    positions.push(Math.floor(totalSentences * 0.8));
    
    return positions;
  }

  private calculateAuthorityScore(
    content: string,
    addedSignals: { citations: number; standards: number; bestPractices: number; credentials: number }
  ): number {
    const contentLower = content.toLowerCase();
    let score = 50; // Base score

    // Points for added signals
    score += Math.min(addedSignals.citations * 10, 20);
    score += Math.min(addedSignals.standards * 8, 16);
    score += Math.min(addedSignals.bestPractices * 6, 12);
    score += Math.min(addedSignals.credentials * 5, 10);

    // Check for high-authority domain mentions
    let authorityDomainCount = 0;
    this.highAuthorityDomains.forEach(domain => {
      if (contentLower.includes(domain)) {
        authorityDomainCount++;
      }
    });
    score += Math.min(authorityDomainCount * 4, 12);

    // Check for professional language
    const professionalTerms = [
      'peer-reviewed', 'published', 'accredited', 'certified',
      'validated', 'verified', 'established', 'recognized'
    ];
    
    let professionalCount = 0;
    professionalTerms.forEach(term => {
      if (contentLower.includes(term)) {
        professionalCount++;
      }
    });
    score += Math.min(professionalCount * 2, 10);

    return Math.min(score, 100);
  }

  generateAuthoritySuggestions(content: string): string[] {
    const suggestions: string[] = [];
    const contentLower = content.toLowerCase();

    // Check for missing citations
    if (!contentLower.includes('according to') && !contentLower.includes('research')) {
      suggestions.push('Add citations from authoritative sources to support key claims');
    }

    // Check for industry standards
    if (!contentLower.includes('standard') && !contentLower.includes('guideline')) {
      suggestions.push('Reference relevant industry standards or guidelines');
    }

    // Check for credentials
    if (!contentLower.includes('certified') && !contentLower.includes('accredited')) {
      suggestions.push('Mention professional certifications or accreditations');
    }

    // Check for best practices
    if (!contentLower.includes('best practice') && !contentLower.includes('recommended')) {
      suggestions.push('Include industry best practices and professional recommendations');
    }

    // Check for authority domains
    const hasAuthorityLinks = this.highAuthorityDomains.some(domain => 
      contentLower.includes(domain)
    );
    if (!hasAuthorityLinks) {
      suggestions.push('Link to high-authority domains (.edu, .gov, peer-reviewed sources)');
    }

    return suggestions;
  }
}
