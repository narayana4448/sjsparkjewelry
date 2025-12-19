const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'jewelry_admin',
  password: process.env.DB_PASSWORD || 'jewelry_secret_123',
  database: process.env.DB_NAME || 'jewelry_inventory',
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mime = allowedTypes.test(file.mimetype);
    if (ext && mime) {
      cb(null, true);
    } else {
      cb(new Error('Only images (jpeg, jpg, png, webp) are allowed'));
    }
  },
});

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Initialize database tables
async function initializeDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        original_price DECIMAL(10, 2) NOT NULL,
        selling_price DECIMAL(10, 2) NOT NULL,
        cost_price DECIMAL(10, 2) DEFAULT 0,
        discount_percentage DECIMAL(5, 2) DEFAULT 0,
        quantity INTEGER DEFAULT 0,
        sold_quantity INTEGER DEFAULT 0,
        sku VARCHAR(100) UNIQUE,
        status VARCHAR(50) DEFAULT 'available',
        images TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Add columns if they don't exist (for existing databases)
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='discount_percentage') THEN
          ALTER TABLE products ADD COLUMN discount_percentage DECIMAL(5, 2) DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='cost_price') THEN
          ALTER TABLE products ADD COLUMN cost_price DECIMAL(10, 2) DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales' AND column_name='cost_price') THEN
          ALTER TABLE sales ADD COLUMN cost_price DECIMAL(10, 2) DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales' AND column_name='profit') THEN
          ALTER TABLE sales ADD COLUMN profit DECIMAL(10, 2) DEFAULT 0;
        END IF;
      END $$;

      CREATE TABLE IF NOT EXISTS sales (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
        product_name VARCHAR(255),
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10, 2) NOT NULL,
        total_price DECIMAL(10, 2) NOT NULL,
        customer_name VARCHAR(255),
        customer_phone VARCHAR(50),
        notes TEXT,
        sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(255) UNIQUE NOT NULL,
        value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Check if admin exists, if not create default
    const adminCheck = await client.query('SELECT * FROM admin_users LIMIT 1');
    if (adminCheck.rows.length === 0) {
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
      await client.query(
        'INSERT INTO admin_users (email, password, name) VALUES ($1, $2, $3)',
        [process.env.ADMIN_EMAIL || 'admin@jewelry.com', hashedPassword, 'Admin']
      );
      console.log('Default admin user created');
    }

    // Insert default settings
    const defaultSettings = [
      ['business_name', process.env.BUSINESS_NAME || 'SJ Spark Jewel'],
      ['whatsapp_number', process.env.WHATSAPP_NUMBER || '+91XXXXXXXXXX'],
      ['phone_number', process.env.PHONE_NUMBER || '+91XXXXXXXXXX'],
      ['business_address', process.env.BUSINESS_ADDRESS || 'Your Address Here'],
    ];

    for (const [key, value] of defaultSettings) {
      await client.query(
        `INSERT INTO settings (key, value) VALUES ($1, $2)
         ON CONFLICT (key) DO NOTHING`,
        [key, value]
      );
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  } finally {
    client.release();
  }
}

// ============ AUTH ROUTES ============

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query('SELECT * FROM admin_users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name FROM admin_users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ============ CATEGORY ROUTES ============

app.get('/api/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/categories', authenticateToken, async (req, res) => {
  try {
    const { name, description } = req.body;
    const result = await pool.query(
      'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *',
      [name, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/categories/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const result = await pool.query(
      'UPDATE categories SET name = $1, description = $2 WHERE id = $3 RETURNING *',
      [name, description, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/categories/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM categories WHERE id = $1', [id]);
    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ============ PRODUCT ROUTES ============

// Public - Get all products (for customers)
app.get('/api/products', async (req, res) => {
  try {
    const { category, status, search } = req.query;
    let query = `
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (category) {
      query += ` AND p.category_id = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (status) {
      query += ` AND p.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (search) {
      query += ` AND (p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ' ORDER BY p.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single product
app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT p.*, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin - Create product
app.post('/api/products', authenticateToken, upload.array('images', 5), async (req, res) => {
  try {
    const { name, description, category_id, original_price, selling_price, cost_price, discount_percentage, quantity, sku } = req.body;
    const images = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];

    // Calculate selling price from discount if provided
    let finalSellingPrice = selling_price;
    if (discount_percentage && parseFloat(discount_percentage) > 0) {
      finalSellingPrice = original_price * (1 - parseFloat(discount_percentage) / 100);
    }

    const result = await pool.query(
      `INSERT INTO products (name, description, category_id, original_price, selling_price, cost_price, discount_percentage, quantity, sku, images)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [name, description, category_id || null, original_price, finalSellingPrice, cost_price || 0, discount_percentage || 0, quantity || 0, sku, images]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin - Update product
app.put('/api/products/:id', authenticateToken, upload.array('images', 5), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category_id, original_price, selling_price, cost_price, discount_percentage, quantity, sku, status, existing_images } = req.body;

    let images = [];
    if (existing_images) {
      images = JSON.parse(existing_images);
    }
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(f => `/uploads/${f.filename}`);
      images = [...images, ...newImages];
    }

    // Calculate selling price from discount if provided
    let finalSellingPrice = selling_price;
    if (discount_percentage && parseFloat(discount_percentage) > 0) {
      finalSellingPrice = original_price * (1 - parseFloat(discount_percentage) / 100);
    }

    const result = await pool.query(
      `UPDATE products
       SET name = $1, description = $2, category_id = $3, original_price = $4,
           selling_price = $5, cost_price = $6, discount_percentage = $7, quantity = $8,
           sku = $9, status = $10, images = $11, updated_at = CURRENT_TIMESTAMP
       WHERE id = $12 RETURNING *`,
      [name, description, category_id || null, original_price, finalSellingPrice, cost_price || 0, discount_percentage || 0, quantity, sku, status || 'available', images, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin - Delete product
app.delete('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Get product images to delete
    const product = await pool.query('SELECT images FROM products WHERE id = $1', [id]);
    if (product.rows.length > 0 && product.rows[0].images) {
      for (const img of product.rows[0].images) {
        const imgPath = path.join(__dirname, img);
        if (fs.existsSync(imgPath)) {
          fs.unlinkSync(imgPath);
        }
      }
    }

    await pool.query('DELETE FROM products WHERE id = $1', [id]);
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ============ SALES ROUTES ============

// Admin - Get all sales
app.get('/api/sales', authenticateToken, async (req, res) => {
  try {
    const { from, to } = req.query;
    let query = 'SELECT * FROM sales WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (from) {
      query += ` AND sale_date >= $${paramIndex}`;
      params.push(from);
      paramIndex++;
    }

    if (to) {
      query += ` AND sale_date <= $${paramIndex}`;
      params.push(to);
      paramIndex++;
    }

    query += ' ORDER BY sale_date DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin - Record a sale
app.post('/api/sales', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { product_id, quantity, customer_name, customer_phone, notes } = req.body;

    // Get product details
    const productResult = await client.query('SELECT * FROM products WHERE id = $1', [product_id]);
    if (productResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = productResult.rows[0];

    if (product.quantity < quantity) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    const total_price = product.selling_price * quantity;
    const total_cost = (product.cost_price || 0) * quantity;
    const profit = total_price - total_cost;

    // Record sale with cost and profit
    const saleResult = await client.query(
      `INSERT INTO sales (product_id, product_name, quantity, unit_price, total_price, cost_price, profit, customer_name, customer_phone, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [product_id, product.name, quantity, product.selling_price, total_price, total_cost, profit, customer_name, customer_phone, notes]
    );

    // Update product quantity
    await client.query(
      `UPDATE products
       SET quantity = quantity - $1, sold_quantity = sold_quantity + $1,
           status = CASE WHEN quantity - $1 <= 0 THEN 'sold_out' ELSE status END
       WHERE id = $2`,
      [quantity, product_id]
    );

    await client.query('COMMIT');
    res.status(201).json(saleResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error recording sale:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// ============ DASHBOARD/STATS ROUTES ============

app.get('/api/stats', authenticateToken, async (req, res) => {
  try {
    const stats = {};

    // Total products
    const productsCount = await pool.query('SELECT COUNT(*) FROM products');
    stats.totalProducts = parseInt(productsCount.rows[0].count);

    // Total available stock
    const stockCount = await pool.query('SELECT SUM(quantity) FROM products');
    stats.totalStock = parseInt(stockCount.rows[0].sum) || 0;

    // Total sold
    const soldCount = await pool.query('SELECT SUM(sold_quantity) FROM products');
    stats.totalSold = parseInt(soldCount.rows[0].sum) || 0;

    // Total revenue
    const revenue = await pool.query('SELECT SUM(total_price) FROM sales');
    stats.totalRevenue = parseFloat(revenue.rows[0].sum) || 0;

    // Total profit
    const profitResult = await pool.query('SELECT SUM(profit) FROM sales');
    stats.totalProfit = parseFloat(profitResult.rows[0].sum) || 0;

    // Total cost
    const costResult = await pool.query('SELECT SUM(cost_price) FROM sales');
    stats.totalCost = parseFloat(costResult.rows[0].sum) || 0;

    // Today's sales
    const todaySales = await pool.query(
      `SELECT SUM(total_price) as revenue, SUM(profit) as profit FROM sales WHERE DATE(sale_date) = CURRENT_DATE`
    );
    stats.todayRevenue = parseFloat(todaySales.rows[0].revenue) || 0;
    stats.todayProfit = parseFloat(todaySales.rows[0].profit) || 0;

    // Low stock products (quantity <= 5)
    const lowStock = await pool.query('SELECT COUNT(*) FROM products WHERE quantity <= 5 AND quantity > 0');
    stats.lowStockCount = parseInt(lowStock.rows[0].count);

    // Recent sales (last 5)
    const recentSales = await pool.query('SELECT * FROM sales ORDER BY sale_date DESC LIMIT 5');
    stats.recentSales = recentSales.rows;

    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============ SETTINGS ROUTES ============

app.get('/api/settings', async (req, res) => {
  try {
    const result = await pool.query('SELECT key, value FROM settings');
    const settings = {};
    result.rows.forEach(row => {
      settings[row.key] = row.value;
    });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/settings', authenticateToken, async (req, res) => {
  try {
    const settings = req.body;
    for (const [key, value] of Object.entries(settings)) {
      await pool.query(
        `INSERT INTO settings (key, value, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP`,
        [key, value]
      );
    }
    res.json({ message: 'Settings updated' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
async function start() {
  await initializeDatabase();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start();
