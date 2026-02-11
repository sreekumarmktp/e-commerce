import { CreateOrderRequest, Order } from '../entities/Order';

export interface IOrderService {
    createOrder(userId: string, request: CreateOrderRequest): Promise<Order>;
    getOrderById(id: string): Promise<Order | null>;
    getUserOrders(userId: string): Promise<Order[]>;
    getAllOrders(): Promise<Order[]>;
}
