import { FastifyReply, FastifyRequest } from 'fastify';
import { IOrderService } from '../../domain/services/IOrderService';
import { CreateOrderRequest } from '../../domain/entities/Order';
import { User } from '../../domain/entities/User';

export class OrderController {
    constructor(private orderService: IOrderService) { }

    async createOrder(
        req: FastifyRequest<{ Body: CreateOrderRequest }>,
        reply: FastifyReply
    ): Promise<void> {
        try {
            const user = req.user as User;
            if (!user) {
                reply.code(401).send({ error: 'Unauthorized' });
                return;
            }

            const orderData = req.body;
            const order = await this.orderService.createOrder(user.id, orderData);

            reply.code(201).send({
                success: true,
                data: order,
                message: 'Order placed successfully'
            });
        } catch (error) {
            reply.code(400).send({
                success: false,
                error: error instanceof Error ? error.message : 'Order placement failed'
            });
        }
    }

    async getUserOrders(req: FastifyRequest, reply: FastifyReply): Promise<void> {
        try {
            const user = req.user as User;
            if (!user) {
                reply.code(401).send({ error: 'Unauthorized' });
                return;
            }

            const orders = await this.orderService.getUserOrders(user.id);

            reply.send({
                success: true,
                data: orders,
                message: 'Orders retrieved successfully'
            });
        } catch (error) {
            reply.code(500).send({
                success: false,
                error: error instanceof Error ? error.message : 'Detailed error message'
            });
        }
    }

    async getAllOrders(req: FastifyRequest, reply: FastifyReply): Promise<void> {
        try {
            // Typically check for Admin role here
            const user = req.user as User;
            if (!user || user.role !== 'admin') {
                reply.code(403).send({ error: 'Forbidden' });
                return;
            }

            const orders = await this.orderService.getAllOrders();

            reply.send({
                success: true,
                data: orders,
                message: 'All orders retrieved successfully'
            });
        } catch (error) {
            reply.code(500).send({
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error'
            });
        }
    }
}
