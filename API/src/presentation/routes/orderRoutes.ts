import { FastifyInstance } from 'fastify';
import { OrderController } from '../controllers/OrderController';
import { authenticate, authorizeAdmin } from '../middleware/auth';
import { User } from '../../domain/entities/User';

declare module 'fastify' {
    interface FastifyRequest {
        user?: User;
    }
}

export async function registerOrderRoutes(fastify: FastifyInstance, orderController: OrderController) {
    fastify.addHook('preHandler', authenticate);

    // Protected Routes
    fastify.post('/orders', orderController.createOrder.bind(orderController));
    fastify.get('/orders', orderController.getUserOrders.bind(orderController));

    // Admin Routes
    fastify.get('/admin/orders', { preHandler: authorizeAdmin }, orderController.getAllOrders.bind(orderController));
}
