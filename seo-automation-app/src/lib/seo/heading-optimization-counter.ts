
import { Heading } from './heading-analyzer';

export interface HeadingMetrics {
  totalHeadings: number;
  keywordOptimizedHeadings: number;
  lsiOptimizedHeadings: number;
  optimizationPercentage: number;
  headingBreakdown: { [key: string]: number };
}

export class HeadingOptimizationCounter {
  countKeywordInHeadings(headings: Heading[], keyword: string): number {
    const keywordLower = keyword.toLowerCase();
    return headings.filter(h => h.text.toLowerCase().includes(keywordLower)).length;
  }

  countLSIInHeadings(headings: Heading[], lsiTerms: string[]): number {
    let count = 0;
    const lsiTermsLower = lsiTerms.map(term => term.toLowerCase());
    headings.forEach(heading => {
      const headingLower = heading.text.toLowerCase();
      if (lsiTermsLower.some(lsi => headingLower.includes(lsi))) {
        count++;
      }
    });
    return count;
  }

  countOptimizedHeadings(headings: Heading[], keyword: string, lsiTerms: string[]): HeadingMetrics {
    const h1Count = this.countKeywordInHeadings(headings.filter(h => h.level === 1), keyword);
    const h2Count = this.countKeywordInHeadings(headings.filter(h => h.level === 2), keyword);
    const h3Count = this.countKeywordInHeadings(headings.filter(h => h.level === 3), keyword);
    
    const lsiInHeadings = this.countLSIInHeadings(headings, lsiTerms);
    
    const keywordOptimizedHeadings = h1Count + h2Count + h3Count;
    const optimizationPercentage = headings.length > 0 ? Number(((keywordOptimizedHeadings / headings.length) * 100).toFixed(1)) : 0;

    const headingBreakdown: { [key: string]: number } = {};
    headings.forEach(h => {
      headingBreakdown[`h${h.level}`] = (headingBreakdown[`h${h.level}`] || 0) + 1;
    });

    return {
      totalHeadings: headings.length,
      keywordOptimizedHeadings,
      lsiOptimizedHeadings: lsiInHeadings,
      optimizationPercentage,
      headingBreakdown,
    };
  }
}
