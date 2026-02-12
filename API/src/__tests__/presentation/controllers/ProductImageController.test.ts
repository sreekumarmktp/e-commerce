import { ProductImageController } from '../../../presentation/controllers/ProductImageController';
import { IProductImageService } from '../../../domain/services/IProductImageService';
import { FastifyReply, FastifyRequest } from 'fastify';
import { ValidationError } from '../../../domain/errors/ValidationError';
import { NotFoundError } from '../../../domain/errors/NotFoundError';
import { ProductImage } from '../../../domain/entities/ProductImage';
import { Readable } from 'stream';

describe('ProductImageController', () => {
  let controller: ProductImageController;
  let mockService: jest.Mocked<IProductImageService>;
  let mockReply: jest.Mocked<FastifyReply>;

  beforeEach(() => {
    mockService = {
      uploadImages: jest.fn(),
      reorderImages: jest.fn(),
      setPrimaryImage: jest.fn(),
      deleteImage: jest.fn(),
      getProductImages: jest.fn(),
    } as any;

    mockReply = {
      code: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    } as any;

    controller = new ProductImageController(mockService);
  });

  describe('uploadImages', () => {
    it('should return 201 with uploaded images', async () => {
      const mockImages: ProductImage[] = [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          productId: '550e8400-e29b-41d4-a716-446655440000',
          imagePath: 'path-1',
          imageUrl: 'url-1',
          displayOrder: 0,
          isPrimary: true,
          fileSize: 50000,
          mimeType: 'image/jpeg',
          width: 800,
          height: 600,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockService.uploadImages.mockResolvedValue(mockImages);

      const mockRequest = {
        params: { productId: '550e8400-e29b-41d4-a716-446655440000' },
        parts: jest.fn(),
      } as any;

      // Mock the async iterator for parts
      mockRequest.parts = async function* () {
        yield {
          type: 'file',
          filename: 'test.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          file: Readable.from([Buffer.from('test data')]),
        };
      };

      await controller.uploadImages(mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(201);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: mockImages,
        message: '1 image(s) uploaded successfully',
      });
    });

    it('should return 400 if no files provided', async () => {
      const mockRequest = {
        params: { productId: '550e8400-e29b-41d4-a716-446655440000' },
        parts: jest.fn(),
      } as any;

      // Mock empty parts
      mockRequest.parts = async function* () { };

      await controller.uploadImages(mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: 'No files provided for upload',
      });
    });

    it('should handle validation errors', async () => {
      mockService.uploadImages.mockRejectedValue(
        new ValidationError('Invalid image format')
      );

      const mockRequest = {
        params: { productId: '550e8400-e29b-41d4-a716-446655440000' },
        parts: jest.fn(),
      } as any;

      mockRequest.parts = async function* () {
        yield {
          type: 'file',
          filename: 'test.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          file: Readable.from([Buffer.from('test data')]),
        };
      };

      await controller.uploadImages(mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid image format',
      });
    });
  });

  describe('reorderImages', () => {
    it('should successfully reorder images', async () => {
      const productId = '550e8400-e29b-41d4-a716-446655440000';
      const img1Id = '550e8400-e29b-41d4-a716-446655440001';
      const img2Id = '550e8400-e29b-41d4-a716-446655440002';

      const mockImages: ProductImage[] = [
        {
          id: img1Id,
          productId: productId,
          imagePath: 'path-1',
          imageUrl: 'url-1',
          displayOrder: 1,
          isPrimary: false,
          fileSize: 50000,
          mimeType: 'image/jpeg',
          width: 800,
          height: 600,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: img2Id,
          productId: productId,
          imagePath: 'path-2',
          imageUrl: 'url-2',
          displayOrder: 0,
          isPrimary: true,
          fileSize: 50000,
          mimeType: 'image/jpeg',
          width: 800,
          height: 600,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockService.reorderImages.mockResolvedValue(undefined);
      mockService.getProductImages.mockResolvedValue(mockImages);

      const mockRequest = {
        params: { productId },
        body: {
          imageOrders: [
            { imageId: img1Id, newOrder: 1 },
            { imageId: img2Id, newOrder: 0 },
          ],
        },
      } as any;

      await controller.reorderImages(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: mockImages,
        message: 'Images reordered successfully',
      });
    });

    it('should handle validation errors during reorder', async () => {
      const productId = '550e8400-e29b-41d4-a716-446655440000';
      const img1Id = '550e8400-e29b-41d4-a716-446655440001';
      mockService.reorderImages.mockRejectedValue(
        new ValidationError('Image does not belong to product')
      );

      const mockRequest = {
        params: { productId },
        body: {
          imageOrders: [{ imageId: img1Id, newOrder: 0 }],
        },
      } as any;

      await controller.reorderImages(mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: 'Image does not belong to product',
      });
    });
  });

  describe('setPrimaryImage', () => {
    it('should successfully set primary image', async () => {
      const mockImages: ProductImage[] = [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          productId: '550e8400-e29b-41d4-a716-446655440000',
          imagePath: 'path-1',
          imageUrl: 'url-1',
          displayOrder: 0,
          isPrimary: true,
          fileSize: 50000,
          mimeType: 'image/jpeg',
          width: 800,
          height: 600,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockService.setPrimaryImage.mockResolvedValue(undefined);
      mockService.getProductImages.mockResolvedValue(mockImages);

      const mockRequest = {
        params: { productId: '550e8400-e29b-41d4-a716-446655440000', imageId: '550e8400-e29b-41d4-a716-446655440001' },
      } as any;

      await controller.setPrimaryImage(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: mockImages,
        message: 'Primary image set successfully',
      });
    });

    it('should handle not found error', async () => {
      mockService.setPrimaryImage.mockRejectedValue(
        new NotFoundError('Image not found')
      );

      const mockRequest = {
        params: { productId: '550e8400-e29b-41d4-a716-446655440000', imageId: '550e8400-e29b-41d4-a716-446655440001' },
      } as any;

      await controller.setPrimaryImage(mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(404);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: 'Image not found',
      });
    });
  });

  describe('deleteImage', () => {
    it('should successfully delete image', async () => {
      const mockImages: ProductImage[] = [
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          productId: '550e8400-e29b-41d4-a716-446655440000',
          imagePath: 'path-2',
          imageUrl: 'url-2',
          displayOrder: 0,
          isPrimary: true,
          fileSize: 50000,
          mimeType: 'image/jpeg',
          width: 800,
          height: 600,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockService.deleteImage.mockResolvedValue(undefined);
      mockService.getProductImages.mockResolvedValue(mockImages);

      const mockRequest = {
        params: { productId: '550e8400-e29b-41d4-a716-446655440000', imageId: '550e8400-e29b-41d4-a716-446655440001' },
      } as any;

      await controller.deleteImage(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: mockImages,
        message: 'Image deleted successfully',
      });
    });

    it('should handle validation error when deleting last image', async () => {
      mockService.deleteImage.mockRejectedValue(
        new ValidationError('Product must have at least one image')
      );

      const mockRequest = {
        params: { productId: '550e8400-e29b-41d4-a716-446655440000', imageId: '550e8400-e29b-41d4-a716-446655440001' },
      } as any;

      await controller.deleteImage(mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: 'Product must have at least one image',
      });
    });
  });

  describe('getProductImages', () => {
    it('should return product images', async () => {
      const mockImages: ProductImage[] = [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          productId: '550e8400-e29b-41d4-a716-446655440000',
          imagePath: 'path-1',
          imageUrl: 'url-1',
          displayOrder: 0,
          isPrimary: true,
          fileSize: 50000,
          mimeType: 'image/jpeg',
          width: 800,
          height: 600,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockService.getProductImages.mockResolvedValue(mockImages);

      const mockRequest = {
        params: { productId: '550e8400-e29b-41d4-a716-446655440000' },
      } as any;

      await controller.getProductImages(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: mockImages,
        message: 'Product images retrieved successfully',
      });
    });

    it('should handle not found error', async () => {
      mockService.getProductImages.mockRejectedValue(
        new NotFoundError('Product not found')
      );

      const mockRequest = {
        params: { productId: '550e8400-e29b-41d4-a716-446655440000' },
      } as any;

      await controller.getProductImages(mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(404);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: 'Product not found',
      });
    });
  });
});

