import { Pool } from 'pg';
import { Database } from '../database/Database';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { User } from '../../domain/entities/User';

export class UserRepository implements IUserRepository {
    private pool: Pool;

    constructor() {
        this.pool = Database.getInstance().getConnection();
    }

    async create(user: User): Promise<User> {
        const query = `
      INSERT INTO users (id, email, password_hash, role, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
        const values = [user.id, user.email, user.passwordHash, user.role, user.createdAt, user.updatedAt];
        const result = await this.pool.query(query, values);
        return this.mapToEntity(result.rows[0]);
    }

    async findByEmail(email: string): Promise<User | null> {
        const query = 'SELECT * FROM users WHERE email = $1';
        const result = await this.pool.query(query, [email]);
        if (result.rows.length === 0) return null;
        return this.mapToEntity(result.rows[0]);
    }

    async findById(id: string): Promise<User | null> {
        const query = 'SELECT * FROM users WHERE id = $1';
        const result = await this.pool.query(query, [id]);
        if (result.rows.length === 0) return null;
        return this.mapToEntity(result.rows[0]);
    }

    private mapToEntity(row: any): User {
        return {
            id: row.id,
            email: row.email,
            passwordHash: row.password_hash,
            role: row.role,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
}
