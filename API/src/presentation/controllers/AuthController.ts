import { FastifyReply, FastifyRequest } from 'fastify';
import { IAuthService } from '../../domain/services/IAuthService';
import { CreateUserRequest, LoginRequest } from '../../domain/entities/User';

export class AuthController {
    constructor(private authService: IAuthService) { }

    async register(
        req: FastifyRequest<{ Body: CreateUserRequest }>,
        reply: FastifyReply
    ): Promise<void> {
        try {
            const userData = req.body;
            const result = await this.authService.register(userData);

            reply.code(201).send({
                success: true,
                data: result,
                message: 'User registered successfully'
            });
        } catch (error) {
            reply.code(400).send({
                success: false,
                error: error instanceof Error ? error.message : 'Registration failed'
            });
        }
    }

    async login(
        req: FastifyRequest<{ Body: LoginRequest }>,
        reply: FastifyReply
    ): Promise<void> {
        try {
            const credentials = req.body;
            const result = await this.authService.login(credentials);

            reply.send({
                success: true,
                data: result,
                message: 'Login successful'
            });
        } catch (error) {
            reply.code(401).send({
                success: false,
                error: error instanceof Error ? error.message : 'Login failed'
            });
        }
    }
}
