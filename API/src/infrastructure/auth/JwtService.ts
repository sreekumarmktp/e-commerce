import jwt from 'jsonwebtoken';

export class JwtService {
    private readonly secret: string;
    private readonly expiresIn: string;

    constructor() {
        this.secret = process.env.JWT_SECRET || 'supersecretkey';
        this.expiresIn = '24h';
    }

    generateToken(payload: object): string {
        return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn as any });
    }

    verifyToken(token: string): any {
        try {
            return jwt.verify(token, this.secret);
        } catch (error) {
            return null;
        }
    }
}
