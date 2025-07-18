export interface DetectedError {
  type: string;
  message: string;
  location: number | { line: number; column: number };
  severity: 'low' | 'medium' | 'high';
  suggestion?: string;
}

export class ErrorDetectionCorrection {
  private readonly commonTypos = new Map([
    ['teh', 'the'],
    ['recieve', 'receive'],
    ['seperate', 'separate'],
    ['occured', 'occurred'],
    ['definately', 'definitely']
  ]);

  detectErrors(content: string): DetectedError[] {
    if (!content || typeof content !== 'string') {
      throw new Error('Content must be a non-empty string');
    }

    const errors: DetectedError[] = [];
    
    // Detect common typos
    this.commonTypos.forEach((correction, typo) => {
      const regex = new RegExp(`\\b${typo}\\b`, 'gi');
      let match;
      while ((match = regex.exec(content)) !== null) {
        errors.push({
          type: 'Typo',
          message: `Typo: '${match[0]}' should be '${correction}'`,
          location: match.index,
          severity: 'low',
          suggestion: correction
        });
      }
    });

    // Detect basic grammar errors
    const grammarPatterns = [
      { pattern: /\bI is\b/g, message: 'Grammar error: "I is" should be "I am"', suggestion: 'I am' },
      { pattern: /\byour\s+welcome\b/gi, message: 'Grammar error: "your welcome" should be "you\'re welcome"', suggestion: "you're welcome" }
    ];

    grammarPatterns.forEach(({ pattern, message, suggestion }) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        errors.push({
          type: 'Grammar',
          message,
          location: match.index,
          severity: 'medium',
          suggestion
        });
      }
    });

    return errors;
  }

  correctErrors(content: string, errors: DetectedError[]): string {
    if (!content || typeof content !== 'string') {
      throw new Error('Content must be a non-empty string');
    }
    if (!errors || !Array.isArray(errors)) {
      return content;
    }

    let correctedContent = content;
    
    // Sort errors by location in reverse order to maintain correct indices
    const sortedErrors = [...errors].sort((a, b) => {
      const locationA = typeof a.location === 'number' ? a.location : 0;
      const locationB = typeof b.location === 'number' ? b.location : 0;
      return locationB - locationA;
    });

    sortedErrors.forEach(error => {
      if (error.suggestion && typeof error.location === 'number') {
        // Apply correction based on error type
        if (error.type === 'Typo') {
          const beforeCorrection = correctedContent.substring(0, error.location);
          const afterCorrection = correctedContent.substring(error.location);
          const correctedPart = afterCorrection.replace(/^\w+/, error.suggestion);
          correctedContent = beforeCorrection + correctedPart;
        }
      }
    });

    return correctedContent;
  }
}