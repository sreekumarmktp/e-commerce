/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
    // Users table
    pgm.createTable('users', {
        id: { type: 'varchar(50)', primaryKey: true },
        email: { type: 'varchar(255)', notNull: true, unique: true },
        password_hash: { type: 'varchar(255)', notNull: true },
        role: { type: 'varchar(50)', notNull: true, default: 'customer' }, // 'admin', 'customer'
        created_at: { type: 'timestamp', notNull: true, default: pgm.func('NOW()') },
        updated_at: { type: 'timestamp', notNull: true, default: pgm.func('NOW()') },
    });
    
    // Orders table
    pgm.createTable('orders', {
        id: { type: 'varchar(50)', primaryKey: true },
        user_id: { type: 'varchar(50)', references: 'users', onDelete: 'SET NULL' },
        total_amount: { type: 'decimal(10, 2)', notNull: true },
        status: { type: 'varchar(50)', notNull: true, default: 'pending' }, // pending, paid, shipped, cancelled
        created_at: { type: 'timestamp', notNull: true, default: pgm.func('NOW()') },
        updated_at: { type: 'timestamp', notNull: true, default: pgm.func('NOW()') },
    });

    // Order Items table
    pgm.createTable('order_items', {
        id: { type: 'varchar(50)', primaryKey: true },
        order_id: { type: 'varchar(50)', notNull: true, references: 'orders', onDelete: 'CASCADE' },
        product_id: { type: 'varchar(50)', references: 'products', onDelete: 'SET NULL' },
        quantity: { type: 'integer', notNull: true },
        price: { type: 'decimal(10, 2)', notNull: true }, // Price at the time of purchase
    });
    
    pgm.createIndex('orders', 'user_id');
    pgm.createIndex('order_items', 'order_id');
};

exports.down = pgm => {
    pgm.dropTable('order_items');
    pgm.dropTable('orders');
    pgm.dropTable('users');
};
