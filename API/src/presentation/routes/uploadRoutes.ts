import { FastifyInstance } from 'fastify';
import { UploadController } from '../controllers/UploadController';
import { authenticate, authorizeAdmin } from '../middleware/auth';

export async function registerUploadRoutes(fastify: FastifyInstance, uploadController: UploadController) {
    fastify.post('/upload', { preHandler: [authenticate, authorizeAdmin] }, uploadController.uploadFile.bind(uploadController));
}
