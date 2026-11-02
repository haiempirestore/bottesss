import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET || '';
export function verifyTelegramInitData(initData: string, botToken: string): Record<string, string> {
  if (!initData || !botToken) throw new Error('Missing Telegram initData or bot token');
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) throw new Error('Missing Telegram hash');
  params.delete('hash');
  const dataCheckString = [...params.entries()].sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`).join('\n');
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const calculated = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  const a = Buffer.from(calculated, 'hex'), b = Buffer.from(hash, 'hex');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) throw new Error('Invalid Telegram signature');
  const authDate = Number(params.get('auth_date') || 0);
  if (!authDate || Math.abs(Date.now()/1000 - authDate) > 86400) throw new Error('Expired Telegram initData');
  return Object.fromEntries(params.entries());
}
export function signUser(userId: string) {
  if (secret.length < 32) throw new Error('JWT_SECRET must be at least 32 characters');
  return jwt.sign({ sub: userId, role: 'user' }, secret, { expiresIn: '7d' });
}
export function userAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    const payload = jwt.verify(token, secret) as jwt.JwtPayload;
    (req as any).auth = { id: payload.sub, role: payload.role };
    next();
  } catch { res.status(401).json({ error: 'Unauthorized' }); }
}
export function adminAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    const payload = jwt.verify(token, secret) as jwt.JwtPayload;
    if (payload.role !== 'admin') throw new Error('Forbidden');
    (req as any).auth = { id: payload.sub, role: 'admin' };
    next();
  } catch { res.status(401).json({ error: 'Unauthorized' }); }
}
export function signAdmin(id: string) {
  if (secret.length < 32) throw new Error('JWT_SECRET must be at least 32 characters');
  return jwt.sign({ sub: id, role: 'admin' }, secret, { expiresIn: '8h' });
}
