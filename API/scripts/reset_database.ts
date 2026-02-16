import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: 'postgres', // Connect to default postgres database
};

const dbName = process.env.DB_NAME || 'ecommerce';

async function resetDatabase() {
  const client = new Client(config);

  try {
    await client.connect();
    console.log('Connected to PostgreSQL');

    // Terminate existing connections to the database
    console.log(`Terminating connections to database: ${dbName}`);
    await client.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = $1
        AND pid <> pg_backend_pid();
    `, [dbName]);

    // Drop the database
    console.log(`Dropping database: ${dbName}`);
    await client.query(`DROP DATABASE IF EXISTS ${dbName};`);

    // Create the database
    console.log(`Creating database: ${dbName}`);
    await client.query(`CREATE DATABASE ${dbName};`);

    console.log('Database reset successfully!');
  } catch (error: any) {
    console.error('Error resetting database:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

resetDatabase();
