/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
    // 1. Add primary_image_id column to products table
    pgm.addColumns('products', {
        primary_image_id: {
            type: 'uuid',
            references: 'product_images',
            onDelete: 'SET NULL',
            notNull: false,
        }
    });

    // 2. Rename image to primary_image_path
    pgm.renameColumn('products', 'image', 'primary_image_path');

    // 3. Data transformation for existing images in products table
    // Convert full URLs to relative paths (stripping common prefixes)
    pgm.sql(`
        UPDATE products 
        SET primary_image_path = 
            CASE 
                WHEN primary_image_path LIKE 'http://localhost:3001/uploads/%' THEN REPLACE(primary_image_path, 'http://localhost:3001/uploads/', '')
                WHEN primary_image_path LIKE 'https://%/%/uploads/%' THEN split_part(primary_image_path, 'uploads/', 2)
                ELSE primary_image_path
            END
    `);

    // 4. Data transformation for product_images table
    pgm.sql(`
        UPDATE product_images 
        SET image_path = 
            CASE 
                WHEN image_path LIKE 'http://localhost:3001/uploads/%' THEN REPLACE(image_path, 'http://localhost:3001/uploads/', '')
                WHEN image_path LIKE 'https://%/%/uploads/%' THEN split_part(image_path, 'uploads/', 2)
                ELSE image_path
            END
    `);

    // 5. Populate primary_image_id from product_images table where is_primary = true
    pgm.sql(`
        UPDATE products p
        SET primary_image_id = pi.id
        FROM product_images pi
        WHERE pi.product_id = p.id AND pi.is_primary = true
    `);

    // 6. Remove redundant columns
    pgm.dropColumns('products', ['images']);
    pgm.dropColumns('product_images', ['image_url']);
};

exports.down = pgm => {
    // Re-add columns
    pgm.addColumns('product_images', {
        image_url: { type: 'varchar(500)', notNull: false } // Setting notNull to false for rollback ease
    });

    pgm.addColumns('products', {
        images: { type: 'jsonb', default: '[]' }
    });

    // pgm.renameColumn('products', 'primary_image_path', 'image'); // This would swap it back
    // Rollback of data transformations is complex and depends on original environment variables
    // so we'll just restore the column names.

    pgm.renameColumn('products', 'primary_image_path', 'image');
    pgm.dropColumns('products', ['primary_image_id']);
};
