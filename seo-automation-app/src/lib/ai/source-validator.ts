import { CurrentInformationIntegrator } from './current-information-integrator';
import { AuthorityDomainIdentifier } from './authority-domain-identifier';

export interface SourceValidationResult {
  claim: string;
  hasCitation: boolean;
  citationFormatValid: boolean; // Placeholder for format check
  sourceCredibilityScore: number; // 0-100, higher is more credible
  freshnessScore: number; // 0-100, from CurrentInformationIntegrator
  authorityScore: number; // 0-100, from AuthorityDomainIdentifier
  issues: string[];
  recommendations: string[];
}

export class SourceValidator {
  private currentInformationIntegrator: CurrentInformationIntegrator;
  private authorityDomainIdentifier: AuthorityDomainIdentifier;

  constructor() {
    this.currentInformationIntegrator = new CurrentInformationIntegrator();
    this.authorityDomainIdentifier = new AuthorityDomainIdentifier();
  }

  /**
   * Validates sources for claims and statistics within content.
   * @param content The content to validate.
   * @returns Source validation results.
   */
  async validateSources(content: string): Promise<SourceValidationResult[]> {
    const results: SourceValidationResult[] = [];

    // Simplified claim extraction (look for common claim indicators)
    const claims = content.match(/\b(?:studies show|research indicates|data reveals|experts say|it is a fact that)[^.!?]*[.!?]/gi) || [];

    for (const claim of claims) {
      const issues: string[] = [];
      const recommendations: string[] = [];
      let hasCitation = false;
      let citationFormatValid = false;
      let sourceCredibilityScore = 50; // Default
      let freshnessScore = 0;
      let authorityScore = 0;

      // Check for common citation patterns (e.g., [1], (Author, Year), URL)
      const urlMatch = claim.match(/https?:\/\/[^\s]+/);
      if (claim.match(/\[\d+\]/) || claim.match(/\([A-Za-z]+, \d{4}\)/) || urlMatch) {
        hasCitation = true;
        citationFormatValid = true; // Assume valid format for simplicity
      }

      if (!hasCitation) {
        issues.push('Claim lacks a direct citation.');
        recommendations.push('Add a citation to an authoritative source for this claim.');
        sourceCredibilityScore -= 20;
      }

      // Simulate source credibility based on keywords (very basic)
      if (claim.toLowerCase().includes('harvard') || claim.toLowerCase().includes('oxford') || claim.toLowerCase().includes('mit')) {
        sourceCredibilityScore += 30;
      }
      if (claim.toLowerCase().includes('blog post') || claim.toLowerCase().includes('forum')) {
        sourceCredibilityScore -= 10;
      }

      // Validate freshness if a URL is found
      if (urlMatch) {
        const url = urlMatch[0];
        const freshnessResult = await this.currentInformationIntegrator.validateInformationFreshness(url);
        freshnessScore = freshnessResult.freshnessScore;
        if (!freshnessResult.isValid) {
          issues.push(`Source URL (${url}) appears to be outdated or invalid.`);
          recommendations.push('Update or replace the source with a more current one.');
        }

        // Identify authority of the domain
        const authorityDomains = this.authorityDomainIdentifier.identify(url);
        if (authorityDomains.length > 0) {
          authorityScore = authorityDomains[0].credibilityScore; // Take the highest credibility score
        } else {
          issues.push(`Source URL (${url}) is from an unrecognized or low-authority domain.`);
          recommendations.push('Use sources from recognized authority domains (e.g., .gov, .edu, Wikipedia).');
        }
      }

      results.push({
        claim,
        hasCitation,
        citationFormatValid,
        sourceCredibilityScore: Math.max(0, Math.min(100, sourceCredibilityScore)),
        freshnessScore,
        authorityScore,
        issues,
        recommendations,
      });
    }

    return results;
  }
}