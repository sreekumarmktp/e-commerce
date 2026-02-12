const fs = require('fs');
const path = require('path');

function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    console.log(message);
    fs.appendFileSync('migration.log', logMessage);
}

log('Starting production migration runner...');

// Ensure DATABASE_URL is available
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    log('ERROR: DATABASE_URL environment variable is not set.');
    process.exit(1);
}

try {
    log(`Connecting to: ${databaseUrl.split('@')[1] || 'hidden'}`);

    // In Node 14+, 'node-pg-migrate' is the package name
    // The programmatic runner is usually the default export
    const migrate = require('node-pg-migrate').default;

    if (!migrate) {
        log('ERROR: Could not find node-pg-migrate default export.');
        process.exit(1);
    }

    const options = {
        databaseUrl: {
            connectionString: databaseUrl,
            ssl: databaseUrl.includes('amazonaws.com') ? { rejectUnauthorized: false } : false
        },
        dir: 'migrations',
        direction: 'up',
        migrationsTable: 'pgmigrations',
        verbose: true
    };

    log('Executing migrations...');
    migrate(options)
        .then(() => {
            log('SUCCESS: Migrations completed successfully.');
            process.exit(0);
        })
        .catch((err) => {
            log(`ERROR: Migration failed: ${err.message}`);
            log(err.stack);
            process.exit(1);
        });

} catch (error) {
    log(`CRITICAL: Failed to initialize migration runner: ${error.message}`);
    log(error.stack);
    process.exit(1);
}
