/**
 * Image Storage Service Interface
 * Defines the contract for image storage operations.
 * Implementations can use local filesystem or cloud storage (S3).
 */
export interface IImageStorageService {
  /**
   * Upload an image file to storage
   * @param file - The image file buffer
   * @param filename - The original filename
   * @param productId - The product ID for organizing storage
   * @returns Promise resolving to the image ID (unique identifier)
   */
  uploadImage(file: Buffer, filename: string, productId: string): Promise<string>;

  /**
   * Delete an image from storage
   * @param imageId - The unique identifier of the image
   * @returns Promise that resolves when deletion is complete
   */
  deleteImage(imageId: string): Promise<void>;

  /**
   * Get the URL for accessing an image
   * @param imageId - The unique identifier of the image
   * @returns The URL string for accessing the image
   */
  getImageUrl(imageId: string): string;
}
