export class KeywordIntegrator {
  /**
   * Adjusts the primary keyword density of content to match a target percentage.
   * This is a simplified, rule-based approach. More advanced methods would involve
   * semantic understanding and content rewriting.
   * @param content The original content string.
   * @param keyword The primary keyword.
   * @param targetDensity The desired keyword density percentage (e.g., 2.5 for 2.5%).
   * @returns The content with adjusted keyword density.
   */
  adjustKeywordDensity(content: string, keyword: string, targetDensity: number): string {
    const words = content.split(/\s+/);
    const currentKeywordCount = words.filter(word => word.toLowerCase().includes(keyword.toLowerCase())).length;
    const totalWords = words.length;
    const currentDensity = (currentKeywordCount / totalWords) * 100;

    if (currentDensity === targetDensity) {
      return content; // Already at target density
    }

    const targetKeywordCount = Math.round((targetDensity / 100) * totalWords);
    let newContentWords = [...words];

    if (currentDensity < targetDensity) {
      // Add keywords
      const keywordsToAdd = targetKeywordCount - currentKeywordCount;
      for (let i = 0; i < keywordsToAdd; i++) {
        // Simple insertion: find a random spot that doesn't break flow too much
        const randomIndex = Math.floor(Math.random() * newContentWords.length);
        newContentWords.splice(randomIndex, 0, keyword); // Insert the keyword
      }
    } else if (currentDensity > targetDensity) {
      // Remove keywords
      const keywordsToRemove = currentKeywordCount - targetKeywordCount;
      let removedCount = 0;
      newContentWords = newContentWords.filter(word => {
        if (word.toLowerCase().includes(keyword.toLowerCase()) && removedCount < keywordsToRemove) {
          removedCount++;
          return false; // Remove this instance
        }
        return true;
      });
    }

    return newContentWords.join(' ');
  }

  /**
   * Strategically places keywords in content based on common SEO practices.
   * This is a very basic implementation.
   * @param content The content string.
   * @param keyword The keyword to place.
   * @returns Content with strategically placed keywords.
   */
  strategicKeywordPlacement(content: string, keyword: string): string {
    let modifiedContent = content;

    // Ensure keyword in first paragraph (if not already there)
    const paragraphs = modifiedContent.split(/\n\s*\n/);
    if (paragraphs.length > 0 && !paragraphs[0].toLowerCase().includes(keyword.toLowerCase())) {
      paragraphs[0] = `${keyword}. ${paragraphs[0]}`;
      modifiedContent = paragraphs.join('\n\n');
    }

    // Ensure keyword in conclusion (if not already there)
    if (paragraphs.length > 1 && !paragraphs[paragraphs.length - 1].toLowerCase().includes(keyword.toLowerCase())) {
      paragraphs[paragraphs.length - 1] = `${paragraphs[paragraphs.length - 1]} ${keyword}.`;
      modifiedContent = paragraphs.join('\n\n');
    }

    return modifiedContent;
  }

  /**
   * Distributes LSI keywords throughout the content.
   * This is a simplified, rule-based approach.
   * @param content The original content string.
   * @param lsiKeywords A list of LSI keywords to distribute.
   * @param targetLsiFrequency The desired frequency for each LSI keyword (e.g., 1-2 times).
   * @returns The content with LSI keywords distributed.
   */
  distributeLsiKeywords(content: string, lsiKeywords: string[], targetLsiFrequency: number = 1): string {
    let modifiedContent = content;
    const sentences = modifiedContent.split(/([.!?]\s*)/);

    lsiKeywords.forEach(lsi => {
      let currentLsiCount = (modifiedContent.toLowerCase().match(new RegExp(`\\b${lsi.toLowerCase()}\\b`, 'g')) || []).length;
      let lsiAdded = 0;

      // Add LSI keywords if current count is less than target frequency
      while (currentLsiCount < targetLsiFrequency && lsiAdded < targetLsiFrequency) {
        // Find a random sentence to insert the LSI keyword
        const randomIndex = Math.floor(Math.random() * sentences.length);
        const sentenceToModify = sentences[randomIndex];

        if (sentenceToModify && !sentenceToModify.toLowerCase().includes(lsi.toLowerCase())) {
          // Simple insertion at the end of the sentence
          sentences[randomIndex] = `${sentenceToModify.trim()} ${lsi}.`;
          lsiAdded++;
          currentLsiCount++;
        }
      }
    });

    return sentences.join('');
  }

  /**
   * Integrates entities into the content naturally.
   * This is a simplified, rule-based approach.
   * @param content The original content string.
   * @param entities A list of entities to integrate.
   * @returns The content with entities integrated.
   */
  integrateEntities(content: string, entities: { name: string; type: string }[]): string {
    let modifiedContent = content;
    const paragraphs = modifiedContent.split(/\n\s*\n/);

    entities.forEach(entity => {
      const entityLower = entity.name.toLowerCase();
      if (!modifiedContent.toLowerCase().includes(entityLower)) {
        // Find a random paragraph to insert the entity
        const randomIndex = Math.floor(Math.random() * paragraphs.length);
        if (paragraphs[randomIndex]) {
          paragraphs[randomIndex] = `${entity.name}. ${paragraphs[randomIndex]}`;
        }
      }
    });

    return paragraphs.join('\n\n');
  }

  /**
   * Optimizes headings by ensuring a target number of headings contain the keyword.
   * This is a simplified, rule-based approach.
   * @param content The content string.
   * @param keyword The keyword to optimize for.
   * @param targetOptimizedHeadingsCount The desired number of headings containing the keyword.
   * @returns The content with optimized headings.
   */
  optimizeHeadings(content: string, keyword: string, targetOptimizedHeadingsCount: number): string {
    const lines = content.split('\n');
    const keywordLower = keyword.toLowerCase();
    let currentOptimizedHeadings = 0;

    // First pass: count existing optimized headings
    lines.forEach(line => {
      if (line.match(/^#{1,6}\s/) && line.toLowerCase().includes(keywordLower)) {
        currentOptimizedHeadings++;
      }
    });

    let modifiedLines = [...lines];

    if (currentOptimizedHeadings < targetOptimizedHeadingsCount) {
      // Add keyword to headings
      let headingsAdded = 0;
      for (let i = 0; i < modifiedLines.length && headingsAdded < (targetOptimizedHeadingsCount - currentOptimizedHeadings); i++) {
        if (modifiedLines[i].match(/^#{1,6}\s/) && !modifiedLines[i].toLowerCase().includes(keywordLower)) {
          // Simple insertion: add keyword to the end of the heading
          modifiedLines[i] = `${modifiedLines[i]} ${keyword}`;
          headingsAdded++;
        }
      }
    } else if (currentOptimizedHeadings > targetOptimizedHeadingsCount) {
      // Remove keyword from headings
      let headingsRemoved = 0;
      for (let i = 0; i < modifiedLines.length && headingsRemoved < (currentOptimizedHeadings - targetOptimizedHeadingsCount); i++) {
        if (modifiedLines[i].match(/^#{1,6}\s/) && modifiedLines[i].toLowerCase().includes(keywordLower)) {
          // Simple removal: remove the first occurrence of the keyword
          modifiedLines[i] = modifiedLines[i].replace(new RegExp(` ${keyword}`, 'i'), '');
          headingsRemoved++;
        }
      }
    }

    return modifiedLines.join('\n');
  }

  /**
   * Incorporates keyword variations into the content.
   * @param content The original content string.
   * @param variations A list of keyword variations.
   * @param targetFrequency The desired frequency for each variation (e.g., 1-2 times).
   * @returns The content with keyword variations incorporated.
   */
  incorporateKeywordVariations(content: string, variations: string[], targetFrequency: number = 1): string {
    let modifiedContent = content;
    const sentences = modifiedContent.split(/([.!?]\s*)/);

    variations.forEach(variation => {
      let currentCount = (modifiedContent.toLowerCase().match(new RegExp(`\\b${variation.toLowerCase()}\\b`, 'g')) || []).length;
      let addedCount = 0;

      while (currentCount < targetFrequency && addedCount < targetFrequency) {
        const randomIndex = Math.floor(Math.random() * sentences.length);
        const sentenceToModify = sentences[randomIndex];

        if (sentenceToModify && !sentenceToModify.toLowerCase().includes(variation.toLowerCase())) {
          sentences[randomIndex] = `${sentenceToModify.trim()} ${variation}.`;
          addedCount++;
          currentCount++;
        }
      }
    });

    return sentences.join('');
  }

  /**
   * Incorporates related keywords into the content at optimal density ratios.
   * @param content The original content string.
   * @param relatedKeywords A list of related keywords.
   * @param targetDensityRatio The desired density ratio for each related keyword (e.g., 0.005 for 0.5%).
   * @returns The content with related keywords incorporated.
   */
  incorporateRelatedKeywords(content: string, relatedKeywords: string[], targetDensityRatio: number = 0.005): string {
    let modifiedContent = content;
    const words = modifiedContent.split(/\s+/);
    const totalWords = words.length;

    relatedKeywords.forEach(relatedKeyword => {
      const relatedKeywordLower = relatedKeyword.toLowerCase();
      let currentCount = (modifiedContent.toLowerCase().match(new RegExp(`\\b${relatedKeywordLower}\\b`, 'g')) || []).length;
      const targetCount = Math.round(totalWords * targetDensityRatio);
      let addedCount = 0;

      if (currentCount < targetCount) {
        const keywordsToAdd = targetCount - currentCount;
        for (let i = 0; i < keywordsToAdd; i++) {
          const randomIndex = Math.floor(Math.random() * words.length);
          words.splice(randomIndex, 0, relatedKeyword);
          addedCount++;
        }
      } else if (currentCount > targetCount) {
      let removedCount = 0;
      modifiedContent = words.filter(word => {
        if (word.toLowerCase().includes(relatedKeywordLower) && removedCount < (currentCount - targetCount)) {
          removedCount++;
          return false;
        }
        return true;
      }).join(' ');
    }
    });

    return words.join(' ');
  }

  /**
   * Verifies content balance and natural flow after optimization.
   * This is a simplified, rule-based approach.
   * @param content The content string.
   * @returns An array of issues found.
   */
  verifyContentBalance(content: string): string[] {
    const issues: string[] = [];

    // Check for keyword repetition (simple: more than 3 times in a row)
    const words = content.split(/\s+/);
    for (let i = 0; i < words.length - 2; i++) {
      if (words[i].toLowerCase() === words[i+1].toLowerCase() && words[i+1].toLowerCase() === words[i+2].toLowerCase()) {
        issues.push(`Excessive repetition of "${words[i]}" detected.`);
        break;
      }
    }

    // Check for unnatural sentence structures (simplified: very short sentences followed by very long ones)
    const sentences = content.split(/[.!?]/).filter(s => s.trim().length > 0);
    const sentenceLengths = sentences.map(s => s.split(/\s+/).length);
    for (let i = 0; i < sentenceLengths.length - 1; i++) {
      if (sentenceLengths[i] < 5 && sentenceLengths[i+1] > 25) {
        issues.push(`Potential unnatural sentence flow: very short sentence followed by very long one.`);
        break;
      }
    }

    // Check for abrupt topic shifts (simplified: look for lack of transition words after optimization)
    // This is hard to do without deeper NLP, so a very basic check.
    const transitionWords = ["however", "therefore", "in addition", "consequently"];
    let transitionWordCount = 0;
    sentences.forEach(s => {
      if (transitionWords.some(tw => s.toLowerCase().includes(tw))) {
        transitionWordCount++;
      }
    });
    if (sentences.length > 5 && transitionWordCount / sentences.length < 0.1) { // Less than 10% sentences have transition words
      issues.push('Content might lack smooth transitions between ideas.');
    }

    return issues;
  }
}