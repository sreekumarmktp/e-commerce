import { execSync } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const user = process.env.DB_USER;
const password = process.env.DB_PASSWORD ? encodeURIComponent(process.env.DB_PASSWORD) : '';
const host = process.env.DB_HOST;
const port = process.env.DB_PORT;
const dbName = process.env.DB_NAME;

const dbUrl = `postgres://${user}:${password}@${host}:${port}/${dbName}`;

console.log(`Running migrations for database: ${dbName} on ${host}`);

// Set DATABASE_URL for node-pg-migrate
process.env.DATABASE_URL = dbUrl;

const args = process.argv.slice(2).join(' '); // Pass through arguments (e.g. up, down)

try {
    // Use local node-pg-migrate binary with ts-node registration
    const cmd = `node -r ts-node/register ./node_modules/node-pg-migrate/bin/node-pg-migrate.js ${args} --tsconfig tsconfig.json`;
    execSync(cmd, { stdio: 'pipe', env: process.env });
} catch (error: any) {
    console.error('Migration failed.');
    const fs = require('fs');
    const log = `Error: ${error.message}\nOutput: ${error.stdout?.toString()}\nStderr: ${error.stderr?.toString()}`;
    fs.writeFileSync('migration_error.log', log);
    process.exit(1);
}
