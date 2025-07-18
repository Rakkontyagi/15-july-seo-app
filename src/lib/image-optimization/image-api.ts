
import { ImageProcessor } from './image-processor';
import { CDNService } from './cdn-service';
import { ImageApiOptions, ImageApiResult } from './image-optimization.types';

export class ImageApi {
  private imageProcessor: ImageProcessor;
  private cdnService: CDNService;

  constructor() {
    this.imageProcessor = new ImageProcessor();
    this.cdnService = new CDNService();
  }

  async processAndUpload(
    buffer: Buffer,
    options: ImageApiOptions
  ): Promise<ImageApiResult> {
    const { optimizationOptions, cdnOptions } = options;

    const optimizationResult = await this.imageProcessor.optimize(
      buffer,
      optimizationOptions
    );

    const cdnResult = await this.cdnService.upload(optimizationResult.buffer, {
      ...cdnOptions,
      contentType: `image/${optimizationResult.format}`,
    });

    return {
      ...optimizationResult,
      url: cdnResult.url,
    };
  }
}
