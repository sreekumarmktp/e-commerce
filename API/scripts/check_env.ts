import dotenv from 'dotenv';
import path from 'path';

const result = dotenv.config({ path: path.join(__dirname, '../.env') });

if (result.error) {
    console.error('Error loading .env:', result.error);
}

console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '******' : 'UNDEFINED');
console.log('DB_NAME:', process.env.DB_NAME);
