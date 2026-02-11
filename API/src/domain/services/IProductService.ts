import { Product, CreateProductRequest, UpdateProductRequest, ValidationResult } from '../entities/Product';

export interface IProductService {
  getAllProducts(): Promise<Product[]>;
  getProductById(id: string): Promise<Product | null>;
  getProductsByCategory(category: string): Promise<Product[]>;
  createProduct(product: CreateProductRequest): Promise<Product>;
  updateProduct(id: string, product: UpdateProductRequest): Promise<Product | null>;
  deleteProduct(id: string): Promise<boolean>;
  
  // Variant management methods
  toggleVariants(
    id: string,
    settings: { sizesEnabled?: boolean; colorsEnabled?: boolean }
  ): Promise<Product>;
  addProductSize(id: string, size: string): Promise<Product>;
  removeProductSize(id: string, size: string): Promise<Product>;
  addProductColor(id: string, color: string): Promise<Product>;
  removeProductColor(id: string, color: string): Promise<Product>;
  
  // Validation methods
  validateSizeValue(size: string): ValidationResult;
  validateColorValue(color: string): ValidationResult;
}
