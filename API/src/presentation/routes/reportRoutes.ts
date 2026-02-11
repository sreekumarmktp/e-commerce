import { FastifyInstance } from 'fastify';
import { ReportController } from '../controllers/ReportController';
import { authenticate, authorizeAdmin } from '../middleware/auth';

export async function registerReportRoutes(fastify: FastifyInstance, reportController: ReportController) {
    fastify.addHook('preHandler', authenticate);
    fastify.addHook('preHandler', authorizeAdmin);

    fastify.get('/admin/stats', reportController.getDashboardStats.bind(reportController));
    fastify.get('/admin/daily-sales', reportController.getDailySales.bind(reportController));
    fastify.get('/admin/orders/export', reportController.exportOrders.bind(reportController));
}
