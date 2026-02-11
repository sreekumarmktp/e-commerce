import { Product, CreateProductRequest, UpdateProductRequest } from '../entities/Product';

export interface IProductRepository {
  findAll(): Promise<Product[]>;
  findById(id: string): Promise<Product | null>;
  findByCategory(category: string): Promise<Product[]>;
  create(product: CreateProductRequest): Promise<Product>;
  update(id: string, product: UpdateProductRequest): Promise<Product | null>;
  delete(id: string): Promise<boolean>;
  
  // Variant management methods
  updateVariantSettings(
    id: string,
    settings: { sizesEnabled?: boolean; colorsEnabled?: boolean }
  ): Promise<Product>;
  addSize(id: string, size: string): Promise<Product>;
  removeSize(id: string, size: string): Promise<Product>;
  addColor(id: string, color: string): Promise<Product>;
  removeColor(id: string, color: string): Promise<Product>;
}
