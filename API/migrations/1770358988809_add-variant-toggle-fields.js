/**
 * Migration: Add variant toggle fields to products table
 * 
 * This migration adds sizesEnabled and colorsEnabled boolean fields to the products table
 * to allow administrators to control whether products have size and color options.
 * 
 * The migration sets intelligent defaults based on existing data:
 * - sizesEnabled is set to true if the sizes array is non-empty, false otherwise
 * - colorsEnabled is set to true if the colors array is non-empty, false otherwise
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
    // Add new boolean columns with default value of true for backward compatibility
    pgm.addColumns('products', {
        sizes_enabled: {
            type: 'boolean',
            notNull: true,
            default: true
        },
        colors_enabled: {
            type: 'boolean',
            notNull: true,
            default: true
        }
    });

    // Set intelligent defaults based on existing array data
    // For sizes: set to true if sizes array is non-empty, false if empty
    pgm.sql(`
        UPDATE products 
        SET sizes_enabled = (
            CASE 
                WHEN sizes IS NOT NULL AND jsonb_array_length(sizes) > 0 THEN true
                ELSE false
            END
        )
    `);

    // For colors: set to true if colors array is non-empty, false if empty
    pgm.sql(`
        UPDATE products 
        SET colors_enabled = (
            CASE 
                WHEN colors IS NOT NULL AND jsonb_array_length(colors) > 0 THEN true
                ELSE false
            END
        )
    `);
};

/**
 * Rollback migration - removes the variant toggle fields
 * 
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
    pgm.dropColumns('products', ['sizes_enabled', 'colors_enabled']);
};
