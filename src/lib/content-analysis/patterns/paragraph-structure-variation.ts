export function analyzeParagraphStructureVariation(content: string): { length: number; count: number }[] {
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const lengths = paragraphs.map(p => p.split(/\s+/).length);
  const distribution: { [key: number]: number } = {};

  lengths.forEach(len => {
    distribution[len] = (distribution[len] || 0) + 1;
  });

  return Object.keys(distribution).map(len => ({
    length: parseInt(len),
    count: distribution[parseInt(len)],
  })).sort((a, b) => a.length - b.length);
}