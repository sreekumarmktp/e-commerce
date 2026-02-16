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

async function verifyData() {
  const client = new Client(config);

  try {
    await client.connect();
    console.log('Connected to database:', process.env.DB_NAME);

    // Check products with their primary images
    const products = await client.query(`
      SELECT 
        p.id,
        p.name,
        p.primary_image_path,
        p.primary_image_id,
        pi.image_path as linked_image_path,
        pi.is_primary
      FROM products p
      LEFT JOIN product_images pi ON p.primary_image_id = pi.id
      ORDER BY p.id
      LIMIT 5;
    `);

    console.log(`\n✓ Products with primary images (showing first 5):`);
    products.rows.forEach((row) => {
      console.log(`\n  Product: ${row.name}`);
      console.log(`    ID: ${row.id}`);
      console.log(`    Primary Image Path: ${row.primary_image_path}`);
      console.log(`    Primary Image ID: ${row.primary_image_id || 'NULL ❌'}`);
      console.log(`    Linked Image Path: ${row.linked_image_path || 'NULL'}`);
      console.log(`    Is Primary: ${row.is_primary}`);
    });

    // Count products without primary_image_id
    const nullCount = await client.query(`
      SELECT COUNT(*) as count
      FROM products
      WHERE primary_image_id IS NULL;
    `);

    console.log(`\n✓ Products without primary_image_id: ${nullCount.rows[0].count}`);

    // Count product images
    const imageCount = await client.query(`
      SELECT COUNT(*) as count
      FROM product_images;
    `);

    console.log(`✓ Total product images: ${imageCount.rows[0].count}`);

  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

verifyData();
