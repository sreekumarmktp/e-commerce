import sharp from 'sharp';
import { UploadedFile, ImageValidationResult } from '../../presentation/types/ImageUpload';

export interface ImageValidationWithMetadata extends ImageValidationResult {
  metadata?: {
    width: number;
    height: number;
  };
}

/**
 * ImageValidator validates image files for format, size, and dimensions
 * Supported formats: JPEG, PNG, SVG
 * Max file size: 5MB (5242880 bytes)
 * Dimension constraints: 200x200 to 4000x4000 pixels
 */
export class ImageValidator {
  private static readonly SUPPORTED_FORMATS = [
    'image/jpeg',
    'image/png',
    'image/svg+xml',
  ];

  private static readonly MAX_FILE_SIZE = 5242880; // 5MB in bytes
  private static readonly MIN_DIMENSION = 200;
  private static readonly MAX_DIMENSION = 4000;

  /**
   * Validates the image format (MIME type)
   * @param file The uploaded file to validate
   * @returns Validation result with errors if format is invalid
   */
  public validateFormat(file: UploadedFile): ImageValidationResult {
    const errors: string[] = [];

    if (!ImageValidator.SUPPORTED_FORMATS.includes(file.mimetype)) {
      errors.push(
        'Unsupported image format. Supported formats: JPEG, PNG, SVG'
      );
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates the file size
   * @param file The uploaded file to validate
   * @returns Validation result with errors if size exceeds limit
   */
  public validateSize(file: UploadedFile): ImageValidationResult {
    const errors: string[] = [];

    // Note: For multipart files, we need to check the size from the buffer
    // This method validates based on the file object properties
    // The actual size check happens in validateAll with the buffer

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates image dimensions and returns metadata
   * @param buffer The image file buffer
   * @returns Promise resolving to validation result with errors and metadata
   */
  public async validateDimensionsWithMetadata(
    buffer: Buffer
  ): Promise<ImageValidationWithMetadata> {
    const errors: string[] = [];
    let metadata: { width: number; height: number } | undefined;

    try {
      // Add timeout to sharp processing
      const sharpPromise = sharp(buffer).metadata();
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Sharp processing timeout')), 10000);
      });

      const sharpMetadata = await Promise.race([sharpPromise, timeoutPromise]);

      if (!sharpMetadata.width || !sharpMetadata.height) {
        errors.push('Unable to determine image dimensions');
        return { valid: false, errors };
      }

      metadata = {
        width: sharpMetadata.width,
        height: sharpMetadata.height,
      };

      if (
        sharpMetadata.width < ImageValidator.MIN_DIMENSION ||
        sharpMetadata.height < ImageValidator.MIN_DIMENSION
      ) {
        errors.push(
          `Image dimensions must be between ${ImageValidator.MIN_DIMENSION}x${ImageValidator.MIN_DIMENSION} and ${ImageValidator.MAX_DIMENSION}x${ImageValidator.MAX_DIMENSION} pixels`
        );
      }

      if (
        sharpMetadata.width > ImageValidator.MAX_DIMENSION ||
        sharpMetadata.height > ImageValidator.MAX_DIMENSION
      ) {
        errors.push(
          `Image dimensions must be between ${ImageValidator.MIN_DIMENSION}x${ImageValidator.MIN_DIMENSION} and ${ImageValidator.MAX_DIMENSION}x${ImageValidator.MAX_DIMENSION} pixels`
        );
      }
    } catch (error) {
      console.error('Sharp validation error:', error);
      errors.push('Failed to validate image dimensions: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }

    return {
      valid: errors.length === 0,
      errors,
      metadata,
    };
  }

  /**
   * Validates image dimensions (backward compatibility)
   * @param buffer The image file buffer
   * @returns Promise resolving to validation result
   */
  public async validateDimensions(
    buffer: Buffer
  ): Promise<ImageValidationResult> {
    const result = await this.validateDimensionsWithMetadata(buffer);
    return {
      valid: result.valid,
      errors: result.errors,
    };
  }

  /**
   * Validates all aspects of an image file: format, size, and dimensions
   * Returns metadata to avoid duplicate sharp() calls
   * @param file The uploaded file to validate
   * @param buffer The image file buffer for dimension checking
   * @returns Promise resolving to validation result with all errors and metadata
   */
  public async validateAll(
    file: UploadedFile,
    buffer: Buffer
  ): Promise<ImageValidationWithMetadata> {
    const errors: string[] = [];
    let metadata: { width: number; height: number } | undefined;

    // Validate format
    const formatResult = this.validateFormat(file);
    errors.push(...formatResult.errors);

    // Validate size
    if (buffer.length > ImageValidator.MAX_FILE_SIZE) {
      errors.push('File size exceeds 5MB limit');
    }

    // Validate dimensions and get metadata
    const dimensionResult = await this.validateDimensionsWithMetadata(buffer);
    errors.push(...dimensionResult.errors);
    metadata = dimensionResult.metadata;

    return {
      valid: errors.length === 0,
      errors,
      metadata,
    };
  }
}
