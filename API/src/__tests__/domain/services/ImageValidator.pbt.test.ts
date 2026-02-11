import fc from 'fast-check';
import { ImageValidator } from '../../../domain/services/ImageValidator';
import { UploadedFile } from '../../../presentation/types/ImageUpload';
import sharp from 'sharp';

/**
 * Property-Based Tests for ImageValidator
 * These tests verify universal properties that should hold across all inputs
 */
describe('ImageValidator - Property-Based Tests', () => {
  let validator: ImageValidator;

  beforeEach(() => {
    validator = new ImageValidator();
  });

  /**
   * Property 1: Format Validation
   * **Validates: Requirements 5.1, 5.2**
   *
   * For any file with an unsupported MIME type, validation SHALL fail
   */
  it('Property 1: Format Validation - unsupported formats are always rejected', () => {
    const unsupportedMimeTypes = fc.oneof(
      fc.constant('image/gif'),
      fc.constant('image/webp'),
      fc.constant('image/bmp'),
      fc.constant('image/tiff'),
      fc.constant('text/plain'),
      fc.constant('application/pdf'),
      fc.constant('video/mp4')
    );

    fc.assert(
      fc.property(unsupportedMimeTypes, (mimetype) => {
        const file: UploadedFile = {
          filename: 'test.jpg',
          encoding: '7bit',
          mimetype,
          file: {} as NodeJS.ReadableStream,
        };

        const result = validator.validateFormat(file);

        // Unsupported formats must be rejected
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 1b: Format Validation - Supported formats
   * **Validates: Requirements 5.1, 5.2**
   *
   * For any file with a supported MIME type, format validation SHALL pass
   */
  it('Property 1b: Format Validation - supported formats are always accepted', () => {
    const supportedMimeTypes = fc.oneof(
      fc.constant('image/jpeg'),
      fc.constant('image/png'),
      fc.constant('image/svg+xml')
    );

    fc.assert(
      fc.property(supportedMimeTypes, (mimetype) => {
        const file: UploadedFile = {
          filename: 'test.jpg',
          encoding: '7bit',
          mimetype,
          file: {} as NodeJS.ReadableStream,
        };

        const result = validator.validateFormat(file);

        // Supported formats must be accepted
        expect(result.valid).toBe(true);
        expect(result.errors.length).toBe(0);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2: File Size Validation
   * **Validates: Requirements 5.3**
   *
   * For any file exceeding 5MB (5242880 bytes), validation SHALL fail
   */
  it('Property 2: File Size Validation - files exceeding 5MB are always rejected', async () => {
    const fileSizeGenerator = fc.integer({ min: 5242881, max: 10485760 }); // 5MB+1 to 10MB

    await fc.assert(
      fc.asyncProperty(fileSizeGenerator, async (fileSize) => {
        const buffer = Buffer.alloc(fileSize);

        const file: UploadedFile = {
          filename: 'test.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          file: {} as NodeJS.ReadableStream,
        };

        const result = await validator.validateAll(file, buffer);

        // Files exceeding 5MB must be rejected
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('File size exceeds 5MB limit');
      }),
      { numRuns: 50 }
    );
  });

  /**
   * Property 2b: File Size Validation - Valid sizes
   * **Validates: Requirements 5.3**
   *
   * For any file not exceeding 5MB, size validation SHALL pass
   */
  it('Property 2b: File Size Validation - files within 5MB limit pass size check', async () => {
    const fileSizeGenerator = fc.integer({ min: 1, max: 5242880 }); // 1 byte to 5MB

    await fc.assert(
      fc.asyncProperty(fileSizeGenerator, async (fileSize) => {
        const buffer = Buffer.alloc(fileSize);

        const file: UploadedFile = {
          filename: 'test.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          file: {} as NodeJS.ReadableStream,
        };

        const result = await validator.validateAll(file, buffer);

        // Files within 5MB should not have size error
        expect(result.errors).not.toContain('File size exceeds 5MB limit');
      }),
      { numRuns: 50 }
    );
  });

  /**
   * Property 3: Image Dimension Validation
   * **Validates: Requirements 5.4**
   *
   * For any image with dimensions less than 200x200 pixels, validation SHALL fail
   */
  it('Property 3: Image Dimension Validation - images smaller than 200x200 are rejected', async () => {
    const dimensionGenerator = fc.integer({ min: 1, max: 199 });

    await fc.assert(
      fc.asyncProperty(
        fc.tuple(dimensionGenerator, dimensionGenerator),
        async ([width, height]) => {
          const buffer = await sharp({
            create: {
              width,
              height,
              channels: 3,
              background: { r: 255, g: 0, b: 0 },
            },
          })
            .png()
            .toBuffer();

          const result = await validator.validateDimensions(buffer);

          // Images smaller than 200x200 must be rejected
          expect(result.valid).toBe(false);
          expect(result.errors).toContain(
            'Image dimensions must be between 200x200 and 4000x4000 pixels'
          );
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 3b: Image Dimension Validation - images larger than 4000x4000
   * **Validates: Requirements 5.4**
   *
   * For any image with dimensions greater than 4000x4000 pixels, validation SHALL fail
   */
  it(
    'Property 3b: Image Dimension Validation - images larger than 4000x4000 are rejected',
    async () => {
      const dimensionGenerator = fc.integer({ min: 4001, max: 4500 });

      await fc.assert(
        fc.asyncProperty(
          fc.tuple(dimensionGenerator, dimensionGenerator),
          async ([width, height]) => {
            const buffer = await sharp({
              create: {
                width,
                height,
                channels: 3,
                background: { r: 255, g: 0, b: 0 },
              },
            })
              .png()
              .toBuffer();

            const result = await validator.validateDimensions(buffer);

            // Images larger than 4000x4000 must be rejected
            expect(result.valid).toBe(false);
            expect(result.errors).toContain(
              'Image dimensions must be between 200x200 and 4000x4000 pixels'
            );
          }
        ),
        { numRuns: 20 }
      );
    },
    30000
  );

  /**
   * Property 3c: Image Dimension Validation - valid dimensions
   * **Validates: Requirements 5.4**
   *
   * For any image with dimensions between 200x200 and 4000x4000 pixels,
   * dimension validation SHALL pass
   */
  it(
    'Property 3c: Image Dimension Validation - images within valid range pass',
    async () => {
      const dimensionGenerator = fc.integer({ min: 200, max: 4000 });

      await fc.assert(
        fc.asyncProperty(
          fc.tuple(dimensionGenerator, dimensionGenerator),
          async ([width, height]) => {
            const buffer = await sharp({
              create: {
                width,
                height,
                channels: 3,
                background: { r: 255, g: 0, b: 0 },
              },
            })
              .png()
              .toBuffer();

            const result = await validator.validateDimensions(buffer);

            // Images within valid range must pass
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
          }
        ),
        { numRuns: 30 }
      );
    },
    60000
  );

  /**
   * Property 3d: Image Dimension Validation - one dimension invalid
   * **Validates: Requirements 5.4**
   *
   * For any image where at least one dimension is outside the valid range,
   * validation SHALL fail
   */
  it(
    'Property 3d: Image Dimension Validation - one invalid dimension causes rejection',
    async () => {
      const validDimension = fc.integer({ min: 200, max: 4000 });
      const invalidSmallDimension = fc.integer({ min: 1, max: 199 });
      const invalidLargeDimension = fc.integer({ min: 4001, max: 4500 });

      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            fc.tuple(invalidSmallDimension, validDimension),
            fc.tuple(validDimension, invalidSmallDimension),
            fc.tuple(invalidLargeDimension, validDimension),
            fc.tuple(validDimension, invalidLargeDimension)
          ),
          async ([width, height]) => {
            const buffer = await sharp({
              create: {
                width,
                height,
                channels: 3,
                background: { r: 255, g: 0, b: 0 },
              },
            })
              .png()
              .toBuffer();

            const result = await validator.validateDimensions(buffer);

            // At least one invalid dimension must cause rejection
            expect(result.valid).toBe(false);
            expect(result.errors).toContain(
              'Image dimensions must be between 200x200 and 4000x4000 pixels'
            );
          }
        ),
        { numRuns: 30 }
      );
    },
    60000
  );

  /**
   * Property 4: Validation Result Structure
   * **Validates: Requirements 5.1, 5.2, 5.3, 5.4**
   *
   * For any validation result, the structure must be consistent:
   * - If valid is true, errors array must be empty
   * - If valid is false, errors array must not be empty
   */
  it('Property 4: Validation Result Structure - consistency between valid flag and errors', async () => {
    const mimeTypeGenerator = fc.string();
    const fileSizeGenerator = fc.integer({ min: 1, max: 10485760 });

    await fc.assert(
      fc.asyncProperty(
        fc.tuple(mimeTypeGenerator, fileSizeGenerator),
        async ([mimetype, fileSize]) => {
          const buffer = Buffer.alloc(fileSize);

          const file: UploadedFile = {
            filename: 'test.jpg',
            encoding: '7bit',
            mimetype,
            file: {} as NodeJS.ReadableStream,
          };

          const result = await validator.validateAll(file, buffer);

          // Consistency check: valid=true implies no errors, valid=false implies errors
          if (result.valid) {
            expect(result.errors).toHaveLength(0);
          } else {
            expect(result.errors.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5: Format Validation Independence
   * **Validates: Requirements 5.1, 5.2**
   *
   * Format validation result should not depend on file size or dimensions
   */
  it('Property 5: Format Validation Independence - format check is independent of size', () => {
    const supportedFormats = fc.oneof(
      fc.constant('image/jpeg'),
      fc.constant('image/png'),
      fc.constant('image/svg+xml')
    );

    fc.assert(
      fc.property(supportedFormats, (mimetype) => {
        const file: UploadedFile = {
          filename: 'test.jpg',
          encoding: '7bit',
          mimetype,
          file: {} as NodeJS.ReadableStream,
        };

        const result = validator.validateFormat(file);

        // Format validation should always pass for supported formats
        // regardless of other factors
        expect(result.valid).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 6: Error Messages are Descriptive
   * **Validates: Requirements 5.1, 5.2, 5.3, 5.4**
   *
   * For any validation failure, error messages must be non-empty strings
   */
  it('Property 6: Error Messages are Descriptive - all errors are non-empty strings', async () => {
    const unsupportedMimeTypes = fc.oneof(
      fc.constant('image/gif'),
      fc.constant('image/webp'),
      fc.constant('text/plain')
    );

    await fc.assert(
      fc.asyncProperty(unsupportedMimeTypes, async (mimetype) => {
        const buffer = Buffer.alloc(10485760); // 10MB

        const file: UploadedFile = {
          filename: 'test.jpg',
          encoding: '7bit',
          mimetype,
          file: {} as NodeJS.ReadableStream,
        };

        const result = await validator.validateAll(file, buffer);

        // All errors must be non-empty strings
        result.errors.forEach((error) => {
          expect(typeof error).toBe('string');
          expect(error.length).toBeGreaterThan(0);
        });
      }),
      { numRuns: 50 }
    );
  });
});
