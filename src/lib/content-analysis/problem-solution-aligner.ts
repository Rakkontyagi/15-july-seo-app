
export interface AlignmentAnalysis {
  problemCoverage: number;
  solutionCompleteness: number;
  alignmentScore: number;
  gapAnalysis: string[];
  solutionEffectiveness: number;
  identifiedProblems: ProblemStatement[];
  providedSolutions: SolutionStatement[];
  processingTimeMs: number;
}

export interface ProblemStatement {
  text: string;
  type: 'challenge' | 'difficulty' | 'issue' | 'pain-point' | 'obstacle';
  severity: 'low' | 'medium' | 'high';
  location: number;
}

export interface SolutionStatement {
  text: string;
  type: 'direct-solution' | 'workaround' | 'best-practice' | 'recommendation';
  completeness: number;
  location: number;
  relatedProblems: string[];
}

export class ProblemSolutionAligner {
  private readonly problemIndicators = {
    challenge: ['challenge', 'challenging', 'challenges', 'difficult to', 'struggle with'],
    difficulty: ['difficulty', 'difficult', 'hard to', 'trouble', 'problematic'],
    issue: ['issue', 'issues', 'problem', 'problems', 'concern', 'concerns'],
    'pain-point': ['pain point', 'frustrating', 'annoying', 'bottleneck', 'obstacle'],
    obstacle: ['obstacle', 'barrier', 'hurdle', 'impediment', 'roadblock']
  };

  private readonly solutionIndicators = {
    'direct-solution': ['solution', 'solve', 'fix', 'resolve', 'address', 'remedy'],
    workaround: ['workaround', 'alternative', 'bypass', 'work around', 'get around'],
    'best-practice': ['best practice', 'recommended', 'should', 'ought to', 'ideal approach'],
    recommendation: ['recommend', 'suggest', 'advise', 'propose', 'consider']
  };

  validateAlignment(content: string, userProblems: string[]): AlignmentAnalysis {
    if (typeof content !== 'string') {
      throw new Error('Content must be a string');
    }
    if (!userProblems || !Array.isArray(userProblems)) {
      throw new Error('User problems must be an array');
    }

    // Handle empty content gracefully
    if (!content || content.trim().length === 0) {
      return {
        problemCoverage: 0,
        solutionCompleteness: 0,
        alignmentScore: 0,
        solutionEffectiveness: 0,
        identifiedProblems: [],
        providedSolutions: [],
        alignmentDetails: {
          matchedProblems: [],
          unmatchedProblems: userProblems,
          solutionGaps: userProblems,
          strengthAreas: [],
          improvementAreas: ['Add content to analyze problem-solution alignment']
        },
        recommendations: [
          'Add substantial content that addresses the specified problems',
          'Include clear problem statements and corresponding solutions',
          'Ensure each problem has a dedicated solution section'
        ],
        processingTime: 0
      };
    }

    const startTime = Date.now();

    try {
      const identifiedProblems = this.extractProblems(content);
      const providedSolutions = this.extractSolutions(content);

      const problemCoverage = this.calculateProblemCoverage(identifiedProblems, userProblems);
      const solutionCompleteness = this.assessSolutionCompleteness(providedSolutions);
      const alignmentScore = this.calculateAlignmentScore(identifiedProblems, providedSolutions);
      const gapAnalysis = this.identifyGaps(userProblems, identifiedProblems);
      const solutionEffectiveness = this.scoreSolutionEffectiveness(providedSolutions);

      const processingTimeMs = Date.now() - startTime;

      return {
        problemCoverage,
        solutionCompleteness,
        alignmentScore,
        gapAnalysis,
        solutionEffectiveness,
        identifiedProblems,
        providedSolutions,
        processingTimeMs
      };
    } catch (error) {
      throw new Error(`Problem-solution alignment validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private extractProblems(content: string): ProblemStatement[] {
    const problems: ProblemStatement[] = [];
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);

    sentences.forEach((sentence, index) => {
      const lowerSentence = sentence.toLowerCase();
      
      for (const [type, indicators] of Object.entries(this.problemIndicators)) {
        for (const indicator of indicators) {
          if (lowerSentence.includes(indicator)) {
            const severity = this.assessProblemSeverity(sentence);
            problems.push({
              text: sentence.trim(),
              type: type as ProblemStatement['type'],
              severity,
              location: index
            });
            break; // Only classify each sentence once per type
          }
        }
      }
    });

    return problems;
  }

  private extractSolutions(content: string): SolutionStatement[] {
    const solutions: SolutionStatement[] = [];
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);

    sentences.forEach((sentence, index) => {
      const lowerSentence = sentence.toLowerCase();
      
      for (const [type, indicators] of Object.entries(this.solutionIndicators)) {
        for (const indicator of indicators) {
          if (lowerSentence.includes(indicator)) {
            const completeness = this.assessSolutionCompleteness([{ text: sentence }]);
            const relatedProblems = this.findRelatedProblems(sentence, content);
            
            solutions.push({
              text: sentence.trim(),
              type: type as SolutionStatement['type'],
              completeness,
              location: index,
              relatedProblems
            });
            break; // Only classify each sentence once per type
          }
        }
      }
    });

    return solutions;
  }

  private assessProblemSeverity(sentence: string): 'low' | 'medium' | 'high' {
    const lowerSentence = sentence.toLowerCase();
    
    // High severity indicators
    const highSeverityWords = ['critical', 'urgent', 'major', 'serious', 'severe', 'catastrophic'];
    if (highSeverityWords.some(word => lowerSentence.includes(word))) {
      return 'high';
    }
    
    // Medium severity indicators
    const mediumSeverityWords = ['significant', 'important', 'considerable', 'notable'];
    if (mediumSeverityWords.some(word => lowerSentence.includes(word))) {
      return 'medium';
    }
    
    return 'low';
  }

  private findRelatedProblems(solutionSentence: string, content: string): string[] {
    const relatedProblems: string[] = [];
    const problems = this.extractProblems(content);
    
    // Simple proximity-based matching - in a real implementation, this would use more sophisticated NLP
    problems.forEach(problem => {
      const problemWords = problem.text.toLowerCase().split(/\s+/);
      const solutionWords = solutionSentence.toLowerCase().split(/\s+/);
      
      const commonWords = problemWords.filter(word => 
        solutionWords.includes(word) && word.length > 3
      );
      
      if (commonWords.length > 0) {
        relatedProblems.push(problem.text);
      }
    });
    
    return relatedProblems;
  }

  private calculateProblemCoverage(identifiedProblems: ProblemStatement[], userProblems: string[]): number {
    if (userProblems.length === 0) return 1.0;
    
    const coveredProblems = userProblems.filter(userProblem => {
      return identifiedProblems.some(identified => 
        identified.text.toLowerCase().includes(userProblem.toLowerCase()) ||
        userProblem.toLowerCase().includes(identified.text.toLowerCase())
      );
    });
    
    return coveredProblems.length / userProblems.length;
  }

  private assessSolutionCompleteness(providedSolutions: any[]): number {
    if (providedSolutions.length === 0) return 0.0;
    
    let totalCompleteness = 0;
    
    providedSolutions.forEach(solution => {
      const text = solution.text || solution;
      let completeness = 0.3; // Base score for having a solution
      
      // Check for implementation details
      if (text.toLowerCase().includes('step') || text.toLowerCase().includes('how to')) {
        completeness += 0.3;
      }
      
      // Check for specific instructions
      if (text.includes('implement') || text.includes('apply') || text.includes('use')) {
        completeness += 0.2;
      }
      
      // Check for examples or specifics
      if (text.includes('example') || text.includes('for instance') || text.includes('such as')) {
        completeness += 0.2;
      }
      
      totalCompleteness += Math.min(completeness, 1.0);
    });
    
    return totalCompleteness / providedSolutions.length;
  }

  private calculateAlignmentScore(identifiedProblems: ProblemStatement[], providedSolutions: SolutionStatement[]): number {
    if (identifiedProblems.length === 0 || providedSolutions.length === 0) {
      return 0.0;
    }
    
    let alignmentScore = 0;
    let totalPossibleAlignments = identifiedProblems.length;
    
    identifiedProblems.forEach(problem => {
      const alignedSolutions = providedSolutions.filter(solution => 
        solution.relatedProblems.some(related => 
          related.toLowerCase().includes(problem.text.toLowerCase()) ||
          problem.text.toLowerCase().includes(related.toLowerCase())
        )
      );
      
      if (alignedSolutions.length > 0) {
        // Weight by solution quality
        const avgCompleteness = alignedSolutions.reduce((sum, sol) => sum + sol.completeness, 0) / alignedSolutions.length;
        alignmentScore += avgCompleteness;
      }
    });
    
    return alignmentScore / totalPossibleAlignments;
  }

  private identifyGaps(userProblems: string[], identifiedProblems: ProblemStatement[]): string[] {
    return userProblems.filter(userProblem => {
      return !identifiedProblems.some(identified => 
        identified.text.toLowerCase().includes(userProblem.toLowerCase()) ||
        userProblem.toLowerCase().includes(identified.text.toLowerCase())
      );
    });
  }

  private scoreSolutionEffectiveness(providedSolutions: SolutionStatement[]): number {
    if (providedSolutions.length === 0) return 0.0;
    
    let totalEffectiveness = 0;
    
    providedSolutions.forEach(solution => {
      let effectiveness = solution.completeness * 0.4; // Base from completeness
      
      // Bonus for direct solutions
      if (solution.type === 'direct-solution') {
        effectiveness += 0.3;
      } else if (solution.type === 'best-practice') {
        effectiveness += 0.2;
      } else if (solution.type === 'recommendation') {
        effectiveness += 0.15;
      } else if (solution.type === 'workaround') {
        effectiveness += 0.1;
      }
      
      // Bonus for having related problems (shows relevance)
      if (solution.relatedProblems.length > 0) {
        effectiveness += 0.2;
      }
      
      totalEffectiveness += Math.min(effectiveness, 1.0);
    });
    
    return totalEffectiveness / providedSolutions.length;
  }

  /**
   * Get alignment statistics for reporting
   */
  getAlignmentStats(analysis: AlignmentAnalysis): {
    problemsIdentified: number;
    solutionsProvided: number;
    averageSolutionCompleteness: number;
    criticalProblemsCount: number;
    gapsCount: number;
  } {
    return {
      problemsIdentified: analysis.identifiedProblems.length,
      solutionsProvided: analysis.providedSolutions.length,
      averageSolutionCompleteness: analysis.solutionCompleteness,
      criticalProblemsCount: analysis.identifiedProblems.filter(p => p.severity === 'high').length,
      gapsCount: analysis.gapAnalysis.length
    };
  }
}
