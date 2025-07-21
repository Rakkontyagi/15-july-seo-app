export interface Heading {
  level: number;
  text: string;
}

export interface HeadingAnalysis {
  totalHeadings: number;
  optimizedHeadings: number;
  optimizationScore: number;
  headingLengths: number[];
  headingStructureScore: number;
}

export function analyzeHeadings(headings: Heading[], keyword: string): HeadingAnalysis {
  if (!headings || headings.length === 0 || !keyword) {
    return { totalHeadings: 0, optimizedHeadings: 0, optimizationScore: 0, headingLengths: [], headingStructureScore: 0 };
  }

  const optimizedHeadings = headings.filter(h => h.text.toLowerCase().includes(keyword.toLowerCase()));
  const headingLengths = headings.map(h => h.text.length);

  // Simple heading structure score: penalize skipping levels (e.g., H1 to H3)
  let headingStructureScore = 100;
  for (let i = 1; i < headings.length; i++) {
    if (headings[i].level > headings[i - 1].level + 1) {
      headingStructureScore -= 10; // Penalize skipping a level
    }
  }
  headingStructureScore = Math.max(0, headingStructureScore);

  return {
    totalHeadings: headings.length,
    optimizedHeadings: optimizedHeadings.length,
    optimizationScore: (optimizedHeadings.length / headings.length) * 100,
    headingLengths,
    headingStructureScore,
  };
}