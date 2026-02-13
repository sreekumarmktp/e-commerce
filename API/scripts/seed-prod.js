const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    console.error('DATABASE_URL environment variable is required for production seeding');
    process.exit(1);
}

const isAws = databaseUrl.includes('amazonaws.com');

const pool = new Pool({
    connectionString: databaseUrl,
    ssl: isAws ? { rejectUnauthorized: false } : false
});

const sampleProducts = [
    {
        id: '1',
        name: 'Handcrafted Banarasi Silk Saree',
        description: 'Exquisite red Banarasi silk saree with intricate golden zari work. A perfect choice for weddings and festive occasions.',
        price: 4500.00,
        image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&h=1200&fit=crop',
        images: [
            'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&h=1200&fit=crop',
            'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&h=1200&fit=crop',
            'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&h=1200&fit=crop'
        ],
        sizes: ['Universal'],
        colors: ['Imperial Red', 'Deep Maroon', 'Gold'],
        category: 'Sarees',
        stock: 15
    },
    {
        id: '2',
        name: 'Designer Silk Saree with Embroidery',
        description: 'Elegant silk saree with beautiful embroidery work and contrast border. Perfect for special occasions and celebrations.',
        price: 5200.00,
        image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&h=1200&fit=crop',
        images: [
            'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&h=1200&fit=crop',
            'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&h=1200&fit=crop',
            'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&h=1200&fit=crop'
        ],
        sizes: ['Universal'],
        colors: ['Royal Blue', 'Emerald Green', 'Purple'],
        category: 'Sarees',
        stock: 12
    },
    {
        id: '3',
        name: 'Embroidered Anarkali Suit',
        description: 'Royal blue Anarkali suit with delicate hand embroidery and a matching dupatta. Crafted from premium georgette for a graceful silhouette.',
        price: 8000.00,
        image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&h=1200&fit=crop',
        images: [
            'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&h=1200&fit=crop',
            'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&h=1200&fit=crop',
            'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&h=1200&fit=crop'
        ],
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['Royal Blue', 'Teal Green', 'Pink'],
        category: 'Anarkali',
        stock: 10
    },
    {
        id: '4',
        name: 'Designer Anarkali with Heavy Work',
        description: 'Stunning designer Anarkali with heavy embroidery and stone work. Perfect for weddings and grand celebrations.',
        price: 12500.00,
        image: 'https://images.unsplash.com/photo-1572804013427-4d7ca7268217?w=800&h=1200&fit=crop',
        images: [
            'https://images.unsplash.com/photo-1572804013427-4d7ca7268217?w=800&h=1200&fit=crop',
            'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&h=1200&fit=crop',
            'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&h=1200&fit=crop'
        ],
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['Maroon', 'Navy Blue', 'Wine Red'],
        category: 'Anarkali',
        stock: 8
    },
    {
        id: '5',
        name: 'Zari Work Designer Lehenga',
        description: 'Stunning designer lehenga with heavy zari and stone work. Ideal for grand celebrations and bridal wear.',
        price: 15500.00,
        image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&h=1200&fit=crop',
        images: [
            'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&h=1200&fit=crop',
            'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&h=1200&fit=crop',
            'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&h=1200&fit=crop'
        ],
        sizes: ['M', 'L', 'XL'],
        colors: ['Emerald Green', 'Fuchsia Pink', 'Red'],
        category: 'Lehenga',
        stock: 5
    },
    {
        id: '6',
        name: 'Bridal Lehenga Choli',
        description: 'Exquisite bridal lehenga with intricate embroidery, sequins, and mirror work. Comes with matching choli and dupatta.',
        price: 22000.00,
        image: 'https://images.unsplash.com/photo-1599305090598-fe179d501227?w=800&h=1200&fit=crop',
        images: [
            'https://images.unsplash.com/photo-1599305090598-fe179d501227?w=800&h=1200&fit=crop',
            'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&h=1200&fit=crop',
            'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&h=1200&fit=crop'
        ],
        sizes: ['S', 'M', 'L'],
        colors: ['Bridal Red', 'Golden', 'Peach'],
        category: 'Lehenga',
        stock: 6
    },
    {
        id: '7',
        name: 'Cotton Silk Block-Print Kurta',
        description: 'Comfortable and stylish cotton silk kurta with traditional Rajasthani block prints. Perfect for daily ethnic wear.',
        price: 2200.00,
        image: 'https://images.unsplash.com/photo-1609709295948-17d77cb2a69b?w=800&h=1200&fit=crop',
        images: [
            'https://images.unsplash.com/photo-1609709295948-17d77cb2a69b?w=800&h=1200&fit=crop',
            'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&h=1200&fit=crop',
            'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&h=1200&fit=crop'
        ],
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        colors: ['Mustard Yellow', 'Indigo Blue', 'Terracotta Red'],
        category: 'Kurtas',
        stock: 40
    },
    {
        id: '8',
        name: 'Designer Embroidered Kurta Set',
        description: 'Premium designer kurta with elegant embroidery work. Comes with matching palazzo pants and dupatta.',
        price: 3800.00,
        image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&h=1200&fit=crop',
        images: [
            'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&h=1200&fit=crop',
            'https://images.unsplash.com/photo-1609709295948-17d77cb2a69b?w=800&h=1200&fit=crop',
            'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&h=1200&fit=crop'
        ],
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['White', 'Cream', 'Pastel Pink'],
        category: 'Kurtas',
        stock: 25
    },
    {
        id: '9',
        name: 'Punjabi Salwar Suit',
        description: 'Traditional Punjabi salwar suit with beautiful embroidery and mirror work. Comfortable and stylish for everyday wear.',
        price: 3500.00,
        image: 'https://images.unsplash.com/photo-1572804013427-4d7ca7268217?w=800&h=1200&fit=crop',
        images: [
            'https://images.unsplash.com/photo-1572804013427-4d7ca7268217?w=800&h=1200&fit=crop',
            'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&h=1200&fit=crop',
            'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&h=1200&fit=crop'
        ],
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['Pink', 'Yellow', 'Green'],
        category: 'Salwar',
        stock: 18
    },
    {
        id: '10',
        name: 'Designer Salwar Kameez',
        description: 'Elegant designer salwar kameez with intricate thread work and sequins. Perfect for parties and special occasions.',
        price: 5500.00,
        image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&h=1200&fit=crop',
        images: [
            'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&h=1200&fit=crop',
            'https://images.unsplash.com/photo-1572804013427-4d7ca7268217?w=800&h=1200&fit=crop',
            'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&h=1200&fit=crop'
        ],
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['Turquoise', 'Coral', 'Lavender'],
        category: 'Salwar',
        stock: 15
    }
];

async function seed() {
    try {
        console.log('Seeding production database...');

        // Seed default cart
        await pool.query(`
      INSERT INTO cart (id, totalAmount, itemCount, createdAt, updatedAt)
      VALUES ($1, $2, $3, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `, ['default-cart', 0, 0]);
        console.log('Default cart seeded.');

        // Seed admin user
        const adminEmail = 'sreekumaronit@gmail.com';
        const hashedPassword = await bcrypt.hash('Admin@123', 10);
        await pool.query(`
            INSERT INTO users (id, email, password_hash, role, created_at, updated_at)
            VALUES ($1, $2, $3, $4, NOW(), NOW())
            ON CONFLICT (email) DO UPDATE SET
                password_hash = EXCLUDED.password_hash,
                role = EXCLUDED.role,
                updated_at = NOW()
        `, [uuidv4(), adminEmail, hashedPassword, 'admin']);
        console.log('Admin user seeded.');

        // Seed products
        for (const product of sampleProducts) {
            await pool.query(`
        INSERT INTO products (id, name, description, price, image, images, sizes, colors, category, stock, createdAt, updatedAt)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          price = EXCLUDED.price,
          image = EXCLUDED.image,
          images = EXCLUDED.images,
          sizes = EXCLUDED.sizes,
          colors = EXCLUDED.colors,
          category = EXCLUDED.category,
          stock = EXCLUDED.stock,
          updatedAt = NOW()
      `, [
                product.id,
                product.name,
                product.description,
                product.price,
                product.image,
                JSON.stringify(product.images),
                JSON.stringify(product.sizes),
                JSON.stringify(product.colors),
                product.category,
                product.stock
            ]);
        }
        console.log('Sample products seeded.');

        console.log('Production database seeding completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding production database:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

seed();
