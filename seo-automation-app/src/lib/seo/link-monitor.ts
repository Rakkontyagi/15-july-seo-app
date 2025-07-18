
import axios from 'axios';

export interface ExternalLinkHealth {
  url: string;
  isHealthy: boolean;
  statusCode?: number;
  redirectedTo?: string;
  lastChecked: string;
  issues: string[];
  recommendations: string[];
}

export class LinkMonitor {
  /**
   * Checks the health of external links.
   * @param urls An array of external URLs to check.
   * @returns A promise that resolves to an array of ExternalLinkHealth results.
   */
  async checkExternalLinks(urls: string[]): Promise<ExternalLinkHealth[]> {
    const results: ExternalLinkHealth[] = [];

    for (const url of urls) {
      let isHealthy = true;
      let statusCode: number | undefined;
      let redirectedTo: string | undefined;
      const issues: string[] = [];
      const recommendations: string[] = [];

      try {
        const response = await axios.head(url, { maxRedirects: 5, timeout: 10000 });
        statusCode = response.status;

        if (response.status >= 400) {
          isHealthy = false;
          issues.push(`HTTP Status Code: ${response.status}. Link is broken or inaccessible.`);
          recommendations.push('Replace or remove this broken link.');
        }

        if (response.request.res.responseUrl && response.request.res.responseUrl !== url) {
          redirectedTo = response.request.res.responseUrl;
          issues.push(`Link redirected to: ${redirectedTo}.`);
          recommendations.push('Update the link to the final redirected URL.');
        }
      } catch (error) {
        isHealthy = false;
        if (axios.isAxiosError(error)) {
          statusCode = error.response?.status;
          if (error.code === 'ECONNABORTED') {
            issues.push('Request timed out.');
            recommendations.push('Check if the server is slow or unresponsive.');
          } else if (error.response) {
            issues.push(`HTTP Error: ${error.response.status}.`);
            recommendations.push('Check the URL for validity.');
          } else {
            issues.push(`Network Error: ${error.message}.`);
            recommendations.push('Check network connectivity or URL validity.');
          }
        } else {
          issues.push(`An unexpected error occurred: ${error.message}.`);
          recommendations.push('Investigate the error.');
        }
      }

      results.push({
        url,
        isHealthy,
        statusCode,
        redirectedTo,
        lastChecked: new Date().toISOString(),
        issues,
        recommendations,
      });
    }

    return results;
  }
}
