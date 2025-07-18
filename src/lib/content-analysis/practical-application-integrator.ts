export class PracticalApplicationIntegrator {
  addStepByStepGuidance(content: string, steps: string[]): string {
    let newContent = content;
    if (steps.length > 0) {
      newContent += "\n\nHere's a step-by-step guide:\n";
      steps.forEach((step, index) => {
        newContent += `${index + 1}. ${step}\n`;
      });
    }
    return newContent;
  }

  addRealWorldExamples(content: string, examples: string[]): string {
    let newContent = content;
    if (examples.length > 0) {
      newContent += "\n\nReal-world examples:\n";
      examples.forEach(example => {
        newContent += `- ${example}\n`;
      });
    }
    return newContent;
  }
}
