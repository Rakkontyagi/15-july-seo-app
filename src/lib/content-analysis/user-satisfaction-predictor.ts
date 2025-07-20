
import Sentiment from 'sentiment';

export class UserSatisfactionPredictor {
  private sentiment: Sentiment;

  constructor() {
    this.sentiment = new Sentiment();
  }

  predictSatisfaction(content: string): number {
    if (!content || content.trim().length === 0) {
      return 50; // Neutral satisfaction for empty content
    }

    const result = this.sentiment.analyze(content);

    // Handle undefined result
    if (!result || typeof result.score === 'undefined') {
      return 50; // Neutral satisfaction if analysis fails
    }

    // Simple prediction: higher sentiment score means higher satisfaction
    // Scale sentiment score (-5 to +5) to a percentage (0-100)
    const normalizedScore = Math.max(-5, Math.min(5, result.score)); // Clamp to -5 to +5
    return ((normalizedScore + 5) / 10) * 100;
  }
}
