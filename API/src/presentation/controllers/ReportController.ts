import { FastifyReply, FastifyRequest } from 'fastify';
import { IOrderRepository } from '../../domain/repositories/IOrderRepository';
import { User } from '../../domain/entities/User';

export class ReportController {
    constructor(private orderRepository: IOrderRepository) { }

    async getDashboardStats(req: FastifyRequest, reply: FastifyReply): Promise<void> {
        try {
            const user = req.user as User;
            if (!user || user.role !== 'admin') {
                reply.code(403).send({ error: 'Forbidden' });
                return;
            }

            const stats = await this.orderRepository.getStats();

            reply.send({
                success: true,
                data: stats,
                message: 'Stats retrieved successfully'
            });
        } catch (error) {
            reply.code(500).send({
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error'
            });
        }
    }

    async getDailySales(req: FastifyRequest, reply: FastifyReply): Promise<void> {
        try {
            const user = req.user as User;
            if (!user || user.role !== 'admin') {
                reply.code(403).send({ error: 'Forbidden' });
                return;
            }

            const salesData = await this.orderRepository.getDailySales();

            reply.send({
                success: true,
                data: salesData,
                message: 'Daily sales retrieved successfully'
            });
        } catch (error) {
            reply.code(500).send({
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error'
            });
        }
    }

    async exportOrders(req: FastifyRequest, reply: FastifyReply): Promise<void> {
        try {
            const user = req.user as User;
            if (!user || user.role !== 'admin') {
                reply.code(403).send({ error: 'Forbidden' });
                return;
            }

            const orders = await this.orderRepository.findAll();

            // Generate CSV
            const header = 'Order ID,Date,Customer ID,Total Amount,Status\n';
            const rows = orders.map(o =>
                `${o.id},${o.createdAt.toISOString()},${o.userId},${o.totalAmount},${o.status}`
            ).join('\n');
            const csv = header + rows;

            reply
                .header('Content-Type', 'text/csv')
                .header('Content-Disposition', 'attachment; filename=orders_report.csv')
                .send(csv);
        } catch (error) {
            reply.code(500).send({
                success: false,
                error: error instanceof Error ? error.message : 'Export failed'
            });
        }
    }
}
