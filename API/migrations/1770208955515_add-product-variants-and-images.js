/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
    pgm.addColumns('products', {
        images: { type: 'jsonb', default: '[]' },
        sizes: { type: 'jsonb', default: '[]' },
        colors: { type: 'jsonb', default: '[]' },
    });
};

exports.down = (pgm) => {
    pgm.dropColumns('products', ['images', 'sizes', 'colors']);
};
