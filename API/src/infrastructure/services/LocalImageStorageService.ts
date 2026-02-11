import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { IImageStorageService } from '../../domain/services/IImageStorageService';

/**
 * Local Image Storage Service
 * Stores images in the local filesystem at API/uploads/{productId}/{imageId}
 * Used for development environments
 */
export class LocalImageStorageService implements IImageStorageService {
  private baseUploadDir: string;
  private baseUrl: string;

  constructor(baseUploadDir?: string, baseUrl?: string) {
    this.baseUploadDir = baseUploadDir || path.join(process.cwd(), 'uploads');
    this.baseUrl = baseUrl || 'http://localhost:3001';

    // Ensure base upload directory exists
    if (!fs.existsSync(this.baseUploadDir)) {
      fs.mkdirSync(this.baseUploadDir, { recursive: true });
    }
  }

  async uploadImage(
    file: Buffer,
    filename: string,
    productId: string
  ): Promise<string> {
    // Generate unique image ID
    const imageId = uuidv4();

    // Create product-specific directory
    const productDir = path.join(this.baseUploadDir, productId);
    if (!fs.existsSync(productDir)) {
      fs.mkdirSync(productDir, { recursive: true });
    }

    // Preserve file extension
    const ext = path.extname(filename);
    const storedFilename = `${imageId}${ext}`;
    const filepath = path.join(productDir, storedFilename);

    try {
      // Write file to disk with error handling
      await fs.promises.writeFile(filepath, file, { flag: 'w' });
      // Return the full path including product ID and extension
      return `${productId}/${storedFilename}`;
    } catch (error) {
      // Clean up partial file if write fails
      try {
        await fs.promises.unlink(filepath);
      } catch (unlinkError) {
        // Ignore unlink errors
      }
      throw new Error(`Failed to write image file: ${error}`);
    }
  }

  async deleteImage(imageId: string): Promise<void> {
    // imageId now contains the full path: productId/filename
    const filepath = path.join(this.baseUploadDir, imageId);

    try {
      if (fs.existsSync(filepath)) {
        await fs.promises.unlink(filepath);
      }
    } catch (error) {
      console.error(`Failed to delete image ${imageId}:`, error);
      throw new Error(`Failed to delete image file: ${error}`);
    }
  }

  getImageUrl(imageId: string): string {
    // imageId now contains the full path: productId/filename
    // Return a FULL URL with base API server URL so UI can fetch it
    return `${this.baseUrl}/uploads/${imageId}`;
  }
}
