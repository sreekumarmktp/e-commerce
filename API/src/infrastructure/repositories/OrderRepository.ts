import { Pool } from 'pg';
import { Database } from '../database/Database';
import { IOrderRepository } from '../../domain/repositories/IOrderRepository';
import { Order, OrderItem } from '../../domain/entities/Order';

export class OrderRepository implements IOrderRepository {
    private pool: Pool;

    constructor() {
        this.pool = Database.getInstance().getConnection();
    }

    async create(order: Order): Promise<Order> {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            // Insert Order
            const orderQuery = `
        INSERT INTO orders (id, user_id, total_amount, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
            const orderValues = [order.id, order.userId, order.totalAmount, order.status, order.createdAt, order.updatedAt];
            await client.query(orderQuery, orderValues);

            // Insert Items
            // Note: In production, batch insert is better.
            for (const item of order.items) {
                const itemQuery = `
          INSERT INTO order_items (id, order_id, product_id, quantity, price)
          VALUES ($1, $2, $3, $4, $5)
        `;
                const itemValues = [item.id, item.orderId, item.productId, item.quantity, item.price];
                await client.query(itemQuery, itemValues);
            }

            await client.query('COMMIT');
            return order;
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }

    async findById(id: string): Promise<Order | null> {
        const orderResult = await this.pool.query('SELECT * FROM orders WHERE id = $1', [id]);
        if (orderResult.rows.length === 0) return null;

        const orderRow = orderResult.rows[0];
        const itemsResult = await this.pool.query('SELECT * FROM order_items WHERE order_id = $1', [id]);

        return this.mapToEntity(orderRow, itemsResult.rows);
    }

    async findByUserId(userId: string): Promise<Order[]> {
        const orderResult = await this.pool.query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
        const orders: Order[] = [];

        // N+1 problem here, but okay for MVP with low traffic
        for (const row of orderResult.rows) {
            const itemsResult = await this.pool.query('SELECT * FROM order_items WHERE order_id = $1', [row.id]);
            orders.push(this.mapToEntity(row, itemsResult.rows));
        }

        return orders;
    }

    async findAll(): Promise<Order[]> {
        const orderResult = await this.pool.query('SELECT * FROM orders ORDER BY created_at DESC');
        const orders: Order[] = [];

        for (const row of orderResult.rows) {
            const itemsResult = await this.pool.query('SELECT * FROM order_items WHERE order_id = $1', [row.id]);
            orders.push(this.mapToEntity(row, itemsResult.rows));
        }

        return orders;
    }

    async getStats(): Promise<{ totalOrders: number; totalSales: number }> {
        const result = await this.pool.query('SELECT COUNT(*) as count, SUM(total_amount) as total FROM orders');
        const row = result.rows[0];
        return {
            totalOrders: Number(row.count) || 0,
            totalSales: Number(row.total) || 0
        };
    }

    async getDailySales(): Promise<{ date: string; sales: number }[]> {
        const query = `
            SELECT 
                TO_CHAR(created_at, 'YYYY-MM-DD') as date,
                SUM(total_amount) as sales
            FROM orders
            GROUP BY date
            ORDER BY date ASC
            LIMIT 30
        `;
        const result = await this.pool.query(query);
        return result.rows.map(row => ({
            date: row.date,
            sales: parseFloat(row.sales)
        }));
    }

    private mapToEntity(row: any, items: any[]): Order {
        return {
            id: row.id,
            userId: row.user_id,
            totalAmount: parseFloat(row.total_amount),
            status: row.status,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            items: items.map(i => ({
                id: i.id,
                orderId: i.order_id,
                productId: i.product_id,
                quantity: i.quantity,
                price: parseFloat(i.price),
            })),
        };
    }
}
