import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
};

async function verifyMigrations() {
  const client = new Client(config);

  try {
    await client.connect();
    console.log('Connected to database:', process.env.DB_NAME);

    // Check if pgmigrations table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'pgmigrations'
      );
    `);

    if (tableCheck.rows[0].exists) {
      console.log('\n✓ Migrations table exists');
      
      // List all applied migrations
      const migrations = await client.query(`
        SELECT id, name, run_on 
        FROM pgmigrations 
        ORDER BY id;
      `);

      console.log(`\n✓ Applied migrations (${migrations.rows.length}):`);
      migrations.rows.forEach((row) => {
        console.log(`  - ${row.name} (${new Date(row.run_on).toLocaleString()})`);
      });
    } else {
      console.log('\n✗ Migrations table does not exist');
    }

    // List all tables
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log(`\n✓ Database tables (${tables.rows.length}):`);
    tables.rows.forEach((row) => {
      console.log(`  - ${row.table_name}`);
    });

  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

verifyMigrations();
