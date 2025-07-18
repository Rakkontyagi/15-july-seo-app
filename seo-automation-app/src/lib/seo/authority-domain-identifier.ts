
export interface AuthorityDomain {
  domain: string;
  type: 'wikipedia' | 'government' | 'industry' | 'academic' | 'news' | 'other';
  credibilityScore: number; // 0-100
  reasoning: string[];
}

export class AuthorityDomainIdentifier {
  private predefinedAuthorityDomains: AuthorityDomain[] = [
    { domain: 'wikipedia.org', type: 'wikipedia', credibilityScore: 90, reasoning: ['Crowd-sourced, widely referenced encyclopedia.'] },
    { domain: 'gov', type: 'government', credibilityScore: 95, reasoning: ['Official government information.'] },
    { domain: 'edu', type: 'academic', credibilityScore: 85, reasoning: ['Educational institutions, often research-based.'] },
    // Add more specific industry or news domains as needed
    { domain: 'nytimes.com', type: 'news', credibilityScore: 80, reasoning: ['Reputable news organization.'] },
    { domain: 'wsj.com', type: 'news', credibilityScore: 85, reasoning: ['Reputable financial news organization.'] },
  ];

  /**
   * Identifies authority domains from a given URL or text.
   * This is a simplified, rule-based approach. A comprehensive solution would involve
   * external APIs for domain authority metrics (e.g., Moz, Ahrefs) and advanced NLP.
   * @param urlOrText The URL string or a piece of text that might contain domains.
   * @returns An array of identified AuthorityDomain objects.
   */
  identify(urlOrText: string): AuthorityDomain[] {
    const identifiedDomains: AuthorityDomain[] = [];
    const lowerUrlOrText = urlOrText.toLowerCase();

    // Check for direct domain matches or TLDs
    this.predefinedAuthorityDomains.forEach(authDomain => {
      if (lowerUrlOrText.includes(authDomain.domain)) {
        identifiedDomains.push(authDomain);
      }
    });

    // Basic regex to find potential domains in text
    const domainRegex = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9.-]+\.(?:com|org|net|gov|edu|co\.uk|ae|com\.au|ca|in|jp|br))\b/g;
    let match;
    while ((match = domainRegex.exec(lowerUrlOrText)) !== null) {
      const extractedDomain = match[1];
      // Check if it's already identified or a new one
      if (!identifiedDomains.some(ad => ad.domain === extractedDomain)) {
        let type: AuthorityDomain['type'] = 'other';
        let credibilityScore = 50;
        const reasoning: string[] = ['Extracted from text/URL.'];

        if (extractedDomain.endsWith('.gov')) { type = 'government'; credibilityScore = 90; }
        else if (extractedDomain.endsWith('.edu')) { type = 'academic'; credibilityScore = 80; }
        else if (extractedDomain.includes('wikipedia.org')) { type = 'wikipedia'; credibilityScore = 85; }
        // Add more rules for industry/news based on keywords in domain or URL

        identifiedDomains.push({
          domain: extractedDomain,
          type,
          credibilityScore,
          reasoning,
        });
      }
    }

    // Deduplicate and return
    return Array.from(new Map(identifiedDomains.map(item => [item.domain, item])).values());
  }
}
