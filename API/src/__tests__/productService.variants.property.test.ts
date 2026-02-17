import fc from 'fast-check';
import { ProductService } from '../application/services/ProductService';
import { ProductRepository } from '../infrastructure/repositories/ProductRepository';
import { Product } from '../domain/entities/Product';

// Mock uuid to avoid ES module issues
jest.mock('uuid', () => ({
  v4: () => 'test-uuid-' + Math.random().toString(36).substring(7)
}));

/**
 * Property-Based Tests for ProductService Variant Management
 * Feature: product-variant-management
 * 
 * These tests verify universal properties that should hold true across all valid inputs
 * using randomized test data generation with fast-check.
 */

describe('ProductService Variant Management - Property Tests', () => {
  let repository: ProductRepository;
  let service: ProductService;
  let testProducts: Product[] = [];

  beforeEach(() => {
    repository = new ProductRepository();
    service = new ProductService(repository);
    testProducts = [];
  });

  afterEach(async () => {
    // Cleanup: delete all test products
    for (const product of testProducts) {
      try {
        await repository.delete(product.id);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  }, 30000);

  /**
   * Helper function to create a test product
   */
  async function createTestProduct(
    sizes: string[] = ['S', 'M', 'L'],
    colors: string[] = ['Red', 'Blue'],
    sizesEnabled: boolean = true,
    colorsEnabled: boolean = true
  ): Promise<Product> {
    const randomId = Math.random().toString(36).substring(7);
    const product = await repository.create({
      name: 'Test Product ' + randomId,
      description: 'Test description',
      price: 99.99,
      primaryImagePath: 'test.jpg',
      sizes,
      colors,
      sizesEnabled,
      colorsEnabled,
      category: 'test',
      stock: 10
    });
    testProducts.push(product);
    return product;
  }

  /**
   * Property 1: Variant Toggle Preserves Values
   * **Validates: Requirements 1.3, 1.4**
   * 
   * For any product with non-empty sizes or colors arrays, disabling the respective 
   * variant type (sizesEnabled or colorsEnabled) should preserve the existing array 
   * values unchanged.
   */
  describe('Property 1: Variant Toggle Preserves Values', () => {
    it('should preserve size values when toggling sizesEnabled', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.string({ minLength: 1, maxLength: 20 })
              .filter(s => /^[a-zA-Z0-9\s\-\/]+$/.test(s)),
            { minLength: 1, maxLength: 3 }
          ).map(arr => [...new Set(arr)]), // Ensure unique values
          async (sizes) => {
            // Create a product with sizes enabled
            const product = await createTestProduct(sizes, ['Red'], true, true);

            // Toggle sizes to disabled
            const updatedProduct = await service.toggleVariants(product.id, { 
              sizesEnabled: false 
            });

            // Verify sizes array is preserved
            expect(updatedProduct.sizes).toEqual(sizes);
            expect(updatedProduct.sizesEnabled).toBe(false);

            // Retrieve and verify persistence
            const retrievedProduct = await repository.findById(product.id);
            expect(retrievedProduct).not.toBeNull();
            expect(retrievedProduct!.sizes).toEqual(sizes);
            expect(retrievedProduct!.sizesEnabled).toBe(false);
          }
        ),
        { numRuns: 5 }
      );
    }, 60000); // 60 second timeout for property test

    it('should preserve color values when toggling colorsEnabled', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.string({ minLength: 1, maxLength: 30 })
              .filter(s => /^[a-zA-Z0-9\s]+$/.test(s)),
            { minLength: 1, maxLength: 3 }
          ).map(arr => [...new Set(arr)]), // Ensure unique values
          async (colors) => {
            // Create a product with colors enabled
            const product = await createTestProduct(['S'], colors, true, true);

            // Toggle colors to disabled
            const updatedProduct = await service.toggleVariants(product.id, { 
              colorsEnabled: false 
            });

            // Verify colors array is preserved
            expect(updatedProduct.colors).toEqual(colors);
            expect(updatedProduct.colorsEnabled).toBe(false);

            // Retrieve and verify persistence
            const retrievedProduct = await repository.findById(product.id);
            expect(retrievedProduct).not.toBeNull();
            expect(retrievedProduct!.colors).toEqual(colors);
            expect(retrievedProduct!.colorsEnabled).toBe(false);
          }
        ),
        { numRuns: 5 }
      );
    }, 60000); // 60 second timeout for property test
  });

  /**
   * Property 4: Empty Value Validation
   * **Validates: Requirements 2.1, 3.1**
   * 
   * For any string that is empty or contains only whitespace characters, 
   * attempting to add it as a size or color value should fail validation 
   * with an appropriate error message.
   */
  describe('Property 4: Empty Value Validation', () => {
    it('should reject empty or whitespace-only size values', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string().filter(s => s.trim().length === 0),
          async (emptySize) => {
            // Create a product with sizes enabled
            const product = await createTestProduct([], [], true, true);

            // Attempt to add empty size
            await expect(
              service.addProductSize(product.id, emptySize)
            ).rejects.toThrow('Size value cannot be empty');
          }
        ),
        { numRuns: 5 }
      );
    }, 60000);

    it('should reject empty or whitespace-only color values', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string().filter(s => s.trim().length === 0),
          async (emptyColor) => {
            // Create a product with colors enabled
            const product = await createTestProduct([], [], true, true);

            // Attempt to add empty color
            await expect(
              service.addProductColor(product.id, emptyColor)
            ).rejects.toThrow('Color value cannot be empty');
          }
        ),
        { numRuns: 5 }
      );
    }, 60000);
  });

  /**
   * Property 5: Duplicate Prevention
   * **Validates: Requirements 2.2, 3.2**
   * 
   * For any product and any variant value already present in its sizes or colors array, 
   * attempting to add that same value again should fail with a "value already exists" error.
   */
  describe('Property 5: Duplicate Prevention', () => {
    it('should prevent duplicate size values', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 20 })
            .filter(s => /^[a-zA-Z0-9\s\-\/]+$/.test(s)),
          async (size) => {
            // Create a product with the size already present
            const product = await createTestProduct([size], [], true, true);

            // Attempt to add the same size again
            await expect(
              service.addProductSize(product.id, size)
            ).rejects.toThrow('Size value already exists');
          }
        ),
        { numRuns: 5 }
      );
    }, 60000);

    it('should prevent duplicate color values', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 30 })
            .filter(s => /^[a-zA-Z0-9\s]+$/.test(s)),
          async (color) => {
            // Create a product with the color already present
            const product = await createTestProduct([], [color], true, true);

            // Attempt to add the same color again
            await expect(
              service.addProductColor(product.id, color)
            ).rejects.toThrow('Color value already exists');
          }
        ),
        { numRuns: 5 }
      );
    }, 60000);
  });

  /**
   * Property 6: Size Value Character Validation
   * **Validates: Requirements 2.6**
   * 
   * For any string containing characters outside the allowed set (alphanumeric, spaces, 
   * hyphens, slashes), attempting to add it as a size value should fail validation. 
   * For any string within the allowed character set and under 20 characters, 
   * validation should pass.
   */
  describe('Property 6: Size Value Character Validation', () => {
    it('should reject sizes with invalid characters', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 20 })
            .filter(s => s.trim().length > 0 && !/^[a-zA-Z0-9\s\-\/]+$/.test(s)),
          async (invalidSize) => {
            // Create a product with sizes enabled
            const product = await createTestProduct([], [], true, true);

            // Attempt to add size with invalid characters
            await expect(
              service.addProductSize(product.id, invalidSize)
            ).rejects.toThrow('Size value contains invalid characters');
          }
        ),
        { numRuns: 5 }
      );
    }, 60000);

    it('should accept sizes with valid characters', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 20 })
            .filter(s => /^[a-zA-Z0-9\s\-\/]+$/.test(s) && s.trim().length > 0),
          async (validSize) => {
            // Create a product with sizes enabled
            const product = await createTestProduct([], [], true, true);

            // Add size with valid characters
            const updatedProduct = await service.addProductSize(product.id, validSize);

            // Verify size was added
            expect(updatedProduct.sizes).toContain(validSize);
          }
        ),
        { numRuns: 5 }
      );
    }, 60000);

    it('should reject sizes longer than 20 characters', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 21, maxLength: 50 })
            .filter(s => /^[a-zA-Z0-9\s\-\/]+$/.test(s)),
          async (longSize) => {
            // Create a product with sizes enabled
            const product = await createTestProduct([], [], true, true);

            // Attempt to add size that's too long
            await expect(
              service.addProductSize(product.id, longSize)
            ).rejects.toThrow('Size value is too long (max 20 characters)');
          }
        ),
        { numRuns: 5 }
      );
    }, 60000);
  });

  /**
   * Property 7: Color Value Character Validation
   * **Validates: Requirements 3.6**
   * 
   * For any string containing characters outside the allowed set (alphanumeric and spaces), 
   * attempting to add it as a color value should fail validation. For any string within 
   * the allowed character set and under 30 characters, validation should pass.
   */
  describe('Property 7: Color Value Character Validation', () => {
    it('should reject colors with invalid characters', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 30 })
            .filter(s => s.trim().length > 0 && !/^[a-zA-Z0-9\s]+$/.test(s)),
          async (invalidColor) => {
            // Create a product with colors enabled
            const product = await createTestProduct([], [], true, true);

            // Attempt to add color with invalid characters
            await expect(
              service.addProductColor(product.id, invalidColor)
            ).rejects.toThrow('Color value contains invalid characters');
          }
        ),
        { numRuns: 5 }
      );
    }, 60000);

    it('should accept colors with valid characters', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 30 })
            .filter(s => /^[a-zA-Z0-9\s]+$/.test(s) && s.trim().length > 0),
          async (validColor) => {
            // Create a product with colors enabled
            const product = await createTestProduct([], [], true, true);

            // Add color with valid characters
            const updatedProduct = await service.addProductColor(product.id, validColor);

            // Verify color was added
            expect(updatedProduct.colors).toContain(validColor);
          }
        ),
        { numRuns: 5 }
      );
    }, 60000);

    it('should reject colors longer than 30 characters', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.constantFrom('a', 'b', 'c', 'd', 'e', ' ', '1', '2', '3'), { minLength: 31, maxLength: 50 }),
          async (charArray) => {
            const longColor = charArray.join('');
            // Create a product with colors enabled
            const product = await createTestProduct([], [], true, true);

            // Attempt to add color that's too long
            await expect(
              service.addProductColor(product.id, longColor)
            ).rejects.toThrow('Color value is too long (max 30 characters)');
          }
        ),
        { numRuns: 5 }
      );
    }, 120000);
  });
});

