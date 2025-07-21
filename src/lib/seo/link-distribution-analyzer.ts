import axios from 'axios';

export interface LinkDistributionAnalysisResult {
  totalInternalLinks: number;
  averageLinksPerPage: number;
  linkEquityDistributionScore: number; // 0-100, how evenly link equity is distributed
  orphanPages: string[]; // URLs of pages with no internal links pointing to them
  hubPages: string[]; // URLs of pages with many outgoing internal links
  authorityPages: string[]; // URLs of pages with many incoming internal links
  linkDepthAnalysis: Array<{ url: string; depth: number }>; // How many clicks from homepage
  accessibilityIssues: string[]; // Pages that are hard to reach
  brokenLinks: BrokenLink[]; // New: Detected broken links
}

export interface PageLinkData {
  url: string;
  internalLinksTo: string[]; // URLs this page links to internally
  internalLinksFrom: string[]; // URLs that link to this page internally
}

export interface BrokenLink {
  sourceUrl: string;
  brokenUrl: string;
  statusCode?: number;
  suggestion?: string; // Suggestion for replacement
}

export class LinkDistributionAnalyzer {
  analyze(allPageLinkData: PageLinkData[], homepageUrl: string): LinkDistributionAnalysisResult {
    const totalInternalLinks = allPageLinkData.reduce((sum, page) => sum + page.internalLinksTo.length, 0);
    const averageLinksPerPage = allPageLinkData.length > 0 ? totalInternalLinks / allPageLinkData.length : 0;

    const orphanPages: string[] = [];
    const incomingLinkCounts: { [url: string]: number } = {};
    const outgoingLinkCounts: { [url: string]: number } = {};

    allPageLinkData.forEach(page => {
      incomingLinkCounts[page.url] = page.internalLinksFrom.length;
      outgoingLinkCounts[page.url] = page.internalLinksTo.length;
      if (page.internalLinksFrom.length === 0 && page.url !== homepageUrl) {
        orphanPages.push(page.url);
      }
    });

    // Link Equity Distribution Score (simplified: based on variance of incoming links)
    const incomingLinkValues = Object.values(incomingLinkCounts);
    const linkEquityDistributionScore = this.calculateDistributionScore(incomingLinkValues);

    // Hub Pages (many outgoing links)
    const hubPages = Object.entries(outgoingLinkCounts)
      .filter(([, count]) => count > averageLinksPerPage * 2) // Arbitrary threshold
      .map(([url]) => url);

    // Authority Pages (many incoming links)
    const authorityPages = Object.entries(incomingLinkCounts)
      .filter(([, count]) => count > averageLinksPerPage * 2) // Arbitrary threshold
      .map(([url]) => url);

    // Link Depth Analysis (BFS from homepage)
    const linkDepthAnalysis = this.analyzeLinkDepth(allPageLinkData, homepageUrl);
    const accessibilityIssues = linkDepthAnalysis.filter(d => d.depth > 3).map(d => d.url); // Pages more than 3 clicks deep

    return {
      totalInternalLinks,
      averageLinksPerPage: Number(averageLinksPerPage.toFixed(2)),
      linkEquityDistributionScore: Number(linkEquityDistributionScore.toFixed(2)),
      orphanPages,
      hubPages,
      authorityPages,
      linkDepthAnalysis,
      accessibilityIssues,
      brokenLinks: [], // Will be populated by detectBrokenLinks
    };
  }

  private calculateDistributionScore(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    // Score is inverse of coefficient of variation (stdDev / mean)
    return mean === 0 ? 0 : (1 - (stdDev / mean)) * 100; // Higher is better (more even distribution)
  }

  private analyzeLinkDepth(allPageLinkData: PageLinkData[], homepageUrl: string): Array<{ url: string; depth: number }> {
    const depths: { [url: string]: number } = {};
    const queue: { url: string; depth: number }[] = [];
    const visited = new Set<string>();

    if (homepageUrl) {
      queue.push({ url: homepageUrl, depth: 0 });
      visited.add(homepageUrl);
      depths[homepageUrl] = 0;
    }

    let head = 0;
    while (head < queue.length) {
      const { url, depth } = queue[head++];
      const currentPageData = allPageLinkData.find(p => p.url === url);

      if (currentPageData) {
        currentPageData.internalLinksTo.forEach(linkedUrl => {
          if (!visited.has(linkedUrl)) {
            visited.add(linkedUrl);
            depths[linkedUrl] = depth + 1;
            queue.push({ url: linkedUrl, depth: depth + 1 });
          }
        });
      }
    }

    return Object.entries(depths).map(([url, depth]) => ({ url, depth }));
  }

  /**
   * Detects broken internal links by attempting to fetch each linked URL.
   * @param allPageLinkData Data for all pages and their internal links.
   * @returns A list of detected broken links.
   */
  async detectBrokenLinks(allPageLinkData: PageLinkData[]): Promise<BrokenLink[]> {
    const brokenLinks: BrokenLink[] = [];
    const checkedUrls = new Set<string>();

    for (const page of allPageLinkData) {
      for (const linkedUrl of page.internalLinksTo) {
        if (checkedUrls.has(linkedUrl)) {
          continue; // Already checked this URL
        }
        checkedUrls.add(linkedUrl);

        try {
          const response = await axios.head(linkedUrl, { timeout: 5000 }); // Use HEAD request for efficiency
          if (response.status >= 400) {
            brokenLinks.push({
              sourceUrl: page.url,
              brokenUrl: linkedUrl,
              statusCode: response.status,
              suggestion: 'Check URL for typos or update to a valid page.',
            });
          }
        } catch (error) {
          if (axios.isAxiosError(error) && error.response) {
            brokenLinks.push({
              sourceUrl: page.url,
              brokenUrl: linkedUrl,
              statusCode: error.response.status,
              suggestion: 'Check URL for typos or update to a valid page.',
            });
          } else {
            brokenLinks.push({
              sourceUrl: page.url,
              brokenUrl: linkedUrl,
              suggestion: 'Could not reach URL. Check network or URL validity.',
            });
          }
        }
      }
    }
    return brokenLinks;
  }

  /**
   * Suggests replacements for broken links. (Simplified placeholder)
   * In a real system, this would involve finding semantically similar pages
   * or pages with relevant content.
   * @param brokenLink The broken link to find a suggestion for.
   * @param allPages All available pages on the site.
   * @returns A suggested replacement URL, or null if none found.
   */
  suggestBrokenLinkReplacement(brokenLink: BrokenLink, allPages: PageData[]): string | null {
    // Very basic suggestion: find a page with the broken link's keyword in its URL or title
    const brokenUrlParts = brokenLink.brokenUrl.split('/');
    const brokenKeyword = brokenUrlParts[brokenUrlParts.length - 1].replace(/[-\.html]/g, ' ').trim();

    if (brokenKeyword) {
      const relevantPage = allPages.find(page => 
        page.url.toLowerCase().includes(brokenKeyword.toLowerCase()) || 
        page.content?.toLowerCase().includes(brokenKeyword.toLowerCase())
      );
      if (relevantPage) {
        return relevantPage.url;
      }
    }
    return null;
  }
}