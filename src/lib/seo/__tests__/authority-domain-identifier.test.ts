import { AuthorityDomainIdentifier } from '../authority-domain-identifier';

describe('AuthorityDomainIdentifier', () => {
  let identifier: AuthorityDomainIdentifier;

  beforeEach(() => {
    identifier = new AuthorityDomainIdentifier();
  });

  describe('identify', () => {
    it('should identify government domains', () => {
      const result = identifier.identify('Visit https://www.cdc.gov for health information');

      expect(result.identifiedDomains).toHaveLength(1);
      expect(result.identifiedDomains[0].domain).toBe('cdc.gov');
      expect(result.identifiedDomains[0].type).toBe('government');
      expect(result.identifiedDomains[0].credibilityScore).toBeGreaterThan(90);
    });

    it('should identify academic domains', () => {
      const result = identifier.identify('Research from https://harvard.edu shows that...');

      expect(result.identifiedDomains).toHaveLength(1);
      expect(result.identifiedDomains[0].domain).toBe('harvard.edu');
      expect(result.identifiedDomains[0].type).toBe('academic');
      expect(result.identifiedDomains[0].credibilityScore).toBeGreaterThan(85);
    });

    it('should identify Wikipedia domains', () => {
      const result = identifier.identify('According to https://en.wikipedia.org/wiki/SEO');

      expect(result.identifiedDomains).toHaveLength(1);
      expect(result.identifiedDomains[0].domain).toBe('wikipedia.org');
      expect(result.identifiedDomains[0].type).toBe('wikipedia');
      expect(result.identifiedDomains[0].credibilityScore).toBe(90);
    });

    it('should identify news domains', () => {
      const result = identifier.identify('As reported by https://nytimes.com');

      expect(result.identifiedDomains).toHaveLength(1);
      expect(result.identifiedDomains[0].domain).toBe('nytimes.com');
      expect(result.identifiedDomains[0].type).toBe('news');
      expect(result.identifiedDomains[0].credibilityScore).toBe(80);
    });

    it('should handle multiple domains in text', () => {
      const text = 'Sources include https://cdc.gov and https://harvard.edu and https://wikipedia.org';
      const result = identifier.identify(text);

      expect(result.identifiedDomains.length).toBeGreaterThanOrEqual(3);
      expect(result.totalDomainsFound).toBeGreaterThanOrEqual(3);
    });

    it('should filter by minimum credibility score', () => {
      const result = identifier.identify('Visit https://example.com for more info', {
        minimumCredibilityScore: 80
      });

      // example.com should be filtered out due to low credibility
      const lowCredibilityDomains = result.identifiedDomains.filter(d => d.credibilityScore < 80);
      expect(lowCredibilityDomains).toHaveLength(0);
    });

    it('should categorize domains by authority level', () => {
      const text = 'Sources: https://cdc.gov, https://example.com, https://harvard.edu';
      const result = identifier.identify(text);

      expect(result.highAuthorityCount).toBeGreaterThan(0);
      expect(result.totalDomainsFound).toBeGreaterThan(0);
      expect(result.highAuthorityCount + result.mediumAuthorityCount + result.lowAuthorityCount)
        .toBe(result.totalDomainsFound);
    });

    it('should provide recommendations', () => {
      const result = identifier.identify('Visit https://example.com');

      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('should handle empty input', () => {
      const result = identifier.identify('');

      expect(result.identifiedDomains).toHaveLength(0);
      expect(result.totalDomainsFound).toBe(0);
      expect(result.recommendations).toContain('No authority domains found. Consider adding references to reputable sources.');
    });

    it('should handle invalid URLs gracefully', () => {
      const result = identifier.identify('Invalid URL: not-a-url');

      expect(result.identifiedDomains).toHaveLength(0);
      expect(result.totalDomainsFound).toBe(0);
    });
  });

  describe('identifySimple', () => {
    it('should maintain backward compatibility', () => {
      const domains = identifier.identifySimple('Visit https://cdc.gov for health info');

      expect(Array.isArray(domains)).toBe(true);
      expect(domains.length).toBeGreaterThan(0);
      expect(domains[0]).toHaveProperty('domain');
      expect(domains[0]).toHaveProperty('type');
      expect(domains[0]).toHaveProperty('credibilityScore');
    });
  });

  describe('findIndustryAuthorities', () => {
    it('should find healthcare authorities', () => {
      const authorities = identifier.findIndustryAuthorities('healthcare');

      expect(authorities.length).toBeGreaterThan(0);
      const healthcareAuthority = authorities.find(a => a.domain.includes('cdc') || a.domain.includes('nih'));
      expect(healthcareAuthority).toBeDefined();
    });

    it('should find technology authorities', () => {
      const authorities = identifier.findIndustryAuthorities('technology');

      expect(authorities.length).toBeGreaterThan(0);
      const techAuthority = authorities.find(a => a.domain.includes('ieee'));
      expect(techAuthority).toBeDefined();
    });

    it('should handle unknown industry', () => {
      const authorities = identifier.findIndustryAuthorities('unknown-industry');

      expect(Array.isArray(authorities)).toBe(true);
      // Should return empty array or general authorities
    });
  });

  describe('verifyDomainAuthority', () => {
    it('should verify known authority domain', async () => {
      const result = await identifier.verifyDomainAuthority('cdc.gov');

      expect(result).toBeDefined();
      expect(result?.type).toBe('government');
      expect(result?.credibilityScore).toBeGreaterThan(90);
      expect(result?.verificationDate).toBeInstanceOf(Date);
    });

    it('should analyze unknown domain', async () => {
      const result = await identifier.verifyDomainAuthority('example.edu');

      expect(result).toBeDefined();
      expect(result?.type).toBe('academic');
      expect(result?.credibilityScore).toBeGreaterThan(80);
    });

    it('should handle invalid domain', async () => {
      const result = await identifier.verifyDomainAuthority('invalid-domain');

      expect(result).toBeNull();
    });
  });

  describe('domain analysis', () => {
    it('should correctly identify .gov domains', () => {
      const result = identifier.identify('https://example.gov');

      expect(result.identifiedDomains[0].type).toBe('government');
      expect(result.identifiedDomains[0].credibilityScore).toBe(95);
    });

    it('should correctly identify .edu domains', () => {
      const result = identifier.identify('https://example.edu');

      expect(result.identifiedDomains[0].type).toBe('academic');
      expect(result.identifiedDomains[0].credibilityScore).toBe(85);
    });

    it('should correctly identify .org domains', () => {
      const result = identifier.identify('https://example.org');

      expect(result.identifiedDomains[0].type).toBe('other');
      expect(result.identifiedDomains[0].credibilityScore).toBe(70);
    });
  });

  describe('industry context', () => {
    it('should boost relevance for industry-specific domains', () => {
      const healthcareResult = identifier.identify('https://medical-journal.com', {
        industryContext: 'healthcare'
      });

      const generalResult = identifier.identify('https://medical-journal.com');

      // Healthcare context should boost the score
      expect(healthcareResult.identifiedDomains[0]?.credibilityScore)
        .toBeGreaterThanOrEqual(generalResult.identifiedDomains[0]?.credibilityScore || 0);
    });

    it('should filter industry-specific authorities', () => {
      const result = identifier.identify('https://cdc.gov and https://ieee.org', {
        industryContext: 'healthcare'
      });

      expect(result.industrySpecificAuthorities.length).toBeGreaterThan(0);
      const healthcareAuthorities = result.industrySpecificAuthorities.filter(a => 
        a.domain.includes('cdc') || a.reasoning.some(r => r.toLowerCase().includes('health'))
      );
      expect(healthcareAuthorities.length).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('should handle malformed URLs', () => {
      const result = identifier.identify('Visit ht tp://broken-url.com');

      expect(result.identifiedDomains).toHaveLength(0);
      expect(result.totalDomainsFound).toBe(0);
    });

    it('should handle very long input', () => {
      const longText = 'Visit https://example.com '.repeat(1000);
      const result = identifier.identify(longText);

      expect(result).toBeDefined();
      expect(result.totalDomainsFound).toBeGreaterThan(0);
    });

    it('should handle special characters', () => {
      const result = identifier.identify('Visit https://example.com/path?param=value&other=123#section');

      expect(result.identifiedDomains.length).toBeGreaterThan(0);
      expect(result.identifiedDomains[0].domain).toBe('example.com');
    });
  });

  describe('performance', () => {
    it('should process multiple domains efficiently', () => {
      const domains = Array.from({ length: 50 }, (_, i) => `https://example${i}.com`).join(' ');
      
      const startTime = Date.now();
      const result = identifier.identify(domains);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      expect(result.totalDomainsFound).toBeGreaterThan(0);
    });
  });

  describe('recommendations', () => {
    it('should recommend adding government sources when missing', () => {
      const result = identifier.identify('https://example.com');

      expect(result.recommendations.some(r => 
        r.toLowerCase().includes('government')
      )).toBe(true);
    });

    it('should recommend adding academic sources when missing', () => {
      const result = identifier.identify('https://example.com');

      expect(result.recommendations.some(r => 
        r.toLowerCase().includes('academic')
      )).toBe(true);
    });

    it('should provide positive feedback for good authority mix', () => {
      const result = identifier.identify('https://cdc.gov and https://harvard.edu and https://wikipedia.org');

      // Should have fewer negative recommendations when good authorities are present
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });
});
