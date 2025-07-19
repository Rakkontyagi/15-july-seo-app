import { SitemapAnalyzer } from '../sitemap-analyzer';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('SitemapAnalyzer', () => {
  let analyzer: SitemapAnalyzer;

  beforeEach(() => {
    analyzer = new SitemapAnalyzer();
    jest.clearAllMocks();
  });

  describe('extractSitemap', () => {
    it('should extract URLs from a simple sitemap', async () => {
      const mockSitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
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

      mockedAxios.get.mockResolvedValue({ data: mockSitemapXml });

      const urls = await analyzer.extractSitemap('https://example.com/sitemap.xml');

      expect(urls).toEqual([
        'https://example.com/',
        'https://example.com/about'
      ]);
      expect(mockedAxios.get).toHaveBeenCalledWith('https://example.com/sitemap.xml');
    });

    it('should handle sitemap index files', async () => {
      const mockSitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
        <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <sitemap>
            <loc>https://example.com/sitemap1.xml</loc>
            <lastmod>2023-01-01</lastmod>
          </sitemap>
          <sitemap>
            <loc>https://example.com/sitemap2.xml</loc>
            <lastmod>2023-01-02</lastmod>
          </sitemap>
        </sitemapindex>`;

      const mockSitemap1 = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <url><loc>https://example.com/page1</loc></url>
        </urlset>`;

      const mockSitemap2 = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <url><loc>https://example.com/page2</loc></url>
        </urlset>`;

      mockedAxios.get
        .mockResolvedValueOnce({ data: mockSitemapIndex })
        .mockResolvedValueOnce({ data: mockSitemap1 })
        .mockResolvedValueOnce({ data: mockSitemap2 });

      const urls = await analyzer.extractSitemap('https://example.com/sitemap.xml');

      expect(urls).toEqual([
        'https://example.com/page1',
        'https://example.com/page2'
      ]);
      expect(mockedAxios.get).toHaveBeenCalledTimes(3);
    });

    it('should handle single URL entry', async () => {
      const mockSitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <url>
            <loc>https://example.com/single-page</loc>
          </url>
        </urlset>`;

      mockedAxios.get.mockResolvedValue({ data: mockSitemapXml });

      const urls = await analyzer.extractSitemap('https://example.com/sitemap.xml');

      expect(urls).toEqual(['https://example.com/single-page']);
    });

    it('should handle network errors gracefully', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));

      const urls = await analyzer.extractSitemap('https://example.com/sitemap.xml');

      expect(urls).toEqual([]);
    });

    it('should handle malformed XML gracefully', async () => {
      const malformedXml = '<invalid>xml</invalid>';
      mockedAxios.get.mockResolvedValue({ data: malformedXml });

      const urls = await analyzer.extractSitemap('https://example.com/sitemap.xml');

      expect(urls).toEqual([]);
    });

    it('should handle empty sitemap', async () => {
      const emptySitemap = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        </urlset>`;

      mockedAxios.get.mockResolvedValue({ data: emptySitemap });

      const urls = await analyzer.extractSitemap('https://example.com/sitemap.xml');

      expect(urls).toEqual([]);
    });
  });

  describe('analyzeSitemap', () => {
    it('should provide comprehensive sitemap analysis', async () => {
      const mockSitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <url>
            <loc>https://example.com/</loc>
            <lastmod>2023-01-01</lastmod>
            <changefreq>daily</changefreq>
            <priority>1.0</priority>
          </url>
          <url>
            <loc>https://example.com/blog/post-1</loc>
            <lastmod>2023-01-02</lastmod>
            <changefreq>weekly</changefreq>
            <priority>0.8</priority>
          </url>
        </urlset>`;

      mockedAxios.get.mockResolvedValue({ data: mockSitemapXml });

      const result = await analyzer.analyzeSitemap('https://example.com/sitemap.xml');

      expect(result.totalUrls).toBe(2);
      expect(result.sitemapType).toBe('urlset');
      expect(result.urls).toHaveLength(2);
      expect(result.statistics.totalPages).toBe(2);
      expect(result.statistics.avgPriority).toBeCloseTo(0.9);
      expect(result.contentStructure.pageTypes).toBeDefined();
      expect(result.lastAnalyzed).toBeInstanceOf(Date);
    });

    it('should respect maxUrls option', async () => {
      const mockSitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <url><loc>https://example.com/1</loc></url>
          <url><loc>https://example.com/2</loc></url>
          <url><loc>https://example.com/3</loc></url>
        </urlset>`;

      mockedAxios.get.mockResolvedValue({ data: mockSitemapXml });

      const result = await analyzer.analyzeSitemap('https://example.com/sitemap.xml', {
        maxUrls: 2
      });

      expect(result.urls).toHaveLength(2);
      expect(result.totalUrls).toBe(3); // Total found, but limited in results
    });

    it('should handle timeout option', async () => {
      mockedAxios.get.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('timeout')), 100)
        )
      );

      const result = await analyzer.analyzeSitemap('https://example.com/sitemap.xml', {
        timeout: 50
      });

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('network');
    });
  });

  describe('extractMultipleSitemaps', () => {
    it('should merge results from multiple sitemaps', async () => {
      const mockSitemap1 = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <url><loc>https://example.com/page1</loc></url>
        </urlset>`;

      const mockSitemap2 = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <url><loc>https://example.com/page2</loc></url>
        </urlset>`;

      mockedAxios.get
        .mockResolvedValueOnce({ data: mockSitemap1 })
        .mockResolvedValueOnce({ data: mockSitemap2 });

      const result = await analyzer.extractMultipleSitemaps([
        'https://example.com/sitemap1.xml',
        'https://example.com/sitemap2.xml'
      ]);

      expect(result.totalUrls).toBe(2);
      expect(result.urls.map(u => u.loc)).toEqual([
        'https://example.com/page1',
        'https://example.com/page2'
      ]);
      expect(result.sitemapType).toBe('mixed');
    });

    it('should handle partial failures', async () => {
      const mockSitemap = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <url><loc>https://example.com/page1</loc></url>
        </urlset>`;

      mockedAxios.get
        .mockResolvedValueOnce({ data: mockSitemap })
        .mockRejectedValueOnce(new Error('Network error'));

      const result = await analyzer.extractMultipleSitemaps([
        'https://example.com/sitemap1.xml',
        'https://example.com/sitemap2.xml'
      ]);

      expect(result.totalUrls).toBe(1);
      expect(result.urls[0].loc).toBe('https://example.com/page1');
    });

    it('should throw error when all sitemaps fail', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));

      await expect(analyzer.extractMultipleSitemaps([
        'https://example.com/sitemap1.xml',
        'https://example.com/sitemap2.xml'
      ])).rejects.toThrow('Failed to extract any sitemaps');
    });
  });

  describe('URL validation and filtering', () => {
    it('should filter out invalid URLs', async () => {
      const mockSitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <url><loc>https://example.com/valid</loc></url>
          <url><loc>invalid-url</loc></url>
          <url><loc>ftp://example.com/ftp</loc></url>
        </urlset>`;

      mockedAxios.get.mockResolvedValue({ data: mockSitemapXml });

      const result = await analyzer.analyzeSitemap('https://example.com/sitemap.xml');

      expect(result.urls).toHaveLength(1);
      expect(result.urls[0].loc).toBe('https://example.com/valid');
    });

    it('should remove duplicate URLs', async () => {
      const mockSitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <url><loc>https://example.com/page</loc></url>
          <url><loc>https://example.com/page</loc></url>
          <url><loc>https://example.com/other</loc></url>
        </urlset>`;

      mockedAxios.get.mockResolvedValue({ data: mockSitemapXml });

      const result = await analyzer.analyzeSitemap('https://example.com/sitemap.xml');

      expect(result.urls).toHaveLength(2);
      expect(result.urls.map(u => u.loc)).toEqual([
        'https://example.com/page',
        'https://example.com/other'
      ]);
    });
  });

  describe('Content structure analysis', () => {
    it('should analyze page types correctly', async () => {
      const mockSitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <url><loc>https://example.com/</loc><priority>1.0</priority></url>
          <url><loc>https://example.com/blog/post-1</loc><priority>0.8</priority></url>
          <url><loc>https://example.com/blog/post-2</loc><priority>0.8</priority></url>
          <url><loc>https://example.com/product/item-1</loc><priority>0.9</priority></url>
          <url><loc>https://example.com/about</loc><priority>0.7</priority></url>
        </urlset>`;

      mockedAxios.get.mockResolvedValue({ data: mockSitemapXml });

      const result = await analyzer.analyzeSitemap('https://example.com/sitemap.xml');

      expect(result.contentStructure.pageTypes).toBeDefined();
      const pageTypes = result.contentStructure.pageTypes;
      
      const homepageType = pageTypes.find(pt => pt.type === 'homepage');
      expect(homepageType?.count).toBe(1);
      expect(homepageType?.avgPriority).toBe(1.0);

      const blogType = pageTypes.find(pt => pt.type === 'blog');
      expect(blogType?.count).toBe(2);
      expect(blogType?.avgPriority).toBe(0.8);

      const productType = pageTypes.find(pt => pt.type === 'product');
      expect(productType?.count).toBe(1);
      expect(productType?.avgPriority).toBe(0.9);
    });

    it('should calculate URL structure score', async () => {
      const mockSitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <url><loc>https://example.com/clean-url</loc></url>
          <url><loc>https://example.com/another-clean-url</loc></url>
        </urlset>`;

      mockedAxios.get.mockResolvedValue({ data: mockSitemapXml });

      const result = await analyzer.analyzeSitemap('https://example.com/sitemap.xml');

      expect(result.contentStructure.urlStructureScore).toBeGreaterThan(0);
      expect(result.contentStructure.urlStructureScore).toBeLessThanOrEqual(100);
    });

    it('should calculate hierarchy depth', async () => {
      const mockSitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <url><loc>https://example.com/</loc></url>
          <url><loc>https://example.com/level1</loc></url>
          <url><loc>https://example.com/level1/level2</loc></url>
          <url><loc>https://example.com/level1/level2/level3</loc></url>
        </urlset>`;

      mockedAxios.get.mockResolvedValue({ data: mockSitemapXml });

      const result = await analyzer.analyzeSitemap('https://example.com/sitemap.xml');

      expect(result.contentStructure.hierarchyDepth).toBe(3);
    });
  });
});
