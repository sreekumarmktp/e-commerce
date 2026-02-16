import { IProductRepository } from '../../domain/repositories/IProductRepository';
import { Product, CreateProductRequest, UpdateProductRequest } from '../../domain/entities/Product';
import { Database } from '../database/Database';
import { v4 as uuidv4 } from 'uuid';
import { dbAll, dbGet, dbRun } from '../database/postgresHelpers';

export class ProductRepository implements IProductRepository {
  private db = Database.getInstance().getConnection();

  async findAll(): Promise<Product[]> {
    const rows = await dbAll<any>(this.db, 'SELECT * FROM products ORDER BY createdAt DESC');
    return rows.map(row => this.mapToProduct(row));
  }

  async findById(id: string): Promise<Product | null> {
    const row = await dbGet<any>(this.db, 'SELECT * FROM products WHERE id = $1', [id]);
    if (!row) return null;
    return this.mapToProduct(row);
  }

  async findByCategory(category: string): Promise<Product[]> {
    const rows = await dbAll<any>(this.db, 'SELECT * FROM products WHERE category = $1 ORDER BY createdAt DESC', [category]);
    return rows.map(row => this.mapToProduct(row));
  }

  async create(product: CreateProductRequest): Promise<Product> {
    const id = uuidv4();
    const now = new Date().toISOString();
    const sizesEnabled = product.sizesEnabled ?? true;
    const colorsEnabled = product.colorsEnabled ?? true;

    await dbRun(
      this.db,
      'INSERT INTO products (id, name, description, price, primary_image_path, sizes, colors, sizes_enabled, colors_enabled, category, stock, createdAt, updatedAt) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)',
      [
        id,
        product.name,
        product.description,
        product.price,
        product.primaryImagePath,
        JSON.stringify(product.sizes),
        JSON.stringify(product.colors),
        sizesEnabled,
        colorsEnabled,
        product.category,
        product.stock,
        now,
        now
      ]
    );

    return {
      id,
      ...product,
      sizesEnabled,
      colorsEnabled,
      createdAt: new Date(now),
      updatedAt: new Date(now)
    };
  }

  async update(id: string, product: UpdateProductRequest): Promise<Product | null> {
    const now = new Date().toISOString();
    const fields = Object.keys(product).filter(key => product[key as keyof UpdateProductRequest] !== undefined);

    if (fields.length === 0) {
      return this.findById(id);
    }

    const setClause = fields.map((field, index) => {
      const dbField = field === 'sizesEnabled' ? 'sizes_enabled' :
        field === 'colorsEnabled' ? 'colors_enabled' :
          field === 'primaryImagePath' ? 'primary_image_path' :
            field === 'primaryImageId' ? 'primary_image_id' : field;
      return `${dbField} = $${index + 1}`;
    }).join(', ');

    const values = [
      ...fields.map(field => {
        const val = product[field as keyof UpdateProductRequest];
        if (['sizes', 'colors'].includes(field) && Array.isArray(val)) {
          return JSON.stringify(val);
        }
        return val;
      }),
      now,
      id
    ];

    // updatedAt uses the next index, id uses the one after that
    const updatedAtParamIndex = fields.length + 1;
    const idParamIndex = fields.length + 2;

    const result = await dbRun(this.db, `UPDATE products SET ${setClause}, updatedAt = $${updatedAtParamIndex} WHERE id = $${idParamIndex}`, values);
    if (result.changes === 0) return null;
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await dbRun(this.db, 'DELETE FROM products WHERE id = $1', [id]);
    return result.changes > 0;
  }

  async updateVariantSettings(
    id: string,
    settings: { sizesEnabled?: boolean; colorsEnabled?: boolean }
  ): Promise<Product> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (settings.sizesEnabled !== undefined) {
      updates.push('sizes_enabled = $' + paramIndex++);
      values.push(settings.sizesEnabled);
    }

    if (settings.colorsEnabled !== undefined) {
      updates.push('colors_enabled = $' + paramIndex++);
      values.push(settings.colorsEnabled);
    }

    updates.push('updatedAt = $' + paramIndex++);
    values.push(new Date().toISOString());

    values.push(id);

    const query = `
      UPDATE products 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const row = await dbGet<any>(this.db, query, values);
    if (!row) {
      throw new Error('Product not found');
    }
    return this.mapToProduct(row);
  }

  async addSize(id: string, size: string): Promise<Product> {
    const query = `
      UPDATE products 
      SET sizes = sizes || $1::jsonb,
          updatedAt = $2
      WHERE id = $3
      RETURNING *
    `;

    const row = await dbGet<any>(
      this.db,
      query,
      [JSON.stringify([size]), new Date().toISOString(), id]
    );
    if (!row) {
      throw new Error('Product not found');
    }
    return this.mapToProduct(row);
  }

  async removeSize(id: string, size: string): Promise<Product> {
    const query = `
      UPDATE products 
      SET sizes = (
        SELECT jsonb_agg(elem)
        FROM jsonb_array_elements(sizes) elem
        WHERE elem::text != $1::text
      ),
      updatedAt = $2
      WHERE id = $3
      RETURNING *
    `;

    const row = await dbGet<any>(
      this.db,
      query,
      [JSON.stringify(size), new Date().toISOString(), id]
    );
    if (!row) {
      throw new Error('Product not found');
    }
    return this.mapToProduct(row);
  }

  async addColor(id: string, color: string): Promise<Product> {
    const query = `
      UPDATE products 
      SET colors = colors || $1::jsonb,
          updatedAt = $2
      WHERE id = $3
      RETURNING *
    `;

    const row = await dbGet<any>(
      this.db,
      query,
      [JSON.stringify([color]), new Date().toISOString(), id]
    );
    if (!row) {
      throw new Error('Product not found');
    }
    return this.mapToProduct(row);
  }

  async removeColor(id: string, color: string): Promise<Product> {
    const query = `
      UPDATE products 
      SET colors = (
        SELECT jsonb_agg(elem)
        FROM jsonb_array_elements(colors) elem
        WHERE elem::text != $1::text
      ),
      updatedAt = $2
      WHERE id = $3
      RETURNING *
    `;

    const row = await dbGet<any>(
      this.db,
      query,
      [JSON.stringify(color), new Date().toISOString(), id]
    );
    if (!row) {
      throw new Error('Product not found');
    }
    return this.mapToProduct(row);
  }

  private mapToProduct(row: any): Product {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      price: Number(row.price),
      primaryImagePath: row.primary_image_path ?? row.image,
      primaryImageId: row.primary_image_id,
      sizes: Array.isArray(row.sizes) ? row.sizes : JSON.parse(row.sizes || '[]'),
      colors: Array.isArray(row.colors) ? row.colors : JSON.parse(row.colors || '[]'),
      sizesEnabled: row.sizes_enabled ?? row.sizesenabled ?? true,  // Backward compatibility
      colorsEnabled: row.colors_enabled ?? row.colorsenabled ?? true,  // Backward compatibility
      category: row.category,
      stock: Number(row.stock),
      createdAt: new Date(row.createdat),
      updatedAt: new Date(row.updatedat)
    };
  }
}
