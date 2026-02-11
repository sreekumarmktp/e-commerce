import { IImageStorageService } from '../../domain/services/IImageStorageService';
import { LocalImageStorageService } from './LocalImageStorageService';
import { S3ImageStorageService } from './S3ImageStorageService';
import { env } from '../../config/env';

/**
 * Image Storage Service Factory
 * Creates the appropriate image storage service based on environment configuration
 */
export class ImageStorageServiceFactory {
  /**
   * Create an image storage service based on the current environment
   * @returns An instance of IImageStorageService
   */
  static createImageStorageService(): IImageStorageService {
    const environment = process.env.NODE_ENV || 'development';

    if (environment === 'production') {
      return new S3ImageStorageService(
        process.env.AWS_S3_BUCKET,
        process.env.AWS_REGION
      );
    }

    // Default to local storage for development and testing
    return new LocalImageStorageService(
      process.env.UPLOAD_DIR,
      env.API_BASE_URL
    );
  }
}
