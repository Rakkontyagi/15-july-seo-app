export function integrateExperienceBasedExample(content: string, example: string): string {
  const paragraphs = content.split(/\n\s*\n/);
  if (paragraphs.length > 1) {
    // Insert example after the first paragraph as an example
    return `${paragraphs[0]}\n\n${example}\n\n${paragraphs.slice(1).join('\n\n')}`;
  }
  return `${content}\n\n${example}`;
}