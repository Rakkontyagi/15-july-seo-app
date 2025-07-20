export interface HumanWritingPatternAnalysis {
  sentenceVarietyScore: number; // 0-100
  paragraphCohesionScore: number; // 0-100
  authenticVoiceScore: number; // 0-100
  aiDetectionRisk: number; // 0-100, higher means more likely to be detected
  humanLikeQuirksDetected: string[];
  aiPatternsDetected: string[];
  recommendations: string[];
}

export class HumanWritingPatternAnalyzer {
  analyze(content: string): HumanWritingPatternAnalysis {
    const recommendations: string[] = [];
    const aiPatternsDetected: string[] = [];
    const humanLikeQuirksDetected: string[] = [];

    const sentences = content.split(/[.!?\n]/).filter(s => s.trim().length > 0);
    const words = content.split(/\s+/).filter(w => w.length > 0);
    const lowerContent = content.toLowerCase();

    // 1. Sentence Variety Score (based on sentence length variance)
    const sentenceLengths = sentences.map(s => s.split(/\s+/).length);
    const avgSentenceLength = sentenceLengths.reduce((sum, len) => sum + len, 0) / sentenceLengths.length;
    const variance = sentenceLengths.reduce((sum, len) => sum + Math.pow(len - avgSentenceLength, 2), 0) / sentenceLengths.length;
    const sentenceVarietyScore = Math.min(100, Math.max(0, 100 - (variance * 2))); // Higher variance = higher score
    if (sentenceVarietyScore < 50) {
      recommendations.push('Vary sentence length to improve human-like flow.');
    }

    // 2. Paragraph Cohesion Score (placeholder - would need advanced NLP for true cohesion)
    const paragraphCohesionScore = 75; // Assume reasonable for now

    // 3. Authentic Voice Score (looking for personal touches, opinions, less formal)
    let authenticVoiceScore = 50;
    if (lowerContent.match(/\b(?:i think|i believe|my opinion|personally|i've found)\b/)) {
      authenticVoiceScore += 15;
      humanLikeQuirksDetected.push('Use of personal pronouns and opinions.');
    }
    if (lowerContent.match(/\b(?:you|your)\b/)) {
      authenticVoiceScore += 10;
      humanLikeQuirksDetected.push('Direct address to the reader.');
    }
    if (lowerContent.match(/\b(?:for example|for instance|such as)\b/)) {
      authenticVoiceScore += 5;
      humanLikeQuirksDetected.push('Use of examples.');
    }
    authenticVoiceScore = Math.min(100, authenticVoiceScore);
    if (authenticVoiceScore < 70) {
      recommendations.push('Inject more personal voice and direct address to the reader.');
    }

    // 4. AI Detection Risk & Patterns Detected
    let aiDetectionRisk = 0;

    // Pattern: Overly formal or academic tone
    const formalWords = ['furthermore', 'moreover', 'thus', 'hence', 'consequently', 'heretofore'];
    const formalWordCount = words.filter(word => formalWords.includes(word.toLowerCase())).length;
    if (formalWordCount > words.length * 0.01) { // More than 1% formal words
      aiPatternsDetected.push('Overly formal or academic tone.');
      aiDetectionRisk += 15;
      recommendations.push('Introduce more natural, conversational language.');
    }

    // Pattern: Repetitive sentence beginnings
    const sentenceStarts = sentences.map(s => s.trim().split(' ')[0]?.toLowerCase());
    const startFrequency: { [key: string]: number } = {};
    sentenceStarts.forEach(start => { startFrequency[start] = (startFrequency[start] || 0) + 1; });
    const maxStartFreq = Math.max(...Object.values(startFrequency));
    if (maxStartFreq > sentences.length * 0.2) { // More than 20% sentences start with the same word
      aiPatternsDetected.push('Repetitive sentence beginnings.');
      aiDetectionRisk += 10;
      recommendations.push('Vary sentence starting words and phrases.');
    }

    // Pattern: Lack of contractions
    const contractions = ["don't", "can't", "won't", "it's", "they're", "i'm", "you're"];
    const hasContractions = contractions.some(c => lowerContent.includes(c));
    if (!hasContractions && words.length > 100) { // Only check for longer content
      aiPatternsDetected.push('Lack of contractions.');
      aiDetectionRisk += 5;
      recommendations.push('Use contractions naturally to sound more human.');
    }

    // Pattern: Overly perfect grammar/syntax (absence of minor human errors)
    // This is a heuristic. If the content is *too* perfect, it might be AI.
    // This is hard to quantify without a robust grammar checker.
    // For now, we'll use a very simple proxy: if no grammar issues were flagged by quality checker, and other AI patterns exist.
    // (This would ideally be integrated with the grammar checker's output)
    // if (qualityChecker.grammarScore === 100 && aiPatternsDetected.length > 0) {
    //   aiPatternsDetected.push('Content is grammatically perfect (may indicate AI).');
    //   aiDetectionRisk += 5;
    // }

    // Pattern: Generic or vague phrasing
    const genericPhrases = ["in today's world", "in the modern era", "it is important to understand", "unlock the potential"];
    if (genericPhrases.some(phrase => lowerContent.includes(phrase))) {
      aiPatternsDetected.push('Generic or vague phrasing detected.');
      aiDetectionRisk += 10;
      recommendations.push('Be more specific and provide concrete examples.');
    }

    // Pattern: Lack of anecdotes or personal stories
    if (!lowerContent.match(/\b(?:anecdote|story|experience|personal account)\b/)) {
      aiPatternsDetected.push('Lack of personal anecdotes or stories.');
      aiDetectionRisk += 5;
      recommendations.push('Incorporate personal stories or anecdotes to make content more relatable.');
    }

    aiDetectionRisk = Math.min(100, aiDetectionRisk);

    return {
      sentenceVarietyScore,
      paragraphCohesionScore,
      authenticVoiceScore,
      aiDetectionRisk,
      humanLikeQuirksDetected,
      aiPatternsDetected,
      recommendations,
    };
  }
}
