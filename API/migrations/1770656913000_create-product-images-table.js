/**
 * Migration: Create ProductImage table for product image management
 * 
 * This migration creates the product_images table to store metadata and references
 * for images associated with products. The table supports:
 * - Multiple images per product (up to 7)
 * - Image ordering/sequencing
 * - Primary image designation
 * - Image metadata (size, dimensions, MIME type)
 * - Automatic timestamps for audit trail
 * 
 * Indexes are created for:
 * - product_id: Fast lookup of all images for a product
 * - (product_id, is_primary): Fast lookup of primary image for a product
 * 
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
    // Create the product_images table
    pgm.createTable('product_images', {
        id: {
            type: 'uuid',
            primaryKey: true,
            default: pgm.func('gen_random_uuid()'),
        },
        product_id: {
            type: 'varchar(50)',
            notNull: true,
            references: 'products',
            onDelete: 'CASCADE',
        },
        image_path: {
            type: 'varchar(500)',
            notNull: true,
        },
        image_url: {
            type: 'varchar(500)',
            notNull: true,
        },
        display_order: {
            type: 'integer',
            notNull: true,
        },
        is_primary: {
            type: 'boolean',
            notNull: true,
            default: false,
        },
        file_size: {
            type: 'integer',
            notNull: true,
        },
        mime_type: {
            type: 'varchar(50)',
            notNull: true,
        },
        width: {
            type: 'integer',
            notNull: true,
        },
        height: {
            type: 'integer',
            notNull: true,
        },
        created_at: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('CURRENT_TIMESTAMP'),
        },
        updated_at: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('CURRENT_TIMESTAMP'),
        },
    });

    // Add unique constraint on product_id and image_path combination
    pgm.addConstraint('product_images', 'unique_product_image_path', {
        unique: ['product_id', 'image_path'],
    });

    // Add check constraint for display_order to be non-negative
    pgm.addConstraint('product_images', 'check_display_order_non_negative', {
        check: 'display_order >= 0',
    });

    // Create index on product_id for fast lookup of all images for a product
    pgm.createIndex('product_images', 'product_id', {
        name: 'idx_product_images_product_id',
    });

    // Create composite index on product_id and is_primary for fast lookup of primary image
    pgm.createIndex('product_images', ['product_id', 'is_primary'], {
        name: 'idx_product_images_is_primary',
    });
};

/**
 * Rollback migration - drops the product_images table and all associated indexes
 * 
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
    pgm.dropTable('product_images');
};
