
import axios from 'axios';

export class BrokenLinkDetector {
  async detectBrokenLinks(urls: string[]): Promise<string[]> {
    const brokenLinks: string[] = [];
    for (const url of urls) {
      try {
        await axios.head(url, { timeout: 5000 });
      } catch (error) {
        brokenLinks.push(url);
      }
    }
    return brokenLinks;
  }
}
