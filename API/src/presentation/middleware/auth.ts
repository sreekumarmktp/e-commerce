import { FastifyReply, FastifyRequest } from 'fastify';
import { JwtService } from '../../infrastructure/auth/JwtService';
import { UserRepository } from '../../infrastructure/repositories/UserRepository';
import { User } from '../../domain/entities/User';

const jwtService = new JwtService();
const userRepository = new UserRepository();

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
    try {
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            reply.code(401).send({ error: 'Unauthorized: Missing token' });
            return;
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwtService.verifyToken(token);

        if (!decoded) {
            reply.code(401).send({ error: 'Unauthorized: Invalid token' });
            return;
        }

        const user = await userRepository.findById(decoded.userId);
        if (!user) {
            reply.code(401).send({ error: 'Unauthorized: User not found' });
            return;
        }

        request.user = user;
    } catch (error) {
        reply.code(401).send({ error: 'Unauthorized' });
    }
}

export async function authorizeAdmin(request: FastifyRequest, reply: FastifyReply) {
    if (!request.user || request.user.role !== 'admin') {
        reply.code(403).send({ error: 'Forbidden: Admin access required' });
        return;
    }
}
