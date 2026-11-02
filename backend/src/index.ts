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
    { command: 'start', description: 'Mở cửa hàng & xem sản phẩm' },
    { command: 'menu', description: 'Bật menu phím bấm Mini App' },
    { command: 'shop', description: 'Mở cửa hàng Mini App' },
    { command: 'orders', description: 'Lịch sử mua hàng & nhận key' },
    { command: 'help', description: 'Hướng dẫn mua sắm' },
    { command: 'support', description: 'Hỗ trợ khách hàng' }
  ]).then(() => console.log('✅ Đã cấu hình danh sách lệnh Bot (/start, /menu, /shop...)'))
    .catch(err => console.error('Lỗi setMyCommands:', err));

  // Hàm tạo bàn phím menu mở Mini App chuẩn
  function createMenuKeyboards(url: string) {
    if (url.startsWith('https://')) {
      return {
        inline: Markup.inlineKeyboard([
          [Markup.button.webApp('🛍 MỞ CỬA HÀNG', url)]
        ]),
        reply: Markup.keyboard([
          [Markup.button.webApp('🛍 MỞ CỬA HÀNG TRỰC TIẾP', url)],
          ['📦 Lịch sử đơn hàng', '💬 Hỗ trợ']
        ]).resize()
      };
    }
    return {
      inline: Markup.inlineKeyboard([
        [Markup.button.url('🛍 Mở trang Web', url || 'https://haiempirestore.github.io/bottesss/')]
      ]),
      reply: Markup.keyboard([['🛍 Mở Cửa Hàng', '💬 Hỗ trợ']]).resize()
    };
  }

  bot.start(async ctx => {
    const payload = (ctx as any).startPayload;

    // Xử lý khi khách bấm "MUA NGAY" từ GitHub Pages (deep-link ?start=buy_xxx)
    if (payload && payload.startsWith('buy_')) {
      const prodId = payload.replace('buy_', '');
      const res = await processOrderDelivery(String(ctx.from.id), ctx.from.username, ctx.from.first_name, prodId);
      if (res.needsPayment && res.qrUrl) {
        return ctx.replyWithPhoto({ url: res.qrUrl }, { caption: res.message });
      }
      return ctx.reply(res.message);
    }

    // Xử lý nạp tiền deep-link ?start=nap_xxx
    if (payload && payload.startsWith('nap_')) {
      const amount = Number(payload.replace('nap_', '')) || 50000;
      const bank = process.env.VIETQR_BANK_ID || '970422';
      const acc = process.env.VIETQR_ACCOUNT_NO || process.env.VIETQR_ACCOUNT_NUMBER || 'HAI100TR';
      const name = process.env.VIETQR_ACCOUNT_NAME || 'NGUYEN HOANG HAI';
      const ref = `NAP${ctx.from.id}`;
      const qrUrl = `https://img.vietqr.io/image/${bank}-${acc}-compact2.png?amount=${amount}&addInfo=${ref}&accountName=${encodeURIComponent(name)}`;
      return ctx.replyWithPhoto(
        { url: qrUrl },
        {
          caption:
            `📲 THÔNG TIN CHUYỂN KHOẢN VIETQR:\n` +
            `• Ngân hàng: MBBank\n` +
            `• Số tài khoản: ${acc}\n` +
            `• Chủ tài khoản: ${name}\n` +
            `• Số tiền: ${amount.toLocaleString('vi-VN')}đ\n` +
            `• Nội dung CK: ${ref}\n\n` +
            `Hệ thống sẽ tự động cập nhật số dư sau khi nhận chuyển khoản!`
        }
      );
    }

    const kb = createMenuKeyboards(miniAppUrl);
    await ctx.reply(
      `👋 Xin chào ${ctx.from.first_name || 'bạn'}!\n` +
      `Chào mừng bạn đến với Shop Hai1110# — Hệ thống phân phối tài khoản & key bản quyền tự động.\n\n` +
      `👇 Bấm vào nút bên dưới để mở Mini App và chọn sản phẩm:`,
      kb.inline
    );
    // Gửi thêm bàn phím ghim ở chân màn hình
    await ctx.reply('Hoặc chọn menu nhanh:', kb.reply);
  });

  // Lệnh /menu và /shop
  bot.command(['menu', 'shop'], async ctx => {
    const kb = createMenuKeyboards(miniAppUrl);
    await ctx.reply('🛍 Mời bạn mở cửa hàng Mini App:', kb.inline);
  });

  // Lệnh /orders - Xem lịch sử đơn hàng
  bot.command('orders', async ctx => {
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
      return ctx.reply('📦 Bạn chưa có đơn hàng nào. Hãy bấm /shop để xem các sản phẩm đang bán nhé!');
    }

    let text = `📦 LỊCH SỬ ĐƠN HÀNG CỦA BẠN (5 đơn gần nhất):\n━━━━━━━━━━━━━━━━━━━━\n`;
    for (const o of user.orders) {
      text += `Mã đơn: ${o.code} | Tổng: ${Number(o.total).toLocaleString('vi-VN')}đ\n`;
      for (const item of o.items) {
        text += `• ${item.product.name} (SL: ${item.quantity})\n`;
        if (item.delivered) {
          text += `  🔑 Key: ${item.delivered}\n`;
        }
      }
      text += `━━━━━━━━━━━━━━━━━━━━\n`;
    }
    await ctx.reply(text);
  });

  bot.hears(['📦 Lịch sử đơn hàng', '📦 Lịch sử đơn'], async ctx => {
    // Gọi lại logic orders
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
      return ctx.reply('📦 Bạn chưa có đơn hàng nào. Hãy bấm /shop để xem các sản phẩm nhé!');
    }
    let text = `📦 ĐƠN HÀNG GẦN NHẤT:\n`;
    for (const o of user.orders) {
      text += `\nĐơn: ${o.code} (${Number(o.total).toLocaleString('vi-VN')}đ)\n`;
      for (const item of o.items) {
        text += `• ${item.product.name}: ${item.delivered || 'Đang giao'}\n`;
      }
    }
    await ctx.reply(text);
  });

  bot.hears(['menu', 'Menu', 'shop', 'Shop', 'cửa hàng', 'Cửa hàng'], async ctx => {
    const kb = createMenuKeyboards(miniAppUrl);
    await ctx.reply('🛍 Bấm nút để mở Mini App:', kb.inline);
  });

  bot.command('help', ctx => {
    ctx.reply(
      `📖 HƯỚNG DẪN MUA SẮM:\n` +
      `1. Bấm nút "🛍 MỞ CỬA HÀNG" ở góc dưới hoặc gõ /shop\n` +
      `2. Chọn sản phẩm bạn muốn mua và bấm "MUA NGAY"\n` +
      `3. Nếu chưa đủ số dư, quét mã VietQR để nạp tiền tự động\n` +
      `4. Sau khi thanh toán thành công, hệ thống sẽ gửi tài khoản / key trực tiếp vào tin nhắn này!\n\n` +
      `Cần hỗ trợ? Gõ /support để liên hệ Admin.`
    );
  });

  bot.command(['support', 'hotro'], ctx => {
    ctx.reply('💬 HỖ TRỢ KHÁCH HÀNG:\nVui lòng liên hệ Admin qua Telegram: @haiempire hoặc gọi hotline để được giải đáp 24/7.');
  });
  bot.hears('💬 Hỗ trợ', ctx => {
    ctx.reply('💬 HỖ TRỢ KHÁCH HÀNG:\nVui lòng liên hệ Admin qua Telegram: @haiempire để được giải đáp 24/7.');
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
      console.log('🤖 Telegram Bot đã khởi chạy thành công (Polling mode)!');
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
