import { FastifyReply, FastifyRequest } from 'fastify';
import { IProductService } from '../../domain/services/IProductService';
import { Product, CreateProductRequest, UpdateProductRequest } from '../../domain/entities/Product';
import { ToggleVariantsSchema, AddVariantValueSchema } from '../schemas/productSchemas';
import { ZodError } from 'zod';

import { IImageStorageService } from '../../domain/services/IImageStorageService';

export class ProductController {
  constructor(
    private productService: IProductService,
    private imageStorageService: IImageStorageService
  ) { }

  private mapToResponse(product: Product) {
    const { primaryImagePath, primaryImageId, ...rest } = product as any;

    // Maintain backward compatibility: map primaryImagePath to image (full URL)
    const image = this.imageStorageService.getImageUrl(primaryImagePath);

    // For images array, we might need to fetch them if not already present
    // But for basic listing, we usually only need the primary image.
    // If we need the full list, the ProductImageService handles it.

    return {
      ...rest,
      image,
      images: [image], // Fallback if images array is expected but not joined
      primaryImagePath,
      primaryImageId
    };
  }

  private mapListToResponse(products: Product[]) {
    return products.map(p => this.mapToResponse(p));
  }

  async getAllProducts(_req: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const products = await this.productService.getAllProducts();
      reply.send({
        success: true,
        data: this.mapListToResponse(products),
        message: 'Products retrieved successfully'
      });
    } catch (error) {
      reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  async getProductById(
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const product = await this.productService.getProductById(id);

      if (!product) {
        reply.code(404).send({
          success: false,
          error: 'Product not found'
        });
        return;
      }

      reply.send({
        success: true,
        data: this.mapToResponse(product),
        message: 'Product retrieved successfully'
      });
    } catch (error) {
      reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  async getProductsByCategory(
    req: FastifyRequest<{ Params: { category: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { category } = req.params as { category: string };
      const products = await this.productService.getProductsByCategory(category);

      reply.send({
        success: true,
        data: products,
        message: 'Products retrieved successfully'
      });
    } catch (error) {
      reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  async createProduct(
    req: FastifyRequest<{ Body: CreateProductRequest }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const productData: CreateProductRequest = req.body as CreateProductRequest;

      // Backward compatibility: map 'image' to 'primaryImagePath'
      if (!productData.primaryImagePath && (productData as any).image) {
        productData.primaryImagePath = (productData as any).image;
      }

      const product = await this.productService.createProduct(productData);

      reply.code(201).send({
        success: true,
        data: product,
        message: 'Product created successfully'
      });
    } catch (error) {
      reply.code(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Invalid product data'
      });
    }
  }

  async updateProduct(
    req: FastifyRequest<{ Params: { id: string }; Body: UpdateProductRequest }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const productData: UpdateProductRequest = req.body as UpdateProductRequest;

      // Backward compatibility: map 'image' to 'primaryImagePath'
      if (!productData.primaryImagePath && (productData as any).image) {
        productData.primaryImagePath = (productData as any).image;
      }

      const product = await this.productService.updateProduct(id, productData);

      if (!product) {
        reply.code(404).send({
          success: false,
          error: 'Product not found'
        });
        return;
      }

      reply.send({
        success: true,
        data: product,
        message: 'Product updated successfully'
      });
    } catch (error) {
      reply.code(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Invalid product data'
      });
    }
  }

  async deleteProduct(
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const deleted = await this.productService.deleteProduct(id);

      if (!deleted) {
        reply.code(404).send({
          success: false,
          error: 'Product not found'
        });
        return;
      }

      reply.send({
        success: true,
        message: 'Product deleted successfully'
      });
    } catch (error) {
      reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  // Variant management endpoints

  async toggleVariants(
    req: FastifyRequest<{ Params: { id: string }; Body: unknown }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const settings = ToggleVariantsSchema.parse(req.body);

      const product = await this.productService.toggleVariants(id, settings);

      reply.send({
        success: true,
        data: product,
        message: 'Variant settings updated successfully'
      });
    } catch (error) {
      if (error instanceof ZodError) {
        reply.code(400).send({
          success: false,
          error: 'Validation error',
          message: error.issues[0]?.message || 'Invalid request data'
        });
        return;
      }

      if (error instanceof Error && error.message === 'Product not found') {
        reply.code(404).send({
          success: false,
          error: 'Product not found'
        });
        return;
      }

      reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  async addSize(
    req: FastifyRequest<{ Params: { id: string }; Body: unknown }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const body = AddVariantValueSchema.parse(req.body);

      if (!body.size) {
        reply.code(400).send({
          success: false,
          error: 'Validation error',
          message: 'Size value is required'
        });
        return;
      }

      const product = await this.productService.addProductSize(id, body.size);

      reply.send({
        success: true,
        data: product,
        message: 'Size added successfully'
      });
    } catch (error) {
      if (error instanceof ZodError) {
        reply.code(400).send({
          success: false,
          error: 'Validation error',
          message: error.issues[0]?.message || 'Invalid request data'
        });
        return;
      }

      if (error instanceof Error) {
        if (error.message === 'Product not found') {
          reply.code(404).send({
            success: false,
            error: 'Product not found'
          });
          return;
        }

        if (error.message.includes('already exists') ||
          error.message.includes('cannot be empty') ||
          error.message.includes('invalid characters') ||
          error.message.includes('not enabled')) {
          reply.code(400).send({
            success: false,
            error: 'Validation error',
            message: error.message
          });
          return;
        }
      }

      reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  async removeSize(
    req: FastifyRequest<{ Params: { id: string; size: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { id, size } = req.params as { id: string; size: string };

      const product = await this.productService.removeProductSize(id, decodeURIComponent(size));

      reply.send({
        success: true,
        data: product,
        message: 'Size removed successfully'
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Product not found') {
          reply.code(404).send({
            success: false,
            error: 'Product not found'
          });
          return;
        }

        if (error.message.includes('does not exist')) {
          reply.code(400).send({
            success: false,
            error: 'Validation error',
            message: error.message
          });
          return;
        }
      }

      reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  async addColor(
    req: FastifyRequest<{ Params: { id: string }; Body: unknown }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const body = AddVariantValueSchema.parse(req.body);

      if (!body.color) {
        reply.code(400).send({
          success: false,
          error: 'Validation error',
          message: 'Color value is required'
        });
        return;
      }

      const product = await this.productService.addProductColor(id, body.color);

      reply.send({
        success: true,
        data: product,
        message: 'Color added successfully'
      });
    } catch (error) {
      if (error instanceof ZodError) {
        reply.code(400).send({
          success: false,
          error: 'Validation error',
          message: error.issues[0]?.message || 'Invalid request data'
        });
        return;
      }

      if (error instanceof Error) {
        if (error.message === 'Product not found') {
          reply.code(404).send({
            success: false,
            error: 'Product not found'
          });
          return;
        }

        if (error.message.includes('already exists') ||
          error.message.includes('cannot be empty') ||
          error.message.includes('invalid characters') ||
          error.message.includes('not enabled')) {
          reply.code(400).send({
            success: false,
            error: 'Validation error',
            message: error.message
          });
          return;
        }
      }

      reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  async removeColor(
    req: FastifyRequest<{ Params: { id: string; color: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { id, color } = req.params as { id: string; color: string };

      const product = await this.productService.removeProductColor(id, decodeURIComponent(color));

      reply.send({
        success: true,
        data: product,
        message: 'Color removed successfully'
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Product not found') {
          reply.code(404).send({
            success: false,
            error: 'Product not found'
          });
          return;
        }

        if (error.message.includes('does not exist')) {
          reply.code(400).send({
            success: false,
            error: 'Validation error',
            message: error.message
          });
          return;
        }
      }

      reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }
}
