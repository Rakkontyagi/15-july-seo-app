
import nlp from 'compromise';

export class SemanticAnalyzer {
  analyzeContent(content: string): any {
    const doc = nlp(content);
    return {
      topics: doc.topics().json(),
      entities: doc.entities().json(),
      sentences: doc.sentences().json(),
    };
  }

  identifyTopicalRelationships(content1: string, content2: string): number {
    const doc1 = nlp(content1);
    const doc2 = nlp(content2);

    const topics1 = doc1.topics().out('array');
    const topics2 = doc2.topics().out('array');

    const commonTopics = topics1.filter((topic: string) => topics2.includes(topic));

    return commonTopics.length / Math.max(topics1.length, topics2.length);
  }
}
