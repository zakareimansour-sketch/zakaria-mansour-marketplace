import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import sharp from 'sharp';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createDatabase } from '../server/database.js';
import { createApp } from '../server/app.js';
import { clearRateLimitsForTests } from '../server/rate-limit.js';

let db, app, ownerToken, customerToken, storagePath;
const owner = { name:'Zakaria Mansour', email:'zakareimansour@gmail.com', password:'SecurePass123' };

beforeEach(async () => {
  clearRateLimitsForTests();
  db=createDatabase(':memory:');
  storagePath=mkdtempSync(join(tmpdir(),'zm-marketplace-test-'));
  app=createApp({db,jwtSecret:'test-secret-that-is-long-enough',setupToken:'setup-test',storagePath});
  let res=await request(app).post('/api/setup/owner').set('x-setup-token','setup-test').send(owner);
  ownerToken=res.body.token;
  res=await request(app).post('/api/auth/register').send({name:'Test Customer',email:'customer@example.com',password:'Customer123',preferredLanguage:'ar'});
  customerToken=res.body.token;
});
afterEach(()=>{db.close();rmSync(storagePath,{recursive:true,force:true});});

describe('ZM Marketplace API',()=>{
  it('creates one owner only and protects setup',async()=>{
    const status=await request(app).get('/api/setup/status'); assert.equal(status.body.ownerConfigured,true);
    const duplicate=await request(app).post('/api/setup/owner').set('x-setup-token','setup-test').send({...owner,email:'other@example.com'}); assert.equal(duplicate.status,409);
  });
  it('registers, logs in, and returns safe profile',async()=>{
    const login=await request(app).post('/api/auth/login').send({email:'customer@example.com',password:'Customer123'}); assert.equal(login.status,200); assert.ok(login.body.token); assert.equal(login.body.user.password_hash,undefined);
    const me=await request(app).get('/api/me').set('authorization',`Bearer ${login.body.token}`); assert.equal(me.status,200); assert.equal(me.body.user.role,'customer');
  });
  it('rejects weak passwords and duplicate emails',async()=>{
    const weak=await request(app).post('/api/auth/register').send({name:'Weak',email:'weak@example.com',password:'123'}); assert.equal(weak.status,400);
    const duplicate=await request(app).post('/api/auth/register').send({name:'Again',email:'CUSTOMER@example.com',password:'Customer123'}); assert.equal(duplicate.status,409);
  });
  it('runs seller approval and product moderation workflow',async()=>{
    let res=await request(app).post('/api/seller/applications').set('authorization',`Bearer ${customerToken}`).send({storeName:'Digital Studio',description:'A professional digital products and services studio.'}); assert.equal(res.status,201); const applicationId=res.body.id;
    res=await request(app).patch(`/api/admin/seller-applications/${applicationId}`).set('authorization',`Bearer ${ownerToken}`).send({decision:'approved',note:'Approved'}); assert.equal(res.status,200);
    res=await request(app).post('/api/auth/login').send({email:'customer@example.com',password:'Customer123'}); const sellerToken=res.body.token; assert.equal(res.body.user.role,'seller');
    res=await request(app).post('/api/seller/products').set('authorization',`Bearer ${sellerToken}`).send({categoryId:1,titleAr:'حزمة رقمية احترافية',titleEn:'Professional Digital Bundle',descriptionAr:'مجموعة ملفات رقمية احترافية جاهزة للاستخدام في المشروعات.',descriptionEn:'A professional collection of ready-to-use digital files for projects.',productType:'digital',priceCents:2400,currency:'usd',submitForReview:true}); assert.equal(res.status,201); const productId=res.body.id; assert.equal(res.body.status,'pending_review');
    let list=await request(app).get('/api/products'); assert.equal(list.body.products.length,0);
    res=await request(app).post(`/api/seller/products/${productId}/digital-files`).set('authorization',`Bearer ${sellerToken}`).attach('file',Buffer.from('bundle,data\n'),{filename:'bundle.csv',contentType:'text/csv'}); assert.equal(res.status,201);
    res=await request(app).patch(`/api/admin/products/${productId}/review`).set('authorization',`Bearer ${ownerToken}`).send({decision:'published',note:''}); assert.equal(res.status,200);
    list=await request(app).get('/api/products?lang=ar'); assert.equal(list.body.products.length,1); assert.equal(list.body.products[0].title,'حزمة رقمية احترافية');
    const ownProducts=await request(app).get('/api/seller/products').set('authorization',`Bearer ${sellerToken}`); assert.equal(ownProducts.status,200); assert.equal(ownProducts.body.products.length,1);
    const application=await request(app).get('/api/seller/application').set('authorization',`Bearer ${sellerToken}`); assert.equal(application.body.application.status,'approved');
    const overview=await request(app).get('/api/admin/overview').set('authorization',`Bearer ${ownerToken}`); assert.equal(overview.status,200); assert.equal(overview.body.overview.sellers,1); assert.equal(overview.body.overview.publishedProducts,1);
  });
  it('lets the owner publish directly and upload protected product assets',async()=>{
    let res=await request(app).post('/api/seller/products').set('authorization',`Bearer ${ownerToken}`).send({categoryId:1,titleAr:'شيت إدارة حسابات',titleEn:'Accounting Management Sheet',descriptionAr:'شيت احترافي لإدارة الحسابات والعمليات المالية بصورة منظمة وواضحة.',descriptionEn:'A professional spreadsheet for structured accounting and financial operations management.',productType:'digital',priceCents:3000,currency:'usd',submitForReview:false,publishNow:true});
    assert.equal(res.status,201); assert.equal(res.body.status,'draft'); assert.equal(res.body.fileRequiredBeforePublish,true); const productId=res.body.id;
    const image=await sharp({create:{width:40,height:40,channels:3,background:'#d6a752'}}).png().toBuffer();
    res=await request(app).post(`/api/seller/products/${productId}/images`).set('authorization',`Bearer ${ownerToken}`).attach('image',image,{filename:'cover.png',contentType:'image/png'}); assert.equal(res.status,201); assert.match(res.body.media.url,/\.webp$/);
    res=await request(app).post(`/api/seller/products/${productId}/digital-files`).set('authorization',`Bearer ${ownerToken}`).field('version','1.0').attach('file',Buffer.from('account,date,debit,credit\n'),{filename:'accounts.csv',contentType:'text/csv'}); assert.equal(res.status,201); assert.equal(res.body.file.originalName,'accounts.csv');
    res=await request(app).post(`/api/seller/products/${productId}/publish`).set('authorization',`Bearer ${ownerToken}`); assert.equal(res.status,200); assert.equal(res.body.status,'published');
    const assets=await request(app).get(`/api/seller/products/${productId}/assets`).set('authorization',`Bearer ${ownerToken}`); assert.equal(assets.status,200); assert.equal(assets.body.images.length,1); assert.equal(assets.body.files.length,1);
    const publicProducts=await request(app).get('/api/products?lang=ar'); assert.equal(publicProducts.body.products[0].title,'شيت إدارة حسابات'); assert.match(publicProducts.body.products[0].image_url,/\/media\/products\//);
  });
  it('creates a cart and converts it into a pending order',async()=>{
    let res=await request(app).post('/api/seller/products').set('authorization',`Bearer ${ownerToken}`).send({categoryId:1,titleAr:'منتج رقمي للاختبار',titleEn:'Digital Test Product',descriptionAr:'وصف احترافي كافٍ للمنتج الرقمي المستخدم في اختبار السلة والطلب.',descriptionEn:'A sufficiently detailed professional description for the cart and order test.',productType:'digital',priceCents:2500,currency:'usd',submitForReview:true});
    assert.equal(res.status,201); const productId=res.body.id;
    res=await request(app).post(`/api/seller/products/${productId}/digital-files`).set('authorization',`Bearer ${ownerToken}`).attach('file',Buffer.from('item,amount\nTest,25\n'),{filename:'product.csv',contentType:'text/csv'}); assert.equal(res.status,201);
    res=await request(app).patch(`/api/admin/products/${productId}/review`).set('authorization',`Bearer ${ownerToken}`).send({decision:'published',note:''}); assert.equal(res.status,200);
    res=await request(app).post('/api/cart/items').set('authorization',`Bearer ${customerToken}`).send({productId,quantity:3}); assert.equal(res.status,201); assert.equal(res.body.cart.count,1); assert.equal(res.body.cart.subtotalCents,2500);
    res=await request(app).get('/api/cart').set('authorization',`Bearer ${customerToken}`); assert.equal(res.body.cart.items.length,1);
    res=await request(app).post('/api/orders').set('authorization',`Bearer ${customerToken}`).send({paymentMethod:'pending'}); assert.equal(res.status,201); assert.match(res.body.order.order_number,/^ZM-/); assert.equal(res.body.order.status,'pending_payment'); const orderId=res.body.order.id;
    const cart=await request(app).get('/api/cart').set('authorization',`Bearer ${customerToken}`); assert.equal(cart.body.cart.count,0);
    const orders=await request(app).get('/api/orders').set('authorization',`Bearer ${customerToken}`); assert.equal(orders.body.orders.length,1);
    let library=await request(app).get('/api/library').set('authorization',`Bearer ${customerToken}`); assert.equal(library.body.items.length,0);
    res=await request(app).patch(`/api/admin/orders/${orderId}/status`).set('authorization',`Bearer ${ownerToken}`).send({status:'paid'}); assert.equal(res.status,200);
    library=await request(app).get('/api/library').set('authorization',`Bearer ${customerToken}`); assert.equal(library.body.items.length,1); const grantId=library.body.items[0].grant_id;
    res=await request(app).post(`/api/library/${grantId}/link`).set('authorization',`Bearer ${customerToken}`); assert.equal(res.status,200); assert.equal(res.body.expiresInSeconds,300);
    const token=new URL(`http://test${res.body.url}`).searchParams.get('token');
    const download=await request(app).get('/api/downloads/file').query({token}); assert.equal(download.status,200); assert.match(download.headers['content-disposition'],/product\.csv/);
    library=await request(app).get('/api/library').set('authorization',`Bearer ${customerToken}`); assert.equal(library.body.items[0].download_count,1);
    res=await request(app).patch(`/api/admin/orders/${orderId}/status`).set('authorization',`Bearer ${ownerToken}`).send({status:'refunded'}); assert.equal(res.status,200);
    library=await request(app).get('/api/library').set('authorization',`Bearer ${customerToken}`); assert.equal(library.body.items.length,0);
    const revokedDownload=await request(app).get('/api/downloads/file').query({token}); assert.equal(revokedDownload.status,403);
    res=await request(app).patch(`/api/admin/orders/${orderId}/status`).set('authorization',`Bearer ${ownerToken}`).send({status:'paid'}); assert.equal(res.status,409);
  });
  it('protects cookie sessions with CSRF and limits login attempts',async()=>{
    const agent=request.agent(app);
    let res=await agent.post('/api/auth/register').send({name:'Cookie User',email:'cookie@example.com',password:'CookiePass123',preferredLanguage:'ar'}); assert.equal(res.status,201);
    const csrfCookie=res.headers['set-cookie'].find(value=>value.startsWith('zm_csrf='));
    const csrf=decodeURIComponent(csrfCookie.split(';')[0].split('=').slice(1).join('='));
    res=await agent.post('/api/seller/applications').send({storeName:'Cookie Store',description:'A valid seller application description for csrf testing.'}); assert.equal(res.status,403); assert.equal(res.body.error,'CSRF_REJECTED');
    res=await agent.post('/api/seller/applications').set('x-csrf-token',csrf).send({storeName:'Cookie Store',description:'A valid seller application description for csrf testing.'}); assert.equal(res.status,201);
    for(let i=0;i<10;i++) await request(app).post('/api/auth/login').send({email:'none@example.com',password:'WrongPass1'});
    res=await request(app).post('/api/auth/login').send({email:'none@example.com',password:'WrongPass1'}); assert.equal(res.status,429);
  });
  it('blocks customers from seller and admin operations',async()=>{
    const product=await request(app).post('/api/seller/products').set('authorization',`Bearer ${customerToken}`).send({}); assert.equal(product.status,403);
    const admin=await request(app).get('/api/admin/products/review').set('authorization',`Bearer ${customerToken}`); assert.equal(admin.status,403);
  });
});
