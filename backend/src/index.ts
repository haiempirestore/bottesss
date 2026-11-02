import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { Telegraf, Markup } from 'telegraf';
import { prisma } from './db.js';
import { verifyTelegramInitData, signUser, userAuth, adminAuth, signAdmin } from './security.js';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDist = path.resolve(__dirname, '../../frontend/dist');

const app = express();
const port = Number(process.env.PORT || 4000);
const botToken = process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || '';
const rawOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
const allowedOrigins = rawOrigin.split(',').map(s => s.trim());
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes('*') ||
      allowedOrigins.includes(origin) ||
      origin.endsWith('.github.io') ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1')
    ) {
      return callback(null, true);
    }
    // Also allow tunnels like localtunnel, trycloudflare, ngrok
    if (origin.includes('.trycloudflare.com') || origin.includes('.loca.lt') || origin.includes('.ngrok-free.app')) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json({ limit: '1mb', verify: (req: any, _res, buf) => { req.rawBody = buf.toString('utf8'); } }));
app.use(rateLimit({ windowMs: 60_000, limit: 120 }));
app.get('/health', (_req, res) => res.json({ ok: true }));

app.post('/api/auth/telegram', async (req, res) => {
  try {
    const rawInit = typeof req.body?.initData === 'string' ? req.body.initData : '';
    let tg: any = null;

    if (rawInit) {
      try {
        if (botToken) {
          const data = verifyTelegramInitData(rawInit, botToken);
          tg = JSON.parse(data.user || '{}');
        }
      } catch {
        // Fallback for dev / mock bot tokens
      }

      if (!tg || !tg.id) {
        try {
          const params = new URLSearchParams(rawInit);
          const uStr = params.get('user');
          if (uStr) tg = JSON.parse(uStr);
        } catch {}
      }
    }

    if (!tg || !tg.id) {
      tg = {
        id: `web_${Date.now().toString(36)}`,
        first_name: 'Khách Telegram',
        username: 'telegram_user'
      };
    }

    const user = await prisma.user.upsert({
      where: { telegramId: String(tg.id) },
      update: {
        username: tg.username || undefined,
        firstName: tg.first_name || undefined,
        lastName: tg.last_name || undefined,
        photoUrl: tg.photo_url || undefined
      },
      create: {
        telegramId: String(tg.id),
        username: tg.username || 'user',
        firstName: tg.first_name || 'Khách Hàng',
        lastName: tg.last_name || '',
        photoUrl: tg.photo_url || '',
        balance: 200000 // Tặng sẵn 200k trải nghiệm thử nghiệm mua hàng
      }
    });

    if (user.isBlocked) return res.status(403).json({ error: 'Account blocked' });
    res.json({
      token: signUser(user.id),
      user: { id: user.id, username: user.username, firstName: user.firstName, balance: user.balance }
    });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Authentication failed' });
  }
});

// Tự động đăng nhập khách (trường hợp mở trực tiếp trên trình duyệt ngoài Telegram)
app.get('/api/auth/guest', async (_req, res) => {
  const user = await prisma.user.upsert({
    where: { telegramId: 'browser_guest_user' },
    update: {},
    create: {
      telegramId: 'browser_guest_user',
      firstName: 'Khách Trình Duyệt',
      username: 'guest_user',
      balance: 500000
    }
  });
  res.json({
    token: signUser(user.id),
    user: { id: user.id, username: user.username, firstName: user.firstName, balance: user.balance }
  });
});

// Middleware chặn mọi truy cập Quản trị từ bên ngoài (chỉ cho phép localhost trên máy chủ)
function requireLocalhost(req: express.Request, res: express.Response, next: express.NextFunction) {
  const host = (req.headers['x-forwarded-host'] || req.headers.host || '').toString().toLowerCase();
  const origin = (req.headers.origin || '').toString().toLowerCase();
  const remoteIp = req.socket.remoteAddress || '';

  // Chặn nếu request có origin từ GitHub Pages hoặc domain ngoài
  if (origin && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
    return res.status(403).json({ error: 'Truy cập bị từ chối: Trang quản trị chỉ được phép mở trực tiếp trên localhost máy chủ.' });
  }

  // Chặn nếu request đi qua tunnel công khai (Cloudflare, localtunnel, ngrok...)
  if (host.includes('trycloudflare.com') || host.includes('loca.lt') || host.includes('ngrok') || host.includes('github.io')) {
    return res.status(403).json({ error: 'Truy cập bị từ chối: Trang quản trị chỉ được phép mở trực tiếp trên localhost máy chủ.' });
  }

  // Kiểm tra kết nối từ localhost
  const isLocalIp = remoteIp === '127.0.0.1' || remoteIp === '::1' || remoteIp === '::ffff:127.0.0.1';
  const isLocalHost = host.startsWith('localhost') || host.startsWith('127.0.0.1');

  if (!isLocalHost || !isLocalIp) {
    return res.status(403).json({ error: 'Truy cập bị từ chối: Trang quản trị chỉ được phép mở trực tiếp trên localhost máy chủ.' });
  }

  next();
}

// Áp dụng bảo vệ nghiêm ngặt cho toàn bộ API Admin
app.use('/api/admin', requireLocalhost);

// Quản trị viên: Tự động cấp quyền Admin không cần mật khẩu/tài khoản (chỉ hoạt động khi gọi từ localhost)
app.all(['/api/admin/login', '/api/admin/session'], async (_req, res) => {
  let admin = await prisma.admin.findFirst();
  if (!admin) {
    admin = await prisma.admin.create({
      data: {
        email: 'admin@shop.local',
        passwordHash: 'auto_admin_no_password_required'
      }
    });
  }
  res.json({ token: signAdmin(admin.id), admin: { email: admin.email, id: admin.id } });
});

app.get('/api/products', async (_req, res) => {
  const products = await prisma.product.findMany({ where: { isActive: true, category: { isActive: true } }, include: { category: true }, orderBy: { createdAt: 'desc' } });
  res.json(products);
});
app.get('/api/categories', async (_req, res) => {
  res.json(await prisma.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }));
});
app.get('/api/me', userAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: (req as any).auth.id }, select: { id: true, telegramId: true, username: true, firstName: true, balance: true, createdAt: true } });
  res.json(user);
});
app.get('/api/orders', userAuth, async (req, res) => {
  res.json(await prisma.order.findMany({ where: { userId: (req as any).auth.id }, include: { items: { include: { product: true } } }, orderBy: { createdAt: 'desc' } }));
});

// Atomic balance purchase + stock allocation. Stock is delivered by bot as a private message.
app.post('/api/orders', userAuth, async (req, res) => {
  const parsed = z.object({ productId: z.string(), quantity: z.number().int().min(1).max(20) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid order' });
  try {
    const result = await prisma.$transaction(async tx => {
      const product = await tx.product.findFirst({ where: { id: parsed.data.productId, isActive: true } });
      if (!product) throw new Error('Product unavailable');
      const price = product.salePrice ?? product.price;
      const total = price * parsed.data.quantity;
      const user = await tx.user.findUniqueOrThrow({ where: { id: (req as any).auth.id } });
      if (user.balance < total) throw new Error('Insufficient balance');
      const stock = await tx.stockItem.findMany({ where: { productId: product.id, status: 'AVAILABLE' }, take: parsed.data.quantity });
      if (stock.length !== parsed.data.quantity) throw new Error('Out of stock');
      const order = await tx.order.create({
        data: {
          code: `DH${Date.now()}${crypto.randomInt(100,999)}`,
          userId: user.id,
          total,
          status: 'DELIVERED',
          items: {
            create: {
              productId: product.id,
              quantity: parsed.data.quantity,
              unitPrice: price,
              delivered: stock.map(s => s.payload).join('\n')
            }
          }
        },
        include: { items: true }
      });
      await tx.stockItem.updateMany({ where: { id: { in: stock.map(s => s.id) }, status: 'AVAILABLE' }, data: { status: 'SOLD', soldAt: new Date(), orderItemId: order.items[0].id } });
      await tx.user.update({ where: { id: user.id }, data: { balance: { decrement: total } } });
      await tx.transaction.create({ data: { userId: user.id, type: 'PURCHASE', amount: -total, note: order.code } });
      return { order, delivery: stock.map(s => s.payload) };
    }, { isolationLevel: 'Serializable' });
    const user = await prisma.user.findUnique({ where: { id: (req as any).auth.id } });
    if (botToken && user) await bot?.telegram.sendMessage(Number(user.telegramId), `✅ Đơn ${result.order.code} đã hoàn tất.\n${result.delivery.join('\n')}`);
    res.json({ order: result.order, delivery: result.delivery });
  } catch (e) { res.status(400).json({ error: e instanceof Error ? e.message : 'Order failed' }); }
});

app.post('/api/payments/deposits', userAuth, async (req, res) => {
  const parsed = z.object({ amount: z.number().int().min(10000).max(100000000) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Amount must be from 10,000 to 100,000,000 VND' });
  const accountNo = process.env.VIETQR_ACCOUNT_NO || process.env.VIETQR_ACCOUNT_NUMBER || '';
  const accountName = process.env.VIETQR_ACCOUNT_NAME || '';
  if (!accountNo || !accountName) return res.status(503).json({ error: 'Receiving bank account is not configured' });
  const reference = `NAP${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
  const deposit = await prisma.deposit.create({ data: { reference, userId: (req as any).auth.id, amount: parsed.data.amount } });
  const base = process.env.VIETQR_BASE_URL || 'https://img.vietqr.io/image';
  const bank = process.env.VIETQR_BANK_ID || '970422';
  const qrUrl = `${base}/${encodeURIComponent(bank)}-${encodeURIComponent(accountNo)}-compact2.png?amount=${parsed.data.amount}&addInfo=${encodeURIComponent(reference)}&accountName=${encodeURIComponent(accountName)}`;
  res.json({ reference, amount: parsed.data.amount, qrUrl, transferContent: reference, status: deposit.status });
});

// Example HMAC webhook contract. Adapt to the payment provider's official signature format.
function verifyBankWebhook(raw: string, signature: string) {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET || '';
  if (secret.length < 32 || !signature) return false;
  const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex');
  const a = Buffer.from(expected), b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
app.post('/api/webhooks/bank', express.text({ type: 'application/json' }), async (req, res) => {
  const raw = String((req as any).rawBody || '');
  if (!verifyBankWebhook(raw, String(req.headers['x-webhook-signature'] || ''))) return res.status(401).json({ error: 'Invalid signature' });
  try {
    const event = z.object({ eventId: z.string(), transferContent: z.string(), amount: z.number().positive() }).parse(JSON.parse(raw));
    const deposit = await prisma.deposit.findUnique({ where: { reference: event.transferContent } });
    if (!deposit || deposit.status !== 'PENDING' || Number(deposit.amount) !== event.amount) return res.status(200).json({ received: true, credited: false });
    await prisma.$transaction(async tx => {
      const changed = await tx.deposit.updateMany({ where: { id: deposit.id, status: 'PENDING' }, data: { status: 'PAID', providerId: event.eventId, paidAt: new Date() } });
      if (changed.count !== 1) return;
      await tx.user.update({ where: { id: deposit.userId }, data: { balance: { increment: deposit.amount } } });
      await tx.transaction.create({ data: { userId: deposit.userId, type: 'DEPOSIT', amount: deposit.amount, note: deposit.reference } });
    }, { isolationLevel: 'Serializable' });
    res.json({ received: true });
  } catch { res.status(400).json({ error: 'Invalid webhook payload' }); }
});

// Admin APIs
app.get('/api/admin/overview', adminAuth, async (_req, res) => {
  const [users, orders, products, deposits] = await Promise.all([
    prisma.user.count(), prisma.order.count(), prisma.product.count(), prisma.deposit.aggregate({ where: { status: 'PAID' }, _sum: { amount: true } })
  ]);
  res.json({ users, orders, products, deposited: deposits._sum.amount || 0 });
});
app.get('/api/admin/users', adminAuth, async (_req, res) => res.json(await prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 200 })));
app.get('/api/admin/orders', adminAuth, async (_req, res) => res.json(await prisma.order.findMany({ include: { user: true, items: { include: { product: true } } }, orderBy: { createdAt: 'desc' }, take: 200 })));
app.post('/api/admin/categories', adminAuth, async (req, res) => {
  const data = z.object({ name: z.string().min(1), slug: z.string().min(1).regex(/^[a-z0-9-]+$/), description: z.string().optional() }).parse(req.body);
  res.json(await prisma.category.create({ data }));
});
app.post('/api/admin/products', adminAuth, async (req, res) => {
  const data = z.object({ categoryId: z.string(), name: z.string().min(1), description: z.string().optional(), price: z.number().positive(), salePrice: z.number().positive().optional(), imageUrl: z.string().url().optional() }).parse(req.body);
  res.json(await prisma.product.create({ data: { ...data, price: data.price, salePrice: data.salePrice } }));
});
app.post('/api/admin/stock/import', adminAuth, async (req, res) => {
  const data = z.object({ productId: z.string(), items: z.array(z.string().min(1)).min(1).max(1000) }).parse(req.body);
  const result = await prisma.stockItem.createMany({ data: data.items.map(payload => ({ productId: data.productId, payload })) });
  res.json({ imported: result.count });
});

// Xuất danh mục & sản phẩm ra file products.json cho GitHub Pages chạy không cần tunnel/VPS
app.post('/api/admin/export-githubpage', adminAuth, async (_req, res) => {
  try {
    const [categories, products] = await Promise.all([
      prisma.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
      prisma.product.findMany({ where: { isActive: true }, include: { category: true }, orderBy: { createdAt: 'desc' } })
    ]);
    const data = {
      botUsername: process.env.TELEGRAM_BOT_USERNAME || 'TaiNguyenGiaReBot',
      bankConfig: {
        bankId: process.env.VIETQR_BANK_ID || '970422',
        accountNo: process.env.VIETQR_ACCOUNT_NO || process.env.VIETQR_ACCOUNT_NUMBER || '',
        accountName: process.env.VIETQR_ACCOUNT_NAME || ''
      },
      categories,
      products
    };
    const fs = await import('node:fs/promises');
    await fs.writeFile(path.resolve(__dirname, '../../frontend/public/products.json'), JSON.stringify(data, null, 2));
    await fs.writeFile(path.resolve(__dirname, '../../githubpage/products.json'), JSON.stringify(data, null, 2));
    res.json({ ok: true, count: products.length, message: 'Đã xuất thành công sản phẩm ra githubpage/products.json' });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// Xử lý đơn hàng trực tiếp qua Bot Telegram (Không cần Tunnel, Không cần VPS)
async function processOrderDelivery(telegramId: string, username: string | undefined, firstName: string | undefined, productId: string) {
  const product = await prisma.product.findFirst({
    where: { OR: [{ id: productId }, { name: { contains: productId } }], isActive: true }
  });
  if (!product) return { ok: false, message: '❌ Sản phẩm không tồn tại hoặc đã ngừng bán.' };

  const stock = await prisma.stockItem.findFirst({
    where: { productId: product.id, status: 'AVAILABLE' }
  });
  if (!stock) return { ok: false, message: `⚠️ Sản phẩm "${product.name}" hiện đang tạm hết hàng trong kho. Vui lòng quay lại sau nhé!` };

  const user = await prisma.user.upsert({
    where: { telegramId: String(telegramId) },
    update: { username, firstName },
    create: { telegramId: String(telegramId), username, firstName, balance: 200000 }
  });

  const price = product.salePrice ?? product.price;

  if (user.balance >= price) {
    const code = `DH${Date.now()}${crypto.randomInt(100, 999)}`;
    await prisma.$transaction([
      prisma.stockItem.update({ where: { id: stock.id }, data: { status: 'SOLD', soldAt: new Date() } }),
      prisma.user.update({ where: { id: user.id }, data: { balance: { decrement: price } } }),
      prisma.transaction.create({ data: { userId: user.id, type: 'PURCHASE', amount: -price, note: product.name } }),
      prisma.order.create({
        data: {
          code,
          userId: user.id,
          total: price,
          status: 'DELIVERED',
          items: {
            create: { productId: product.id, quantity: 1, unitPrice: price, delivered: stock.payload }
          }
        }
      })
    ]);
    return {
      ok: true,
      message:
        `🎉 ĐẶT HÀNG THÀNH CÔNG!\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `📦 Sản phẩm: ${product.name}\n` +
        `💰 Đơn giá: ${price.toLocaleString('vi-VN')}đ\n` +
        `💳 Số dư còn lại: ${(user.balance - price).toLocaleString('vi-VN')}đ\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `🔑 THÔNG TIN GIAO HÀNG:\n${stock.payload}\n\n` +
        `Cảm ơn bạn đã tin tưởng mua sắm tại Shop Hai1110#!`
    };
  }

  const bank = process.env.VIETQR_BANK_ID || '970422';
  const accountNo = process.env.VIETQR_ACCOUNT_NO || process.env.VIETQR_ACCOUNT_NUMBER || '';
  const accountName = process.env.VIETQR_ACCOUNT_NAME || '';
  const ref = `NAP${telegramId}`;
  const qrUrl = `https://img.vietqr.io/image/${bank}-${accountNo}-compact2.png?amount=${price}&addInfo=${ref}&accountName=${encodeURIComponent(accountName)}`;

  return {
    ok: false,
    needsPayment: true,
    qrUrl,
    message:
      `⚠️ Số dư không đủ để thanh toán "${product.name}" (${price.toLocaleString('vi-VN')}đ).\n` +
      `Số dư hiện tại của bạn: ${user.balance.toLocaleString('vi-VN')}đ.\n\n` +
      `📲 Vui lòng quét mã VietQR bên dưới để nạp tiền:\n` +
      `• Ngân hàng: MBBank\n` +
      `• Số tài khoản: ${accountNo}\n` +
      `• Chủ TK: ${accountName}\n` +
      `• Số tiền: ${price.toLocaleString('vi-VN')}đ\n` +
      `• Nội dung: ${ref}`
  };
}

// ============================================================
// BOT TELEGRAM — TÍCH HỢP ĐẦY ĐỦ MENU SẢN PHẨM & MUA HÀNG & VIETQR
// ============================================================

let bot: Telegraf | undefined;
if (botToken) {
  bot = new Telegraf(botToken);
  bot.telegram.setMyName('Shop Hai1110#').catch(err => console.error('Could not set bot display name:', err));

  const miniAppUrl = (process.env.MINI_APP_URL || 'https://haiempirestore.github.io/bottesss/').trim();

  // 1. Tự động thiết lập Menu Button góc trái dưới của Telegram
  if (miniAppUrl.startsWith('https://')) {
    bot.telegram.setChatMenuButton({
      menuButton: {
        type: 'web_app',
        text: '🛍 MỞ CỬA HÀNG',
        web_app: { url: miniAppUrl }
      }
    }).then(() => console.log('✅ Đã cấu hình Menu Button góc trái Telegram:', miniAppUrl))
      .catch(err => console.error('Lỗi setChatMenuButton:', err));
  }

  // 2. Cấu hình danh sách lệnh cho thanh Menu Telegram
  bot.telegram.setMyCommands([
    { command: 'start', description: 'Khởi động & Mở Menu Shop' },
    { command: 'products', description: '🛍 Danh sách sản phẩm đang bán' },
    { command: 'nap', description: '💳 Nạp tiền vào ví qua VietQR' },
    { command: 'me', description: '👤 Xem số dư ví & thông tin tài khoản' },
    { command: 'orders', description: '📦 Đơn hàng đã mua & nhận key' },
    { command: 'support', description: '💬 Liên hệ hỗ trợ kỹ thuật' }
  ]).then(() => console.log('✅ Đã cấu hình danh sách lệnh Bot (/start, /products, /nap...)'))
    .catch(err => console.error('Lỗi setMyCommands:', err));

  // Bàn phím chính ghim ở chân khung chat (Reply Keyboard)
  function getMainMenuKeyboard() {
    const rows: any[] = [
      ['🛍 Xem Sản Phẩm', '💳 Nạp Tiền VietQR'],
      ['👤 Ví & Tài Khoản', '📦 Đơn Hàng Của Tôi']
    ];
    if (miniAppUrl.startsWith('https://')) {
      rows.push([Markup.button.webApp('🌐 Mở Mini App (Giao Diện Web)', miniAppUrl)]);
    }
    rows.push(['💬 Hỗ Trợ 24/7']);
    return Markup.keyboard(rows).resize();
  }

  // Gửi Menu Danh mục sản phẩm (Inline Keyboard)
  async function sendCategoriesMenu(ctx: any) {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: {
        products: { where: { isActive: true } }
      },
      orderBy: { sortOrder: 'asc' }
    });

    if (categories.length === 0) {
      return ctx.reply('⚠️ Hiện tại cửa hàng chưa có danh mục nào.');
    }

    const buttons: any[] = categories.map(c => [
      Markup.button.callback(`📂 ${c.name} (${c.products.length} SP)`, `cat:${c.id}`)
    ]);

    if (miniAppUrl.startsWith('https://')) {
      buttons.push([Markup.button.webApp('🌐 Mở Mini App xem ảnh & chi tiết', miniAppUrl)]);
    }

    const text =
      `🛍 DANH MỤC HÀNG HÓA TẠI SHOP HAI1110#\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `Vui lòng bấm chọn nhóm sản phẩm bạn quan tâm bên dưới để xem danh sách & mua hàng:`;

    if (ctx.callbackQuery) {
      await ctx.editMessageText(text, Markup.inlineKeyboard(buttons)).catch(async () => {
        await ctx.reply(text, Markup.inlineKeyboard(buttons));
      });
    } else {
      await ctx.reply(text, Markup.inlineKeyboard(buttons));
    }
  }

  // Gửi danh sách sản phẩm trong 1 danh mục
  async function sendProductsOfCategory(ctx: any, categoryId: string) {
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) return ctx.reply('❌ Danh mục không tồn tại.');

    const products = await prisma.product.findMany({
      where: { categoryId, isActive: true },
      include: {
        stockItems: { where: { status: 'AVAILABLE' } }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (products.length === 0) {
      const backBtn = Markup.inlineKeyboard([[Markup.button.callback('⬅️ Quay lại danh mục', 'view_cats')]]);
      const emptyText = `📂 Danh mục: ${category.name}\nHiện tại chưa có sản phẩm nào.`;
      if (ctx.callbackQuery) {
        return ctx.editMessageText(emptyText, backBtn);
      }
      return ctx.reply(emptyText, backBtn);
    }

    let text =
      `📂 DANH MỤC: ${category.name.toUpperCase()}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `Chọn sản phẩm bạn muốn mua ngay bên dưới:\n\n`;

    const buttons: any[] = [];
    for (const p of products) {
      const price = p.salePrice ?? p.price;
      const stockCount = p.stockItems.length;
      const stockBadge = stockCount > 0 ? `(Còn ${stockCount} key)` : `(Tạm hết)`;

      text +=
        `🔹 ${p.name}\n` +
        `• Giá bán: ${price.toLocaleString('vi-VN')}đ ${p.salePrice ? `(Gốc: ${p.price.toLocaleString('vi-VN')}đ)` : ''}\n` +
        `• Tình trạng: ${stockCount > 0 ? `🟢 Còn ${stockCount} SP trong kho` : '🔴 Tạm hết hàng'}\n` +
        `• Mô tả: ${p.description || 'Sản phẩm kỹ thuật số chính hãng'}\n\n`;

      if (stockCount > 0) {
        buttons.push([
          Markup.button.callback(`🛒 Mua: ${p.name.slice(0, 22)}... - ${price.toLocaleString('vi-VN')}đ`, `buy:${p.id}`)
        ]);
      }
    }

    buttons.push([Markup.button.callback('⬅️ Quay lại danh mục', 'view_cats')]);

    if (ctx.callbackQuery) {
      await ctx.editMessageText(text, Markup.inlineKeyboard(buttons)).catch(async () => {
        await ctx.reply(text, Markup.inlineKeyboard(buttons));
      });
    } else {
      await ctx.reply(text, Markup.inlineKeyboard(buttons));
    }
  }

  // Menu Nạp tiền VietQR
  async function sendDepositMenu(ctx: any) {
    const text =
      `💳 NẠP TIỀN VÀO VÍ SHOP TỰ ĐỘNG QUA VIETQR\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `• Ngân hàng: Quân Đội (MBBank)\n` +
      `• STK nhận: HAI100TR\n` +
      `• Chủ tài khoản: NGUYEN HOANG HAI\n` +
      `• Nạp tiền tự động 24/7, không mất phí giao dịch.\n\n` +
      `👇 Vui lòng chọn nhanh số tiền bạn muốn nạp:`;

    const buttons = [
      [Markup.button.callback('💵 20.000đ', 'nap:20000'), Markup.button.callback('💵 50.000đ', 'nap:50000')],
      [Markup.button.callback('💵 100.000đ', 'nap:100000'), Markup.button.callback('💵 200.000đ', 'nap:200000')],
      [Markup.button.callback('💵 500.000đ', 'nap:500000'), Markup.button.callback('💵 1.000.000đ', 'nap:1000000')]
    ];

    if (ctx.callbackQuery) {
      await ctx.editMessageText(text, Markup.inlineKeyboard(buttons)).catch(async () => {
        await ctx.reply(text, Markup.inlineKeyboard(buttons));
      });
    } else {
      await ctx.reply(text, Markup.inlineKeyboard(buttons));
    }
  }

  // Tạo & Gửi ảnh mã QR nạp tiền
  async function sendVietQR(ctx: any, amount: number) {
    const bank = process.env.VIETQR_BANK_ID || '970422';
    const acc = process.env.VIETQR_ACCOUNT_NO || process.env.VIETQR_ACCOUNT_NUMBER || 'HAI100TR';
    const name = process.env.VIETQR_ACCOUNT_NAME || 'NGUYEN HOANG HAI';
    const teleId = ctx.from.id;
    const ref = `NAP${teleId}`;
    const qrUrl = `https://img.vietqr.io/image/${bank}-${acc}-compact2.png?amount=${amount}&addInfo=${ref}&accountName=${encodeURIComponent(name)}`;

    const caption =
      `📲 MÃ QR CHUYỂN KHOẢN NẠP TIỀN:\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🏦 Ngân hàng: Quân Đội (MBBank)\n` +
      `💳 Số tài khoản: ${acc}\n` +
      `👤 Tên chủ TK: ${name}\n` +
      `💰 Số tiền nạp: ${amount.toLocaleString('vi-VN')}đ\n` +
      `🏷 Nội dung CK: ${ref} (BẮT BUỘC ĐÚNG)\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `👉 Mở ứng dụng ngân hàng của bạn quét mã QR ở trên để chuyển khoản.\n` +
      `Sau khi chuyển khoản xong, bấm nút xác nhận bên dưới:`;

    const buttons = Markup.inlineKeyboard([
      [Markup.button.callback('✅ TÔI ĐÃ CHUYỂN KHOẢN XONG', `paid_nap:${amount}:${ref}`)],
      [Markup.button.callback('⬅️ Đổi số tiền nạp khác', 'view_deposit_menu')]
    ]);

    await ctx.replyWithPhoto({ url: qrUrl }, { caption, ...buttons });
  }

  // Xem thông tin ví & tài khoản
  async function sendAccountInfo(ctx: any) {
    const user = await prisma.user.upsert({
      where: { telegramId: String(ctx.from.id) },
      update: { username: ctx.from.username, firstName: ctx.from.first_name },
      create: { telegramId: String(ctx.from.id), username: ctx.from.username, firstName: ctx.from.first_name, balance: 200000 }
    });

    const orderCount = await prisma.order.count({ where: { userId: user.id } });

    const text =
      `👤 THÔNG TIN TÀI KHOẢN & VÍ CỦA BẠN:\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🆔 Telegram ID: ${user.telegramId}\n` +
      `👤 Họ tên: ${user.firstName || 'Khách hàng'} ${user.username ? `(@${user.username})` : ''}\n` +
      `💰 Số dư ví hiện tại: ${Number(user.balance).toLocaleString('vi-VN')}đ\n` +
      `🛍 Tổng đơn hàng đã mua: ${orderCount} đơn\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `Bạn có thể nạp thêm tiền hoặc dùng số dư để mua tài khoản/key ngay lập tức.`;

    const buttons = Markup.inlineKeyboard([
      [Markup.button.callback('💳 Nạp Thêm Tiền', 'view_deposit_menu')],
      [Markup.button.callback('🛍 Mua Sắm Ngay', 'view_cats'), Markup.button.callback('📦 Xem Đơn Đã Mua', 'view_orders')]
    ]);

    if (ctx.callbackQuery) {
      await ctx.editMessageText(text, buttons).catch(async () => {
        await ctx.reply(text, buttons);
      });
    } else {
      await ctx.reply(text, buttons);
    }
  }

  // Xem lịch sử đơn hàng
  async function sendOrderHistory(ctx: any) {
    const user = await prisma.user.findUnique({
      where: { telegramId: String(ctx.from.id) },
      include: {
        orders: {
          include: { items: { include: { product: true } } },
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });

    if (!user || user.orders.length === 0) {
      const emptyBtn = Markup.inlineKeyboard([[Markup.button.callback('🛍 Mua Hàng Ngay', 'view_cats')]]);
      const emptyText = '📦 Bạn chưa có đơn hàng nào tại cửa hàng. Hãy chọn mua các sản phẩm đang có sẵn nhé!';
      if (ctx.callbackQuery) {
        return ctx.editMessageText(emptyText, emptyBtn);
      }
      return ctx.reply(emptyText, emptyBtn);
    }

    let text = `📦 LỊCH SỬ ĐƠN HÀNG CỦA BẠN (5 đơn gần nhất):\n━━━━━━━━━━━━━━━━━━━━\n`;
    for (const o of user.orders) {
      text += `🔖 Mã đơn: ${o.code} | Ngày: ${o.createdAt.toLocaleDateString('vi-VN')}\n`;
      text += `💰 Tổng tiền: ${Number(o.total).toLocaleString('vi-VN')}đ\n`;
      for (const item of o.items) {
        text += `• ${item.product.name} (SL: ${item.quantity})\n`;
        if (item.delivered) {
          text += `  🔑 BÀN GIAO:\n${item.delivered}\n`;
        }
      }
      text += `━━━━━━━━━━━━━━━━━━━━\n`;
    }

    const buttons = Markup.inlineKeyboard([[Markup.button.callback('🛍 Mua Thêm Sản Phẩm', 'view_cats')]]);

    if (ctx.callbackQuery) {
      await ctx.editMessageText(text, buttons).catch(async () => {
        await ctx.reply(text, buttons);
      });
    } else {
      await ctx.reply(text, buttons);
    }
  }

  // --- CÁC SỰ KIỆN LỆNH & TIN NHẮN CỦA BOT ---

  bot.start(async ctx => {
    const payload = (ctx as any).startPayload;

    // Xử lý deep-link mua hàng: ?start=buy_xxx
    if (payload && payload.startsWith('buy_')) {
      const prodId = payload.replace('buy_', '');
      const res = await processOrderDelivery(String(ctx.from.id), ctx.from.username, ctx.from.first_name, prodId);
      if (res.needsPayment && res.qrUrl) {
        return ctx.replyWithPhoto({ url: res.qrUrl }, { caption: res.message });
      }
      return ctx.reply(res.message);
    }

    // Xử lý deep-link nạp tiền: ?start=nap_xxx
    if (payload && payload.startsWith('nap_')) {
      const amount = Number(payload.replace('nap_', '')) || 50000;
      return sendVietQR(ctx, amount);
    }

    const replyKb = getMainMenuKeyboard();
    await ctx.reply(
      `👋 Xin chào ${ctx.from.first_name || 'bạn'}!\n` +
      `Chào mừng bạn đến với Shop Hai1110# — Hệ thống phân phối tài khoản & key bản quyền tự động 24/7.\n\n` +
      `👇 Bạn có thể mua hàng trực tiếp bằng phím bấm bên dưới hoặc mở Mini App Web:`,
      replyKb
    );

    // Gửi luôn danh mục sản phẩm để khách chọn ngay
    await sendCategoriesMenu(ctx);
  });

  // Xử lý các nút bấm bàn phím cố định
  bot.hears(['🛍 Xem Sản Phẩm', '🛍 Danh Sách Hàng', 'Sản phẩm', 'Danh mục'], ctx => sendCategoriesMenu(ctx));
  bot.hears(['💳 Nạp Tiền VietQR', '💳 Nạp Tiền', 'Nạp tiền'], ctx => sendDepositMenu(ctx));
  bot.hears(['👤 Ví & Tài Khoản', '👤 Tài Khoản / Ví', 'Tài khoản', 'Số dư'], ctx => sendAccountInfo(ctx));
  bot.hears(['📦 Đơn Hàng Của Tôi', '📦 Lịch sử đơn hàng', 'Đơn hàng'], ctx => sendOrderHistory(ctx));
  bot.hears(['💬 Hỗ Trợ 24/7', '💬 Hỗ trợ', 'Hỗ trợ'], ctx => {
    ctx.reply(
      `💬 TRUNG TÂM HỖ TRỢ KHÁCH HÀNG:\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `• Hỗ trợ Telegram: @haiempire\n` +
      `• Hotline / Zalo: 0987.654.321\n` +
      `• Thời gian làm việc: 24/7 mọi lúc\n\n` +
      `Nếu có bất kỳ thắc mắc hoặc cần bảo hành sản phẩm, vui lòng nhắn tin trực tiếp cho Admin!`
    );
  });

  // Lệnh văn bản (/products, /nap, /me, /orders, /support)
  bot.command(['products', 'hang', 'shop'], ctx => sendCategoriesMenu(ctx));
  bot.command(['nap', 'deposit'], ctx => sendDepositMenu(ctx));
  bot.command(['me', 'vi', 'taikhoan'], ctx => sendAccountInfo(ctx));
  bot.command('orders', ctx => sendOrderHistory(ctx));
  bot.command('support', ctx => ctx.reply('💬 HỖ TRỢ: Vui lòng nhắn tin trực tiếp cho Admin qua Telegram: @haiempire'));
  bot.command('help', ctx => {
    ctx.reply(
      `📖 HƯỚNG DẪN MUA SẮM TRÊN BOT:\n` +
      `1. Chọn "🛍 Xem Sản Phẩm" để duyệt danh mục và chọn món cần mua.\n` +
      `2. Bấm nút "🛒 MUA NGAY" -> Nếu đủ số dư, bot sẽ nhả mã/tài khoản ngay lập tức!\n` +
      `3. Chọn "💳 Nạp Tiền VietQR" để quét mã chuyển khoản nạp tiền vào ví.\n` +
      `4. Chọn "📦 Đơn Hàng Của Tôi" để xem lại các key đã mua bất kỳ lúc nào.\n\n` +
      `Chúc bạn có trải nghiệm mua sắm tuyệt vời!`
    );
  });

  // --- XỬ LÝ CÁC NÚT BẤM INLINE (CALLBACK QUERIES) ---

  // Khi chọn 1 danh mục
  bot.action(/^cat:(.+)$/, async ctx => {
    await ctx.answerCbQuery().catch(() => {});
    const catId = ctx.match[1];
    await sendProductsOfCategory(ctx, catId);
  });

  // Khi bấm "Quay lại danh mục"
  bot.action('view_cats', async ctx => {
    await ctx.answerCbQuery().catch(() => {});
    await sendCategoriesMenu(ctx);
  });

  // Khi bấm "Quay lại menu nạp tiền"
  bot.action('view_deposit_menu', async ctx => {
    await ctx.answerCbQuery().catch(() => {});
    await sendDepositMenu(ctx);
  });

  // Khi bấm "Xem đơn hàng"
  bot.action('view_orders', async ctx => {
    await ctx.answerCbQuery().catch(() => {});
    await sendOrderHistory(ctx);
  });

  // Khi bấm nút Nạp tiền nhanh (nap:20000, nap:50000...)
  bot.action(/^nap:(\d+)$/, async ctx => {
    await ctx.answerCbQuery().catch(() => {});
    const amount = Number(ctx.match[1]);
    await sendVietQR(ctx, amount);
  });

  // Khi bấm "✅ TÔI ĐÃ CHUYỂN KHOẢN XONG"
  bot.action(/^paid_nap:(\d+):(.+)$/, async ctx => {
    await ctx.answerCbQuery('Đã tiếp nhận yêu cầu!').catch(() => {});
    const amount = Number(ctx.match[1]);
    const ref = ctx.match[2];

    // Ghi nhận deposit vào SQLite
    const user = await prisma.user.upsert({
      where: { telegramId: String(ctx.from.id) },
      update: {},
      create: { telegramId: String(ctx.from.id), username: ctx.from.username, firstName: ctx.from.first_name, balance: 200000 }
    });

    await prisma.deposit.upsert({
      where: { reference: ref },
      update: {},
      create: {
        reference: ref,
        userId: user.id,
        amount
      }
    }).catch(() => {});

    await ctx.reply(
      `✅ ĐÃ TIẾP NHẬN YÊU CẦU NẠP TIỀN!\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `💰 Số tiền nạp: ${amount.toLocaleString('vi-VN')}đ\n` +
      `🏷 Mã giao dịch: ${ref}\n` +
      `🏦 Ngân hàng nhận: MBBank (HAI100TR - NGUYEN HOANG HAI)\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `Hệ thống đang đối soát với ngân hàng MBBank. Số dư sẽ được tự động cộng vào ví của bạn trong 1 - 3 phút!`
    );
  });

  // Khi bấm "🛒 MUA NGAY" trên Bot
  bot.action(/^buy:(.+)$/, async ctx => {
    await ctx.answerCbQuery().catch(() => {});
    const prodId = ctx.match[1];
    const res = await processOrderDelivery(String(ctx.from.id), ctx.from.username, ctx.from.first_name, prodId);

    if (res.needsPayment && res.qrUrl) {
      return ctx.replyWithPhoto({ url: res.qrUrl }, { caption: res.message });
    }

    const actionBtns = Markup.inlineKeyboard([
      [Markup.button.callback('📦 Xem Lại Đơn Hàng', 'view_orders')],
      [Markup.button.callback('🛍 Tiếp Tục Mua Sắm', 'view_cats')]
    ]);

    await ctx.reply(res.message, actionBtns);
  });

  // Nhận dữ liệu đặt hàng khi Mini App gửi qua Telegram.WebApp.sendData
  bot.on('message', async (ctx, next) => {
    const rawData = (ctx.message as any)?.web_app_data?.data;
    if (rawData) {
      try {
        const data = JSON.parse(rawData);
        if (data.action === 'BUY' && data.productId) {
          const res = await processOrderDelivery(String(ctx.from.id), ctx.from.username, ctx.from.first_name, data.productId);
          if (res.needsPayment && res.qrUrl) {
            return ctx.replyWithPhoto({ url: res.qrUrl }, { caption: res.message });
          }
          return ctx.reply(res.message);
        }
      } catch (e) {
        console.error('Lỗi nhận dữ liệu web_app_data:', e);
      }
      return;
    }
    return next();
  });

  if ((process.env.BOT_MODE || 'polling') === 'polling') {
    bot.launch().then(() => {
      console.log('🤖 Telegram Bot đã khởi chạy thành công với đầy đủ Menu mua hàng & VietQR!');
    }).catch(err => console.error('Bot launch failed', err));
  }
}
async function seedDefaultData() {
  const catCount = await prisma.category.count();
  if (catCount === 0) {
    const cat1 = await prisma.category.create({
      data: {
        name: 'Tài khoản Premium',
        slug: 'tai-khoan-premium',
        description: 'Tài khoản giải trí chính chủ chất lượng cao',
        sortOrder: 1
      }
    });
    const cat2 = await prisma.category.create({
      data: {
        name: 'Phần mềm & Bản quyền',
        slug: 'phan-mem-ban-quyen',
        description: 'Key bản quyền Windows, Office, VPN',
        sortOrder: 2
      }
    });

    const p1 = await prisma.product.create({
      data: {
        categoryId: cat1.id,
        name: 'Netflix Premium 4K UHD (1 Tháng)',
        description: 'Xem 4K HDR, profile riêng biệt, bảo hành trọn thời gian',
        price: 65000,
        salePrice: 59000
      }
    });
    await prisma.stockItem.createMany({
      data: [
        { productId: p1.id, payload: 'netflix1@shop.com:matkhau123 | PIN: 1110' },
        { productId: p1.id, payload: 'netflix2@shop.com:matkhau456 | PIN: 1110' },
        { productId: p1.id, payload: 'netflix3@shop.com:matkhau789 | PIN: 1110' }
      ]
    });

    const p2 = await prisma.product.create({
      data: {
        categoryId: cat1.id,
        name: 'Spotify Premium 1 Năm',
        description: 'Nghe nhạc lossless, tải offline, không quảng cáo',
        price: 180000,
        salePrice: 150000
      }
    });
    await prisma.stockItem.createMany({
      data: [
        { productId: p2.id, payload: 'spotify_key_1yr_code_ABC1110' },
        { productId: p2.id, payload: 'spotify_key_1yr_code_XYZ2026' }
      ]
    });

    const p3 = await prisma.product.create({
      data: {
        categoryId: cat2.id,
        name: 'Key Windows 11 Pro Retail',
        description: 'Kích hoạt vĩnh viễn theo mainboard, update thoải mái',
        price: 120000,
        salePrice: 99000
      }
    });
    await prisma.stockItem.createMany({
      data: [
        { productId: p3.id, payload: 'W11PRO-VK7JG-NPHTM-C97JM-9MPGT-3V66T' },
        { productId: p3.id, payload: 'W11PRO-YNMGQ-8RYV3-4PGQ3-C8XTP-7CF5M' }
      ]
    });
    console.log('✅ Đã tạo dữ liệu mẫu: Danh mục, Sản phẩm & Kho hàng.');
  }
}
seedDefaultData().catch(console.error);

// Phục vụ giao diện Quản trị trực tiếp trên localhost máy chủ (http://localhost:4000/admin)
app.use(express.static(frontendDist));
app.get(['/admin', '/admin/*'], (_req, res, next) => {
  const indexHtml = path.join(frontendDist, 'index.html');
  res.sendFile(indexHtml, (err) => {
    if (err) next();
  });
});

app.listen(port, () => console.log(`API listening on ${port}`));
process.once('SIGINT', () => bot?.stop('SIGINT'));
process.once('SIGTERM', () => bot?.stop('SIGTERM'));
