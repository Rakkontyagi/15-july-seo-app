
export function analyzeSentenceLengthDistribution(content: string): { length: number; count: number }[] {
  const sentences = content.split(/[.!?]+\s*/).filter(s => s.trim().length > 0);
  const lengths = sentences.map(s => s.split(/\s+/).length);
  const distribution: { [key: number]: number } = {};

  lengths.forEach(len => {
    distribution[len] = (distribution[len] || 0) + 1;
  });

  return Object.keys(distribution).map(len => ({
    length: parseInt(len),
    count: distribution[parseInt(len)],
  })).sort((a, b) => a.length - b.length);
}
