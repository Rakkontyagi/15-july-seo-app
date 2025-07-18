import { LanguageServiceClient } from '@google-cloud/language';
import Sentiment from 'sentiment';

export interface Entity {
  name: string;
  type: string;
  salience: number;
  mentions: Array<{ text: string; beginOffset: number; sentiment?: number }>;
  frequency: number;
  isCustom?: boolean;
  sentimentScore?: number; // Overall sentiment score for the entity
  sentimentComparative?: number; // Comparative sentiment score
}

export interface EntityRelationship {
  entity1: string;
  entity2: string;
  coOccurrenceCount: number;
  sentences: string[];
}

// Define some example custom entities for demonstration
const CUSTOM_ENTITIES: { [key: string]: string } = {
  'SEO Automation App': 'PRODUCT',
  'Serper.dev': 'ORGANIZATION',
  'Firecrawl': 'ORGANIZATION',
  'Supabase': 'ORGANIZATION',
  'GPT-4': 'OTHER',
  'E-E-A-T': 'OTHER',
};

export async function analyzeEntities(text: string): Promise<{ entities: Entity[]; relationships: EntityRelationship[] }> {
  if (!text) {
    return { entities: [], relationships: [] };
  }

  const languageClient = new LanguageServiceClient();
  const sentimentAnalyzer = new Sentiment();

  const document = {
    content: text,
    type: 'PLAIN_TEXT' as const,
  };

  const [nlpResult] = await languageClient.analyzeEntities({ document });
  const [sentimentResult] = await languageClient.analyzeSentiment({ document });

  const entitiesMap = new Map<string, Entity>();

  // Process entities from Google NLP
  nlpResult.entities?.forEach(nlpEntity => {
    const name = nlpEntity.name || '';
    const type = nlpEntity.type || '';
    const salience = nlpEntity.salience || 0;
    const mentions = nlpEntity.mentions?.map(m => {
      const mentionText = m.text?.content || '';
      const mentionSentiment = sentimentAnalyzer.analyze(mentionText).score;
      return { text: mentionText, beginOffset: m.text?.beginOffset || 0, sentiment: mentionSentiment };
    }) || [];

    if (entitiesMap.has(name)) {
      const existingEntity = entitiesMap.get(name)!;
      existingEntity.frequency++;
      existingEntity.mentions.push(...mentions);
      // Update salience if new one is higher (simple prominence)
      if (salience > existingEntity.salience) {
        existingEntity.salience = salience;
      }
      // Aggregate sentiment
      existingEntity.sentimentScore = (existingEntity.sentimentScore || 0) + (mentions[0]?.sentiment || 0);
    } else {
      entitiesMap.set(name, {
        name,
        type,
        salience,
        mentions,
        frequency: 1,
        sentimentScore: mentions[0]?.sentiment || 0,
      });
    }
  });

  // Add custom entities and update frequency/prominence if they overlap
  for (const customName in CUSTOM_ENTITIES) {
    if (text.includes(customName)) {
      const customType = CUSTOM_ENTITIES[customName];
      const regex = new RegExp(customName, 'gi');
      let match;
      let customFrequency = 0;
      const customMentions: Array<{ text: string; beginOffset: number; sentiment?: number }> = [];
      let customSentimentScore = 0;

      while ((match = regex.exec(text)) !== null) {
        customFrequency++;
        const mentionText = match[0];
        const mentionSentiment = sentimentAnalyzer.analyze(mentionText).score;
        customMentions.push({ text: mentionText, beginOffset: match.index, sentiment: mentionSentiment });
        customSentimentScore += mentionSentiment;
      }

      if (entitiesMap.has(customName)) {
        const existingEntity = entitiesMap.get(customName)!;
        existingEntity.frequency += customFrequency;
        existingEntity.mentions.push(...customMentions);
        existingEntity.isCustom = true;
        existingEntity.sentimentScore = (existingEntity.sentimentScore || 0) + customSentimentScore;
        // Simple prominence boost for custom entities
        existingEntity.salience = Math.min(1, existingEntity.salience + 0.1 * customFrequency);
      } else {
        entitiesMap.set(customName, {
          name: customName,
          type: customType,
          salience: 0.5 + 0.1 * customFrequency, // Base salience for custom entities
          mentions: customMentions,
          frequency: customFrequency,
          isCustom: true,
          sentimentScore: customSentimentScore,
        });
      }
    }
  }

  // Calculate comparative sentiment for each entity
  Array.from(entitiesMap.values()).forEach(entity => {
    if (entity.frequency > 0) {
      entity.sentimentComparative = (entity.sentimentScore || 0) / entity.frequency;
    }
  });

  // Co-occurrence and relationship mapping
  const relationshipsMap = new Map<string, EntityRelationship>();
  const sentences = text.split(/[.!?\n]/).filter(s => s.trim().length > 0);

  sentences.forEach(sentence => {
    const entitiesInSentence = Array.from(entitiesMap.values()).filter(entity => 
      sentence.toLowerCase().includes(entity.name.toLowerCase())
    );

    if (entitiesInSentence.length > 1) {
      for (let i = 0; i < entitiesInSentence.length; i++) {
        for (let j = i + 1; j < entitiesInSentence.length; j++) {
          const entity1 = entitiesInSentence[i];
          const entity2 = entitiesInSentence[j];

          // Ensure consistent key for relationship (e.g., alphabetical order)
          const key = [entity1.name, entity2.name].sort().join('--');

          if (relationshipsMap.has(key)) {
            const existingRelationship = relationshipsMap.get(key)!;
            existingRelationship.coOccurrenceCount++;
            existingRelationship.sentences.push(sentence);
          } else {
            relationshipsMap.set(key, {
              entity1: entity1.name,
              entity2: entity2.name,
              coOccurrenceCount: 1,
              sentences: [sentence],
            });
          }
        }
      }
    }
  });

  return { entities: Array.from(entitiesMap.values()), relationships: Array.from(relationshipsMap.values()) };
}
