import { AuthResponse, CreateUserRequest, LoginRequest } from '../entities/User';

export interface IAuthService {
    register(request: CreateUserRequest): Promise<AuthResponse>;
    login(request: LoginRequest): Promise<AuthResponse>;
}
