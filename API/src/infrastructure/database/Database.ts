import { Pool } from 'pg';
import path from 'path';

export class Database {
  private static instance: Database;
  private pool: Pool;

  private constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'ecommerce',
    });

    // Test connection
    this.pool.query('SELECT NOW()', (err, res) => {
      if (err) {
        console.error('Database connection failed:', err);
      } else {
        console.log('Database connected successfully');
      }
    });
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public getConnection(): Pool {
    return this.pool;
  }

}
