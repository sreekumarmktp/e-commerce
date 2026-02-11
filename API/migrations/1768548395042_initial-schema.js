/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
    // Products table
    pgm.createTable('products', {
        id: { type: 'varchar(50)', primaryKey: true },
        name: { type: 'varchar(255)', notNull: true },
        description: { type: 'text' },
        price: { type: 'decimal(10, 2)', notNull: true },
        image: { type: 'text' },
        category: { type: 'varchar(100)' },
        stock: { type: 'integer', default: 0 },
        createdat: { type: 'timestamp', notNull: true, default: pgm.func('NOW()') },
        updatedat: { type: 'timestamp', notNull: true, default: pgm.func('NOW()') },
    });
    pgm.createIndex('products', 'category');

    // Cart table
    pgm.createTable('cart', {
        id: { type: 'varchar(50)', primaryKey: true },
        totalamount: { type: 'decimal(10, 2)', default: 0 },
        itemcount: { type: 'integer', default: 0 },
        createdat: { type: 'timestamp', notNull: true, default: pgm.func('NOW()') },
        updatedat: { type: 'timestamp', notNull: true, default: pgm.func('NOW()') },
    });

    // Cart Items table
    pgm.createTable('cart_items', {
        id: { type: 'varchar(50)', primaryKey: true },
        cartid: {
            type: 'varchar(50)',
            notNull: true,
            references: 'cart',
            onDelete: 'CASCADE',
        },
        productid: {
            type: 'varchar(50)',
            notNull: true,
            references: 'products',
            onDelete: 'RESTRICT',
        },
        productname: { type: 'varchar(255)', notNull: true },
        productimage: { type: 'text' },
        price: { type: 'decimal(10, 2)', notNull: true },
        quantity: { type: 'integer', notNull: true },
        totalprice: { type: 'decimal(10, 2)', notNull: true },
    });
    pgm.createIndex('cart_items', 'cartid');
    pgm.createIndex('cart_items', ['cartid', 'productid']);
};

exports.down = pgm => {
    pgm.dropTable('cart_items');
    pgm.dropTable('cart');
    pgm.dropTable('products');
};
