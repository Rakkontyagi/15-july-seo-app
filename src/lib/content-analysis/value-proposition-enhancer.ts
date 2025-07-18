export class ValuePropositionEnhancer {
  enhanceBenefits(content: string, benefits: string[]): string {
    let newContent = content;
    if (benefits.length > 0) {
      newContent += "\n\nBenefits you'll gain:\n";
      benefits.forEach(benefit => {
        newContent += `- ${benefit}\n`;
      });
    }
    return newContent;
  }

  clarifyOutcomes(content: string, outcomes: string[]): string {
    let newContent = content;
    if (outcomes.length > 0) {
      newContent += "\n\nExpected outcomes:\n";
      outcomes.forEach(outcome => {
        newContent += `- ${outcome}\n`;
      });
    }
    return newContent;
  }
}
