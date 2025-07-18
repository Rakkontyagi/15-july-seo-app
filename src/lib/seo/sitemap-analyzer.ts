
import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';

export class SitemapAnalyzer {
  async extractSitemap(sitemapUrl: string): Promise<string[]> {
    try {
      const response = await axios.get(sitemapUrl);
      const parser = new XMLParser();
      const jsonObj = parser.parse(response.data);

      const urls: string[] = [];
      if (jsonObj.urlset && jsonObj.urlset.url) {
        const urlEntries = Array.isArray(jsonObj.urlset.url) ? jsonObj.urlset.url : [jsonObj.urlset.url];
        urlEntries.forEach((urlEntry: any) => {
          if (urlEntry.loc) {
            urls.push(urlEntry.loc);
          }
        });
      } else if (jsonObj.sitemapindex && jsonObj.sitemapindex.sitemap) {
        const sitemapEntries = Array.isArray(jsonObj.sitemapindex.sitemap) ? jsonObj.sitemapindex.sitemap : [jsonObj.sitemapindex.sitemap];
        for (const sitemapEntry of sitemapEntries) {
          if (sitemapEntry.loc) {
            urls.push(...await this.extractSitemap(sitemapEntry.loc));
          }
        }
      }
      return urls;
    } catch (error) {
      console.error(`Error extracting sitemap from ${sitemapUrl}:`, error);
      return [];
    }
  }
}
