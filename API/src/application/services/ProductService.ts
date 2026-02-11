import { IProductService } from '../../domain/services/IProductService';
import { IProductRepository } from '../../domain/repositories/IProductRepository';
import { Product, CreateProductRequest, UpdateProductRequest, ValidationResult } from '../../domain/entities/Product';
import { ValidationError } from '../../domain/errors/ValidationError';
import { NotFoundError } from '../../domain/errors/NotFoundError';

export class ProductService implements IProductService {
  constructor(private productRepository: IProductRepository) {}

  async getAllProducts(): Promise<Product[]> {
    return this.productRepository.findAll();
  }

  async getProductById(id: string): Promise<Product | null> {
    if (!id) {
      throw new ValidationError('Product ID is required');
    }
    return this.productRepository.findById(id);
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    if (!category) {
      throw new ValidationError('Category is required');
    }
    return this.productRepository.findByCategory(category);
  }

  async createProduct(product: CreateProductRequest): Promise<Product> {
    if (!product?.name) {
      throw new ValidationError('Product name is required');
    }
    if (product.price === undefined || product.price === null || Number.isNaN(product.price) || product.price <= 0) {
      throw new ValidationError('Valid price is required');
    }
    if (product.stock === undefined || product.stock === null || Number.isNaN(product.stock) || product.stock < 0) {
      throw new ValidationError('Stock must be >= 0');
    }
    return this.productRepository.create(product);
  }

  async updateProduct(id: string, product: UpdateProductRequest): Promise<Product | null> {
    if (!id) {
      throw new ValidationError('Product ID is required');
    }
    if (product.price !== undefined && product.price <= 0) {
      throw new ValidationError('Price must be greater than 0');
    }
    if (product.stock !== undefined && product.stock < 0) {
      throw new ValidationError('Stock must be >= 0');
    }
    return this.productRepository.update(id, product);
  }

  async deleteProduct(id: string): Promise<boolean> {
    if (!id) {
      throw new ValidationError('Product ID is required');
    }
    return this.productRepository.delete(id);
  }

  async toggleVariants(
    id: string,
    settings: { sizesEnabled?: boolean; colorsEnabled?: boolean }
  ): Promise<Product> {
    // Validate product exists
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // Update variant settings
    return await this.productRepository.updateVariantSettings(id, settings);
  }

  async addProductSize(id: string, size: string): Promise<Product> {
    // Validate size value
    const validation = this.validateSizeValue(size);
    if (!validation.isValid) {
      throw new ValidationError(validation.error);
    }

    // Check product exists and sizes are enabled
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    if (!product.sizesEnabled) {
      throw new ValidationError('Sizes are not enabled for this product');
    }

    // Check for duplicates
    if (product.sizes.includes(size)) {
      throw new ValidationError('Size value already exists');
    }

    return await this.productRepository.addSize(id, size);
  }

  async removeProductSize(id: string, size: string): Promise<Product> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    if (!product.sizes.includes(size)) {
      throw new ValidationError('Size value does not exist');
    }

    return await this.productRepository.removeSize(id, size);
  }

  async addProductColor(id: string, color: string): Promise<Product> {
    // Validate color value
    const validation = this.validateColorValue(color);
    if (!validation.isValid) {
      throw new ValidationError(validation.error);
    }

    // Check product exists and colors are enabled
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    if (!product.colorsEnabled) {
      throw new ValidationError('Colors are not enabled for this product');
    }

    // Check for duplicates
    if (product.colors.includes(color)) {
      throw new ValidationError('Color value already exists');
    }

    return await this.productRepository.addColor(id, color);
  }

  async removeProductColor(id: string, color: string): Promise<Product> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    if (!product.colors.includes(color)) {
      throw new ValidationError('Color value does not exist');
    }

    return await this.productRepository.removeColor(id, color);
  }

  validateSizeValue(size: string): ValidationResult {
    if (!size || size.trim().length === 0) {
      return { isValid: false, error: 'Size value cannot be empty' };
    }

    // Allow alphanumeric and common size notation symbols (-, /, space)
    const sizePattern = /^[a-zA-Z0-9\s\-\/]+$/;
    if (!sizePattern.test(size)) {
      return {
        isValid: false,
        error: 'Size value contains invalid characters'
      };
    }

    if (size.length > 20) {
      return { isValid: false, error: 'Size value is too long (max 20 characters)' };
    }

    return { isValid: true };
  }

  validateColorValue(color: string): ValidationResult {
    if (!color || color.trim().length === 0) {
      return { isValid: false, error: 'Color value cannot be empty' };
    }

    // Allow alphanumeric and spaces
    const colorPattern = /^[a-zA-Z0-9\s]+$/;
    if (!colorPattern.test(color)) {
      return {
        isValid: false,
        error: 'Color value contains invalid characters'
      };
    }

    if (color.length > 30) {
      return { isValid: false, error: 'Color value is too long (max 30 characters)' };
    }

    return { isValid: true };
  }
}
