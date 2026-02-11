import {
  ProductImage,
  ImageOrderUpdate,
} from '../entities/ProductImage';
import { UploadedFile } from '../../presentation/types/ImageUpload';

/**
 * Product Image Service Interface
 * Orchestrates image upload, validation, storage, and database operations
 * Enforces business rules: max 7 images per product, primary image management
 */
export interface IProductImageService {
  /**
   * Upload multiple images for a product
   * Validates all images, checks image limit, stores files, and persists to database
   * Automatically sets first image as primary if no primary exists
   * @param productId - The ID of the product
   * @param files - Array of uploaded files
   * @returns Promise resolving to array of created ProductImage objects
   * @throws ValidationError if validation fails or image limit exceeded
   * @throws AppError if storage or database operations fail
   */
  uploadImages(productId: string, files: UploadedFile[]): Promise<ProductImage[]>;

  /**
   * Reorder images for a product
   * Updates the display_order for multiple images in a transaction
   * @param productId - The ID of the product
   * @param imageOrders - Array of image IDs with their new display orders
   * @returns Promise that resolves when reordering is complete
   * @throws ValidationError if image IDs are invalid
   * @throws AppError if database operation fails
   */
  reorderImages(
    productId: string,
    imageOrders: ImageOrderUpdate[]
  ): Promise<void>;

  /**
   * Set an image as the primary image for a product
   * Unsets any existing primary image and sets the specified image as primary
   * @param productId - The ID of the product
   * @param imageId - The ID of the image to set as primary
   * @returns Promise that resolves when operation is complete
   * @throws NotFoundError if image or product not found
   * @throws AppError if database operation fails
   */
  setPrimaryImage(productId: string, imageId: string): Promise<void>;

  /**
   * Delete an image from a product
   * Removes the image from storage and database
   * If deleted image was primary, automatically sets first remaining image as primary
   * @param imageId - The ID of the image to delete
   * @returns Promise that resolves when deletion is complete
   * @throws ValidationError if attempting to delete last image of a product
   * @throws NotFoundError if image not found
   * @throws AppError if storage or database operation fails
   */
  deleteImage(imageId: string): Promise<void>;

  /**
   * Get all images for a product
   * Returns images ordered by display_order
   * @param productId - The ID of the product
   * @returns Promise resolving to array of ProductImage objects
   * @throws AppError if database operation fails
   */
  getProductImages(productId: string): Promise<ProductImage[]>;
}
