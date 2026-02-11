import {
  ProductImage,
  ProductImageData,
  ImageOrderUpdate,
} from '../entities/ProductImage';

export interface IProductImageRepository {
  /**
   * Create a new product image record in the database
   * @param productId - The ID of the product
   * @param imageData - The image data to store
   * @returns The created ProductImage
   */
  createImage(
    productId: string,
    imageData: ProductImageData
  ): Promise<ProductImage>;

  /**
   * Update the display order of multiple images in a transaction
   * @param productId - The ID of the product
   * @param imageOrders - Array of image IDs with their new display orders
   * @returns void
   */
  updateImageOrder(
    productId: string,
    imageOrders: ImageOrderUpdate[]
  ): Promise<void>;

  /**
   * Set an image as the primary image for a product
   * @param productId - The ID of the product
   * @param imageId - The ID of the image to set as primary
   * @returns void
   */
  setPrimaryImage(productId: string, imageId: string): Promise<void>;

  /**
   * Delete an image from the database
   * @param imageId - The ID of the image to delete
   * @returns void
   */
  deleteImage(imageId: string): Promise<void>;

  /**
   * Get all images for a product, ordered by display_order
   * @param productId - The ID of the product
   * @returns Array of ProductImage objects
   */
  getProductImages(productId: string): Promise<ProductImage[]>;

  /**
   * Get a specific image by ID
   * @param imageId - The ID of the image
   * @returns The ProductImage or null if not found
   */
  getImageById(imageId: string): Promise<ProductImage | null>;
}
