import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export function createDatabase(filename = 'data/marketplace.sqlite') {
  if (filename !== ':memory:') mkdirSync(dirname(filename), { recursive: true });
  const db = new Database(filename);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer' CHECK(role IN ('owner','admin','moderator','support','finance','seller','customer')),
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','suspended','pending')),
      preferred_language TEXT NOT NULL DEFAULT 'ar',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS seller_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      store_name TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
      review_note TEXT,
      reviewed_by INTEGER REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      reviewed_at TEXT
    );
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      name_ar TEXT NOT NULL,
      name_en TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('digital','software','creative','service','course','physical')),
      is_active INTEGER NOT NULL DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      seller_id INTEGER NOT NULL REFERENCES users(id),
      category_id INTEGER NOT NULL REFERENCES categories(id),
      title_ar TEXT NOT NULL,
      title_en TEXT NOT NULL,
      description_ar TEXT NOT NULL,
      description_en TEXT NOT NULL,
      product_type TEXT NOT NULL CHECK(product_type IN ('digital','software','creative','service','course','physical')),
      price_cents INTEGER NOT NULL CHECK(price_cents >= 0),
      currency TEXT NOT NULL DEFAULT 'USD',
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','pending_review','published','rejected','archived')),
      review_note TEXT,
      reviewed_by INTEGER REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS product_media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      kind TEXT NOT NULL DEFAULT 'image' CHECK(kind IN ('image','preview')),
      storage_path TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      alt_ar TEXT,
      alt_en TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS digital_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      storage_path TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      version TEXT NOT NULL DEFAULT '1.0',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS download_grants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_item_id INTEGER NOT NULL UNIQUE REFERENCES order_items(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id),
      max_downloads INTEGER NOT NULL DEFAULT 5,
      download_count INTEGER NOT NULL DEFAULT 0,
      expires_at TEXT,
      revoked_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS download_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      grant_id INTEGER NOT NULL REFERENCES download_grants(id) ON DELETE CASCADE,
      file_id INTEGER NOT NULL REFERENCES digital_files(id),
      ip_address TEXT,
      user_agent TEXT,
      downloaded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS carts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS cart_items (
      cart_id INTEGER NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      quantity INTEGER NOT NULL DEFAULT 1 CHECK(quantity > 0),
      PRIMARY KEY(cart_id, product_id)
    );
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT NOT NULL UNIQUE,
      user_id INTEGER NOT NULL REFERENCES users(id),
      status TEXT NOT NULL DEFAULT 'pending_payment' CHECK(status IN ('pending_payment','paid','processing','completed','cancelled','refunded')),
      currency TEXT NOT NULL,
      subtotal_cents INTEGER NOT NULL CHECK(subtotal_cents >= 0),
      discount_cents INTEGER NOT NULL DEFAULT 0 CHECK(discount_cents >= 0),
      total_cents INTEGER NOT NULL CHECK(total_cents >= 0),
      payment_method TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id),
      seller_id INTEGER NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      unit_price_cents INTEGER NOT NULL CHECK(unit_price_cents >= 0),
      quantity INTEGER NOT NULL CHECK(quantity > 0),
      product_type TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_id INTEGER REFERENCES users(id),
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id INTEGER,
      metadata TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
    CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id);
    CREATE INDEX IF NOT EXISTS idx_product_media_product ON product_media(product_id);
    CREATE INDEX IF NOT EXISTS idx_digital_files_product ON digital_files(product_id);
    CREATE INDEX IF NOT EXISTS idx_download_grants_user ON download_grants(user_id);
    CREATE INDEX IF NOT EXISTS idx_download_log_grant ON download_log(grant_id);
    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_log(actor_id);
  `);

  const grantColumns = db.pragma('table_info(download_grants)').map(column => column.name);
  if (!grantColumns.includes('revoked_at')) db.exec('ALTER TABLE download_grants ADD COLUMN revoked_at TEXT');

  const categories = [
    ['digital-products','منتجات رقمية','Digital Products','digital'],
    ['software','برمجيات','Software','software'],
    ['creative','تصميم وإبداع','Creative','creative'],
    ['services','خدمات احترافية','Professional Services','service'],
    ['courses','كورسات','Courses','course'],
    ['physical','منتجات مختارة','Selected Products','physical']
  ];
  const insert = db.prepare('INSERT OR IGNORE INTO categories(slug,name_ar,name_en,type) VALUES(?,?,?,?)');
  const seed = db.transaction(() => categories.forEach(row => insert.run(...row)));
  seed();
  return db;
}

export function publicUser(row) {
  if (!row) return null;
  const { password_hash, ...safe } = row;
  return safe;
}
