
import { PredictablePattern } from '../../../types/content-analysis';

/**
 * Identifies predictable writing patterns commonly found in AI-generated content
 * Analyzes introductions, transitions, conclusions, and filler phrases
 */
export function identifyPredictablePatterns(content: string): PredictablePattern[] {
  const patterns: PredictablePattern[] = [];
  const lowerContent = content.toLowerCase();

  // Analyze different types of predictable patterns
  patterns.push(...identifyIntroPatterns(lowerContent, content));
  patterns.push(...identifyTransitionPatterns(lowerContent, content));
  patterns.push(...identifyConclusionPatterns(lowerContent, content));
  patterns.push(...identifyFillerPatterns(lowerContent, content));

  return patterns.filter(pattern => pattern.confidence > 0.4);
}

function identifyIntroPatterns(lowerContent: string, originalContent: string): PredictablePattern[] {
  const patterns: PredictablePattern[] = [];

  const introPatterns = [
    {
      pattern: /^(in today's world|in the modern era|in this day and age)/,
      type: 'intro' as const,
      confidence: 0.8,
      suggestions: ['Start with a specific example', 'Begin with a surprising fact', 'Open with a question']
    },
    {
      pattern: /^(it is important to understand|it is crucial to recognize|it is essential to know)/,
      type: 'intro' as const,
      confidence: 0.9,
      suggestions: ['Start directly with the main point', 'Use active voice', 'Begin with concrete details']
    },
    {
      pattern: /^(when it comes to|in terms of|with regard to)/,
      type: 'intro' as const,
      confidence: 0.7,
      suggestions: ['Be more direct', 'Start with the specific topic', 'Use active construction']
    },
    {
      pattern: /^(as we all know|it goes without saying|needless to say)/,
      type: 'intro' as const,
      confidence: 0.85,
      suggestions: ['Remove the assumption', 'State the fact directly', 'Provide evidence instead']
    }
  ];

  introPatterns.forEach(({ pattern, type, confidence, suggestions }) => {
    if (pattern.test(lowerContent)) {
      patterns.push({
        type,
        pattern: pattern.source,
        confidence,
        suggestions
      });
    }
  });

  return patterns;
}

function identifyTransitionPatterns(lowerContent: string, originalContent: string): PredictablePattern[] {
  const patterns: PredictablePattern[] = [];

  const transitionPatterns = [
    {
      pattern: /(furthermore|moreover|additionally|in addition)/g,
      type: 'transition' as const,
      confidence: 0.7,
      suggestions: ['Use "Also" or "Plus"', 'Try "What\'s more"', 'Consider "On top of that"']
    },
    {
      pattern: /(however|nevertheless|nonetheless)/g,
      type: 'transition' as const,
      confidence: 0.6,
      suggestions: ['Use "But" or "Yet"', 'Try "Still"', 'Consider "Even so"']
    },
    {
      pattern: /(therefore|thus|consequently|hence)/g,
      type: 'transition' as const,
      confidence: 0.8,
      suggestions: ['Use "So" or "This means"', 'Try "As a result"', 'Consider "That\'s why"']
    },
    {
      pattern: /(on the one hand.*on the other hand)/g,
      type: 'transition' as const,
      confidence: 0.9,
      suggestions: ['Use "While... also"', 'Try contrasting examples', 'Consider "Some say... others argue"']
    }
  ];

  transitionPatterns.forEach(({ pattern, type, confidence, suggestions }) => {
    const matches = lowerContent.match(pattern);
    if (matches && matches.length > 2) { // Multiple uses indicate pattern
      patterns.push({
        type,
        pattern: pattern.source,
        confidence: Math.min(confidence + (matches.length - 2) * 0.1, 1),
        suggestions
      });
    }
  });

  return patterns;
}

function identifyConclusionPatterns(lowerContent: string, originalContent: string): PredictablePattern[] {
  const patterns: PredictablePattern[] = [];

  const conclusionPatterns = [
    {
      pattern: /(in conclusion|to conclude|in summary|to summarize)/g,
      type: 'conclusion' as const,
      confidence: 0.9,
      suggestions: ['End with a call to action', 'Finish with a thought-provoking question', 'Close with a specific example']
    },
    {
      pattern: /(ultimately|at the end of the day|when all is said and done)/g,
      type: 'conclusion' as const,
      confidence: 0.8,
      suggestions: ['Use "Finally" or "In the end"', 'Try "The bottom line is"', 'Consider "What matters most"']
    },
    {
      pattern: /(it is clear that|it is evident that|it is obvious that)/g,
      type: 'conclusion' as const,
      confidence: 0.85,
      suggestions: ['State the conclusion directly', 'Use "This shows that"', 'Try "The evidence suggests"']
    }
  ];

  conclusionPatterns.forEach(({ pattern, type, confidence, suggestions }) => {
    const matches = lowerContent.match(pattern);
    if (matches) {
      patterns.push({
        type,
        pattern: pattern.source,
        confidence,
        suggestions
      });
    }
  });

  return patterns;
}

function identifyFillerPatterns(lowerContent: string, originalContent: string): PredictablePattern[] {
  const patterns: PredictablePattern[] = [];

  const fillerPatterns = [
    {
      pattern: /(it is worth noting that|it is important to note that|it should be noted that)/g,
      type: 'filler' as const,
      confidence: 0.8,
      suggestions: ['Remove the filler and state directly', 'Use "Note that"', 'Simply state the fact']
    },
    {
      pattern: /(it is interesting to note|interestingly enough|it is fascinating that)/g,
      type: 'filler' as const,
      confidence: 0.7,
      suggestions: ['Show why it\'s interesting with evidence', 'Use "Surprisingly"', 'Provide specific details']
    },
    {
      pattern: /(as mentioned earlier|as previously stated|as we have seen)/g,
      type: 'filler' as const,
      confidence: 0.6,
      suggestions: ['Reference the specific point', 'Use "Remember that"', 'Briefly restate the key point']
    },
    {
      pattern: /(needless to say|it goes without saying|obviously)/g,
      type: 'filler' as const,
      confidence: 0.9,
      suggestions: ['Remove entirely if truly obvious', 'Provide evidence instead', 'State the point directly']
    }
  ];

  fillerPatterns.forEach(({ pattern, type, confidence, suggestions }) => {
    const matches = lowerContent.match(pattern);
    if (matches) {
      patterns.push({
        type,
        pattern: pattern.source,
        confidence: Math.min(confidence + (matches.length - 1) * 0.1, 1),
        suggestions
      });
    }
  });

  return patterns;
}

/**
 * Legacy function for backward compatibility
 */
export function identifyPredictablePatternsLegacy(content: string): string[] {
  const patterns = identifyPredictablePatterns(content);
  return patterns.map(p => `${p.type}: ${p.pattern}`);
}
