import { Order } from '../entities/Order';

export interface IOrderRepository {
    create(order: Order): Promise<Order>;
    findById(id: string): Promise<Order | null>;
    findByUserId(userId: string): Promise<Order[]>;
    findAll(): Promise<Order[]>; // For admin
    getStats(): Promise<{ totalOrders: number; totalSales: number }>;
    getDailySales(): Promise<{ date: string; sales: number }[]>;
}
