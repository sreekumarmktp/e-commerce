import 'dotenv/config';
import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import compress from '@fastify/compress';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import path from 'path';

import { ProductService } from './application/services/ProductService';
import { CartService } from './application/services/CartService';
import { AuthService } from './application/services/AuthService';
import { ProductRepository } from './infrastructure/repositories/ProductRepository';
import { CartRepository } from './infrastructure/repositories/CartRepository';
import { UserRepository } from './infrastructure/repositories/UserRepository';
import { JwtService } from './infrastructure/auth/JwtService';
import { AuthController } from './presentation/controllers/AuthController';

import { registerProductRoutes } from './presentation/routes/productRoutes';
import { registerProductImageRoutes } from './presentation/routes/productImageRoutes';
import { registerCartRoutes } from './presentation/routes/cartRoutes';
import { registerAuthRoutes } from './presentation/routes/authRoutes';
import { errorHandlerPlugin } from './presentation/middleware/errorHandler';

import { OrderService } from './application/services/OrderService';
import { OrderRepository } from './infrastructure/repositories/OrderRepository';
import { OrderController } from './presentation/controllers/OrderController';
import { registerOrderRoutes } from './presentation/routes/orderRoutes';

import { LocalStorageService } from './infrastructure/services/StorageService';
import { UploadController } from './presentation/controllers/UploadController';
import { registerUploadRoutes } from './presentation/routes/uploadRoutes';

import { NotificationService } from './infrastructure/services/NotificationService';

import { ReportController } from './presentation/controllers/ReportController';
import { registerReportRoutes } from './presentation/routes/reportRoutes';

import { ProductImageService } from './application/services/ProductImageService';
import { ProductImageRepository } from './infrastructure/repositories/ProductImageRepository';
import { ImageValidator } from './domain/services/ImageValidator';
import { ImageStorageServiceFactory } from './infrastructure/services/ImageStorageServiceFactory';

import { env } from './config/env';

const PORT = env.PORT;

// Initialize database
import './infrastructure/database/Database';

// Dependency Injection
const productRepository = new ProductRepository();
const cartRepository = new CartRepository();
const userRepository = new UserRepository();
const orderRepository = new OrderRepository();
const productImageRepository = new ProductImageRepository();

const jwtService = new JwtService();
const storageService = new LocalStorageService();
const notificationService = new NotificationService();
const imageStorageService = ImageStorageServiceFactory.createImageStorageService();
const imageValidator = new ImageValidator();

const productService = new ProductService(productRepository);
const cartService = new CartService(cartRepository);
const authService = new AuthService(userRepository, jwtService);
const orderService = new OrderService(orderRepository, productRepository, notificationService, userRepository);
const productImageService = new ProductImageService(
  imageValidator,
  imageStorageService,
  productImageRepository,
  productRepository
);

const authController = new AuthController(authService);
const orderController = new OrderController(orderService);
const uploadController = new UploadController(storageService);
const reportController = new ReportController(orderRepository);

function buildServer(): FastifyInstance {
  const app = Fastify({
    logger: true,
    requestTimeout: 120000, // 120 seconds for file uploads
    bodyLimit: 10 * 1024 * 1024, // 10MB body limit
  });

  app.register(helmet);
  app.register(cors, { origin: true });
  app.register(rateLimit, { max: 200, timeWindow: '1 minute' });
  app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB per file
      files: 10, // Max 10 files per request
    },
    attachFieldsToBody: false,
  });

  // Serve uploaded files
  app.register(fastifyStatic, {
    root: path.join(process.cwd(), 'uploads'),
    prefix: '/uploads/',
  });

  app.register(errorHandlerPlugin);

  app.register(swagger, {
    openapi: {
      info: { title: 'E-commerce API', version: '1.0.0' },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      }
    }
  });
  app.register(swaggerUI, { routePrefix: '/docs' });

  // Health check endpoints
  app.get('/', async () => ({ status: 'OK', message: 'E-commerce API is running' }));
  app.get('/health', async () => ({ status: 'OK', timestamp: new Date().toISOString() }));

  // Routes
  app.register(async (api) => {
    api.register(async (products) => {
      registerProductRoutes(products, productService);
      registerProductImageRoutes(products, productImageService);
    }, { prefix: '/products' });
    api.register(async (cart) => registerCartRoutes(cart, cartService), { prefix: '/cart' });
    api.register(async (auth) => registerAuthRoutes(auth, authController), { prefix: '/' }); // /api/auth/login
    api.register(async (orders) => registerOrderRoutes(orders, orderController), { prefix: '/' });
    api.register(async (uploads) => registerUploadRoutes(uploads, uploadController), { prefix: '/' });
    api.register(async (reports) => registerReportRoutes(reports, reportController), { prefix: '/' });
  }, { prefix: '/api' });

  return app;
}

const app = buildServer();

async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || !databaseUrl.includes('amazonaws.com')) {
    return; // Skip migrations if not in AWS or no URL
  }

  app.log.info('Running database migrations...');
  try {
    const pgm = require('node-pg-migrate');
    const runner = pgm.default || pgm;
    await runner({
      databaseUrl: {
        connectionString: databaseUrl,
        ssl: { rejectUnauthorized: false }
      },
      dir: path.join(process.cwd(), 'migrations'),
      direction: 'up',
      migrationsTable: 'pgmigrations',
      verbose: true,
    });
    app.log.info('Migrations completed successfully.');
  } catch (err: any) {
    app.log.error('Migration failed:', err);
    throw err;
  }
}

async function start() {
  try {
    // Run migrations first
    await runMigrations();

    await app.listen({ port: PORT, host: '0.0.0.0' });
    app.log.info(`🚀 E-commerce API server running on port ${PORT}`);
    app.log.info(`📊 Health check: http://localhost:${PORT}/health`);
    app.log.info(`📚 Swagger UI: http://localhost:${PORT}/docs`);
    app.log.info(`🛍️  Products API: http://localhost:${PORT}/api/products`);
    app.log.info(`🛒 Cart API: http://localhost:${PORT}/api/cart`);
    app.log.info(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
    app.log.info(`📦 Order API: http://localhost:${PORT}/api/orders`);
    app.log.info(`📤 Upload API: http://localhost:${PORT}/api/upload`);
    app.log.info(`📈 Report API: http://localhost:${PORT}/api/admin`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
