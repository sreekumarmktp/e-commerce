import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { IAuthService } from '../../domain/services/IAuthService';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { JwtService } from '../../infrastructure/auth/JwtService';
import { AuthResponse, CreateUserRequest, LoginRequest, User } from '../../domain/entities/User';

export class AuthService implements IAuthService {
    constructor(
        private userRepository: IUserRepository,
        private jwtService: JwtService
    ) { }

    async register(request: CreateUserRequest): Promise<AuthResponse> {
        const existingUser = await this.userRepository.findByEmail(request.email);
        if (existingUser) {
            throw new Error('User already exists');
        }

        const passwordHash = await bcrypt.hash(request.password, 10);

        const newUser: User = {
            id: uuidv4(),
            email: request.email,
            passwordHash,
            role: request.role || 'customer',
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const createdUser = await this.userRepository.create(newUser);
        const token = this.jwtService.generateToken({ userId: createdUser.id, role: createdUser.role });

        return {
            token,
            user: {
                id: createdUser.id,
                email: createdUser.email,
                role: createdUser.role,
            },
        };
    }

    async login(request: LoginRequest): Promise<AuthResponse> {
        const user = await this.userRepository.findByEmail(request.email);
        if (!user) {
            throw new Error('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(request.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new Error('Invalid credentials');
        }

        const token = this.jwtService.generateToken({ userId: user.id, role: user.role });

        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
        };
    }
}
