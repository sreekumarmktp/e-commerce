const pgm = require('node-pg-migrate');
const path = require('path');
require('dotenv').config();

async function runMigrations() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        console.error('DATABASE_URL environment variable is required');
        process.exit(1);
    }

    const isAws = databaseUrl.includes('amazonaws.com');

    console.log('Running migrations on production database...');

    try {
        const runner = pgm.runner || pgm.default || pgm;
        await runner({
            databaseUrl: {
                connectionString: databaseUrl,
                ssl: isAws ? { rejectUnauthorized: false } : false
            },
            dir: path.join(__dirname, '../migrations'),
            direction: 'up',
            migrationsTable: 'pgmigrations',
            verbose: true,
        });
        console.log('Migrations completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

runMigrations();
