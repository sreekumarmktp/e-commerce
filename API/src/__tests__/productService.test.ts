import { ProductService } from '../application/services/ProductService';
import { IProductRepository } from '../domain/repositories/IProductRepository';
import { Product } from '../domain/entities/Product';

describe('ProductService', () => {
  let mockRepo: IProductRepository;
  let service: ProductService;

  beforeEach(() => {
    mockRepo = {
      findAll: async () => [],
      findById: async () => null,
      findByCategory: async () => [],
      create: async (p: any) => ({ ...p, id: 'test-id', createdAt: new Date(), updatedAt: new Date() } as Product),
      update: async () => null,
      delete: async () => false,
      updateVariantSettings: async () => ({} as Product),
      addSize: async () => ({} as Product),
      removeSize: async () => ({} as Product),
      addColor: async () => ({} as Product),
      removeColor: async () => ({} as Product)
    };

    service = new ProductService(mockRepo);
  });

  test('createProduct rejects invalid price', async () => {
    await expect(
      service.createProduct({
        name: 'Test',
        description: 'd',
        price: 0,
        image: 'x',
        images: [],
        sizes: [],
        colors: [],
        category: 'c',
        stock: 1
      })
    ).rejects.toThrow(/Valid price is required/);
  });
});



describe('ProductService - Variant Management', () => {
  let mockRepo: IProductRepository;
  let service: ProductService;

  beforeEach(() => {
    mockRepo = {
      findAll: async () => [],
      findById: async () => null,
      findByCategory: async () => [],
      create: async (p: any) => ({ ...p, id: 'test-id', createdAt: new Date(), updatedAt: new Date() } as Product),
      update: async () => null,
      delete: async () => false,
      updateVariantSettings: async () => ({} as Product),
      addSize: async () => ({} as Product),
      removeSize: async () => ({} as Product),
      addColor: async () => ({} as Product),
      removeColor: async () => ({} as Product)
    };

    service = new ProductService(mockRepo);
  });

  describe('toggleVariants', () => {
    it('should throw NotFoundError when product does not exist', async () => {
      mockRepo.findById = async () => null;

      await expect(
        service.toggleVariants('non-existent-id', { sizesEnabled: false })
      ).rejects.toThrow('Product not found');
    });

    it('should call updateVariantSettings when product exists', async () => {
      const mockProduct: Product = {
        id: 'test-id',
        name: 'Test Product',
        description: 'Test',
        price: 99.99,
        image: 'test.jpg',
        images: ['test.jpg'],
        sizes: ['S', 'M', 'L'],
        colors: ['Red', 'Blue'],
        sizesEnabled: true,
        colorsEnabled: true,
        category: 'test',
        stock: 10,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRepo.findById = async () => mockProduct;
      mockRepo.updateVariantSettings = jest.fn().mockResolvedValue(mockProduct);

      await service.toggleVariants('test-id', { sizesEnabled: false });

      expect(mockRepo.updateVariantSettings).toHaveBeenCalledWith('test-id', { sizesEnabled: false });
    });
  });

  describe('validateSizeValue', () => {
    it('should reject empty size value', () => {
      const result = service.validateSizeValue('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Size value cannot be empty');
    });

    it('should reject whitespace-only size value', () => {
      const result = service.validateSizeValue('   ');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Size value cannot be empty');
    });

    it('should reject size with invalid characters', () => {
      const result = service.validateSizeValue('XL@#$');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Size value contains invalid characters');
    });

    it('should reject size longer than 20 characters', () => {
      const result = service.validateSizeValue('X'.repeat(21));
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Size value is too long (max 20 characters)');
    });

    it('should accept valid size with alphanumeric characters', () => {
      const result = service.validateSizeValue('XL');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept valid size with hyphens', () => {
      const result = service.validateSizeValue('X-Large');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept valid size with slashes', () => {
      const result = service.validateSizeValue('S/M');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept valid size with spaces', () => {
      const result = service.validateSizeValue('Extra Large');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('validateColorValue', () => {
    it('should reject empty color value', () => {
      const result = service.validateColorValue('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Color value cannot be empty');
    });

    it('should reject whitespace-only color value', () => {
      const result = service.validateColorValue('   ');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Color value cannot be empty');
    });

    it('should reject color with invalid characters', () => {
      const result = service.validateColorValue('Red@Blue');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Color value contains invalid characters');
    });

    it('should reject color longer than 30 characters', () => {
      const result = service.validateColorValue('C'.repeat(31));
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Color value is too long (max 30 characters)');
    });

    it('should accept valid color with alphanumeric characters', () => {
      const result = service.validateColorValue('Red');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept valid color with spaces', () => {
      const result = service.validateColorValue('Light Blue');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept valid color with numbers', () => {
      const result = service.validateColorValue('Blue2');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('addProductSize', () => {
    it('should throw ValidationError for empty size', async () => {
      await expect(
        service.addProductSize('test-id', '')
      ).rejects.toThrow('Size value cannot be empty');
    });

    it('should throw ValidationError for invalid size characters', async () => {
      await expect(
        service.addProductSize('test-id', 'XL@#$')
      ).rejects.toThrow('Size value contains invalid characters');
    });

    it('should throw NotFoundError when product does not exist', async () => {
      mockRepo.findById = async () => null;

      await expect(
        service.addProductSize('non-existent-id', 'XL')
      ).rejects.toThrow('Product not found');
    });

    it('should throw ValidationError when sizes are not enabled', async () => {
      const mockProduct: Product = {
        id: 'test-id',
        name: 'Test Product',
        description: 'Test',
        price: 99.99,
        image: 'test.jpg',
        images: ['test.jpg'],
        sizes: [],
        colors: [],
        sizesEnabled: false,
        colorsEnabled: true,
        category: 'test',
        stock: 10,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRepo.findById = async () => mockProduct;

      await expect(
        service.addProductSize('test-id', 'XL')
      ).rejects.toThrow('Sizes are not enabled for this product');
    });

    it('should throw ValidationError for duplicate size', async () => {
      const mockProduct: Product = {
        id: 'test-id',
        name: 'Test Product',
        description: 'Test',
        price: 99.99,
        image: 'test.jpg',
        images: ['test.jpg'],
        sizes: ['S', 'M', 'L'],
        colors: [],
        sizesEnabled: true,
        colorsEnabled: true,
        category: 'test',
        stock: 10,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRepo.findById = async () => mockProduct;

      await expect(
        service.addProductSize('test-id', 'M')
      ).rejects.toThrow('Size value already exists');
    });

    it('should add size when all validations pass', async () => {
      const mockProduct: Product = {
        id: 'test-id',
        name: 'Test Product',
        description: 'Test',
        price: 99.99,
        image: 'test.jpg',
        images: ['test.jpg'],
        sizes: ['S', 'M'],
        colors: [],
        sizesEnabled: true,
        colorsEnabled: true,
        category: 'test',
        stock: 10,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRepo.findById = async () => mockProduct;
      mockRepo.addSize = jest.fn().mockResolvedValue({ ...mockProduct, sizes: ['S', 'M', 'XL'] });

      const result = await service.addProductSize('test-id', 'XL');

      expect(mockRepo.addSize).toHaveBeenCalledWith('test-id', 'XL');
      expect(result.sizes).toContain('XL');
    });
  });

  describe('removeProductSize', () => {
    it('should throw NotFoundError when product does not exist', async () => {
      mockRepo.findById = async () => null;

      await expect(
        service.removeProductSize('non-existent-id', 'XL')
      ).rejects.toThrow('Product not found');
    });

    it('should throw ValidationError when size does not exist', async () => {
      const mockProduct: Product = {
        id: 'test-id',
        name: 'Test Product',
        description: 'Test',
        price: 99.99,
        image: 'test.jpg',
        images: ['test.jpg'],
        sizes: ['S', 'M', 'L'],
        colors: [],
        sizesEnabled: true,
        colorsEnabled: true,
        category: 'test',
        stock: 10,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRepo.findById = async () => mockProduct;

      await expect(
        service.removeProductSize('test-id', 'XL')
      ).rejects.toThrow('Size value does not exist');
    });

    it('should remove size when it exists', async () => {
      const mockProduct: Product = {
        id: 'test-id',
        name: 'Test Product',
        description: 'Test',
        price: 99.99,
        image: 'test.jpg',
        images: ['test.jpg'],
        sizes: ['S', 'M', 'L'],
        colors: [],
        sizesEnabled: true,
        colorsEnabled: true,
        category: 'test',
        stock: 10,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRepo.findById = async () => mockProduct;
      mockRepo.removeSize = jest.fn().mockResolvedValue({ ...mockProduct, sizes: ['S', 'M'] });

      const result = await service.removeProductSize('test-id', 'L');

      expect(mockRepo.removeSize).toHaveBeenCalledWith('test-id', 'L');
      expect(result.sizes).not.toContain('L');
    });
  });

  describe('addProductColor', () => {
    it('should throw ValidationError for empty color', async () => {
      await expect(
        service.addProductColor('test-id', '')
      ).rejects.toThrow('Color value cannot be empty');
    });

    it('should throw ValidationError for invalid color characters', async () => {
      await expect(
        service.addProductColor('test-id', 'Red@Blue')
      ).rejects.toThrow('Color value contains invalid characters');
    });

    it('should throw NotFoundError when product does not exist', async () => {
      mockRepo.findById = async () => null;

      await expect(
        service.addProductColor('non-existent-id', 'Green')
      ).rejects.toThrow('Product not found');
    });

    it('should throw ValidationError when colors are not enabled', async () => {
      const mockProduct: Product = {
        id: 'test-id',
        name: 'Test Product',
        description: 'Test',
        price: 99.99,
        image: 'test.jpg',
        images: ['test.jpg'],
        sizes: [],
        colors: [],
        sizesEnabled: true,
        colorsEnabled: false,
        category: 'test',
        stock: 10,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRepo.findById = async () => mockProduct;

      await expect(
        service.addProductColor('test-id', 'Green')
      ).rejects.toThrow('Colors are not enabled for this product');
    });

    it('should throw ValidationError for duplicate color', async () => {
      const mockProduct: Product = {
        id: 'test-id',
        name: 'Test Product',
        description: 'Test',
        price: 99.99,
        image: 'test.jpg',
        images: ['test.jpg'],
        sizes: [],
        colors: ['Red', 'Blue'],
        sizesEnabled: true,
        colorsEnabled: true,
        category: 'test',
        stock: 10,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRepo.findById = async () => mockProduct;

      await expect(
        service.addProductColor('test-id', 'Red')
      ).rejects.toThrow('Color value already exists');
    });

    it('should add color when all validations pass', async () => {
      const mockProduct: Product = {
        id: 'test-id',
        name: 'Test Product',
        description: 'Test',
        price: 99.99,
        image: 'test.jpg',
        images: ['test.jpg'],
        sizes: [],
        colors: ['Red', 'Blue'],
        sizesEnabled: true,
        colorsEnabled: true,
        category: 'test',
        stock: 10,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRepo.findById = async () => mockProduct;
      mockRepo.addColor = jest.fn().mockResolvedValue({ ...mockProduct, colors: ['Red', 'Blue', 'Green'] });

      const result = await service.addProductColor('test-id', 'Green');

      expect(mockRepo.addColor).toHaveBeenCalledWith('test-id', 'Green');
      expect(result.colors).toContain('Green');
    });
  });

  describe('removeProductColor', () => {
    it('should throw NotFoundError when product does not exist', async () => {
      mockRepo.findById = async () => null;

      await expect(
        service.removeProductColor('non-existent-id', 'Red')
      ).rejects.toThrow('Product not found');
    });

    it('should throw ValidationError when color does not exist', async () => {
      const mockProduct: Product = {
        id: 'test-id',
        name: 'Test Product',
        description: 'Test',
        price: 99.99,
        image: 'test.jpg',
        images: ['test.jpg'],
        sizes: [],
        colors: ['Red', 'Blue'],
        sizesEnabled: true,
        colorsEnabled: true,
        category: 'test',
        stock: 10,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRepo.findById = async () => mockProduct;

      await expect(
        service.removeProductColor('test-id', 'Green')
      ).rejects.toThrow('Color value does not exist');
    });

    it('should remove color when it exists', async () => {
      const mockProduct: Product = {
        id: 'test-id',
        name: 'Test Product',
        description: 'Test',
        price: 99.99,
        image: 'test.jpg',
        images: ['test.jpg'],
        sizes: [],
        colors: ['Red', 'Blue', 'Green'],
        sizesEnabled: true,
        colorsEnabled: true,
        category: 'test',
        stock: 10,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRepo.findById = async () => mockProduct;
      mockRepo.removeColor = jest.fn().mockResolvedValue({ ...mockProduct, colors: ['Red', 'Blue'] });

      const result = await service.removeProductColor('test-id', 'Green');

      expect(mockRepo.removeColor).toHaveBeenCalledWith('test-id', 'Green');
      expect(result.colors).not.toContain('Green');
    });
  });
});
