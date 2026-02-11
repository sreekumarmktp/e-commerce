import { Pool } from 'pg';
import path from 'path';

export class Database {
  private static instance: Database;
  private pool: Pool;

  private constructor() {
    const config = process.env.DATABASE_URL
      ? { connectionString: process.env.DATABASE_URL }
      : {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 5432,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'ecommerce',
      };

    this.pool = new Pool(config);

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
