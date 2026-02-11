import { FastifyInstance } from 'fastify';
import { AuthController } from '../controllers/AuthController';
import { User } from '../../domain/entities/User';

declare module 'fastify' {
    interface FastifyRequest {
        user?: User;
    }
}

export async function registerAuthRoutes(fastify: FastifyInstance, authController: AuthController) {
    fastify.post('/auth/register', authController.register.bind(authController));
    fastify.post('/auth/login', authController.login.bind(authController));
}
