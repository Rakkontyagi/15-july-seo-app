export function analyzeParagraphStructureVariation(content: string): {
  distribution: { length: number; count: number }[];
  variance: number;
  averageLength: number;
} {
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const lengths = paragraphs.map(p => p.split(/\s+/).length);

  if (lengths.length === 0) {
    return { distribution: [], variance: 0, averageLength: 0 };
  }

  const averageLength = lengths.reduce((sum, len) => sum + len, 0) / lengths.length;
  const variance = lengths.reduce((sum, len) => sum + Math.pow(len - averageLength, 2), 0) / lengths.length;

  const distributionMap: { [key: number]: number } = {};
  lengths.forEach(len => {
    distributionMap[len] = (distributionMap[len] || 0) + 1;
  });

  const distribution = Object.keys(distributionMap).map(len => ({
    length: parseInt(len),
    count: distributionMap[parseInt(len)],
  })).sort((a, b) => a.length - b.length);

  return { distribution, variance, averageLength };
}