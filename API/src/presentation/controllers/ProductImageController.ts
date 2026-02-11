import { FastifyReply, FastifyRequest } from 'fastify';
import { IProductImageService } from '../../domain/services/IProductImageService';
import { UploadedFile } from '../types/ImageUpload';
import { ValidationError } from '../../domain/errors/ValidationError';
import { NotFoundError } from '../../domain/errors/NotFoundError';
import { ZodError } from 'zod';
import { reorderImagesBodySchema } from '../schemas/productImageSchemas';

/**
 * ProductImageController handles HTTP requests for product image operations
 * Manages multipart file uploads, image reordering, primary image designation,
 * and image deletion with proper validation and error handling
 */
export class ProductImageController {
  constructor(private productImageService: IProductImageService) { }

  /**
   * Upload multiple images for a product
   * POST /api/products/:productId/images
   * Accepts multipart form data with image files
   */
  async uploadImages(
    req: FastifyRequest<{ Params: { productId: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    const startTime = Date.now();
    console.log('[UploadImages] Starting upload process...');

    try {
      const { productId } = req.params as { productId: string };
      console.log(`[UploadImages] Product ID: ${productId}`);

      // Collect all uploaded files from multipart data with timeout protection
      const files: UploadedFile[] = [];

      // Create a timeout promise for the entire parts reading process
      const PARTS_TIMEOUT = 60000; // 60 seconds
      const partsPromise = (async () => {
        console.log('[UploadImages] Starting to read multipart parts...');
        let partCount = 0;

        try {
          // Iterate through all parts in the multipart request
          for await (const part of req.parts()) {
            partCount++;
            console.log(`[UploadImages] Processing part #${partCount}, type: ${part.type}`);

            if (part.type === 'file') {
              console.log(`[UploadImages] File part - filename: ${part.filename}, mimetype: ${part.mimetype}`);

              // CRITICAL FIX: Convert stream to buffer IMMEDIATELY
              // If we don't consume the stream here, the iterator hangs
              const buffer = await this.streamToBuffer(part.file);
              console.log(`[UploadImages] File stream consumed, buffer size: ${buffer.length} bytes`);

              files.push({
                filename: part.filename,
                encoding: part.encoding,
                mimetype: part.mimetype,
                file: buffer as any, // Store buffer instead of stream
              });
            } else {
              // Consume non-file parts to prevent hanging
              console.log(`[UploadImages] Non-file part - field: ${(part as any).fieldname}`);
              // Read the value to consume the stream
              const value = (part as any).value;
              console.log(`[UploadImages] Field value: ${value}`);
            }
          }
          console.log(`[UploadImages] Finished reading ${partCount} parts, ${files.length} files collected`);
        } catch (error) {
          console.error('[UploadImages] Error reading parts:', error);
          throw error;
        }
      })();

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Multipart reading timeout after ${PARTS_TIMEOUT}ms`));
        }, PARTS_TIMEOUT);
      });

      // Race between reading parts and timeout
      await Promise.race([partsPromise, timeoutPromise]);

      const partsReadTime = Date.now() - startTime;
      console.log(`[UploadImages] Parts reading took ${partsReadTime}ms`);

      if (files.length === 0) {
        console.log('[UploadImages] No files found in request');
        reply.code(400).send({
          success: false,
          error: 'No files provided for upload',
        });
        return;
      }

      console.log(`[UploadImages] Starting to upload ${files.length} files to service...`);
      // Upload images using service
      const uploadedImages = await this.productImageService.uploadImages(
        productId,
        files
      );

      const totalTime = Date.now() - startTime;
      console.log(`[UploadImages] Successfully uploaded ${uploadedImages.length} images in ${totalTime}ms`);

      reply.code(201).send({
        success: true,
        data: uploadedImages,
        message: `${uploadedImages.length} image(s) uploaded successfully`,
      });
    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error(`[UploadImages] Error after ${totalTime}ms:`, error);
      this.handleError(error, reply);
    }
  }

  /**
   * Reorder images for a product
   * PATCH /api/products/:productId/images/order
   * Body: { imageOrders: Array<{ imageId: string, newOrder: number }> }
   */
  async reorderImages(
    req: FastifyRequest<{ Params: { productId: string }; Body: unknown }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { productId } = req.params as { productId: string };

      // Validate request body
      const body = reorderImagesBodySchema.parse(req.body);

      // Reorder images using service
      await this.productImageService.reorderImages(productId, body.imageOrders);

      // Retrieve updated images
      const updatedImages = await this.productImageService.getProductImages(
        productId
      );

      reply.send({
        success: true,
        data: updatedImages,
        message: 'Images reordered successfully',
      });
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  /**
   * Set an image as the primary image for a product
   * PATCH /api/products/:productId/images/:imageId/primary
   */
  async setPrimaryImage(
    req: FastifyRequest<{
      Params: { productId: string; imageId: string };
    }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { productId, imageId } = req.params as {
        productId: string;
        imageId: string;
      };

      // Set primary image using service
      await this.productImageService.setPrimaryImage(productId, imageId);

      // Retrieve updated images
      const updatedImages = await this.productImageService.getProductImages(
        productId
      );

      reply.send({
        success: true,
        data: updatedImages,
        message: 'Primary image set successfully',
      });
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  /**
   * Delete an image from a product
   * DELETE /api/products/:productId/images/:imageId
   */
  async deleteImage(
    req: FastifyRequest<{
      Params: { productId: string; imageId: string };
    }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { productId, imageId } = req.params as {
        productId: string;
        imageId: string;
      };

      // Delete image using service
      await this.productImageService.deleteImage(imageId);

      // Retrieve updated images
      const updatedImages = await this.productImageService.getProductImages(
        productId
      );

      reply.send({
        success: true,
        data: updatedImages,
        message: 'Image deleted successfully',
      });
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  /**
   * Get all images for a product
   * GET /api/products/:productId/images
   */
  async getProductImages(
    req: FastifyRequest<{ Params: { productId: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { productId } = req.params as { productId: string };

      // Retrieve images using service
      const images = await this.productImageService.getProductImages(productId);

      reply.send({
        success: true,
        data: images,
        message: 'Product images retrieved successfully',
      });
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  /**
   * Handle errors and send appropriate HTTP responses
   * Maps domain errors to HTTP status codes
   */
  private handleError(error: unknown, reply: FastifyReply): void {
    if (error instanceof ZodError) {
      reply.code(400).send({
        success: false,
        error: 'Validation error',
        details: error.issues[0]?.message || 'Invalid request data',
      });
      return;
    }

    if (error instanceof ValidationError) {
      reply.code(400).send({
        success: false,
        error: error.message,
      });
      return;
    }

    if (error instanceof NotFoundError) {
      reply.code(404).send({
        success: false,
        error: error.message,
      });
      return;
    }

    if (error instanceof Error) {
      // Check for storage errors
      if (
        error.message.includes('storage') ||
        error.message.includes('upload') ||
        error.message.includes('delete')
      ) {
        reply.code(500).send({
          success: false,
          error: 'Image storage service error',
          details: error.message,
        });
        return;
      }

      // Generic error
      reply.code(500).send({
        success: false,
        error: error.message,
      });
      return;
    }

    reply.code(500).send({
      success: false,
      error: 'Internal server error',
    });
  }

  /**
   * Helper method to convert a stream to a buffer with timeout
   */
  private streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
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
    });
  }
}
