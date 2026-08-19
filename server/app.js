import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { mkdirSync, unlinkSync, renameSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import multer from 'multer';
import sharp from 'sharp';
import { fileTypeFromFile } from 'file-type';
import { z } from 'zod';
import { publicUser } from './database.js';
import { createSecurity } from './security.js';
import { audit } from './audit.js';
import { rateLimit } from './rate-limit.js';

const email = z.string().trim().email().max(200).transform(v => v.toLowerCase());
const password = z.string().min(8).max(100).regex(/[A-Za-z]/, 'Password needs a letter').regex(/[0-9]/, 'Password needs a number');
const cleanText = (min, max) => z.string().trim().min(min).max(max);

function validate(schema, value, res) {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    res.status(400).json({ error: 'VALIDATION_ERROR', message: 'البيانات المدخلة غير صحيحة.', fields: parsed.error.flatten().fieldErrors });
    return null;
  }
  return parsed.data;
}

export function createApp({ db, jwtSecret, setupToken, storagePath, allowedOrigins = ['http://localhost:5173'], isProduction = false, exposeTokens = !isProduction }) {
  const app = express();
  const security = createSecurity(jwtSecret);
  const storageRoot = resolve(storagePath || process.env.STORAGE_PATH || 'data/storage');
  const imageDirectory = resolve(storageRoot, 'product-images');
  const digitalDirectory = resolve(storageRoot, 'digital-private');
  const temporaryDirectory = resolve(storageRoot, 'temporary');
  [imageDirectory, digitalDirectory, temporaryDirectory].forEach(path => mkdirSync(path, { recursive: true }));
  const upload = multer({ dest: temporaryDirectory, limits: { fileSize: 200 * 1024 * 1024, files: 1 } });
  const canManageProduct = (user, product) => user && product && (['owner','admin'].includes(user.role) || Number(product.seller_id) === Number(user.id));
  const issueSession = (res, user) => {
    const token = security.sign(user);
    const csrfToken = randomBytes(24).toString('base64url');
    const baseCookie = { secure: isProduction, sameSite: 'lax', path: '/', maxAge: 7 * 24 * 60 * 60 * 1000 };
    res.cookie('zm_session', token, { ...baseCookie, httpOnly: true });
    res.cookie('zm_csrf', csrfToken, { ...baseCookie, httpOnly: false });
    return exposeTokens ? token : undefined;
  };
  const sessionPayload = (res, user) => {
    const token = issueSession(res, user);
    return token ? { user: publicUser(user), token } : { user: publicUser(user) };
  };
  app.disable('x-powered-by');
  if (isProduction) app.set('trust proxy', 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({ origin(origin, callback) { if (!origin || allowedOrigins.includes(origin)) return callback(null, true); callback(new Error('Origin not allowed')); }, credentials: true }));
  app.use(cookieParser());
  app.use(express.json({ limit: '200kb' }));
  app.use((req, res, next) => {
    if (!['POST','PUT','PATCH','DELETE'].includes(req.method) || !req.cookies?.zm_session || req.headers.authorization?.startsWith('Bearer ')) return next();
    if (!req.cookies.zm_csrf || req.headers['x-csrf-token'] !== req.cookies.zm_csrf) return res.status(403).json({ error:'CSRF_REJECTED', message:'فشل التحقق الأمني من الطلب.' });
    next();
  });
  app.use('/api/auth/login', rateLimit({ windowMs:15*60*1000,max:10,keyPrefix:'login',message:'محاولات دخول كثيرة. حاول بعد 15 دقيقة.' }));
  app.use('/api/auth/register', rateLimit({ windowMs:60*60*1000,max:8,keyPrefix:'register' }));
  app.use('/api/setup/owner', rateLimit({ windowMs:60*60*1000,max:5,keyPrefix:'owner-setup' }));
  app.use('/api/seller/products', rateLimit({ windowMs:60*1000,max:60,keyPrefix:'seller-write' }));
  app.use('/api/library', rateLimit({ windowMs:60*1000,max:30,keyPrefix:'library' }));
  app.use('/api/downloads', rateLimit({ windowMs:60*1000,max:20,keyPrefix:'download' }));
  app.use('/media/products', express.static(imageDirectory, { maxAge: '7d', immutable: true, fallthrough: false }));

  app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'ZM Marketplace API', time: new Date().toISOString() }));
  app.get('/api/setup/status', (_req, res) => {
    const owner = db.prepare("SELECT id FROM users WHERE role='owner' LIMIT 1").get();
    res.json({ ownerConfigured: Boolean(owner) });
  });

  app.post('/api/setup/owner', async (req, res) => {
    if (db.prepare("SELECT id FROM users WHERE role='owner' LIMIT 1").get()) return res.status(409).json({ error: 'OWNER_EXISTS', message: 'تم إعداد حساب المالك بالفعل.' });
    if (!setupToken || req.headers['x-setup-token'] !== setupToken) return res.status(403).json({ error: 'INVALID_SETUP_TOKEN', message: 'رمز الإعداد غير صحيح.' });
    const data = validate(z.object({ name: cleanText(2, 100), email, password }), req.body, res);
    if (!data) return;
    const hash = await bcrypt.hash(data.password, 12);
    try {
      const result = db.prepare("INSERT INTO users(name,email,password_hash,role) VALUES(?,?,?,'owner')").run(data.name, data.email, hash);
      const user = db.prepare('SELECT * FROM users WHERE id=?').get(result.lastInsertRowid);
      audit(db, user.id, 'owner.setup', 'user', user.id);
      res.status(201).json(sessionPayload(res, user));
    } catch (error) {
      if (String(error.code).includes('CONSTRAINT_UNIQUE')) return res.status(409).json({ error: 'EMAIL_EXISTS', message: 'البريد مستخدم بالفعل.' });
      throw error;
    }
  });

  app.post('/api/auth/register', async (req, res) => {
    const data = validate(z.object({ name: cleanText(2, 100), email, password, preferredLanguage: z.enum(['ar','en']).default('ar') }), req.body, res);
    if (!data) return;
    const hash = await bcrypt.hash(data.password, 12);
    try {
      const result = db.prepare('INSERT INTO users(name,email,password_hash,preferred_language) VALUES(?,?,?,?)').run(data.name, data.email, hash, data.preferredLanguage);
      const user = db.prepare('SELECT * FROM users WHERE id=?').get(result.lastInsertRowid);
      audit(db, user.id, 'user.register', 'user', user.id);
      res.status(201).json(sessionPayload(res, user));
    } catch (error) {
      if (String(error.code).includes('CONSTRAINT_UNIQUE')) return res.status(409).json({ error: 'EMAIL_EXISTS', message: 'البريد مستخدم بالفعل.' });
      throw error;
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const data = validate(z.object({ email, password: z.string().min(1).max(100) }), req.body, res);
    if (!data) return;
    const user = db.prepare('SELECT * FROM users WHERE email=?').get(data.email);
    if (!user || !(await bcrypt.compare(data.password, user.password_hash))) return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'البريد أو كلمة المرور غير صحيحة.' });
    if (user.status !== 'active') return res.status(403).json({ error: 'ACCOUNT_BLOCKED', message: 'الحساب غير متاح حاليًا.' });
    audit(db, user.id, 'user.login', 'user', user.id);
    res.json(sessionPayload(res, user));
  });

  app.post('/api/auth/logout', security.authenticate, (req, res) => {
    audit(db, Number(req.auth.sub), 'user.logout', 'user', Number(req.auth.sub));
    res.clearCookie('zm_session', { path:'/' });
    res.clearCookie('zm_csrf', { path:'/' });
    res.json({ ok:true });
  });

  app.get('/api/me', security.authenticate, (req, res) => {
    const user = db.prepare('SELECT * FROM users WHERE id=?').get(Number(req.auth.sub));
    if (!user) return res.status(404).json({ error: 'USER_NOT_FOUND' });
    res.json({ user: publicUser(user) });
  });

  app.get('/api/categories', (_req, res) => res.json({ categories: db.prepare('SELECT * FROM categories WHERE is_active=1 ORDER BY id').all() }));
  app.get('/api/products', (req, res) => {
    const language = req.query.lang === 'en' ? 'en' : 'ar';
    const query = cleanText(0, 100).safeParse(req.query.q || '').data || '';
    const like = `%${query}%`;
    const rows = db.prepare(`SELECT p.id,p.product_type,p.price_cents,p.currency,p.created_at,
      CASE WHEN ?='en' THEN p.title_en ELSE p.title_ar END title,
      CASE WHEN ?='en' THEN p.description_en ELSE p.description_ar END description,
      c.slug category_slug,u.name seller_name,
      (SELECT '/media/products/' || pm.storage_path FROM product_media pm WHERE pm.product_id=p.id AND pm.kind='image' ORDER BY pm.sort_order,pm.id LIMIT 1) image_url
      FROM products p JOIN categories c ON c.id=p.category_id JOIN users u ON u.id=p.seller_id
      WHERE p.status='published' AND (p.title_ar LIKE ? OR p.title_en LIKE ? OR p.description_ar LIKE ? OR p.description_en LIKE ?)
      ORDER BY p.created_at DESC LIMIT 100`).all(language, language, like, like, like, like);
    res.json({ products: rows });
  });

  app.get('/api/products/:id', (req, res) => {
    const language = req.query.lang === 'en' ? 'en' : 'ar';
    const product = db.prepare(`SELECT p.id,p.product_type,p.price_cents,p.currency,p.created_at,
      CASE WHEN ?='en' THEN p.title_en ELSE p.title_ar END title,
      CASE WHEN ?='en' THEN p.description_en ELSE p.description_ar END description,
      c.slug category_slug, CASE WHEN ?='en' THEN c.name_en ELSE c.name_ar END category_name,
      u.id seller_id,u.name seller_name,
      (SELECT '/media/products/' || pm.storage_path FROM product_media pm WHERE pm.product_id=p.id AND pm.kind='image' ORDER BY pm.sort_order,pm.id LIMIT 1) image_url
      FROM products p JOIN categories c ON c.id=p.category_id JOIN users u ON u.id=p.seller_id
      WHERE p.id=? AND p.status='published'`).get(language, language, language, Number(req.params.id));
    if (!product) return res.status(404).json({ error: 'PRODUCT_NOT_FOUND', message: 'المنتج غير موجود أو غير منشور.' });
    res.json({ product });
  });

  const getCart = (userId, language = 'ar') => {
    const cart = db.prepare('SELECT * FROM carts WHERE user_id=?').get(userId);
    if (!cart) return { items: [], count: 0, subtotalCents: 0, currency: null };
    const items = db.prepare(`SELECT p.id product_id,ci.quantity,p.product_type,p.price_cents,p.currency,
      CASE WHEN ?='en' THEN p.title_en ELSE p.title_ar END title,u.name seller_name
      FROM cart_items ci JOIN products p ON p.id=ci.product_id JOIN users u ON u.id=p.seller_id
      WHERE ci.cart_id=? AND p.status='published' ORDER BY p.created_at DESC`).all(language, cart.id);
    return { items, count: items.reduce((sum,item)=>sum+item.quantity,0), subtotalCents: items.reduce((sum,item)=>sum+item.price_cents*item.quantity,0), currency: items[0]?.currency || null };
  };

  app.get('/api/cart', security.authenticate, (req, res) => res.json({ cart: getCart(Number(req.auth.sub), req.query.lang === 'en' ? 'en' : 'ar') }));

  app.post('/api/cart/items', security.authenticate, (req, res) => {
    const data = validate(z.object({ productId: z.number().int().positive(), quantity: z.number().int().min(1).max(99).default(1) }), req.body, res);
    if (!data) return;
    const product = db.prepare("SELECT * FROM products WHERE id=? AND status='published'").get(data.productId);
    if (!product) return res.status(404).json({ error: 'PRODUCT_NOT_FOUND', message: 'المنتج غير متاح.' });
    if (['digital','software','creative','course'].includes(product.product_type) && !db.prepare('SELECT id FROM digital_files WHERE product_id=? AND is_active=1 LIMIT 1').get(product.id)) return res.status(409).json({ error:'DIGITAL_FILE_REQUIRED', message:'هذا المنتج الرقمي غير جاهز للبيع بعد.' });
    const quantity = product.product_type === 'physical' ? data.quantity : 1;
    const userId = Number(req.auth.sub);
    let cart = db.prepare('SELECT * FROM carts WHERE user_id=?').get(userId);
    if (!cart) { const created = db.prepare('INSERT INTO carts(user_id) VALUES(?)').run(userId); cart = { id: created.lastInsertRowid }; }
    const currencies = db.prepare(`SELECT DISTINCT p.currency FROM cart_items ci JOIN products p ON p.id=ci.product_id WHERE ci.cart_id=?`).all(cart.id);
    if (currencies.length && !currencies.some(row=>row.currency===product.currency)) return res.status(409).json({ error: 'MIXED_CURRENCY_CART', message: 'لا يمكن جمع منتجات بعملات مختلفة في طلب واحد.' });
    db.prepare(`INSERT INTO cart_items(cart_id,product_id,quantity) VALUES(?,?,?) ON CONFLICT(cart_id,product_id) DO UPDATE SET quantity=excluded.quantity`).run(cart.id, product.id, quantity);
    audit(db, userId, 'cart.item.add', 'product', product.id, { quantity });
    res.status(201).json({ cart: getCart(userId, req.query.lang === 'en' ? 'en' : 'ar') });
  });

  app.patch('/api/cart/items/:productId', security.authenticate, (req, res) => {
    const data = validate(z.object({ quantity: z.number().int().min(1).max(99) }), req.body, res); if (!data) return;
    const userId = Number(req.auth.sub); const cart = db.prepare('SELECT * FROM carts WHERE user_id=?').get(userId);
    if (!cart) return res.status(404).json({ error: 'CART_NOT_FOUND' });
    const product = db.prepare('SELECT product_type FROM products WHERE id=?').get(Number(req.params.productId));
    const quantity = product?.product_type === 'physical' ? data.quantity : 1;
    const result = db.prepare('UPDATE cart_items SET quantity=? WHERE cart_id=? AND product_id=?').run(quantity,cart.id,Number(req.params.productId));
    if (!result.changes) return res.status(404).json({ error: 'CART_ITEM_NOT_FOUND' });
    res.json({ cart: getCart(userId, req.query.lang === 'en' ? 'en' : 'ar') });
  });

  app.delete('/api/cart/items/:productId', security.authenticate, (req, res) => {
    const userId = Number(req.auth.sub); const cart = db.prepare('SELECT * FROM carts WHERE user_id=?').get(userId);
    if (cart) db.prepare('DELETE FROM cart_items WHERE cart_id=? AND product_id=?').run(cart.id,Number(req.params.productId));
    audit(db, userId, 'cart.item.remove', 'product', Number(req.params.productId));
    res.json({ cart: getCart(userId, req.query.lang === 'en' ? 'en' : 'ar') });
  });

  app.post('/api/orders', security.authenticate, (req, res) => {
    const data = validate(z.object({ paymentMethod: z.enum(['pending','cash_on_delivery','bank_transfer']).default('pending') }), req.body || {}, res); if (!data) return;
    const userId = Number(req.auth.sub); const cart = db.prepare('SELECT * FROM carts WHERE user_id=?').get(userId);
    if (!cart) return res.status(400).json({ error: 'EMPTY_CART', message: 'السلة فارغة.' });
    const items = db.prepare(`SELECT p.*,ci.quantity FROM cart_items ci JOIN products p ON p.id=ci.product_id WHERE ci.cart_id=? AND p.status='published'`).all(cart.id);
    if (!items.length) return res.status(400).json({ error: 'EMPTY_CART', message: 'السلة فارغة.' });
    const unavailableDigital = items.find(item => ['digital','software','creative','course'].includes(item.product_type) && !db.prepare('SELECT id FROM digital_files WHERE product_id=? AND is_active=1 LIMIT 1').get(item.id));
    if (unavailableDigital) return res.status(409).json({ error:'DIGITAL_FILE_REQUIRED', message:`المنتج «${unavailableDigital.title_ar}» غير جاهز للتسليم.` });
    const currencies = [...new Set(items.map(item=>item.currency))];
    if (currencies.length !== 1) return res.status(409).json({ error: 'MIXED_CURRENCY_CART' });
    if (data.paymentMethod === 'cash_on_delivery' && items.some(item=>item.product_type !== 'physical')) return res.status(400).json({ error: 'COD_NOT_ALLOWED', message: 'الدفع عند الاستلام متاح للمنتجات المادية فقط.' });
    const subtotal = items.reduce((sum,item)=>sum+item.price_cents*item.quantity,0);
    const orderNumber = `ZM-${new Date().toISOString().slice(0,10).replaceAll('-','')}-${randomBytes(4).toString('hex').toUpperCase()}`;
    const transaction = db.transaction(() => {
      const order = db.prepare('INSERT INTO orders(order_number,user_id,currency,subtotal_cents,total_cents,payment_method) VALUES(?,?,?,?,?,?)').run(orderNumber,userId,currencies[0],subtotal,subtotal,data.paymentMethod);
      const insertItem = db.prepare('INSERT INTO order_items(order_id,product_id,seller_id,title,unit_price_cents,quantity,product_type) VALUES(?,?,?,?,?,?,?)');
      items.forEach(item=>insertItem.run(order.lastInsertRowid,item.id,item.seller_id,item.title_ar,item.price_cents,item.quantity,item.product_type));
      db.prepare('DELETE FROM cart_items WHERE cart_id=?').run(cart.id);
      audit(db,userId,'order.create','order',order.lastInsertRowid,{orderNumber,totalCents:subtotal});
      return order.lastInsertRowid;
    });
    const orderId = transaction();
    res.status(201).json({ order: db.prepare('SELECT * FROM orders WHERE id=?').get(orderId) });
  });

  app.get('/api/orders', security.authenticate, (req, res) => {
    const orders = db.prepare('SELECT * FROM orders WHERE user_id=? ORDER BY created_at DESC').all(Number(req.auth.sub));
    res.json({ orders });
  });

  app.post('/api/seller/applications', security.authenticate, (req, res) => {
    const data = validate(z.object({ storeName: cleanText(2, 100), description: cleanText(20, 1000) }), req.body, res);
    if (!data) return;
    const userId = Number(req.auth.sub);
    const current = db.prepare('SELECT role FROM users WHERE id=?').get(userId);
    if (!current || current.role !== 'customer') return res.status(409).json({ error: 'NOT_ELIGIBLE', message: 'هذا الحساب لا يمكنه تقديم طلب بائع.' });
    try {
      const result = db.prepare('INSERT INTO seller_applications(user_id,store_name,description) VALUES(?,?,?)').run(userId, data.storeName, data.description);
      audit(db, userId, 'seller.application.create', 'seller_application', result.lastInsertRowid);
      res.status(201).json({ id: result.lastInsertRowid, status: 'pending' });
    } catch (error) {
      if (String(error.code).includes('CONSTRAINT_UNIQUE')) return res.status(409).json({ error: 'APPLICATION_EXISTS', message: 'يوجد طلب بائع سابق لهذا الحساب.' });
      throw error;
    }
  });

  app.get('/api/seller/application', security.authenticate, (req, res) => {
    const application = db.prepare('SELECT id,store_name,description,status,review_note,created_at,reviewed_at FROM seller_applications WHERE user_id=?').get(Number(req.auth.sub)) || null;
    res.json({ application });
  });

  app.get('/api/seller/products', security.authenticate, security.allow('seller','owner','admin'), (req, res) => {
    const products = db.prepare(`SELECT p.id,p.title_ar,p.title_en,p.product_type,p.price_cents,p.currency,p.status,p.review_note,p.created_at,c.name_ar category_name
      FROM products p JOIN categories c ON c.id=p.category_id WHERE p.seller_id=? ORDER BY p.created_at DESC`).all(Number(req.auth.sub));
    res.json({ products });
  });

  app.get('/api/admin/overview', security.authenticate, security.allow('owner','admin','moderator','support','finance'), (_req, res) => {
    const one = sql => db.prepare(sql).get().count;
    res.json({ overview: {
      users: one('SELECT COUNT(*) count FROM users'),
      sellers: one("SELECT COUNT(*) count FROM users WHERE role='seller'"),
      pendingSellers: one("SELECT COUNT(*) count FROM seller_applications WHERE status='pending'"),
      publishedProducts: one("SELECT COUNT(*) count FROM products WHERE status='published'"),
      pendingProducts: one("SELECT COUNT(*) count FROM products WHERE status='pending_review'"),
      orders: one('SELECT COUNT(*) count FROM orders'),
      revenueCents: db.prepare("SELECT COALESCE(SUM(total_cents),0) total FROM orders WHERE status IN ('paid','processing','completed')").get().total
    }});
  });

  app.get('/api/admin/orders', security.authenticate, security.allow('owner','admin','support','finance'), (_req, res) => {
    const orders = db.prepare(`SELECT o.*,u.name customer_name,u.email customer_email FROM orders o JOIN users u ON u.id=o.user_id ORDER BY o.created_at DESC LIMIT 200`).all();
    res.json({ orders });
  });

  app.patch('/api/admin/orders/:id/status', security.authenticate, security.allow('owner','admin','finance'), (req, res) => {
    const data = validate(z.object({ status: z.enum(['pending_payment','paid','processing','completed','cancelled','refunded']) }), req.body, res); if (!data) return;
    const order = db.prepare('SELECT * FROM orders WHERE id=?').get(Number(req.params.id));
    if (!order) return res.status(404).json({ error:'ORDER_NOT_FOUND', message:'الطلب غير موجود.' });
    const allowedTransitions = { pending_payment:['paid','cancelled'], paid:['processing','refunded'], processing:['completed','cancelled','refunded'], completed:['refunded'], cancelled:[], refunded:[] };
    if (data.status !== order.status && !allowedTransitions[order.status]?.includes(data.status)) return res.status(409).json({ error:'INVALID_ORDER_TRANSITION', message:`لا يمكن تغيير الطلب من ${order.status} إلى ${data.status}.` });
    if (data.status === order.status) return res.json({ order });
    const transaction = db.transaction(() => {
      db.prepare('UPDATE orders SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(data.status,order.id);
      if (data.status === 'paid') {
        const eligible = db.prepare(`SELECT oi.id order_item_id,oi.product_id,o.user_id FROM order_items oi JOIN orders o ON o.id=oi.order_id
          WHERE oi.order_id=? AND oi.product_type IN ('digital','software','creative','course')
          AND EXISTS(SELECT 1 FROM digital_files df WHERE df.product_id=oi.product_id AND df.is_active=1)`).all(order.id);
        const grant = db.prepare('INSERT OR IGNORE INTO download_grants(order_item_id,user_id,product_id,max_downloads) VALUES(?,?,?,5)');
        eligible.forEach(item=>grant.run(item.order_item_id,item.user_id,item.product_id));
      }
      if (['cancelled','refunded'].includes(data.status)) db.prepare('UPDATE download_grants SET revoked_at=CURRENT_TIMESTAMP WHERE order_item_id IN (SELECT id FROM order_items WHERE order_id=?) AND revoked_at IS NULL').run(order.id);
      audit(db,Number(req.auth.sub),'order.status.update','order',order.id,{from:order.status,to:data.status});
    });
    transaction();
    res.json({ order:db.prepare('SELECT * FROM orders WHERE id=?').get(order.id) });
  });

  app.get('/api/library', security.authenticate, (req, res) => {
    const items = db.prepare(`SELECT g.id grant_id,g.product_id,g.max_downloads,g.download_count,g.expires_at,g.created_at,
      oi.title,o.order_number,o.status order_status,
      (SELECT df.id FROM digital_files df WHERE df.product_id=g.product_id AND df.is_active=1 ORDER BY df.created_at DESC,df.id DESC LIMIT 1) file_id,
      (SELECT df.original_name FROM digital_files df WHERE df.product_id=g.product_id AND df.is_active=1 ORDER BY df.created_at DESC,df.id DESC LIMIT 1) file_name,
      (SELECT df.version FROM digital_files df WHERE df.product_id=g.product_id AND df.is_active=1 ORDER BY df.created_at DESC,df.id DESC LIMIT 1) version,
      (SELECT df.size_bytes FROM digital_files df WHERE df.product_id=g.product_id AND df.is_active=1 ORDER BY df.created_at DESC,df.id DESC LIMIT 1) size_bytes
      FROM download_grants g JOIN order_items oi ON oi.id=g.order_item_id JOIN orders o ON o.id=oi.order_id
      WHERE g.user_id=? AND g.revoked_at IS NULL ORDER BY g.created_at DESC`).all(Number(req.auth.sub));
    res.json({ items });
  });

  app.post('/api/library/:grantId/link', security.authenticate, (req, res) => {
    const grant = db.prepare(`SELECT g.*,(SELECT df.id FROM digital_files df WHERE df.product_id=g.product_id AND df.is_active=1 ORDER BY df.created_at DESC,df.id DESC LIMIT 1) file_id
      FROM download_grants g WHERE g.id=? AND g.user_id=? AND g.revoked_at IS NULL`).get(Number(req.params.grantId),Number(req.auth.sub));
    if (!grant) return res.status(404).json({ error:'GRANT_NOT_FOUND', message:'صلاحية التحميل غير موجودة.' });
    if (!grant.file_id) return res.status(404).json({ error:'FILE_NOT_FOUND', message:'لا يوجد إصدار متاح للتحميل.' });
    if (grant.download_count >= grant.max_downloads) return res.status(429).json({ error:'DOWNLOAD_LIMIT', message:'تم استهلاك عدد مرات التحميل المتاح.' });
    if (grant.expires_at && new Date(grant.expires_at) < new Date()) return res.status(410).json({ error:'GRANT_EXPIRED', message:'انتهت صلاحية التحميل.' });
    const token = security.signDownload({ grantId:grant.id,userId:Number(req.auth.sub),fileId:grant.file_id });
    res.json({ url:`/api/downloads/file?token=${encodeURIComponent(token)}`,expiresInSeconds:300,remainingDownloads:grant.max_downloads-grant.download_count });
  });

  app.get('/api/downloads/file', (req, res) => {
    try {
      const payload = security.verifyDownload(String(req.query.token||''));
      const grant = db.prepare('SELECT * FROM download_grants WHERE id=? AND user_id=?').get(Number(payload.grantId),Number(payload.sub));
      if (!grant || grant.revoked_at) return res.status(403).json({ error:'DOWNLOAD_NOT_ALLOWED' });
      if (grant.expires_at && new Date(grant.expires_at) < new Date()) return res.status(410).json({ error:'GRANT_EXPIRED' });
      const file = db.prepare('SELECT * FROM digital_files WHERE id=? AND product_id=? AND is_active=1').get(Number(payload.fileId),grant.product_id);
      if (!file) return res.status(404).json({ error:'FILE_NOT_FOUND' });
      const transaction = db.transaction(() => {
        const consumed = db.prepare('UPDATE download_grants SET download_count=download_count+1 WHERE id=? AND user_id=? AND revoked_at IS NULL AND download_count < max_downloads').run(grant.id,Number(payload.sub));
        if (consumed.changes !== 1) return false;
        db.prepare('INSERT INTO download_log(grant_id,file_id,ip_address,user_agent) VALUES(?,?,?,?)').run(grant.id,file.id,String(req.ip||'').slice(0,100),String(req.headers['user-agent']||'').slice(0,300));
        audit(db,Number(payload.sub),'digital_file.download','download_grant',grant.id,{fileId:file.id});
        return true;
      });
      if (!transaction()) return res.status(403).json({ error:'DOWNLOAD_LIMIT', message:'تم استهلاك عدد مرات التحميل أو إلغاء الصلاحية.' });
      res.download(resolve(digitalDirectory,file.storage_path),file.original_name);
    } catch { return res.status(401).json({ error:'INVALID_DOWNLOAD_LINK', message:'رابط التحميل غير صالح أو انتهت مدته.' }); }
  });

  app.get('/api/admin/seller-applications', security.authenticate, security.allow('owner','admin','moderator'), (_req, res) => {
    const applications = db.prepare(`SELECT a.*,u.name,u.email FROM seller_applications a JOIN users u ON u.id=a.user_id ORDER BY a.created_at DESC`).all();
    res.json({ applications });
  });

  app.patch('/api/admin/seller-applications/:id', security.authenticate, security.allow('owner','admin'), (req, res) => {
    const data = validate(z.object({ decision: z.enum(['approved','rejected']), note: z.string().trim().max(500).default('') }), req.body, res);
    if (!data) return;
    const id = Number(req.params.id);
    const application = db.prepare("SELECT * FROM seller_applications WHERE id=? AND status='pending'").get(id);
    if (!application) return res.status(404).json({ error: 'APPLICATION_NOT_FOUND' });
    const transaction = db.transaction(() => {
      db.prepare('UPDATE seller_applications SET status=?,review_note=?,reviewed_by=?,reviewed_at=CURRENT_TIMESTAMP WHERE id=?').run(data.decision, data.note, Number(req.auth.sub), id);
      if (data.decision === 'approved') db.prepare("UPDATE users SET role='seller',updated_at=CURRENT_TIMESTAMP WHERE id=?").run(application.user_id);
      audit(db, Number(req.auth.sub), `seller.application.${data.decision}`, 'seller_application', id, { userId: application.user_id });
    });
    transaction();
    res.json({ id, status: data.decision });
  });

  app.post('/api/seller/products', security.authenticate, security.allow('seller','owner','admin'), (req, res) => {
    const schema = z.object({ categoryId: z.number().int().positive(), titleAr: cleanText(2, 160), titleEn: cleanText(2, 160), descriptionAr: cleanText(20, 5000), descriptionEn: cleanText(20, 5000), productType: z.enum(['digital','software','creative','service','course','physical']), priceCents: z.number().int().min(0), currency: z.string().trim().length(3).transform(v=>v.toUpperCase()), submitForReview: z.boolean().default(false), publishNow: z.boolean().default(false) });
    const data = validate(schema, req.body, res); if (!data) return;
    const category = db.prepare('SELECT * FROM categories WHERE id=? AND is_active=1').get(data.categoryId);
    if (!category || category.type !== data.productType) return res.status(400).json({ error: 'CATEGORY_TYPE_MISMATCH', message: 'نوع التصنيف لا يطابق نوع المنتج.' });
    const canPublishDirectly = ['owner','admin'].includes(req.auth.role);
    const requiresFile = ['digital','software','creative','course'].includes(data.productType);
    const status = data.publishNow && canPublishDirectly && !requiresFile ? 'published' : data.submitForReview ? 'pending_review' : 'draft';
    const result = db.prepare(`INSERT INTO products(seller_id,category_id,title_ar,title_en,description_ar,description_en,product_type,price_cents,currency,status) VALUES(?,?,?,?,?,?,?,?,?,?)`)
      .run(Number(req.auth.sub),data.categoryId,data.titleAr,data.titleEn,data.descriptionAr,data.descriptionEn,data.productType,data.priceCents,data.currency,status);
    audit(db, Number(req.auth.sub), 'product.create', 'product', result.lastInsertRowid, { status });
    res.status(201).json({ id: result.lastInsertRowid, status, fileRequiredBeforePublish: requiresFile && status === 'draft' });
  });

  app.post('/api/seller/products/:id/images', security.authenticate, security.allow('seller','owner','admin'), upload.single('image'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'IMAGE_REQUIRED', message: 'اختر صورة أولًا.' });
    try {
      const user = db.prepare('SELECT * FROM users WHERE id=?').get(Number(req.auth.sub));
      const product = db.prepare('SELECT * FROM products WHERE id=?').get(Number(req.params.id));
      if (!canManageProduct(user, product)) return res.status(403).json({ error: 'FORBIDDEN' });
      if (req.file.size > 8 * 1024 * 1024) return res.status(413).json({ error: 'IMAGE_TOO_LARGE', message: 'الحد الأقصى للصورة 8MB.' });
      const type = await fileTypeFromFile(req.file.path);
      if (!type || !['image/jpeg','image/png','image/webp'].includes(type.mime)) return res.status(415).json({ error: 'UNSUPPORTED_IMAGE', message: 'الصور المسموحة JPG وPNG وWEBP.' });
      const count = db.prepare("SELECT COUNT(*) count FROM product_media WHERE product_id=? AND kind='image'").get(product.id).count;
      if (count >= 8) return res.status(409).json({ error: 'IMAGE_LIMIT', message: 'الحد الأقصى 8 صور للمنتج.' });
      const filename = `${product.id}-${randomBytes(12).toString('hex')}.webp`;
      await sharp(req.file.path).rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 84 }).toFile(resolve(imageDirectory, filename));
      const result = db.prepare("INSERT INTO product_media(product_id,kind,storage_path,mime_type,alt_ar,alt_en,sort_order) VALUES(?,'image',?,'image/webp',?,?,?)")
        .run(product.id, filename, String(req.body.altAr||'').slice(0,200), String(req.body.altEn||'').slice(0,200), count);
      audit(db,user.id,'product.image.add','product',product.id,{mediaId:result.lastInsertRowid});
      res.status(201).json({ media: { id: result.lastInsertRowid, url: `/media/products/${filename}`, mimeType:'image/webp' } });
    } finally { try { unlinkSync(req.file.path); } catch {} }
  });

  app.post('/api/seller/products/:id/digital-files', security.authenticate, security.allow('seller','owner','admin'), upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'FILE_REQUIRED', message: 'اختر ملفًا أولًا.' });
    let moved = false;
    try {
      const user = db.prepare('SELECT * FROM users WHERE id=?').get(Number(req.auth.sub));
      const product = db.prepare('SELECT * FROM products WHERE id=?').get(Number(req.params.id));
      if (!canManageProduct(user, product)) return res.status(403).json({ error: 'FORBIDDEN' });
      if (!['digital','software','creative','course'].includes(product.product_type)) return res.status(400).json({ error: 'NOT_DIGITAL_PRODUCT', message: 'لا يمكن إضافة ملف تحميل لهذا النوع.' });
      const extension = extname(req.file.originalname).toLowerCase();
      const allowedExtensions = new Set(['.xlsx','.xls','.csv','.zip','.pdf','.docx','.pptx','.txt']);
      if (!allowedExtensions.has(extension)) return res.status(415).json({ error: 'UNSUPPORTED_FILE', message: 'الصيغ المسموحة: XLSX, XLS, CSV, ZIP, PDF, DOCX, PPTX, TXT.' });
      const detected = await fileTypeFromFile(req.file.path);
      const forbiddenMimes = new Set(['application/x-msdownload','application/x-executable','application/x-dosexec']);
      if (detected && forbiddenMimes.has(detected.mime)) return res.status(415).json({ error: 'DANGEROUS_FILE', message: 'تم رفض الملف لأسباب أمنية.' });
      const filename = `${product.id}-${randomBytes(18).toString('hex')}${extension}`;
      renameSync(req.file.path, resolve(digitalDirectory, filename)); moved = true;
      const version = String(req.body.version||'1.0').trim().slice(0,30) || '1.0';
      const result = db.prepare('INSERT INTO digital_files(product_id,storage_path,original_name,mime_type,size_bytes,version) VALUES(?,?,?,?,?,?)')
        .run(product.id, filename, req.file.originalname.slice(0,255), detected?.mime || req.file.mimetype || 'application/octet-stream', req.file.size, version);
      audit(db,user.id,'product.digital_file.add','product',product.id,{fileId:result.lastInsertRowid,size:req.file.size});
      res.status(201).json({ file: { id:result.lastInsertRowid, originalName:req.file.originalname, sizeBytes:req.file.size, version } });
    } finally { if (!moved) try { unlinkSync(req.file.path); } catch {} }
  });

  app.get('/api/seller/products/:id/assets', security.authenticate, security.allow('seller','owner','admin'), (req, res) => {
    const user = db.prepare('SELECT * FROM users WHERE id=?').get(Number(req.auth.sub));
    const product = db.prepare('SELECT * FROM products WHERE id=?').get(Number(req.params.id));
    if (!canManageProduct(user, product)) return res.status(403).json({ error:'FORBIDDEN' });
    const images = db.prepare("SELECT id,'/media/products/'||storage_path url,alt_ar,alt_en,sort_order FROM product_media WHERE product_id=? ORDER BY sort_order,id").all(product.id);
    const files = db.prepare('SELECT id,original_name,mime_type,size_bytes,version,is_active,created_at FROM digital_files WHERE product_id=? ORDER BY created_at DESC').all(product.id);
    res.json({ images, files });
  });

  app.post('/api/seller/products/:id/publish', security.authenticate, security.allow('seller','owner','admin'), (req, res) => {
    const user = db.prepare('SELECT * FROM users WHERE id=?').get(Number(req.auth.sub));
    const product = db.prepare('SELECT * FROM products WHERE id=?').get(Number(req.params.id));
    if (!canManageProduct(user, product)) return res.status(403).json({ error:'FORBIDDEN' });
    const requiresFile = ['digital','software','creative','course'].includes(product.product_type);
    if (requiresFile && !db.prepare('SELECT id FROM digital_files WHERE product_id=? AND is_active=1 LIMIT 1').get(product.id)) return res.status(409).json({ error:'DIGITAL_FILE_REQUIRED', message:'ارفع ملفًا رقميًا نشطًا قبل النشر.' });
    const status = ['owner','admin'].includes(user.role) ? 'published' : 'pending_review';
    db.prepare('UPDATE products SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(status,product.id);
    audit(db,user.id,status==='published'?'product.published_directly':'product.submitted_for_review','product',product.id);
    res.json({ id:product.id,status });
  });

  app.get('/api/admin/products/review', security.authenticate, security.allow('owner','admin','moderator'), (_req, res) => {
    const products = db.prepare(`SELECT p.*,u.name seller_name,c.name_ar category_name FROM products p JOIN users u ON u.id=p.seller_id JOIN categories c ON c.id=p.category_id WHERE p.status='pending_review' ORDER BY p.created_at`).all();
    res.json({ products });
  });

  app.patch('/api/admin/products/:id/review', security.authenticate, security.allow('owner','admin','moderator'), (req, res) => {
    const data = validate(z.object({ decision: z.enum(['published','rejected']), note: z.string().trim().max(500).default('') }), req.body, res); if (!data) return;
    const product = db.prepare("SELECT * FROM products WHERE id=? AND status='pending_review'").get(Number(req.params.id));
    if (!product) return res.status(404).json({ error: 'PRODUCT_NOT_FOUND' });
    if (data.decision === 'published' && ['digital','software','creative','course'].includes(product.product_type) && !db.prepare('SELECT id FROM digital_files WHERE product_id=? AND is_active=1 LIMIT 1').get(product.id)) return res.status(409).json({ error:'DIGITAL_FILE_REQUIRED', message:'لا يمكن نشر منتج رقمي بدون ملف نشط.' });
    db.prepare('UPDATE products SET status=?,review_note=?,reviewed_by=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(data.decision,data.note,Number(req.auth.sub),product.id);
    audit(db, Number(req.auth.sub), `product.${data.decision}`, 'product', product.id);
    res.json({ id: product.id, status: data.decision });
  });

  app.use((error, _req, res, _next) => {
    console.error(error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'حدث خطأ داخلي غير متوقع.' });
  });
  return app;
}
