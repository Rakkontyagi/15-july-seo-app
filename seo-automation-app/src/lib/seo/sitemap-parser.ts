import axios from 'axios';
import { parseStringPromise } from 'xml2js';

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

export interface SitemapIndex {
  sitemap: SitemapUrl[];
}

export interface Urlset {
  url: SitemapUrl[];
}

export class SitemapParser {
  private cache: Map<string, { data: SitemapUrl[]; timestamp: number }> = new Map();
  private CACHE_TTL = 1000 * 60 * 60; // 1 hour

  async fetchRobotsTxt(domain: string): Promise<string | null> {
    try {
      const response = await axios.get(`http://${domain}/robots.txt`, { timeout: 5000 });
      return response.data;
    } catch (error: any) {
      console.warn(`Could not fetch robots.txt for ${domain}:`, error.message);
      return null;
    }
  }

  async discoverSitemapsFromRobotsTxt(domain: string): Promise<string[]> {
    const robotsTxt = await this.fetchRobotsTxt(domain);
    if (!robotsTxt) {
      return [];
    }

    const sitemapUrls: string[] = [];
    const lines = robotsTxt.split('\n');
    
    lines.forEach(line => {
      if (line.startsWith('Sitemap:')) {
        const url = line.substring('Sitemap:'.length).trim();
        sitemapUrls.push(url);
      }
    });

    return sitemapUrls;
  }

  async fetchAndParseSitemap(sitemapUrl: string): Promise<SitemapUrl[]> {
    const cached = this.cache.get(sitemapUrl);
    if (cached && (Date.now() - cached.timestamp < this.CACHE_TTL)) {
      return cached.data;
    }

    try {
      const response = await axios.get(sitemapUrl, { timeout: 10000 });
      const result = await parseStringPromise(response.data);
      let urls: SitemapUrl[] = [];

      if (result.sitemapindex) {
        // This is a sitemap index, recursively fetch sitemaps
        const sitemapIndex: SitemapIndex = result.sitemapindex;
        for (const sitemap of sitemapIndex.sitemap) {
          if (sitemap.loc) {
            const nestedUrls = await this.fetchAndParseSitemap(sitemap.loc);
            urls = urls.concat(nestedUrls);
          }
        }
      } else if (result.urlset) {
        // This is a regular sitemap
        const urlset: Urlset = result.urlset;
        urls = urlset.url.map(u => ({
          loc: u.loc[0],
          lastmod: u.lastmod ? u.lastmod[0] : undefined,
          changefreq: u.changefreq ? u.changefreq[0] : undefined,
          priority: u.priority ? u.priority[0] : undefined,
        }));
      }

      this.cache.set(sitemapUrl, { data: urls, timestamp: Date.now() });
      return urls;
    } catch (error: any) {
      console.error(`Error fetching or parsing sitemap ${sitemapUrl}:`, error.message);
      return [];
    }
  }

  async getAllUrls(domain: string): Promise<SitemapUrl[]> {
    const sitemapUrls = await this.discoverSitemapsFromRobotsTxt(domain);
    let allUrls: SitemapUrl[] = [];

    if (sitemapUrls.length === 0) {
      // Try common sitemap locations
      const commonSitemaps = [
        `http://${domain}/sitemap.xml`,
        `http://${domain}/sitemap_index.xml`,
        `http://${domain}/sitemaps.xml`
      ];

      for (const sitemapUrl of commonSitemaps) {
        const urls = await this.fetchAndParseSitemap(sitemapUrl);
        allUrls = allUrls.concat(urls);
        if (urls.length > 0) break; // Found a working sitemap
      }
    } else {
      for (const sitemapUrl of sitemapUrls) {
        const urls = await this.fetchAndParseSitemap(sitemapUrl);
        allUrls = allUrls.concat(urls);
      }
    }

    return allUrls;
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }
}
