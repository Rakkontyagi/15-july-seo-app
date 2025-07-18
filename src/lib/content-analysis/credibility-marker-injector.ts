
export interface CredibilityInjectionResult {
  enhancedContent: string;
  credibilityScore: number;
  injectedMarkers: {
    certifications: number;
    credentials: number;
    testimonials: number;
    achievements: number;
    recognition: number;
  };
  suggestions: string[];
}

export interface Certification {
  name: string;
  issuer: string;
  relevance: 'primary' | 'secondary' | 'supporting';
  year?: number;
}

export interface Credential {
  title: string;
  type: 'degree' | 'license' | 'membership' | 'award';
  institution: string;
  field: string;
}

export interface Testimonial {
  quote: string;
  source: string;
  role?: string;
  company?: string;
  verified: boolean;
}

export interface Achievement {
  description: string;
  impact: string;
  metric?: string;
  year?: number;
}

export class CredibilityMarkerInjector {
  private readonly certificationPhrases = [
    'certified by {issuer}',
    'holding {name} certification',
    'accredited through {issuer}',
    '{name} certified professional',
    'certified in {name}',
    'maintaining {name} certification'
  ];

  private readonly credentialPhrases = [
    'with {title} from {institution}',
    'holding {title} in {field}',
    '{title} qualified',
    'credentialed as {title}',
    'licensed {title}',
    '{institution} {title} holder'
  ];

  private readonly testimonialIntros = [
    'As noted by {source}',
    '{source} states',
    'According to {source}',
    'In the words of {source}',
    '{source} confirms',
    'As {source} attests'
  ];

  private readonly achievementPhrases = [
    'achieving {metric}',
    'recognized for {description}',
    'accomplished {impact}',
    'delivered {metric} improvement',
    'earned recognition for {description}',
    'demonstrated success in {impact}'
  ];

  private readonly recognitionMarkers = [
    'industry-recognized',
    'award-winning',
    'highly regarded',
    'distinguished',
    'acclaimed',
    'renowned',
    'respected',
    'established'
  ];

  injectCredibilityMarkers(
    content: string,
    certifications?: Certification[],
    credentials?: Credential[],
    testimonials?: Testimonial[],
    achievements?: Achievement[]
  ): CredibilityInjectionResult {
    let enhancedContent = content;
    const injectedMarkers = {
      certifications: 0,
      credentials: 0,
      testimonials: 0,
      achievements: 0,
      recognition: 0
    };

    // Add certifications
    if (certifications && certifications.length > 0) {
      const result = this.addCertifications(enhancedContent, certifications);
      enhancedContent = result.content;
      injectedMarkers.certifications = result.count;
    }

    // Add credentials
    if (credentials && credentials.length > 0) {
      const result = this.addCredentials(enhancedContent, credentials);
      enhancedContent = result.content;
      injectedMarkers.credentials = result.count;
    }

    // Add testimonials
    if (testimonials && testimonials.length > 0) {
      const result = this.addTestimonials(enhancedContent, testimonials);
      enhancedContent = result.content;
      injectedMarkers.testimonials = result.count;
    }

    // Add achievements
    if (achievements && achievements.length > 0) {
      const result = this.addAchievements(enhancedContent, achievements);
      enhancedContent = result.content;
      injectedMarkers.achievements = result.count;
    }

    // Add recognition markers
    const recognitionResult = this.addRecognitionMarkers(enhancedContent);
    enhancedContent = recognitionResult.content;
    injectedMarkers.recognition = recognitionResult.count;

    // Calculate credibility score
    const credibilityScore = this.calculateCredibilityScore(enhancedContent, injectedMarkers);

    // Generate suggestions
    const suggestions = this.generateCredibilitySuggestions(content, injectedMarkers);

    return {
      enhancedContent,
      credibilityScore,
      injectedMarkers,
      suggestions
    };
  }

  addCertifications(content: string, certifications: Certification[]): { content: string; count: number } {
    const sentences = content.split(/(?<=[.!?])\s+/);
    let count = 0;
    const enhancedSentences = [...sentences];

    // Sort certifications by relevance
    const sortedCerts = certifications.sort((a, b) => {
      const relevanceOrder = { primary: 0, secondary: 1, supporting: 2 };
      return relevanceOrder[a.relevance] - relevanceOrder[b.relevance];
    });

    // Insert primary certifications early
    const primaryCerts = sortedCerts.filter(c => c.relevance === 'primary');
    if (primaryCerts.length > 0 && sentences.length > 3) {
      const cert = primaryCerts[0];
      const phrase = this.certificationPhrases[0]
        .replace('{name}', cert.name)
        .replace('{issuer}', cert.issuer);
      
      const yearText = cert.year ? ` since ${cert.year}` : '';
      const certStatement = `As professionals ${phrase}${yearText}, `;
      
      // Add to second or third sentence
      enhancedSentences[2] = certStatement + enhancedSentences[2].toLowerCase();
      count++;
    }

    // Add other certifications throughout
    const otherCerts = sortedCerts.slice(1, 3); // Limit to avoid over-stuffing
    otherCerts.forEach((cert, index) => {
      const position = Math.floor((index + 2) * sentences.length / 4);
      if (position < sentences.length) {
        const phraseTemplate = this.certificationPhrases[(index + 1) % this.certificationPhrases.length];
        const phrase = phraseTemplate
          .replace('{name}', cert.name)
          .replace('{issuer}', cert.issuer);
        
        // Insert inline
        enhancedSentences[position] = enhancedSentences[position].replace(
          /we |our team |professionals /i,
          `${phrase.toLowerCase()} professionals `
        );
        count++;
      }
    });

    return { content: enhancedSentences.join(' '), count };
  }

  addCredentials(content: string, credentials: Credential[]): { content: string; count: number } {
    const paragraphs = content.split(/\n\n/);
    let count = 0;
    const enhancedParagraphs = [...paragraphs];

    // Group credentials by type
    const degrees = credentials.filter(c => c.type === 'degree');
    const licenses = credentials.filter(c => c.type === 'license');
    const otherCreds = credentials.filter(c => c.type === 'membership' || c.type === 'award');

    // Add most relevant credentials
    const topCredentials = [...degrees.slice(0, 1), ...licenses.slice(0, 1), ...otherCreds.slice(0, 1)];
    
    topCredentials.forEach((cred, index) => {
      const targetParagraph = Math.min(index, paragraphs.length - 1);
      const phraseTemplate = this.credentialPhrases[index % this.credentialPhrases.length];
      const phrase = phraseTemplate
        .replace('{title}', cred.title)
        .replace('{institution}', cred.institution)
        .replace('{field}', cred.field);
      
      // Add credential reference
      const credStatement = `Professionals ${phrase} bring deep expertise to this analysis. `;
      enhancedParagraphs[targetParagraph] = credStatement + enhancedParagraphs[targetParagraph];
      count++;
    });

    return { content: enhancedParagraphs.join('\n\n'), count };
  }

  addTestimonials(content: string, testimonials: Testimonial[]): { content: string; count: number } {
    const paragraphs = content.split(/\n\n/);
    let count = 0;
    const enhancedParagraphs = [...paragraphs];

    // Filter for verified testimonials first
    const verifiedTestimonials = testimonials.filter(t => t.verified);
    const testimonialsToUse = verifiedTestimonials.length > 0 ? verifiedTestimonials : testimonials;

    // Add testimonials at strategic points
    const positions = [
      Math.floor(paragraphs.length * 0.3),
      Math.floor(paragraphs.length * 0.7)
    ];

    testimonialsToUse.slice(0, 2).forEach((testimonial, index) => {
      const position = positions[index];
      if (position < paragraphs.length) {
        const intro = this.testimonialIntros[index % this.testimonialIntros.length]
          .replace('{source}', this.formatTestimonialSource(testimonial));
        
        const testimonialBlock = `\n\n${intro}: "${testimonial.quote}"\n\n`;
        
        // Insert after the target paragraph
        enhancedParagraphs.splice(position + 1 + index, 0, testimonialBlock.trim());
        count++;
      }
    });

    return { content: enhancedParagraphs.join('\n\n'), count };
  }

  private addAchievements(content: string, achievements: Achievement[]): { content: string; count: number } {
    const sentences = content.split(/(?<=[.!?])\s+/);
    let count = 0;
    const enhancedSentences = [...sentences];

    // Add top achievements
    const topAchievements = achievements
      .filter(a => a.metric) // Prioritize achievements with metrics
      .slice(0, 3);

    topAchievements.forEach((achievement, index) => {
      const position = Math.floor((index + 1) * sentences.length / (topAchievements.length + 1));
      
      if (position < sentences.length) {
        const phraseTemplate = this.achievementPhrases[index % this.achievementPhrases.length];
        const phrase = phraseTemplate
          .replace('{description}', achievement.description)
          .replace('{impact}', achievement.impact)
          .replace('{metric}', achievement.metric || achievement.impact);
        
        const yearText = achievement.year ? ` in ${achievement.year}` : '';
        const achievementStatement = `Having ${phrase}${yearText}, this expertise informs our approach. `;
        
        enhancedSentences[position] = achievementStatement + enhancedSentences[position];
        count++;
      }
    });

    return { content: enhancedSentences.join(' '), count };
  }

  private addRecognitionMarkers(content: string): { content: string; count: number } {
    const sentences = content.split(/(?<=[.!?])\s+/);
    let count = 0;
    const enhancedSentences = [...sentences];

    // Strategic positions for recognition markers
    const positions = [
      Math.floor(sentences.length * 0.1),
      Math.floor(sentences.length * 0.5),
      Math.floor(sentences.length * 0.85)
    ];

    positions.forEach((pos, index) => {
      if (pos < sentences.length) {
        const marker = this.recognitionMarkers[index % this.recognitionMarkers.length];
        
        // Look for opportunities to add recognition markers
        enhancedSentences[pos] = enhancedSentences[pos].replace(
          /professionals|experts|specialists|practitioners/i,
          `${marker} $&`
        );
        
        if (enhancedSentences[pos] !== sentences[pos]) {
          count++;
        }
      }
    });

    return { content: enhancedSentences.join(' '), count };
  }

  private formatTestimonialSource(testimonial: Testimonial): string {
    let source = testimonial.source;
    
    if (testimonial.role) {
      source = `${testimonial.source}, ${testimonial.role}`;
    }
    
    if (testimonial.company) {
      source += ` at ${testimonial.company}`;
    }
    
    return source;
  }

  private calculateCredibilityScore(
    content: string,
    markers: { certifications: number; credentials: number; testimonials: number; achievements: number; recognition: number }
  ): number {
    const contentLower = content.toLowerCase();
    let score = 50; // Base score

    // Points for injected markers
    score += Math.min(markers.certifications * 12, 24);
    score += Math.min(markers.credentials * 10, 20);
    score += Math.min(markers.testimonials * 8, 16);
    score += Math.min(markers.achievements * 6, 12);
    score += Math.min(markers.recognition * 4, 8);

    // Check for credibility keywords
    const credibilityWords = [
      'certified', 'licensed', 'accredited', 'qualified',
      'experienced', 'proven', 'established', 'recognized',
      'award', 'achievement', 'credential', 'degree'
    ];
    
    let keywordCount = 0;
    credibilityWords.forEach(word => {
      if (contentLower.includes(word)) {
        keywordCount++;
      }
    });
    score += Math.min(keywordCount * 2, 20);

    return Math.min(score, 100);
  }

  private generateCredibilitySuggestions(content: string, markers: any): string[] {
    const suggestions: string[] = [];
    const contentLower = content.toLowerCase();

    if (markers.certifications === 0) {
      suggestions.push('Add relevant industry certifications to establish expertise');
    }

    if (markers.credentials === 0) {
      suggestions.push('Include professional credentials or qualifications');
    }

    if (markers.testimonials === 0) {
      suggestions.push('Add client testimonials or expert endorsements');
    }

    if (markers.achievements === 0) {
      suggestions.push('Highlight specific achievements with measurable results');
    }

    if (!contentLower.includes('experience') && !contentLower.includes('years')) {
      suggestions.push('Mention years of experience or expertise duration');
    }

    if (!contentLower.includes('client') && !contentLower.includes('customer')) {
      suggestions.push('Reference client success stories or case studies');
    }

    return suggestions;
  }

  analyzeCredibility(content: string): {
    score: number;
    present: string[];
    missing: string[];
  } {
    const contentLower = content.toLowerCase();
    const present: string[] = [];
    const missing: string[] = [];
    let score = 40;

    // Check for certifications
    if (contentLower.includes('certified') || contentLower.includes('certification')) {
      present.push('Certification mentions');
      score += 15;
    } else {
      missing.push('No certification references');
    }

    // Check for credentials
    if (contentLower.includes('degree') || contentLower.includes('qualified') || contentLower.includes('licensed')) {
      present.push('Professional credentials');
      score += 15;
    } else {
      missing.push('No credential mentions');
    }

    // Check for testimonials
    if (contentLower.includes('client') && (contentLower.includes('said') || contentLower.includes('stated'))) {
      present.push('Client testimonials');
      score += 10;
    } else {
      missing.push('No testimonials included');
    }

    // Check for achievements
    if (contentLower.includes('achieved') || contentLower.includes('accomplished') || contentLower.includes('delivered')) {
      present.push('Achievement references');
      score += 10;
    } else {
      missing.push('No specific achievements');
    }

    // Check for recognition
    if (contentLower.includes('award') || contentLower.includes('recognized') || contentLower.includes('honored')) {
      present.push('Recognition markers');
      score += 10;
    } else {
      missing.push('No recognition indicators');
    }

    return { score: Math.min(score, 100), present, missing };
  }
}
