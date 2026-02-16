import { IProductImageService } from '../../domain/services/IProductImageService';
import { IImageStorageService } from '../../domain/services/IImageStorageService';
import { IProductImageRepository } from '../../domain/repositories/IProductImageRepository';
import { IProductRepository } from '../../domain/repositories/IProductRepository';
import { ImageValidator } from '../../domain/services/ImageValidator';
import {
  ProductImage,
  ProductImageData,
  ImageOrderUpdate,
} from '../../domain/entities/ProductImage';
import { UploadedFile } from '../../presentation/types/ImageUpload';
import { ValidationError } from '../../domain/errors/ValidationError';
import { NotFoundError } from '../../domain/errors/NotFoundError';

/**
 * ProductImageService orchestrates image upload, validation, storage, and database operations
 * Enforces business rules:
 * - Maximum 7 images per product
 * - Automatic primary image assignment for first upload
 * - Primary image fallback when primary is deleted
 * - At least one image must remain per product
 */
export class ProductImageService implements IProductImageService {
  private static readonly MAX_IMAGES_PER_PRODUCT = 7;

  constructor(
    private imageValidator: ImageValidator,
    private imageStorageService: IImageStorageService,
    private productImageRepository: IProductImageRepository,
    private productRepository: IProductRepository
  ) { }

  async uploadImages(
    productId: string,
    files: UploadedFile[]
  ): Promise<ProductImage[]> {
    if (!files || files.length === 0) {
      throw new ValidationError('No files provided for upload');
    }

    // Get existing images for this product
    const existingImages = await this.productImageRepository.getProductImages(
      productId
    );

    // Check image limit
    const totalImages = existingImages.length + files.length;
    if (totalImages > ProductImageService.MAX_IMAGES_PER_PRODUCT) {
      throw new ValidationError(
        `Product cannot have more than ${ProductImageService.MAX_IMAGES_PER_PRODUCT} images`
      );
    }

    // Validate and upload all files
    const uploadedImages: ProductImage[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      try {
        console.log(`Processing file ${i + 1}/${files.length}: ${file.filename}`);

        // Handle both Buffer (pre-converted in controller) and Stream
        const buffer = Buffer.isBuffer(file.file)
          ? file.file
          : await this.streamToBuffer(file.file);

        console.log(`Buffer ready for ${file.filename}, size: ${buffer.length} bytes`);

        // Validate the image and get metadata in one call
        console.log(`Validating ${file.filename}...`);
        const validationResult = await this.imageValidator.validateAll(
          file,
          buffer
        );
        console.log(`Validation result for ${file.filename}:`, validationResult);

        if (!validationResult.valid) {
          throw new ValidationError(
            `Image validation failed: ${validationResult.errors.join(', ')}`
          );
        }

        // Upload to storage
        const imageId = await this.imageStorageService.uploadImage(
          buffer,
          file.filename,
          productId
        );

        // Get image URL
        const imageUrl = this.imageStorageService.getImageUrl(imageId);

        // Determine display order (append to existing images)
        const displayOrder = existingImages.length + uploadedImages.length;

        // Determine if this should be primary (first image of product)
        const isPrimary =
          existingImages.length === 0 && uploadedImages.length === 0;

        // Create image record in database using metadata from validation
        const imageData: ProductImageData = {
          imagePath: imageId,
          displayOrder,
          isPrimary,
          fileSize: buffer.length,
          mimeType: file.mimetype,
          width: validationResult.metadata?.width || 0,
          height: validationResult.metadata?.height || 0,
        };

        const createdImage = await this.productImageRepository.createImage(
          productId,
          imageData
        );

        uploadedImages.push(createdImage);
      } catch (error) {
        // Log error but continue with other files
        console.error(`Failed to upload file ${file.filename}:`, error);
        throw error; // Re-throw to stop on first error
      }
    }

    // Sync images to product table
    await this.syncProductImages(productId);

    return uploadedImages;
  }

  async reorderImages(
    productId: string,
    imageOrders: ImageOrderUpdate[]
  ): Promise<void> {
    if (!imageOrders || imageOrders.length === 0) {
      throw new ValidationError('No image orders provided');
    }

    // Validate that all image IDs belong to the product
    const productImages = await this.productImageRepository.getProductImages(
      productId
    );
    const productImageIds = new Set(productImages.map((img) => img.id));

    for (const order of imageOrders) {
      if (!productImageIds.has(order.imageId)) {
        throw new ValidationError(
          `Image ${order.imageId} does not belong to product ${productId}`
        );
      }
    }

    // Update image orders in database
    await this.productImageRepository.updateImageOrder(productId, imageOrders);

    // Sync images to product table
    await this.syncProductImages(productId);
  }

  async setPrimaryImage(productId: string, imageId: string): Promise<void> {
    // Verify the image exists and belongs to the product
    const image = await this.productImageRepository.getImageById(imageId);

    if (!image) {
      throw new NotFoundError(`Image ${imageId} not found`);
    }

    if (image.productId !== productId) {
      throw new ValidationError(
        `Image ${imageId} does not belong to product ${productId}`
      );
    }

    // Set as primary in database
    await this.productImageRepository.setPrimaryImage(productId, imageId);

    // Sync images to product table
    await this.syncProductImages(productId);
  }

  async deleteImage(imageId: string): Promise<void> {
    // Get the image
    const image = await this.productImageRepository.getImageById(imageId);

    if (!image) {
      throw new NotFoundError(`Image ${imageId} not found`);
    }

    // Check if this is the last image for the product
    const productImages = await this.productImageRepository.getProductImages(
      image.productId
    );

    if (productImages.length === 1) {
      throw new ValidationError(
        'Product must have at least one image'
      );
    }

    // Delete from storage
    await this.imageStorageService.deleteImage(image.imagePath);

    // Delete from database
    await this.productImageRepository.deleteImage(imageId);

    // If deleted image was primary, set first remaining image as primary
    if (image.isPrimary) {
      const allImages = await this.productImageRepository.getProductImages(
        image.productId
      );

      const remainingImages = allImages.filter(img => img.id !== imageId);

      if (remainingImages.length > 0) {
        // Set the first remaining image as primary
        await this.productImageRepository.setPrimaryImage(
          image.productId,
          remainingImages[0].id
        );
      }
    }

    // Sync images to product table
    await this.syncProductImages(image.productId);
  }

  async getProductImages(productId: string): Promise<ProductImage[]> {
    return this.productImageRepository.getProductImages(productId);
  }

  /**
   * Convert a readable stream to a buffer with timeout protection
   * @param stream The readable stream
   * @returns Promise resolving to the buffer
   */
  private streamToBuffer(stream: NodeJS.ReadableStream | Buffer): Promise<Buffer> {
    if (Buffer.isBuffer(stream)) {
      return Promise.resolve(stream);
    }

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      let timeoutId: NodeJS.Timeout;

      // Set a timeout for stream reading (30 seconds)
      timeoutId = setTimeout(() => {
        if (typeof (stream as any).destroy === 'function') {
          (stream as any).destroy();
        }
        reject(new Error('Stream reading timeout'));
      }, 30000);

      stream.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      stream.on('end', () => {
        clearTimeout(timeoutId);
        resolve(Buffer.concat(chunks));
      });

      stream.on('error', (error) => {
        clearTimeout(timeoutId);
        reject(error);
      });

      // Handle stream pause/resume for backpressure
      stream.on('pause', () => {
        // Stream is paused, resume it
        stream.resume();
      });
    });
  }

  private async syncProductImages(productId: string): Promise<void> {
    const images = await this.productImageRepository.getProductImages(productId);

    // Sort by display order
    const sortedImages = images.sort((a, b) => a.displayOrder - b.displayOrder);

    // Find primary image (or first image if no primary)
    const primaryImage = sortedImages.find(img => img.isPrimary) || sortedImages[0];
    const primaryImagePath = primaryImage ? primaryImage.imagePath : '';
    const primaryImageId = primaryImage ? primaryImage.id : undefined;

    // Update product
    await this.productRepository.update(productId, {
      primaryImagePath,
      primaryImageId
    });
  }
}
