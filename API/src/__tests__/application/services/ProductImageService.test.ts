import { ProductImageService } from '../../../application/services/ProductImageService';
import { ImageValidator } from '../../../domain/services/ImageValidator';
import { IImageStorageService } from '../../../domain/services/IImageStorageService';
import { IProductImageRepository } from '../../../domain/repositories/IProductImageRepository';
import { IProductRepository } from '../../../domain/repositories/IProductRepository';
import { ValidationError } from '../../../domain/errors/ValidationError';
import { NotFoundError } from '../../../domain/errors/NotFoundError';
import { UploadedFile } from '../../../presentation/types/ImageUpload';
import { ProductImage } from '../../../domain/entities/ProductImage';
import { Readable } from 'stream';

describe('ProductImageService', () => {
  let service: ProductImageService;
  let mockValidator: jest.Mocked<ImageValidator>;
  let mockStorageService: jest.Mocked<IImageStorageService>;
  let mockRepository: jest.Mocked<IProductImageRepository>;
  let mockProductRepository: jest.Mocked<IProductRepository>;

  beforeEach(() => {
    mockValidator = {
      validateFormat: jest.fn(),
      validateSize: jest.fn(),
      validateDimensions: jest.fn(),
      validateDimensionsWithMetadata: jest.fn(),
      validateAll: jest.fn(),
    } as any;

    mockStorageService = {
      uploadImage: jest.fn(),
      deleteImage: jest.fn(),
      getImageUrl: jest.fn(),
    } as any;

    mockRepository = {
      createImage: jest.fn(),
      getImageById: jest.fn(),
      getProductImages: jest.fn(),
      updateImageOrder: jest.fn(),
      setPrimaryImage: jest.fn(),
      deleteImage: jest.fn(),
    } as any;

    mockProductRepository = {
      update: jest.fn(),
    } as any;

    service = new ProductImageService(mockValidator, mockStorageService, mockRepository, mockProductRepository);
  });

  describe('uploadImages', () => {
    it('should throw error if no files provided', async () => {
      await expect(service.uploadImages('product-1', [])).rejects.toThrow(
        ValidationError
      );
    });

    it('should throw error if total images exceed limit', async () => {
      const existingImages = Array(7).fill(null).map((_, i) => ({
        id: `img-${i}`,
        productId: 'product-1',
        imagePath: `path-${i}`,
        imageUrl: `url-${i}`,
        displayOrder: i,
        isPrimary: i === 0,
        fileSize: 1000,
        mimeType: 'image/jpeg',
        width: 800,
        height: 600,
        createdAt: new Date(),
        updatedAt: new Date(),
      })) as ProductImage[];

      mockRepository.getProductImages.mockResolvedValue(existingImages);

      const file: UploadedFile = {
        filename: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        file: Readable.from(['test']),
      };

      await expect(service.uploadImages('product-1', [file])).rejects.toThrow(
        ValidationError
      );
    });

    it('should successfully upload a single image', async () => {
      const createdImage = {
        id: 'db-image-1',
        productId: 'product-1',
        imagePath: 'image-id-1',
        imageUrl: '/uploads/image-id-1',
        isPrimary: true,
        displayOrder: 0,
        fileSize: 1000,
        mimeType: 'image/jpeg',
        width: 800,
        height: 600,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as ProductImage;

      mockRepository.getProductImages
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([createdImage]);

      mockValidator.validateAll.mockResolvedValue({
        valid: true,
        errors: [],
        metadata: { width: 800, height: 600 },
      });
      mockStorageService.uploadImage.mockResolvedValue('image-id-1');
      mockStorageService.getImageUrl.mockReturnValue('/uploads/image-id-1');
      mockRepository.createImage.mockResolvedValue(createdImage);


      const file: UploadedFile = {
        filename: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        file: Readable.from([Buffer.from('test data')]),
      };

      const result = await service.uploadImages('product-1', [file]);

      expect(result).toHaveLength(1);
      expect(result[0].isPrimary).toBe(true);
      expect(result[0].displayOrder).toBe(0);
      expect(mockStorageService.uploadImage).toHaveBeenCalled();
      // Verifying other calls
      expect(mockRepository.createImage).toHaveBeenCalled();
      expect(mockProductRepository.update).toHaveBeenCalledWith('product-1', {
        image: '/uploads/image-id-1',
        images: ['/uploads/image-id-1']
      });
    });

    it('should set first image as primary', async () => {
      mockRepository.getProductImages
        .mockResolvedValueOnce([]) // Initial check
        .mockResolvedValueOnce([
          { id: 'db-image-1', productId: 'product-1', isPrimary: true, imageUrl: '/uploads/image-id-1' }
        ] as any); // Sync check

      mockValidator.validateAll.mockResolvedValue({
        valid: true,
        errors: [],
        metadata: { width: 800, height: 600 },
      });
      mockStorageService.uploadImage.mockResolvedValue('image-id-1');
      mockStorageService.getImageUrl.mockReturnValue('/uploads/image-id-1');
      mockRepository.createImage.mockResolvedValue({
        id: 'db-image-1',
        productId: 'product-1',
        imageUrl: '/uploads/image-id-1',
        isPrimary: true,
        displayOrder: 0
      } as any);

      const file: UploadedFile = {
        filename: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        file: Readable.from([Buffer.from('test data')]),
      };

      const result = await service.uploadImages('product-1', [file]);

      expect(result[0].isPrimary).toBe(true);
      expect(mockProductRepository.update).toHaveBeenCalled();
    });

    it('should throw error if validation fails', async () => {
      mockRepository.getProductImages.mockResolvedValue([]);
      mockValidator.validateAll.mockResolvedValue({
        valid: false,
        errors: ['Invalid image format'],
      });

      const file: UploadedFile = {
        filename: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        file: Readable.from([Buffer.from('test data')]),
      };

      await expect(service.uploadImages('product-1', [file])).rejects.toThrow(
        ValidationError
      );
    });

    it('should upload multiple images with correct display order', async () => {
      const existingImage: ProductImage = {
        id: 'existing-1',
        productId: 'product-1',
        imagePath: 'path-1',
        imageUrl: 'url-1',
        displayOrder: 0,
        isPrimary: true,
        fileSize: 1000,
        mimeType: 'image/jpeg',
        width: 800,
        height: 600,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.getProductImages
        .mockResolvedValueOnce([existingImage]) // Initial check
        .mockResolvedValueOnce([existingImage, { id: 'db-image-2', imageUrl: '/uploads/image-id-2' }, { id: 'db-image-3', imageUrl: '/uploads/image-id-3' }] as any); // Sync check

      mockValidator.validateAll.mockResolvedValue({
        valid: true,
        errors: [],
        metadata: { width: 800, height: 600 },
      });
      mockStorageService.uploadImage
        .mockResolvedValueOnce('image-id-2')
        .mockResolvedValueOnce('image-id-3');
      mockStorageService.getImageUrl
        .mockReturnValueOnce('/uploads/image-id-2')
        .mockReturnValueOnce('/uploads/image-id-3');

      mockRepository.createImage
        .mockResolvedValueOnce({
          id: 'db-image-2',
          productId: 'product-1',
          imagePath: 'image-id-2',
          imageUrl: '/uploads/image-id-2',
          displayOrder: 1,
          isPrimary: false,
          fileSize: 50000,
          mimeType: 'image/jpeg',
          width: 800,
          height: 600,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .mockResolvedValueOnce({
          id: 'db-image-3',
          productId: 'product-1',
          imagePath: 'image-id-3',
          imageUrl: '/uploads/image-id-3',
          displayOrder: 2,
          isPrimary: false,
          fileSize: 50000,
          mimeType: 'image/jpeg',
          width: 800,
          height: 600,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      const files: UploadedFile[] = [
        {
          filename: 'test2.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          file: Readable.from([Buffer.from('test data 2')]),
        },
        {
          filename: 'test3.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          file: Readable.from([Buffer.from('test data 3')]),
        },
      ];

      const result = await service.uploadImages('product-1', files);

      expect(result).toHaveLength(2);
      expect(result[0].displayOrder).toBe(1);
      expect(result[1].displayOrder).toBe(2);
      expect(result[0].isPrimary).toBe(false);
      expect(result[1].isPrimary).toBe(false);
      expect(mockProductRepository.update).toHaveBeenCalled();
    });
  });

  describe('reorderImages', () => {
    it('should throw error if no image orders provided', async () => {
      await expect(service.reorderImages('product-1', [])).rejects.toThrow(
        ValidationError
      );
    });

    it('should throw error if image does not belong to product', async () => {
      mockRepository.getProductImages.mockResolvedValue([
        {
          id: 'img-1',
          productId: 'product-1',
          imagePath: 'path-1',
          imageUrl: 'url-1',
          displayOrder: 0,
          isPrimary: true,
          fileSize: 1000,
          mimeType: 'image/jpeg',
          width: 800,
          height: 600,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      await expect(
        service.reorderImages('product-1', [
          { imageId: 'img-2', newOrder: 0 },
        ])
      ).rejects.toThrow(ValidationError);
    });

    it('should successfully reorder images', async () => {
      mockRepository.getProductImages.mockResolvedValue([
        {
          id: 'img-1',
          productId: 'product-1',
          imagePath: 'path-1',
          imageUrl: 'url-1',
          displayOrder: 0,
          isPrimary: true,
          fileSize: 1000,
          mimeType: 'image/jpeg',
          width: 800,
          height: 600,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'img-2',
          productId: 'product-1',
          imagePath: 'path-2',
          imageUrl: 'url-2',
          displayOrder: 1,
          isPrimary: false,
          fileSize: 1000,
          mimeType: 'image/jpeg',
          width: 800,
          height: 600,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      mockRepository.updateImageOrder.mockResolvedValue(undefined);

      // Configure getProductImages for BOTH the validation call and the sync call
      mockRepository.getProductImages
        .mockResolvedValueOnce([
          { id: 'img-1', productId: 'product-1', displayOrder: 0, imageUrl: 'url-1' },
          { id: 'img-2', productId: 'product-1', displayOrder: 1, imageUrl: 'url-2' }
        ] as any)
        .mockResolvedValueOnce([
          { id: 'img-2', productId: 'product-1', displayOrder: 0, imageUrl: 'url-2' },
          { id: 'img-1', productId: 'product-1', displayOrder: 1, imageUrl: 'url-1' }
        ] as any);

      await service.reorderImages('product-1', [
        { imageId: 'img-1', newOrder: 1 },
        { imageId: 'img-2', newOrder: 0 },
      ]);

      expect(mockRepository.updateImageOrder).toHaveBeenCalledWith('product-1', [
        { imageId: 'img-1', newOrder: 1 },
        { imageId: 'img-2', newOrder: 0 },
      ]);
      expect(mockProductRepository.update).toHaveBeenCalled();
    });
  });

  describe('setPrimaryImage', () => {
    it('should throw error if image not found', async () => {
      mockRepository.getImageById.mockResolvedValue(null);

      await expect(service.setPrimaryImage('product-1', 'img-1')).rejects.toThrow(
        NotFoundError
      );
    });

    it('should throw error if image does not belong to product', async () => {
      mockRepository.getImageById.mockResolvedValue({
        id: 'img-1',
        productId: 'product-2',
        imagePath: 'path-1',
        imageUrl: 'url-1',
        displayOrder: 0,
        isPrimary: false,
        fileSize: 1000,
        mimeType: 'image/jpeg',
        width: 800,
        height: 600,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(service.setPrimaryImage('product-1', 'img-1')).rejects.toThrow(
        ValidationError
      );
    });

    it('should successfully set primary image', async () => {
      mockRepository.getImageById.mockResolvedValue({
        id: 'img-1',
        productId: 'product-1',
        imagePath: 'path-1',
        imageUrl: 'url-1',
        displayOrder: 0,
        isPrimary: false,
        fileSize: 1000,
        mimeType: 'image/jpeg',
        width: 800,
        height: 600,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockRepository.setPrimaryImage.mockResolvedValue(undefined);
      mockRepository.getProductImages.mockResolvedValue([
        {
          id: 'img-1',
          productId: 'product-1',
          imageUrl: 'url-1',
          isPrimary: true,
          displayOrder: 0
        }
      ] as any);

      await service.setPrimaryImage('product-1', 'img-1');

      expect(mockRepository.setPrimaryImage).toHaveBeenCalledWith('product-1', 'img-1');
      expect(mockProductRepository.update).toHaveBeenCalledWith('product-1', {
        image: 'url-1',
        images: ['url-1']
      });
    });
  });

  describe('deleteImage', () => {
    it('should throw error if image not found', async () => {
      mockRepository.getImageById.mockResolvedValue(null);

      await expect(service.deleteImage('img-1')).rejects.toThrow(NotFoundError);
    });

    it('should throw error if product has only one image', async () => {
      mockRepository.getImageById.mockResolvedValue({
        id: 'img-1',
        productId: 'product-1',
        imagePath: 'path-1',
        imageUrl: 'url-1',
        displayOrder: 0,
        isPrimary: true,
        fileSize: 1000,
        mimeType: 'image/jpeg',
        width: 800,
        height: 600,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockRepository.getProductImages.mockResolvedValue([
        {
          id: 'img-1',
          productId: 'product-1',
          imagePath: 'path-1',
          imageUrl: 'url-1',
          displayOrder: 0,
          isPrimary: true,
          fileSize: 1000,
          mimeType: 'image/jpeg',
          width: 800,
          height: 600,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      await expect(service.deleteImage('img-1')).rejects.toThrow(ValidationError);
    });

    it('should successfully delete image', async () => {
      mockRepository.getImageById.mockResolvedValue({
        id: 'img-1',
        productId: 'product-1',
        imagePath: 'path-1',
        imageUrl: 'url-1',
        displayOrder: 0,
        isPrimary: false,
        fileSize: 1000,
        mimeType: 'image/jpeg',
        width: 800,
        height: 600,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockRepository.getProductImages.mockResolvedValue([
        {
          id: 'img-1',
          productId: 'product-1',
          imagePath: 'path-1',
          imageUrl: 'url-1',
          displayOrder: 0,
          isPrimary: false,
          fileSize: 1000,
          mimeType: 'image/jpeg',
          width: 800,
          height: 600,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'img-2',
          productId: 'product-1',
          imagePath: 'path-2',
          imageUrl: 'url-2',
          displayOrder: 1,
          isPrimary: true,
          fileSize: 1000,
          mimeType: 'image/jpeg',
          width: 800,
          height: 600,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      mockRepository.getProductImages
        .mockResolvedValueOnce([
          { id: 'img-1', productId: 'product-1', displayOrder: 0, isPrimary: false },
          { id: 'img-2', productId: 'product-1', displayOrder: 1, isPrimary: true }
        ] as any) // For validation check
        .mockResolvedValueOnce([
          { id: 'img-2', productId: 'product-1', displayOrder: 1, isPrimary: true, imageUrl: 'url-2' }
        ] as any); // For sync

      mockStorageService.deleteImage.mockResolvedValue(undefined);
      mockRepository.deleteImage.mockResolvedValue(undefined);

      await service.deleteImage('img-1');

      expect(mockStorageService.deleteImage).toHaveBeenCalledWith('path-1');
      expect(mockRepository.deleteImage).toHaveBeenCalledWith('img-1');
      expect(mockProductRepository.update).toHaveBeenCalled();
    });

    it('should set new primary image when deleting primary', async () => {
      mockRepository.getImageById.mockResolvedValue({
        id: 'img-1',
        productId: 'product-1',
        imagePath: 'path-1',
        imageUrl: 'url-1',
        displayOrder: 0,
        isPrimary: true,
        fileSize: 1000,
        mimeType: 'image/jpeg',
        width: 800,
        height: 600,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockRepository.getProductImages
        .mockResolvedValueOnce([
          { id: 'img-1', productId: 'product-1', displayOrder: 0, isPrimary: true },
          { id: 'img-2', productId: 'product-1', displayOrder: 1, isPrimary: false }
        ] as any) // For validation check
        .mockResolvedValueOnce([
          { id: 'img-2', productId: 'product-1', displayOrder: 1, isPrimary: false }
        ] as any) // For primary reassignment check
        .mockResolvedValueOnce([
          { id: 'img-2', productId: 'product-1', displayOrder: 0, isPrimary: true, imageUrl: 'url-2' }
        ] as any); // For sync

      mockStorageService.deleteImage.mockResolvedValue(undefined);
      mockRepository.deleteImage.mockResolvedValue(undefined);
      mockRepository.setPrimaryImage.mockResolvedValue(undefined);

      await service.deleteImage('img-1');

      expect(mockRepository.setPrimaryImage).toHaveBeenCalledWith('product-1', 'img-2');
      expect(mockProductRepository.update).toHaveBeenCalled();
    });
  });

  describe('getProductImages', () => {
    it('should return product images', async () => {
      const images: ProductImage[] = [
        {
          id: 'img-1',
          productId: 'product-1',
          imagePath: 'path-1',
          imageUrl: 'url-1',
          displayOrder: 0,
          isPrimary: true,
          fileSize: 1000,
          mimeType: 'image/jpeg',
          width: 800,
          height: 600,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockRepository.getProductImages.mockResolvedValue(images);

      const result = await service.getProductImages('product-1');

      expect(result).toEqual(images);
      expect(mockRepository.getProductImages).toHaveBeenCalledWith('product-1');
    });
  });
});

