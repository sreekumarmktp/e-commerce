const { execSync } = require('child_process');
const path = require('path');

// Ensure DATABASE_URL is available
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error('DATABASE_URL environment variable is not set.');
    process.exit(1);
}

console.log('Running production migrations...');

try {
    // Use node-pg-migrate CLI directly
    // We set rejectionUnauthorized to false via environment variable for the pg driver
    // node-pg-migrate uses 'pg' internally.
    const env = {
        ...process.env,
        // This is a common way to force SSL for pg when using a connection string
        // but often we need to pass a config object. 
        // node-pg-migrate's CLI is limited for SSL objects, so we use the database-url-var
        // and hope the environment handles it, or we use a programmatic runner.
    };

    // Programmatic migration instead of CLI for better SSL control
    const migrate = require('node-pg-migrate').default;

    const options = {
        databaseUrl: {
            connectionString: databaseUrl,
            ssl: databaseUrl.includes('amazonaws.com') ? { rejectUnauthorized: false } : false
        },
        dir: 'migrations',
        direction: 'up',
        migrationsTable: 'pgmigrations',
    };

    migrate(options)
        .then(() => {
            console.log('Migrations completed successfully.');
            process.exit(0);
        })
        .catch((err) => {
            console.error('Migration failed:', err);
            process.exit(1);
        });

} catch (error) {
    console.error('Failed to initialize migration runner:', error);
    process.exit(1);
}
