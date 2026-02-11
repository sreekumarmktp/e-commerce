import { IProductImageRepository } from '../../domain/repositories/IProductImageRepository';
import {
  ProductImage,
  ProductImageData,
  ImageOrderUpdate,
} from '../../domain/entities/ProductImage';
import { Database } from '../database/Database';
import { dbAll, dbGet, dbRun, withTransaction } from '../database/postgresHelpers';
import { v4 as uuidv4 } from 'uuid';

export class ProductImageRepository implements IProductImageRepository {
  private db = Database.getInstance().getConnection();

  async createImage(
    productId: string,
    imageData: ProductImageData
  ): Promise<ProductImage> {
    const id = uuidv4();
    const now = new Date().toISOString();
    const isPrimary = imageData.isPrimary ?? false;

    await dbRun(
      this.db,
      `INSERT INTO product_images 
        (id, product_id, image_path, image_url, display_order, is_primary, 
         file_size, mime_type, width, height, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        id,
        productId,
        imageData.imagePath,
        imageData.imageUrl,
        imageData.displayOrder,
        isPrimary,
        imageData.fileSize,
        imageData.mimeType,
        imageData.width,
        imageData.height,
        now,
        now,
      ]
    );

    return {
      id,
      productId,
      imagePath: imageData.imagePath,
      imageUrl: imageData.imageUrl,
      displayOrder: imageData.displayOrder,
      isPrimary,
      fileSize: imageData.fileSize,
      mimeType: imageData.mimeType,
      width: imageData.width,
      height: imageData.height,
      createdAt: new Date(now),
      updatedAt: new Date(now),
    };
  }

  async updateImageOrder(
    productId: string,
    imageOrders: ImageOrderUpdate[]
  ): Promise<void> {
    await withTransaction(this.db, async (client) => {
      const now = new Date().toISOString();

      for (const order of imageOrders) {
        await dbRun(
          client,
          `UPDATE product_images 
           SET display_order = $1, updated_at = $2 
           WHERE id = $3 AND product_id = $4`,
          [order.newOrder, now, order.imageId, productId]
        );
      }
    });
  }

  async setPrimaryImage(productId: string, imageId: string): Promise<void> {
    await withTransaction(this.db, async (client) => {
      const now = new Date().toISOString();

      // First, unset all primary images for this product
      await dbRun(
        client,
        `UPDATE product_images 
         SET is_primary = false, updated_at = $1 
         WHERE product_id = $2`,
        [now, productId]
      );

      // Then set the specified image as primary
      await dbRun(
        client,
        `UPDATE product_images 
         SET is_primary = true, updated_at = $1 
         WHERE id = $2 AND product_id = $3`,
        [now, imageId, productId]
      );
    });
  }

  async deleteImage(imageId: string): Promise<void> {
    await dbRun(
      this.db,
      'DELETE FROM product_images WHERE id = $1',
      [imageId]
    );
  }

  async getProductImages(productId: string): Promise<ProductImage[]> {
    const rows = await dbAll<any>(
      this.db,
      `SELECT * FROM product_images 
       WHERE product_id = $1 
       ORDER BY display_order ASC`,
      [productId]
    );

    return rows.map((row) => this.mapToProductImage(row));
  }

  async getImageById(imageId: string): Promise<ProductImage | null> {
    const row = await dbGet<any>(
      this.db,
      'SELECT * FROM product_images WHERE id = $1',
      [imageId]
    );

    if (!row) return null;
    return this.mapToProductImage(row);
  }

  private mapToProductImage(row: any): ProductImage {
    return {
      id: row.id,
      productId: row.product_id,
      imagePath: row.image_path,
      imageUrl: row.image_url,
      displayOrder: row.display_order,
      isPrimary: row.is_primary,
      fileSize: row.file_size,
      mimeType: row.mime_type,
      width: row.width,
      height: row.height,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}
