import { ProductController } from '../presentation/controllers/ProductController';
import { IProductService } from '../domain/services/IProductService';
import { IImageStorageService } from '../domain/services/IImageStorageService';
import { Product } from '../domain/entities/Product';
import { FastifyRequest, FastifyReply } from 'fastify';
import { ZodError } from 'zod';

/**
 * Unit tests for ProductController variant management endpoints
 * Feature: product-variant-management
 * Requirements: 7.5
 */

describe('ProductController - Variant Management API Endpoints', () => {
  let mockService: IProductService;
  let mockImageStorageService: IImageStorageService;
  let controller: ProductController;
  let mockRequest: Partial<FastifyRequest>;
  let mockReply: Partial<FastifyReply>;

  const mockProduct: Product = {
    id: 'test-product-id',
    name: 'Test Product',
    description: 'Test Description',
    price: 99.99,
    primaryImagePath: 'test.jpg',
    sizes: ['S', 'M', 'L'],
    colors: ['Red', 'Blue'],
    sizesEnabled: true,
    colorsEnabled: true,
    category: 'test-category',
    stock: 10,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    // Mock service
    mockService = {
      getAllProducts: jest.fn(),
      getProductById: jest.fn(),
      getProductsByCategory: jest.fn(),
      createProduct: jest.fn(),
      updateProduct: jest.fn(),
      deleteProduct: jest.fn(),
      toggleVariants: jest.fn(),
      addProductSize: jest.fn(),
      removeProductSize: jest.fn(),
      addProductColor: jest.fn(),
      removeProductColor: jest.fn(),
      validateSizeValue: jest.fn(),
      validateColorValue: jest.fn()
    };

    // Mock image storage service
    mockImageStorageService = {
      uploadImage: jest.fn(),
      deleteImage: jest.fn(),
      getImageUrl: jest.fn().mockReturnValue('http://localhost:3001/uploads/test.jpg')
    };

    controller = new ProductController(mockService, mockImageStorageService);

    // Mock reply object
    mockReply = {
      code: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };
  });

  describe('toggleVariants', () => {
    it('should successfully toggle variant settings', async () => {
      const updatedProduct = { ...mockProduct, sizesEnabled: false };
      (mockService.toggleVariants as jest.Mock).mockResolvedValue(updatedProduct);

      mockRequest = {
        params: { id: 'test-product-id' },
        body: { sizesEnabled: false }
      };

      await controller.toggleVariants(
        mockRequest as FastifyRequest<{ Params: { id: string }; Body: unknown }>,
        mockReply as FastifyReply
      );

      expect(mockService.toggleVariants).toHaveBeenCalledWith('test-product-id', { sizesEnabled: false });
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: updatedProduct,
        message: 'Variant settings updated successfully'
      });
    });

    it('should return 404 when product not found', async () => {
      (mockService.toggleVariants as jest.Mock).mockRejectedValue(new Error('Product not found'));

      mockRequest = {
        params: { id: 'non-existent-id' },
        body: { sizesEnabled: false }
      };

      await controller.toggleVariants(
        mockRequest as FastifyRequest<{ Params: { id: string }; Body: unknown }>,
        mockReply as FastifyReply
      );

      expect(mockReply.code).toHaveBeenCalledWith(404);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: 'Product not found'
      });
    });

    it('should return 400 for validation errors', async () => {
      mockRequest = {
        params: { id: 'test-product-id' },
        body: {} // Missing required fields
      };

      await controller.toggleVariants(
        mockRequest as FastifyRequest<{ Params: { id: string }; Body: unknown }>,
        mockReply as FastifyReply
      );

      expect(mockReply.code).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalled();
    });
  });

  describe('addSize', () => {
    it('should successfully add a size', async () => {
      const updatedProduct = { ...mockProduct, sizes: [...mockProduct.sizes, 'XL'] };
      (mockService.addProductSize as jest.Mock).mockResolvedValue(updatedProduct);

      mockRequest = {
        params: { id: 'test-product-id' },
        body: { size: 'XL' }
      };

      await controller.addSize(
        mockRequest as FastifyRequest<{ Params: { id: string }; Body: unknown }>,
        mockReply as FastifyReply
      );

      expect(mockService.addProductSize).toHaveBeenCalledWith('test-product-id', 'XL');
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: updatedProduct,
        message: 'Size added successfully'
      });
    });

    it('should return 400 when size already exists', async () => {
      (mockService.addProductSize as jest.Mock).mockRejectedValue(new Error('Size value already exists'));

      mockRequest = {
        params: { id: 'test-product-id' },
        body: { size: 'M' }
      };

      await controller.addSize(
        mockRequest as FastifyRequest<{ Params: { id: string }; Body: unknown }>,
        mockReply as FastifyReply
      );

      expect(mockReply.code).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: 'Validation error',
        message: 'Size value already exists'
      });
    });

    it('should return 400 when size value is empty', async () => {
      (mockService.addProductSize as jest.Mock).mockRejectedValue(new Error('Size value cannot be empty'));

      mockRequest = {
        params: { id: 'test-product-id' },
        body: { size: '' }
      };

      await controller.addSize(
        mockRequest as FastifyRequest<{ Params: { id: string }; Body: unknown }>,
        mockReply as FastifyReply
      );

      expect(mockReply.code).toHaveBeenCalledWith(400);
    });
  });

  describe('removeSize', () => {
    it('should successfully remove a size', async () => {
      const updatedProduct = { ...mockProduct, sizes: ['S', 'M'] };
      (mockService.removeProductSize as jest.Mock).mockResolvedValue(updatedProduct);

      mockRequest = {
        params: { id: 'test-product-id', size: 'L' }
      };

      await controller.removeSize(
        mockRequest as FastifyRequest<{ Params: { id: string; size: string } }>,
        mockReply as FastifyReply
      );

      expect(mockService.removeProductSize).toHaveBeenCalledWith('test-product-id', 'L');
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: updatedProduct,
        message: 'Size removed successfully'
      });
    });

    it('should return 400 when size does not exist', async () => {
      (mockService.removeProductSize as jest.Mock).mockRejectedValue(new Error('Size value does not exist'));

      mockRequest = {
        params: { id: 'test-product-id', size: 'XXL' }
      };

      await controller.removeSize(
        mockRequest as FastifyRequest<{ Params: { id: string; size: string } }>,
        mockReply as FastifyReply
      );

      expect(mockReply.code).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: 'Validation error',
        message: 'Size value does not exist'
      });
    });
  });

  describe('addColor', () => {
    it('should successfully add a color', async () => {
      const updatedProduct = { ...mockProduct, colors: [...mockProduct.colors, 'Green'] };
      (mockService.addProductColor as jest.Mock).mockResolvedValue(updatedProduct);

      mockRequest = {
        params: { id: 'test-product-id' },
        body: { color: 'Green' }
      };

      await controller.addColor(
        mockRequest as FastifyRequest<{ Params: { id: string }; Body: unknown }>,
        mockReply as FastifyReply
      );

      expect(mockService.addProductColor).toHaveBeenCalledWith('test-product-id', 'Green');
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: updatedProduct,
        message: 'Color added successfully'
      });
    });

    it('should return 400 when color already exists', async () => {
      (mockService.addProductColor as jest.Mock).mockRejectedValue(new Error('Color value already exists'));

      mockRequest = {
        params: { id: 'test-product-id' },
        body: { color: 'Red' }
      };

      await controller.addColor(
        mockRequest as FastifyRequest<{ Params: { id: string }; Body: unknown }>,
        mockReply as FastifyReply
      );

      expect(mockReply.code).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: 'Validation error',
        message: 'Color value already exists'
      });
    });
  });

  describe('removeColor', () => {
    it('should successfully remove a color', async () => {
      const updatedProduct = { ...mockProduct, colors: ['Red'] };
      (mockService.removeProductColor as jest.Mock).mockResolvedValue(updatedProduct);

      mockRequest = {
        params: { id: 'test-product-id', color: 'Blue' }
      };

      await controller.removeColor(
        mockRequest as FastifyRequest<{ Params: { id: string; color: string } }>,
        mockReply as FastifyReply
      );

      expect(mockService.removeProductColor).toHaveBeenCalledWith('test-product-id', 'Blue');
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: updatedProduct,
        message: 'Color removed successfully'
      });
    });

    it('should return 404 when product not found', async () => {
      (mockService.removeProductColor as jest.Mock).mockRejectedValue(new Error('Product not found'));

      mockRequest = {
        params: { id: 'non-existent-id', color: 'Blue' }
      };

      await controller.removeColor(
        mockRequest as FastifyRequest<{ Params: { id: string; color: string } }>,
        mockReply as FastifyReply
      );

      expect(mockReply.code).toHaveBeenCalledWith(404);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: 'Product not found'
      });
    });
  });
});