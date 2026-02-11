export interface User {
    id: string;
    email: string;
    passwordHash: string;
    role: 'admin' | 'customer';
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateUserRequest {
    email: string;
    password: string;
    role?: 'admin' | 'customer';
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface AuthResponse {
    token: string;
    user: {
        id: string;
        email: string;
        role: string;
    };
}
