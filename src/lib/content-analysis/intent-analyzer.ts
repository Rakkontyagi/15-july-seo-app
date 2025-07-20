
import nlp from 'compromise';

export interface IntentAnalysis {
  primaryIntent: string;
  secondaryIntents: string[];
  intentConfidence: number;
  contentRequirements: string[];
}

export class UserIntentAnalyzer {
  private intentSignals = {
    informational: ['what', 'how', 'why', 'when', 'where', 'guide', 'tutorial', 'explain', 'definition', 'example'],
    commercial: ['best', 'top', 'review', 'compare', 'vs', 'alternative', 'price', 'cost', 'deal', 'discount'],
    navigational: ['login', 'contact', 'about', 'homepage', 'site', 'brand', 'company'],
    transactional: ['buy', 'purchase', 'order', 'shop', 'coupon', 'sale', 'checkout', 'cart', 'payment']
  };

  classifyIntent(keyword: string, context: string = ''): IntentAnalysis {
    const allText = `${keyword} ${context}`.toLowerCase();
    const doc = nlp(allText);

    const intentScores: { [key: string]: number } = {
      informational: 0,
      commercial: 0,
      navigational: 0,
      transactional: 0,
    };

    for (const intentType in this.intentSignals) {
      (this.intentSignals as any)[intentType].forEach((signal: string) => {
        if (allText.includes(signal)) {
          intentScores[intentType] += 1;
        }
      });
    }

    const sortedIntents = Object.entries(intentScores).sort(([, scoreA], [, scoreB]) => scoreB - scoreA);

    const primaryIntent = sortedIntents[0][0];
    const secondaryIntents = sortedIntents.slice(1).filter(([, score]) => score > 0).map(([intent]) => intent);

    const totalSignals = Object.values(intentScores).reduce((sum, score) => sum + score, 0);
    const intentConfidence = totalSignals > 0 ? (intentScores[primaryIntent] / totalSignals) : 0;

    const contentRequirements = intentConfidence > 0 ? this.generateContentRequirements(primaryIntent) : [];

    return {
      primaryIntent,
      secondaryIntents,
      intentConfidence,
      contentRequirements,
    };
  }

  private generateContentRequirements(primaryIntent: string): string[] {
    switch (primaryIntent) {
      case 'informational':
        return ['Provide comprehensive answers', 'Include definitions and explanations', 'Offer step-by-step guides'];
      case 'commercial':
        return ['Highlight product benefits', 'Include comparisons and reviews', 'Address common objections'];
      case 'navigational':
        return ['Provide clear links to relevant pages', 'Ensure easy access to contact information'];
      case 'transactional':
        return ['Include clear calls to action', 'Show pricing and availability', 'Streamline purchase process'];
      default:
        return [];
    }
  }
}
