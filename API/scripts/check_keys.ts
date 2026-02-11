import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

async function check() {
    try {
        const res = await pool.query('SELECT * FROM products LIMIT 1');
        console.log('Keys:', Object.keys(res.rows[0] || {}));

        // Check if code expectation matches
        const row = res.rows[0];
        if (row && row.updatedAt === undefined && row.updatedat !== undefined) {
            console.log('MISMATCH: Row has updatedat but code likely expects updatedAt');
        }

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

check();
