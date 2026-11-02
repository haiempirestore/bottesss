import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { Telegraf, Markup } from 'telegraf';
import QRCode from 'qrcode';
import { prisma } from './db.js';
import { verifyTelegramInitData, signUser, userAuth, adminAuth, signAdmin } from './security.js';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
let cachedBannerFileId: string | null = 'AgACAgUAAxkDAAONaujxZ7AYxVLdS8BsRlpbQy7PjHgAArEVaxvpqUlXhMkMVAy8jvYBAAMCAAN5AAM9BA';

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
        const stock = await prisma.stockItem.findFirst({
          where: { productId: item.productId, status: 'AVAILABLE' }
        });

        if (stock) {
          await prisma.stockItem.update({
            where: { id: stock.id },
            data: { status: 'SOLD', soldAt: new Date(), orderItemId: item.id }
          });
          await prisma.orderItem.update({
            where: { id: item.id },
            data: { delivered: stock.payload }
          });
          deliveredPayloads.push(`🔹 <b>${item.product.name}:</b>\n<code>${stock.payload}</code>`);
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
              [{ text: '🩵 Xem Ví & Số Dư', callback_data: 'menu_wallet', style: 'primary' }]
            ] as any
          }
        }
      ).catch(err => console.error('Lỗi gửi tin nhắn nạp tiền qua Telegram:', err));
    }

    return { success: true, type: 'DEPOSIT', targetTeleId, amount, newBalance };
  }

  return { success: false, message: 'Không tìm thấy thông tin đơn hàng hoặc mã nạp tiền phù hợp trong nội dung' };
}

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
        bankId: process.env.VIETQR_BANK_ID || '970436',
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

async function generateVietQrBuffer(bank: string, accountNo: string, accountName: string, amount: number, ref: string): Promise<Buffer | null> {
  // Ưu tiên 1: Lấy mẫu VietQR giao diện đẹp từ API chính thức
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const res = await fetch('https://api.vietqr.io/v2/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accountNo,
        accountName,
        acqId: bank,
        amount,
        addInfo: ref,
        format: 'text',
        template: 'compact2'
      }),
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data: any = await res.json();
      if (data?.data?.qrDataURL) {
        const base64Data = data.data.qrDataURL.replace(/^data:image\/\w+;base64,/, '');
        return Buffer.from(base64Data, 'base64');
      }
      if (data?.data?.qrCode) {
        return await QRCode.toBuffer(data.data.qrCode, { type: 'png', margin: 2, width: 450 });
      }
    }
  } catch (_e) {
    // API mạng ngoài bận hoặc chậm -> Tự động chuyển qua tạo cục bộ
  }

  // Ưu tiên 2: Tự tạo chuỗi EMVCo VietQR chuẩn NAPAS cục bộ (100% không lo lỗi mạng hay Telegram từ chối)
  try {
    const emvco = buildVietQrEmvco(bank, accountNo, amount, ref);
    return await QRCode.toBuffer(emvco, { type: 'png', margin: 2, width: 450 });
  } catch (err) {
    console.error('Lỗi tạo mã QR cục bộ:', err);
    return null;
  }
}

// ============================================================
// BOT TELEGRAM — TÍCH HỢP ĐẦY ĐỦ MENU SẢN PHẨM & MUA HÀNG & VIETQR
// ============================================================

let bot: Telegraf | undefined;
if (botToken) {
  bot = new Telegraf(botToken);
  
  // Bắt lỗi toàn cục của Bot - Tránh mọi trường hợp lỗi làm sập tiến trình polling
  bot.catch((err: any, ctx: any) => {
    console.error(`❌ Bot unhandled error (${ctx?.updateType}):`, err?.message || err);
  });

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
    return Markup.keyboard([
      [Markup.button.webApp('🛍️ Shop Hai1110# Mini App', 'https://haiempirestore.github.io/bottesss/')],
      ['🧮 Mua hàng', '🩵 Ví'],
      ['🤳 Hồ sơ', '📋 Lịch sử mua'],
      ['🎮 Trò Chơi', '⚠️ Hỗ trợ']
    ]).resize();
  }

  // Giao diện Màn hình chính chuẩn 100% theo bot ML Oder 🐲 (Tên: Shop Hai1110#) + Emoji Động + Giữ Mini App
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
    const botUsername = (process.env.TELEGRAM_BOT_USERNAME || 'tainguyenhai1110_bot').replace('@', '');
    const refLink = `https://t.me/${botUsername}?start=ref_${telegramId}`;

    const text =
      `<tg-emoji emoji-id="5787508383145791969">👋</tg-emoji> Xin chào: 🪽 <b>${fullName}</b> 🪽\n` +
      `<tg-emoji emoji-id="5787588003249524398">🎅</tg-emoji> <b>ID:</b> <code>${telegramId}</code>\n` +
      `<tg-emoji emoji-id="5375296873982604963">💰</tg-emoji> <b>Chi tiêu:</b> ${totalSpent.toLocaleString('vi-VN')}đ\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `<blockquote><tg-emoji emoji-id="5787664479437197928">✨</tg-emoji> Link giới thiệu: ${refLink} ❞</blockquote>\n\n` +
      `<b>VUI LÒNG CHỌN MENU</b> <tg-emoji emoji-id="5470177992950946662">👇</tg-emoji>`;

    const keyboard: any[] = [
      [{ text: '🛍️ Mở Mini App (Shop Hai1110#)', web_app: { url: 'https://haiempirestore.github.io/bottesss/' }, style: 'success' }],
      [{ text: '🧮 Mua hàng', callback_data: 'menu_buy', style: 'primary' }],
      [
        { text: '🤳 Hồ sơ', callback_data: 'menu_profile', style: 'success' },
        { text: '📋 Lịch sử mua', callback_data: 'view_orders', style: 'success' }
      ],
      [
        { text: '🩵 Ví', callback_data: 'menu_wallet', style: 'success' },
        { text: '🎮 Trò Chơi', callback_data: 'menu_games', style: 'success' }
      ],
      [
        { text: '🔗 API', callback_data: 'api_register', style: 'success' },
        { text: '⚠️ Hỗ trợ', callback_data: 'view_support', style: 'success' }
      ],
      [{ text: '🌐 Ngôn ngữ / Language', callback_data: 'change_lang', style: 'primary' }]
    ];

    if (ctx.callbackQuery) {
      if (ctx.callbackQuery.message && 'photo' in ctx.callbackQuery.message) {
        await ctx.deleteMessage().catch(() => {});
        const m = await ctx.reply(text, {
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: keyboard }
        });
        await ctx.telegram.setMessageReaction(ctx.chat.id, m.message_id, [{ type: 'emoji', emoji: '🔥' }]).catch(() => {});
        return;
      }
      await ctx.editMessageText(text, {
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: keyboard }
      }).catch(async () => {
        const m = await ctx.reply(text, {
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: keyboard }
        });
        await ctx.telegram.setMessageReaction(ctx.chat.id, m.message_id, [{ type: 'emoji', emoji: '🔥' }]).catch(() => {});
      });
    } else {
      const m = await ctx.reply(text, {
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: keyboard }
      });
      await ctx.telegram.setMessageReaction(ctx.chat.id, m.message_id, [{ type: 'emoji', emoji: '🔥' }]).catch(() => {});
    }
  }

  // Danh mục sản phẩm (Hiện ảnh banner Hai1110# Shop, nút màu Xanh khi còn hàng, màu Đỏ khi hết hàng)
  async function sendMlOderCategories(ctx: any) {
    const allCategories = await prisma.category.findMany({
      include: {
        products: {
          where: { isActive: true },
          include: {
            stockItems: { where: { status: 'AVAILABLE' } }
          }
        }
      }
    });

    // Lấy thông tin nút danh mục: Còn hàng -> Xanh (success) & mở sp; Hết hàng -> Đỏ (danger) & callback hết hàng
    const getCatBtn = (slug: string, label: string) => {
      const cat = allCategories.find(c => c.slug === slug);
      const availableCount = cat ? cat.products.reduce((acc, p) => acc + p.stockItems.length, 0) : 0;
      const hasStock = availableCount > 0;
      return {
        text: label,
        callback_data: hasStock ? `cat_slug:${slug}` : `outofstock:${slug}`,
        style: hasStock ? 'success' : 'danger'
      };
    };

    const keyboard: any[] = [
      [
        getCatBtn('microsoft', '🟩 Microsoft'),
        getCatBtn('google', '✨ Google')
      ],
      [
        getCatBtn('canva', '🎨 Canva'),
        getCatBtn('chatgpt', '🤖 ChatGPT')
      ],
      [
        getCatBtn('capcut', '✂️ Capcut'),
        getCatBtn('tools', '⚙️ Tools')
      ],
      [
        getCatBtn('duolingo', '🦉 Duolingo'),
        getCatBtn('expressvpn', '🛡️ ExpressVPN')
      ],
      [
        getCatBtn('source-code', '📦 Source Code'),
        getCatBtn('dich-vu-khac', '⭐ Dịch vụ khác')
      ],
      [
        { text: '⬅️ Trở về', callback_data: 'back_to_main', style: 'primary' },
        { text: '🚨 Gửi yêu cầu', callback_data: 'send_request', style: 'primary' }
      ]
    ];

    const bannerPath = path.resolve(__dirname, '../assets/banner_hai1110.jpg');

    if (ctx.callbackQuery) {
      await ctx.deleteMessage().catch(() => {});
    }

    const photoInput = cachedBannerFileId || (fs.existsSync(bannerPath) ? { source: bannerPath } : null);

    if (photoInput) {
      const m = await ctx.replyWithPhoto(photoInput, {
        caption: '🧑‍💼 <b>DANH MỤC SẢN PHẨM</b>',
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: keyboard }
      }).catch(async (err: any) => {
        console.error('Lỗi replyWithPhoto, chuyển fallback gửi text:', err?.message || err);
        return ctx.reply('🧑‍💼 <b>DANH MỤC SẢN PHẨM</b>', {
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: keyboard }
        });
      });
      if (m && m.photo && m.photo.length > 0 && !cachedBannerFileId) {
        cachedBannerFileId = m.photo[m.photo.length - 1].file_id;
      }
    } else {
      await ctx.reply('🧑‍💼 <b>DANH MỤC SẢN PHẨM</b>', {
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: keyboard }
      });
    }
  }

  // Màn hình Ví Của Bạn (Chuẩn 100% icon và màu sắc như Image 2 + Emoji Động)
  async function sendMlOderWallet(ctx: any) {
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

    const balance = Number(user.balance);

    const text =
      `👛 <b>VÍ CỦA BẠN</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `💰 Số dư hiện tại: <b>${balance.toLocaleString('vi-VN')}đ</b>\n\n` +
      `📖 Bạn cũng có thể nhập số tiền muốn nạp ngay ở ô chat bên dưới.\n` +
      `👇 Nạp tối thiểu: <b>10.000đ</b>\n` +
      `Ví dụ: <code>50000</code>`;

    const keyboard: any[] = [
      [{ text: '✏️ Nhập số tiền muốn nạp', callback_data: 'enter_deposit_amount', style: 'success' }],
      [
        { text: '⬅️ Menu', callback_data: 'back_to_main', style: 'primary' },
        { text: '🧾 Lịch sử nạp', callback_data: 'deposit_history', style: 'primary' }
      ]
    ];

    if (ctx.callbackQuery) {
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

    if (category.products.length === 0) {
      const backBtn: any[] = [
        [{ text: '⬅️ Trở về danh mục', callback_data: 'menu_buy', style: 'primary' }],
        [{ text: '🚨 Gửi yêu cầu đặt hàng', callback_data: 'send_request', style: 'success' }]
      ];
      const emptyText = `📂 <b>Danh mục:</b> ${category.name}\nHiện tại sản phẩm đang được cập nhật thêm. Bạn có thể bấm "🚨 Gửi yêu cầu" để đặt hàng riêng!`;
      if (ctx.callbackQuery) {
        return ctx.editMessageText(emptyText, { parse_mode: 'HTML', reply_markup: { inline_keyboard: backBtn } });
      }
      return ctx.reply(emptyText, { parse_mode: 'HTML', reply_markup: { inline_keyboard: backBtn } });
    }

    let text =
      `📂 <b>DANH MỤC: ${category.name.toUpperCase()}</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `Chọn sản phẩm bạn muốn mua ngay bên dưới:\n\n`;

    const buttons: any[] = [];
    for (const p of category.products) {
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
      { text: '⬅️ Trở về danh mục', callback_data: 'menu_buy', style: 'primary' },
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
      create: { telegramId, username: ctx.from.username, firstName: ctx.from.first_name, balance: 200000 }
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
      `💰 Chi tiêu: <b>${totalSpent.toLocaleString('vi-VN')}đ</b>\n` +
      `👛 Số dư ví: <b>${Number(user.balance).toLocaleString('vi-VN')}đ</b>\n` +
      `📦 Đơn hàng đã mua: <b>${orders.length}</b> đơn\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `<blockquote>🪺 Link giới thiệu: ${refLink} ❞</blockquote>`;

    const buttons: any[] = [
      [{ text: '🩵 Nạp tiền vào ví', callback_data: 'menu_wallet', style: 'success' }],
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

  // Màn hình Trò chơi & Điểm danh (🎮 Trò Chơi)
  async function sendGamesMenu(ctx: any) {
    const text =
      `🎮 <b>TRÒ CHƠI & ĐIỂM DANH MAY MẮN</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🎁 Mỗi ngày bạn có 1 lượt điểm danh nhận thưởng ngẫu nhiên từ <b>1.000đ</b> đến <b>10.000đ</b> vào ví!\n` +
      `Bấm nút điểm danh bên dưới để nhận ngay:`;

    const buttons: any[] = [
      [{ text: '🎁 Điểm danh nhận thưởng (+5.000đ)', callback_data: 'daily_reward', style: 'success' }],
      [{ text: '⬅️ Menu Chính', callback_data: 'back_to_main', style: 'primary' }]
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

  // Lịch sử nạp tiền (🧾 Lịch sử nạp)
  async function sendDepositHistory(ctx: any) {
    const telegramId = String(ctx.from.id);
    const user = await prisma.user.findUnique({ where: { telegramId } });
    const deposits = user ? await prisma.deposit.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 5 }) : [];

    let text = `🧾 <b>LỊCH SỬ NẠP TIỀN CỦA BẠN</b>\n━━━━━━━━━━━━━━━━━━━━\n`;
    if (deposits.length === 0) {
      text += `Hiện tại bạn chưa có giao dịch nạp tiền nào.\n`;
    } else {
      for (const d of deposits) {
        const icon = d.status === 'PAID' ? '🟢 Thành công' : '⏳ Đang chờ';
        text += `• ${d.reference}: +${Number(d.amount).toLocaleString('vi-VN')}đ (${icon})\n`;
      }
    }

    const buttons: any[] = [
      [{ text: '✏️ Nạp thêm tiền', callback_data: 'enter_deposit_amount', style: 'success' }],
      [{ text: '⬅️ Trở về ví', callback_data: 'menu_wallet', style: 'primary' }]
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

  // Menu chọn số tiền nạp & Hỗ trợ nhập số tiền muốn nạp
  async function sendDepositMenu(ctx: any) {
    const bankName = process.env.VIETQR_BANK_NAME || 'Vietcombank (VCB)';
    const acc = process.env.VIETQR_ACCOUNT_NO || process.env.VIETQR_ACCOUNT_NUMBER || 'HAI100TR';
    const name = process.env.VIETQR_ACCOUNT_NAME || 'NGUYEN HOANG HAI';
    const text =
      `💳 <b>NẠP TIỀN VÀO VÍ TỰ ĐỘNG QUA VIETQR</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `• <b>Ngân hàng:</b> ${bankName}\n` +
      `• <b>STK nhận:</b> <code>${acc}</code>\n` +
      `• <b>Chủ tài khoản:</b> <b>${name}</b>\n` +
      `• Nạp tối thiểu: <b>10.000đ</b> (Tự động 24/7)\n\n` +
      `👇 <b>Hãy nhập số tiền bạn muốn nạp vào ô chat</b> (VD: <code>50000</code> hoặc <code>50k</code>, <code>100k</code>...)\n` +
      `<i>Hoặc bấm chọn nhanh các mốc bên dưới:</i>`;

    const buttons: any[] = [
      [
        { text: '💵 20.000đ', callback_data: 'nap:20000', style: 'primary' },
        { text: '💵 50.000đ', callback_data: 'nap:50000', style: 'primary' }
      ],
      [
        { text: '💵 100.000đ', callback_data: 'nap:100000', style: 'primary' },
        { text: '💵 200.000đ', callback_data: 'nap:200000', style: 'primary' }
      ],
      [
        { text: '💵 500.000đ', callback_data: 'nap:500000', style: 'primary' },
        { text: '💵 1.000.000đ', callback_data: 'nap:1000000', style: 'primary' }
      ],
      [
        { text: '⬅️ Trở về ví', callback_data: 'menu_wallet', style: 'primary' }
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

    // Gửi prompt ForceReply để mở ngay ô nhập liệu
    await ctx.reply(
      `✍️ <b>Vui lòng nhập số tiền bạn muốn nạp vào ô chat:</b>\n` +
      `<i>(Tối thiểu 10.000đ — Ví dụ: 50000 hoặc 50k, 100k...)</i>`,
      {
        parse_mode: 'HTML',
        reply_markup: {
          force_reply: true,
          input_field_placeholder: 'Nhập số tiền muốn nạp (Tối thiểu 10.000đ)...'
        }
      }
    ).catch(() => {});
  }

  // Tạo & Gửi ảnh mã QR nạp tiền an toàn (Tự động duyệt khi nhận số dư ngân hàng - Đã bỏ nút xác nhận thủ công)
  async function sendVietQR(ctx: any, amount: number, headerNotice?: string) {
    const bank = process.env.VIETQR_BANK_ID || '970436';
    const acc = process.env.VIETQR_ACCOUNT_NO || process.env.VIETQR_ACCOUNT_NUMBER || 'HAI100TR';
    const name = process.env.VIETQR_ACCOUNT_NAME || 'NGUYEN HOANG HAI';
    const bankName = process.env.VIETQR_BANK_NAME || 'Vietcombank (VCB)';
    const teleId = String(ctx.from.id);
    const ref = `NAP${teleId}`;

    const user = await prisma.user.upsert({
      where: { telegramId: teleId },
      update: { username: ctx.from.username, firstName: ctx.from.first_name },
      create: { telegramId: teleId, username: ctx.from.username, firstName: ctx.from.first_name, balance: 200000 }
    });

    await prisma.deposit.upsert({
      where: { reference: ref },
      update: { amount, status: 'PENDING' },
      create: { reference: ref, userId: user.id, amount, status: 'PENDING' }
    }).catch(() => {});

    let caption = '';
    if (headerNotice) {
      caption += `${headerNotice}\n\n`;
    }
    caption +=
      `📲 <b>MÃ QR CHUYỂN KHOẢN NẠP TIỀN VÀO VÍ</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🏦 <b>Ngân hàng:</b> ${bankName}\n` +
      `💳 <b>Số tài khoản:</b> <code>${acc}</code>\n` +
      `👤 <b>Tên chủ TK:</b> <code>${name}</code>\n` +
      `💰 <b>Số tiền nạp:</b> <b>${amount.toLocaleString('vi-VN')}đ</b>\n` +
      `🏷 <b>Nội dung CK:</b> <code>${ref}</code> <i>(BẮT BUỘC ĐÚNG)</i>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `⚡ <b>Hệ thống tự động bàn giao khi xác nhận chuyển khoản</b>`;

    const buttons = [
      [{ text: '❌ Huỷ', callback_data: 'cancel_deposit', style: 'danger' }]
    ];

    if (ctx.callbackQuery) {
      await ctx.deleteMessage().catch(() => {});
    }

    try {
      const qrBuffer = await generateVietQrBuffer(bank, acc, name, amount, ref);
      if (qrBuffer) {
        return await ctx.replyWithPhoto({ source: qrBuffer }, {
          caption,
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: buttons as any }
        });
      }
    } catch (err: any) {
      console.warn('Lỗi replyWithPhoto, tự động chuyển gửi văn bản:', err?.message || err);
    }

    return await ctx.reply(caption, { parse_mode: 'HTML', reply_markup: { inline_keyboard: buttons as any } });
  }

  // Gửi mã VietQR thanh toán trực tiếp đơn hàng sản phẩm
  async function sendOrderVietQR(ctx: any, order: any, product: any) {
    const bank = process.env.VIETQR_BANK_ID || '970436';
    const acc = process.env.VIETQR_ACCOUNT_NO || process.env.VIETQR_ACCOUNT_NUMBER || 'HAI100TR';
    const name = process.env.VIETQR_ACCOUNT_NAME || 'NGUYEN HOANG HAI';
    const bankName = process.env.VIETQR_BANK_NAME || 'Vietcombank (VCB)';
    const amount = Number(order.total);
    const ref = `BUY${order.code}`;

    const caption =
      `📲 <b>MÃ QR CHUYỂN KHOẢN THANH TOÁN ĐƠN HÀNG</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📦 <b>Sản phẩm:</b> <b>${product.name}</b>\n` +
      `💰 <b>Số tiền thanh toán:</b> <b>${amount.toLocaleString('vi-VN')}đ</b>\n` +
      `🏦 <b>Ngân hàng:</b> ${bankName}\n` +
      `💳 <b>Số tài khoản:</b> <code>${acc}</code>\n` +
      `👤 <b>Tên chủ TK:</b> <code>${name}</code>\n` +
      `🏷 <b>Nội dung CK:</b> <code>${ref}</code> <i>(BẮT BUỘC ĐÚNG)</i>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `⚡ <b>Hệ thống tự động bàn giao khi xác nhận chuyển khoản</b>`;

    const buttons = [
      [{ text: '❌ Huỷ', callback_data: `cancel_order:${order.id}:${product.category?.slug || 'menu_buy'}`, style: 'danger' }]
    ];

    if (ctx.callbackQuery) {
      await ctx.deleteMessage().catch(() => {});
    }

    try {
      const qrBuffer = await generateVietQrBuffer(bank, acc, name, amount, ref);
      if (qrBuffer) {
        return await ctx.replyWithPhoto({ source: qrBuffer }, {
          caption,
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: buttons as any }
        });
      }
    } catch (err: any) {
      console.warn('Lỗi replyWithPhoto đơn hàng, chuyển gửi văn bản:', err?.message || err);
    }

    return await ctx.reply(caption, { parse_mode: 'HTML', reply_markup: { inline_keyboard: buttons as any } });
  }

  // Xác nhận mua hàng & Lựa chọn phương thức thanh toán (Ví hoặc Chuyển khoản QR)
  async function sendPaymentMethodChoice(ctx: any, productId: string) {
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

    const user = await prisma.user.upsert({
      where: { telegramId: String(ctx.from.id) },
      update: { username: ctx.from.username, firstName: ctx.from.first_name },
      create: { telegramId: String(ctx.from.id), username: ctx.from.username, firstName: ctx.from.first_name, balance: 200000 }
    });

    const price = product.salePrice ?? product.price;
    const balance = Number(user.balance);
    const canPayWallet = balance >= price;

    const text =
      `🛍️ <b>XÁC NHẬN MUA HÀNG & CHỌN PHƯƠNG THỨC THANH TOÁN</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📦 <b>Sản phẩm:</b> <b>${product.name}</b>\n` +
      `💰 <b>Giá thanh toán:</b> <b>${price.toLocaleString('vi-VN')}đ</b> ${product.salePrice ? `<i>(Gốc: ${product.price.toLocaleString('vi-VN')}đ)</i>` : ''}\n` +
      `⚡ <b>Tình trạng kho:</b> Còn ${stockCount} tài khoản/key sẵn sàng giao ngay 24/7\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `👛 <b>Số dư ví của bạn:</b> <b>${balance.toLocaleString('vi-VN')}đ</b>\n\n` +
      `👉 <b>Vui lòng chọn phương thức thanh toán:</b>`;

    const buttons = [
      [
        {
          text: canPayWallet
            ? `👛 Thanh toán bằng Số Dư Ví (${price.toLocaleString('vi-VN')}đ)`
            : `👛 Số Dư Ví (Thiếu ${(price - balance).toLocaleString('vi-VN')}đ)`,
          callback_data: `pay_wallet:${product.id}`,
          style: canPayWallet ? 'success' : 'danger'
        }
      ],
      [
        {
          text: `📲 Chuyển khoản QR (VietQR VCB)`,
          callback_data: `pay_qr:${product.id}`,
          style: 'success'
        }
      ],
      [
        { text: '⬅️ Quay lại danh mục', callback_data: `cat_slug:${product.category.slug}`, style: 'primary' },
        { text: '🏠 Menu Chính', callback_data: 'back_to_main', style: 'primary' }
      ]
    ];

    if (ctx.callbackQuery) {
      if (ctx.callbackQuery.message && 'photo' in ctx.callbackQuery.message) {
        await ctx.deleteMessage().catch(() => {});
        return ctx.reply(text, { parse_mode: 'HTML', reply_markup: { inline_keyboard: buttons as any } });
      }
      await ctx.editMessageText(text, {
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: buttons as any }
      }).catch(async () => {
        await ctx.reply(text, { parse_mode: 'HTML', reply_markup: { inline_keyboard: buttons as any } });
      });
    } else {
      await ctx.reply(text, { parse_mode: 'HTML', reply_markup: { inline_keyboard: buttons as any } });
    }
  }

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

  // Giao diện Kết Nối API (🔗 API)
  async function sendApiRegister(ctx: any) {
    const text =
      `🔗 <b>CỔNG KẾT NỐI API SHOP HAI1110#</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `Hệ thống hỗ trợ tích hợp API cho Shop / Website / Bot Telegram tự động lấy key & nạp tiền:\n\n` +
      `• <b>API Endpoint:</b> <code>https://shop.local/api</code>\n` +
      `• <b>Định dạng:</b> JSON REST API v1\n` +
      `• <b>Xác thực:</b> Bearer Token (Bảo mật 2 lớp)\n` +
      `• <b>Tốc độ trả key:</b> Dưới 50ms tức thì\n\n` +
      `👉 Để đăng ký tài khoản API đối tác, vui lòng nhắn tin trực tiếp cho Admin <b>@haiempire</b> để nhận chiết khấu đại lý tốt nhất!`;

    const buttons: any[] = [
      [{ text: '💳 Nạp Tiền Vào Ví API', callback_data: 'enter_deposit_amount', style: 'success' }],
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

    // Xử lý deep-link nạp tiền: ?start=nap_xxx
    if (payload && payload.startsWith('nap_')) {
      const amount = Number(payload.replace('nap_', '')) || 50000;
      return sendVietQR(ctx, amount);
    }

    // Gửi sticker hoạt hình vẫy chào chuyển động 60fps
    await ctx.sendSticker('CAACAgEAAxUAAWro2cnnMsee-1LZyo8asXjsPDtPAAKlAgACRv7wRzjrsF8nFDx2PQQ').catch(() => {});

    const replyKb = getMainMenuKeyboard();
    const userCallingName = [ctx.from.first_name, ctx.from.last_name].filter(Boolean).join(' ') || ctx.from.first_name || ctx.from.username || 'Quý khách';
    await ctx.reply(
      `👋 Xin chào <b>${userCallingName}</b>!\n` +
      `Chào mừng bạn đến với <b>Shop Hai1110#</b> — Bot tự động giao hàng 24/7!`,
      { parse_mode: 'HTML', ...replyKb }
    );

    // Gửi ngay Màn hình chính chuẩn 100% ML Oder (Image 3)
    await sendMlOderStart(ctx);
  });

  // Xử lý các nút bấm bàn phím cố định chân chat
  bot.hears(['🧮 Mua hàng', 'Mua hàng', 'Sản phẩm'], ctx => sendMlOderCategories(ctx));
  bot.hears(['🩵 Ví', 'Ví', 'Nạp tiền'], ctx => sendMlOderWallet(ctx));
  bot.hears(['🤳 Hồ sơ', 'Hồ sơ', 'Tài khoản'], ctx => sendProfileInfo(ctx));
  bot.hears(['📋 Lịch sử mua', 'Đơn hàng'], ctx => sendOrderHistory(ctx));
  bot.hears(['🎮 Trò Chơi', 'Trò chơi'], ctx => sendGamesMenu(ctx));
  bot.hears(['⚠️ Hỗ trợ', 'Hỗ trợ'], ctx => sendSupport(ctx));
  bot.hears(['Menu', 'menu', 'Home', 'home'], ctx => sendMlOderStart(ctx));

  bot.hears(['🛍️ Shop Hai1110# Mini App', 'Mini App', 'miniapp', 'App'], ctx => {
    return ctx.reply('🛍️ Bấm vào nút bên dưới để mở Mini App Shop Hai1110#:', {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🛍️ Mở Mini App (Shop Hai1110#)', web_app: { url: 'https://haiempirestore.github.io/bottesss/' }, style: 'success', icon_custom_emoji_id: '5373052667671093676' }]
        ] as any
      }
    });
  });
  bot.command(['app', 'miniapp'], ctx => {
    return ctx.reply('🛍️ Bấm vào nút bên dưới để mở Mini App Shop Hai1110#:', {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🛍️ Mở Mini App (Shop Hai1110#)', web_app: { url: 'https://haiempirestore.github.io/bottesss/' }, style: 'success', icon_custom_emoji_id: '5373052667671093676' }]
        ] as any
      }
    });
  });

  // Lệnh văn bản (/menu, /start, /products, /nap, /me, /orders, /support, /congtien)
  bot.command(['menu', 'start'], ctx => sendMlOderStart(ctx));
  bot.command(['products', 'hang', 'shop'], ctx => sendMlOderCategories(ctx));
  bot.command(['nap', 'deposit'], ctx => sendMlOderWallet(ctx));
  bot.command(['me', 'vi', 'taikhoan', 'hoso'], ctx => sendProfileInfo(ctx));
  bot.command('orders', ctx => sendOrderHistory(ctx));
  bot.command('support', ctx => sendSupport(ctx));

  // Lệnh hỗ trợ cộng tiền ví nhanh khi thử nghiệm
  bot.command(['congtien', 'topup'], async ctx => {
    const parts = (ctx.message as any).text.split(' ').filter(Boolean);
    const amount = Number(parts[1]) || 200000;
    const targetTeleId = parts[2] ? parts[2] : String(ctx.from.id);

    const user = await prisma.user.upsert({
      where: { telegramId: targetTeleId },
      update: { balance: { increment: amount } },
      create: { telegramId: targetTeleId, username: ctx.from.username, firstName: ctx.from.first_name, balance: amount }
    });

    await ctx.reply(
      `🎉 <b>ĐÃ CỘNG TIỀN VÀO VÍ THÀNH CÔNG!</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `👤 <b>Khách hàng:</b> ${user.firstName || user.username || targetTeleId}\n` +
      `➕ <b>Số tiền cộng:</b> +${amount.toLocaleString('vi-VN')}đ\n` +
      `💰 <b>Số dư ví hiện tại:</b> ${Number(user.balance).toLocaleString('vi-VN')}đ`,
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🧮 Mua Hàng Ngay', callback_data: 'menu_buy', style: 'success' }],
            [{ text: '🏠 Menu Chính', callback_data: 'back_to_main', style: 'primary' }]
          ] as any
        }
      }
    );
  });

  // Lệnh giả lập duyệt nạp ngân hàng nhanh (/duyetnap <teleId> <amount>)
  bot.command('duyetnap', async ctx => {
    const parts = (ctx.message as any).text.split(' ').filter(Boolean);
    const targetTeleId = parts[1] || String(ctx.from.id);
    const amount = Number(parts[2]) || 50000;
    const res = await handleIncomingBankTransfer(`NAP${targetTeleId}`, amount, `CMD_${Date.now()}`);
    await ctx.reply(`⚡ Kết quả tự động duyệt: ${JSON.stringify(res)}`);
  });

  // Lệnh giả lập biến động số dư ngân hàng (/banknhan <amount> <content>)
  bot.command('banknhan', async ctx => {
    const parts = (ctx.message as any).text.split(' ').filter(Boolean);
    const amount = Number(parts[1]) || 50000;
    const content = parts.slice(2).join(' ') || `NAP${ctx.from.id}`;
    const res = await handleIncomingBankTransfer(content, amount, `CMD_${Date.now()}`);
    await ctx.reply(`⚡ Kết quả nhận biến động ngân hàng: ${JSON.stringify(res)}`);
  });

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

  // Mở Ví (Image 2)
  bot.action('menu_wallet', async ctx => {
    await ctx.answerCbQuery().catch(() => {});
    await sendMlOderWallet(ctx);
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

  // Mở Lịch sử nạp
  bot.action('deposit_history', async ctx => {
    await ctx.answerCbQuery().catch(() => {});
    await sendDepositHistory(ctx);
  });

  // Mở Trò chơi
  bot.action('menu_games', async ctx => {
    await ctx.answerCbQuery().catch(() => {});
    await sendGamesMenu(ctx);
  });

  // Điểm danh nhận thưởng
  bot.action('daily_reward', async ctx => {
    await ctx.answerCbQuery('Điểm danh thành công!').catch(() => {});
    const telegramId = String(ctx.from.id);
    const bonus = 5000;
    const user = await prisma.user.upsert({
      where: { telegramId },
      update: { balance: { increment: bonus } },
      create: { telegramId, username: ctx.from.username, firstName: ctx.from.first_name, balance: bonus }
    });

    await ctx.reply(
      `🎉 <b>ĐIỂM DANH MAY MẮN THÀNH CÔNG!</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🎁 Bạn nhận được: <b>+${bonus.toLocaleString('vi-VN')}đ</b> vào ví!\n` +
      `💰 Số dư hiện tại: <b>${Number(user.balance).toLocaleString('vi-VN')}đ</b>`,
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🧮 Mua Hàng Ngay', callback_data: 'menu_buy', style: 'success' }],
            [{ text: '🏠 Menu Chính', callback_data: 'back_to_main', style: 'primary' }]
          ] as any
        }
      }
    );
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

  // Mở API
  bot.action('api_register', async ctx => {
    await ctx.answerCbQuery().catch(() => {});
    await sendApiRegister(ctx);
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

  // Khi bấm "✏️ Nhập số tiền muốn nạp"
  bot.action('enter_deposit_amount', async ctx => {
    await ctx.answerCbQuery().catch(() => {});
    await sendDepositMenu(ctx);
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

    const bankName = process.env.VIETQR_BANK_NAME || 'Vietcombank (VCB)';
    const bankAcc = process.env.VIETQR_ACCOUNT_NO || process.env.VIETQR_ACCOUNT_NUMBER || 'HAI100TR';
    const bankOwner = process.env.VIETQR_ACCOUNT_NAME || 'NGUYEN HOANG HAI';

    await ctx.reply(
      `✅ ĐÃ TIẾP NHẬN YÊU CẦU NẠP TIỀN!\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `💰 Số tiền nạp: ${amount.toLocaleString('vi-VN')}đ\n` +
      `🏷 Mã giao dịch: ${ref}\n` +
      `🏦 Ngân hàng nhận: ${bankName} (${bankAcc} - ${bankOwner})\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `Hệ thống đang đối soát với ngân hàng ${bankName}. Số dư sẽ được tự động cộng vào ví của bạn trong 1 - 3 phút!`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🩵 Xem Ví & Số Dư', callback_data: 'menu_wallet', style: 'success' }],
            [{ text: '🧮 Mua Sắm Ngay', callback_data: 'menu_buy', style: 'primary' }]
          ] as any
        }
      }
    );
  });

  // Khi bấm "🛒 MUA NGAY" trên Bot -> Mở bảng chọn phương thức thanh toán (Ví hoặc Chuyển khoản QR)
  bot.action(/^buy:(.+)$/, async ctx => {
    await ctx.answerCbQuery().catch(() => {});
    const prodId = ctx.match[1];
    await sendPaymentMethodChoice(ctx, prodId);
  });

  // Khi chọn "👛 Thanh toán bằng Số Dư Ví"
  bot.action(/^pay_wallet:(.+)$/, async ctx => {
    const prodId = ctx.match[1];
    const user = await prisma.user.findUnique({ where: { telegramId: String(ctx.from.id) } });
    const product = await prisma.product.findUnique({ where: { id: prodId } });
    if (!product) return ctx.answerCbQuery('❌ Sản phẩm không tồn tại.', { show_alert: true });

    const price = product.salePrice ?? product.price;
    const balance = user ? Number(user.balance) : 0;

    if (balance < price) {
      return ctx.answerCbQuery(
        `⚠️ SỐ DƯ VÍ KHÔNG ĐỦ!\n\n` +
        `• Số dư hiện tại: ${balance.toLocaleString('vi-VN')}đ\n` +
        `• Giá sản phẩm: ${price.toLocaleString('vi-VN')}đ\n` +
        `• Còn thiếu: ${(price - balance).toLocaleString('vi-VN')}đ\n\n` +
        `👉 Vui lòng chọn "📲 Chuyển khoản QR (VietQR VCB)" để quét mã thanh toán trực tiếp hoặc nạp thêm tiền!`,
        { show_alert: true }
      );
    }

    await ctx.answerCbQuery('Đang xuất kho và trừ tiền ví...').catch(() => {});
    const res = await processOrderDelivery(String(ctx.from.id), ctx.from.username, ctx.from.first_name, prodId);

    const actionBtns = [
      [{ text: '📋 Xem Lịch Sử Đơn Hàng', callback_data: 'view_orders', style: 'success' }],
      [{ text: '🧮 Tiếp Tục Mua Sắm', callback_data: 'menu_buy', style: 'primary' }]
    ];

    if (ctx.callbackQuery?.message && 'photo' in ctx.callbackQuery.message) {
      await ctx.deleteMessage().catch(() => {});
      return ctx.reply(res.message, { parse_mode: 'HTML', reply_markup: { inline_keyboard: actionBtns as any } });
    }

    await ctx.editMessageText(res.message, {
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: actionBtns as any }
    }).catch(async () => {
      await ctx.reply(res.message, { parse_mode: 'HTML', reply_markup: { inline_keyboard: actionBtns as any } });
    });
  });

  // Khi chọn "📲 Chuyển khoản QR (VietQR VCB)"
  bot.action(/^pay_qr:(.+)$/, async ctx => {
    await ctx.answerCbQuery().catch(() => {});
    const prodId = ctx.match[1];
    const product = await prisma.product.findUnique({
      where: { id: prodId },
      include: { category: true, stockItems: { where: { status: 'AVAILABLE' } } }
    });

    if (!product || product.stockItems.length === 0) {
      return ctx.answerCbQuery('⚠️ Sản phẩm này hiện đang tạm hết hàng trong kho!', { show_alert: true });
    }

    const user = await prisma.user.upsert({
      where: { telegramId: String(ctx.from.id) },
      update: { username: ctx.from.username, firstName: ctx.from.first_name },
      create: { telegramId: String(ctx.from.id), username: ctx.from.username, firstName: ctx.from.first_name, balance: 200000 }
    });

    const price = product.salePrice ?? product.price;
    const orderCode = `DH${Date.now().toString().slice(-6)}${crypto.randomInt(100, 999)}`;
    const order = await prisma.order.create({
      data: {
        code: orderCode,
        userId: user.id,
        total: price,
        status: 'PENDING',
        items: {
          create: { productId: product.id, quantity: 1, unitPrice: price }
        }
      }
    });

    await sendOrderVietQR(ctx, order, product);
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

  // Huỷ nạp tiền QR (Nút Huỷ duy nhất khi nạp tiền)
  bot.action('cancel_deposit', async ctx => {
    await ctx.answerCbQuery('Đã huỷ nạp tiền!').catch(() => {});
    await ctx.deleteMessage().catch(() => {});
    await sendMlOderWallet(ctx);
  });

  // Kiểm tra thanh toán đơn hàng chuyển khoản QR: check_order:orderId
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
      `⏳ Đơn hàng đang đợi ngân hàng ghi nhận số dư (thông thường 10s - 30s sau khi chuyển khoản).\n\n` +
      `⚡ Ngay khi nhận được tiền, bot sẽ tự động giao key ngay cho bạn!`,
      { show_alert: true }
    );
  });

  // Kiểm tra trạng thái nạp tiền: check_deposit:teleId:amount
  bot.action(/^check_deposit:(\d+):(\d+)$/, async ctx => {
    const teleId = ctx.match[1];
    const user = await prisma.user.findUnique({ where: { telegramId: teleId } });
    const balance = user ? Number(user.balance) : 0;
    await ctx.answerCbQuery(
      `👛 Số dư hiện tại của bạn: ${balance.toLocaleString('vi-VN')}đ\n\n` +
      `⚡ Hệ thống sẽ tự động duyệt và cộng tiền ngay khi nhận được biến động từ ngân hàng!`,
      { show_alert: true }
    );
  });

  // Nhận tin nhắn văn bản (Nhập số tiền nạp trực tiếp ở ô chat) & WebApp Data
  bot.on('message', async (ctx, next) => {
    const rawData = (ctx.message as any)?.web_app_data?.data;
    if (rawData) {
      try {
        const data = JSON.parse(rawData);
        if (data.action === 'BUY' && data.productId) {
          return sendPaymentMethodChoice(ctx, data.productId);
        }
      } catch (e) {
        console.error('Lỗi nhận dữ liệu web_app_data:', e);
      }
      return;
    }

    // Nhập số tiền trực tiếp vào ô chat để nạp (VD: 50000, 100000, 50k, 100k, 50.000, 50000đ...)
    const msgText = (ctx.message as any)?.text?.trim();
    if (msgText && !msgText.startsWith('/')) {
      let amount: number | null = null;
      const clean = msgText.replace(/\s+/g, '');

      if (/^\d+$/.test(clean)) {
        amount = Number(clean);
      } else if (/^(\d+)[kK]$/i.test(clean)) {
        amount = Number(clean.slice(0, -1)) * 1000;
      } else if (/^(\d{1,3}([.,]\d{3})+)([đdĐ])?$/i.test(clean)) {
        amount = Number(clean.replace(/[.,đdĐ]/gi, ''));
      } else if (/^(\d+)[đdĐ]$/i.test(clean)) {
        amount = Number(clean.slice(0, -1));
      } else if (/^(\d+)[kK][đdĐ]$/i.test(clean)) {
        amount = Number(clean.slice(0, -2)) * 1000;
      }

      if (amount !== null) {
        if (amount < 10000) {
          return ctx.reply(
            `⚠️ <b>SỐ TIỀN NẠP TỐI THIỂU LÀ 10.000đ!</b>\n` +
            `━━━━━━━━━━━━━━━━━━━━\n` +
            `Số tiền bạn nhập (<b>${amount.toLocaleString('vi-VN')}đ</b>) chưa đủ mức tối thiểu.\n` +
            `👉 <b>Hệ thống chỉ hỗ trợ nạp tối thiểu: 10.000đ</b>\n\n` +
            `Vui lòng nhập lại số tiền từ 10.000đ trở lên (Ví dụ: <code>50000</code> hoặc <code>50k</code>):`,
            {
              parse_mode: 'HTML',
              reply_markup: {
                force_reply: true,
                input_field_placeholder: 'Nhập số tiền >= 10.000đ (VD: 50000)...'
              }
            }
          );
        }

        if (amount <= 50000000) {
          return sendVietQR(ctx, amount);
        } else {
          return ctx.reply('⚠️ Số tiền nạp một lần tối đa là 50.000.000đ. Vui lòng nhập số tiền nhỏ hơn!');
        }
      }

      // Nếu đang trả lời tin nhắn prompt nạp tiền nhưng nhập không đúng số
      const replyPrompt = (ctx.message as any)?.reply_to_message?.text || '';
      if (replyPrompt.includes('số tiền muốn nạp') || replyPrompt.includes('số tiền bạn muốn nạp')) {
        return ctx.reply(
          `⚠️ <b>ĐỊNH DẠNG KHÔNG HỢP LỆ!</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `Vui lòng nhập số tiền bằng chữ số (Tối thiểu 10.000đ).\n` +
          `<i>Ví dụ: <code>50000</code>, <code>50k</code>, <code>100k</code>, <code>200000</code></i>`,
          {
            parse_mode: 'HTML',
            reply_markup: {
              force_reply: true,
              input_field_placeholder: 'Nhập số tiền >= 10.000đ (VD: 50000)...'
            }
          }
        );
      }
    }

    return next();
  });

  if ((process.env.BOT_MODE || 'polling') === 'polling') {
    bot.launch({ dropPendingUpdates: true }, () => {
      console.log('🤖 Telegram Bot đã khởi chạy polling thành công theo phong cách ML Oder (Shop Hai1110#)!');
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
