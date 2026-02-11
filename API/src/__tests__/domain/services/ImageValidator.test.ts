import { ImageValidator } from '../../../domain/services/ImageValidator';
import { UploadedFile } from '../../../presentation/types/ImageUpload';
import { Readable } from 'stream';
import sharp from 'sharp';

describe('ImageValidator', () => {
  let validator: ImageValidator;

  beforeEach(() => {
    validator = new ImageValidator();
  });

  describe('validateFormat', () => {
    it('should accept JPEG format', () => {
      const file: UploadedFile = {
        filename: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        file: Readable.from(['test']),
      };

      const result = validator.validateFormat(file);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept PNG format', () => {
      const file: UploadedFile = {
        filename: 'test.png',
        encoding: '7bit',
        mimetype: 'image/png',
        file: Readable.from(['test']),
      };

      const result = validator.validateFormat(file);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept SVG format', () => {
      const file: UploadedFile = {
        filename: 'test.svg',
        encoding: '7bit',
        mimetype: 'image/svg+xml',
        file: Readable.from(['test']),
      };

      const result = validator.validateFormat(file);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject unsupported format', () => {
      const file: UploadedFile = {
        filename: 'test.gif',
        encoding: '7bit',
        mimetype: 'image/gif',
        file: Readable.from(['test']),
      };

      const result = validator.validateFormat(file);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Unsupported image format. Supported formats: JPEG, PNG, SVG'
      );
    });
  });

  describe('validateSize', () => {
    it('should return valid for size validation', () => {
      const file: UploadedFile = {
        filename: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        file: Readable.from(['test']),
      };

      const result = validator.validateSize(file);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateDimensionsWithMetadata', () => {
    it('should validate dimensions and return metadata for valid image', async () => {
      // Create a simple 800x600 PNG buffer
      const buffer = await sharp({
        create: {
          width: 800,
          height: 600,
          channels: 3,
          background: { r: 255, g: 0, b: 0 },
        },
      })
        .png()
        .toBuffer();

      const result = await validator.validateDimensionsWithMetadata(buffer);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.width).toBe(800);
      expect(result.metadata?.height).toBe(600);
    });

    it('should reject image smaller than minimum dimensions', async () => {
      // Create a 100x100 PNG buffer (below 200x200 minimum)
      const buffer = await sharp({
        create: {
          width: 100,
          height: 100,
          channels: 3,
          background: { r: 255, g: 0, b: 0 },
        },
      })
        .png()
        .toBuffer();

      const result = await validator.validateDimensionsWithMetadata(buffer);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Image dimensions must be between 200x200 and 4000x4000 pixels'
      );
    });

    it('should reject image larger than maximum dimensions', async () => {
      // Create a 5000x5000 PNG buffer (above 4000x4000 maximum)
      const buffer = await sharp({
        create: {
          width: 5000,
          height: 5000,
          channels: 3,
          background: { r: 255, g: 0, b: 0 },
        },
      })
        .png()
        .toBuffer();

      const result = await validator.validateDimensionsWithMetadata(buffer);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Image dimensions must be between 200x200 and 4000x4000 pixels'
      );
    });

    it('should accept image at minimum dimensions', async () => {
      // Create a 200x200 PNG buffer (at minimum)
      const buffer = await sharp({
        create: {
          width: 200,
          height: 200,
          channels: 3,
          background: { r: 255, g: 0, b: 0 },
        },
      })
        .png()
        .toBuffer();

      const result = await validator.validateDimensionsWithMetadata(buffer);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.metadata?.width).toBe(200);
      expect(result.metadata?.height).toBe(200);
    });

    it('should accept image at maximum dimensions', async () => {
      // Create a 4000x4000 PNG buffer (at maximum)
      const buffer = await sharp({
        create: {
          width: 4000,
          height: 4000,
          channels: 3,
          background: { r: 255, g: 0, b: 0 },
        },
      })
        .png()
        .toBuffer();

      const result = await validator.validateDimensionsWithMetadata(buffer);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.metadata?.width).toBe(4000);
      expect(result.metadata?.height).toBe(4000);
    });
  });

  describe('validateAll', () => {
    it('should validate all aspects of a valid image', async () => {
      const buffer = await sharp({
        create: {
          width: 800,
          height: 600,
          channels: 3,
          background: { r: 255, g: 0, b: 0 },
        },
      })
        .png()
        .toBuffer();

      const file: UploadedFile = {
        filename: 'test.png',
        encoding: '7bit',
        mimetype: 'image/png',
        file: Readable.from([buffer]),
      };

      const result = await validator.validateAll(file, buffer);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.width).toBe(800);
      expect(result.metadata?.height).toBe(600);
    });

    it('should reject image with invalid format', async () => {
      const buffer = Buffer.from('test data');

      const file: UploadedFile = {
        filename: 'test.gif',
        encoding: '7bit',
        mimetype: 'image/gif',
        file: Readable.from([buffer]),
      };

      const result = await validator.validateAll(file, buffer);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Unsupported image format. Supported formats: JPEG, PNG, SVG'
      );
    });

    it('should reject image exceeding file size limit', async () => {
      // Create a buffer larger than 5MB
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024);

      const file: UploadedFile = {
        filename: 'test.png',
        encoding: '7bit',
        mimetype: 'image/png',
        file: Readable.from([largeBuffer]),
      };

      const result = await validator.validateAll(file, largeBuffer);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('File size exceeds 5MB limit');
    });

    it('should collect all validation errors', async () => {
      // Create a buffer larger than 5MB
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024);

      const file: UploadedFile = {
        filename: 'test.gif',
        encoding: '7bit',
        mimetype: 'image/gif',
        file: Readable.from([largeBuffer]),
      };

      const result = await validator.validateAll(file, largeBuffer);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.errors).toContain(
        'Unsupported image format. Supported formats: JPEG, PNG, SVG'
      );
      expect(result.errors).toContain('File size exceeds 5MB limit');
    });
  });
});
