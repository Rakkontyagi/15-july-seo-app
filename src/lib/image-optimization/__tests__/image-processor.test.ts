import { ImageProcessor } from '../image-processor';
import sharp from 'sharp';

// Mock sharp
jest.mock('sharp', () => {
  const mockSharp = {
    resize: jest.fn().mockReturnThis(),
    jpeg: jest.fn().mockReturnThis(),
    png: jest.fn().mockReturnThis(),
    webp: jest.fn().mockReturnThis(),
    avif: jest.fn().mockReturnThis(),
    blur: jest.fn().mockReturnThis(),
    metadata: jest.fn().mockResolvedValue({
      width: 1920,
      height: 1080,
      format: 'jpeg'
    }),
    stats: jest.fn().mockResolvedValue({
      dominant: { r: 100, g: 100, b: 100 }
    }),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('mock-image-data'))
  };

  return jest.fn(() => mockSharp);
});

describe('ImageProcessor', () => {
  let imageProcessor: ImageProcessor;
  let mockBuffer: Buffer;

  beforeEach(() => {
    imageProcessor = new ImageProcessor();
    mockBuffer = Buffer.from('mock-image-data');
    jest.clearAllMocks();
  });

  describe('optimize', () => {
    it('should optimize an image with default options', async () => {
      const result = await imageProcessor.optimize(mockBuffer);

      expect(result).toBeDefined();
      expect(result.buffer).toBeDefined();
      expect(result.format).toBe('webp'); // Default format
      expect(result.originalSize).toBe(mockBuffer.length);
      expect(result.optimizedSize).toBe(result.buffer.length);
      expect(result.sizeReduction).toBeDefined();

      // Verify sharp was called correctly
      expect(sharp).toHaveBeenCalledWith(mockBuffer);
      expect(sharp().resize).toHaveBeenCalledWith(1920, null, expect.any(Object));
      expect(sharp().webp).toHaveBeenCalled();
      expect(sharp().toBuffer).toHaveBeenCalled();
    });

    it('should optimize an image with custom options', async () => {
      const options = {
        format: 'jpeg' as const,
        quality: 90,
        width: 800,
        height: 600
      };

      const result = await imageProcessor.optimize(mockBuffer, options);

      expect(result.format).toBe('jpeg');

      // Verify sharp was called correctly
      expect(sharp().resize).toHaveBeenCalledWith(800, 600, expect.any(Object));
      expect(sharp().jpeg).toHaveBeenCalledWith(expect.objectContaining({ quality: 90 }));
    });

    it('should handle errors gracefully', async () => {
      // Mock sharp to throw an error
      const mockSharp = sharp as jest.MockedFunction<typeof sharp>;
      mockSharp.mockImplementationOnce(() => {
        throw new Error('Mock error');
      });

      await expect(imageProcessor.optimize(mockBuffer)).rejects.toThrow('Image optimization failed');
    });

    it('should apply format-specific optimizations', async () => {
      // Test JPEG format
      await imageProcessor.optimize(mockBuffer, { format: 'jpeg' });
      expect(sharp().jpeg).toHaveBeenCalledWith(expect.objectContaining({
        progressive: true,
        optimizeCoding: true
      }));

      // Test PNG format
      jest.clearAllMocks();
      await imageProcessor.optimize(mockBuffer, { format: 'png' });
      expect(sharp().png).toHaveBeenCalledWith(expect.objectContaining({
        progressive: true,
        compressionLevel: 9
      }));

      // Test WebP format
      jest.clearAllMocks();
      await imageProcessor.optimize(mockBuffer, { format: 'webp' });
      expect(sharp().webp).toHaveBeenCalledWith(expect.objectContaining({
        smartSubsample: true
      }));

      // Test AVIF format
      jest.clearAllMocks();
      await imageProcessor.optimize(mockBuffer, { format: 'avif' });
      expect(sharp().avif).toHaveBeenCalledWith(expect.objectContaining({
        speed: 5
      }));
    });
  });

  describe('generateResponsiveSet', () => {
    it('should generate a set of responsive images', async () => {
      // Mock the optimize method
      const optimizeSpy = jest.spyOn(imageProcessor, 'optimize').mockImplementation(async (buffer, options) => {
        return {
          buffer: Buffer.from('optimized-image'),
          format: options?.format || 'webp',
          originalSize: buffer.length,
          optimizedSize: 'optimized-image'.length,
          sizeReduction: 50,
          width: options?.width || 1920,
          height: options?.height || 1080
        };
      });

      // Mock the generatePlaceholder method
      const generatePlaceholderSpy = jest.spyOn(imageProcessor as any, 'generatePlaceholder')
        .mockResolvedValue(Buffer.from('placeholder-image'));

      const result = await imageProcessor.generateResponsiveSet(mockBuffer);

      expect(result).toBeDefined();
      expect(result.original).toBeDefined();
      expect(result.images).toBeDefined();
      expect(result.images.length).toBeGreaterThan(0);
      expect(result.placeholder).toBeDefined();

      // Verify optimize was called for each breakpoint
      expect(optimizeSpy).toHaveBeenCalledTimes(result.images.length);

      // Verify generatePlaceholder was called
      expect(generatePlaceholderSpy).toHaveBeenCalled();

      // Restore the original methods
      optimizeSpy.mockRestore();
      generatePlaceholderSpy.mockRestore();
    });
  });

  describe('generatePlaceholder', () => {
    it('should generate a blur placeholder', async () => {
      const result = await (imageProcessor as any).generatePlaceholder(mockBuffer, 'blur');

      expect(result).toBeDefined();
      expect(sharp).toHaveBeenCalledWith(mockBuffer);
      expect(sharp().resize).toHaveBeenCalledWith(20);
      expect(sharp().blur).toHaveBeenCalledWith(5);
      expect(sharp().toBuffer).toHaveBeenCalled();
    });

    it('should generate a color placeholder', async () => {
      const result = await (imageProcessor as any).generatePlaceholder(mockBuffer, 'color');

      expect(result).toBeDefined();
      expect(sharp).toHaveBeenCalledWith(mockBuffer);
      expect(sharp().stats).toHaveBeenCalled();
      expect(sharp).toHaveBeenCalledWith(expect.objectContaining({
        create: expect.objectContaining({
          width: 1,
          height: 1,
          background: expect.objectContaining({
            r: 100,
            g: 100,
            b: 100
          })
        })
      }));
    });

    it('should generate a low-res placeholder by default', async () => {
      const result = await (imageProcessor as any).generatePlaceholder(mockBuffer);

      expect(result).toBeDefined();
      expect(sharp).toHaveBeenCalledWith(mockBuffer);
      expect(sharp().resize).toHaveBeenCalledWith(40);
      expect(sharp().toBuffer).toHaveBeenCalled();
    });
  });

  describe('getBestFormat', () => {
    it('should detect AVIF support in Chrome', () => {
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36';
      const format = (imageProcessor as any).getBestFormat(userAgent);
      expect(format).toBe('avif');
    });

    it('should detect WebP support in Firefox', () => {
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0';
      const format = (imageProcessor as any).getBestFormat(userAgent);
      expect(format).toBe('webp');
    });

    it('should fallback to JPEG for older browsers', () => {
      const userAgent = 'Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; AS; rv:11.0) like Gecko';
      const format = (imageProcessor as any).getBestFormat(userAgent);
      expect(format).toBe('jpeg');
    });
  });

  describe('generatePictureElement', () => {
    it('should generate HTML for a responsive image', () => {
      const responsiveSet = {
        original: {
          width: 1920,
          height: 1080,
          format: 'jpeg' as const
        },
        images: [
          { width: 320, buffer: Buffer.from(''), size: 10000, format: 'webp' as const, url: 'image-320.webp' },
          { width: 640, buffer: Buffer.from(''), size: 20000, format: 'webp' as const, url: 'image-640.webp' },
          { width: 1280, buffer: Buffer.from(''), size: 40000, format: 'webp' as const, url: 'image-1280.webp' }
        ],
        placeholder: Buffer.from('placeholder-data')
      };

      const html = (imageProcessor as any).generatePictureElement(responsiveSet, 'Image description', 'img-fluid');

      expect(html).toBeDefined();
      expect(html).toContain('<picture>');
      expect(html).toContain('<source type="image/webp"');
      expect(html).toContain('alt="Image description"');
      expect(html).toContain('class="img-fluid"');
      expect(html).toContain('loading="lazy"');
      expect(html).toContain('data:image/');
    });
  });
});