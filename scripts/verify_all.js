// scripts/verify_all.js
// Script kiểm thử tự động toàn diện hệ thống Shop Hai1110#
const http = require('http');
const fs = require('fs');
const crypto = require('crypto');

const BASE_URL = 'http://127.0.0.1:4000';
const ADMIN_KEY = 'hai1110';

let botToken = '9236400431:AAF7xHRnNVHWQhpuF944EsCkBKPi-e82d0A';
try {
  const envContent = fs.readFileSync('.env', 'utf-8');
  const match = envContent.match(/BOT_TOKEN=([^\r\n]+)/);
  if (match) botToken = match[1].trim();
} catch {}

function createMockTelegramInitData(user) {
  const authDate = Math.floor(Date.now() / 1000);
  const userStr = JSON.stringify(user);
  const params = {
    auth_date: String(authDate),
    query_id: 'AAHdF6IQAAAAAN0XohD9w7u1',
    user: userStr
  };
  const dataCheckString = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const hash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  return new URLSearchParams({ ...params, hash }).toString();
}

const testTgUser = {
  id: 6632274262,
  first_name: 'Hoàng Hải',
  username: 'hai1110',
  photo_url: 'https://t.me/i/userpic/320/hai1110.jpg'
};
const validTgInitData = createMockTelegramInitData(testTgUser);

let testPassed = 0;
let testFailed = 0;

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqHeaders = {
      'Content-Type': 'application/json',
      'x-admin-key': ADMIN_KEY,
      ...headers
    };

    const postData = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;
    if (postData) {
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(url, {
      method: method.toUpperCase(),
      headers: reqHeaders
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch { json = data; }
        resolve({ status: res.statusCode, data: json, headers: res.headers });
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function test(name, fn) {
  process.stdout.write(`⏳ [TEST] ${name} ... `);
  try {
    await fn();
    testPassed++;
    console.log(`✅ ĐẠT`);
  } catch (err) {
    testFailed++;
    console.log(`❌ THẤT BẠI: ${err.message}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

async function run() {
  console.log('====================================================');
  console.log('🚀 BẮT ĐẦU KIỂM THỬ TOÀN DIỆN HỆ THỐNG SHOP HAI1110#');
  console.log('====================================================\n');

  // 1. Health Check
  await test('1. Health Check & Server Status', async () => {
    const res = await request('GET', '/api/health');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.ok === true, 'Health ok: true missing');
    assert(typeof res.data.botActive === 'boolean', 'botActive status missing');
  });

  // 2. Overview KPIs
  await test('2. Admin Overview Dashboard KPIs', async () => {
    const res = await request('GET', '/api/admin/overview');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.users !== undefined, 'KPI users missing');
    assert(res.data.orders !== undefined, 'KPI orders missing');
    assert(res.data.revenue !== undefined, 'KPI revenue missing');
  });

  // 3. Category CRUD
  let createdCatId = '';
  const testCatSlug = `test-cat-${Date.now()}`;
  await test('3.1 Create Category (POST /api/admin/categories)', async () => {
    const res = await request('POST', '/api/admin/categories', {
      name: 'Danh Mục Test QA',
      slug: testCatSlug,
      description: 'Mô tả danh mục test tự động',
      imageUrl: '/icons/star.svg',
      sortOrder: 99
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.id, 'Category id missing');
    createdCatId = res.data.id;
  });

  await test('3.2 Read Categories (GET /api/categories & GET /api/admin/categories)', async () => {
    const resPublic = await request('GET', '/api/categories');
    assert(resPublic.status === 200, `Public categories expected 200, got ${resPublic.status}`);
    assert(Array.isArray(resPublic.data), 'Public categories must be array');

    const resAdmin = await request('GET', '/api/admin/categories');
    assert(resAdmin.status === 200, `Admin categories expected 200, got ${resAdmin.status}`);
    assert(resAdmin.data.some(c => c.id === createdCatId), 'Created category not in admin list');
  });

  await test('3.3 Update Category (PUT /api/admin/categories/:id)', async () => {
    const res = await request('PUT', `/api/admin/categories/${createdCatId}`, {
      name: 'Danh Mục Test QA Đã Cập Nhật'
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.name === 'Danh Mục Test QA Đã Cập Nhật', 'Category name not updated');
  });

  // 4. Product & Stock CRUD
  let createdProdId = '';
  await test('4.1 Create Product with Initial Stock (POST /api/admin/products)', async () => {
    const res = await request('POST', '/api/admin/products', {
      name: 'Sản Phẩm Test QA 2026',
      categoryId: createdCatId,
      price: 50000,
      salePrice: 45000,
      description: 'Mô tả sản phẩm test kiểm thử QA',
      imageUrl: 'https://img.icons8.com/color/480/star.png',
      stockItemsText: 'KEY_TEST_001\nKEY_TEST_002\nKEY_TEST_003'
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.id, 'Product id missing');
    createdProdId = res.data.id;
  });

  await test('4.2 Add Bulk Stock Keys (POST /api/admin/products/:id/stock)', async () => {
    const res = await request('POST', `/api/admin/products/${createdProdId}/stock`, {
      text: 'KEY_TEST_004\nKEY_TEST_005'
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.imported === 2, `Expected 2 imported keys, got ${res.data.imported}`);
  });

  await test('4.3 Read Stock Keys (GET /api/admin/products/:id/keys)', async () => {
    const res = await request('GET', `/api/admin/products/${createdProdId}/keys`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(Array.isArray(res.data), 'Keys must be array');
    assert(res.data.length >= 5, `Expected at least 5 keys, got ${res.data.length}`);
  });

  await test('4.4 Update Product (PUT /api/admin/products/:id)', async () => {
    const res = await request('PUT', `/api/admin/products/${createdProdId}`, {
      name: 'Sản Phẩm Test QA 2026 (Updated)',
      price: 60000
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.name === 'Sản Phẩm Test QA 2026 (Updated)', 'Product name not updated');
    assert(res.data.price === 60000, 'Product price not updated');
  });

  // 5. User Management & Balances
  let targetUserId = '';
  await test('5.1 Read Users List (GET /api/admin/users)', async () => {
    const res = await request('GET', '/api/admin/users');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(Array.isArray(res.data), 'Users must be an array');
    assert(res.data.length > 0, 'No users found in database');
    targetUserId = res.data[0].id;
  });

  await test('5.2 Adjust Balance ADD (POST /api/admin/users/:id/balance)', async () => {
    const res = await request('POST', `/api/admin/users/${targetUserId}/balance`, {
      amount: 50000,
      type: 'ADD',
      note: 'Test cộng tiền tự động'
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.user.balance !== undefined, 'User balance missing');
  });

  await test('5.3 Adjust Balance SUBTRACT (POST /api/admin/users/:id/balance)', async () => {
    const res = await request('POST', `/api/admin/users/${targetUserId}/balance`, {
      amount: 10000,
      type: 'SUBTRACT',
      note: 'Test trừ tiền tự động'
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await test('5.4 Toggle Block User (POST /api/admin/users/:id/toggle-block)', async () => {
    const blockRes = await request('POST', `/api/admin/users/${targetUserId}/toggle-block`);
    assert(blockRes.status === 200, `Expected 200, got ${blockRes.status}`);
    // Unlock again
    const unblockRes = await request('POST', `/api/admin/users/${targetUserId}/toggle-block`);
    assert(unblockRes.status === 200, `Expected 200, got ${unblockRes.status}`);
  });

  // 6. Orders & Fulfillments
  let createdOrderId = '';
  await test('6.1 Create Manual Order (POST /api/admin/orders)', async () => {
    const res = await request('POST', '/api/admin/orders', {
      userId: targetUserId,
      productId: createdProdId,
      quantity: 1,
      total: 45000,
      status: 'DELIVERED'
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.order && res.data.order.id, 'Order id missing');
    createdOrderId = res.data.order.id;
  });

  await test('6.2 Read Orders List (GET /api/admin/orders)', async () => {
    const res = await request('GET', '/api/admin/orders');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(Array.isArray(res.data), 'Orders must be array');
    assert(res.data.some(o => o.id === createdOrderId), 'Created order not in list');
  });

  await test('6.3 Order Refund Process (POST /api/admin/orders/:id/refund)', async () => {
    const res = await request('POST', `/api/admin/orders/${createdOrderId}/refund`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.order.status === 'REFUNDED', 'Order status must be REFUNDED');
  });

  // 7. Webhook & Payment Verification
  await test('7.1 Bank Transfer Webhook Processing (POST /api/webhooks/test-bank-transfer)', async () => {
    const testCode = `NAPTEST${Date.now()}`;
    const res = await request('POST', '/api/webhooks/test-bank-transfer', {
      content: testCode,
      amount: 50000
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.success === true, 'Webhook did not succeed');
  });

  // 8. Mini App Dino Store APIs & Telegram Auto Login
  await test('8.0 Telegram Access Guard (Blocked outside Telegram without initData)', async () => {
    const res = await request('GET', '/miniapp/api/bootstrap');
    assert(res.status === 401, `Expected 401, got ${res.status}`);
    assert(res.data.error === 'TELEGRAM_REQUIRED', 'Expected TELEGRAM_REQUIRED');
  });

  await test('8.1 Mini App Bootstrap with Verified Telegram initData (GET /miniapp/api/bootstrap)', async () => {
    const res = await request('GET', '/miniapp/api/bootstrap', null, {
      'x-telegram-init-data': validTgInitData
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.ok === true, 'Bootstrap ok: true missing');
    assert(res.data.profile, 'Bootstrap profile missing');
    assert(res.data.profile.id === '6632274262', 'Telegram ID not synced');
    assert(Array.isArray(res.data.products), 'Bootstrap products must be array');
    assert(Array.isArray(res.data.categories), 'Bootstrap categories must be array');
    assert(res.data.payment_methods, 'Bootstrap payment_methods missing');
  });

  await test('8.2 Mini App Topup VietQR Generation (POST /miniapp/api/topup)', async () => {
    const res = await request('POST', '/miniapp/api/topup', {
      amount: 100000,
      payment_method: 'bank'
    }, {
      'x-telegram-init-data': validTgInitData
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.ok === true, 'Topup ok: true missing');
    assert(res.data.invoice, 'Topup invoice missing');
    assert(res.data.invoice.qr_url.includes('vietqr'), 'VietQR URL missing');
    assert(res.data.invoice.order_code, 'Order code missing');
  });

  await test('8.3 Mini App Balance Checkout (POST /miniapp/api/checkout/balance)', async () => {
    const uRes = await request('GET', '/miniapp/api/bootstrap', null, {
      'x-telegram-init-data': validTgInitData
    });
    const uId = uRes.data.profile.id;
    const dbUser = (await request('GET', '/api/admin/users')).data.find(u => u.telegramId === String(uId));
    if (dbUser) {
      await request('POST', `/api/admin/users/${dbUser.id}/balance`, {
        amount: 200000,
        type: 'ADD',
        note: 'Nạp tiền để test checkout balance'
      });
    }

    const res = await request('POST', '/miniapp/api/checkout/balance', {
      product_id: createdProdId,
      quantity: 1
    }, {
      'x-telegram-init-data': validTgInitData
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.ok === true, 'Checkout balance ok: true missing');
    assert(res.data.order_code, 'Order code missing');
    assert(Array.isArray(res.data.keys), 'Delivered keys missing');
    assert(res.data.keys.length === 1, 'Expected 1 delivered key');
  });

  await test('8.4 Mini App Lucky Wheel Spin (POST /miniapp/api/wheel/spin)', async () => {
    const res = await request('POST', '/miniapp/api/wheel/spin', {}, {
      'x-telegram-init-data': validTgInitData
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.ok === true, 'Wheel spin ok: true missing');
    assert(res.data.reward !== undefined, 'Reward missing');
  });

  await test('8.5 Mini App Social Buff Order (POST /miniapp/api/social/orders)', async () => {
    const res = await request('POST', '/miniapp/api/social/orders', {
      service_id: 'tiktok_like',
      target: 'https://tiktok.com/@testuser/video/123456789',
      quantity: 100,
      notes: 'Test buff order'
    }, {
      'x-telegram-init-data': validTgInitData
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.ok === true, 'Social order ok: true missing');
    assert(res.data.order_id, 'Social order_id missing');
  });

  await test('8.6 Mini App Netflix TV Pairing (POST /miniapp/api/netflix/pair-tv)', async () => {
    const res = await request('POST', '/miniapp/api/netflix/pair-tv', {
      tv_code: '889922'
    }, {
      'x-telegram-init-data': validTgInitData
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.ok === true, 'Netflix pair ok: true missing');
  });

  // 9. Partner API V2
  await test('9.1 Partner API V2 Status & Catalog (GET /api/v2/status & GET /api/v2/catalog)', async () => {
    const sRes = await request('GET', '/api/v2/status');
    assert(sRes.status === 200, `Expected 200, got ${sRes.status}`);
    assert(sRes.data.ok === true, 'Status ok: true missing');

    const cRes = await request('GET', '/api/v2/catalog');
    assert(cRes.status === 200, `Expected 200, got ${cRes.status}`);
    assert(cRes.data.ok === true, 'Catalog ok: true missing');
    assert(Array.isArray(cRes.data.products), 'Products must be array');
  });

  // 10. Bot Settings & Management
  await test('10.1 Bot Settings GET & POST (GET/POST /api/admin/settings)', async () => {
    const getRes = await request('GET', '/api/admin/settings');
    assert(getRes.status === 200, `Expected 200, got ${getRes.status}`);

    const postRes = await request('POST', '/api/admin/settings', {
      announcement: 'Hệ thống Shop Hai1110# hoạt động 24/7!'
    });
    assert(postRes.status === 200, `Expected 200, got ${postRes.status}`);
    assert(postRes.data.settings.announcement.includes('Shop Hai1110#'), 'Settings announcement not saved');
  });

  await test('10.2 Bot Polling Status (GET /api/admin/bot/status)', async () => {
    const res = await request('GET', '/api/admin/bot/status');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.ok === true, 'Bot status ok: true missing');
    assert(res.data.isPolling === true, 'Bot isPolling must be true');
  });

  // 11. Advanced Modules: Coupons, Announcements, Stock Export, Realtime
  let createdCouponId = '';
  await test('11.1 Create & Read Coupon (POST/GET /api/admin/coupons)', async () => {
    const code = `QA${Date.now()}`;
    const createRes = await request('POST', '/api/admin/coupons', {
      code,
      discountPct: 15,
      maxUses: 50,
      minSpend: 50000
    });
    assert(createRes.status === 200, `Expected 200, got ${createRes.status}`);
    assert(createRes.data.code === code, 'Coupon code mismatch');
    createdCouponId = createRes.data.id;

    const listRes = await request('GET', '/api/admin/coupons');
    assert(listRes.status === 200, `Expected 200, got ${listRes.status}`);
    assert(listRes.data.some(c => c.id === createdCouponId), 'Created coupon not in list');
  });

  await test('11.2 Apply Coupon Calculation (POST /api/coupons/apply)', async () => {
    const coupon = (await request('GET', '/api/admin/coupons')).data.find(c => c.id === createdCouponId);
    assert(coupon, 'Coupon not found');
    const applyRes = await request('POST', '/api/coupons/apply', {
      code: coupon.code,
      amount: 100000
    });
    assert(applyRes.status === 200, `Expected 200, got ${applyRes.status}`);
    assert(applyRes.data.ok === true, 'Coupon apply ok: true missing');
    assert(applyRes.data.discount === 15000, `Expected 15000 discount, got ${applyRes.data.discount}`);
    assert(applyRes.data.finalAmount === 85000, `Expected 85000 final, got ${applyRes.data.finalAmount}`);
  });

  let createdAnnId = '';
  await test('11.3 Create & Read Announcement (POST/GET /api/admin/announcements & /api/announcements)', async () => {
    const annRes = await request('POST', '/api/admin/announcements', {
      title: 'Khuyến mãi đặc biệt mừng Cyber Store',
      content: 'Giảm 20% toàn bộ đơn hàng',
      type: 'promo'
    });
    assert(annRes.status === 200, `Expected 200, got ${annRes.status}`);
    createdAnnId = annRes.data.id;

    const pubRes = await request('GET', '/api/announcements');
    assert(pubRes.status === 200, `Expected 200, got ${pubRes.status}`);
    assert(pubRes.data.some(a => a.id === createdAnnId), 'Created announcement not in public list');
  });

  await test('11.4 Export Stock Plaintext (GET /api/admin/products/:id/export-stock)', async () => {
    const res = await request('GET', `/api/admin/products/${createdProdId}/export-stock`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(typeof res.data === 'string', 'Expected string content for exported stock');
  });

  await test('11.5 Realtime Stream Connection (GET /api/realtime/stream)', async () => {
    const res = await new Promise((resolve, reject) => {
      const req = http.get(`${BASE_URL}/api/realtime/stream`, res => {
        let chunk = '';
        res.on('data', d => {
          chunk += d.toString();
          req.destroy();
          resolve({ status: res.statusCode, data: chunk });
        });
      });
      req.on('error', err => {
        if (err.message.includes('destroyed')) return;
        reject(err);
      });
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.includes('CONNECTED'), 'Expected SSE CONNECTED event');
  });

  // Cleanup test artifacts
  await test('Cleanup: Delete Test Artifacts', async () => {
    if (createdProdId) {
      await request('DELETE', `/api/admin/products/${createdProdId}`);
    }
    if (createdCatId) {
      await request('DELETE', `/api/admin/categories/${createdCatId}`);
    }
    if (createdCouponId) {
      await request('DELETE', `/api/admin/coupons/${createdCouponId}`);
    }
    if (createdAnnId) {
      await request('DELETE', `/api/admin/announcements/${createdAnnId}`);
    }
  });

  console.log('\n====================================================');
  console.log(`🎉 HOÀN THÀNH KIỂM THỬ: ${testPassed} ĐẠT / ${testFailed} THẤT BẠI`);
  console.log('====================================================');

  if (testFailed > 0) {
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Lỗi nghiêm trọng khi chạy kiểm thử:', err);
  process.exit(1);
});
