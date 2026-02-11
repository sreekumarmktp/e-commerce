import fc from 'fast-check';
import { ProductService } from '../application/services/ProductService';
import { ProductRepository } from '../infrastructure/repositories/ProductRepository';
import { Product, CreateProductRequest, UpdateProductRequest } from '../domain/entities/Product';

// Mock uuid to avoid ES module issues
jest.mock('uuid', () => ({
  v4: () => 'test-uuid-' + Math.random().toString(36).substring(7)
}));

/**
 * Property-Based Tests for Product API Field Acceptance
 * Feature: product-variant-management
 * 
 * These tests verify that the API layer correctly accepts and persists
 * sizesEnabled and colorsEnabled fields in product creation and update requests.
 */

describe('Product API Field Acceptance - Property Tests', () => {
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
  });

  /**
   * Property 16: API Field Acceptance
   * **Validates: Requirements 8.1, 8.2**
   * 
   * For any product creation or update request that includes sizesEnabled and 
   * colorsEnabled fields, the service should accept and persist these fields.
   */
  describe('Property 16: API Field Acceptance', () => {
    it('should accept and persist sizesEnabled and colorsEnabled in product creation', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }),
            description: fc.string({ maxLength: 200 }),
            price: fc.double({ min: 0.01, max: 10000, noNaN: true }),
            category: fc.constantFrom('sarees', 'suits', 'lehenga', 'kurtas', 'gowns'),
            stock: fc.integer({ min: 0, max: 1000 }),
            sizesEnabled: fc.boolean(),
            colorsEnabled: fc.boolean(),
            sizes: fc.array(
              fc.string({ minLength: 1, maxLength: 20 })
                .filter(s => /^[a-zA-Z0-9\s\-\/]+$/.test(s)),
              { maxLength: 3 }
            ).map(arr => [...new Set(arr)]), // Ensure unique values
            colors: fc.array(
              fc.string({ minLength: 1, maxLength: 30 })
                .filter(s => /^[a-zA-Z0-9\s]+$/.test(s)),
              { maxLength: 3 }
            ).map(arr => [...new Set(arr)]) // Ensure unique values
          }),
          async (productData) => {
            // Create product request with variant toggle fields
            const createRequest: CreateProductRequest = {
              name: productData.name,
              description: productData.description,
              price: productData.price,
              image: 'test-image.jpg',
              images: ['test-image.jpg'],
              sizes: productData.sizes,
              colors: productData.colors,
              sizesEnabled: productData.sizesEnabled,
              colorsEnabled: productData.colorsEnabled,
              category: productData.category,
              stock: productData.stock
            };

            // Create product through service (simulating API call)
            const createdProduct = await service.createProduct(createRequest);
            testProducts.push(createdProduct);

            // Verify the fields were accepted and persisted
            expect(createdProduct.sizesEnabled).toBe(productData.sizesEnabled);
            expect(createdProduct.colorsEnabled).toBe(productData.colorsEnabled);
            expect(createdProduct.sizes).toEqual(productData.sizes);
            expect(createdProduct.colors).toEqual(productData.colors);

            // Retrieve product from repository to verify persistence
            const retrievedProduct = await repository.findById(createdProduct.id);
            expect(retrievedProduct).not.toBeNull();
            expect(retrievedProduct!.sizesEnabled).toBe(productData.sizesEnabled);
            expect(retrievedProduct!.colorsEnabled).toBe(productData.colorsEnabled);
          }
        ),
        { numRuns: 5 }
      );
    }, 60000); // 60 second timeout for property test

    it('should accept and persist sizesEnabled in product update', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.boolean(),
          async (newSizesEnabled) => {
            // Create initial product with default settings
            const initialProduct = await repository.create({
              name: 'Test Product ' + Math.random().toString(36).substring(7),
              description: 'Test description',
              price: 99.99,
              image: 'test.jpg',
              images: ['test.jpg'],
              sizes: ['S', 'M', 'L'],
              colors: ['Red', 'Blue'],
              sizesEnabled: true,
              colorsEnabled: true,
              category: 'test',
              stock: 10
            });
            testProducts.push(initialProduct);

            // Update product with new sizesEnabled value
            const updateRequest: UpdateProductRequest = {
              sizesEnabled: newSizesEnabled
            };

            const updatedProduct = await service.updateProduct(
              initialProduct.id, 
              updateRequest
            );

            // Verify the field was accepted and persisted
            expect(updatedProduct).not.toBeNull();
            expect(updatedProduct!.sizesEnabled).toBe(newSizesEnabled);

            // Retrieve product from repository to verify persistence
            const retrievedProduct = await repository.findById(initialProduct.id);
            expect(retrievedProduct).not.toBeNull();
            expect(retrievedProduct!.sizesEnabled).toBe(newSizesEnabled);
          }
        ),
        { numRuns: 5 }
      );
    }, 60000);

    it('should accept and persist colorsEnabled in product update', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.boolean(),
          async (newColorsEnabled) => {
            // Create initial product with default settings
            const initialProduct = await repository.create({
              name: 'Test Product ' + Math.random().toString(36).substring(7),
              description: 'Test description',
              price: 99.99,
              image: 'test.jpg',
              images: ['test.jpg'],
              sizes: ['S', 'M', 'L'],
              colors: ['Red', 'Blue'],
              sizesEnabled: true,
              colorsEnabled: true,
              category: 'test',
              stock: 10
            });
            testProducts.push(initialProduct);

            // Update product with new colorsEnabled value
            const updateRequest: UpdateProductRequest = {
              colorsEnabled: newColorsEnabled
            };

            const updatedProduct = await service.updateProduct(
              initialProduct.id, 
              updateRequest
            );

            // Verify the field was accepted and persisted
            expect(updatedProduct).not.toBeNull();
            expect(updatedProduct!.colorsEnabled).toBe(newColorsEnabled);

            // Retrieve product from repository to verify persistence
            const retrievedProduct = await repository.findById(initialProduct.id);
            expect(retrievedProduct).not.toBeNull();
            expect(retrievedProduct!.colorsEnabled).toBe(newColorsEnabled);
          }
        ),
        { numRuns: 5 }
      );
    }, 60000);

    it('should accept and persist both sizesEnabled and colorsEnabled in product update', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            sizesEnabled: fc.boolean(),
            colorsEnabled: fc.boolean()
          }),
          async (variantSettings) => {
            // Create initial product with default settings
            const initialProduct = await repository.create({
              name: 'Test Product ' + Math.random().toString(36).substring(7),
              description: 'Test description',
              price: 99.99,
              image: 'test.jpg',
              images: ['test.jpg'],
              sizes: ['S', 'M', 'L'],
              colors: ['Red', 'Blue'],
              sizesEnabled: true,
              colorsEnabled: true,
              category: 'test',
              stock: 10
            });
            testProducts.push(initialProduct);

            // Update product with both variant toggle fields
            const updateRequest: UpdateProductRequest = {
              sizesEnabled: variantSettings.sizesEnabled,
              colorsEnabled: variantSettings.colorsEnabled
            };

            const updatedProduct = await service.updateProduct(
              initialProduct.id, 
              updateRequest
            );

            // Verify both fields were accepted and persisted
            expect(updatedProduct).not.toBeNull();
            expect(updatedProduct!.sizesEnabled).toBe(variantSettings.sizesEnabled);
            expect(updatedProduct!.colorsEnabled).toBe(variantSettings.colorsEnabled);

            // Retrieve product from repository to verify persistence
            const retrievedProduct = await repository.findById(initialProduct.id);
            expect(retrievedProduct).not.toBeNull();
            expect(retrievedProduct!.sizesEnabled).toBe(variantSettings.sizesEnabled);
            expect(retrievedProduct!.colorsEnabled).toBe(variantSettings.colorsEnabled);
          }
        ),
        { numRuns: 5 }
      );
    }, 60000);

    it('should handle product creation with only sizesEnabled specified', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.boolean(),
          async (sizesEnabled) => {
            // Create product with only sizesEnabled specified
            const createRequest: CreateProductRequest = {
              name: 'Test Product ' + Math.random().toString(36).substring(7),
              description: 'Test description',
              price: 99.99,
              image: 'test.jpg',
              images: ['test.jpg'],
              sizes: ['S', 'M'],
              colors: ['Red'],
              sizesEnabled: sizesEnabled,
              // colorsEnabled not specified - should use default
              category: 'test',
              stock: 10
            };

            const createdProduct = await service.createProduct(createRequest);
            testProducts.push(createdProduct);

            // Verify sizesEnabled was accepted
            expect(createdProduct.sizesEnabled).toBe(sizesEnabled);
            // colorsEnabled should have a default value (true)
            expect(createdProduct.colorsEnabled).toBeDefined();
          }
        ),
        { numRuns: 5 }
      );
    }, 60000);

    it('should handle product creation with only colorsEnabled specified', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.boolean(),
          async (colorsEnabled) => {
            // Create product with only colorsEnabled specified
            const createRequest: CreateProductRequest = {
              name: 'Test Product ' + Math.random().toString(36).substring(7),
              description: 'Test description',
              price: 99.99,
              image: 'test.jpg',
              images: ['test.jpg'],
              sizes: ['S', 'M'],
              colors: ['Red'],
              colorsEnabled: colorsEnabled,
              // sizesEnabled not specified - should use default
              category: 'test',
              stock: 10
            };

            const createdProduct = await service.createProduct(createRequest);
            testProducts.push(createdProduct);

            // Verify colorsEnabled was accepted
            expect(createdProduct.colorsEnabled).toBe(colorsEnabled);
            // sizesEnabled should have a default value (true)
            expect(createdProduct.sizesEnabled).toBeDefined();
          }
        ),
        { numRuns: 5 }
      );
    }, 60000);
  });

  /**
   * Property 14: API Response Completeness
   * **Validates: Requirements 8.3, 8.4, 8.5**
   * 
   * For any product retrieved through the API, the response should include 
   * sizesEnabled, colorsEnabled, sizes array, and colors array fields.
   */
  describe('Property 14: API Response Completeness', () => {
    it('should include all variant fields in product retrieval response', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }),
            description: fc.string({ maxLength: 200 }),
            price: fc.double({ min: 0.01, max: 10000, noNaN: true }),
            category: fc.constantFrom('sarees', 'suits', 'lehenga', 'kurtas', 'gowns'),
            stock: fc.integer({ min: 0, max: 1000 }),
            sizesEnabled: fc.boolean(),
            colorsEnabled: fc.boolean(),
            sizes: fc.array(
              fc.string({ minLength: 1, maxLength: 20 })
                .filter(s => /^[a-zA-Z0-9\s\-\/]+$/.test(s)),
              { maxLength: 5 }
            ).map(arr => [...new Set(arr)]), // Ensure unique values
            colors: fc.array(
              fc.string({ minLength: 1, maxLength: 30 })
                .filter(s => /^[a-zA-Z0-9\s]+$/.test(s)),
              { maxLength: 5 }
            ).map(arr => [...new Set(arr)]) // Ensure unique values
          }),
          async (productData) => {
            // Create a product with specific variant settings
            const createRequest: CreateProductRequest = {
              name: productData.name,
              description: productData.description,
              price: productData.price,
              image: 'test-image.jpg',
              images: ['test-image.jpg'],
              sizes: productData.sizes,
              colors: productData.colors,
              sizesEnabled: productData.sizesEnabled,
              colorsEnabled: productData.colorsEnabled,
              category: productData.category,
              stock: productData.stock
            };

            // Create product through service (simulating API call)
            const createdProduct = await service.createProduct(createRequest);
            testProducts.push(createdProduct);

            // Retrieve product through service (simulating API GET request)
            const retrievedProduct = await service.getProductById(createdProduct.id);

            // Verify all required fields are present in the response
            expect(retrievedProduct).toBeDefined();
            expect(retrievedProduct).not.toBeNull();
            
            // Requirement 8.3: Response includes sizesEnabled field
            expect(retrievedProduct!.sizesEnabled).toBeDefined();
            expect(typeof retrievedProduct!.sizesEnabled).toBe('boolean');
            expect(retrievedProduct!.sizesEnabled).toBe(productData.sizesEnabled);
            
            // Requirement 8.4: Response includes colorsEnabled field
            expect(retrievedProduct!.colorsEnabled).toBeDefined();
            expect(typeof retrievedProduct!.colorsEnabled).toBe('boolean');
            expect(retrievedProduct!.colorsEnabled).toBe(productData.colorsEnabled);
            
            // Requirement 8.5: Response includes sizes array
            expect(retrievedProduct!.sizes).toBeDefined();
            expect(Array.isArray(retrievedProduct!.sizes)).toBe(true);
            expect(retrievedProduct!.sizes).toEqual(productData.sizes);
            
            // Requirement 8.5: Response includes colors array
            expect(retrievedProduct!.colors).toBeDefined();
            expect(Array.isArray(retrievedProduct!.colors)).toBe(true);
            expect(retrievedProduct!.colors).toEqual(productData.colors);
          }
        ),
        { numRuns: 5 }
      );
    }, 60000); // 60 second timeout for property test

    it('should include variant fields when retrieving all products', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 50 }),
              description: fc.string({ maxLength: 200 }),
              price: fc.double({ min: 0.01, max: 10000, noNaN: true }),
              category: fc.constantFrom('sarees', 'suits', 'lehenga', 'kurtas', 'gowns'),
              stock: fc.integer({ min: 0, max: 1000 }),
              sizesEnabled: fc.boolean(),
              colorsEnabled: fc.boolean(),
              sizes: fc.array(
                fc.string({ minLength: 1, maxLength: 20 })
                  .filter(s => /^[a-zA-Z0-9\s\-\/]+$/.test(s)),
                { maxLength: 3 }
              ).map(arr => [...new Set(arr)]),
              colors: fc.array(
                fc.string({ minLength: 1, maxLength: 30 })
                  .filter(s => /^[a-zA-Z0-9\s]+$/.test(s)),
                { maxLength: 3 }
              ).map(arr => [...new Set(arr)])
            }),
            { minLength: 1, maxLength: 3 }
          ),
          async (productsData) => {
            // Create multiple products
            const createdProducts: Product[] = [];
            for (const productData of productsData) {
              const createRequest: CreateProductRequest = {
                name: productData.name + '-' + Math.random().toString(36).substring(7),
                description: productData.description,
                price: productData.price,
                image: 'test-image.jpg',
                images: ['test-image.jpg'],
                sizes: productData.sizes,
                colors: productData.colors,
                sizesEnabled: productData.sizesEnabled,
                colorsEnabled: productData.colorsEnabled,
                category: productData.category,
                stock: productData.stock
              };

              const createdProduct = await service.createProduct(createRequest);
              createdProducts.push(createdProduct);
              testProducts.push(createdProduct);
            }

            // Retrieve all products through service (simulating API GET /products)
            const allProducts = await service.getAllProducts();

            // Verify each created product is in the response with all variant fields
            for (const createdProduct of createdProducts) {
              const foundProduct = allProducts.find(p => p.id === createdProduct.id);
              
              expect(foundProduct).toBeDefined();
              
              // Verify all variant fields are present
              expect(foundProduct!.sizesEnabled).toBeDefined();
              expect(typeof foundProduct!.sizesEnabled).toBe('boolean');
              
              expect(foundProduct!.colorsEnabled).toBeDefined();
              expect(typeof foundProduct!.colorsEnabled).toBe('boolean');
              
              expect(foundProduct!.sizes).toBeDefined();
              expect(Array.isArray(foundProduct!.sizes)).toBe(true);
              
              expect(foundProduct!.colors).toBeDefined();
              expect(Array.isArray(foundProduct!.colors)).toBe(true);
            }
          }
        ),
        { numRuns: 5 }
      );
    }, 90000); // 90 second timeout for property test with multiple products

    it('should include variant fields after updating product', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            initialSizesEnabled: fc.boolean(),
            initialColorsEnabled: fc.boolean(),
            updatedSizesEnabled: fc.boolean(),
            updatedColorsEnabled: fc.boolean()
          }),
          async (testData) => {
            // Create initial product
            const initialProduct = await repository.create({
              name: 'Test Product ' + Math.random().toString(36).substring(7),
              description: 'Test description',
              price: 99.99,
              image: 'test.jpg',
              images: ['test.jpg'],
              sizes: ['S', 'M', 'L'],
              colors: ['Red', 'Blue'],
              sizesEnabled: testData.initialSizesEnabled,
              colorsEnabled: testData.initialColorsEnabled,
              category: 'test',
              stock: 10
            });
            testProducts.push(initialProduct);

            // Update product with new variant settings
            const updateRequest: UpdateProductRequest = {
              sizesEnabled: testData.updatedSizesEnabled,
              colorsEnabled: testData.updatedColorsEnabled
            };

            await service.updateProduct(initialProduct.id, updateRequest);

            // Retrieve updated product through service (simulating API GET request)
            const retrievedProduct = await service.getProductById(initialProduct.id);

            // Verify all variant fields are present in the response
            expect(retrievedProduct).toBeDefined();
            expect(retrievedProduct).not.toBeNull();
            
            // Verify sizesEnabled field
            expect(retrievedProduct!.sizesEnabled).toBeDefined();
            expect(typeof retrievedProduct!.sizesEnabled).toBe('boolean');
            expect(retrievedProduct!.sizesEnabled).toBe(testData.updatedSizesEnabled);
            
            // Verify colorsEnabled field
            expect(retrievedProduct!.colorsEnabled).toBeDefined();
            expect(typeof retrievedProduct!.colorsEnabled).toBe('boolean');
            expect(retrievedProduct!.colorsEnabled).toBe(testData.updatedColorsEnabled);
            
            // Verify sizes array is present
            expect(retrievedProduct!.sizes).toBeDefined();
            expect(Array.isArray(retrievedProduct!.sizes)).toBe(true);
            
            // Verify colors array is present
            expect(retrievedProduct!.colors).toBeDefined();
            expect(Array.isArray(retrievedProduct!.colors)).toBe(true);
          }
        ),
        { numRuns: 5 }
      );
    }, 60000);

    it('should include empty arrays when product has no sizes or colors', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            sizesEnabled: fc.boolean(),
            colorsEnabled: fc.boolean()
          }),
          async (testData) => {
            // Create product with empty sizes and colors arrays
            const createRequest: CreateProductRequest = {
              name: 'Test Product ' + Math.random().toString(36).substring(7),
              description: 'Test description',
              price: 99.99,
              image: 'test.jpg',
              images: ['test.jpg'],
              sizes: [], // Empty array
              colors: [], // Empty array
              sizesEnabled: testData.sizesEnabled,
              colorsEnabled: testData.colorsEnabled,
              category: 'test',
              stock: 10
            };

            const createdProduct = await service.createProduct(createRequest);
            testProducts.push(createdProduct);

            // Retrieve product through service
            const retrievedProduct = await service.getProductById(createdProduct.id);

            // Verify all variant fields are present even with empty arrays
            expect(retrievedProduct).toBeDefined();
            expect(retrievedProduct).not.toBeNull();
            
            expect(retrievedProduct!.sizesEnabled).toBeDefined();
            expect(typeof retrievedProduct!.sizesEnabled).toBe('boolean');
            
            expect(retrievedProduct!.colorsEnabled).toBeDefined();
            expect(typeof retrievedProduct!.colorsEnabled).toBe('boolean');
            
            // Verify arrays are present and empty
            expect(retrievedProduct!.sizes).toBeDefined();
            expect(Array.isArray(retrievedProduct!.sizes)).toBe(true);
            expect(retrievedProduct!.sizes).toEqual([]);
            
            expect(retrievedProduct!.colors).toBeDefined();
            expect(Array.isArray(retrievedProduct!.colors)).toBe(true);
            expect(retrievedProduct!.colors).toEqual([]);
          }
        ),
        { numRuns: 5 }
      );
    }, 60000);
  });
});

