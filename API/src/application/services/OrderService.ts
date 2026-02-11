import { v4 as uuidv4 } from 'uuid';
import { IOrderService } from '../../domain/services/IOrderService';
import { IOrderRepository } from '../../domain/repositories/IOrderRepository';
import { IProductRepository } from '../../domain/repositories/IProductRepository';
import { INotificationService } from '../../infrastructure/services/NotificationService';
import { CreateOrderRequest, Order, OrderItem } from '../../domain/entities/Order';
import { User } from '../../domain/entities/User';

export class OrderService implements IOrderService {
    constructor(
        private orderRepository: IOrderRepository,
        private productRepository: IProductRepository,
        private notificationService: INotificationService,
        private userRepository: { findById(id: string): Promise<User | null> } // minimal interface
    ) { }

    async createOrder(userId: string, request: CreateOrderRequest): Promise<Order> {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        const orderId = uuidv4();
        const orderItems: OrderItem[] = [];
        let totalAmount = 0;

        // Validate items and calculate total
        for (const itemRequest of request.items) {
            const product = await this.productRepository.findById(itemRequest.productId);
            if (!product) {
                throw new Error(`Product ${itemRequest.productId} not found`);
            }

            if (product.stock < itemRequest.quantity) {
                throw new Error(`Insufficient stock for product ${product.name}`);
            }

            const orderItem: OrderItem = {
                id: uuidv4(),
                orderId,
                productId: product.id,
                quantity: itemRequest.quantity,
                price: product.price // Use current price from DB
            };

            orderItems.push(orderItem);
            totalAmount += product.price * itemRequest.quantity;

            // Update stock
            await this.productRepository.update(product.id, {
                stock: product.stock - itemRequest.quantity
            });
        }

        const order: Order = {
            id: orderId,
            userId,
            totalAmount,
            status: 'pending',
            items: orderItems,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const createdOrder = await this.orderRepository.create(order);

        // Send notification
        try {
            await this.notificationService.sendOrderConfirmation(user.email, order.id, order.totalAmount);
        } catch (error) {
            console.error('Failed to send notification', error);
            // Don't fail the order just because email failed
        }

        return createdOrder;
    }

    async getOrderById(id: string): Promise<Order | null> {
        return this.orderRepository.findById(id);
    }

    async getUserOrders(userId: string): Promise<Order[]> {
        return this.orderRepository.findByUserId(userId);
    }

    async getAllOrders(): Promise<Order[]> {
        return this.orderRepository.findAll();
    }
}
