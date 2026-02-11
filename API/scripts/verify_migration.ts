import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function verifyMigration() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'ecommerce',
  });

  try {
    console.log('Verifying migration results...\n');

    // Check if columns exist
    const columnsQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'products' 
      AND column_name IN ('sizes_enabled', 'colors_enabled')
      ORDER BY column_name;
    `;
    
    const columnsResult = await pool.query(columnsQuery);
    
    if (columnsResult.rows.length === 0) {
      console.log('❌ Migration columns not found! Migration may not have run.');
      return;
    }
    
    console.log('✅ Migration columns found:');
    columnsResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}, nullable: ${row.is_nullable}, default: ${row.column_default}`);
    });
    console.log('');

    // Check products and their variant settings
    const productsQuery = `
      SELECT 
        id, 
        name, 
        jsonb_array_length(sizes) as sizes_count,
        jsonb_array_length(colors) as colors_count,
        sizes_enabled,
        colors_enabled
      FROM products
      LIMIT 10;
    `;
    
    const productsResult = await pool.query(productsQuery);
    
    if (productsResult.rows.length === 0) {
      console.log('ℹ️  No products found in database. Migration defaults cannot be verified.');
      console.log('   This is expected if the database is empty.');
    } else {
      console.log(`✅ Found ${productsResult.rows.length} products. Verifying migration logic:\n`);
      
      let allCorrect = true;
      productsResult.rows.forEach(product => {
        const sizesCount = product.sizes_count || 0;
        const colorsCount = product.colors_count || 0;
        const expectedSizesEnabled = sizesCount > 0;
        const expectedColorsEnabled = colorsCount > 0;
        
        const sizesCorrect = product.sizes_enabled === expectedSizesEnabled;
        const colorsCorrect = product.colors_enabled === expectedColorsEnabled;
        
        const status = sizesCorrect && colorsCorrect ? '✅' : '❌';
        
        console.log(`${status} Product: ${product.name.substring(0, 30)}`);
        console.log(`   Sizes: ${sizesCount} items → sizesEnabled: ${product.sizes_enabled} (expected: ${expectedSizesEnabled}) ${sizesCorrect ? '✅' : '❌'}`);
        console.log(`   Colors: ${colorsCount} items → colorsEnabled: ${product.colors_enabled} (expected: ${expectedColorsEnabled}) ${colorsCorrect ? '✅' : '❌'}`);
        console.log('');
        
        if (!sizesCorrect || !colorsCorrect) {
          allCorrect = false;
        }
      });
      
      if (allCorrect) {
        console.log('✅ All products have correct variant settings based on migration logic!');
      } else {
        console.log('❌ Some products have incorrect variant settings!');
      }
    }

    console.log('\n✅ Migration verification complete!');
    
  } catch (error) {
    console.error('❌ Error verifying migration:', error);
  } finally {
    await pool.end();
  }
}

verifyMigration();
