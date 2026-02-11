import './../../setup';
import { ProductImageRepository } from '../../../infrastructure/repositories/ProductImageRepository';
import { ProductRepository } from '../../../infrastructure/repositories/ProductRepository';
import { Database } from '../../../infrastructure/database/Database';
import { ProductImage, ProductImageData } from '../../../domain/entities/ProductImage';

// Mock uuid to avoid ES module issues
jest.mock('uuid', () => ({
  v4: () => {
    // Generate a valid UUID v4 format
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}));

import { v4 as uuidv4 } from 'uuid';

describe('ProductImageRepository', () => {
  let imageRepository: ProductImageRepository;
  let productRepository: ProductRepository;
  let db: any;
  let testProductId: string;

  beforeAll(async () => {
    imageRepository = new ProductImageRepository();
    productRepository = new ProductRepository();
    db = Database.getInstance().getConnection();

    // Create a test product
    const product = await productRepository.create({
      name: 'Test Product',
      description: 'Test description',
      price: 100,
      image: 'test.jpg',
      images: [],
      sizes: [],
      colors: [],
      category: 'test',
      stock: 10,
    });
    testProductId = product.id;
  });

  beforeEach(async () => {
    // Clean up product_images table before each test
    await db.query('DELETE FROM product_images WHERE product_id = $1', [
      testProductId,
    ]);
  });

  afterAll(async () => {
    // Clean up after all tests
    await db.query('DELETE FROM product_images WHERE product_id = $1', [
      testProductId,
    ]);
    // Delete the test product
    await productRepository.delete(testProductId);
  });

  describe('createImage', () => {
    it('should create a new product image with all metadata', async () => {
      const imageData: ProductImageData = {
        imagePath: '/uploads/test-image.jpg',
        imageUrl: 'http://example.com/test-image.jpg',
        displayOrder: 0,
        fileSize: 102400,
        mimeType: 'image/jpeg',
        width: 800,
        height: 600,
      };

      const result = await imageRepository.createImage(testProductId, imageData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.productId).toBe(testProductId);
      expect(result.imagePath).toBe(imageData.imagePath);
      expect(result.imageUrl).toBe(imageData.imageUrl);
      expect(result.displayOrder).toBe(0);
      expect(result.isPrimary).toBe(false);
      expect(result.fileSize).toBe(102400);
      expect(result.mimeType).toBe('image/jpeg');
      expect(result.width).toBe(800);
      expect(result.height).toBe(600);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should set isPrimary to true when specified', async () => {
      const imageData: ProductImageData = {
        imagePath: '/uploads/primary-image.jpg',
        imageUrl: 'http://example.com/primary-image.jpg',
        displayOrder: 0,
        isPrimary: true,
        fileSize: 102400,
        mimeType: 'image/jpeg',
        width: 800,
        height: 600,
      };

      const result = await imageRepository.createImage(testProductId, imageData);

      expect(result.isPrimary).toBe(true);
    });

    it('should persist image to database', async () => {
      const imageData: ProductImageData = {
        imagePath: '/uploads/persist-test.jpg',
        imageUrl: 'http://example.com/persist-test.jpg',
        displayOrder: 0,
        fileSize: 102400,
        mimeType: 'image/jpeg',
        width: 800,
        height: 600,
      };

      const created = await imageRepository.createImage(testProductId, imageData);
      const retrieved = await imageRepository.getImageById(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.imagePath).toBe(imageData.imagePath);
    });
  });

  describe('getProductImages', () => {
    it('should return all images for a product in display order', async () => {
      const image1Data: ProductImageData = {
        imagePath: '/uploads/image1.jpg',
        imageUrl: 'http://example.com/image1.jpg',
        displayOrder: 0,
        fileSize: 102400,
        mimeType: 'image/jpeg',
        width: 800,
        height: 600,
      };

      const image2Data: ProductImageData = {
        imagePath: '/uploads/image2.jpg',
        imageUrl: 'http://example.com/image2.jpg',
        displayOrder: 1,
        fileSize: 102400,
        mimeType: 'image/jpeg',
        width: 800,
        height: 600,
      };

      await imageRepository.createImage(testProductId, image1Data);
      await imageRepository.createImage(testProductId, image2Data);

      const images = await imageRepository.getProductImages(testProductId);

      expect(images).toHaveLength(2);
      expect(images[0].displayOrder).toBe(0);
      expect(images[1].displayOrder).toBe(1);
    });

    it('should return empty array for product with no images', async () => {
      const images = await imageRepository.getProductImages(uuidv4());

      expect(images).toEqual([]);
    });

    it('should return images sorted by display order', async () => {
      const imageData3: ProductImageData = {
        imagePath: '/uploads/image3.jpg',
        imageUrl: 'http://example.com/image3.jpg',
        displayOrder: 2,
        fileSize: 102400,
        mimeType: 'image/jpeg',
        width: 800,
        height: 600,
      };

      const imageData1: ProductImageData = {
        imagePath: '/uploads/image1.jpg',
        imageUrl: 'http://example.com/image1.jpg',
        displayOrder: 0,
        fileSize: 102400,
        mimeType: 'image/jpeg',
        width: 800,
        height: 600,
      };

      const imageData2: ProductImageData = {
        imagePath: '/uploads/image2.jpg',
        imageUrl: 'http://example.com/image2.jpg',
        displayOrder: 1,
        fileSize: 102400,
        mimeType: 'image/jpeg',
        width: 800,
        height: 600,
      };

      // Create in non-sequential order
      await imageRepository.createImage(testProductId, imageData3);
      await imageRepository.createImage(testProductId, imageData1);
      await imageRepository.createImage(testProductId, imageData2);

      const images = await imageRepository.getProductImages(testProductId);

      expect(images).toHaveLength(3);
      expect(images[0].displayOrder).toBe(0);
      expect(images[1].displayOrder).toBe(1);
      expect(images[2].displayOrder).toBe(2);
    });
  });

  describe('getImageById', () => {
    it('should return image by ID', async () => {
      const imageData: ProductImageData = {
        imagePath: '/uploads/get-by-id.jpg',
        imageUrl: 'http://example.com/get-by-id.jpg',
        displayOrder: 0,
        fileSize: 102400,
        mimeType: 'image/jpeg',
        width: 800,
        height: 600,
      };

      const created = await imageRepository.createImage(testProductId, imageData);
      const retrieved = await imageRepository.getImageById(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.imagePath).toBe(imageData.imagePath);
    });

    it('should return null for non-existent image', async () => {
      const result = await imageRepository.getImageById(uuidv4());

      expect(result).toBeNull();
    });
  });

  describe('updateImageOrder', () => {
    it('should update display order for multiple images', async () => {
      const image1Data: ProductImageData = {
        imagePath: '/uploads/order1.jpg',
        imageUrl: 'http://example.com/order1.jpg',
        displayOrder: 0,
        fileSize: 102400,
        mimeType: 'image/jpeg',
        width: 800,
        height: 600,
      };

      const image2Data: ProductImageData = {
        imagePath: '/uploads/order2.jpg',
        imageUrl: 'http://example.com/order2.jpg',
        displayOrder: 1,
        fileSize: 102400,
        mimeType: 'image/jpeg',
        width: 800,
        height: 600,
      };

      const image1 = await imageRepository.createImage(testProductId, image1Data);
      const image2 = await imageRepository.createImage(testProductId, image2Data);

      // Swap the order
      await imageRepository.updateImageOrder(testProductId, [
        { imageId: image1.id, newOrder: 1 },
        { imageId: image2.id, newOrder: 0 },
      ]);

      const images = await imageRepository.getProductImages(testProductId);

      expect(images[0].id).toBe(image2.id);
      expect(images[0].displayOrder).toBe(0);
      expect(images[1].id).toBe(image1.id);
      expect(images[1].displayOrder).toBe(1);
    });

    it('should handle reordering with gaps in display order', async () => {
      const imageData1: ProductImageData = {
        imagePath: '/uploads/gap1.jpg',
        imageUrl: 'http://example.com/gap1.jpg',
        displayOrder: 0,
        fileSize: 102400,
        mimeType: 'image/jpeg',
        width: 800,
        height: 600,
      };

      const imageData2: ProductImageData = {
        imagePath: '/uploads/gap2.jpg',
        imageUrl: 'http://example.com/gap2.jpg',
        displayOrder: 1,
        fileSize: 102400,
        mimeType: 'image/jpeg',
        width: 800,
        height: 600,
      };

      const imageData3: ProductImageData = {
        imagePath: '/uploads/gap3.jpg',
        imageUrl: 'http://example.com/gap3.jpg',
        displayOrder: 2,
        fileSize: 102400,
        mimeType: 'image/jpeg',
        width: 800,
        height: 600,
      };

      const image1 = await imageRepository.createImage(testProductId, imageData1);
      const image2 = await imageRepository.createImage(testProductId, imageData2);
      const image3 = await imageRepository.createImage(testProductId, imageData3);

      // Reorder with gaps
      await imageRepository.updateImageOrder(testProductId, [
        { imageId: image1.id, newOrder: 2 },
        { imageId: image2.id, newOrder: 0 },
        { imageId: image3.id, newOrder: 1 },
      ]);

      const images = await imageRepository.getProductImages(testProductId);

      expect(images[0].id).toBe(image2.id);
      expect(images[1].id).toBe(image3.id);
      expect(images[2].id).toBe(image1.id);
    });
  });

  describe('setPrimaryImage', () => {
    it('should set an image as primary', async () => {
      const imageData: ProductImageData = {
        imagePath: '/uploads/primary.jpg',
        imageUrl: 'http://example.com/primary.jpg',
        displayOrder: 0,
        fileSize: 102400,
        mimeType: 'image/jpeg',
        width: 800,
        height: 600,
      };

      const image = await imageRepository.createImage(testProductId, imageData);
      await imageRepository.setPrimaryImage(testProductId, image.id);

      const retrieved = await imageRepository.getImageById(image.id);

      expect(retrieved?.isPrimary).toBe(true);
    });

    it('should unset previous primary image when setting new one', async () => {
      const imageData1: ProductImageData = {
        imagePath: '/uploads/primary1.jpg',
        imageUrl: 'http://example.com/primary1.jpg',
        displayOrder: 0,
        isPrimary: true,
        fileSize: 102400,
        mimeType: 'image/jpeg',
        width: 800,
        height: 600,
      };

      const imageData2: ProductImageData = {
        imagePath: '/uploads/primary2.jpg',
        imageUrl: 'http://example.com/primary2.jpg',
        displayOrder: 1,
        fileSize: 102400,
        mimeType: 'image/jpeg',
        width: 800,
        height: 600,
      };

      const image1 = await imageRepository.createImage(testProductId, imageData1);
      const image2 = await imageRepository.createImage(testProductId, imageData2);

      // Set image2 as primary
      await imageRepository.setPrimaryImage(testProductId, image2.id);

      const retrievedImage1 = await imageRepository.getImageById(image1.id);
      const retrievedImage2 = await imageRepository.getImageById(image2.id);

      expect(retrievedImage1?.isPrimary).toBe(false);
      expect(retrievedImage2?.isPrimary).toBe(true);
    });

    it('should only affect images of the specified product', async () => {
      const otherProductId = uuidv4();

      // Create another test product
      const otherProduct = await productRepository.create({
        name: 'Other Test Product',
        description: 'Other test description',
        price: 100,
        image: 'test.jpg',
        images: [],
        sizes: [],
        colors: [],
        category: 'test',
        stock: 10,
      });

      const imageData1: ProductImageData = {
        imagePath: '/uploads/other1.jpg',
        imageUrl: 'http://example.com/other1.jpg',
        displayOrder: 0,
        isPrimary: true,
        fileSize: 102400,
        mimeType: 'image/jpeg',
        width: 800,
        height: 600,
      };

      const imageData2: ProductImageData = {
        imagePath: '/uploads/other2.jpg',
        imageUrl: 'http://example.com/other2.jpg',
        displayOrder: 0,
        fileSize: 102400,
        mimeType: 'image/jpeg',
        width: 800,
        height: 600,
      };

      const image1 = await imageRepository.createImage(otherProduct.id, imageData1);
      const image2 = await imageRepository.createImage(testProductId, imageData2);

      // Set image2 as primary for testProductId
      await imageRepository.setPrimaryImage(testProductId, image2.id);

      // image1 should still be primary for otherProduct.id
      const retrievedImage1 = await imageRepository.getImageById(image1.id);
      const retrievedImage2 = await imageRepository.getImageById(image2.id);

      expect(retrievedImage1?.isPrimary).toBe(true);
      expect(retrievedImage2?.isPrimary).toBe(true);

      // Clean up
      await db.query('DELETE FROM product_images WHERE product_id = $1', [
        otherProduct.id,
      ]);
      await productRepository.delete(otherProduct.id);
    });
  });

  describe('deleteImage', () => {
    it('should delete an image by ID', async () => {
      const imageData: ProductImageData = {
        imagePath: '/uploads/delete.jpg',
        imageUrl: 'http://example.com/delete.jpg',
        displayOrder: 0,
        fileSize: 102400,
        mimeType: 'image/jpeg',
        width: 800,
        height: 600,
      };

      const image = await imageRepository.createImage(testProductId, imageData);
      await imageRepository.deleteImage(image.id);

      const retrieved = await imageRepository.getImageById(image.id);

      expect(retrieved).toBeNull();
    });

    it('should remove image from product images list', async () => {
      const imageData1: ProductImageData = {
        imagePath: '/uploads/delete1.jpg',
        imageUrl: 'http://example.com/delete1.jpg',
        displayOrder: 0,
        fileSize: 102400,
        mimeType: 'image/jpeg',
        width: 800,
        height: 600,
      };

      const imageData2: ProductImageData = {
        imagePath: '/uploads/delete2.jpg',
        imageUrl: 'http://example.com/delete2.jpg',
        displayOrder: 1,
        fileSize: 102400,
        mimeType: 'image/jpeg',
        width: 800,
        height: 600,
      };

      const image1 = await imageRepository.createImage(testProductId, imageData1);
      const image2 = await imageRepository.createImage(testProductId, imageData2);

      await imageRepository.deleteImage(image1.id);

      const images = await imageRepository.getProductImages(testProductId);

      expect(images).toHaveLength(1);
      expect(images[0].id).toBe(image2.id);
    });

    it('should not affect other products when deleting image', async () => {
      // Create another test product
      const otherProduct = await productRepository.create({
        name: 'Other Delete Test Product',
        description: 'Other delete test description',
        price: 100,
        image: 'test.jpg',
        images: [],
        sizes: [],
        colors: [],
        category: 'test',
        stock: 10,
      });

      const imageData1: ProductImageData = {
        imagePath: '/uploads/other-delete1.jpg',
        imageUrl: 'http://example.com/other-delete1.jpg',
        displayOrder: 0,
        fileSize: 102400,
        mimeType: 'image/jpeg',
        width: 800,
        height: 600,
      };

      const imageData2: ProductImageData = {
        imagePath: '/uploads/other-delete2.jpg',
        imageUrl: 'http://example.com/other-delete2.jpg',
        displayOrder: 0,
        fileSize: 102400,
        mimeType: 'image/jpeg',
        width: 800,
        height: 600,
      };

      const image1 = await imageRepository.createImage(otherProduct.id, imageData1);
      const image2 = await imageRepository.createImage(testProductId, imageData2);

      await imageRepository.deleteImage(image2.id);

      const otherProductImages = await imageRepository.getProductImages(
        otherProduct.id
      );

      expect(otherProductImages).toHaveLength(1);
      expect(otherProductImages[0].id).toBe(image1.id);

      // Clean up
      await db.query('DELETE FROM product_images WHERE product_id = $1', [
        otherProduct.id,
      ]);
      await productRepository.delete(otherProduct.id);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete image lifecycle', async () => {
      // Create multiple images
      const imageData1: ProductImageData = {
        imagePath: '/uploads/lifecycle1.jpg',
        imageUrl: 'http://example.com/lifecycle1.jpg',
        displayOrder: 0,
        fileSize: 102400,
        mimeType: 'image/jpeg',
        width: 800,
        height: 600,
      };

      const imageData2: ProductImageData = {
        imagePath: '/uploads/lifecycle2.jpg',
        imageUrl: 'http://example.com/lifecycle2.jpg',
        displayOrder: 1,
        fileSize: 102400,
        mimeType: 'image/jpeg',
        width: 800,
        height: 600,
      };

      const image1 = await imageRepository.createImage(testProductId, imageData1);
      const image2 = await imageRepository.createImage(testProductId, imageData2);

      // Set image2 as primary
      await imageRepository.setPrimaryImage(testProductId, image2.id);

      // Verify primary is set
      let images = await imageRepository.getProductImages(testProductId);
      expect(images.find((img) => img.id === image2.id)?.isPrimary).toBe(true);

      // Reorder images
      await imageRepository.updateImageOrder(testProductId, [
        { imageId: image1.id, newOrder: 1 },
        { imageId: image2.id, newOrder: 0 },
      ]);

      // Verify order changed
      images = await imageRepository.getProductImages(testProductId);
      expect(images[0].id).toBe(image2.id);
      expect(images[1].id).toBe(image1.id);

      // Delete first image
      await imageRepository.deleteImage(image2.id);

      // Verify deletion
      images = await imageRepository.getProductImages(testProductId);
      expect(images).toHaveLength(1);
      expect(images[0].id).toBe(image1.id);
    });
  });
});
