import { SitemapParser } from '../sitemap-parser';
import { jest } from '@jest/globals';

// Mock fetch globally
global.fetch = jest.fn();

describe('SitemapParser', () => {
  let sitemapParser: SitemapParser;
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    sitemapParser = new SitemapParser();
    mockFetch.mockClear();
  });

  describe('discoverSitemapsFromRobotsTxt', () => {
    it('should discover sitemaps from robots.txt', async () => {
      const robotsTxtContent = `
User-agent: *
Disallow: /admin
Sitemap: https://example.com/sitemap.xml
Sitemap: https://example.com/sitemap-news.xml
      `;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(robotsTxtContent),
      } as Response);

      const sitemaps = await sitemapParser.discoverSitemapsFromRobotsTxt('https://example.com');

      expect(sitemaps).toEqual([
        'https://example.com/sitemap.xml',
        'https://example.com/sitemap-news.xml'
      ]);
      expect(mockFetch).toHaveBeenCalledWith('https://example.com/robots.txt');
    });

    it('should handle robots.txt without sitemaps', async () => {
      const robotsTxtContent = `
User-agent: *
Disallow: /admin
      `;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(robotsTxtContent),
      } as Response);

      const sitemaps = await sitemapParser.discoverSitemapsFromRobotsTxt('https://example.com');

      expect(sitemaps).toEqual([]);
    });

    it('should handle fetch errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const sitemaps = await sitemapParser.discoverSitemapsFromRobotsTxt('https://example.com');

      expect(sitemaps).toEqual([]);
    });
  });

  describe('fetchAndParseSitemap', () => {
    it('should parse regular sitemap XML', async () => {
      const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
    <lastmod>2023-01-01</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://example.com/about</loc>
    <lastmod>2023-01-02</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(sitemapXml),
      } as Response);

      const urls = await sitemapParser.fetchAndParseSitemap('https://example.com/sitemap.xml');

      expect(urls).toHaveLength(2);
      expect(urls[0]).toEqual({
        loc: 'https://example.com/',
        lastmod: '2023-01-01',
        changefreq: 'daily',
        priority: '1.0'
      });
      expect(urls[1]).toEqual({
        loc: 'https://example.com/about',
        lastmod: '2023-01-02',
        changefreq: 'weekly',
        priority: '0.8'
      });
    });

    it('should parse sitemap index XML', async () => {
      const sitemapIndexXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://example.com/sitemap-posts.xml</loc>
    <lastmod>2023-01-01</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://example.com/sitemap-pages.xml</loc>
    <lastmod>2023-01-02</lastmod>
  </sitemap>
</sitemapindex>`;

      const postsSitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/post1</loc>
  </url>
</urlset>`;

      const pagesSitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/page1</loc>
  </url>
</urlset>`;

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(sitemapIndexXml),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(postsSitemapXml),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(pagesSitemapXml),
        } as Response);

      const urls = await sitemapParser.fetchAndParseSitemap('https://example.com/sitemap.xml');

      expect(urls).toHaveLength(2);
      expect(urls[0].loc).toBe('https://example.com/post1');
      expect(urls[1].loc).toBe('https://example.com/page1');
    });

    it('should handle invalid XML gracefully', async () => {
      const invalidXml = 'This is not valid XML';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(invalidXml),
      } as Response);

      await expect(sitemapParser.fetchAndParseSitemap('https://example.com/sitemap.xml'))
        .rejects.toThrow();
    });

    it('should handle HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response);

      await expect(sitemapParser.fetchAndParseSitemap('https://example.com/sitemap.xml'))
        .rejects.toThrow('Failed to fetch sitemap: 404 Not Found');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(sitemapParser.fetchAndParseSitemap('https://example.com/sitemap.xml'))
        .rejects.toThrow('Network error');
    });
  });

  describe('caching', () => {
    it('should cache sitemap results', async () => {
      const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
  </url>
</urlset>`;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(sitemapXml),
      } as Response);

      // First call
      const urls1 = await sitemapParser.fetchAndParseSitemap('https://example.com/sitemap.xml');
      
      // Second call should use cache
      const urls2 = await sitemapParser.fetchAndParseSitemap('https://example.com/sitemap.xml');

      expect(urls1).toEqual(urls2);
      expect(mockFetch).toHaveBeenCalledTimes(1); // Only called once due to caching
    });
  });

  describe('edge cases', () => {
    it('should handle empty sitemap', async () => {
      const emptySitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(emptySitemapXml),
      } as Response);

      const urls = await sitemapParser.fetchAndParseSitemap('https://example.com/sitemap.xml');

      expect(urls).toEqual([]);
    });

    it('should handle sitemap with missing optional fields', async () => {
      const minimalSitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
  </url>
</urlset>`;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(minimalSitemapXml),
      } as Response);

      const urls = await sitemapParser.fetchAndParseSitemap('https://example.com/sitemap.xml');

      expect(urls).toHaveLength(1);
      expect(urls[0]).toEqual({
        loc: 'https://example.com/',
        lastmod: undefined,
        changefreq: undefined,
        priority: undefined
      });
    });

    it('should handle very large sitemaps', async () => {
      // Generate a large sitemap with 1000 URLs
      const urls = Array.from({ length: 1000 }, (_, i) => `
  <url>
    <loc>https://example.com/page${i}</loc>
  </url>`).join('');

      const largeSitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(largeSitemapXml),
      } as Response);

      const parsedUrls = await sitemapParser.fetchAndParseSitemap('https://example.com/sitemap.xml');

      expect(parsedUrls).toHaveLength(1000);
      expect(parsedUrls[0].loc).toBe('https://example.com/page0');
      expect(parsedUrls[999].loc).toBe('https://example.com/page999');
    });
  });
});
