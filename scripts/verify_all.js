// scripts/verify_all.js
// Script kiểm thử tự động toàn diện hệ thống Shop Hai1110#
const http = require('http');

const BASE_URL = 'http://127.0.0.1:4000';
const ADMIN_KEY = 'hai1110';

let testPassed = 0;
let testFailed = 0;
const results = [];

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqHeaders = {
      'Content-Type': 'application/json',
      'x-admin-key': ADMIN_KEY,
      ...headers
    };

    const postData = body ? JSON.stringify(body) : null;
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
    results.push({ name, status: 'PASS' });
  } catch (err) {
    testFailed++;
    console.log(`❌ THẤT BẠI: ${err.message}`);
    results.push({ name, status: 'FAIL', error: err.message });
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

async function run() {
  console.log('====================================================');
  console.log('🚀 BẮT ĐẦU KIỂM THỬ TOÀN DIỆN HỆ THỐNG SHOP HAI1110#');
  console.log('====================================================\n');

  // 1. Health check
  await test('1. Health Check & Server Status', async () => {
    const res = await request('GET', '/health');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.ok === true, 'res.data.ok must be true');
    assert(res.data.botActive === true, 'Bot must be active');
  });

  // 2. Admin Overview KPIs
  await test('2. Admin Overview Dashboard KPIs', async () => {
    const res = await request('GET', '/api/admin/overview');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(typeof res.data.users === 'number', 'users count missing');
    assert(typeof res.data.orders === 'number', 'orders count missing');
    assert(typeof res.data.products === 'number', 'products count missing');
    assert(typeof res.data.availableStock === 'number', 'availableStock count missing');
  });

  // 3. Category CRUD
  let createdCatId = null;
  await test('3.1 Create Category (POST /api/admin/categories)', async () => {
    const res = await request('POST', '/api/admin/categories', {
      name: '🧪 Danh Mục Test',
      slug: `test-cat-${Date.now()}`,
      description: 'Mô tả danh mục test kiểm thử',
      sortOrder: 99
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.id, 'Category id missing');
    createdCatId = res.data.id;
  });

  await test('3.2 Read Categories (GET /api/categories & GET /api/admin/categories)', async () => {
    const res = await request('GET', '/api/categories');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(Array.isArray(res.data), 'Expected array of categories');
    assert(res.data.some(c => c.id === createdCatId), 'Created category not found in list');
  });

  await test('3.3 Update Category (PUT /api/admin/categories/:id)', async () => {
    const res = await request('PUT', `/api/admin/categories/${createdCatId}`, {
      name: '🧪 Danh Mục Test (Đã Update)'
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.name === '🧪 Danh Mục Test (Đã Update)', 'Category name was not updated');
  });

  // 4. Product CRUD & Stock Management
  let createdProdId = null;
  await test('4.1 Create Product with Initial Stock (POST /api/admin/products)', async () => {
    const res = await request('POST', '/api/admin/products', {
      categoryId: createdCatId,
      name: 'Test License Key 2026',
      price: 50000,
      salePrice: 40000,
      description: 'License key dùng cho kiểm thử tự động',
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
    assert(res.data.imported === 2, `Expected 2 imported, got ${res.data.imported}`);
  });

  await test('4.3 Read Stock Keys (GET /api/admin/products/:id/keys)', async () => {
    const res = await request('GET', `/api/admin/products/${createdProdId}/keys`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(Array.isArray(res.data), 'Expected array of keys');
    assert(res.data.length === 5, `Expected 5 stock keys, got ${res.data.length}`);
  });

  await test('4.4 Update Product (PUT /api/admin/products/:id)', async () => {
    const res = await request('PUT', `/api/admin/products/${createdProdId}`, {
      price: 60000,
      salePrice: 45000
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.price === 60000, 'Product price not updated');
    assert(res.data.salePrice === 45000, 'Product salePrice not updated');
  });

  // 5. User Management & Balance Adjustment
  let testUserId = null;
  await test('5.1 Read Users List (GET /api/admin/users)', async () => {
    const res = await request('GET', '/api/admin/users');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(Array.isArray(res.data), 'Expected array of users');
    assert(res.data.length > 0, 'No users in database');
    testUserId = res.data[0].id;
  });

  await test('5.2 Adjust Balance ADD (POST /api/admin/users/:id/balance)', async () => {
    const beforeUser = (await request('GET', '/api/admin/users')).data.find(u => u.id === testUserId);
    const beforeBal = beforeUser.balance;

    const res = await request('POST', `/api/admin/users/${testUserId}/balance`, {
      amount: 25000,
      type: 'ADD',
      note: 'Kiểm thử cộng tiền tự động'
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.ok === true, 'Expected ok: true');
    assert(res.data.user.balance === beforeBal + 25000, 'Balance was not incremented correctly');
  });

  await test('5.3 Adjust Balance SUBTRACT (POST /api/admin/users/:id/balance)', async () => {
    const beforeUser = (await request('GET', '/api/admin/users')).data.find(u => u.id === testUserId);
    const beforeBal = beforeUser.balance;

    const res = await request('POST', `/api/admin/users/${testUserId}/balance`, {
      amount: 10000,
      type: 'SUBTRACT',
      note: 'Kiểm thử trừ tiền tự động'
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.ok === true, 'Expected ok: true');
    assert(res.data.user.balance === beforeBal - 10000, 'Balance was not decremented correctly');
  });

  await test('5.4 Toggle Block User (POST /api/admin/users/:id/toggle-block)', async () => {
    const res1 = await request('POST', `/api/admin/users/${testUserId}/toggle-block`);
    assert(res1.status === 200, `Expected 200, got ${res1.status}`);
    const isBlocked = res1.data.isBlocked;

    // Toggle back
    const res2 = await request('POST', `/api/admin/users/${testUserId}/toggle-block`);
    assert(res2.status === 200, `Expected 200, got ${res2.status}`);
    assert(res2.data.isBlocked === !isBlocked, 'User block status not reverted');
  });

  // 6. Orders Management & Refunds
  let testOrderId = null;
  await test('6.1 Create Manual Order (POST /api/admin/orders)', async () => {
    const res = await request('POST', '/api/admin/orders', {
      telegramId: 'test_tele_qa_123',
      productId: createdProdId,
      status: 'DELIVERED'
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.ok === true, 'Order creation failed');
    assert(res.data.order && res.data.order.id, 'Order id missing');
    assert(res.data.order.items[0].delivered, 'Auto stock delivery missing');
    testOrderId = res.data.order.id;
  });

  await test('6.2 Read Orders List (GET /api/admin/orders)', async () => {
    const res = await request('GET', '/api/admin/orders');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(Array.isArray(res.data), 'Expected array of orders');
    assert(res.data.some(o => o.id === testOrderId), 'Created order not found in list');
  });

  await test('6.3 Order Refund Process (POST /api/admin/orders/:id/refund)', async () => {
    const res = await request('POST', `/api/admin/orders/${testOrderId}/refund`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.ok === true, 'Refund failed');
  });

  // 7. VietQR Webhook & Idempotency
  await test('7.1 Bank Transfer Webhook Processing (POST /api/webhooks/test-bank-transfer)', async () => {
    const testCode = `NAPTEST${Date.now()}`;
    const res = await request('POST', '/api/webhooks/test-bank-transfer', {
      content: testCode,
      amount: 50000
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.success === true, 'Webhook did not succeed');
  });

  // 8. Mini App Dino Store APIs
  await test('8.1 Mini App Bootstrap (GET /miniapp/api/bootstrap)', async () => {
    const res = await request('GET', '/miniapp/api/bootstrap');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.ok === true, 'Bootstrap ok: true missing');
    assert(res.data.profile, 'Bootstrap profile missing');
    assert(Array.isArray(res.data.products), 'Bootstrap products must be array');
    assert(Array.isArray(res.data.categories), 'Bootstrap categories must be array');
    assert(res.data.payment_methods, 'Bootstrap payment_methods missing');
    assert(res.data.wheel, 'Bootstrap wheel missing');
  });

  await test('8.2 Mini App Topup VietQR Generation (POST /miniapp/api/topup)', async () => {
    const res = await request('POST', '/miniapp/api/topup', {
      amount: 100000,
      payment_method: 'bank'
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.ok === true, 'Topup ok: true missing');
    assert(res.data.invoice, 'Topup invoice missing');
    assert(res.data.invoice.qr_url.includes('vietqr'), 'VietQR URL missing');
    assert(res.data.invoice.order_code, 'Order code missing');
  });

  await test('8.3 Mini App Balance Checkout (POST /miniapp/api/checkout/balance)', async () => {
    // Add balance to user first
    const uRes = await request('GET', '/miniapp/api/bootstrap');
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
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.ok === true && res.data.paid === true, 'Checkout failed');
    assert(res.data.code, 'Checkout code missing');

    // Test Delivery
    const delRes = await request('GET', `/miniapp/api/orders/${res.data.code}/delivery`);
    assert(delRes.status === 200, `Expected 200, got ${delRes.status}`);
    assert(delRes.data.items && delRes.data.items.length > 0, 'Delivered items missing');
  });

  await test('8.4 Mini App Lucky Wheel Spin (POST /miniapp/api/wheel/spin)', async () => {
    const res = await request('POST', '/miniapp/api/wheel/spin', {});
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.ok === true, 'Wheel spin failed');
    assert(typeof res.data.segment_index === 'number', 'segment_index missing');
    assert(res.data.prize, 'Prize missing');
  });

  await test('8.5 Mini App Social Buff Order (POST /miniapp/api/social/orders)', async () => {
    const res = await request('POST', '/miniapp/api/social/orders', {
      product_id: createdProdId,
      quantity: 100,
      target_link: 'https://facebook.com/test'
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.ok === true, 'Social order failed');
    assert(res.data.order_code, 'Order code missing');
  });

  await test('8.6 Mini App Netflix TV Pairing (POST /miniapp/api/netflix/pair-tv)', async () => {
    const res = await request('POST', '/miniapp/api/netflix/pair-tv', {
      tv_code: '88992211'
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.ok === true, 'Netflix pair-tv failed');
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

  // Cleanup test artifacts
  await test('Cleanup: Delete Test Product & Category', async () => {
    if (createdProdId) {
      const pRes = await request('DELETE', `/api/admin/products/${createdProdId}`);
      assert(pRes.status === 200, 'Delete product failed');
    }
    if (createdCatId) {
      const cRes = await request('DELETE', `/api/admin/categories/${createdCatId}`);
      assert(cRes.status === 200, 'Delete category failed');
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
