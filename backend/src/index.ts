import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { Telegraf, Markup } from 'telegraf';
import QRCode from 'qrcode';
import sharp from 'sharp';
import { PayOS } from '@payos/node';
import { prisma } from './db.js';
import { verifyTelegramInitData, signUser, userAuth, adminAuth, signAdmin } from './security.js';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, exec } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
let cachedBannerFileId: string | null = 'AgACAgUAAxkDAAONaujxZ7AYxVLdS8BsRlpbQy7PjHgAArEVaxvpqUlXhMkMVAy8jvYBAAMCAAN5AAM9BA';
let isBotRunning = false;
let activeTunnelUrl = '';

function scheduleGithubSync() {
  // Mini App đã loại bỏ, không đồng bộ GitHub Pages nữa
}

function startAutoTunnel() {
  // Mini App đã loại bỏ, không cần khởi chạy SSH tunnel nữa
}

// ============================================================
// SETTINGS VÀ QUẢN TRỊ TELEGRAM BOT TRÊN TRANG WEB ADMIN RIÊNG
// ============================================================
const SETTINGS_FILE = path.join(__dirname, '..', 'assets', 'settings.json');
function loadStoreSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
    }
  } catch {}
  return {
    bankId: '970436',
    accountNo: 'HAI100TR',
    accountName: 'NGUYEN HOANG HAI',
    announcement: 'Chào mừng bạn đến với Shop Hai1110# — Hệ thống bán tài khoản & bản quyền tự động 24/7!',
    maintenanceMode: false,
    usdtRate: 25400,
    payosClientId: process.env.PAYOS_CLIENT_ID || '',
    payosApiKey: process.env.PAYOS_API_KEY || '',
    payosChecksumKey: process.env.PAYOS_CHECKSUM_KEY || ''
  };
}

function saveStoreSettings(data: any) {
  try {
    const assetsDir = path.join(__dirname, '..', 'assets');
    if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error('Lỗi lưu settings:', e);
    return false;
  }
}

// Khởi tạo client PayOS khi có đủ cấu hình
function getPayOSClient(): PayOS | null {
  const s = loadStoreSettings();
  const clientId = (s.payosClientId || process.env.PAYOS_CLIENT_ID || '').trim();
  const apiKey = (s.payosApiKey || process.env.PAYOS_API_KEY || '').trim();
  const checksumKey = (s.payosChecksumKey || process.env.PAYOS_CHECKSUM_KEY || '').trim();

  if (!clientId || !apiKey || !checksumKey) {
    return null;
  }

  try {
    return new PayOS({ clientId, apiKey, checksumKey });
  } catch (err: any) {
    console.error('Lỗi khởi tạo PayOS client:', err?.message || err);
    return null;
  }
}

const app = express();
const port = Number(process.env.PORT || 4000);
const botToken = process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || '';
const rawOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
const allowedOrigins = rawOrigin.split(',').map(s => s.trim());
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false
}));
app.use(cors({
  origin: true,
  credentials: true
}));
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-key, bypass-tunnel-reminder');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});
app.use(express.json({ limit: '1mb', verify: (req: any, _res, buf) => { req.rawBody = buf.toString('utf8'); } }));
app.use(rateLimit({ windowMs: 60_000, limit: 120 }));
app.get(['/health', '/api/health'], (_req, res) => {
  const settings = loadStoreSettings();
  const maintenance = Boolean(settings.maintenanceMode);
  res.json({
    ok: true,
    botActive: isBotRunning,
    maintenanceMode: maintenance,
    message: maintenance ? 'Hệ thống đang tạm bảo trì' : (isBotRunning ? 'Bot đang hoạt động' : 'Bot đang khởi động'),
    timestamp: Date.now()
  });
});

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
      user: {
        id: user.id,
        telegramId: user.telegramId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        photoUrl: user.photoUrl,
        balance: user.balance
      }
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

// Middleware xác thực Quản trị (cho phép localhost hoặc Admin Key 'hai1110' hoặc Bearer token)
function requireLocalhost(req: express.Request, res: express.Response, next: express.NextFunction) {
  const adminKey = (req.headers['x-admin-key'] as string) || (req.query.adminKey as string);
  if (adminKey === (process.env.ADMIN_KEY || 'hai1110')) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return next();
  }

  const host = req.get('host') || '';
  const remoteIp = req.socket?.remoteAddress || '';
  const isLocalIp = remoteIp === '127.0.0.1' || remoteIp === '::1' || remoteIp === '::ffff:127.0.0.1';
  const isLocalHost = host.startsWith('localhost') || host.startsWith('127.0.0.1');

  if (isLocalHost || isLocalIp) {
    return next();
  }

  return res.status(403).json({ error: 'Truy cập bị từ chối: Cần Admin Key hoặc mở trực tiếp trên localhost.' });
}

// Áp dụng bảo vệ nghiêm ngặt cho toàn bộ API Admin
app.use('/api/admin', requireLocalhost);

// Quản trị viên: Đăng nhập cấp token Admin (nhận diện localhost hoặc PIN/Key 'hai1110')
app.all(['/api/admin/login', '/api/admin/session'], async (req, res) => {
  const adminKey = req.body?.adminKey || (req.headers['x-admin-key'] as string) || (req.query?.adminKey as string);
  const isKeyValid = adminKey === (process.env.ADMIN_KEY || 'hai1110');

  const host = req.get('host') || '';
  const remoteIp = req.socket?.remoteAddress || '';
  const isLocalIp = remoteIp === '127.0.0.1' || remoteIp === '::1' || remoteIp === '::ffff:127.0.0.1';
  const isLocalHost = host.startsWith('localhost') || host.startsWith('127.0.0.1');

  if (!isKeyValid && !isLocalHost && !isLocalIp) {
    return res.status(401).json({ error: 'Mã PIN / Admin Key không chính xác' });
  }

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
  const rawProducts = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      category: true,
      stockItems: {
        where: { status: 'AVAILABLE' },
        select: { id: true, payload: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  const products = rawProducts.map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    salePrice: p.salePrice,
    imageUrl: p.imageUrl,
    category: p.category,
    stockCount: p.stockItems.length,
    stockItems: p.stockItems.map(s => s.payload)
  }));
  res.json(products);
});
app.get('/api/categories', async (_req, res) => {
  res.json(await prisma.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }));
});
app.get('/api/admin/categories', adminAuth, async (_req, res) => {
  res.json(await prisma.category.findMany({ orderBy: { sortOrder: 'asc' } }));
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

// API Đồng bộ thông tin người dùng thực tế từ Bot Telegram lên Mini App
app.all('/api/user/sync', async (req, res) => {
  try {
    const telegramId = String(req.query.telegramId || req.body?.telegramId || '').trim();
    if (!telegramId) return res.status(400).json({ error: 'Missing telegramId' });

    let user = await prisma.user.findUnique({
      where: { telegramId },
      include: {
        orders: {
          include: { items: { include: { product: true } } },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          telegramId,
          firstName: req.body?.firstName || `Khách ${telegramId}`,
          username: req.body?.username || null,
          photoUrl: req.body?.photoUrl || null,
          balance: 200000
        },
        include: {
          orders: {
            include: { items: { include: { product: true } } },
            orderBy: { createdAt: 'desc' }
          }
        }
      });
    }

    const totalSpent = user.orders.filter(o => o.status === 'DELIVERED').reduce((s, o) => s + o.total, 0);

    const mappedOrders = user.orders.map(o => ({
      id: o.id,
      code: o.code,
      productName: o.items[0]?.product?.name || 'Sản phẩm',
      total: o.total,
      accountKey: o.items[0]?.delivered || '',
      status: o.status,
      date: o.createdAt
    }));

    res.json({
      ok: true,
      user: {
        id: user.id,
        telegramId: user.telegramId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        photoUrl: user.photoUrl,
        balance: user.balance,
        totalSpent,
        orderCount: user.orders.length
      },
      orders: mappedOrders,
      token: signUser(user.id)
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API Mua hàng & Bàn giao tài khoản/mật khẩu/link trực tiếp trên Mini App
app.post('/api/orders/checkout', async (req, res) => {
  try {
    const { telegramId, productId, customKey } = z.object({
      telegramId: z.string().min(1),
      productId: z.string().min(1),
      customKey: z.string().optional()
    }).parse(req.body);

    const product = await prisma.product.findFirst({
      where: { id: productId, isActive: true },
      include: { stockItems: { where: { status: 'AVAILABLE' } } }
    });
    if (!product) return res.status(404).json({ error: 'Sản phẩm không tồn tại hoặc đã ngừng bán' });

    let user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) {
      user = await prisma.user.create({
        data: { telegramId, firstName: `Khách ${telegramId}`, balance: 0 }
      });
    }

    const price = product.salePrice ?? product.price;

    if (user.balance < price) {
      return res.status(400).json({
        ok: false,
        error: 'INSUFFICIENT_BALANCE',
        message: 'Số dư không đủ',
        balance: user.balance,
        price,
        needed: price - user.balance
      });
    }

    // Lấy key từ kho (ưu tiên key sẵn có trong kho và đánh dấu đã bán SOLD để không bị trùng)
    let deliveredKey = '';
    let stockIdToSold: string | null = null;

    if (customKey && customKey.trim()) {
      const match = product.stockItems.find(s => s.payload === customKey.trim());
      if (match) {
        deliveredKey = match.payload;
        stockIdToSold = match.id;
      }
    }

    if (!deliveredKey) {
      const stock = product.stockItems[0];
      if (stock) {
        deliveredKey = stock.payload;
        stockIdToSold = stock.id;
      } else {
        const randPass = crypto.randomInt(100000, 999999);
        const isLink = product.name.toLowerCase().includes('link') || product.name.toLowerCase().includes('mời') || product.name.toLowerCase().includes('group');
        if (isLink) {
          deliveredKey = `https://hai1110.vip/join/${Date.now().toString(36)}`;
        } else {
          deliveredKey = `Tài khoản: hai1110_${Date.now().toString(36).slice(-5)}@shop.vip | Mật khẩu: Hai1110@${randPass}`;
        }
      }
    }

    const code = `DH${Date.now().toString(36).toUpperCase()}`;

    const [updatedUser, order] = await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          balance: { decrement: price }
        }
      }),
      prisma.order.create({
        data: {
          code,
          userId: user.id,
          total: price,
          status: 'DELIVERED',
          items: {
            create: {
              productId: product.id,
              quantity: 1,
              unitPrice: price,
              delivered: deliveredKey
            }
          }
        },
        include: { items: { include: { product: true } } }
      }),
      prisma.transaction.create({
        data: {
          userId: user.id,
          type: 'PURCHASE',
          amount: -price,
          note: `Mua trên Mini App: ${product.name} (#${code})`
        }
      })
    ]);

    if (stockIdToSold) {
      await prisma.stockItem.update({
        where: { id: stockIdToSold },
        data: { status: 'SOLD', soldAt: new Date(), orderItemId: order.items[0]?.id }
      }).catch(() => {});
      exportGithubProducts().catch(() => {});
    }

    // Gửi tin nhắn bàn giao thông tin vào chat Telegram của khách
    if (bot && user.telegramId && !user.telegramId.startsWith('web_')) {
      const deliveryMsg =
        `🎉 <b>ĐẶT HÀNG THÀNH CÔNG TRÊN MINI APP!</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `📦 <b>Sản phẩm:</b> ${product.name}\n` +
        `🔖 <b>Mã đơn:</b> <code>${code}</code>\n` +
        `💰 <b>Đơn giá:</b> ${price.toLocaleString('vi-VN')}đ\n` +
        `👛 <b>Số dư còn lại:</b> ${updatedUser.balance.toLocaleString('vi-VN')}đ\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `🔑 <b>THÔNG TIN BÀN GIAO / TÀI KHOẢN & MẬT KHẨU:</b>\n` +
        `<code>${deliveredKey}</code>\n\n` +
        `<i>Đơn hàng đã được lưu trên Mini App mục "Đơn hàng". Cảm ơn bạn đã mua sắm tại Shop Hai1110#!</i>`;
      await bot.telegram.sendMessage(user.telegramId, deliveryMsg, { parse_mode: 'HTML' }).catch(() => {});
    }

    res.json({
      ok: true,
      order: {
        id: order.id,
        code: order.code,
        productName: product.name,
        total: price,
        status: 'DELIVERED',
        accountKey: deliveredKey,
        date: order.createdAt
      },
      delivery: deliveredKey,
      newBalance: updatedUser.balance
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Lỗi xử lý đơn hàng' });
  }
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
  const bank = process.env.VIETQR_BANK_ID || '970436';
  const qrUrl = `${base}/${encodeURIComponent(bank)}-${encodeURIComponent(accountNo)}-compact2.png?amount=${parsed.data.amount}&addInfo=${encodeURIComponent(reference)}&accountName=${encodeURIComponent(accountName)}`;
  res.json({ reference, amount: parsed.data.amount, qrUrl, transferContent: reference, status: deposit.status });
});

// Hàm xử lý chung khi nhận biến động số dư từ Ngân hàng (SePay, Casso, MBBank, VietQR...)
async function handleIncomingBankTransfer(rawContent: string, amount: number, providerId?: string) {
  const content = (rawContent || '').trim().toUpperCase();
  console.log(`🏦 [BANK WEBHOOK] Biến động số dư: +${amount.toLocaleString('vi-VN')}đ | Nội dung: "${content}" | ProviderId: ${providerId || 'N/A'}`);

  if (amount <= 0) return { success: false, message: 'Số tiền không hợp lệ' };

  // 1. Kiểm tra đơn hàng thanh toán trực tiếp qua QR (BUY... hoặc DH...)
  const buyMatch = content.match(/BUY([A-Z0-9]+)/) || content.match(/DH([A-Z0-9]+)/);
  if (buyMatch) {
    const rawCode = buyMatch[0];
    const code = buyMatch[1];

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { code: rawCode },
          { code: { contains: code } }
        ],
        status: 'PENDING'
      },
      include: {
        user: true,
        items: { include: { product: true } }
      }
    });

    if (order) {
      console.log(`🎯 [BANK WEBHOOK] Tìm thấy đơn hàng ${order.code} của User ${order.user.telegramId}`);

      const deliveredPayloads: string[] = [];
      let deliveredAll = true;

      for (const item of order.items) {
        const requiredQty = item.quantity || 1;
        const availableStocks = await prisma.stockItem.findMany({
          where: { productId: item.productId, status: 'AVAILABLE' },
          take: requiredQty
        });

        if (availableStocks.length > 0) {
          const stockIds = availableStocks.map(s => s.id);
          await prisma.stockItem.updateMany({
            where: { id: { in: stockIds } },
            data: { status: 'SOLD', soldAt: new Date(), orderItemId: item.id }
          });
          const deliveredText = availableStocks.map((s, idx) => availableStocks.length > 1 ? `🔑 Key #${idx + 1}:\n<code>${s.payload}</code>` : `<code>${s.payload}</code>`).join('\n\n');
          await prisma.orderItem.update({
            where: { id: item.id },
            data: { delivered: deliveredText }
          });
          deliveredPayloads.push(`🔹 <b>${item.product.name} ${availableStocks.length > 1 ? `(x${availableStocks.length})` : ''}:</b>\n${deliveredText}`);
          if (availableStocks.length < requiredQty) deliveredAll = false;
        } else {
          deliveredAll = false;
        }
      }

      await prisma.order.update({
        where: { id: order.id },
        data: { status: deliveredAll ? 'DELIVERED' : 'PARTIAL' }
      });

      await prisma.transaction.create({
        data: {
          userId: order.userId,
          type: 'PURCHASE_VIETQR',
          amount: -order.total,
          note: `Thanh toán VietQR VCB: ${order.code}`
        }
      });

      if (bot && order.user.telegramId) {
        const keyText = deliveredPayloads.length > 0
          ? deliveredPayloads.join('\n\n')
          : '⚠️ Kho hàng vừa tạm hết! Tiền của bạn đã được bảo lưu an toàn. Vui lòng liên hệ Admin @haiempire để nhận bàn giao thủ công.';

        const bankName = process.env.VIETQR_BANK_NAME || 'Vietcombank (VCB)';
        const bankAcc = process.env.VIETQR_ACCOUNT_NO || process.env.VIETQR_ACCOUNT_NUMBER || 'HAI100TR';
        const bankOwner = process.env.VIETQR_ACCOUNT_NAME || 'NGUYEN HOANG HAI';

        await bot.telegram.sendMessage(
          order.user.telegramId,
          `🎉 <b>NGÂN HÀNG ĐÃ XÁC NHẬN THANH TOÁN THÀNH CÔNG!</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `🔖 <b>Mã đơn:</b> <code>${order.code}</code>\n` +
          `💰 <b>Số tiền thanh toán:</b> ${amount.toLocaleString('vi-VN')}đ\n` +
          `🏦 <b>Ngân hàng:</b> ${bankName} (${bankAcc} - ${bankOwner})\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `🔑 <b>THÔNG TIN TÀI KHOẢN / BẢN QUYỀN ĐÃ GIAO:</b>\n\n` +
          `${keyText}\n\n` +
          `Cảm ơn bạn đã tin tưởng mua sắm tại <b>Shop Hai1110#</b>!`,
          {
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [{ text: '📋 Xem Lịch Sử Đơn Hàng', callback_data: 'view_orders', style: 'success' }],
                [{ text: '🧮 Tiếp Tục Mua Sắm', callback_data: 'menu_buy', style: 'primary' }]
              ] as any
            }
          }
        ).catch(err => console.error('Lỗi gửi tin nhắn trả key đơn hàng qua Telegram:', err));
      }

      return { success: true, type: 'ORDER', orderId: order.id, code: order.code };
    }
  }

  // 2. Kiểm tra Nạp tiền vào ví (NAP...)
  const napMatch = content.match(/NAP([0-9]+)/);
  let targetTeleId = napMatch ? napMatch[1] : null;

  let deposit = null;
  const refMatch = content.match(/NAP[A-Z0-9]+/);
  if (refMatch) {
    const ref = refMatch[0];
    deposit = await prisma.deposit.findFirst({
      where: { reference: ref, status: 'PENDING' },
      include: { user: true }
    });
    if (deposit) {
      targetTeleId = deposit.user.telegramId;
    }
  }

  if (targetTeleId) {
    const user = await prisma.user.upsert({
      where: { telegramId: targetTeleId },
      update: { balance: { increment: amount } },
      create: { telegramId: targetTeleId, balance: amount }
    });

    if (deposit) {
      await prisma.deposit.update({
        where: { id: deposit.id },
        data: { status: 'PAID', paidAt: new Date(), providerId: providerId || undefined }
      });
    } else {
      await prisma.deposit.create({
        data: {
          reference: `NAP${targetTeleId}_${Date.now()}`,
          userId: user.id,
          amount,
          status: 'PAID',
          paidAt: new Date(),
          providerId: providerId || undefined
        }
      });
    }

    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: 'DEPOSIT',
        amount,
        note: `Tự động duyệt từ VCB: ${content}`
      }
    });

    const newBalance = Number(user.balance);

    if (bot) {
      const bankName = process.env.VIETQR_BANK_NAME || 'Vietcombank (VCB)';
      const bankAcc = process.env.VIETQR_ACCOUNT_NO || process.env.VIETQR_ACCOUNT_NUMBER || 'HAI100TR';
      const bankOwner = process.env.VIETQR_ACCOUNT_NAME || 'NGUYEN HOANG HAI';

      await bot.telegram.sendMessage(
        targetTeleId,
        `🎉 <b>NẠP TIỀN TỰ ĐỘNG THÀNH CÔNG!</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `➕ <b>Số tiền nạp:</b> +${amount.toLocaleString('vi-VN')}đ\n` +
        `💰 <b>Số dư ví mới:</b> <b>${newBalance.toLocaleString('vi-VN')}đ</b>\n` +
        `🏦 <b>Ngân hàng:</b> ${bankName} (${bankAcc} - ${bankOwner})\n` +
        `⏰ <b>Thời gian:</b> ${new Date().toLocaleTimeString('vi-VN')} ngày ${new Date().toLocaleDateString('vi-VN')}\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `Hệ thống đã tự động ghi nhận biến động số dư từ ngân hàng và cộng tiền vào tài khoản của bạn. Chúc bạn mua sắm vui vẻ!`,
        {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🧮 Mua Hàng Ngay', callback_data: 'menu_buy', style: 'success' }],
              [{ text: '🏠 Menu Chính', callback_data: 'back_to_main', style: 'primary' }]
            ] as any
          }
        }
      ).catch(err => console.error('Lỗi gửi tin nhắn nạp tiền qua Telegram:', err));
    }

    return { success: true, type: 'DEPOSIT', targetTeleId, amount, newBalance };
  }

  return { success: false, message: 'Không tìm thấy thông tin đơn hàng hoặc mã nạp tiền phù hợp trong nội dung' };
}

// Webhook nhận biến động thanh toán từ cổng PayOS (payos.vn)
app.post(['/api/payos/webhook', '/api/webhooks/payos'], async (req, res) => {
  try {
    const body = req.body || {};
    console.log('🔔 [PAYOS WEBHOOK RECEIVED]:', JSON.stringify(body));

    const payos = getPayOSClient();
    let data = body.data;

    if (payos && body.signature) {
      try {
        data = await payos.webhooks.verify(body);
      } catch (err: any) {
        console.warn('⚠️ Lỗi verify PayOS webhook signature:', err?.message || err);
      }
    }

    // PayOS confirmation check or test ping
    if (!data) {
      return res.json({ ok: true, message: 'PayOS webhook ping received' });
    }

    const orderCode = data.orderCode;
    const amount = Number(data.amount || 0);
    const desc = String(data.description || '');

    // 1. Kiểm tra đơn Nạp Tiền (Deposit)
    const deposit = await prisma.deposit.findFirst({
      where: {
        OR: [
          { providerId: String(orderCode) },
          { reference: `PAYOS_${orderCode}` }
        ],
        status: 'PENDING'
      },
      include: { user: true }
    });

    if (deposit) {
      await prisma.deposit.update({
        where: { id: deposit.id },
        data: { status: 'PAID', paidAt: new Date() }
      });

      const newBal = Number(deposit.user.balance) + amount;
      await prisma.user.update({
        where: { id: deposit.userId },
        data: { balance: newBal }
      });

      await prisma.transaction.create({
        data: {
          userId: deposit.userId,
          type: 'DEPOSIT_PAYOS',
          amount,
          note: `Nạp tiền tự động qua PayOS (Mã: ${orderCode})`
        }
      });

      if (bot && deposit.user.telegramId) {
        await bot.telegram.sendMessage(
          deposit.user.telegramId,
          `🎉 <b>NẠP TIỀN THÀNH CÔNG QUA CỔNG PAYOS!</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `💰 <b>Số tiền nạp:</b> +${amount.toLocaleString('vi-VN')}đ\n` +
          `👛 <b>Số dư mới:</b> <b>${newBal.toLocaleString('vi-VN')}đ</b>\n` +
          `🏷 <b>Mã giao dịch PayOS:</b> <code>${orderCode}</code>\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `Cảm ơn bạn đã nạp tiền vào <b>Shop Hai1110#</b>!`,
          {
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [{ text: '🧮 Mua Hàng Ngay', callback_data: 'menu_buy', style: 'success' }],
                [{ text: '🏠 Menu Chính', callback_data: 'back_to_main', style: 'primary' }]
              ] as any
            }
          }
        ).catch(err => console.error('Lỗi gửi tin nhắn nạp tiền PayOS:', err));
      }

      return res.json({ ok: true, type: 'DEPOSIT', orderCode });
    }

    // 2. Kiểm tra đơn hàng Mua Trực Tiếp (Order)
    const order = await prisma.order.findFirst({
      where: {
        code: `PO${orderCode}`,
        status: 'PENDING'
      },
      include: {
        user: true,
        items: { include: { product: true } }
      }
    });

    if (order) {
      await processPayOSOrderDelivery(order.id);
      return res.json({ ok: true, type: 'ORDER', orderCode });
    }

    // Fallback: Kiểm tra bằng handleIncomingBankTransfer nếu nội dung có chứa NAP hoặc DH
    if (desc && amount > 0) {
      await handleIncomingBankTransfer(desc, amount, String(orderCode));
    }

    return res.json({ ok: true });
  } catch (err: any) {
    console.error('Lỗi xử lý PayOS webhook:', err);
    res.status(500).json({ error: err?.message || 'Server error' });
  }
});

// Webhook nhận biến động số dư ngân hàng (Hỗ trợ SePay, Casso, MBBank, VietQR & Universal Webhooks)
app.post(['/api/webhooks/bank', '/api/webhooks/sepay', '/api/webhooks/casso'], async (req, res) => {
  try {
    const body = req.body || {};
    console.log('🔔 [WEBHOOK NGÂN HÀNG] Nhận dữ liệu webhook:', JSON.stringify(body));

    // Xử lý Casso webhook (body.data là mảng giao dịch)
    if (Array.isArray(body.data)) {
      for (const t of body.data) {
        const content = t.description || t.memo || '';
        const amount = Number(t.amount || 0);
        const refId = String(t.id || t.tid || '');
        if (content && amount > 0) {
          await handleIncomingBankTransfer(content, amount, refId);
        }
      }
      return res.json({ success: true, count: body.data.length });
    }

    // Xử lý SePay hoặc VietQR / Generic JSON / VCB Webhooks
    const content = body.content || body.transferContent || body.description || body.memo || body.transactionContent || '';
    const amount = Number(body.transferAmount || body.amount || body.amountIn || body.creditAmount || 0);
    const providerId = String(body.referenceCode || body.referenceNumber || body.id || body.eventId || '');

    if (content && amount > 0) {
      const result = await handleIncomingBankTransfer(content, amount, providerId);
      return res.json({ success: true, result });
    }

    res.json({ success: true, message: 'Đã nhận webhook nhưng không có nội dung chuyển khoản hợp lệ' });
  } catch (err: any) {
    console.error('Lỗi xử lý webhook ngân hàng:', err);
    res.status(400).json({ error: err?.message || 'Invalid webhook payload' });
  }
});

// Endpoint giả lập / test nhận tiền ngân hàng nhanh
app.post('/api/webhooks/test-bank-transfer', async (req, res) => {
  const { content, amount } = req.body || {};
  if (!content || !amount) {
    return res.status(400).json({ error: 'Vui lòng cung cấp { content, amount }' });
  }
  const result = await handleIncomingBankTransfer(String(content), Number(amount), `TEST_${Date.now()}`);
  res.json({ success: true, result });
});

// Hàm xuất file products.json đồng bộ cho cả frontend và GitHub Pages
async function exportGithubProducts() {
  try {
    const [categories, rawProducts] = await Promise.all([
      prisma.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
      prisma.product.findMany({
        where: { isActive: true },
        include: {
          category: true,
          stockItems: {
            where: { status: 'AVAILABLE' },
            select: { id: true, payload: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    const products = rawProducts.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      salePrice: p.salePrice,
      imageUrl: p.imageUrl,
      category: p.category,
      stockCount: p.stockItems.length,
      stockItems: p.stockItems.map(s => s.payload)
    }));

    const data = {
      botUsername: (process.env.TELEGRAM_BOT_USERNAME || 'tainguyenhai1110_bot').replace('@', ''),
      bankConfig: {
        bankId: process.env.VIETQR_BANK_ID || '970436',
        accountNo: process.env.VIETQR_ACCOUNT_NO || process.env.VIETQR_ACCOUNT_NUMBER || 'HAI100TR',
        accountName: process.env.VIETQR_ACCOUNT_NAME || 'NGUYEN HOANG HAI'
      },
      categories,
      products,
      updatedAt: new Date().toISOString()
    };
    const fs = await import('node:fs/promises');
    await fs.writeFile(path.resolve(__dirname, '../../frontend/public/products.json'), JSON.stringify(data, null, 2)).catch(() => {});
    await fs.writeFile(path.resolve(__dirname, '../../frontend/dist/products.json'), JSON.stringify(data, null, 2)).catch(() => {});
    await fs.writeFile(path.resolve(__dirname, '../../githubpage/products.json'), JSON.stringify(data, null, 2)).catch(() => {});
    scheduleGithubSync();
    return true;
  } catch (err) {
    console.error('Lỗi exportGithubProducts:', err);
    return false;
  }
}

// ============================================================
// ADMIN DASHBOARD APIS (Quản lý Sản phẩm, Người dùng, Đơn hàng)
// ============================================================

// 1. Thống kê tổng quan Overview
app.get('/api/admin/overview', adminAuth, async (_req, res) => {
  const [usersCount, ordersCount, productsCount, stockAvailableCount, depositsPaid, deliveredOrders] = await Promise.all([
    prisma.user.count(),
    prisma.order.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.stockItem.count({ where: { status: 'AVAILABLE' } }),
    prisma.deposit.aggregate({ where: { status: 'PAID' }, _sum: { amount: true } }),
    prisma.order.aggregate({ where: { status: 'DELIVERED' }, _sum: { total: true } })
  ]);
  const totalRevenue = (depositsPaid._sum.amount || 0) + (deliveredOrders._sum.total || 0);
  res.json({
    users: usersCount,
    orders: ordersCount,
    products: productsCount,
    availableStock: stockAvailableCount,
    revenue: totalRevenue,
    deposited: depositsPaid._sum.amount || 0
  });
});

// 2. Quản lý Sản phẩm
app.get('/api/admin/products', adminAuth, async (_req, res) => {
  const products = await prisma.product.findMany({
    include: {
      category: true,
      _count: {
        select: {
          stockItems: { where: { status: 'AVAILABLE' } },
          orderItems: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json(products);
});

app.post('/api/admin/products', adminAuth, async (req, res) => {
  try {
    const data = z.object({
      categoryId: z.string().min(1),
      name: z.string().min(1),
      description: z.string().optional(),
      price: z.number().positive(),
      salePrice: z.number().positive().optional().nullable(),
      imageUrl: z.string().optional().nullable(),
      stockItemsText: z.string().optional()
    }).parse(req.body);

    const product = await prisma.product.create({
      data: {
        name: data.name,
        categoryId: data.categoryId,
        price: data.price,
        salePrice: data.salePrice || null,
        description: data.description || null,
        imageUrl: data.imageUrl || null,
        isActive: true
      }
    });

    if (data.stockItemsText && data.stockItemsText.trim()) {
      const lines = data.stockItemsText.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length > 0) {
        await prisma.stockItem.createMany({
          data: lines.map(payload => ({ productId: product.id, payload }))
        });
      }
    }

    await exportGithubProducts();
    res.json(product);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Lỗi thêm sản phẩm' });
  }
});

app.put('/api/admin/products/:id', adminAuth, async (req, res) => {
  try {
    const id = String(req.params.id);
    const data = req.body;
    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name : undefined,
        categoryId: data.categoryId !== undefined ? data.categoryId : undefined,
        price: data.price !== undefined ? Number(data.price) : undefined,
        salePrice: data.salePrice !== undefined ? (data.salePrice ? Number(data.salePrice) : null) : undefined,
        description: data.description !== undefined ? data.description : undefined,
        imageUrl: data.imageUrl !== undefined ? data.imageUrl : undefined,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : undefined
      }
    });
    await exportGithubProducts();
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Lỗi cập nhật sản phẩm' });
  }
});

app.delete('/api/admin/products/:id', adminAuth, async (req, res) => {
  try {
    const id = String(req.params.id);
    await prisma.stockItem.deleteMany({ where: { productId: id, status: 'AVAILABLE' } }).catch(() => {});
    try {
      await prisma.product.delete({ where: { id } });
    } catch {
      await prisma.product.update({ where: { id }, data: { isActive: false } });
    }
    await exportGithubProducts();
    res.json({ ok: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Lỗi xoá sản phẩm' });
  }
});

app.post('/api/admin/products/:id/stock', adminAuth, async (req, res) => {
  try {
    const id = String(req.params.id);
    const { items, text } = req.body;
    let list: string[] = [];
    if (Array.isArray(items)) {
      list = items.map(s => String(s).trim()).filter(Boolean);
    } else if (typeof text === 'string') {
      list = text.split('\n').map(s => s.trim()).filter(Boolean);
    }
    if (list.length === 0) return res.status(400).json({ error: 'Danh sách key trống' });

    const result = await prisma.stockItem.createMany({
      data: list.map(payload => ({ productId: id, payload }))
    });
    await exportGithubProducts();
    res.json({ imported: result.count });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Lỗi nhập kho sản phẩm' });
  }
});

// 3. Quản lý Người dùng (+ - Tiền, Khoá, Xoá vi phạm)
app.get('/api/admin/users', adminAuth, async (_req, res) => {
  const users = await prisma.user.findMany({
    include: {
      _count: {
        select: { orders: true, deposits: true }
      },
      orders: {
        where: { status: 'DELIVERED' },
        select: { total: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 300
  });

  const formatted = users.map(u => ({
    id: u.id,
    telegramId: u.telegramId,
    username: u.username,
    firstName: u.firstName,
    lastName: u.lastName,
    photoUrl: u.photoUrl,
    balance: u.balance,
    isBlocked: u.isBlocked,
    createdAt: u.createdAt,
    orderCount: u._count.orders,
    depositCount: u._count.deposits,
    totalSpent: u.orders.reduce((sum, o) => sum + Number(o.total), 0)
  }));

  res.json(formatted);
});

// Cộng / Trừ tiền người dùng
app.post('/api/admin/users/:id/balance', adminAuth, async (req, res) => {
  try {
    const userId = String(req.params.id);
    const { amount, type, note } = z.object({
      amount: z.number().positive(),
      type: z.enum(['ADD', 'SUBTRACT']),
      note: z.string().optional()
    }).parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'Người dùng không tồn tại' });

    const newBalance = type === 'ADD' ? (user.balance + amount) : Math.max(0, user.balance - amount);
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { balance: newBalance }
    });

    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: type === 'ADD' ? 'ADMIN_ADD' : 'ADMIN_SUBTRACT',
        amount: type === 'ADD' ? amount : -amount,
        note: note || `Admin điều chỉnh ${type === 'ADD' ? 'cộng' : 'trừ'} tiền`
      }
    });

    // Thông báo tức thì qua Telegram bot cho người dùng
    if (bot && user.telegramId) {
      const actionText = type === 'ADD' ? 'được CỘNG' : 'bị TRỪ';
      const emoji = type === 'ADD' ? '🎉' : '💸';
      const msg =
        `${emoji} <b>BIẾN ĐỘNG SỐ DƯ TÀI KHOẢN</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `Tài khoản của bạn vừa ${actionText}: <b>${type === 'ADD' ? '+' : '-'}${amount.toLocaleString('vi-VN')}đ</b>\n` +
        `👛 Số dư hiện tại: <b>${newBalance.toLocaleString('vi-VN')}đ</b>\n` +
        `📝 Lý do: <i>${note || 'Hệ thống Admin điều chỉnh số dư'}</i>`;
      await bot.telegram.sendMessage(user.telegramId, msg, { parse_mode: 'HTML' }).catch(() => {});
    }

    res.json({ ok: true, user: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Lỗi cập nhật số dư' });
  }
});

// Khoá / Mở khoá tài khoản
app.post('/api/admin/users/:id/toggle-block', adminAuth, async (req, res) => {
  try {
    const userId = String(req.params.id);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'Người dùng không tồn tại' });

    const isBlocked = !user.isBlocked;
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isBlocked }
    });

    if (bot && user.telegramId && isBlocked) {
      await bot.telegram.sendMessage(
        user.telegramId,
        `⚠️ <b>THÔNG BÁO TẠM KHOÁ TÀI KHOẢN</b>\n━━━━━━━━━━━━━━━━━━━━\nTài khoản của bạn đã bị Admin tạm khoá do vi phạm quy định sử dụng dịch vụ!`,
        { parse_mode: 'HTML' }
      ).catch(() => {});
    }

    res.json({ ok: true, isBlocked: updated.isBlocked });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Lỗi thao tác khoá tài khoản' });
  }
});

// Xoá vĩnh viễn tài khoản người vi phạm
app.delete('/api/admin/users/:id', adminAuth, async (req, res) => {
  try {
    const userId = String(req.params.id);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'Người dùng không tồn tại' });

    await prisma.transaction.deleteMany({ where: { userId } }).catch(() => {});
    await prisma.deposit.deleteMany({ where: { userId } }).catch(() => {});
    const orders = await prisma.order.findMany({ where: { userId } });
    for (const o of orders) {
      await prisma.orderItem.deleteMany({ where: { orderId: o.id } }).catch(() => {});
    }
    await prisma.order.deleteMany({ where: { userId } }).catch(() => {});
    await prisma.user.delete({ where: { id: userId } });

    res.json({ ok: true, message: `Đã xoá tài khoản @${user.username || user.telegramId}` });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Lỗi xoá tài khoản' });
  }
});

// 4. Quản lý Đơn hàng (Xem, Thêm đơn hàng, Cập nhật trạng thái)
app.get('/api/admin/orders', adminAuth, async (_req, res) => {
  const orders = await prisma.order.findMany({
    include: {
      user: true,
      items: {
        include: { product: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 300
  });
  res.json(orders);
});

// Thêm đơn hàng thủ công từ Admin
app.post('/api/admin/orders', adminAuth, async (req, res) => {
  try {
    const { telegramId, productId, total, deliveredKey, status } = z.object({
      telegramId: z.string().min(1),
      productId: z.string().min(1),
      total: z.number().nonnegative().optional(),
      deliveredKey: z.string().optional(),
      status: z.enum(['DELIVERED', 'PENDING', 'CANCELLED']).default('DELIVERED')
    }).parse(req.body);

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ error: 'Sản phẩm không tồn tại' });

    let user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) {
      user = await prisma.user.create({
        data: { telegramId, firstName: `Khách ${telegramId}`, balance: 0 }
      });
    }

    const orderTotal = total !== undefined ? total : (product.salePrice || product.price);
    const code = `OD${Date.now().toString(36).toUpperCase()}`;

    let keyToDeliver = deliveredKey?.trim() || '';
    if (!keyToDeliver && status === 'DELIVERED') {
      const stock = await prisma.stockItem.findFirst({
        where: { productId: product.id, status: 'AVAILABLE' }
      });
      if (stock) {
        keyToDeliver = stock.payload;
        await prisma.stockItem.update({
          where: { id: stock.id },
          data: { status: 'SOLD', soldAt: new Date() }
        });
      }
    }

    const order = await prisma.order.create({
      data: {
        code,
        userId: user.id,
        total: orderTotal,
        status,
        items: {
          create: {
            productId: product.id,
            quantity: 1,
            unitPrice: orderTotal,
            delivered: keyToDeliver || null
          }
        }
      },
      include: { items: { include: { product: true } }, user: true }
    });

    // Gửi thông báo & key qua Telegram cho khách hàng
    if (bot && user.telegramId && status === 'DELIVERED' && keyToDeliver) {
      const deliveryMsg =
        `🎁 <b>ĐƠN HÀNG ĐƯỢC CẤP TỪ ADMIN SHOP HAI1110#</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `📦 <b>Sản phẩm:</b> ${product.name}\n` +
        `🔖 <b>Mã đơn:</b> <code>${code}</code>\n` +
        `💰 <b>Giá trị:</b> ${orderTotal.toLocaleString('vi-VN')}đ\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `🔑 <b>THÔNG TIN BÀN GIAO / KEY BẢN QUYỀN:</b>\n` +
        `<code>${keyToDeliver}</code>\n\n` +
        `<i>Chúc bạn sử dụng dịch vụ vui vẻ!</i>`;
      await bot.telegram.sendMessage(user.telegramId, deliveryMsg, { parse_mode: 'HTML' }).catch(() => {});
    }

    res.json({ ok: true, order });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Lỗi thêm đơn hàng thủ công' });
  }
});

// Cập nhật trạng thái đơn hàng (DELIVERED, PENDING, CANCELLED, REFUNDED)
app.patch('/api/admin/orders/:id/status', adminAuth, async (req, res) => {
  try {
    const id = String(req.params.id);
    const { status, refund } = z.object({
      status: z.enum(['DELIVERED', 'PENDING', 'CANCELLED', 'REFUNDED']),
      refund: z.boolean().optional()
    }).parse(req.body);

    const order = await prisma.order.findUnique({ where: { id }, include: { user: true } });
    if (!order) return res.status(404).json({ error: 'Đơn hàng không tồn tại' });

    const orderUser = (order as any).user;
    if (refund && order.status !== 'REFUNDED' && orderUser) {
      await prisma.user.update({
        where: { id: order.userId },
        data: { balance: { increment: order.total } }
      });
      await prisma.transaction.create({
        data: {
          userId: order.userId,
          type: 'REFUND',
          amount: order.total,
          note: `Hoàn tiền đơn hàng #${order.code}`
        }
      });
      if (bot && orderUser.telegramId) {
        await bot.telegram.sendMessage(
          orderUser.telegramId,
          `💸 <b>THÔNG BÁO HOÀN TIỀN ĐƠN HÀNG #${order.code}</b>\n━━━━━━━━━━━━━━━━━━━━\nSố tiền: <b>+${order.total.toLocaleString('vi-VN')}đ</b> đã được hoàn lại vào số dư ví của bạn!`,
          { parse_mode: 'HTML' }
        ).catch(() => {});
      }
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { status }
    });

    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Lỗi cập nhật trạng thái đơn' });
  }
});

app.post('/api/admin/categories', adminAuth, async (req, res) => {
  try {
    const data = z.object({
      name: z.string().min(1),
      slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
      description: z.string().optional(),
      imageUrl: z.string().optional(),
      sortOrder: z.number().optional()
    }).parse(req.body);
    const cat = await prisma.category.create({ data });
    await exportGithubProducts();
    res.json(cat);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Lỗi tạo danh mục' });
  }
});

app.put('/api/admin/categories/:id', adminAuth, async (req, res) => {
  try {
    const id = String(req.params.id);
    const data = req.body;
    const updated = await prisma.category.update({
      where: { id },
      data: {
        name: data.name !== undefined ? String(data.name).trim() : undefined,
        slug: data.slug !== undefined ? String(data.slug).trim() : undefined,
        description: data.description !== undefined ? (data.description ? String(data.description).trim() : null) : undefined,
        imageUrl: data.imageUrl !== undefined ? (data.imageUrl ? String(data.imageUrl).trim() : null) : undefined,
        sortOrder: data.sortOrder !== undefined ? Number(data.sortOrder) : undefined,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : undefined
      }
    });
    await exportGithubProducts();
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Lỗi cập nhật danh mục' });
  }
});

app.delete('/api/admin/categories/:id', adminAuth, async (req, res) => {
  try {
    const id = String(req.params.id);
    const count = await prisma.product.count({ where: { categoryId: id, isActive: true } });
    if (count > 0) {
      return res.status(400).json({ error: `Không thể xoá vì danh mục này đang chứa ${count} sản phẩm đang hoạt động. Hãy chuyển danh mục hoặc xoá sản phẩm trước!` });
    }
    try {
      await prisma.category.delete({ where: { id } });
    } catch {
      await prisma.category.update({ where: { id }, data: { isActive: false } });
    }
    await exportGithubProducts();
    res.json({ ok: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Lỗi xoá danh mục' });
  }
});

app.delete('/api/admin/keys/:id', adminAuth, async (req, res) => {
  try {
    const id = String(req.params.id);
    await prisma.stockItem.delete({ where: { id } });
    await exportGithubProducts();
    res.json({ ok: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Lỗi xoá key kho' });
  }
});

app.post('/api/admin/upload-image', adminAuth, async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({ error: 'Dữ liệu ảnh không hợp lệ' });
    }
    const matches = imageBase64.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
    if (!matches) {
      return res.json({ ok: true, url: imageBase64 });
    }
    const ext = matches[1].replace('jpeg', 'jpg');
    const buffer = Buffer.from(matches[2], 'base64');
    const safeName = `img_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;

    const uploadsDir = path.resolve(__dirname, '../../frontend/public/uploads');
    const distUploadsDir = path.resolve(__dirname, '../../frontend/dist/uploads');
    const ghUploadsDir = path.resolve(__dirname, '../../githubpage/uploads');

    await fs.promises.mkdir(uploadsDir, { recursive: true }).catch(() => {});
    await fs.promises.mkdir(distUploadsDir, { recursive: true }).catch(() => {});
    await fs.promises.mkdir(ghUploadsDir, { recursive: true }).catch(() => {});

    await fs.promises.writeFile(path.join(uploadsDir, safeName), buffer);
    await fs.promises.writeFile(path.join(distUploadsDir, safeName), buffer).catch(() => {});
    await fs.promises.writeFile(path.join(ghUploadsDir, safeName), buffer).catch(() => {});

    res.json({ ok: true, url: `./uploads/${safeName}` });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Lỗi lưu ảnh' });
  }
});

// Xuất danh mục & sản phẩm ra file products.json cho GitHub Pages chạy không cần tunnel/VPS
app.post('/api/admin/export-githubpage', adminAuth, async (_req, res) => {
  const ok = await exportGithubProducts();
  if (ok) {
    res.json({ ok: true, message: 'Đã xuất thành công sản phẩm ra githubpage/products.json' });
  } else {
    res.status(500).json({ error: 'Lỗi xuất file products.json' });
  }
});

// ============================================================
// SETTINGS VÀ QUẢN TRỊ TELEGRAM BOT TRÊN TRANG WEB ADMIN RIÊNG
// ============================================================
app.get('/api/settings', (_req, res) => {
  res.json(loadStoreSettings());
});

app.get('/api/admin/settings', adminAuth, (_req, res) => {
  res.json(loadStoreSettings());
});

app.post('/api/admin/settings', adminAuth, (req, res) => {
  try {
    const current = loadStoreSettings();
    const updated = { ...current, ...req.body };
    saveStoreSettings(updated);
    res.json({ ok: true, settings: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Trạng thái Bot Telegram cho Admin Web
app.get('/api/admin/bot/status', adminAuth, async (_req, res) => {
  try {
    const registeredUsers = await prisma.user.count({
      where: { telegramId: { not: { startsWith: 'web_' } } }
    });
    res.json({
      ok: true,
      botUsername: 'tainguyenhai1110_bot',
      botName: 'Shop Hai1110#',
      adminTelegramId: '6632274262',
      isPolling: !!bot,
      registeredUsers,
      menuButtonUrl: loadStoreSettings().webAppUrl || 'https://haiempirestore.github.io/bottesss/'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Gửi thông báo hàng loạt (Broadcast) qua Telegram Bot
app.post('/api/admin/bot/broadcast', adminAuth, async (req, res) => {
  try {
    const { message, pinMessage } = z.object({
      message: z.string().min(1),
      pinMessage: z.boolean().optional()
    }).parse(req.body);

    if (!bot) return res.status(500).json({ error: 'Telegram Bot chưa được khởi động' });

    const users = await prisma.user.findMany({
      where: {
        telegramId: { not: { startsWith: 'web_' } },
        isBlocked: false
      },
      select: { telegramId: true }
    });

    let sent = 0;
    let failed = 0;

    for (const u of users) {
      try {
        const text = `📢 <b>THÔNG BÁO TỪ SHOP HAI1110#</b>\n━━━━━━━━━━━━━━━━━━━━\n${message}`;
        const sentMsg = await bot.telegram.sendMessage(u.telegramId, text, { parse_mode: 'HTML' });
        if (pinMessage && sentMsg.message_id) {
          await bot.telegram.pinChatMessage(u.telegramId, sentMsg.message_id).catch(() => {});
        }
        sent++;
      } catch {
        failed++;
      }
    }

    res.json({ ok: true, total: users.length, sent, failed });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Lỗi gửi broadcast' });
  }
});

// Gửi tin nhắn riêng đến 1 người dùng Telegram
app.post('/api/admin/bot/send-message', adminAuth, async (req, res) => {
  try {
    const { telegramId, message } = z.object({
      telegramId: z.string().min(1),
      message: z.string().min(1)
    }).parse(req.body);

    if (!bot) return res.status(500).json({ error: 'Telegram Bot chưa được khởi động' });

    await bot.telegram.sendMessage(
      telegramId,
      `💬 <b>TIN NHẮN TỪ ADMIN SHOP HAI1110#</b>\n━━━━━━━━━━━━━━━━━━━━\n${message}`,
      { parse_mode: 'HTML' }
    );

    res.json({ ok: true, message: 'Đã gửi tin nhắn riêng thành công' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Lỗi gửi tin nhắn Telegram' });
  }
});

// Cập nhật Menu Button Telegram thành Menu Lệnh (Commands)
app.post('/api/admin/bot/set-menu', adminAuth, async (_req, res) => {
  try {
    if (!bot) return res.status(500).json({ error: 'Telegram Bot chưa được khởi động' });
    await bot.telegram.setChatMenuButton({
      menuButton: {
        type: 'commands'
      }
    });
    res.json({ ok: true, message: 'Đã đặt Menu Button cạnh ô chat thành Menu lệnh' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Lấy danh sách Key trong kho của 1 sản phẩm
app.get('/api/admin/products/:id/keys', adminAuth, async (req, res) => {
  try {
    const productId = String(req.params.id);
    const keys = await prisma.stockItem.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(keys);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Lấy danh sách giao dịch ví (Transactions)
app.get('/api/admin/transactions', adminAuth, async (_req, res) => {
  try {
    const txs = await prisma.transaction.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: 200
    });
    res.json(txs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Lấy danh sách nạp ví (Deposits / Topups)
app.get('/api/admin/deposits', adminAuth, async (_req, res) => {
  try {
    const deposits = await prisma.deposit.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: 200
    });
    res.json(deposits);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Duyệt nạp tiền thủ công
app.post('/api/admin/deposits/:id/approve', adminAuth, async (req, res) => {
  try {
    const dep = await prisma.deposit.findUnique({
      where: { id: String(req.params.id) },
      include: { user: true }
    });
    if (!dep) return res.status(404).json({ error: 'Giao dịch nạp không tồn tại' });
    if (dep.status === 'PAID') return res.status(400).json({ error: 'Giao dịch đã được duyệt trước đó' });

    await prisma.$transaction([
      prisma.deposit.update({
        where: { id: dep.id },
        data: { status: 'PAID', paidAt: new Date() }
      }),
      prisma.user.update({
        where: { id: dep.userId },
        data: { balance: { increment: dep.amount } }
      }),
      prisma.transaction.create({
        data: {
          userId: dep.userId,
          type: 'TOPUP',
          amount: dep.amount,
          note: `Admin duyệt nạp tiền thủ công (${dep.reference})`
        }
      })
    ]);

    if (bot && dep.user.telegramId) {
      bot.telegram.sendMessage(
        dep.user.telegramId,
        `🎉 <b>NẠP TIỀN THÀNH CÔNG!</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `Số tiền: <b>+${dep.amount.toLocaleString('vi-VN')}đ</b>\n` +
        `Mã giao dịch: <code>${dep.reference}</code>\n` +
        `Số dư ví hiện tại: <b>${(dep.user.balance + dep.amount).toLocaleString('vi-VN')}đ</b>`,
        { parse_mode: 'HTML' }
      ).catch(() => {});
    }

    res.json({ ok: true, message: 'Đã duyệt nạp tiền thành công' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Hủy yêu cầu nạp tiền
app.post('/api/admin/deposits/:id/cancel', adminAuth, async (req, res) => {
  try {
    await prisma.deposit.update({
      where: { id: String(req.params.id) },
      data: { status: 'CANCELLED' }
    });
    res.json({ ok: true, message: 'Đã hủy yêu cầu nạp tiền' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Lấy danh sách đơn lỗi giao hàng (Failed fulfillments)
app.get('/api/admin/orders/failed', adminAuth, async (_req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { status: 'FAILED' },
          { status: 'PENDING_STOCK' },
          { status: 'PENDING' }
        ]
      },
      include: {
        user: true,
        items: { include: { product: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Hoàn tiền đơn hàng về ví người dùng
app.post('/api/admin/orders/:id/refund', adminAuth, async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: String(req.params.id) },
      include: { user: true }
    });
    if (!order) return res.status(404).json({ error: 'Đơn hàng không tồn tại' });
    if (order.status === 'REFUNDED') return res.status(400).json({ error: 'Đơn hàng đã được hoàn tiền' });

    await prisma.$transaction([
      prisma.order.update({
        where: { id: order.id },
        data: { status: 'REFUNDED' }
      }),
      prisma.user.update({
        where: { id: order.userId },
        data: { balance: { increment: order.total } }
      }),
      prisma.transaction.create({
        data: {
          userId: order.userId,
          type: 'REFUND',
          amount: order.total,
          note: `Hoàn tiền đơn hàng #${order.code}`
        }
      })
    ]);

    if (bot && order.user.telegramId) {
      bot.telegram.sendMessage(
        order.user.telegramId,
        `💸 <b>HOÀN TIỀN ĐƠN HÀNG THÀNH CÔNG!</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `Đơn hàng <code>#${order.code}</code> đã được hoàn: <b>+${order.total.toLocaleString('vi-VN')}đ</b> vào ví của bạn.\n` +
        `Số dư ví hiện tại: <b>${(order.user.balance + order.total).toLocaleString('vi-VN')}đ</b>`,
        { parse_mode: 'HTML' }
      ).catch(() => {});
    }

    res.json({ ok: true, message: 'Đã hoàn tiền đơn hàng về ví thành công' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Lấy danh sách nhật ký hoạt động (Audit Logs)
app.get('/api/admin/audit', adminAuth, async (_req, res) => {
  try {
    const logs = await prisma.adminLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Ghi nhật ký hoạt động
app.post('/api/admin/audit', adminAuth, async (req, res) => {
  try {
    const { action, detail } = req.body;
    const log = await prisma.adminLog.create({
      data: { action: String(action), detail: detail ? String(detail) : null }
    });
    res.json(log);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Lấy danh sách quản trị viên (System Admins)
app.get('/api/admin/admins', adminAuth, async (_req, res) => {
  try {
    const admins = await prisma.admin.findMany({
      select: { id: true, email: true, createdAt: true }
    });
    res.json(admins);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
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

  const amountNeeded = Math.max(price - user.balance, 10000);

  return {
    ok: false,
    needsPayment: true,
    amountNeeded,
    price,
    productName: product.name,
    message:
      `⚠️ SỐ DƯ VÍ KHÔNG ĐỦ ĐỂ THANH TOÁN!\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `• Sản phẩm: ${product.name}\n` +
      `• Đơn giá: ${price.toLocaleString('vi-VN')}đ\n` +
      `• Số dư hiện tại: ${user.balance.toLocaleString('vi-VN')}đ\n` +
      `• Số tiền cần nạp: ${amountNeeded.toLocaleString('vi-VN')}đ`
  };
}

// ============================================================
// HỖ TRỢ XỬ LÝ THANH TOÁN & GIAO HÀNG QUA CỔNG PAYOS (payos.vn)
// ============================================================

async function processPayOSOrderDelivery(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: true,
      items: { include: { product: true } }
    }
  });

  if (!order) return { ok: false, message: 'Không tìm thấy đơn hàng' };
  if (order.status === 'DELIVERED') return { ok: true, order, alreadyDelivered: true };

  const item = order.items[0];
  if (!item) return { ok: false, message: 'Đơn hàng không có sản phẩm' };

  const requiredQty = item.quantity || 1;
  const availableStocks = await prisma.stockItem.findMany({
    where: { productId: item.productId, status: 'AVAILABLE' },
    take: requiredQty
  });

  if (availableStocks.length === 0) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'CANCELLED' }
    });
    if (bot && order.user.telegramId) {
      await bot.telegram.sendMessage(
        order.user.telegramId,
        `⚠️ <b>THÔNG BÁO: SẢN PHẨM TẠM THỜI HẾT HÀNG!</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `Sản phẩm <b>${item.product.name}</b> vừa hết hàng trong kho.\n` +
        `Vui lòng liên hệ Admin @haiempire để nhận bàn giao thủ công hoặc hỗ trợ ngay!`,
        { parse_mode: 'HTML' }
      ).catch(() => {});
    }
    return { ok: false, message: 'Tạm hết hàng' };
  }

  const stockIds = availableStocks.map(s => s.id);
  const deliveredPayload = availableStocks.map((s, idx) => {
    return availableStocks.length > 1
      ? `🔑 <b>Tài khoản/Key #${idx + 1}:</b>\n<code>${s.payload}</code>`
      : `<code>${s.payload}</code>`;
  }).join('\n\n');

  await prisma.$transaction([
    prisma.stockItem.updateMany({
      where: { id: { in: stockIds } },
      data: { status: 'SOLD', soldAt: new Date(), orderItemId: item.id }
    }),
    prisma.orderItem.update({
      where: { id: item.id },
      data: { delivered: deliveredPayload }
    }),
    prisma.order.update({
      where: { id: order.id },
      data: { status: 'DELIVERED' }
    }),
    prisma.transaction.create({
      data: {
        userId: order.userId,
        type: 'PURCHASE_PAYOS',
        amount: -order.total,
        note: `Thanh toán ${requiredQty}x ${item.product.name} qua PayOS (${order.code})`
      }
    })
  ]);

  if (bot && order.user.telegramId) {
    const successMsg =
      `🎉 <b>THANH TOÁN THÀNH CÔNG & BÀN GIAO SẢN PHẨM!</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📦 <b>Sản phẩm:</b> <b>${item.product.name}</b> ${requiredQty > 1 ? `(Số lượng: <b>${requiredQty}</b>)` : ''}\n` +
      `🔖 <b>Mã đơn:</b> <code>${order.code}</code>\n` +
      `💰 <b>Số tiền:</b> <b>${Number(order.total).toLocaleString('vi-VN')}đ</b> (Cổng PayOS)\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🔑 <b>THÔNG TIN TÀI KHOẢN / BẢN QUYỀN CỦA BẠN:</b>\n\n` +
      `${deliveredPayload}\n\n` +
      `<i>Cảm ơn bạn đã tin tưởng mua sắm tại <b>Shop Hai1110#</b>!</i>`;

    await bot.telegram.sendMessage(order.user.telegramId, successMsg, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🧮 Tiếp Tục Mua Sắm', callback_data: 'menu_buy', style: 'primary' }],
          [{ text: '📋 Xem Đơn Hàng Của Tôi', callback_data: 'view_orders', style: 'primary' }]
        ] as any
      }
    }).catch(err => console.error('Lỗi gửi tin nhắn giao hàng PayOS:', err));
  }

  return { ok: true, order, delivered: deliveredPayload };
}

async function createPayOSOrderLink(order: any, product: any, telegramId: string) {
  const payos = getPayOSClient();
  const orderCode = Number(Date.now().toString().slice(-7) + Math.floor(100 + Math.random() * 900));

  await prisma.order.update({
    where: { id: order.id },
    data: { code: `PO${orderCode}` }
  });

  const amount = Math.round(Number(order.total));
  const fallbackBank = process.env.VIETQR_BANK_ID || '970436';
  const fallbackAcc = process.env.VIETQR_ACCOUNT_NO || process.env.VIETQR_ACCOUNT_NUMBER || 'HAI100TR';
  const fallbackName = process.env.VIETQR_ACCOUNT_NAME || 'NGUYEN HOANG HAI';
  const fallbackBankName = process.env.VIETQR_BANK_NAME || 'Vietcombank (VCB)';

  if (!payos) {
    return {
      success: false,
      orderCode,
      code: `PO${orderCode}`,
      amount,
      bank: fallbackBank,
      acc: fallbackAcc,
      name: fallbackName,
      bankName: fallbackBankName,
      checkoutUrl: null,
      qrCodeEmvco: null
    };
  }

  try {
    const desc = `BUY ${orderCode}`.slice(0, 25);
    const botUser = (process.env.TELEGRAM_BOT_USERNAME || 'tainguyenhai1110_bot').replace('@', '');
    const qty = order.items?.[0]?.quantity || 1;
    const unitPrice = Math.round(amount / qty);
    const payment = await payos.paymentRequests.create({
      orderCode,
      amount,
      description: desc,
      returnUrl: `https://t.me/${botUser}`,
      cancelUrl: `https://t.me/${botUser}`,
      items: [
        { name: product.name.slice(0, 40), quantity: qty, price: unitPrice }
      ]
    });

    return {
      success: true,
      orderCode,
      code: `PO${orderCode}`,
      amount,
      bank: payment.bin || fallbackBank,
      acc: payment.accountNumber || fallbackAcc,
      name: payment.accountName || fallbackName,
      bankName: 'Cổng PayOS / VietQR 24/7',
      checkoutUrl: payment.checkoutUrl,
      qrCodeEmvco: payment.qrCode
    };
  } catch (err: any) {
    console.error('Lỗi gọi payos.paymentRequests.create đơn hàng:', err?.message || err);
    return {
      success: false,
      orderCode,
      code: `PO${orderCode}`,
      amount,
      bank: fallbackBank,
      acc: fallbackAcc,
      name: fallbackName,
      bankName: fallbackBankName,
      checkoutUrl: null,
      qrCodeEmvco: null
    };
  }
}

// ============================================================
// HỖ TRỢ TẠO MÃ VIETQR CHUẨN NAPAS KHÔNG LỖI ẢNH TELEGRAM
// ============================================================

function tlv(tag: string, value: string): string {
  const len = String(value.length).padStart(2, '0');
  return `${tag}${len}${value}`;
}

function crc16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function buildVietQrEmvco(bankBin: string, accountNo: string, amount: number, memo: string): string {
  const sub01 = tlv('00', bankBin) + tlv('01', accountNo);
  const tag38 = tlv('00', 'A000000727') + tlv('01', sub01) + tlv('02', 'QRIBFTTA');
  let payload = '';
  payload += tlv('00', '01');
  payload += tlv('01', '12');
  payload += tlv('38', tag38);
  payload += tlv('53', '704');
  if (amount > 0) {
    payload += tlv('54', String(Math.round(amount)));
  }
  payload += tlv('58', 'VN');
  if (memo) {
    payload += tlv('62', tlv('08', memo));
  }
  payload += '6304';
  const checksum = crc16(payload);
  return payload + checksum;
}

async function generateQrBufferFromEmvco(emvco: string, amount: number): Promise<Buffer | null> {
  try {
    const qrPng = await QRCode.toBuffer(emvco, {
      type: 'png',
      margin: 1,
      width: 380,
      errorCorrectionLevel: 'M',
      color: { dark: '#0c1829', light: '#ffffff' }
    });

    const templatePath = path.resolve(__dirname, '../assets/hai1110_qr_template.png');
    if (fs.existsSync(templatePath)) {
      const formattedAmount = `${amount.toLocaleString('vi-VN')}đ`;
      const svgText = Buffer.from(`
        <svg width="1024" height="1024">
          <style>
            .amount {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              font-size: 50px;
              font-weight: 900;
              fill: #0c1829;
              letter-spacing: -0.5px;
            }
          </style>
          <text x="676" y="912" text-anchor="middle" dominant-baseline="central" class="amount">${formattedAmount}</text>
        </svg>
      `);

      return await sharp(templatePath)
        .composite([
          { input: qrPng, left: 486, top: 323 },
          { input: svgText, left: 0, top: 0 }
        ])
        .jpeg({ quality: 95 })
        .toBuffer();
    }

    return qrPng;
  } catch (err) {
    console.error('Lỗi tạo mã QR chuyển khoản template:', err);
    return null;
  }
}

async function generateVietQrBuffer(bank: string, accountNo: string, accountName: string, amount: number, ref: string): Promise<Buffer | null> {
  const emvco = buildVietQrEmvco(bank, accountNo, amount, ref);
  return generateQrBufferFromEmvco(emvco, amount);
}

// ============================================================
// BOT TELEGRAM — TÍCH HỢP ĐẦY ĐỦ MENU SẢN PHẨM & MUA HÀNG & VIETQR
// ============================================================

let bot: Telegraf | undefined;
if (botToken) {
  bot = new Telegraf(botToken);
  isBotRunning = true;
  
  // Bắt lỗi toàn cục của Bot - Tránh mọi trường hợp lỗi làm sập tiến trình polling
  bot.catch((err: any, ctx: any) => {
    console.error(`❌ Bot unhandled error (${ctx?.updateType}):`, err?.message || err);
  });

  bot.telegram.setMyName('Shop Hai1110#').catch(err => console.error('Could not set bot display name:', err));

  const s = loadStoreSettings();
  const miniAppUrl = (s.webAppUrl || process.env.MINI_APP_URL || 'https://haiempirestore.github.io/bottesss/').trim();

  // 1. Cấu hình Menu Button cạnh thanh chat thành nút mở Mini App (web_app)
  bot.telegram.setChatMenuButton({
    menuButton: {
      type: 'web_app',
      text: '🛍️ Mini App',
      web_app: {
        url: miniAppUrl
      }
    }
  }).then(() => console.log('✅ Đã cấu hình Menu Button cạnh thanh chat mở Mini App:', miniAppUrl))
    .catch(err => console.error('Lỗi setChatMenuButton:', err));

  // 2. Cấu hình danh sách lệnh cho thanh Menu Telegram
  bot.telegram.setMyCommands([
    { command: 'start', description: 'Khởi động & Mở Menu Shop' },
    { command: 'app', description: '🛍 Mở Mini App Dino Store' },
    { command: 'products', description: '🛍 Danh sách sản phẩm đang bán' },
    { command: 'me', description: '👤 Thông tin tài khoản của bạn' },
    { command: 'orders', description: '📦 Đơn hàng đã mua & nhận key' },
    { command: 'support', description: '💬 Liên hệ hỗ trợ kỹ thuật' }
  ]).then(() => console.log('✅ Đã cấu hình danh sách lệnh Bot (/start, /app, /products...)'))
    .catch(err => console.error('Lỗi setMyCommands:', err));

  // Bàn phím chính ghim ở chân khung chat (Reply Keyboard)
  function getMainMenuKeyboard() {
    return Markup.keyboard([
      [Markup.button.webApp('🛍️ Mở Cửa Hàng Mini App', miniAppUrl)],
      ['🧮 Mua hàng', '📋 Lịch sử mua'],
      ['🤳 Hồ sơ', '⚠️ Hỗ trợ']
    ]).resize();
  }

  // Giao diện Màn hình chính chuẩn 100% theo bot ML Oder 🐲 (Tên: Shop Hai1110#) + Emoji Động
  async function sendMlOderStart(ctx: any) {
    const telegramId = String(ctx.from.id);
    const user = await prisma.user.upsert({
      where: { telegramId },
      update: { username: ctx.from.username, firstName: ctx.from.first_name },
      create: {
        telegramId,
        username: ctx.from.username,
        firstName: ctx.from.first_name,
        balance: 200000
      }
    });

    const orders = await prisma.order.findMany({
      where: { userId: user.id, status: 'DELIVERED' }
    });
    const totalSpent = orders.reduce((sum, o) => sum + Number(o.total), 0);

    const fullName = [ctx.from.first_name, ctx.from.last_name].filter(Boolean).join(' ') || ctx.from.first_name || user.username || 'Khách hàng';

    const text =
      `<tg-emoji emoji-id="5787508383145791969">👋</tg-emoji> Xin chào: 🪽 <b>${fullName}</b> 🪽\n` +
      `<tg-emoji emoji-id="5787588003249524398">🎅</tg-emoji> <b>ID:</b> <code>${telegramId}</code>\n` +
      `<tg-emoji emoji-id="5375296873982604963">💰</tg-emoji> <b>Chi tiêu:</b> ${totalSpent.toLocaleString('vi-VN')}đ`;

    const keyboard: any[] = [
      [{ text: '🛍️ Mở Mini App Dino Store ↗', web_app: { url: miniAppUrl } }],
      [{ text: '🧮 Mua hàng', callback_data: 'menu_buy', style: 'primary' }],
      [
        { text: '🤳 Hồ sơ', callback_data: 'menu_profile', style: 'success' },
        { text: '📋 Lịch sử mua', callback_data: 'view_orders', style: 'success' }
      ],
      [
        { text: '🔗 API', callback_data: 'api_register', style: 'success' },
        { text: '⚠️ Hỗ trợ', callback_data: 'view_support', style: 'success' }
      ],
      [{ text: '🌐 Ngôn ngữ / Language', callback_data: 'change_lang', style: 'primary' }]
    ];

    const bannerPath = path.resolve(__dirname, '../assets/banner_hai1110.jpg');
    const photoInput = cachedBannerFileId || (fs.existsSync(bannerPath) ? { source: bannerPath } : null);

    if (photoInput) {
      if (ctx.callbackQuery) {
        if (ctx.callbackQuery.message && 'photo' in ctx.callbackQuery.message) {
          try {
            await ctx.editMessageCaption(text, {
              parse_mode: 'HTML',
              reply_markup: { inline_keyboard: keyboard }
            });
            return;
          } catch {}
        }
        await ctx.deleteMessage().catch(() => {});
      }
      const m = await ctx.replyWithPhoto(photoInput, {
        caption: text,
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: keyboard }
      }).catch(async (err: any) => {
        console.error('Lỗi replyWithPhoto menu, chuyển fallback gửi text:', err?.message || err);
        return ctx.reply(text, {
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: keyboard }
        });
      });
      if (m && m.photo && m.photo.length > 0 && !cachedBannerFileId) {
        cachedBannerFileId = m.photo[m.photo.length - 1].file_id;
      }
    } else {
      if (ctx.callbackQuery) {
        if (ctx.callbackQuery.message && 'photo' in ctx.callbackQuery.message) {
          await ctx.deleteMessage().catch(() => {});
          return ctx.reply(text, {
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard: keyboard }
          });
        }
        await ctx.editMessageText(text, {
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: keyboard }
        }).catch(async () => {
          await ctx.reply(text, {
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard: keyboard }
          });
        });
      } else {
        await ctx.reply(text, {
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: keyboard }
        });
      }
    }
  }

  // Danh mục sản phẩm (Đồng bộ thời gian thực 100% từ Web Admin & SQLite Database)
  async function sendMlOderCategories(ctx: any) {
    const allCategories = await prisma.category.findMany({
      where: { isActive: true },
      include: {
        products: {
          where: { isActive: true },
          include: {
            stockItems: { where: { status: 'AVAILABLE' } }
          }
        }
      },
      orderBy: { sortOrder: 'asc' }
    });

    const keyboard: any[] = [];
    const catButtons = allCategories.map(cat => {
      const availableCount = cat.products.reduce((acc, p) => acc + p.stockItems.length, 0);
      const hasStock = availableCount > 0;
      return {
        text: cat.name,
        callback_data: hasStock ? `cat_slug:${cat.slug}` : `outofstock:${cat.slug}`,
        style: hasStock ? 'success' : 'danger'
      };
    });

    // Bố cục chuẩn theo ảnh mẫu ML Oder:
    // Hàng 1: 3 nút (Microsoft 365, Google One, Source Bot)
    // Hàng 2: 3 nút (Canva, ChatGPT, Tools)
    // Hàng 3: 2 nút (ExpressVPN, Dịch vụ khác)
    for (let i = 0; i < catButtons.length; i += 3) {
      keyboard.push(catButtons.slice(i, i + 3));
    }

    // Các nút tiện ích: Trở về Menu chính, Gửi yêu cầu
    keyboard.push([
      { text: '👈 Trở về', callback_data: 'back_to_main', style: 'primary' },
      { text: '🚨 Gửi yêu cầu', callback_data: 'send_request', style: 'primary' }
    ]);

    const titleText = '🛒 <b>DANH MỤC SẢN PHẨM</b>';

    if (ctx.callbackQuery) {
      if (ctx.callbackQuery.message && 'photo' in ctx.callbackQuery.message) {
        await ctx.deleteMessage().catch(() => {});
        return ctx.reply(titleText, {
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: keyboard }
        });
      }
      return ctx.editMessageText(titleText, {
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: keyboard }
      }).catch(async () => {
        await ctx.reply(titleText, {
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: keyboard }
        });
      });
    } else {
      await ctx.reply(titleText, {
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: keyboard }
      });
    }
  }

  // Xem danh sách sản phẩm theo danh mục slug
  async function sendCategoryProductsBySlug(ctx: any, slug: string) {
    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        products: {
          where: { isActive: true },
          include: { stockItems: { where: { status: 'AVAILABLE' } } },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!category) return ctx.reply('❌ Không tìm thấy danh mục này.');
    const categoryName = category.name;
    const products = category.products;

    if (products.length === 0) {
      const backBtn: any[] = [
        [{ text: '⬅️ Trở về danh mục', callback_data: 'menu_buy', style: 'primary' }],
        [{ text: '🚨 Gửi yêu cầu đặt hàng', callback_data: 'send_request', style: 'success' }]
      ];
      const emptyText = `📂 <b>Danh mục:</b> ${categoryName}\nHiện tại sản phẩm đang được cập nhật thêm. Bạn có thể bấm "🚨 Gửi yêu cầu" để đặt hàng riêng!`;
      if (ctx.callbackQuery) {
        return ctx.editMessageText(emptyText, { parse_mode: 'HTML', reply_markup: { inline_keyboard: backBtn } });
      }
      return ctx.reply(emptyText, { parse_mode: 'HTML', reply_markup: { inline_keyboard: backBtn } });
    }

    let text =
      `📂 <b>DANH MỤC: ${categoryName.toUpperCase()}</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `Chọn sản phẩm bạn muốn mua ngay bên dưới:\n\n`;

    const buttons: any[] = [];
    for (const p of products) {
      const price = p.salePrice ?? p.price;
      const stockCount = p.stockItems.length;

      text +=
        `🔹 <b>${p.name}</b>\n` +
        `• Giá bán: <b>${price.toLocaleString('vi-VN')}đ</b> ${p.salePrice ? `(Gốc: ${p.price.toLocaleString('vi-VN')}đ)` : ''}\n` +
        `• Tình trạng: ${stockCount > 0 ? `🟢 Còn ${stockCount} SP trong kho` : '🔴 Tạm hết hàng'}\n` +
        `• Mô tả: <i>${p.description || 'Giao tự động 24/7'}</i>\n\n`;

      if (stockCount > 0) {
        buttons.push([
          {
            text: `🛒 Mua: ${p.name} - ${price.toLocaleString('vi-VN')}đ`,
            callback_data: `buy:${p.id}`,
            style: 'success'
          }
        ]);
      } else {
        buttons.push([
          {
            text: `🔴 Hết hàng: ${p.name}`,
            callback_data: `product_outofstock:${p.id}`,
            style: 'danger'
          }
        ]);
      }
    }

    buttons.push([
      { text: '👈 Trở về danh mục', callback_data: 'menu_buy', style: 'primary' },
      { text: '🏠 Menu', callback_data: 'back_to_main', style: 'primary' }
    ]);

    if (ctx.callbackQuery) {
      if (ctx.callbackQuery.message && 'photo' in ctx.callbackQuery.message) {
        await ctx.deleteMessage().catch(() => {});
        return ctx.reply(text, { parse_mode: 'HTML', reply_markup: { inline_keyboard: buttons } });
      }
      await ctx.editMessageText(text, {
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: buttons }
      }).catch(async () => {
        await ctx.reply(text, { parse_mode: 'HTML', reply_markup: { inline_keyboard: buttons } });
      });
    } else {
      await ctx.reply(text, { parse_mode: 'HTML', reply_markup: { inline_keyboard: buttons } });
    }
  }

  // Màn hình Hồ sơ tài khoản (🤳 Hồ sơ)
  async function sendProfileInfo(ctx: any) {
    const telegramId = String(ctx.from.id);
    const user = await prisma.user.upsert({
      where: { telegramId },
      update: { username: ctx.from.username, firstName: ctx.from.first_name },
      create: { telegramId, username: ctx.from.username, firstName: ctx.from.first_name, balance: 0 }
    });

    const orders = await prisma.order.findMany({ where: { userId: user.id } });
    const deliveredOrders = orders.filter(o => o.status === 'DELIVERED');
    const totalSpent = deliveredOrders.reduce((sum, o) => sum + Number(o.total), 0);

    const fullName = [ctx.from.first_name, ctx.from.last_name].filter(Boolean).join(' ') || ctx.from.first_name || user.username || 'Khách hàng';
    const botUsername = (process.env.TELEGRAM_BOT_USERNAME || 'tainguyenhai1110_bot').replace('@', '');
    const refLink = `https://t.me/${botUsername}?start=ref_${telegramId}`;

    const text =
      `🤳 <b>HỒ SƠ TÀI KHOẢN CỦA BẠN</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `Xin chào: 🪽 <b>${fullName}</b> 🪽\n` +
      `🎅 ID: <code>${telegramId}</code>\n` +
      `💰 Tổng chi tiêu: <b>${totalSpent.toLocaleString('vi-VN')}đ</b>\n` +
      `📦 Đơn hàng đã mua: <b>${orders.length}</b> đơn\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `<blockquote>🪺 Link giới thiệu: ${refLink} ❞</blockquote>`;

    const buttons: any[] = [
      [
        { text: '📋 Lịch sử mua', callback_data: 'view_orders', style: 'primary' },
        { text: '⬅️ Trở về', callback_data: 'back_to_main', style: 'primary' }
      ]
    ];

    if (ctx.callbackQuery) {
      await ctx.editMessageText(text, {
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: buttons }
      }).catch(async () => {
        await ctx.reply(text, { parse_mode: 'HTML', reply_markup: { inline_keyboard: buttons } });
      });
    } else {
      await ctx.reply(text, { parse_mode: 'HTML', reply_markup: { inline_keyboard: buttons } });
    }
  }

  // Gửi yêu cầu đặt hàng riêng (🚨 Gửi yêu cầu)
  async function sendRequestToAdmin(ctx: any) {
    const text =
      `🚨 <b>GỬI YÊU CẦU ĐẶT HÀNG RIÊNG / HỖ TRỢ</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `Bạn cần tìm sản phẩm phần mềm, tài khoản bản quyền hoặc công cụ MMO chưa có trên hệ thống?\n\n` +
      `👉 Vui lòng liên hệ trực tiếp cho Admin <b>@haiempire</b> để đặt hàng và nhận báo giá ưu đãi trong 5 phút!`;

    const keyboard: any[] = [
      [{ text: '💬 Nhắn tin cho Admin ↗', url: 'https://t.me/haiempire', style: 'success' }],
      [{ text: '⬅️ Trở về danh mục', callback_data: 'menu_buy', style: 'primary' }]
    ];

    if (ctx.callbackQuery) {
      if (ctx.callbackQuery.message && 'photo' in ctx.callbackQuery.message) {
        await ctx.deleteMessage().catch(() => {});
        return ctx.reply(text, { parse_mode: 'HTML', reply_markup: { inline_keyboard: keyboard } });
      }
      await ctx.editMessageText(text, {
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: keyboard }
      }).catch(async () => {
        await ctx.reply(text, { parse_mode: 'HTML', reply_markup: { inline_keyboard: keyboard } });
      });
    } else {
      await ctx.reply(text, { parse_mode: 'HTML', reply_markup: { inline_keyboard: keyboard } });
    }
  }

  // Gửi mã QR thanh toán trực tiếp đơn hàng sản phẩm qua Cổng PayOS
  async function sendPayOSOrder(ctx: any, order: any, product: any) {
    const teleId = String(ctx.from?.id);
    const payData = await createPayOSOrderLink(order, product, teleId);
    const amount = payData.amount;
    const itemQty = order.items?.[0]?.quantity || 1;
    const qtySuffix = itemQty > 1 ? ` (SL: ${itemQty})` : '';

    const caption =
      `📲 <b>MÃ QR THANH TOÁN ĐƠN HÀNG QUA CỔNG PAYOS</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📦 <b>Sản phẩm:</b> <b>${product.name}</b>${qtySuffix}\n` +
      `💰 <b>Số tiền thanh toán:</b> <b>${amount.toLocaleString('vi-VN')}đ</b>\n` +
      `🏦 <b>Ngân hàng:</b> ${payData.bankName}\n` +
      `💳 <b>Số tài khoản:</b> <code>${payData.acc}</code>\n` +
      `👤 <b>Chủ tài khoản:</b> <code>${payData.name}</code>\n` +
      `🏷 <b>Nội dung CK:</b> <code>BUY ${payData.orderCode}</code> <i>(BẮT BUỘC ĐÚNG)</i>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `⚡ <b>Hệ thống tự động bàn giao tài khoản/key ngay khi chuyển khoản thành công!</b>`;

    const buttons: any[] = [];
    if (payData.checkoutUrl) {
      buttons.push([{ text: '🌐 Mở Trang Thanh Toán PayOS ↗', url: payData.checkoutUrl }]);
    }
    buttons.push([
      { text: '❌ Huỷ Đơn Hàng', callback_data: `cancel_order:${order.id}:${product.category?.slug || 'menu_buy'}`, style: 'danger' }
    ]);

    if (ctx.callbackQuery) {
      await ctx.deleteMessage().catch(() => {});
    }

    try {
      let qrBuffer: Buffer | null = null;
      if (payData.qrCodeEmvco) {
        qrBuffer = await generateQrBufferFromEmvco(payData.qrCodeEmvco, amount);
      } else {
        qrBuffer = await generateVietQrBuffer(payData.bank, payData.acc, payData.name, amount, `BUY ${payData.orderCode}`);
      }
      if (qrBuffer) {
        return await ctx.replyWithPhoto({ source: qrBuffer }, {
          caption,
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: buttons as any }
        });
      }
    } catch (err: any) {
      console.warn('Lỗi replyWithPhoto đơn hàng PayOS, gửi văn bản:', err?.message || err);
    }

    return await ctx.reply(caption, { parse_mode: 'HTML', reply_markup: { inline_keyboard: buttons as any } });
  }

  const sendOrderVietQR = sendPayOSOrder;

  // Lưu trạng thái sản phẩm người dùng đang xem để nhận số lượng nhập trực tiếp ở ô chat
  const userProductViewState = new Map<string, { productId: string; maxQty: number; timestamp: number }>();

  // Giao diện chi tiết sản phẩm và chọn số lượng muốn mua (khớp 100% mẫu ML Oder)
  async function sendProductDetail(ctx: any, productId: string) {
    const product = await prisma.product.findFirst({
      where: { OR: [{ id: productId }, { name: { contains: productId } }], isActive: true },
      include: {
        category: true,
        stockItems: { where: { status: 'AVAILABLE' } }
      }
    });

    if (!product) {
      if (ctx.callbackQuery) {
        return ctx.answerCbQuery('❌ Sản phẩm không tồn tại hoặc đã ngừng kinh doanh.', { show_alert: true });
      }
      return ctx.reply('❌ Sản phẩm không tồn tại hoặc đã ngừng kinh doanh.');
    }

    const stockCount = product.stockItems.length;
    if (stockCount === 0) {
      if (ctx.callbackQuery) {
        return ctx.answerCbQuery(`⚠️ Sản phẩm "${product.name}" hiện đang TẠM HẾT HÀNG!`, { show_alert: true });
      }
      return ctx.reply(`⚠️ Sản phẩm "${product.name}" hiện đang TẠM HẾT HÀNG!`);
    }

    const price = product.salePrice ?? product.price;
    const usdPrice = (price / 25000).toFixed(2);
    const prodCode = `SP-${product.id.slice(-8).toUpperCase()}`;

    // Lưu state cho user nhập số lượng trực tiếp
    const teleId = String(ctx.from?.id);
    userProductViewState.set(teleId, {
      productId: product.id,
      maxQty: stockCount,
      timestamp: Date.now()
    });

    const catIconMatch = product.category?.name ? product.category.name.match(/^(\p{Emoji_Presentation}|\p{Extended_Pictographic}|\p{Emoji})/u) : null;
    const catIcon = catIconMatch ? catIconMatch[0] : '';
    const hasLeadingEmoji = /^(\p{Emoji_Presentation}|\p{Extended_Pictographic}|\p{Emoji})/u.test(product.name);
    const title = hasLeadingEmoji ? product.name : (catIcon ? `${catIcon} ${product.name}` : product.name);

    const text =
      `<b>${title}</b>\n` +
      `🏷️ <b>Mã sản phẩm:</b> <code>${prodCode}</code>\n` +
      `💰 <b>Giá:</b> ${price.toLocaleString('vi-VN')} VND ~ $${usdPrice}\n` +
      `📦 <b>Tồn kho:</b> ${stockCount}\n` +
      `✅ <b>Trạng thái:</b> Còn hàng\n\n` +
      `📌 <b>Mô tả:</b>\n` +
      `<blockquote>${product.description || 'Sản phẩm kỹ thuật số chính hãng, bàn giao tự động 24/7.'}</blockquote>\n\n` +
      `✏️ Bạn có thể nhập số lượng muốn mua ngay ở ô chat bên dưới.`;

    const row1Buttons: any[] = [];
    row1Buttons.push({ text: '💥 Mua 1', callback_data: `buy_qty:${product.id}:1`, style: 'primary' });
    if (stockCount >= 2) {
      row1Buttons.push({ text: '💥 Mua 2', callback_data: `buy_qty:${product.id}:2`, style: 'primary' });
    }
    if (stockCount >= 5) {
      row1Buttons.push({ text: '💥 Mua 5', callback_data: `buy_qty:${product.id}:5`, style: 'primary' });
    } else if (stockCount > 2) {
      row1Buttons.push({ text: `💥 Mua ${stockCount}`, callback_data: `buy_qty:${product.id}:${stockCount}`, style: 'primary' });
    }

    const buttons: any[] = [
      row1Buttons,
      [
        { text: '📖 Nhập số lượng muốn mua', callback_data: `enter_qty:${product.id}`, style: 'primary' }
      ],
      [
        { text: '👈 Quay lại các gói', callback_data: `cat_slug:${product.category.slug}`, style: 'primary' }
      ]
    ];

    if (ctx.callbackQuery) {
      if (ctx.callbackQuery.message && 'photo' in ctx.callbackQuery.message) {
        await ctx.deleteMessage().catch(() => {});
        return ctx.reply(text, { parse_mode: 'HTML', reply_markup: { inline_keyboard: buttons as any } });
      }
      return ctx.editMessageText(text, {
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: buttons as any }
      }).catch(async () => {
        await ctx.reply(text, { parse_mode: 'HTML', reply_markup: { inline_keyboard: buttons as any } });
      });
    } else {
      await ctx.reply(text, { parse_mode: 'HTML', reply_markup: { inline_keyboard: buttons as any } });
    }
  }

  async function createPayOSOrderWithQuantity(ctx: any, productId: string, quantity: number) {
    const qty = Math.max(1, Math.floor(quantity));
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        stockItems: { where: { status: 'AVAILABLE' } }
      }
    });

    if (!product || product.stockItems.length === 0) {
      const msg = '⚠️ Sản phẩm này hiện đang tạm hết hàng trong kho!';
      if (ctx.callbackQuery) return ctx.answerCbQuery(msg, { show_alert: true });
      return ctx.reply(msg);
    }

    const stockCount = product.stockItems.length;
    if (qty > stockCount) {
      const msg = `⚠️ Số lượng bạn chọn (${qty}) vượt quá số lượng tồn kho (Còn lại: ${stockCount})!`;
      if (ctx.callbackQuery) return ctx.answerCbQuery(msg, { show_alert: true });
      return ctx.reply(msg);
    }

    const user = await prisma.user.upsert({
      where: { telegramId: String(ctx.from.id) },
      update: { username: ctx.from.username, firstName: ctx.from.first_name },
      create: { telegramId: String(ctx.from.id), username: ctx.from.username, firstName: ctx.from.first_name, balance: 0 }
    });

    const price = product.salePrice ?? product.price;
    const totalAmount = price * qty;
    const orderCode = `DH${Date.now().toString().slice(-6)}${crypto.randomInt(100, 999)}`;

    const order = await prisma.order.create({
      data: {
        code: orderCode,
        userId: user.id,
        total: totalAmount,
        status: 'PENDING',
        items: {
          create: {
            productId: product.id,
            quantity: qty,
            unitPrice: price
          }
        }
      },
      include: {
        items: true
      }
    });

    userProductViewState.delete(String(ctx.from.id));
    return sendPayOSOrder(ctx, order, product);
  }

  const sendPaymentMethodChoice = sendProductDetail;

  // Xem lịch sử đơn hàng đã mua (📋 Lịch sử mua)
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
      const emptyBtn: any[] = [
        [{ text: '🧮 Mua Hàng Ngay', callback_data: 'menu_buy', style: 'success' }],
        [{ text: '⬅️ Quay lại Menu', callback_data: 'back_to_main', style: 'primary' }]
      ];
      const emptyText = '📦 Bạn chưa có đơn hàng nào tại cửa hàng. Hãy chọn mua các sản phẩm đang có sẵn nhé!';
      if (ctx.callbackQuery) {
        return ctx.editMessageText(emptyText, { reply_markup: { inline_keyboard: emptyBtn } });
      }
      return ctx.reply(emptyText, { reply_markup: { inline_keyboard: emptyBtn } });
    }

    let text = `📦 <b>LỊCH SỬ ĐƠN HÀNG CỦA BẠN (5 đơn gần nhất):</b>\n━━━━━━━━━━━━━━━━━━━━\n`;
    for (const o of user.orders) {
      text += `🔖 <b>Mã đơn:</b> <code>${o.code}</code> | Ngày: ${o.createdAt.toLocaleDateString('vi-VN')}\n`;
      text += `💰 <b>Tổng tiền:</b> ${Number(o.total).toLocaleString('vi-VN')}đ\n`;
      for (const item of o.items) {
        text += `• <b>${item.product.name}</b> (SL: ${item.quantity})\n`;
        if (item.delivered) {
          text += `  🔑 <b>BÀN GIAO:</b>\n<code>${item.delivered}</code>\n`;
        }
      }
      text += `━━━━━━━━━━━━━━━━━━━━\n`;
    }

    const buttons: any[] = [
      [{ text: '🧮 Mua Thêm Sản Phẩm', callback_data: 'menu_buy', style: 'success' }],
      [{ text: '⬅️ Quay lại Menu', callback_data: 'back_to_main', style: 'primary' }]
    ];

    if (ctx.callbackQuery) {
      await ctx.editMessageText(text, {
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: buttons }
      }).catch(async () => {
        await ctx.reply(text, { parse_mode: 'HTML', reply_markup: { inline_keyboard: buttons } });
      });
    } else {
      await ctx.reply(text, { parse_mode: 'HTML', reply_markup: { inline_keyboard: buttons } });
    }
  }

  // Giao diện Hỗ trợ (⚠️ Hỗ trợ)
  async function sendSupport(ctx: any) {
    const text =
      `⚠️ <b>TRUNG TÂM HỖ TRỢ KHÁCH HÀNG 24/7</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `• <b>Admin hỗ trợ:</b> @haiempire\n` +
      `• <b>Thời gian làm việc:</b> 24/7 suốt ngày đêm\n\n` +
      `Bạn cần bảo hành sản phẩm, nạp tiền hoặc hỗ trợ kỹ thuật? Bấm nút nhắn tin bên dưới:`;

    const buttons: any[] = [
      [{ text: '💬 Nhắn Tin Trực Tiếp Với Admin ↗', url: 'https://t.me/haiempire', style: 'success' }],
      [{ text: '⬅️ Quay lại Menu Chính', callback_data: 'back_to_main', style: 'primary' }]
    ];

    if (ctx.callbackQuery) {
      await ctx.editMessageText(text, {
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: buttons }
      }).catch(async () => {
        await ctx.reply(text, { parse_mode: 'HTML', reply_markup: { inline_keyboard: buttons } });
      });
    } else {
      await ctx.reply(text, { parse_mode: 'HTML', reply_markup: { inline_keyboard: buttons } });
    }
  }

  // Giao diện Kết Nối API (🔗 API) -> Báo Admin chưa hỗ trợ
  async function sendApiRegister(ctx: any) {
    if (ctx.callbackQuery) {
      return ctx.answerCbQuery('⚠️ Admin chưa hỗ trợ!', { show_alert: true }).catch(() => {});
    }
    return ctx.reply('⚠️ Admin chưa hỗ trợ!');
  }

  // Giao diện Ngôn ngữ / Language (🌐 Ngôn ngữ / Language)
  async function sendLanguageChoice(ctx: any) {
    const text =
      `⚙️ <b>CÀI ĐẶT NGÔN NGỮ / LANGUAGE SETTINGS</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `Vui lòng chọn ngôn ngữ hiển thị mong muốn / Please select your preferred language:`;

    const buttons: any[] = [
      [{ text: '🇻🇳 Tiếng Việt (Mặc định)', callback_data: 'lang_vi', style: 'success' }],
      [{ text: '🇬🇧 English (Coming soon)', callback_data: 'lang_en', style: 'primary' }],
      [{ text: '⬅️ Quay lại Menu Chính', callback_data: 'back_to_main', style: 'primary' }]
    ];

    if (ctx.callbackQuery) {
      await ctx.editMessageText(text, {
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: buttons }
      }).catch(async () => {
        await ctx.reply(text, { parse_mode: 'HTML', reply_markup: { inline_keyboard: buttons } });
      });
    } else {
      await ctx.reply(text, { parse_mode: 'HTML', reply_markup: { inline_keyboard: buttons } });
    }
  }

  // --- CÁC SỰ KIỆN LỆNH & TIN NHẮN CỦA BOT ---

  // Tự động bắt mã Custom Emoji khi người dùng chuyển tiếp tin nhắn từ @MLoder_bot hoặc gửi emoji
  bot.use(async (ctx, next) => {
    const msg: any = ctx.message;
    if (msg?.entities?.some((e: any) => e.type === 'custom_emoji')) {
      const emojis = msg.entities.filter((e: any) => e.type === 'custom_emoji');
      console.log('🎯 ĐÃ BẮT ĐƯỢC CUSTOM EMOJI TỪ TIN NHẮN:', emojis);
      await ctx.reply(
        `🎉 <b>ĐÃ BẮT ĐƯỢC ${emojis.length} EMOJI ĐỘNG TỪ TIN NHẮN!</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        emojis.map((e: any, idx: number) => `• Emoji #${idx + 1}: Mã ID <code>${e.custom_emoji_id}</code>`).join('\n') +
        `\n\n✅ Đã ghi nhận mã Emoji động thành công!`,
        { parse_mode: 'HTML' }
      );
    }
    return next();
  });

  bot.start(async ctx => {
    const payload = (ctx as any).startPayload;

    // Xử lý deep-link mua hàng: ?start=buy_xxx
    if (payload && payload.startsWith('buy_')) {
      const prodId = payload.replace('buy_', '');
      return sendPaymentMethodChoice(ctx, prodId);
    }

    // Gửi ngay Màn hình chính chuẩn 100% ML Oder (Image 3)
    await sendMlOderStart(ctx);
  });

  // Xử lý các nút bấm bàn phím cố định chân chat
  bot.hears(['🛍️ Mở Cửa Hàng Mini App', '🛍️ Mini App', 'Mini App', 'miniapp'], async ctx => {
    const s = loadStoreSettings();
    const appUrl = (s.webAppUrl || process.env.MINI_APP_URL || 'https://haiempirestore.github.io/bottesss/').trim();
    return ctx.reply('✨ <b>BẤM VÀO NÚT BÊN DƯỚI ĐỂ MỞ MINI APP DINO STORE:</b>', {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🛍️ Mở Mini App Dino Store ↗', web_app: { url: appUrl } }]
        ]
      }
    });
  });
  bot.hears(['🧮 Mua hàng', 'Mua hàng', 'Sản phẩm'], ctx => sendMlOderCategories(ctx));
  bot.hears(['🤳 Hồ sơ', 'Hồ sơ', 'Tài khoản'], ctx => sendProfileInfo(ctx));
  bot.hears(['📋 Lịch sử mua', 'Đơn hàng'], ctx => sendOrderHistory(ctx));
  bot.hears(['⚠️ Hỗ trợ', 'Hỗ trợ'], ctx => sendSupport(ctx));
  bot.hears(['🔗 API', 'API', 'api'], ctx => sendApiRegister(ctx));
  bot.hears(['Menu', 'menu', 'Home', 'home'], ctx => sendMlOderStart(ctx));

  // Lệnh văn bản (/menu, /start, /app, /products, /me, /orders, /support, /api)
  bot.command(['app', 'miniapp'], async ctx => {
    const s = loadStoreSettings();
    const appUrl = (s.webAppUrl || process.env.MINI_APP_URL || 'https://haiempirestore.github.io/bottesss/').trim();
    return ctx.reply('✨ <b>BẤM VÀO NÚT BÊN DƯỚI ĐỂ MỞ MINI APP DINO STORE:</b>', {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🛍️ Mở Mini App Dino Store ↗', web_app: { url: appUrl } }]
        ]
      }
    });
  });
  bot.command(['menu', 'start'], ctx => sendMlOderStart(ctx));
  bot.command(['products', 'hang', 'shop'], ctx => sendMlOderCategories(ctx));
  bot.command(['me', 'taikhoan', 'hoso'], ctx => sendProfileInfo(ctx));
  bot.command('orders', ctx => sendOrderHistory(ctx));
  bot.command('support', ctx => sendSupport(ctx));
  bot.command('api', ctx => sendApiRegister(ctx));

  const isBotAdmin = (ctx: any) => {
    const adminIds = ['6632274262', (process.env.ADMIN_TELEGRAM_ID || '').replace('@', '')].filter(Boolean);
    return adminIds.includes(String(ctx.from?.id));
  };

  // --- XỬ LÝ CÁC NÚT BẤM INLINE (CALLBACK QUERIES) ---

  // Quay lại Menu Chính
  bot.action('back_to_main', async ctx => {
    await ctx.answerCbQuery().catch(() => {});
    await sendMlOderStart(ctx);
  });

  // Mở Danh mục sản phẩm (Image 1)
  bot.action('menu_buy', async ctx => {
    await ctx.answerCbQuery().catch(() => {});
    await sendMlOderCategories(ctx);
  });

  // Mở Hồ sơ
  bot.action('menu_profile', async ctx => {
    await ctx.answerCbQuery().catch(() => {});
    await sendProfileInfo(ctx);
  });

  // Mở Lịch sử đơn hàng
  bot.action('view_orders', async ctx => {
    await ctx.answerCbQuery().catch(() => {});
    await sendOrderHistory(ctx);
  });

  // Mở Gửi yêu cầu
  bot.action('send_request', async ctx => {
    await ctx.answerCbQuery().catch(() => {});
    await sendRequestToAdmin(ctx);
  });

  // Mở Hỗ trợ
  bot.action('view_support', async ctx => {
    await ctx.answerCbQuery().catch(() => {});
    await sendSupport(ctx);
  });

  // Mở API -> Thông báo Admin chưa hỗ trợ popup
  bot.action('api_register', async ctx => {
    await ctx.answerCbQuery('⚠️ Admin chưa hỗ trợ!', { show_alert: true }).catch(() => {});
  });

  // Mở Ngôn ngữ
  bot.action('change_lang', async ctx => {
    await ctx.answerCbQuery().catch(() => {});
    await sendLanguageChoice(ctx);
  });

  bot.action('lang_vi', async ctx => {
    await ctx.answerCbQuery('Đã lưu ngôn ngữ Tiếng Việt!').catch(() => {});
    await sendMlOderStart(ctx);
  });

  bot.action('lang_en', async ctx => {
    await ctx.answerCbQuery('English language selected!').catch(() => {});
    await sendMlOderStart(ctx);
  });

  // Mở danh mục theo slug: cat_slug:microsoft, cat_slug:chatgpt...
  bot.action(/^cat_slug:(.+)$/, async ctx => {
    await ctx.answerCbQuery().catch(() => {});
    const slug = ctx.match[1];
    await sendCategoryProductsBySlug(ctx, slug);
  });

  // Khi bấm vào danh mục hết hàng (Không chuyển tiếp, chỉ hiện alert thông báo)
  bot.action(/^outofstock:(.+)$/, async ctx => {
    const slug = ctx.match[1];
    const cat = await prisma.category.findUnique({ where: { slug } });
    const name = cat?.name || 'Sản phẩm này';
    await ctx.answerCbQuery(
      `⚠️ "${name}" hiện đang TẠM HẾT HÀNG!\n\n` +
      `Vui lòng chọn danh mục khác hoặc bấm "🚨 Gửi yêu cầu" để đặt hàng trước.`,
      { show_alert: true }
    );
  });

  // Khi bấm vào sản phẩm hết hàng (Không chuyển tiếp, chỉ hiện alert thông báo)
  bot.action(/^product_outofstock:(.+)$/, async ctx => {
    const productId = ctx.match[1];
    const p = await prisma.product.findUnique({ where: { id: productId } });
    const name = p?.name || 'Sản phẩm này';
    await ctx.answerCbQuery(
      `⚠️ Sản phẩm "${name}" hiện đang TẠM HẾT HÀNG!\n\n` +
      `Vui lòng chọn sản phẩm khác hoặc bấm "🚨 Gửi yêu cầu" để đặt hàng riêng!`,
      { show_alert: true }
    );
  });

  // Khi bấm "🛒 MUA NGAY" trên Bot -> Mở chi tiết sản phẩm và chọn số lượng muốn mua
  bot.action(/^buy:(.+)$/, async ctx => {
    await ctx.answerCbQuery().catch(() => {});
    const prodId = ctx.match[1];
    await sendProductDetail(ctx, prodId);
  });

  // Mua nhanh theo số lượng: Mua 1, Mua 2, Mua 5...
  bot.action(/^buy_qty:(.+):(\d+)$/, async ctx => {
    await ctx.answerCbQuery().catch(() => {});
    const prodId = ctx.match[1];
    const qty = parseInt(ctx.match[2], 10);
    await createPayOSOrderWithQuantity(ctx, prodId, qty);
  });

  // Bấm nút [ 📑 Nhập số lượng muốn mua ] -> Màn hình nhập số lượng ngắn gọn
  bot.action(/^enter_qty:(.+)$/, async ctx => {
    await ctx.answerCbQuery().catch(() => {});
    const prodId = ctx.match[1];
    const product = await prisma.product.findUnique({
      where: { id: prodId },
      include: { stockItems: { where: { status: 'AVAILABLE' } } }
    });

    if (!product || product.stockItems.length === 0) {
      return ctx.answerCbQuery('⚠️ Sản phẩm này hiện đang tạm hết hàng!', { show_alert: true });
    }

    const stockCount = product.stockItems.length;
    userProductViewState.set(String(ctx.from.id), {
      productId: product.id,
      maxQty: stockCount,
      timestamp: Date.now()
    });

    const text =
      `✏️ Bạn muốn mua bao nhiêu <b>${product.name}</b>?\n` +
      `Nhập số lượng từ <b>1</b> đến <b>${stockCount}</b> bằng ô chat bên dưới.`;

    const buttons = [
      [{ text: '👈 Quay lại sản phẩm', callback_data: `buy:${product.id}`, style: 'primary' }]
    ];

    if (ctx.callbackQuery) {
      if (ctx.callbackQuery.message && 'photo' in ctx.callbackQuery.message) {
        await ctx.deleteMessage().catch(() => {});
        return ctx.reply(text, { parse_mode: 'HTML', reply_markup: { inline_keyboard: buttons as any } });
      }
      return ctx.editMessageText(text, {
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: buttons as any }
      }).catch(async () => {
        await ctx.reply(text, { parse_mode: 'HTML', reply_markup: { inline_keyboard: buttons as any } });
      });
    } else {
      await ctx.reply(text, { parse_mode: 'HTML', reply_markup: { inline_keyboard: buttons as any } });
    }
  });

  // Khi chọn "📲 Chuyển khoản QR (Cổng PayOS 24/7)" (fallback)
  bot.action(/^pay_qr:(.+)$/, async ctx => {
    await ctx.answerCbQuery().catch(() => {});
    const prodId = ctx.match[1];
    await createPayOSOrderWithQuantity(ctx, prodId, 1);
  });

  // Huỷ đơn hàng thanh toán QR (Nút Huỷ duy nhất khi thanh toán QR)
  bot.action(/^cancel_order:(.+)$/, async ctx => {
    const parts = ctx.match[1].split(':');
    const orderId = parts[0];
    const backSlug = parts[1];

    await prisma.order.updateMany({
      where: { id: orderId, status: 'PENDING' },
      data: { status: 'CANCELLED' }
    });

    await ctx.answerCbQuery('Đã huỷ đơn hàng!').catch(() => {});
    await ctx.deleteMessage().catch(() => {});

    if (backSlug && backSlug !== 'menu_buy') {
      await sendCategoryProductsBySlug(ctx, backSlug);
    } else {
      await sendMlOderCategories(ctx);
    }
  });

  // Kiểm tra thanh toán đơn hàng Cổng PayOS: check_payos_order:orderId:orderCode
  bot.action(/^check_payos_order:(.+):(\d+)$/, async ctx => {
    const orderId = ctx.match[1];
    const orderCode = Number(ctx.match[2]);

    let order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true } } }
    });

    if (order?.status === 'DELIVERED') {
      const deliveredPayload = order.items.map(i => `🔹 <b>${i.product.name}:</b>\n<code>${i.delivered}</code>`).join('\n\n');
      await ctx.answerCbQuery('✅ Đơn hàng đã hoàn tất!').catch(() => {});
      return ctx.reply(
        `🎉 <b>ĐƠN HÀNG ĐÃ ĐƯỢC DUYỆT THÀNH CÔNG!</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `🔖 <b>Mã đơn:</b> <code>${order.code}</code>\n` +
        `💰 <b>Số tiền:</b> ${Number(order.total).toLocaleString('vi-VN')}đ\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `🔑 <b>THÔNG TIN GIAO HÀNG / BẢN QUYỀN:</b>\n\n` +
        `${deliveredPayload}\n\n` +
        `Cảm ơn bạn đã mua sắm tại <b>Shop Hai1110#</b>!`,
        {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🧮 Tiếp Tục Mua Sắm', callback_data: 'menu_buy', style: 'primary' }],
              [{ text: '🏠 Menu Chính', callback_data: 'back_to_main', style: 'primary' }]
            ] as any
          }
        }
      );
    }

    // Kiểm tra trực tiếp qua API PayOS
    const payos = getPayOSClient();
    if (payos && orderCode) {
      try {
        const payInfo = await payos.paymentRequests.get(orderCode);
        if (payInfo && payInfo.status === 'PAID') {
          const res = await processPayOSOrderDelivery(orderId);
          if (res.ok) {
            await ctx.answerCbQuery('🎉 Cổng PayOS đã xác nhận thanh toán! Đang bàn giao...').catch(() => {});
            return;
          }
        }
      } catch (e: any) {
        console.warn('Lỗi gọi payos.paymentRequests.get cho đơn hàng:', e?.message || e);
      }
    }

    await ctx.answerCbQuery(
      `⏳ Đơn hàng đang đợi cổng PayOS ghi nhận thanh toán (thông thường 5s - 20s sau khi chuyển khoản).\n\n` +
      `⚡ Ngay khi nhận được tiền, bot sẽ tự động xuất kho và gửi key cho bạn ngay!`,
      { show_alert: true }
    );
  });

  // Hỗ trợ callback kiểm tra cũ (fallback tương thích)
  bot.action(/^check_order:(.+)$/, async ctx => {
    const orderId = ctx.match[1];
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true } } }
    });

    if (order?.status === 'DELIVERED') {
      const deliveredPayload = order.items.map(i => `🔹 <b>${i.product.name}:</b>\n<code>${i.delivered}</code>`).join('\n\n');
      await ctx.answerCbQuery('✅ Đơn hàng đã hoàn tất!').catch(() => {});
      return ctx.reply(
        `🎉 <b>ĐƠN HÀNG ĐÃ ĐƯỢC DUYỆT THÀNH CÔNG!</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `🔖 <b>Mã đơn:</b> <code>${order.code}</code>\n` +
        `💰 <b>Số tiền:</b> ${Number(order.total).toLocaleString('vi-VN')}đ\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `🔑 <b>THÔNG TIN GIAO HÀNG / BẢN QUYỀN:</b>\n\n` +
        `${deliveredPayload}\n\n` +
        `Cảm ơn bạn đã mua sắm tại <b>Shop Hai1110#</b>!`,
        {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🧮 Tiếp Tục Mua Sắm', callback_data: 'menu_buy', style: 'primary' }],
              [{ text: '🏠 Menu Chính', callback_data: 'back_to_main', style: 'primary' }]
            ] as any
          }
        }
      );
    }

    await ctx.answerCbQuery(
      `⏳ Đơn hàng đang đợi hệ thống ghi nhận thanh toán.\n\n` +
      `⚡ Ngay khi nhận được tiền, bot sẽ tự động giao key ngay cho bạn!`,
      { show_alert: true }
    );
  });

  // Lắng nghe tin nhắn (Nhập số lượng muốn mua trực tiếp ở ô chat & Dữ liệu từ Mini App)
  bot.on('message', async (ctx, next) => {
    // Nhận dữ liệu gửi từ Mini App (web_app_data)
    if ((ctx.message as any)?.web_app_data) {
      try {
        const data = JSON.parse((ctx.message as any).web_app_data.data);
        if (data.action === 'BUY' && data.productId) {
          return sendPaymentMethodChoice(ctx, data.productId);
        }
      } catch (e) {
        console.error('Lỗi nhận dữ liệu web_app_data:', e);
      }
      return;
    }

    const teleId = String(ctx.from?.id);
    const msgText = (ctx.message as any)?.text?.trim();

    if (msgText && !msgText.startsWith('/')) {
      const state = userProductViewState.get(teleId);
      if (state && (Date.now() - state.timestamp < 15 * 60 * 1000)) {
        if (/^\d+$/.test(msgText)) {
          const qty = parseInt(msgText, 10);
          if (qty < 1) {
            return ctx.reply('⚠️ Số lượng muốn mua tối thiểu là 1! Vui lòng nhập lại số lượng:');
          }
          if (qty > state.maxQty) {
            return ctx.reply(
              `⚠️ Số lượng bạn nhập (<b>${qty}</b>) vượt quá tồn kho hiện tại (Còn lại: <b>${state.maxQty}</b>)!\n\n` +
              `👉 Vui lòng nhập số lượng nhỏ hơn hoặc bằng <b>${state.maxQty}</b>:`,
              { parse_mode: 'HTML' }
            );
          }
          return createPayOSOrderWithQuantity(ctx, state.productId, qty);
        }
      }
    }

    return next();
  });

  if ((process.env.BOT_MODE || 'polling') === 'polling') {
    bot.launch({ dropPendingUpdates: true }, () => {
      isBotRunning = true;
      console.log('🤖 Telegram Bot đã khởi chạy polling thành công theo phong cách ML Oder (Shop Hai1110#)!');
    }).catch(err => {
      isBotRunning = false;
      console.error('Bot launch failed', err);
    });
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

// ============================================================
// DINO STORE MINI APP & PARTNER API V2 ENDPOINTS (/miniapp/api/*, /api/v2/*)
// ============================================================
async function getOrCreateMiniAppUser(rawInit: string) {
  let tg: any = null;
  if (rawInit) {
    try {
      if (botToken) {
        const data = verifyTelegramInitData(rawInit, botToken);
        tg = JSON.parse(data.user || '{}');
      }
    } catch {}
    if (!tg || !tg.id) {
      try {
        const params = new URLSearchParams(rawInit);
        const uStr = params.get('user');
        if (uStr) tg = JSON.parse(uStr);
      } catch {}
    }
  }

  if (!tg || !tg.id) {
    const existing = await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } });
    if (existing) return existing;
    tg = {
      id: 'demo_user_123',
      first_name: 'Dino Member',
      username: 'dino_user'
    };
  }

  return prisma.user.upsert({
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
      balance: 100000
    }
  });
}

// 1. GET /miniapp/api/bootstrap
app.get(['/miniapp/api/bootstrap', '/api/bootstrap'], async (req, res) => {
  try {
    const rawInit = (req.headers['x-telegram-init-data'] as string) || (req.query.init_data as string) || '';
    const user = await getOrCreateMiniAppUser(rawInit);

    const dbProducts = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        category: true,
        stockItems: { where: { status: 'AVAILABLE' } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const dbCategories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' }
    });

    const userOrders = await prisma.order.findMany({
      where: { userId: user.id },
      include: {
        items: { include: { product: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    const deliveredOrders = userOrders.filter(o => o.status === 'DELIVERED');
    const totalSpent = deliveredOrders.reduce((sum, o) => sum + Number(o.total), 0);

    const botUsername = (process.env.TELEGRAM_BOT_USERNAME || 'tainguyenhai1110_bot').replace('@', '');

    const products = dbProducts.map(p => {
      const price = p.salePrice ?? p.price;
      const old_price = p.salePrice ? p.price : price;
      const stock = p.stockItems.length;
      const isSocial = /facebook|tiktok|instagram|youtube|telegram|sub|follow|buff|view|like/i.test(p.name) || p.category.slug === 'tools';
      return {
        id: p.id,
        name: p.name,
        category: p.category.name,
        price: price,
        old_price: old_price,
        stock: stock,
        description: p.description || '',
        image_url: p.imageUrl || '',
        is_flash: Boolean(p.salePrice),
        is_hot: true,
        featured: true,
        warranty: 'Bảo hành 12 tháng',
        rating: { count: 35, score: 5 },
        social: isSocial,
        minimum_quantity: 1,
        maximum_quantity: stock > 0 ? stock : 1000
      };
    });

    const orders = userOrders.map(o => ({
      code: o.code,
      order_code: o.code,
      created_at: o.createdAt.toISOString(),
      status: o.status,
      total: o.total,
      product_name: o.items[0]?.product?.name || 'Sản phẩm',
      items_count: o.items.reduce((acc, it) => acc + it.quantity, 0),
      payment_method: 'balance'
    }));

    const rankName = totalSpent > 5000000 ? 'VIP' : (totalSpent > 1000000 ? 'PRO' : 'MEMBER');

    res.json({
      ok: true,
      profile: {
        id: user.telegramId,
        name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || 'Dino Member',
        username: user.username || 'user',
        balance: user.balance,
        total_spent: totalSpent,
        rank: rankName,
        is_admin: false,
        admin_role: 'none',
        admin_capabilities: []
      },
      rank_details: {
        name: rankName,
        discount_percent: rankName === 'VIP' ? 10 : (rankName === 'PRO' ? 5 : 0)
      },
      products,
      categories: dbCategories.map(c => c.name),
      payment_methods: {
        balance: { label: 'Số dư ví Dino', enabled: true },
        bank: { label: 'Chuyển khoản VietQR', enabled: true },
        usdt: { label: 'USDT (TRC20)', enabled: true }
      },
      orders,
      recent_purchases: [
        { name: 'Nguyễn ***', product: 'ChatGPT Plus (1 Tháng)', time: '1 phút trước' },
        { name: 'Trần ***', product: 'Canva Pro Vĩnh Viễn', time: '3 phút trước' },
        { name: 'Lê ***', product: 'Office 365 1 Năm', time: '5 phút trước' },
        { name: 'Phạm ***', product: 'Netflix VIP 4K UHD', time: '8 phút trước' },
        { name: 'Hoàng ***', product: 'Google One 2TB', time: '12 phút trước' }
      ],
      usdt_rate: 25400,
      wheel: {
        spins: 1,
        total_won: 0,
        cost: 0
      },
      referral: {
        link: `https://t.me/${botUsername}?start=ref_${user.telegramId}`,
        count: 0,
        earnings: 0
      },
      netflix: {
        enabled: true,
        account: 'VIP Ultra HD'
      },
      recommendations: products.slice(0, 4),
      commerce_state: {
        favorites: [],
        cart: [],
        recent: []
      },
      bot_username: botUsername,
      miniapp_short_name: 'app',
      pending_invoice: null,
      lang: 'vi',
      demo: false
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message || 'Lỗi tải dữ liệu Mini App' });
  }
});

// 2. POST /miniapp/api/checkout/balance
app.post(['/miniapp/api/checkout/balance', '/miniapp/api/checkout'], async (req, res) => {
  try {
    const rawInit = (req.headers['x-telegram-init-data'] as string) || req.body?.init_data || '';
    const user = await getOrCreateMiniAppUser(rawInit);
    const { product_id, quantity = 1 } = req.body;
    const qty = Math.max(1, parseInt(quantity, 10) || 1);

    const product = await prisma.product.findUnique({
      where: { id: product_id },
      include: {
        stockItems: { where: { status: 'AVAILABLE' }, take: qty }
      }
    });

    if (!product) return res.status(404).json({ ok: false, message: 'Không tìm thấy sản phẩm' });
    const unitPrice = product.salePrice ?? product.price;
    const total = unitPrice * qty;

    if (user.balance < total) {
      return res.status(400).json({
        ok: false,
        message: `Số dư ví không đủ! Cần ${total.toLocaleString('vi-VN')}đ, số dư hiện tại là ${user.balance.toLocaleString('vi-VN')}đ. Vui lòng nạp thêm tiền vào ví!`
      });
    }

    if (product.stockItems.length < qty) {
      return res.status(400).json({ ok: false, message: `Kho chỉ còn ${product.stockItems.length} sản phẩm, không đủ số lượng ${qty}!` });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { balance: { decrement: total } }
    });

    const orderCode = `DINO${Date.now().toString().slice(-6)}${crypto.randomInt(100, 999)}`;
    const deliveredKeys = product.stockItems.map(s => s.payload).join('\n---\n');

    const order = await prisma.order.create({
      data: {
        code: orderCode,
        userId: user.id,
        total: total,
        status: 'DELIVERED',
        items: {
          create: {
            productId: product.id,
            quantity: qty,
            unitPrice: unitPrice,
            delivered: deliveredKeys
          }
        }
      }
    });

    const stockIds = product.stockItems.map(s => s.id);
    await prisma.stockItem.updateMany({
      where: { id: { in: stockIds } },
      data: { status: 'SOLD', soldAt: new Date(), orderItemId: order.id }
    });

    try {
      if (bot && user.telegramId && !user.telegramId.startsWith('web_') && !user.telegramId.startsWith('demo_')) {
        await bot.telegram.sendMessage(
          user.telegramId,
          `🎉 <b>ĐẶT HÀNG THÀNH CÔNG TỪ MINI APP DINO STORE!</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `📦 <b>Sản phẩm:</b> ${product.name} (SL: ${qty})\n` +
          `🔖 <b>Mã đơn:</b> <code>${orderCode}</code>\n` +
          `💰 <b>Thanh toán:</b> ${total.toLocaleString('vi-VN')}đ (Trừ số dư ví)\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `🔑 <b>THÔNG TIN BÀN GIAO:</b>\n` +
          `<code>${deliveredKeys}</code>\n\n` +
          `<i>Cảm ơn bạn đã ủng hộ shop!</i>`,
          { parse_mode: 'HTML' }
        ).catch(() => {});
      }
    } catch {}

    return res.json({
      ok: true,
      paid: true,
      balance: updatedUser.balance,
      code: orderCode,
      message: 'Thanh toán thành công! Sản phẩm đã được giao vào kho của bạn.',
      order: {
        code: orderCode,
        total: total,
        status: 'DELIVERED',
        created_at: order.createdAt.toISOString()
      }
    });
  } catch (e: any) {
    return res.status(500).json({ ok: false, message: e.message || 'Lỗi xử lý đơn hàng' });
  }
});

// 3. POST /miniapp/api/topup
app.post('/miniapp/api/topup', async (req, res) => {
  try {
    const rawInit = (req.headers['x-telegram-init-data'] as string) || req.body?.init_data || '';
    const user = await getOrCreateMiniAppUser(rawInit);
    const amount = Math.max(10000, parseInt(req.body?.amount, 10) || 100000);
    const method = req.body?.payment_method || 'bank';

    const s = loadStoreSettings();
    const bankName = s.bankName || 'MBBANK';
    const bankAcc = s.bankAccount || '0333333333';
    const bankOwner = s.bankOwner || 'NGUYEN HOANG HAI';

    const code = `NAP${Date.now().toString().slice(-6)}${crypto.randomInt(10, 99)}`;
    const qrUrl = `https://img.vietqr.io/image/${bankName}-${bankAcc}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(code)}&accountName=${encodeURIComponent(bankOwner)}`;

    await prisma.deposit.create({
      data: {
        reference: code,
        userId: user.id,
        amount: amount,
        status: 'PENDING'
      }
    }).catch(() => {});

    return res.json({
      ok: true,
      invoice: {
        payment_method: method,
        amount: amount,
        qr_url: qrUrl,
        order_code: code,
        transfer_content: code,
        copy_value: code,
        destination_label: 'MÃ HÓA ĐƠN',
        bank_name: bankName,
        account_number: bankAcc,
        account_name: bankOwner
      },
      demo: false
    });
  } catch (e: any) {
    return res.status(500).json({ ok: false, message: e.message || 'Lỗi tạo hóa đơn nạp tiền' });
  }
});

// 4. GET /miniapp/api/orders/:code/delivery
app.get('/miniapp/api/orders/:code/delivery', async (req, res) => {
  try {
    const { code } = req.params;
    const order = await prisma.order.findUnique({
      where: { code },
      include: {
        items: { include: { product: true } }
      }
    });

    if (!order) return res.status(404).json({ ok: false, message: 'Không tìm thấy đơn hàng' });
    const item = order.items[0];
    const deliveredText = item?.delivered || 'Thông tin bàn giao đang được xử lý.';
    const payloads = deliveredText.split('\n---\n').map(p => ({ payload: p.trim() }));

    return res.json({
      ok: true,
      order_code: order.code,
      product_name: item?.product?.name || 'Sản phẩm',
      count: payloads.length,
      items: payloads
    });
  } catch (e: any) {
    return res.status(500).json({ ok: false, message: e.message || 'Lỗi tải đơn hàng' });
  }
});

// 5. POST /miniapp/api/wheel/spin
app.post('/miniapp/api/wheel/spin', async (req, res) => {
  try {
    const rawInit = (req.headers['x-telegram-init-data'] as string) || req.body?.init_data || '';
    const user = await getOrCreateMiniAppUser(rawInit);

    const winAmount = 20000;
    const segmentIndex = 4; // 20.000₫ in WHEEL_SEGMENTS

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { balance: { increment: winAmount } }
    });

    return res.json({
      ok: true,
      segment_index: segmentIndex,
      prize: '20.000₫',
      balance: updated.balance,
      spins_left: 0
    });
  } catch (e: any) {
    return res.status(500).json({ ok: false, message: e.message || 'Lỗi quay vòng quay' });
  }
});

// 6. POST /miniapp/api/commerce-state
app.post('/miniapp/api/commerce-state', (req, res) => {
  return res.json({
    ok: true,
    commerce_state: {
      favorites: req.body?.favorites || [],
      recent: req.body?.recent || [],
      cart: req.body?.cart || []
    }
  });
});

// 7. POST /miniapp/api/netflix/pair-tv
app.post(['/miniapp/api/netflix/pair-tv', '/api/v2/netflix/pair-tv'], (req, res) => {
  const code = req.body?.code || req.body?.tv_code || '12345678';
  return res.json({
    ok: true,
    message: `Đã kết nối mã TV ${code} thành công vào hệ thống Netflix VIP!`
  });
});

// 8. POST /miniapp/api/social/orders
app.post(['/miniapp/api/social/orders', '/api/social/orders'], async (req, res) => {
  const { target_link } = req.body;
  const orderCode = `SMM${Date.now().toString().slice(-6)}`;
  return res.json({
    ok: true,
    paid: true,
    order_code: orderCode,
    message: `Đã tạo tiến trình buff cho ${target_link || 'liên kết'} thành công!`
  });
});

// 9. Partner API V2 Endpoints (https://api.abcxy.store/docs)
app.get(['/api/status', '/api/v2/status'], (_req, res) => {
  res.json({
    ok: true,
    status: 'ONLINE',
    version: '2.0.0',
    service: 'Dino Store Partner API V2',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/v2/catalog', async (_req, res) => {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      category: true,
      stockItems: { where: { status: 'AVAILABLE' } }
    }
  });

  res.json({
    ok: true,
    products: products.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category.name,
      price: p.salePrice ?? p.price,
      stock: p.stockItems.length,
      description: p.description
    }))
  });
});

app.get('/api/v2/me', async (_req, res) => {
  const user = await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } });
  res.json({
    ok: true,
    user: {
      id: user?.id,
      telegram_id: user?.telegramId,
      username: user?.username,
      balance: user?.balance || 0
    }
  });
});

// Phục vụ giao diện Quản trị trực tiếp trên localhost máy chủ (http://localhost:4000/admin)
app.use(express.static(frontendDist));
app.get(['/admin', '/admin.html', '/admin/*'], (_req, res, next) => {
  const adminHtml = path.join(frontendDist, 'admin.html');
  if (fs.existsSync(adminHtml)) {
    return res.sendFile(adminHtml);
  }
  const indexHtml = path.join(frontendDist, 'index.html');
  res.sendFile(indexHtml, (err) => {
    if (err) next();
  });
});

app.listen(port, () => {
  console.log(`API listening on ${port}`);
});
process.once('SIGINT', () => {
  isBotRunning = false;
  bot?.stop('SIGINT');
  process.exit(0);
});
process.once('SIGTERM', () => {
  isBotRunning = false;
  bot?.stop('SIGTERM');
  process.exit(0);
});
