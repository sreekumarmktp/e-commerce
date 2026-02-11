import fc from 'fast-check';
import { ProductRepository } from '../infrastructure/repositories/ProductRepository';
import { Product } from '../domain/entities/Product';

// Mock uuid to avoid ES module issues
jest.mock('uuid', () => ({
  v4: () => 'test-uuid-' + Math.random().toString(36).substring(7)
}));

/**
 * Property-Based Tests for Product Variant Management
 * Feature: product-variant-management
 * 
 * These tests verify universal properties that should hold true across all valid inputs
 * using randomized test data generation with fast-check.
 */

describe('ProductRepository Variant Management - Property Tests', () => {
  let repository: ProductRepository;
  let testProducts: Product[] = [];

  beforeEach(() => {
    repository = new ProductRepository();
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
  });

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
      image: 'test.jpg',
      images: ['test.jpg'],
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
   * Property 2: Variant Value Addition Round Trip
   * **Validates: Requirements 2.3, 3.3**
   * 
   * For any product and any valid variant value (size or color), 
   * adding the value and then retrieving the product should result 
   * in the product containing that value in the respective array.
   */
  describe('Property 2: Variant Value Addition Round Trip', () => {
    it('should persist added size values', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 20 })
            .filter(s => /^[a-zA-Z0-9\s\-\/]+$/.test(s)),
          async (size) => {
            // Create a product with sizes enabled
            const product = await createTestProduct([], [], true, true);

            // Add size
            const updatedProduct = await repository.addSize(product.id, size);

            // Verify size is present in returned product
            expect(updatedProduct.sizes).toContain(size);

            // Retrieve product and verify persistence
            const retrievedProduct = await repository.findById(product.id);
            expect(retrievedProduct).not.toBeNull();
            expect(retrievedProduct!.sizes).toContain(size);
          }
        ),
        { numRuns: 10 }
      );
    }, 60000); // 60 second timeout for property test

    it('should persist added color values', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 30 })
            .filter(s => /^[a-zA-Z0-9\s]+$/.test(s)),
          async (color) => {
            // Create a product with colors enabled
            const product = await createTestProduct([], [], true, true);

            // Add color
            const updatedProduct = await repository.addColor(product.id, color);

            // Verify color is present in returned product
            expect(updatedProduct.colors).toContain(color);

            // Retrieve product and verify persistence
            const retrievedProduct = await repository.findById(product.id);
            expect(retrievedProduct).not.toBeNull();
            expect(retrievedProduct!.colors).toContain(color);
          }
        ),
        { numRuns: 10 }
      );
    }, 60000); // 60 second timeout for property test
  });

  /**
   * Property 3: Variant Value Removal Round Trip
   * **Validates: Requirements 2.4, 2.5, 3.4, 3.5**
   * 
   * For any product with an existing variant value, removing that value 
   * and then retrieving the product should result in the product no longer 
   * containing that value in the respective array.
   */
  describe('Property 3: Variant Value Removal Round Trip', () => {
    it('should remove size values and persist the change', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.string({ minLength: 1, maxLength: 20 })
              .filter(s => /^[a-zA-Z0-9\s\-\/]+$/.test(s)),
            { minLength: 1, maxLength: 5 }
          ).map(arr => [...new Set(arr)]), // Ensure unique values
          async (sizes) => {
            // Create a product with the given sizes
            const product = await createTestProduct(sizes, [], true, true);

            // Pick a random size to remove
            const sizeToRemove = sizes[0];

            // Remove the size
            const updatedProduct = await repository.removeSize(product.id, sizeToRemove);

            // Verify size is not present in returned product
            expect(updatedProduct.sizes).not.toContain(sizeToRemove);

            // Retrieve product and verify persistence
            const retrievedProduct = await repository.findById(product.id);
            expect(retrievedProduct).not.toBeNull();
            expect(retrievedProduct!.sizes).not.toContain(sizeToRemove);

            // Verify other sizes are still present
            const remainingSizes = sizes.filter(s => s !== sizeToRemove);
            for (const size of remainingSizes) {
              expect(retrievedProduct!.sizes).toContain(size);
            }
          }
        ),
        { numRuns: 10 }
      );
    }, 60000); // 60 second timeout for property test

    it('should remove color values and persist the change', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.string({ minLength: 1, maxLength: 30 })
              .filter(s => /^[a-zA-Z0-9\s]+$/.test(s)),
            { minLength: 1, maxLength: 5 }
          ).map(arr => [...new Set(arr)]), // Ensure unique values
          async (colors) => {
            // Create a product with the given colors
            const product = await createTestProduct([], colors, true, true);

            // Pick a random color to remove
            const colorToRemove = colors[0];

            // Remove the color
            const updatedProduct = await repository.removeColor(product.id, colorToRemove);

            // Verify color is not present in returned product
            expect(updatedProduct.colors).not.toContain(colorToRemove);

            // Retrieve product and verify persistence
            const retrievedProduct = await repository.findById(product.id);
            expect(retrievedProduct).not.toBeNull();
            expect(retrievedProduct!.colors).not.toContain(colorToRemove);

            // Verify other colors are still present
            const remainingColors = colors.filter(c => c !== colorToRemove);
            for (const color of remainingColors) {
              expect(retrievedProduct!.colors).toContain(color);
            }
          }
        ),
        { numRuns: 10 }
      );
    }, 60000); // 60 second timeout for property test
  });
});
